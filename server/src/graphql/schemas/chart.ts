import { buildSchema } from "graphql";

export const chartSchema = buildSchema(`#graphql
  type Chart {      
    id: String!
    name: String!
    type: String!
    data: [Float!]!
  }

  input CreateChartInput {
    name: String!
    type: String!
    data: [Float!]!
  }

  input UpdateChartInput {
    name: String
    type: String
    data: [Float!]
  }   

  type DeleteResult {
    message: String!
  }

  type Query {
    getCharts: [Chart!]!
    getChart(id: String!): Chart
  }

  type Mutation {
    createChart(input: CreateChartInput!): Chart!
    updateChart(id: String!, input: UpdateChartInput!): Chart!
    deleteChart(id: String!): DeleteResult!
  }
`);