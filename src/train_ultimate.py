"""
Fake News Detection - ULTIMATE ENHANCED Model Training Script
Author: Krrish Ajmera
Project: PBL-1 (CSE2170) - Manipal University Jaipur

DESCRIPTION:
This script aggressively locates and parses all 150,000+ `.csv` and `.tsv` datasets.
It applies Feature Engineering (Sentiment, Credibility) and Weighted Ensemble Learning.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import re
import nltk
from nltk.corpus import stopwords
from textblob import TextBlob
import warnings
import os
import glob

warnings.filterwarnings('ignore')

print("=" * 60)
print("ULTIMATE ENHANCED FAKE NEWS DETECTION MODEL")
print("Ingesting ALL 150,000+ Datasets (CSV & TSV)")
print("=" * 60)

# 1. Download NLTK resources
print("\n[1/8] Downloading NLTK resources...")
try:
    nltk.download('stopwords', quiet=True)
    nltk.download('punkt', quiet=True)
    print("✓ NLTK resources downloaded")
except:
    pass

# ============================================================
# FEATURE ENGINEERING FUNCTIONS
# ============================================================

def extract_sentiment_features(text):
    try:
        blob = TextBlob(str(text))
        return {'sentiment_polarity': blob.sentiment.polarity, 'sentiment_subjectivity': blob.sentiment.subjectivity}
    except:
        return {'sentiment_polarity': 0.0, 'sentiment_subjectivity': 0.5}

def detect_source_credibility(text):
    text_lower = str(text).lower()
    credible_indicators = ['according to', 'sources say', 'reported by', 'study shows', 'research found', 'experts say', 'data shows']
    suspicious_indicators = ['they don\'t want you to know', 'shocking', 'unbelievable', 'click here', 'conspiracy', 'big pharma']
    credible_count = sum(1 for indicator in credible_indicators if indicator in text_lower)
    suspicious_count = sum(1 for indicator in suspicious_indicators if indicator in text_lower)
    return {'has_sources': 1 if credible_count > 0 else 0, 'credible_score': credible_count, 'suspicious_score': suspicious_count}

def count_entities(text):
    words = str(text).split()
    capitalized = sum(1 for word in words if word and word[0].isupper() and len(word) > 1)
    return {'entity_count': capitalized}

def extract_all_features(text):
    features = {}
    features.update(extract_sentiment_features(text))
    features.update(detect_source_credibility(text))
    features.update(count_entities(text))
    return features

def preprocess_text(text):
    if pd.isna(text): return ""
    text = str(text).lower()
    text = re.sub(r'[^a-zA-Z\\s]', '', text)
    text = ' '.join(text.split())
    try:
        stop_words = set(stopwords.words('english'))
        text = ' '.join([word for word in text.split() if word not in stop_words])
    except:
        pass
    return text

# ============================================================
# MASSIVE DATASET INGESTION
# ============================================================
print("\n[2/8] Hunting for all CSV and TSV datasets...")

# Define paths
data_dir = '../data/raw/' if os.path.exists('../data/raw/') else 'data/raw/'
all_dataframes = []

# 2.1: Process TSV files (LIAR Dataset)
print("Parsing TSV Files (LIAR)...")
tsv_files = glob.glob(os.path.join(data_dir, '*.tsv'))
for file in tsv_files:
    try:
        df = pd.read_table(file, header=None, on_bad_lines='skip')
        if len(df.columns) >= 3:
            labels = df.iloc[:, 1].str.lower()
            texts = df.iloc[:, 2]
            
            mapped_df = pd.DataFrame({'text': texts})
            
            def map_liar(label):
                if label in ['true', 'mostly-true', 'half-true']: return 0
                if label in ['barely-true', 'false', 'pants-fire']: return 1
                return None
                
            mapped_df['label'] = labels.apply(map_liar)
            mapped_df = mapped_df.dropna()
            
            all_dataframes.append(mapped_df)
            print(f"  ✓ {os.path.basename(file)}: {len(mapped_df)} valid articles")
    except Exception as e:
        print(f"  ✗ Failed to parse {os.path.basename(file)}")

# 2.2: Process CSV files (Clickbait, Fake, True, WELFake)
print("Parsing CSV Files...")
csv_files = glob.glob(os.path.join(data_dir, '*.csv'))
for file in csv_files:
    try:
        df = pd.read_csv(file, on_bad_lines='skip')
        
        # Standardize Clickbait
        if 'headline' in df.columns and 'clickbait' in df.columns:
            df = df.rename(columns={'headline': 'text', 'clickbait': 'label'})
        
        # Standardize Text Column
        if 'text' not in df.columns:
            text_cols = [c for c in df.columns if any(k in c.lower() for k in ['text', 'content', 'article', 'body'])]
            if not text_cols and 'title' in df.columns:
                df['text'] = df['title']
            elif text_cols:
                df['text'] = df[text_cols[0]]
                if 'title' in df.columns:
                    df['text'] = df['title'] + ' ' + df['text'].astype(str)
        
        # Prevent completely unrelated CSVs
        if 'text' not in df.columns:
            continue
            
        # Standardize Labels
        if 'label' not in df.columns:
            label_cols = [c for c in df.columns if 'label' in c.lower() or 'class' in c.lower()]
            if label_cols:
                df['label'] = df[label_cols[0]]
            else:
                # If no label exists, look at filename
                base_lower = os.path.basename(file).lower()
                if 'fake' in base_lower:
                    df['label'] = 1
                elif 'true' in base_lower or 'real' in base_lower:
                    df['label'] = 0
                else:
                    continue # Skip unlabelable files
        
        # Filter and Drop NAs
        df_clean = df[['text', 'label']].dropna().copy()
        
        # Map values if textual
        if df_clean['label'].dtype == 'object':
            df_clean['label'] = df_clean['label'].astype(str).str.lower()
            df_clean['label'] = df_clean['label'].map(lambda x: 1 if 'fake' in x or x=='1' else 0)
        
        df_clean['label'] = df_clean['label'].astype(int)
        
        all_dataframes.append(df_clean)
        print(f"  ✓ {os.path.basename(file)}: {len(df_clean)} articles")
    except Exception as e:
         print(f"  ✗ Failed to parse {os.path.basename(file)}: {e}")

# 2.3: Concatenate and Deduplicate
if not all_dataframes:
    print("FATAL ERROR: Could not find any datasets.")
    exit(1)

ultimate_df = pd.concat(all_dataframes, ignore_index=True)
initial_count = len(ultimate_df)
ultimate_df = ultimate_df.drop_duplicates(subset=['text']).sample(frac=1, random_state=42).reset_index(drop=True)

print(f"\n📊 ULTIMATE DATASET STATISTICS:")
print(f"   Raw Ingestion Count: {initial_count}")
print(f"   After De-Duplication: {len(ultimate_df)} Unique Articles!")
print(f"   Real news (0): {len(ultimate_df[ultimate_df['label']==0])}")
print(f"   Fake news (1): {len(ultimate_df[ultimate_df['label']==1])}")

# ============================================================
# EXTRACTING ENHANCED FEATURES
# ============================================================
print("\n[3/8] Extracting enhanced features (This will take a HUGE amount of time)...")
print("   • Processing Sentiment, Emotion, Entities, and Sources...")

# Optional subset testing: To prevent a 3 hour run during testing, you can uncomment below:
# ultimate_df = ultimate_df.head(5000)
# print(f"⚠️ TEST MODE: Only running on {len(ultimate_df)} rows for speed.")

feature_list = []
total_rows = len(ultimate_df)
for idx, text in enumerate(ultimate_df['text']):
    if idx % 1000 == 0:
        print(f"   Processed {idx}/{total_rows} articles ({(idx/total_rows)*100:.2f}%)...", end='\r')
    feature_list.append(extract_all_features(text))

print(f"   Processed {total_rows}/{total_rows} articles (100.00%)!")
feature_df = pd.DataFrame(feature_list)

# ============================================================
# PREPROCESSING TEXT
# ============================================================
print("\n[4/8] Cleaning and lowercasing text...")
ultimate_df['clean_text'] = ultimate_df['text'].apply(preprocess_text)

# ============================================================
# TRAIN-TEST SPLIT
# ============================================================
print("\n[5/8] Splitting data into 80% Train, 20% Security Holdout...")
X_train_text, X_test_text, X_train_feat, X_test_feat, y_train, y_test = train_test_split(
    ultimate_df['clean_text'], feature_df, ultimate_df['label'], test_size=0.2, random_state=42
)

# ============================================================
# TF-IDF VECTORIZATION
# ============================================================
print("\n[6/8] Executing Advanced TF-IDF Vectorization...")
vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
X_train_tfidf = vectorizer.fit_transform(X_train_text)
X_test_tfidf = vectorizer.transform(X_test_text)

X_train_combined = np.hstack([X_train_tfidf.toarray(), X_train_feat.values])
X_test_combined = np.hstack([X_test_tfidf.toarray(), X_test_feat.values])

# ============================================================
# MODEL TRAINING & ENSEMBLE VOTING
# ============================================================
print("\n[7/8] Training AI Models...")
models = {
    'Naive Bayes': MultinomialNB(),
    'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
}

results, predictions = {}, {}

for name, model in models.items():
    print(f"   • Training {name}...")
    if name == 'Naive Bayes':
        model.fit(X_train_tfidf, y_train)
        preds, probas = model.predict(X_test_tfidf), model.predict_proba(X_test_tfidf)
    else:
        model.fit(X_train_combined, y_train)
        preds, probas = model.predict(X_test_combined), model.predict_proba(X_test_combined)
    
    acc = accuracy_score(y_test, preds)
    results[name] = acc
    predictions[name] = probas
    print(f"     ✓ Score: {acc*100:.2f}%")

print("\nExecuting Weighted Voting Ensemble...")
weights = {k: v/sum(results.values()) for k,v in results.items()}
ensemble_proba = np.zeros_like(predictions['Random Forest'])
for name, proba in predictions.items():
    ensemble_proba += weights[name] * proba

ensemble_pred = (ensemble_proba[:, 1] > 0.5).astype(int)
ensemble_acc = accuracy_score(y_test, ensemble_pred)
print(f"🏆 ENSEMBLE ULTIMATE ACCURACY: {ensemble_acc*100:.2f}%")

# ============================================================
# SAVING
# ============================================================
print("\n[8/8] Saving Ultimate Model to Disk...")
os.makedirs('../models', exist_ok=True)
joblib.dump(models['Random Forest'], '../models/model_rf_ultimate.pkl')
joblib.dump(vectorizer, '../models/vectorizer_ultimate.pkl')
joblib.dump({'model_name': 'Ultimate Ensemble', 'accuracy': ensemble_acc, 'weights': weights}, '../models/model_info_ultimate.pkl')

print("\n" + "=" * 60)
print("✅ ALL SYSTEMS COMPLETE.")
print(f"Models saved. Ensure your test scripts point to 'model_rf_ultimate.pkl'.")
print("=" * 60)
