import { gql } from "@apollo/client";

  export const TEST_CONNECTION = gql`
  mutation CheckPostgresqlConnection($datasource: DataSourceInfo!) {
    checkPostgresqlConnection(datasource: $datasource) {
      message
    }
  }
`;

 export const CREATE_DATASOURCE = gql`
  mutation CreatePostgresqlDataSource($source: DataSourceInfo!) {
    createPostgresqlDataSource(source: $source) {
      dataSource {
        id
        projectId
        type
        database
      }
    }
  }
`;