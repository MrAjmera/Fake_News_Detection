"""
Fake News Detection - Model Testing Script
Author: Krrish Ajmera
Project: PBL-1 (CSE2170) - Manipal University Jaipur
"""

import joblib
import re
import nltk
from nltk.corpus import stopwords

print("=" * 60)
print("FAKE NEWS DETECTION - MODEL TESTING")
print("=" * 60)

# Load the trained model
print("\n[1/2] Loading trained model...")
try:
    model = joblib.load('../models/model.pkl')
    vectorizer = joblib.load('../models/vectorizer.pkl')
    model_info = joblib.load('../models/model_info.pkl')
    print(f"✓ Model loaded: {model_info['model_name']}")
    print(f"✓ Training accuracy: {model_info['accuracy']*100:.2f}%")
except FileNotFoundError:
    print("✗ Error: Model files not found!")
    print("Please run 'python src/train.py' first to train the model.")
    exit()

# Preprocessing function (same as training)
def preprocess_text(text):
    """Preprocess text for prediction"""
    text = text.lower()
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    text = ' '.join(text.split())
    
    try:
        stop_words = set(stopwords.words('english'))
        words = [word for word in text.split() if word not in stop_words]
        text = ' '.join(words)
    except:
        pass
    
    return text

def validate_input(text):
    """Validate user input before prediction"""
    words = text.strip().split()
    
    if len(words) < 20:
        return False, (
            "⚠️  INPUT TOO SHORT!\n"
            "This model is trained on full news articles, not short statements.\n"
            "Please provide at least 20 words for accurate detection.\n\n"
            "Example: A full paragraph from a news article with context, sources, and details."
        )
    
    if len(words) > 1000:
        return False, "⚠️  Input too long! Please limit to 1000 words."
    
    return True, None

def interpret_confidence(prediction, confidence):
    """Interpret prediction confidence and provide context"""
    if confidence < 70:
        return "🤔 UNCERTAIN", "The model cannot make a reliable prediction. Please provide more context or a complete article."
    elif confidence < 85:
        label = "🔴 FAKE" if prediction == 1 else "🟢 REAL"
        return label, f"Low confidence ({confidence:.2f}%). Take this prediction with caution."
    else:
        label = "🔴 FAKE" if prediction == 1 else "🟢 REAL"
        return label, f"High confidence ({confidence:.2f}%)"

def predict_news(text, show_steps=True):
    """Predict if news is real or fake with real-time processing feedback"""
    import time
    import sys
    
    def print_step(message, duration=0.3):
        """Print a processing step with animation"""
        if show_steps:
            print(f"  ⏳ {message}", end='', flush=True)
            for _ in range(3):
                time.sleep(duration / 3)
                print('.', end='', flush=True)
            print(" ✓")
    
    if show_steps:
        print("\n" + "─" * 60)
        print("🔍 ANALYZING YOUR INPUT...")
        print("─" * 60)
    
    # Step 1: Preprocessing
    print_step("Converting to lowercase and cleaning text", 0.4)
    text_lower = text.lower()
    text_clean = re.sub(r'[^a-zA-Z\s]', '', text_lower)
    text_clean = ' '.join(text_clean.split())
    
    # Step 2: Remove stop words
    print_step("Removing stop words (the, is, and, etc.)", 0.5)
    try:
        stop_words = set(stopwords.words('english'))
        words = [word for word in text_clean.split() if word not in stop_words]
        clean_text = ' '.join(words)
    except:
        clean_text = text_clean
    
    # Step 3: Vectorization
    print_step("Converting text to numerical features (TF-IDF)", 0.6)
    vectorized = vectorizer.transform([clean_text])
    
    # Step 4: Model thinking
    print_step("Running through Random Forest (100 decision trees)", 0.8)
    prediction = model.predict(vectorized)[0]
    
    # Step 5: Calculate confidence
    print_step("Calculating confidence scores", 0.4)
    probability = model.predict_proba(vectorized)[0]
    confidence = max(probability) * 100
    
    if show_steps:
        print("─" * 60)
        print("✅ ANALYSIS COMPLETE!\n")
    
    return prediction, confidence

# Test samples
print("\n[2/2] Testing with sample news articles...")
print("=" * 60)

test_samples = [
    {
        "title": "Fake News Example 1",
        "text": """Scientists have discovered that eating chocolate every day can cure cancer completely. 
        This miracle cure was found by researchers who claim that dark chocolate contains special 
        compounds that destroy all cancer cells within weeks. Doctors are shocked by this discovery 
        and pharmaceutical companies are trying to hide this information from the public."""
    },
    {
        "title": "Real News Example 1",
        "text": """The government announced new economic policies today during a press conference. 
        The finance minister outlined plans for infrastructure development and tax reforms. 
        The measures are expected to be implemented in the next fiscal year, pending parliamentary 
        approval. Economists have mixed reactions to the proposed changes."""
    },
    {
        "title": "Fake News Example 2",
        "text": """Breaking: Aliens have landed in New York City and the government is covering it up! 
        Multiple sources confirm that UFOs were seen landing in Central Park last night. 
        The military has surrounded the area and is preventing anyone from entering. 
        This is the biggest conspiracy in human history!"""
    },
    {
        "title": "Real News Example 2",
        "text": """A new study published in the Journal of Medicine shows that regular exercise 
        can reduce the risk of heart disease. Researchers followed 10,000 participants over 
        five years and found that those who exercised at least three times per week had 
        significantly better cardiovascular health. The study was peer-reviewed and funded 
        by the National Health Institute."""
    }
]

for i, sample in enumerate(test_samples, 1):
    print(f"\nTest {i}: {sample['title']}")
    print("-" * 60)
    print(f"Text preview: {sample['text'][:100]}...")
    
    # Disable animation for automated tests (faster)
    prediction, confidence = predict_news(sample['text'], show_steps=False)
    label, context = interpret_confidence(prediction, confidence)
    
    print(f"Prediction: {label}")
    print(f"Context: {context}")

# Interactive testing
print("\n" + "=" * 60)
print("INTERACTIVE TESTING MODE")
print("=" * 60)
print("You can now test your own news articles!")
print("Type 'quit' to exit\n")

while True:
    user_input = input("Enter news article (or 'quit'): ").strip()
    
    if user_input.lower() == 'quit':
        print("\nThank you for using Fake News Detector!")
        break
    
    if not user_input:
        print("⚠️  Please enter some text\n")
        continue
    
    # Validate input
    is_valid, error_msg = validate_input(user_input)
    if not is_valid:
        print("\n" + "=" * 60)
        print(error_msg)
        print("=" * 60 + "\n")
        continue
    
    # Make prediction with real-time feedback (show_steps=True)
    prediction, confidence = predict_news(user_input, show_steps=True)
    label, context = interpret_confidence(prediction, confidence)
    
    print("=" * 60)
    print(f"📊 FINAL RESULT:")
    print(f"   Prediction: {label}")
    print(f"   {context}")
    print("=" * 60 + "\n")
