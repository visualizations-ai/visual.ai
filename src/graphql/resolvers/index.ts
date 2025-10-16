import { AuthResolver } from "./auth";
import { CoreDatasourceResolver } from "./datasource";
import { PostgreSQLCollectionResolver } from "./PGCollection";
import { ChartResolvers } from "./chart";
import { AiChartResolver } from "./aiChart";


export const mergedGQLResolvers = [
  AuthResolver,
  CoreDatasourceResolver,
  PostgreSQLCollectionResolver,
  ChartResolvers,
  AiChartResolver
];
