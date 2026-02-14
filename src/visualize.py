"""
Visual Decision Tree Generator
Creates a graphical flowchart-style decision tree visualization
"""

import joblib
import matplotlib.pyplot as plt
from sklearn.tree import plot_tree
import numpy as np

print("=" * 60)
print("CREATING VISUAL DECISION TREE DIAGRAM")
print("=" * 60)

# Load model
print("\n[1/4] Loading model...")
model = joblib.load('../models/model.pkl')
vectorizer = joblib.load('../models/vectorizer.pkl')
feature_names = vectorizer.get_feature_names_out()

print(f"✓ Loaded Random Forest with {len(model.estimators_)} trees")

# Get first tree (simplified for visualization)
print("\n[2/4] Extracting decision tree...")
tree = model.estimators_[0]
print(f"✓ Tree has {tree.tree_.node_count} nodes")

# Create visualization
print("\n[3/4] Creating visual diagram...")
print("   (This may take a moment...)")

# Create figure with large size for readability
fig, ax = plt.subplots(figsize=(25, 15))

# Plot the tree (limited depth for readability)
plot_tree(
    tree,
    feature_names=feature_names,
    class_names=['REAL', 'FAKE'],
    filled=True,
    rounded=True,
    fontsize=10,
    max_depth=3,  # Limit depth for readability
    ax=ax
)

plt.title('Decision Tree Visualization (First Tree from Random Forest)\\nDepth Limited to 3 Levels for Clarity', 
          fontsize=16, fontweight='bold', pad=20)

# Save as high-resolution image
output_file = '../visualizations/decision_tree_visual.png'
plt.savefig(output_file, dpi=300, bbox_inches='tight', facecolor='white')
print(f"✓ Saved as '{output_file}'")

# Also save as SVG for presentations
output_svg = '../visualizations/decision_tree_visual.svg'
plt.savefig(output_svg, format='svg', bbox_inches='tight', facecolor='white')
print(f"✓ Saved as '{output_svg}' (vector format for PowerPoint)")

plt.close()

# Create a simplified version showing important splits
print("\n[4/4] Creating simplified version...")

fig, ax = plt.subplots(figsize=(20, 12))

plot_tree(
    tree,
    feature_names=feature_names,
    class_names=['REAL', 'FAKE'],
    filled=True,
    rounded=True,
    fontsize=12,
    max_depth=2,  # Even simpler
    ax=ax,
    proportion=True  # Show proportions instead of counts
)

plt.title('Simplified Decision Tree (2 Levels)\nEasier to Read for Presentations', 
          fontsize=16, fontweight='bold', pad=20)

simple_file = '../visualizations/decision_tree_simple.png'
plt.savefig(simple_file, dpi=300, bbox_inches='tight', facecolor='white')
print(f"✓ Saved as '{simple_file}'")

plt.close()

# Create feature importance bar chart
print("\n[BONUS] Creating feature importance chart...")

importances = model.feature_importances_
indices = np.argsort(importances)[::-1][:20]  # Top 20

fig, ax = plt.subplots(figsize=(12, 8))

colors = ['#2ecc71' if importances[i] > 0.02 else '#3498db' for i in indices]

ax.barh(range(20), importances[indices], color=colors)
ax.set_yticks(range(20))
ax.set_yticklabels([feature_names[i] for i in indices])
ax.invert_yaxis()
ax.set_xlabel('Importance Score', fontsize=12, fontweight='bold')
ax.set_title('Top 20 Most Important Words for Fake News Detection', 
             fontsize=14, fontweight='bold', pad=15)
ax.grid(axis='x', alpha=0.3)

# Add value labels
for i, v in enumerate(importances[indices]):
    ax.text(v + 0.001, i, f'{v:.4f}', va='center', fontsize=9)

importance_file = '../visualizations/feature_importance.png'
plt.savefig(importance_file, dpi=300, bbox_inches='tight', facecolor='white')
print(f"✓ Saved as '{importance_file}'")

plt.close()

print("\n" + "=" * 60)
print("VISUALIZATION COMPLETE!")
print("=" * 60)

print(f"""
Created 4 visual files:

1. {output_file}
   → Full decision tree (3 levels)
   → High resolution PNG
   → Use in reports/documents

2. {output_svg}
   → Vector format (scalable)
   → Perfect for PowerPoint
   → No quality loss when zooming

3. {simple_file}
   → Simplified tree (2 levels)
   → Easier to read
   → Good for presentations

4. {importance_file}
   → Bar chart of top 20 words
   → Shows what matters most
   → Great for explaining model

HOW TO USE:
• Open the PNG files to view
• Insert into PowerPoint/Google Slides
• Use SVG for best quality in presentations

LEGEND:
• Orange boxes = Predict FAKE news
• Blue boxes = Predict REAL news
• Darker color = Higher confidence
""")

print("\n✓ All visualizations ready for your presentation!")
