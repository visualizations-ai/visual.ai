import { gql } from "@apollo/client";

// AI Chart Generation Query - matching existing server
export const GENERATE_CHART_QUERY = gql`
  query GenerateChart($info: AiChartQuery!) {
    generateChart(info: $info)
  }
`;

// Chart CRUD Operations - matching existing server schema
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
      projectId
      createdAt
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
      projectId
      createdAt
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
      projectId
      createdAt
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
      projectId
      updatedAt
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