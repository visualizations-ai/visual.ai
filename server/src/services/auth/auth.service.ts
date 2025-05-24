
import { AppDataSource } from "@/database/config";
import { User } from "@/entities/user.entity";
import { AppContext, ActiveProject, Auth, DataSource, TokenPayload } from "@/interfaces/auth.interface";
import { validateUser } from "@/services/auth/validation.service";
import { hashPassword, verifyPassword } from "@/utils/utils";
import { generateAccessToken } from "@/utils/token-util";
import { GraphQLError } from "graphql";
import { AuthPayload } from "@/interfaces/datasource.interface";
import { DatasourceService } from "../datasource.service";
import { getPostgreSQLCollections } from "@/services/postgresConnection.service";

export const register = async (input: Auth, context: AppContext): Promise<AuthPayload> => {
  const userRepository = AppDataSource.getRepository(User);
  const { email, password } = input;
  const { req } = context;

 await validateUser(input, userRepository, 'register');

  const hashedPassword = await hashPassword(password);
  const user = userRepository.create({ email, password: hashedPassword });
  const savedUser = await userRepository.save(user);

  const payload: TokenPayload = {
    userId: savedUser.id,
    email: savedUser.email,
    activeProject: {} as ActiveProject
  };
  const accessToken = generateAccessToken(payload);
  req.session = { access: accessToken };

  return {
    projectIds: [],
    collections: [],
    user: {
      id: savedUser.id,
      email: savedUser.email
    }
  };
};

export const login = async (input: Auth, context: AppContext): Promise<AuthPayload> => {
  const userRepository = AppDataSource.getRepository(User);
  const { email, password } = input;
  const { req } = context;

   await validateUser(input, userRepository, 'login');

  const user = await userRepository.findOne({ where: { email } });
  if (!user) {
    throw new GraphQLError('Invalid credentials');
  }

  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    throw new GraphQLError('Invalid credentials');
  }

  const dataSources = await DatasourceService.getDataSources(`${user.id}`);

  let activeProject: ActiveProject = {} as ActiveProject;
  let collections: string[] = [];

  if (dataSources.length > 0) {
    activeProject = {
      projectId: dataSources[0].projectId,
      type: dataSources[0].type
    };
    if (activeProject.type === 'postgresql') {
      collections = await getPostgreSQLCollections(activeProject.projectId);
    }
  }

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    activeProject
  };
  const accessToken = generateAccessToken(payload);
  req.session = { access: accessToken };

  return {
    projectIds: dataSources,
    collections,
    user: {
      id: user.id,
      email: user.email
    }
  };
};

export const logout = (context: AppContext): string => {
  const { req } = context;
  req.session = null;
  req.currentUser = undefined;
  return 'Logout successful';
};
