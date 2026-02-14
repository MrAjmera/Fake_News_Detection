"""
Fake News Detection - Model Training Script
Author: Krrish Ajmera
Project: PBL-1 (CSE2170) - Manipal University Jaipur
"""

import pandas as pd
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
import warnings
import os
warnings.filterwarnings('ignore')

print("=" * 60)
print("FAKE NEWS DETECTION - MODEL TRAINING")
print("=" * 60)

# Download required NLTK data
print("\n[1/7] Downloading NLTK resources...")
try:
    nltk.download('stopwords', quiet=True)
    nltk.download('punkt', quiet=True)
    print("✓ NLTK resources downloaded")
except:
    print("⚠ Warning: NLTK download failed, continuing anyway...")

# Preprocessing function
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
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    
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

# Load dataset(s)
print("\n[2/7] Loading dataset...")

# Function to load and standardize a single dataset
def load_and_standardize_dataset(filename):
    """Load a dataset and standardize column names"""
    try:
        # Try data/raw folder first, then datasets folder, then root folder
        if os.path.exists(os.path.join('../data/raw', filename)):
            df = pd.read_csv(os.path.join('../data/raw', filename))
        elif os.path.exists(os.path.join('data/raw', filename)):
            df = pd.read_csv(os.path.join('data/raw', filename))
        elif os.path.exists(os.path.join('datasets', filename)):
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
        
        # Convert labels to binary (0 = Real, 1 = Fake)
        if df['label'].dtype == 'object':
            label_mapping = {}
            unique_labels = df['label'].unique()
            for label in unique_labels:
                if 'fake' in str(label).lower() or 'false' in str(label).lower() or str(label) == '1':
                    label_mapping[label] = 1
                else:
                    label_mapping[label] = 0
            df['label'] = df['label'].map(label_mapping)
        
        return df
    except:
        return None

# Try to load datasets (avoid duplicates with _1, _2, _4 suffixes)
datasets_to_try = [
    ('WELFake_Dataset.csv', '2018-2020'),
    ('fake_3.csv', '2023-2025'),  # New multi-category dataset
    ('train_2025.csv', '2024-2025'),
    ('train_2017.csv', '2016-2017'),
    ('train.csv', 'Unknown year')
]

loaded_datasets = []

# Load pre-combined datasets
print("Scanning for datasets...")
for filename, year_range in datasets_to_try:
    df_temp = load_and_standardize_dataset(filename)
    if df_temp is not None:
        loaded_datasets.append((filename, year_range, df_temp))
        print(f"✓ Loaded {filename}: {len(df_temp)} articles ({year_range})")

# Also try to load Fake.csv and True.csv (only if not already loaded)
if not any('Fake' in name for name, _, _ in loaded_datasets):
    try:
        print("\nTrying to load Fake.csv and True.csv...")
        # Try data/raw folder first, then datasets folder
        if os.path.exists('../data/raw/Fake.csv'):
            fake_path = '../data/raw/Fake.csv'
            true_path = '../data/raw/True.csv'
        elif os.path.exists('data/raw/Fake.csv'):
            fake_path = 'data/raw/Fake.csv'
            true_path = 'data/raw/True.csv'
        elif os.path.exists('datasets/Fake.csv'):
            fake_path = 'datasets/Fake.csv'
            true_path = 'datasets/True.csv'
        else:
            fake_path = 'Fake.csv'
            true_path = 'True.csv'
        
        fake_df = pd.read_csv(fake_path)
        true_df = pd.read_csv(true_path)
        
        # Add labels
        fake_df['label'] = 1
        true_df['label'] = 0
        
        # Standardize column names
        for df in [fake_df, true_df]:
            if 'text' not in df.columns:
                if 'title' in df.columns:
                    # Combine title and text if both exist
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
    print("\nPlease download at least one dataset:")
    print("\n📊 OPTION 1 (Recommended): Recent Dataset (2024-2025)")
    print("   URL: https://www.kaggle.com/datasets/saurabhshahane/fake-news-classification")
    print("   Save as: train_2025.csv")
    print("\n📊 OPTION 2: Classic Dataset (2016-2017)")
    print("   URL: https://www.kaggle.com/c/fake-news/data")
    print("   Save as: train_2017.csv or train.csv")
    print("\n💡 TIP: Download BOTH for best results!")
    exit()

