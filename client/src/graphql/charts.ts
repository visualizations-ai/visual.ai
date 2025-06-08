import { gql } from "@apollo/client";

// AI Chart Generation Query
export const GENERATE_CHART_QUERY = gql`
  query GenerateChart($info: AiChartQuery!) {
    generateChart(info: $info)
  }
`;

// Chart CRUD Operations - ONLY fields that exist in your database
export const GET_CHARTS_QUERY = gql`
  query GetCharts {
    getCharts {
      id
      name
      type
      data {
        x
        y
      }
      userId
    }
  }
`;

export const GET_CHART_QUERY = gql`
  query GetChart($id: String!) {
    getChart(id: $id) {
      id
      name
      type
      data {
        x
        y
      }
      userId
    }
  }
`;

export const CREATE_CHART_MUTATION = gql`
  mutation CreateChart($input: CreateChartInput!) {
    createChart(input: $input) {
      id
      name
      type
      data {
        x
        y
      }
      userId
    }
  }
`;

export const UPDATE_CHART_MUTATION = gql`
  mutation UpdateChart($id: String!, $input: UpdateChartInput!) {
    updateChart(id: $id, input: $input) {
      id
      name
      type
      data {
        x
        y
      }
      userId
    }
  }
`;

export const DELETE_CHART_MUTATION = gql`
  mutation DeleteChart($id: String!) {
    deleteChart(id: $id) {
      message
    }
  }
`;

export default {
  GENERATE_CHART_QUERY,
  GET_CHARTS_QUERY,
  GET_CHART_QUERY,
  CREATE_CHART_MUTATION,
  UPDATE_CHART_MUTATION,
  DELETE_CHART_MUTATION
};