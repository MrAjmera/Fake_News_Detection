// Derives every headline metric from a confusion matrix, so the table, the
// heatmap and the accuracy figure can never disagree with each other.
// matrix[i][j] = number of articles whose actual class is i and predicted j.

export function deriveMetrics(labels, matrix) {
  const total = matrix.flat().reduce((a, b) => a + b, 0)
  const correct = matrix.reduce((sum, row, i) => sum + row[i], 0)

  const perClass = labels.map((label, i) => {
    const tp = matrix[i][i]
    const support = matrix[i].reduce((a, b) => a + b, 0)
    const predicted = matrix.reduce((sum, row) => sum + row[i], 0)
    const precision = predicted ? tp / predicted : 0
    const recall = support ? tp / support : 0
    const f1 =
      precision + recall ? (2 * precision * recall) / (precision + recall) : 0
    return { label, precision, recall, f1, support }
  })

  return { total, accuracy: total ? correct / total : 0, perClass }
}
