import { envConfig } from "@/config/env.config";
import { DataSourceDocument, SQLQueryData } from "@/interfaces/datasource.interface";
import { AiChart } from "@/AI/interface/aiChart.interface";
import { AiQuery } from "@/AI/interface/aiQuery.interface";
import { MODEL_TOOLS } from "@/AI/utils/modelTools";
import Anthropic from "@anthropic-ai/sdk";
import { Pool, PoolClient, QueryResult } from "pg";
import { DatasourceService } from "@/services/datasource.service";
import { decrypt } from "@/utils/encryption.util";
import { GraphQLError } from "graphql";
import { ToolUseBlock } from "@anthropic-ai/sdk/resources";
import { sqlGeneratorPrompt, sqlPromptMessage } from "@/AI/prompts/sqlPrompt";

const anthropicClient = new Anthropic({
  apiKey: envConfig.CLAUDE_API_KEY
});

const CHART_SYSTEM_PROMPT = `
You are an expert data visualization specialist. Your job is to analyze SQL query results and create appropriate chart configurations using the generate_graph tool.

CRITICAL: You MUST always use the generate_graph tool. Never respond with plain text.

Guidelines for each chart type:

1. NUMBER charts: Show a single KPI value
2. BAR charts: Compare categories or rankings
3. LINE charts: Show trends over time
4. PIE charts: Show proportions of a whole
5. MATRIX charts: Show cross-tabulated data

Always use the generate_graph tool with the correct structure for the requested chart type.
`;

interface AIChartInput {
  chartType: string;
  chart: {
    title?: string;
    xAxis?: string;
    yAxis?: string;
    data?: any[];
    value?: number;
    matrix?: (number | string)[][];
    rowLabels?: string[];
    columnLabels?: string[];
  };
}

function safeDecrypt(encryptedValue: string | undefined | null): string {
  if (!encryptedValue) return '';
  
  try {
    const decrypted = decrypt(encryptedValue);
    if (decrypted && decrypted !== encryptedValue) {
      return decrypted;
    }
    
    try {
      const base64Decoded = Buffer.from(encryptedValue, 'base64').toString('utf-8');
      if (base64Decoded && base64Decoded !== encryptedValue) {
        return base64Decoded;
      }
    } catch (base64Error) {
    }
    
    return encryptedValue;
  } catch (error) {
    console.warn('Decryption failed, using original value:', error);
    return encryptedValue || '';
  }
}

export const generateChart = async (info: AiChart) => {
  let client: PoolClient | null = null;
  let pool: Pool | null = null;
  
  try {
    const { projectId, userPrompt, chartType } = info;
    console.log(`[CHART] Generating ${chartType} chart for: ${userPrompt}`);

    const project: DataSourceDocument = await DatasourceService.getDataSourceByProjectId(projectId);
    const { databaseName, databaseUrl, username, password, port } = project;
    
    const host = safeDecrypt(databaseUrl);
    const user = safeDecrypt(username);
    const pass = safeDecrypt(password);
    const dbName = safeDecrypt(databaseName);
    
    pool = pgPool(host, user, pass, port!, dbName);
    client = await pool.connect();
    console.log(`[CHART] Connected to database`);

    const schema: string = await getTableSchema(client);
    const content: string = sqlPromptMessage(schema, userPrompt);
    const rawSQL: string = await aiSQLGenerator(content);
    const sql: string = rawSQL.replace(/```sql|```/g, '').trim();
    console.log(`[CHART] Generated SQL: ${sql}`);

    const queryResult: QueryResult = await client.query(sql);
    console.log(`[CHART] Query executed. Rows: ${queryResult.rows.length}`);

    let promptResult: ToolUseBlock | null = null;

    if (queryResult.rows.length > 0) {
      const chartPrompt = createChartPrompt(userPrompt, chartType, queryResult.rows);
      console.log(`[CHART] Sending chart creation request to AI`);

      try {
        const response = await anthropicClient.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          temperature: 0.1,
          tools: MODEL_TOOLS,
          tool_choice: { type: 'tool', name: 'generate_graph' },
          messages: [{ role: 'user', content: chartPrompt }],
          system: CHART_SYSTEM_PROMPT
        });

        const toolUseContent = response.content.find(
          (res: Anthropic.Messages.ContentBlock) => res.type === 'tool_use'
        ) as ToolUseBlock;

        if (toolUseContent) {
          promptResult = toolUseContent;
          console.log(`[CHART] AI generated chart config successfully`);
          
          const aiInput = toolUseContent.input as AIChartInput;
          console.log(`[CHART] Chart type: ${aiInput?.chartType}`);
        } else {
          console.log(`[CHART] No tool_use found in AI response`);
        }
      } catch (aiError) {
        console.error(`[CHART] AI chart generation failed:`, aiError);
      }
    }

    const finalResult = {
      promptResult: promptResult,
      queryResult: queryResult.rows,
      sql
    };

    console.log(`[CHART] Returning result with promptResult: ${!!promptResult}`);
    return finalResult;

  } catch (error: any) {
    console.error(`[CHART] Error: ${error.message}`);
    throw new GraphQLError(`Chart generation failed: ${error.message}`);
  } finally {
    if (client) {
      client.release();
      console.log(`[CHART] Database client released`);
    }
    if (pool) {
      await pool.end();
      console.log(`[CHART] Database pool closed`);
    }
  }
};

