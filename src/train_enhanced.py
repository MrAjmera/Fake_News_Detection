"""
Fake News Detection - ENHANCED Model Training Script with Feature Engineering & Ensemble
Author: Krrish Ajmera
Project: PBL-1 (CSE2170) - Manipal University Jaipur

ENHANCEMENTS:
1. Feature Engineering: Sentiment analysis, source detection, entity counting
2. Ensemble Methods: Weighted voting from multiple models
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
warnings.filterwarnings('ignore')

print("=" * 60)
print("ENHANCED FAKE NEWS DETECTION - MODEL TRAINING")
print("Feature Engineering + Ensemble Methods")
print("=" * 60)

# Download required NLTK data
print("\n[1/8] Downloading NLTK resources...")
try:
    nltk.download('stopwords', quiet=True)
    nltk.download('punkt', quiet=True)
    print("✓ NLTK resources downloaded")
except:
    print("⚠ Warning: NLTK download failed, continuing anyway...")

# ============================================================
# FEATURE ENGINEERING FUNCTIONS
# ============================================================

def extract_sentiment_features(text):
    """Extract sentiment polarity and subjectivity"""
    try:
        blob = TextBlob(str(text))
        return {
            'sentiment_polarity': blob.sentiment.polarity,  # -1 to 1
            'sentiment_subjectivity': blob.sentiment.subjectivity  # 0 to 1
        }
    except:
        return {'sentiment_polarity': 0.0, 'sentiment_subjectivity': 0.5}

def detect_source_credibility(text):
    """Detect if article mentions credible sources"""
    text_lower = str(text).lower()
    
    # Credible source indicators
    credible_indicators = [
        'according to', 'sources say', 'reported by', 'study shows',
        'research found', 'experts say', 'officials said', 'data shows',
        'published in', 'peer-reviewed', 'university', 'institute'
    ]
    
    # Suspicious indicators
    suspicious_indicators = [
        'they don\'t want you to know', 'shocking', 'unbelievable',
        'click here', 'you won\'t believe', 'secret', 'conspiracy',
        'big pharma', 'mainstream media hiding', 'doctors hate'
    ]
    
    credible_count = sum(1 for indicator in credible_indicators if indicator in text_lower)
    suspicious_count = sum(1 for indicator in suspicious_indicators if indicator in text_lower)
    
    return {
        'has_sources': 1 if credible_count > 0 else 0,
        'credible_score': credible_count,
        'suspicious_score': suspicious_count
    }

def count_entities(text):
    """Count capitalized words (rough proxy for named entities)"""
    words = str(text).split()
    capitalized = sum(1 for word in words if word and word[0].isupper() and len(word) > 1)
    return {'entity_count': capitalized}

def extract_all_features(text):
    """Combine all feature extraction"""
    features = {}
    features.update(extract_sentiment_features(text))
    features.update(detect_source_credibility(text))
    features.update(count_entities(text))
    return features

# ============================================================
# PREPROCESSING FUNCTION
# ============================================================

def preprocess_text(text):
    """
    Preprocesses text data:
    - Converts to lowercase
    - Removes special characters and numbers
    - Removes stopwords
    - Returns cleaned text
    """
    if pd.isna(text):
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove special characters and numbers
    text = re.sub(r'[^a-zA-Z\\s]', '', text)
    
    # Remove extra whitespace
    text = ' '.join(text.split())
    
    # Remove stopwords
    try:
        stop_words = set(stopwords.words('english'))
        words = [word for word in text.split() if word not in stop_words]
        text = ' '.join(words)
    except:
        pass  # If stopwords not available, skip this step
    
    return text

# ============================================================
# DATASET LOADING
# ============================================================

print("\n[2/8] Loading dataset...")

def load_and_standardize_dataset(filename):
    """Load a dataset and standardize column names"""
    try:
        # Try datasets folder first, then root folder
        if os.path.exists(os.path.join('datasets', filename)):
            df = pd.read_csv(os.path.join('datasets', filename))
        elif os.path.exists(filename):
            df = pd.read_csv(filename)
        else:
            return None
        
        # Standardize 'text' column
        if 'text' not in df.columns:
            text_cols = [col for col in df.columns if 'text' in col.lower() or 'content' in col.lower() or 'article' in col.lower() or 'body' in col.lower()]
            if text_cols:
                df['text'] = df[text_cols[0]]
            else:
                return None
        
        # Standardize 'label' column
        if 'label' not in df.columns:
            label_cols = [col for col in df.columns if 'label' in col.lower() or 'class' in col.lower()]
            if label_cols:
                df['label'] = df[label_cols[0]]
            else:
                return None
        
        # Keep only text and label columns
        df = df[['text', 'label']].copy()
        
        # Handle missing values
        df = df.dropna(subset=['text', 'label'])
        
        # Ensure labels are 0 and 1
        unique_labels = df['label'].unique()
        if len(unique_labels) == 2:
            if set(unique_labels) != {0, 1}:
                label_map = {unique_labels[0]: 0, unique_labels[1]: 1}
                df['label'] = df['label'].map(label_map)
        
        return df
    except:
        return None

# Try to load datasets
datasets_to_try = [
    ('WELFake_Dataset.csv', '2018-2020'),
    ('fake_3.csv', '2023-2025'),
    ('train_2025.csv', '2024-2025'),
    ('train_2017.csv', '2016-2017'),
    ('train.csv', 'Unknown year')
]

loaded_datasets = []

print("Scanning for datasets...")
for filename, year_range in datasets_to_try:
    df_temp = load_and_standardize_dataset(filename)
    if df_temp is not None:
        loaded_datasets.append((filename, year_range, df_temp))
        print(f"✓ Loaded {filename}: {len(df_temp)} articles ({year_range})")

# Also try to load Fake.csv and True.csv
if not any('Fake' in name for name, _, _ in loaded_datasets):
    try:
        print("\nTrying to load Fake.csv and True.csv...")
        fake_path = 'datasets/Fake.csv' if os.path.exists('datasets/Fake.csv') else 'Fake.csv'
        true_path = 'datasets/True.csv' if os.path.exists('datasets/True.csv') else 'True.csv'
        
        fake_df = pd.read_csv(fake_path)
        true_df = pd.read_csv(true_path)
        
        # Add labels
        fake_df['label'] = 1
        true_df['label'] = 0
        
        # Standardize column names
        for df in [fake_df, true_df]:
            if 'text' not in df.columns:
                if 'title' in df.columns:
                    if 'text' in df.columns:
                        df['text'] = df['title'] + ' ' + df['text'].fillna('')
                    else:
                        df['text'] = df['title']
        
        # Keep only text and label
        fake_clean = fake_df[['text', 'label']].copy() if 'text' in fake_df.columns else None
        true_clean = true_df[['text', 'label']].copy() if 'text' in true_df.columns else None
        
        if fake_clean is not None and true_clean is not None:
            combined_df = pd.concat([fake_clean, true_clean], ignore_index=True)
            combined_df = combined_df.dropna(subset=['text', 'label'])
            loaded_datasets.append(('Fake.csv + True.csv', '2016-2018', combined_df))
            print(f"✓ Combined Fake.csv and True.csv: {len(combined_df)} articles")
    except Exception as e:
        print(f"⚠ Could not load Fake/True.csv: {e}")

if not loaded_datasets:
    print("✗ Error: No dataset files found!")
    print("Please ensure dataset files are in the current directory or datasets/ folder")
    exit()

# Use first dataset or combine if multiple
if len(loaded_datasets) == 1:
    df = loaded_datasets[0][2]
    print(f"\n✓ Using single dataset: {len(df)} articles")
else:
    print(f"\n✓ Combining {len(loaded_datasets)} datasets...")
    df = pd.concat([dataset[2] for dataset in loaded_datasets], ignore_index=True)
    print(f"✓ Combined dataset: {len(df)} articles")

# Dataset statistics
print("\n📊 Dataset Statistics:")
print(f"   Total articles: {len(df)}")
print(f"   Real news: {len(df[df['label']==0])} ({len(df[df['label']==0])/len(df)*100:.1f}%)")
print(f"   Fake news: {len(df[df['label']==1])} ({len(df[df['label']==1])/len(df)*100:.1f}%)")

# ============================================================
# FEATURE EXTRACTION
# ============================================================

print("\n[3/8] Extracting enhanced features...")
print("   • Sentiment analysis")
print("   • Source credibility detection")
print("   • Entity counting")

# Extract additional features for each article
feature_list = []
for idx, text in enumerate(df['text']):
    if idx % 10000 == 0:
        print(f"   Processed {idx}/{len(df)} articles...", end='\r')
    feature_list.append(extract_all_features(text))

feature_df = pd.DataFrame(feature_list)
print(f"   ✓ Extracted {len(feature_df.columns)} additional features")

# ============================================================
# TEXT PREPROCESSING
# ============================================================

print("\n[4/8] Preprocessing text data...")
df['clean_text'] = df['text'].apply(preprocess_text)
print("✓ Text preprocessing complete")

# ============================================================
# TRAIN-TEST SPLIT
# ============================================================

print("\n[5/8] Preparing training data...")
X_text = df['clean_text']
X_features = feature_df
y = df['label']

X_train_text, X_test_text, X_train_feat, X_test_feat, y_train, y_test = train_test_split(
    X_text, X_features, y, test_size=0.2, random_state=42
)

print(f"✓ Training set: {len(X_train_text)} samples")
print(f"✓ Test set: {len(X_test_text)} samples")

# ============================================================
# TF-IDF VECTORIZATION
# ============================================================

print("\n[6/8] Extracting TF-IDF features...")
vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
X_train_tfidf = vectorizer.fit_transform(X_train_text)
X_test_tfidf = vectorizer.transform(X_test_text)

# Combine TF-IDF with additional features
X_train_combined = np.hstack([X_train_tfidf.toarray(), X_train_feat.values])
X_test_combined = np.hstack([X_test_tfidf.toarray(), X_test_feat.values])

print(f"✓ TF-IDF features: {X_train_tfidf.shape[1]}")
print(f"✓ Additional features: {X_train_feat.shape[1]}")
print(f"✓ Combined feature matrix: {X_train_combined.shape}")

# ============================================================
# MODEL TRAINING
# ============================================================

print("\n[7/8] Training machine learning models...")
print("-" * 60)

models = {
    'Naive Bayes': MultinomialNB(),
    'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
}

results = {}
predictions = {}

for name, model in models.items():
    print(f"Training {name}...")
    
    # For Naive Bayes, we need non-negative features
    if name == 'Naive Bayes':
        # Use only TF-IDF (already non-negative)
        model.fit(X_train_tfidf, y_train)
        y_pred = model.predict(X_test_tfidf)
        y_pred_proba = model.predict_proba(X_test_tfidf)
    else:
        # Use combined features
        model.fit(X_train_combined, y_train)
        y_pred = model.predict(X_test_combined)
        y_pred_proba = model.predict_proba(X_test_combined)
    
    accuracy = accuracy_score(y_test, y_pred)
    results[name] = accuracy
    predictions[name] = y_pred_proba
    
    print(f"✓ {name} Accuracy: {accuracy*100:.2f}%")

# ============================================================
# ENSEMBLE METHOD: WEIGHTED VOTING
# ============================================================

print("\n" + "=" * 60)
print("ENSEMBLE METHOD: Weighted Voting")
print("=" * 60)

# Weights based on individual model performance
weights = {
    'Naive Bayes': results['Naive Bayes'],
    'Logistic Regression': results['Logistic Regression'],
    'Random Forest': results['Random Forest']
}

# Normalize weights
total_weight = sum(weights.values())
weights = {k: v/total_weight for k, v in weights.items()}

print("\nModel Weights:")
for name, weight in weights.items():
    print(f"  • {name}: {weight:.3f}")

# Combine predictions using weighted average
ensemble_proba = np.zeros_like(predictions['Random Forest'])
for name, proba in predictions.items():
    ensemble_proba += weights[name] * proba

ensemble_pred = (ensemble_proba[:, 1] > 0.5).astype(int)
ensemble_accuracy = accuracy_score(y_test, ensemble_pred)

print(f"\n🏆 ENSEMBLE ACCURACY: {ensemble_accuracy*100:.2f}%")

# ============================================================
# SELECT BEST MODEL
# ============================================================

all_results = {**results, 'Ensemble': ensemble_accuracy}
best_model_name = max(all_results, key=all_results.get)
best_accuracy = all_results[best_model_name]

print("\n" + "=" * 60)
print(f"BEST MODEL: {best_model_name} ({best_accuracy*100:.2f}% accuracy)")
print("=" * 60)

# ============================================================
# DETAILED EVALUATION
# ============================================================

print(f"\n[8/8] Detailed evaluation of {best_model_name}...")

if best_model_name == 'Ensemble':
    final_pred = ensemble_pred
else:
    if best_model_name == 'Naive Bayes':
        final_pred = models[best_model_name].predict(X_test_tfidf)
    else:
        final_pred = models[best_model_name].predict(X_test_combined)

print("\nClassification Report:")
print("-" * 60)
print(classification_report(y_test, final_pred, target_names=['Real', 'Fake']))

print("\nConfusion Matrix:")
print("-" * 60)
cm = confusion_matrix(y_test, final_pred)
print(f"                Predicted Real    Predicted Fake")
print(f"Actual Real     {cm[0][0]:<18}{cm[0][1]}")
print(f"Actual Fake     {cm[1][0]:<18}{cm[1][1]}")

# ============================================================
# SAVE MODELS
# ============================================================

print("\n" + "=" * 60)
print("SAVING MODELS...")
print("=" * 60)

# Save all models and ensemble
joblib.dump(models['Naive Bayes'], 'model_nb.pkl')
joblib.dump(models['Logistic Regression'], 'model_lr.pkl')
joblib.dump(models['Random Forest'], 'model_rf.pkl')
joblib.dump(vectorizer, 'vectorizer.pkl')
joblib.dump(weights, 'ensemble_weights.pkl')

# Save best model as default
if best_model_name == 'Ensemble':
    # Save ensemble info
    model_info = {
        'model_name': 'Ensemble (Weighted Voting)',
        'accuracy': best_accuracy,
        'weights': weights,
        'use_ensemble': True
    }
    joblib.dump(model_info, 'model_info.pkl')
    print("✓ Ensemble configuration saved")
else:
    joblib.dump(models[best_model_name], 'model.pkl')
    model_info = {
        'model_name': best_model_name,
        'accuracy': best_accuracy,
        'use_ensemble': False
    }
    joblib.dump(model_info, 'model_info.pkl')
    print(f"✓ {best_model_name} saved as 'model.pkl'")

print("✓ Vectorizer saved as 'vectorizer.pkl'")
print("✓ Model info saved as 'model_info.pkl'")

# ============================================================
# SUMMARY
# ============================================================

print("\n" + "=" * 60)
print("TRAINING COMPLETE!")
print("=" * 60)

print(f"\nYour {best_model_name} model achieved {best_accuracy*100:.2f}% accuracy")
print("\nEnhancements Applied:")
print("  ✓ Feature Engineering (sentiment, sources, entities)")
print("  ✓ Ensemble Methods (weighted voting)")
print("\nYou can now run 'python test_model.py' to test it!")
