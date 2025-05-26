import { mergeTypeDefs } from '@graphql-tools/merge';
import { authSchema } from './auth';
import { postgresqlCollectionSchema } from './pgCollection';
import { coreDataSourceSchema } from './datasource';


export const mergedGQLSchema = mergeTypeDefs([
  authSchema,
  postgresqlCollectionSchema,
  coreDataSourceSchema
]);
