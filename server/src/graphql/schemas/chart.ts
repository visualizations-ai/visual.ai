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


        id: String!
        name: String
        type: String
        data: [Float!]
    }   
    type Query {

        getCharts: [Chart!]!
        getChart(id: String!): Chart
    }
    type Mutation {
        createChart(input: CreateChartInput!): Chart!
        updateChart(input: UpdateChartInput!): Chart!
        deleteChart(id: String!): String!
    }
`);
