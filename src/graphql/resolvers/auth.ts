import { AppContext, Auth, DataSource } from "@/interfaces/auth.interface";
import { AuthPayload } from "@/interfaces/datasource.interface";
import { getPostgreSQLCollections } from "@/services/postgresConnection.service";
import { login, register, logout } from "@/services/auth/auth.service";
import { DatasourceService } from "@/services/datasource.service";
import { authenticateGraphQLRoute } from "@/utils/token-util";

export const AuthResolver = {
  Query: {
    async checkCurrentUser(_: undefined, __: undefined, contextValue: AppContext) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      let collections: string[] = [];
      const result: DataSource[] = await DatasourceService.getDataSources(`${req.currentUser?.userId}`);

      if (result.length > 0) {
        const activeProject = req.currentUser?.activeProject ?? result[0];
        if (activeProject.type === 'postgresql') {
          collections = await getPostgreSQLCollections(activeProject.projectId);
        }
      }

      return {
        user: {
          id: req.currentUser?.userId,
          email: req.currentUser?.email
        },
        projectIds: result,
        collections
      };
    }
  },

  Mutation: {
    async loginUser(_: undefined, args: { email: string; password: string }, contextValue: AppContext) {
      const user: Auth = { email: args.email, password: args.password };
      const result: AuthPayload = await login(user, contextValue);
      return result;
    },

    async registerUser(_: undefined, args: { user: Auth }, contextValue: AppContext) {
      const result: AuthPayload = await register(args.user, contextValue);
      return result;
    },

    async logout(_: undefined, __: undefined, contextValue: AppContext) {
      const message: string = logout(contextValue);
      return { message };
    }
  }
};
