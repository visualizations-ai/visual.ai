import { AuthResolver } from "./auth";
import {ChartResolvers} from "./chart";


export const mergedGQLResolvers = [
  AuthResolver
  , ChartResolvers
];