import { gql } from '@apollo/client';

export const TEST_CONNECTION = gql`
  mutation TestConnection($input: DatabaseConnectionInput!) {
    testDatabaseConnection(input: $input) {
      success
      message
    }
  }
`;

export const CREATE_DATASOURCE = gql`
  mutation CreateDatasource($input: CreateDatasourceInput!) {
    createDatasource(input: $input) {
      id
      projectId
      host
      port
      databaseName
      username
    }
  }
`;