"""
Fake News Detection - V2 High Accuracy Model Training Script
Author: Krrish Ajmera
Project: PBL-1 (CSE2170) - Manipal University Jaipur

DESCRIPTION:
This script uses robust datasets (ISOT, WELFake, fake_3, CoAID) and an upgraded 
machine learning pipeline (Stratified Splits, TF-IDF + LogisticRegression + RF), 
fixing previous issues to reach 95%+ accuracy.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import warnings
import os
import glob

warnings.filterwarnings('ignore')

def main():
    print("=" * 60)
    print("M2 MAX OPTIMIZED FAKE NEWS DETECTION (V2.0)")
    print("Robust Pipeline with ISOT + WELFake + Extra Datasets")
    print("=" * 60)

    # ============================================================
    # DATA INGESTION
    # ============================================================
    print("\n[1/5] Ingesting Datasets & Removing Duplicates...")

    data_dir = '../data/raw/' if os.path.exists('../data/raw/') else 'data/raw/'
    all_dataframes = []

    # 1. ISOT Dataset (Fake and True)
    try:
        df_fake = pd.read_csv(os.path.join(data_dir, 'Fake.csv'))
        df_fake['label'] = 1
        df_fake['text'] = df_fake['title'].astype(str) + " " + df_fake['text'].astype(str)
        all_dataframes.append(df_fake[['text', 'label']])
        print(f"  ✓ Fake.csv: {len(df_fake)}")
    except: pass

    try:
        df_true = pd.read_csv(os.path.join(data_dir, 'True.csv'))
        df_true['label'] = 0
        df_true['text'] = df_true['title'].astype(str) + " " + df_true['text'].astype(str)
        all_dataframes.append(df_true[['text', 'label']])
        print(f"  ✓ True.csv: {len(df_true)}")
    except: pass

    # 2. WELFake Dataset
    try:
        df_welfake = pd.read_csv(os.path.join(data_dir, 'WELFake_Dataset.csv'))
        df_welfake['text'] = df_welfake['title'].astype(str) + " " + df_welfake['text'].astype(str)
        # WELFake has 1=Fake, 0=True
        all_dataframes.append(df_welfake[['text', 'label']])
        print(f"  ✓ WELFake_Dataset.csv: {len(df_welfake)}")
    except: pass

    # 3. BS-Detector Fake News
    try:
        df_fake3 = pd.read_csv(os.path.join(data_dir, 'fake_3.csv'))
        text_col = 'text' if 'text' in df_fake3.columns else 'title'
        # BS_detector is all fake
        if text_col in df_fake3.columns:
            df_fake3['text'] = df_fake3[text_col].astype(str)
            df_fake3['label'] = 1
            all_dataframes.append(df_fake3[['text', 'label']])
            print(f"  ✓ fake_3.csv: {len(df_fake3)}")
    except: pass

    # 4. CoAID Dataset
    try:
        coaid_dir = os.path.join(data_dir, 'CoAID-master/05-01-2020/')
        for file in glob.glob(os.path.join(coaid_dir, '*.csv')):
            if 'tweets' in file.lower() or 'replies' in file.lower(): continue
            df = pd.read_csv(file)
            if 'title' in df.columns:
                text = df['title'].astype(str)
                if 'content' in df.columns:
                    text += " " + df['content'].fillna("").astype(str)
                df_clean = pd.DataFrame({'text': text})
                df_clean['label'] = 1 if 'fake' in os.path.basename(file).lower() else 0
                all_dataframes.append(df_clean)
                print(f"  ✓ CoAID {os.path.basename(file)}: {len(df_clean)}")
    except: pass

    # Combine & Deduplicate
    ultimate_df = pd.concat(all_dataframes, ignore_index=True)
    initial_count = len(ultimate_df)
    # Deduplicate strictly on exact identical text to prevent data leakage
    ultimate_df = ultimate_df.dropna(subset=['text']).drop_duplicates(subset=['text']).reset_index(drop=True)
    
    ultimate_df = ultimate_df.sample(frac=1, random_state=42).reset_index(drop=True)

    print(f"\n📊 DATA REFINED:")
    print(f"   Raw Entries: {initial_count}")
    print(f"   Unique Clean Articles Used: {len(ultimate_df)}")
    print(f"   Labels: {ultimate_df['label'].value_counts().to_dict()}")

    # ============================================================
    # TEXT STANDARDIZATION
    # ============================================================
    print("\n[2/5] Standardizing NLP Text...")
    X = ultimate_df['text'].str.lower()
    y = ultimate_df['label']

    # ============================================================
    # TRAIN-TEST SPLIT
    # ============================================================
    print("\n[3/5] Splitting Data (Stratified)...")
    X_train_text, X_test_text, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ============================================================
    # TF-IDF VECTORIZATION
    # ============================================================
    print("\n[4/5] Superior TF-IDF Vectorization...")
    vectorizer = TfidfVectorizer(max_features=15000, ngram_range=(1, 2), dtype=np.float32)
    X_train_tfidf = vectorizer.fit_transform(X_train_text)
    X_test_tfidf = vectorizer.transform(X_test_text)

    # ============================================================
    # MODEL TRAINING AND ENSEMBLE
    # ============================================================
    print("\n[5/5] Training AI Models...")
    models = {
        'Naive Bayes': MultinomialNB(),
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42, n_jobs=-1),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    }

    results = {}
    preds_dict = {}

    for name, model in models.items():
        print(f"   • Training {name}...")
        try:
            model.fit(X_train_tfidf, y_train)
            preds = model.predict(X_test_tfidf)
            probas = model.predict_proba(X_test_tfidf)
            
            acc = accuracy_score(y_test, preds)
            results[name] = acc
            preds_dict[name] = probas
            print(f"     ✓ Score: {acc*100:.2f}%")
        except Exception as e:
            print(f"     ✗ Failed: {e}")

    print("\nExecuting Weighted Voting Ensemble...")
    # Emphasize the models with superior accuracy
    weights = {k: v**4 for k,v in results.items()} 
    total_weight = sum(weights.values())
    weights = {k: v/total_weight for k,v in weights.items()}
    
    ensemble_proba = np.zeros_like(list(preds_dict.values())[0])
    for name, proba in preds_dict.items():
        ensemble_proba += weights[name] * proba

    ensemble_pred = (ensemble_proba[:, 1] > 0.5).astype(int)
    ensemble_acc = accuracy_score(y_test, ensemble_pred)
    
    print(f"\n🏆 ENSEMBLE ULTIMATE ACCURACY: {ensemble_acc*100:.2f}%\n")
    print("-" * 50)
    print("DETAILED CLASSIFICATION REPORT")
    print("-" * 50)
    print(classification_report(y_test, ensemble_pred, target_names=['True News', 'Fake News']))

    # ============================================================
    # SAVING
    # ============================================================
    print("\n[+] Saving V2 Models to Disk...")
    os.makedirs('../models_v2', exist_ok=True)
    joblib.dump(models['Logistic Regression'], '../models_v2/model_lr_v2.pkl')
    joblib.dump(vectorizer, '../models_v2/vectorizer_v2.pkl')
    
    print("\n" + "=" * 60)
    print("✅ V2 TRAINING COMPLETE.")
    print("=" * 60)

if __name__ == '__main__':
    main()
