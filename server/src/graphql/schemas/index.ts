import { mergeTypeDefs } from '@graphql-tools/merge';
import { authSchema } from './auth';


export const mergedGQLSchema = mergeTypeDefs([
  authSchema
]);
