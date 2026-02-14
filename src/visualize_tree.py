"""
Decision Tree Visualization
Shows one of the 100 trees from the Random Forest model
"""

import joblib
from sklearn.tree import export_text
import numpy as np

print("=" * 60)
print("DECISION TREE VISUALIZATION")
print("=" * 60)

# Load the model
print("\n[1/3] Loading Random Forest model...")
model = joblib.load('model.pkl')
vectorizer = joblib.load('vectorizer.pkl')

print(f"✓ Model loaded: Random Forest with {len(model.estimators_)} trees")

# Get feature names
feature_names = vectorizer.get_feature_names_out()
print(f"✓ Features: {len(feature_names)} words/phrases")

# Extract one tree for visualization
print("\n[2/3] Extracting first decision tree...")
first_tree = model.estimators_[0]  # Get the first of 100 trees

print(f"✓ Tree depth: {first_tree.tree_.max_depth}")
print(f"✓ Number of nodes: {first_tree.tree_.node_count}")
print(f"✓ Number of leaves: {first_tree.tree_.n_leaves}")

# Show tree structure in text format
print("\n[3/3] Tree Structure (first 20 levels):")
print("=" * 60)

tree_rules = export_text(
    first_tree,
    feature_names=list(feature_names),
    max_depth=5  # Limit depth for readability
)

print(tree_rules)

print("\n" + "=" * 60)
print("EXPLANATION")
print("=" * 60)

print("""
This is ONE of the 100 decision trees in your Random Forest.

How to read it:
• |--- word <= 0.50 means "if TF-IDF score for 'word' is ≤ 0.50"
• class: 0 means "predict REAL news"
• class: 1 means "predict FAKE news"
• value: [real_count, fake_count] shows training samples

Example path:
|--- shocking <= 0.50
|   |--- according <= 0.30
|   |   |--- class: 1  (FAKE)

This means: "If article has low 'shocking' score AND low 'according' 
score, predict FAKE news"

The Random Forest combines predictions from ALL 100 trees like this!
""")

# Show which words are most important
print("\n" + "=" * 60)
print("TOP 20 MOST IMPORTANT WORDS (across all 100 trees)")
print("=" * 60)

# Get feature importances
importances = model.feature_importances_
indices = np.argsort(importances)[::-1]

print("\nRank | Word/Phrase              | Importance Score")
print("-" * 60)
for i in range(20):
    idx = indices[i]
    print(f"{i+1:4d} | {feature_names[idx]:24s} | {importances[idx]:.6f}")

print("\n" + "=" * 60)
print("These words have the most influence on predictions!")
print("=" * 60)
