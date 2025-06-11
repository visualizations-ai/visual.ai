import {ToolSchema} from '../interface/toolSchema.interface';

export const MODEL_TOOLS: ToolSchema[] = [
  {
    name: 'generate_graph',
    description: 'Generate structured chart data for visualization based on query results and user requirements.',
    input_schema: {
      type: 'object' as const,
      properties: {
        chartType: {
          type: 'string' as const,
          enum: ['number', 'bar', 'line', 'pie', 'matrix'] as const,
          description: 'The type of chart to generate'
        },
        chart: {
          type: 'object' as const,
          properties: {
            title: { 
              type: 'string' as const,
              description: 'Descriptive title for the chart'
            },
            value: {
              type: 'number' as const,
              description: 'Single numeric value for NUMBER charts only'
            },
            xAxis: { 
              type: 'string' as const,
              description: 'Label for X-axis (for bar/line/pie charts)'
            },
            yAxis: { 
              type: 'string' as const,
              description: 'Label for Y-axis (for bar/line charts)'
            },
            data: {
              type: 'array' as const,
              items: {
                type: 'object' as const,
                additionalProperties: true
              },
              description: 'Array of data points for bar/line/pie charts'
            },
            matrix: {
              type: 'array' as const,
              items: {
                type: 'array' as const,
                items: {
                  oneOf: [
                    { type: 'number' as const },
                    { type: 'string' as const }
                  ]
                }
              },
              description: 'A 2D matrix for MATRIX charts only'
            },
            rowLabels: {
              type: 'array' as const,
              items: { type: 'string' as const },
              description: 'Labels for matrix rows (MATRIX charts only)'
            },
            columnLabels: {
              type: 'array' as const,
              items: { type: 'string' as const },
              description: 'Labels for matrix columns (MATRIX charts only)'
            }
          },
          required: ['title'],
          additionalProperties: false
        }
      },
      required: ['chartType', 'chart']
    }
  }
];