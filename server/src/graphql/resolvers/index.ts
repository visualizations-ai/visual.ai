import { AuthResolver } from "./auth";
import { CoreDatasourceResolver } from "./datasource";
import { PostgreSQLCollectionResolver } from "./PGCollection";


export const mergedGQLResolvers = [
  AuthResolver,
  CoreDatasourceResolver,
  PostgreSQLCollectionResolver
];
