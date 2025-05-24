
import { AppDataSource } from "@/database/config";
import { Datasource } from "@/entities/datasource.entity";
import { DataSource } from "@/interfaces/auth.interface";
import { DataSourceDocument, DataSourceProjectID } from "@/interfaces/datasource.interface";
import { decodeBase64 } from "@/utils/utils";
import { GraphQLError } from "graphql";

export  const createNewDataSource = async (data: DataSourceDocument): Promise<DataSourceDocument> => {
  try {
    const datasourceRepository = AppDataSource.getRepository(Datasource);
    const result = await datasourceRepository.save(data);
    return result;
  } catch (error: any) {
    throw new GraphQLError(error?.message);
  }
}

export  const getDataSourceByProjectId = async(projectid: string): Promise<DataSourceDocument> => {
  try {
    const datasourceRepository = AppDataSource.getRepository(Datasource);
    const result = await datasourceRepository.findOne({
      where: { projectId: projectid }
    }) as unknown as DataSourceDocument;
    return result;
  } catch (error: any) {
    throw new GraphQLError(error?.message);
  }
}

export  const getDataSourceById = async(datasourceId: string): Promise<DataSourceDocument> => {
  try {
    const datasourceRepository = AppDataSource.getRepository(Datasource);
    const result = await datasourceRepository.findOne({
      where: { id: datasourceId }
    }) as unknown as DataSourceDocument;
    return result;
  } catch (error: any) {
    throw new GraphQLError(error?.message);
  }
}

export  const getDataSources = async (userid: string): Promise<DataSource[]> => {
  try {
    const datasourceRepository = AppDataSource.getRepository(Datasource);


    const result: DataSourceDocument[] = await datasourceRepository.find({
      where: { userId: userid },
      order: { createdAt: 'DESC' }
    }) as unknown as DataSourceDocument[];

    const datasources: DataSource[] = result.map((item) => {
      const { id, projectId, type, databaseName } = item;
      return {
        id,
        projectId,
        type,
        database: databaseName && databaseName.length > 0 ? decodeBase64(databaseName) : ''
      };
    }) as DataSource[];

    return datasources;
  } catch (error: any) {
    throw new GraphQLError(error?.message);
  }
}

export  const editDataSource = async (data: DataSourceDocument): Promise<DataSourceProjectID[]> => {
  try {
    const datasourceRepository = AppDataSource.getRepository(Datasource);
    await datasourceRepository.update({ id: data.id }, data);
    const result: DataSourceProjectID[] = await getDataSources(`${data.userId}`);
    return result;
  } catch (error: any) {
    throw new GraphQLError(error?.message);
  }
}

export  const deleteDatasource = async (datasourceId: string): Promise<boolean> => {
  const queryRunner = AppDataSource.createQueryRunner();
  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    await queryRunner.manager.delete(Datasource, {
      id: datasourceId
    });

    await queryRunner.commitTransaction();
    return true;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw new GraphQLError('Failed to delete datasource');
  } finally {
    await queryRunner.release();
  }
}

export const DatasourceService = {
  getDataSources,
  createNewDataSource,
  getDataSourceById,
  getDataSourceByProjectId,
  editDataSource,
  deleteDatasource
};
