import { mergeTypeDefs } from '@graphql-tools/merge';
import { authSchema } from './auth';
import { postgresqlCollectionSchema } from './pgCollection';
import { coreDataSourceSchema } from './datasource';
import{ chartSchema } from './chart';
import { aiChartSchema } from './aiChart';


export const mergedGQLSchema = mergeTypeDefs([
  authSchema,
  postgresqlCollectionSchema,
  coreDataSourceSchema,
  chartSchema,
  aiChartSchema
]);
