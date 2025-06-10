import { buildSchema } from "graphql";

export const chartSchema = buildSchema(`#graphql
type Point {
  x: Float!
  y: Float!
}

type Chart {
  id: String!
  name: String!
  type: String!
  data: [Point!]!    
  userId: String!
  projectId: String!
  createdAt: String!
  updatedAt: String!
}

input PointInput {
  x: Float!
  y: Float!
}

input CreateChartInput {
  name: String!
  type: String!
  data: [PointInput!]!   
  userId: String!
  projectId: String!
}

input UpdateChartInput {
  name: String
  type: String
  data: [PointInput!]
}

type DeleteResult {
  message: String!
}

input AiChartQuery {
  projectId: String!
  userPrompt: String!
  chartType: String!
}

type Query {
  getCharts: [Chart!]!
  getChart(id: String!): Chart
}

type Mutation {
  generateChart(info: AiChartQuery!): String!
  createChart(input: CreateChartInput!): Chart!
  updateChart(id: String!, input: UpdateChartInput!): Chart!
  deleteChart(id: String!): DeleteResult!
}
`);