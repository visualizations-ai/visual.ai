export const CHART_PROMPTS = {
  'number': `
Create a single-value summary (KPI-style) from this time-based dataset:
- Count or sum a key field across all records.
- Return just the final number.

Respond in this JSON format:
{
  "chartType": "number",
  "chart": {
    "title": "[Descriptive title]",
    "data": 80
  }
}`,

  'line chart': `
Build a line chart to visualize trends over time:
- Plot a meaningful metric on the Y-axis.
- Use proper time units (day, month, etc.) on the X-axis.
- Focus on showing trend changes and patterns.

Respond using this structure:
{
  "chartType": "line chart",
  "chart": {
    "title": "[Descriptive title]",
    "xAxis": "[Time unit]",
    "yAxis": "[Metric]",
    "data": [
      {"[xAxis]": "[timestamp]", "[yAxis]": [value]},
      ...
    ]
  }
}`,

  'bar chart': `
Use this categorical dataset to generate a bar chart:
- Group values by category.
- Show numeric comparisons on the Y-axis.
- Keep the layout clean and grouped logically.

Return data as:
{
  "chartType": "bar",
  "chart": {
    "title": "[Descriptive title]",
    "xAxis": "[Category]",
    "yAxis": "[Metric]",
    "data": [
      {"[xAxis]": "[category name]", "[yAxis]": [value]},
      ...
    ]
  }
}`,

  'pie chart': `
Summarize proportional distribution using a pie chart:
- Segment values by category.
- Make sure labels are readable.
- Highlight the largest segments clearly.

Use this structure:
{
  "chartType": "pie",
  "chart": {
    "title": "[Descriptive title]",
    "xAxis": "segment",
    "yAxis": "value",
    "data": [
      {"segment": "[category name]", "value": [value], "color": "#hexColor"},
      ...
    ]
  }
}`,

  'matrix': `
Generate a matrix-style chart from structured tabular data:
- Organize values in rows and columns.
- Preserve the two-dimensional layout of the dataset.
- Include row and column labels.
- Suitable for grids, heatmaps, or correlation matrices.

Respond in this format:
{
  "chartType": "matrix",
  "chart": {
    "title": "[Descriptive title]",
    "matrix": [
      [value1, value2, value3],
      [value4, value5, value6],
      ...
    ],
    "rowLabels": ["Row 1", "Row 2", ...],
    "columnLabels": ["Col A", "Col B", ...]
  }
}`
};
