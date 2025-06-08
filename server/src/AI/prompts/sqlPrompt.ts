export const sqlPromptMessage = (schema: string, userPrompt: string): string => {
  return `
You are an expert in writing PostgreSQL queries.

Below is the database schema:
${schema}

Based on the following question:
"${userPrompt}"

Write a valid SQL query that:
- Uses SELECT * instead of listing specific columns
- Returns only the SQL query, without any explanation
- Applies JOINs if needed to access related tables
- Filters data appropriately using WHERE
- Orders results using ORDER BY when helpful
- Uses aggregates like COUNT, SUM, or AVG when relevant
- Includes a LIMIT clause if many rows could be returned
`;
};

export const generateChartPrompt = (
  userPrompt: string,
  chartType: string,
  chartPrompt: string,
  data: string
): string => {
  return `
Chart Type: ${chartType} chart

User's Request:
${userPrompt}

Chart Configuration Guidelines:
${chartPrompt}

Data to visualize:
${data}

Reminder: The output should be a ${chartType} chart based on the above data.
`;
};


export const sqlGeneratorPrompt = (schema: string, prompt: string): string => {
  return `
You are a PostgreSQL query expert.

Here is the database schema:
${schema}

Your task is to write a SQL query that answers the question:
"${prompt}"

Guidelines:
- Return only the SQL query, no extra text
- Ensure the syntax is correct for PostgreSQL
- Use JOINs as needed to link related tables
- Apply WHERE filters for relevant conditions
- Use ORDER BY to sort results if applicable
- Apply aggregate functions (SUM, COUNT, AVG, etc.) as necessary
- Add LIMIT if the query could return many results
- Include all relevant fields that answer the question
- If a column mentioned in the question exists in the schema, include it in the SELECT
`;
};
