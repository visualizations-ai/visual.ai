import { mergeTypeDefs } from '@graphql-tools/merge';
import { authSchema } from './auth';
import{ chartSchema } from './chart';


export const mergedGQLSchema = mergeTypeDefs([
  authSchema,
  chartSchema
]);
