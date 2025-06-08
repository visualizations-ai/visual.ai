import {ToolSchema} from '../interface/toolSchema.interface';

export const MODEL_TOOLS: ToolSchema[] = [
  {
    name: 'generate_graph',
    description: 'Generate structured JSON data for creating matrix-based charts.',
    input_schema: {
      type: 'object' as const,
      properties: {
        chartType: {
          type: 'string' as const,
          enum: ['number', 'bar chart', 'line chart', 'pie chart'] as const,
          description: 'The type of chart to generate'
        },
        chart: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' as const },
            matrix: {
              type: 'array' as const,
              items: {
                type: 'array' as const,
                items: {
                  oneOf: [
                    { type: 'number' as const },
                    {
                      type: 'object' as const,
                      additionalProperties: true
                    }
                  ]
                }
              },
              description: 'A 2D matrix representing the data grid'
            }
          },
          required: ['title', 'matrix']
        }
      },
      required: ['chartType', 'chart']
    }
  }
];
