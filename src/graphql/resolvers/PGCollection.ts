import { AppContext, DataSource } from "@/interfaces/auth.interface";
import { QueryProp } from "@/interfaces/datasource.interface";
import { DatasourceService } from "@/services/datasource.service";
import { executePostgreSQLQuery, getPostgreSQLCollections } from "@/services/postgresConnection.service";
import { authenticateGraphQLRoute } from "@/utils/token-util";

export const PostgreSQLCollectionResolver = {
  Query: {
    async getPostgreSQLCollections(_: undefined, args: {projectId: string}, contextValue: AppContext) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { projectId } = args;
      const projectIds: DataSource[] = await DatasourceService.getDataSources(`${req.currentUser?.userId}`);
      const collections: string[] = await getPostgreSQLCollections(projectId);
      return {
        projectIds,
        collections
      }
    },
    async getSinglePostgreSQLCollections(_: undefined, args: {projectId: string}, contextValue: AppContext) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { projectId } = args;
      req.session = {
        ...req.session,
        activeProject: { projectId, type: 'postgresql' }
      }
      const collections: string[] = await getPostgreSQLCollections(projectId);
      return collections;
    },
    async executePostgreSQLQuery(_: undefined, args: {data: QueryProp}, contextValue: AppContext) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { data } = args;
      const documents: Record<string, unknown>[] = await executePostgreSQLQuery(data);
      return {
        documents: JSON.stringify(documents)
      };
    }
  }
};
