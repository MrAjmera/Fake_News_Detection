# Fake News Detection System

**Machine Learning Project - PBL-1**  
**Manipal University Jaipur**  
**Author:** Krrish Ajmera

[![Accuracy](https://img.shields.io/badge/Accuracy-95.26%25-success)](docs/TRAINING_RESULTS.txt)
[![Algorithm](https://img.shields.io/badge/Algorithm-Random%20Forest-blue)](#)
[![Python](https://img.shields.io/badge/Python-3.x-blue)](https://www.python.org/)
[![Dataset](https://img.shields.io/badge/Dataset-150K%2B%20Articles-orange)](#)

Detect fake news articles using Natural Language Processing (NLP) and Machine Learning with **95.26% accuracy**.

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/fake-news-detection.git
cd fake-news-detection
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
python -m nltk.downloader stopwords
```

### 3. Download Datasets
See [data/README.md](data/README.md) for download instructions.  
Place CSV files in `data/raw/` folder.

### 4. Train the Model
```bash
cd src
python train.py
```
⏱️ Takes ~2-3 minutes | Creates model files in `models/` folder

### 5. Test the Model
```bash
python test.py
```
✨ Interactive testing with real-time processing feedback!

---

## 🌟 Features

- ✅ **95.26% Accuracy** - Random Forest with 100 decision trees
- ✅ **Real-Time Feedback** - Shows processing steps like Gemini/ChatGPT
- ✅ **Input Validation** - Requires 20+ words for accurate predictions
- ✅ **Confidence Levels** - Uncertain/Low/High confidence interpretation
- ✅ **Visual Decision Trees** - PNG/SVG diagrams for presentations
- ✅ **150,000+ Articles** - Comprehensive training dataset available

---

## 📁 Project Structure

```
fake-news-detection/
├── src/                          # Source code
│   ├── train.py                  # Training script
│   ├── test.py                   # Testing script (with real-time feedback)
│   ├── visualize.py              # Visualization generator
│   ├── train_enhanced.py         # Enhanced training (experimental)
│   └── visualize_tree.py         # Tree visualization
│
├── models/                       # Trained models (generated after training)
│   ├── model.pkl                 # Best model (Random Forest)
│   ├── vectorizer.pkl            # TF-IDF vectorizer
│   └── model_info.pkl            # Model metadata
│
├── data/                         # Datasets
│   ├── raw/                      # Raw CSV files (download required)
│   │   ├── Fake.csv
│   │   ├── True.csv
│   │   ├── WELFake_Dataset.csv
│   │   └── ...
│   └── README.md                 # Dataset download instructions
│
├── visualizations/               # Generated visualizations (after running visualize.py)
│   ├── decision_tree_visual.png
│   ├── decision_tree_visual.svg
│   ├── decision_tree_simple.png
│   └── feature_importance.png
│
├── docs/                         # Documentation
│   ├── presentation_slides.md
│   ├── HOW_TO_TEST.txt
│   └── ...
│
├── .gitignore                    # Git ignore rules
├── README.md                     # This file
└── requirements.txt              # Python dependencies
```

---

## 📊 Model Performance

| Algorithm | Accuracy |
|-----------|----------|
| **Random Forest** | **95.26%** ⭐ |
| Logistic Regression | 94.12% |
| Naive Bayes | 91.78% |

### Top Feature Words
1. **reuters** (8.61%) - Credible source indicator
2. **said** (5.07%) - Quote attribution
3. **via** (2.08%) - Source citation

---

## 🎓 Usage Examples

### Training
```bash
cd src
python train.py
```

Output:
```
============================================================
FAKE NEWS DETECTION - MODEL TRAINING
============================================================

[1/7] Downloading NLTK resources...
✓ NLTK resources downloaded

[2/7] Loading dataset...
✓ Combined Fake.csv and True.csv: 44898 articles

[3/7] Preprocessing text data...
✓ Text preprocessing complete

[4/7] Preparing training data...
✓ Training set: 35918 samples
✓ Test set: 8980 samples

[5/7] Extracting features using TF-IDF...
✓ Feature matrix shape: (35918, 5000)

[6/7] Training machine learning models...
Training Random Forest...
✓ Random Forest Accuracy: 95.26%

BEST MODEL: Random Forest (95.26% accuracy)

[7/7] Saving model...
✓ Model saved as '../models/model.pkl'
```

### Testing
```bash
python test.py
```

You'll see real-time processing:
```
────────────────────────────────────────────────────────────
🔍 ANALYZING YOUR INPUT...
────────────────────────────────────────────────────────────
  ⏳ Converting to lowercase and cleaning text... ✓
  ⏳ Removing stop words (the, is, and, etc.)... ✓
  ⏳ Converting to numerical features (TF-IDF)... ✓
  ⏳ Running through Random Forest (100 decision trees)... ✓
  ⏳ Calculating confidence scores... ✓
────────────────────────────────────────────────────────────
✅ ANALYSIS COMPLETE!

============================================================
📊 FINAL RESULT:
   Prediction: 🟢 REAL
   High confidence (92.45%)
============================================================
```

### Creating Visualizations
```bash
python visualize.py
```

Generates 4 files:
- `decision_tree_visual.png` - Full 3-level tree
- `decision_tree_visual.svg` - Vector format (PowerPoint)
- `decision_tree_simple.png` - Simplified 2-level tree
- `feature_importance.png` - Top 20 words chart

---

## 🔬 How It Works

### 1. Preprocessing
- Convert to lowercase
- Remove special characters
- Remove stop words ("the", "is", "and", etc.)

### 2. Feature Extraction
- TF-IDF vectorization
- 5,000+ numerical features
- Captures word importance

### 3. Classification
- Random Forest (100 trees)
- Each tree votes: REAL or FAKE
- Majority vote wins

### 4. Confidence Calculation
- Percentage of trees agreeing
- >85% = High confidence
- 70-85% = Low confidence
- <70% = Uncertain

---

## 🎯 Limitations

- ⚠️ Requires full articles (20+ words minimum)
- ⚠️ Trained on political/general news
- ⚠️ English language only
- ⚠️ May struggle with recent topics (COVID-19, etc.)

---

## 🚀 Future Enhancements

- 📊 Integrate 150K+ additional articles
- 🌐 Multi-domain classification (Political/Entertainment/Health)
- 🧠 Deep learning with BERT
- 🌍 Multi-language support

See [docs/multi_dataset_integration_plan.md](docs/multi_dataset_integration_plan.md) for details.

---

## 🛠️ Technologies Used

- **Python 3.x**
- **scikit-learn** - Machine Learning
- **NLTK** - Natural Language Processing
- **Pandas** - Data manipulation
- **Matplotlib** - Visualizations
- **Joblib** - Model persistence

---

## 📝 Requirements

```
scikit-learn
nltk
pandas
joblib
matplotlib
textblob
```

Install all at once:
```bash
pip install -r requirements.txt
```

---

## 🎓 For Presentations

### Live Demo Flow
1. **Open terminal** → Run `python src/test.py`
2. **Show automated tests** → 4 sample predictions
3. **Interactive demo** → Paste a news article
4. **Watch processing** → Real-time feedback animation
5. **Explain result** → Prediction + confidence level

### Visual Assets
- Use `visualizations/decision_tree_visual.svg` in PowerPoint (scalable)
- Show `visualizations/feature_importance.png` to explain key words
- Use `visualizations/decision_tree_simple.png` for non-technical audiences

---

## 📜 Credits

### Datasets
- Kaggle Fake News Dataset
- WELFake Dataset
- Clickbait Dataset
- FakeNewsNet (GossipCop & PolitiFact)

### Libraries
- scikit-learn, NLTK, Pandas, Matplotlib

---

## 👨‍💻 About

**Developer:** Krrish Ajmera  
**Project:** Problem-Based Learning (PBL-1)  
**Institution:** Manipal University Jaipur  
**GitHub:** [MrAjmera](https://github.com/MrAjmera)

---

## 📄 License

This project is for educational purposes as part of PBL-1 coursework at Manipal University Jaipur.
