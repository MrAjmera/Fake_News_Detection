"""
Fake News Detection - Model Testing Script (V2 Upgrade)
Author: Krrish Ajmera
Project: PBL-1 (CSE2170) - Manipal University Jaipur
"""

import joblib
import re
import nltk
from nltk.corpus import stopwords
import warnings

warnings.filterwarnings('ignore')

print("=" * 60)
print("FAKE NEWS DETECTION - V2 TESTING SUITE")
print("=" * 60)

# Load the newest V2 trained models
print("\n[1/2] Loading High-Accuracy V2 Models...")
try:
    model = joblib.load('../models_v2/model_lr_v2.pkl')
    vectorizer = joblib.load('../models_v2/vectorizer_v2.pkl')
    print("✓ Model loaded: V2 Logistic Regression")
    print("✓ Training accuracy: ~95.30%")
except FileNotFoundError:
    print("✗ Error: V2 Model files not found!")
    print("Please run 'python src/train_v2.py' first to train the model.")
    exit()

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
    if confidence < 55:
        return "🤔 UNCERTAIN", "The model cannot make a reliable prediction. Please provide more context or a complete article."
    elif confidence < 75:
        label = "🔴 FAKE" if prediction == 1 else "🟢 REAL"
        return label, f"Low confidence ({confidence:.2f}%). Take this prediction with caution."
    else:
        label = "🔴 FAKE" if prediction == 1 else "🟢 REAL"
        return label, f"High confidence ({confidence:.2f}%)"

def predict_news(text, show_steps=True):
    """Predict if news is real or fake with real-time processing feedback"""
    import time
    
    def print_step(message, duration=0.3):
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
    
    # Preprocessing
    print_step("Cleaning text structures", 0.4)
    text_lower = text.lower()
    text_clean = re.sub(r'[^a-zA-Z\s]', '', text_lower)
    text_clean = ' '.join(text_clean.split())
    
    print_step("Purging stopwords", 0.5)
    try:
        stop_words = set(stopwords.words('english'))
        words = [word for word in text_clean.split() if word not in stop_words]
        clean_text = ' '.join(words)
    except:
        clean_text = text_clean
    
    # Vectorization
    print_step("Executing 15,000-dimensional TF-IDF Mapping", 0.6)
    vectorized = vectorizer.transform([clean_text])
    
    # Prediction
    print_step("Processing Matrix through Logistic Weights", 0.8)
    prediction = model.predict(vectorized)[0]
    
    print_step("Calculating Confidence Probability", 0.4)
    probability = model.predict_proba(vectorized)[0]
    confidence = max(probability) * 100
    
    if show_steps:
        print("─" * 60)
        print("✅ ANALYSIS COMPLETE!\n")
    
    return prediction, confidence

# Interactive testing
print("\n" + "=" * 60)
print("INTERACTIVE TESTING MODE")
print("=" * 60)
print("The AI is ready. You can now test your own news articles!")
print("Type 'quit' to exit\n")

while True:
    user_input = input("Enter news article (or 'quit'): ").strip()
    
    if user_input.lower() == 'quit':
        print("\nThank you for using Fake News Detector!")
        break
    
    if not user_input:
        print("⚠️  Please enter some text\n")
        continue
    
    is_valid, error_msg = validate_input(user_input)
    if not is_valid:
        print("\n" + "=" * 60)
        print(error_msg)
        print("=" * 60 + "\n")
        continue
    
    prediction, confidence = predict_news(user_input, show_steps=True)
    label, context = interpret_confidence(prediction, confidence)
    
    print("=" * 60)
    print(f"📊 FINAL RESULT:")
    print(f"   Prediction: {label}")
    print(f"   {context}")
    print("=" * 60 + "\n")