# Combine all loaded datasets
if len(loaded_datasets) > 1:
    print(f"\n🔗 Combining {len(loaded_datasets)} datasets...")
    df = pd.concat([df for _, _, df in loaded_datasets], ignore_index=True)
    year_ranges = ", ".join([yr for _, yr, _ in loaded_datasets])
    print(f"✓ Combined dataset: {len(df)} articles")
    print(f"   Time coverage: {year_ranges}")
else:
    df = loaded_datasets[0][2]
    print(f"✓ Using single dataset: {len(df)} articles")

print(f"\n📊 Dataset Statistics:")
print(f"   Total articles: {len(df)}")
print(f"   Real news: {sum(df['label'] == 0)} ({sum(df['label'] == 0)/len(df)*100:.1f}%)")
print(f"   Fake news: {sum(df['label'] == 1)} ({sum(df['label'] == 1)/len(df)*100:.1f}%)")

# Preprocess text
print("\n[3/7] Preprocessing text data...")
df['clean_text'] = df['text'].apply(preprocess_text)
print(f"✓ Text preprocessing complete")

# Prepare features and labels
print("\n[4/7] Preparing training data...")
X = df['clean_text']
y = df['label']

# Split into train and test sets (80-20 split)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"✓ Training set: {len(X_train)} samples")
print(f"✓ Test set: {len(X_test)} samples")

# Feature extraction using TF-IDF
print("\n[5/7] Extracting features using TF-IDF...")
vectorizer = TfidfVectorizer(
    max_features=5000,  # Use top 5000 words
    min_df=2,           # Ignore words that appear in less than 2 documents
    max_df=0.8,         # Ignore words that appear in more than 80% of documents
    ngram_range=(1, 2)  # Use unigrams and bigrams
)

X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)
print(f"✓ Feature matrix shape: {X_train_vec.shape}")

# Train multiple models
print("\n[6/7] Training machine learning models...")
print("-" * 60)

models = {
    'Naive Bayes': MultinomialNB(),
    'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
}

best_model = None
best_accuracy = 0
best_model_name = ""

for name, model in models.items():
    print(f"\nTraining {name}...")
    model.fit(X_train_vec, y_train)
    
    # Predict on test set
    y_pred = model.predict(X_test_vec)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"✓ {name} Accuracy: {accuracy*100:.2f}%")
    
    # Keep track of best model
    if accuracy > best_accuracy:
        best_accuracy = accuracy
        best_model = model
        best_model_name = name

print("\n" + "=" * 60)
print(f"BEST MODEL: {best_model_name} ({best_accuracy*100:.2f}% accuracy)")
print("=" * 60)

# Detailed evaluation of best model
print(f"\n[7/7] Detailed evaluation of {best_model_name}...")
y_pred_best = best_model.predict(X_test_vec)

print("\nClassification Report:")
print("-" * 60)
print(classification_report(y_test, y_pred_best, target_names=['Real', 'Fake']))

print("\nConfusion Matrix:")
print("-" * 60)
cm = confusion_matrix(y_test, y_pred_best)
print(f"                Predicted Real    Predicted Fake")
print(f"Actual Real     {cm[0][0]:^14}    {cm[0][1]:^14}")
print(f"Actual Fake     {cm[1][0]:^14}    {cm[1][1]:^14}")

# Save the best model and vectorizer
print("\n" + "=" * 60)
print("SAVING MODEL...")
print("=" * 60)

# Create models directory if it doesn't exist
if not os.path.exists('../models'):
    os.makedirs('../models')

joblib.dump(best_model, '../models/model.pkl')
joblib.dump(vectorizer, '../models/vectorizer.pkl')
joblib.dump({'model_name': best_model_name, 'accuracy': best_accuracy}, '../models/model_info.pkl')

print(f"✓ Model saved as '../models/model.pkl'")
print(f"✓ Vectorizer saved as '../models/vectorizer.pkl'")
print(f"✓ Model info saved as '../models/model_info.pkl'")

print("\n" + "=" * 60)
print("TRAINING COMPLETE!")
print("=" * 60)
print(f"\nYour {best_model_name} model achieved {best_accuracy*100:.2f}% accuracy")
print("You can now run 'python src/test.py' to test it!")
