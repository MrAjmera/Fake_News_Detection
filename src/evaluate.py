"""
Fake News Detection - V2 Evaluation Script
Author: Krrish Ajmera
Project: PBL-1 (CSE2170) - Manipal University Jaipur

DESCRIPTION:
Re-creates the exact data pipeline and 80/20 stratified split used in train_v2.py
(same datasets, same de-duplication, same random_state=42), then scores the SAVED
V2 model (models_v2/model_lr_v2.pkl + vectorizer_v2.pkl) on the held-out test set.

Nothing is retrained. Because the split is deterministic, the test articles are the
same ones the model never saw during training. The script reports:
  - accuracy, per-class precision / recall / F1, ROC-AUC
  - confusion matrix (rows = actual, columns = predicted; order REAL, FAKE)
  - accuracy per data source (a rough look at how consistent the model is across sources)

USAGE (from the project root):
  python src/evaluate.py                 # print + write docs/evaluation_results.json
  python src/evaluate.py --write-ui      # also write frontend/src/data/metrics.json
                                         # (sets is_sample=false)
"""

import argparse
import glob
import json
import os
import warnings

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    precision_recall_fscore_support,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

warnings.filterwarnings("ignore")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data", "raw")
MODEL_PATH = os.path.join(ROOT, "models_v2", "model_lr_v2.pkl")
VECTORIZER_PATH = os.path.join(ROOT, "models_v2", "vectorizer_v2.pkl")
RESULTS_PATH = os.path.join(ROOT, "docs", "evaluation_results.json")
UI_METRICS_PATH = os.path.join(ROOT, "frontend", "src", "data", "metrics.json")


def load_data():
    """Mirror of the ingestion in train_v2.py, plus a 'source' column for reporting."""
    frames = []

    def add(df, source):
        df = df[["text", "label"]].copy()
        df["source"] = source
        frames.append(df)
        print(f"  loaded {source}: {len(df)}")

    # 1. ISOT
    df = pd.read_csv(os.path.join(DATA_DIR, "Fake.csv"))
    df["label"] = 1
    df["text"] = df["title"].astype(str) + " " + df["text"].astype(str)
    add(df, "ISOT-Fake")

    df = pd.read_csv(os.path.join(DATA_DIR, "True.csv"))
    df["label"] = 0
    df["text"] = df["title"].astype(str) + " " + df["text"].astype(str)
    add(df, "ISOT-True")

    # 2. WELFake (1 = fake, 0 = true)
    df = pd.read_csv(os.path.join(DATA_DIR, "WELFake_Dataset.csv"))
    df["text"] = df["title"].astype(str) + " " + df["text"].astype(str)
    add(df, "WELFake")

    # 3. fake_3 (all fake)
    df = pd.read_csv(os.path.join(DATA_DIR, "fake_3.csv"))
    text_col = "text" if "text" in df.columns else "title"
    df["text"] = df[text_col].astype(str)
    df["label"] = 1
    add(df, "fake_3")

    # 4. CoAID
    coaid_dir = os.path.join(DATA_DIR, "CoAID-master", "05-01-2020")
    for path in glob.glob(os.path.join(coaid_dir, "*.csv")):
        lower = path.lower()
        if "tweets" in lower or "replies" in lower:
            continue
        df = pd.read_csv(path)
        if "title" not in df.columns:
            continue
        text = df["title"].astype(str)
        if "content" in df.columns:
            text += " " + df["content"].fillna("").astype(str)
        out = pd.DataFrame({"text": text})
        out["label"] = 1 if "fake" in os.path.basename(path).lower() else 0
        add(out, "CoAID")

    combined = pd.concat(frames, ignore_index=True)
    raw_count = len(combined)
    combined = (
        combined.dropna(subset=["text"])
        .drop_duplicates(subset=["text"])
        .reset_index(drop=True)
    )
    combined = combined.sample(frac=1, random_state=42).reset_index(drop=True)
    print(f"\n  raw rows: {raw_count}   unique rows after de-duplication: {len(combined)}")
    return combined


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-ui", action="store_true",
                        help="also overwrite frontend/src/data/metrics.json with these results")
    args = parser.parse_args()

    print("[1/3] Rebuilding the dataset exactly as train_v2.py does...")
    df = load_data()

    print("\n[2/3] Re-creating the 80/20 stratified split (random_state=42)...")
    X = df["text"].str.lower()
    y = df["label"]
    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    sources = df.loc[X_test.index, "source"]
    print(f"  test articles: {len(X_test)}")

    print("\n[3/3] Scoring the saved V2 Logistic Regression model...")
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    X_test_tfidf = vectorizer.transform(X_test)
    proba = model.predict_proba(X_test_tfidf)[:, 1]
    pred = (proba > 0.5).astype(int)

    acc = accuracy_score(y_test, pred)
    prec, rec, f1, support = precision_recall_fscore_support(y_test, pred, labels=[0, 1])
    auc = roc_auc_score(y_test, proba)
    cm = confusion_matrix(y_test, pred, labels=[0, 1])

    per_source = {}
    for name in sorted(sources.unique()):
        mask = (sources == name).to_numpy()
        per_source[name] = {
            "n": int(mask.sum()),
            "accuracy": float(accuracy_score(y_test[mask], pred[mask])),
        }

    results = {
        "model": "Logistic Regression (V2)",
        "test_size": int(len(y_test)),
        "accuracy": float(acc),
        "roc_auc": float(auc),
        "labels": ["REAL", "FAKE"],
        "precision": [float(v) for v in prec],
        "recall": [float(v) for v in rec],
        "f1": [float(v) for v in f1],
        "support": [int(v) for v in support],
        "confusion_matrix": cm.tolist(),
        "per_source_accuracy": per_source,
    }

    print("\n" + "=" * 54)
    print(f"Accuracy : {acc * 100:.2f}%     ROC-AUC: {auc:.4f}")
    for i, label in enumerate(["REAL", "FAKE"]):
        print(f"{label:<5}  precision {prec[i]:.4f}  recall {rec[i]:.4f}  "
              f"F1 {f1[i]:.4f}  support {support[i]}")
    print("Confusion matrix (rows = actual, cols = predicted; REAL, FAKE):")
    print(cm)
    print("Accuracy per source:")
    for name, v in per_source.items():
        print(f"  {name:<10} n={v['n']:<6} accuracy {v['accuracy'] * 100:.2f}%")
    print("=" * 54)

    os.makedirs(os.path.dirname(RESULTS_PATH), exist_ok=True)
    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nWrote {os.path.relpath(RESULTS_PATH, ROOT)}")

    if args.write_ui:
        ui = {
            "is_sample": False,
            "model": results["model"],
            "labels": results["labels"],
            "confusion_matrix": results["confusion_matrix"],
        }
        with open(UI_METRICS_PATH, "w", encoding="utf-8") as f:
            json.dump(ui, f, indent=2)
        print(f"Wrote {os.path.relpath(UI_METRICS_PATH, ROOT)} (is_sample = false)")


if __name__ == "__main__":
    main()
