# Dataset Information

## 📊 Datasets Used

This project uses multiple datasets for training the fake news detection model:

### Current Datasets (in `data/raw/` folder)

1. **Fake.csv** - Fake news articles (~23,000 articles)
2. **True.csv** - Real news articles (~21,000 articles)
3. **WELFake_Dataset.csv** - Combined dataset (72,134 articles)
4. **clickbait_data.csv** - Clickbait headlines (32,000 headlines)
5. **GossipCop & PolitiFact** - Additional datasets

**Total:** 150,000+ articles available for training

---

## 📥 Download Instructions

If the datasets are not included in this repository (due to size), you can download them from:

### Option 1: Kaggle Fake News Dataset (Recommended)
- **URL:** https://www.kaggle.com/c/fake-news/data
- **Files:** `Fake.csv`, `True.csv`
- **Size:** ~100 MB
- **Articles:** ~44,000

### Option 2: WELFake Dataset
- **URL:** https://zenodo.org/record/4561253
- **File:** `WELFake_Dataset.csv`
- **Size:** ~50 MB
- **Articles:** 72,134

### Option 3: Clickbait Dataset
- **URL:** https://www.kaggle.com/datasets/amananandrai/clickbait-dataset
- **File:** `clickbait_data.csv`
- **Size:** ~10 MB
- **Headlines:** 32,000

---

## 📁 How to Use

1. **Download** the datasets from the links above
2. **Extract** the CSV files
3. **Place** them in the `data/raw/` folder:
   ```
   data/
   └── raw/
       ├── Fake.csv
       ├── True.csv
       ├── WELFake_Dataset.csv
       ├── clickbait_data.csv
       └── ...
   ```
4. **Run** the training script:
   ```bash
   python src/train.py
   ```

---

## 📋 Dataset Format

All datasets should have at least these columns:
- **text** - The news article content
- **label** - 0 for REAL, 1 for FAKE

The training script will automatically standardize column names.

---

## ⚠️ Note

Datasets are **NOT** included in the GitHub repository due to their large size (150+ MB total). Please download them separately using the links above.

---

## 🎯 Quick Start

**Minimum requirement:** Download `Fake.csv` and `True.csv` (44K articles)

**Recommended:** Download all datasets for best model performance (150K+ articles)

---

**Last Updated:** February 15, 2026