export const getSQLQueryData = async (data: AiQuery): Promise<SQLQueryData> => {
  let client: PoolClient | null = null;
  let pool: Pool | null = null;

  try {
    const { projectId, prompt } = data;
    console.log(`[CHAT] Processing query for project: ${projectId}`);

    const project: DataSourceDocument = await DatasourceService.getDataSourceByProjectId(projectId);
    const { databaseName, databaseUrl, username, password, port } = project;
    
    const host = safeDecrypt(databaseUrl);
    const user = safeDecrypt(username);
    const pass = safeDecrypt(password);
    const dbName = safeDecrypt(databaseName);
    
    pool = pgPool(host, user, pass, port!, dbName);
    client = await pool.connect();

    const schema: string = await getTableSchema(client);
    const message: string = sqlGeneratorPrompt(schema, prompt);
    const rawSQL: string = await aiSQLGenerator(message);
    const sql: string = rawSQL.replace(/```sql|```/g, '').trim();
    console.log(`[CHAT] Generated SQL: ${sql}`);

    const result: QueryResult = await client.query(sql);
    console.log(`[CHAT] Query executed. Rows: ${result.rowCount}`);

    return { result: result.rows ?? [], sql };

  } catch (error: any) {
    console.error(`[CHAT] Error: ${error.message}`);
    throw new GraphQLError(`SQL query failed: ${error.message}`);
  } finally {
    if (client) client.release();
    if (pool) await pool.end();
  }
};

const createChartPrompt = (userPrompt: string, chartType: string, data: any[]): string => {
  const sampleData = data.slice(0, 10); 
  
  return `
Create a ${chartType} chart based on this user request: "${userPrompt}"

Data sample (first 10 rows):
${JSON.stringify(sampleData, null, 2)}

Total rows available: ${data.length}

Use the generate_graph tool to create a ${chartType} chart. Consider:
- The user specifically requested a ${chartType} chart
- Choose appropriate fields from the data for labels and values
- Create a meaningful title
- Structure the data correctly for the chart type

Examples of what to return:

For NUMBER chart:
{
  "chartType": "number",
  "chart": {
    "title": "Total Count",
    "value": 12345
  }
}

For BAR/LINE chart:
{
  "chartType": "${chartType}",
  "chart": {
    "title": "Sales by Category",
    "xAxis": "category_name",
    "yAxis": "total_sales",
    "data": [
      {"category_name": "Electronics", "total_sales": 50000},
      {"category_name": "Clothing", "total_sales": 30000}
    ]
  }
}

For PIE chart:
{
  "chartType": "pie",
  "chart": {
    "title": "Distribution",
    "data": [
      {"segment": "Category A", "value": 40},
      {"segment": "Category B", "value": 60}
    ]
  }
}

For MATRIX chart:
{
  "chartType": "matrix",
  "chart": {
    "title": "Cross Analysis",
    "matrix": [[100, 200], [150, 250]],
    "rowLabels": ["Row 1", "Row 2"],
    "columnLabels": ["Col 1", "Col 2"]
  }
}

IMPORTANT: Use the generate_graph tool with the exact structure above.
`;
};

const getTableSchema = async (client: PoolClient): Promise<string> => {
  const schemaQuery: string = `
    SELECT
      t.table_name,
      array_agg(
        c.column_name || ' ' || c.data_type ||
        CASE
          WHEN c.is_nullable = 'NO' THEN ' NOT NULL'
          ELSE ''
        END ||
        CASE
          WHEN EXISTS (
            SELECT 1 FROM information_schema.key_column_usage k
            WHERE k.table_name = t.table_name AND k.column_name = c.column_name
          ) THEN ' PRIMARY KEY'
          ELSE ''
        END ||
        CASE
          WHEN c.column_default IS NOT NULL THEN ' DEFAULT ' || c.column_default
          ELSE ''
        END
      ) as columns
    FROM
      information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE
      t.table_schema = 'public'
    GROUP BY
      t.table_name;
  `;
  const schema: QueryResult = await client.query(schemaQuery);
  return schema.rows.map((row) => `Table ${row.table_name}:\n  ${row.columns.join(',\n  ')}`).join('\n\n');
};

const aiSQLGenerator = async (message: string): Promise<string> => {
  const sqlGeneration = await anthropicClient.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: message
      }
    ]
  });
  const sql: string = (sqlGeneration.content[0] as any).text.trim();
  return sql;
};

const pgPool = (host: string, username: string, password: string, port: string, dbName: string): Pool => {
  const pool: Pool = new Pool({
    host,
    user: username,
    password,
    port: parseInt(`${port}`, 10) ?? 5432,
    database: dbName,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    maxUses: 7500
  });
  return pool;
};