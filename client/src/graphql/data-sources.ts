import { gql } from "@apollo/client";


 export const GET_DATA_SOURCES = gql`
	query GetDataSources {
		getDataSources {
			dataSource {
				id
				projectId
				type
				database
			}
		}
	}
`;

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

 export const DELETE_DATASOURCE = gql`
	mutation DeleteDatasource($datasourceId: String!) {
		deleteDatasource(datasourceId: $datasourceId) {
			id
		}
	}
`;