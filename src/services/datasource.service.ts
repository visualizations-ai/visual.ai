import { AppDataSource } from "@/database/config";
import { Datasource } from "@/entities/datasource.entity";
import { DataSource } from "@/interfaces/auth.interface";
import { DataSourceDocument, DataSourceProjectID } from "@/interfaces/datasource.interface";
import { encrypt, decrypt } from "@/utils/encryption.util";
import { GraphQLError } from "graphql";
import { Not } from "typeorm";

export const createNewDataSource = async (data: DataSourceDocument): Promise<DataSourceDocument> => {
  try {
    const datasourceRepository = AppDataSource.getRepository(Datasource);
    const encryptedData = {
      ...data,
      databaseUrl: data.databaseUrl ? encrypt(data.databaseUrl) : data.databaseUrl,
      databaseName: data.databaseName ? encrypt(data.databaseName) : data.databaseName,
      username: data.username ? encrypt(data.username) : data.username,
      password: data.password ? encrypt(data.password) : data.password
    };
    
    const result = await datasourceRepository.save(encryptedData);
    return result;
  } catch (error: any) {
    throw new GraphQLError(error?.message);
  }
}

export const getDataSourceByProjectId = async(projectid: string): Promise<DataSourceDocument> => {
  try {
    const datasourceRepository = AppDataSource.getRepository(Datasource);
    const result = await datasourceRepository.findOne({
      where: { projectId: projectid }
    }) as unknown as DataSourceDocument;
    
    if (!result) {
      throw new GraphQLError(`Data source with project ID ${projectid} not found`);
    }
    
    return result;
  } catch (error: any) {
    throw new GraphQLError(error?.message);
  }
}

export const getDataSourceById = async(datasourceId: string): Promise<DataSourceDocument> => {
  try {
    const datasourceRepository = AppDataSource.getRepository(Datasource);
    const result = await datasourceRepository.findOne({
      where: { id: datasourceId }
    }) as unknown as DataSourceDocument;
    
    if (!result) {
      throw new GraphQLError(`Data source with ID ${datasourceId} not found`);
    }
    
    return result;
  } catch (error: any) {
    throw new GraphQLError(error?.message);
  }
}

export const getDataSources = async (userid: string): Promise<DataSource[]> => {
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
        database: databaseName && databaseName.length > 0 ? decrypt(databaseName) : ''
      };
    }) as DataSource[];

    return datasources;
  } catch (error: any) {
    throw new GraphQLError(error?.message);
  }
}

export const editDataSource = async (data: DataSourceDocument): Promise<DataSourceProjectID[]> => {
  try {
    const datasourceRepository = AppDataSource.getRepository(Datasource);
    
    const encryptedData = {
      ...data,
      databaseUrl: data.databaseUrl ? encrypt(data.databaseUrl) : data.databaseUrl,
      databaseName: data.databaseName ? encrypt(data.databaseName) : data.databaseName,
      username: data.username ? encrypt(data.username) : data.username,
      password: data.password ? encrypt(data.password) : data.password
    };
    
    await datasourceRepository.update({ id: data.id }, encryptedData);
    const result: DataSourceProjectID[] = await getDataSources(`${data.userId}`);
    return result;
  } catch (error: any) {
    throw new GraphQLError(error?.message);
  }
}

export const deleteDatasource = async (datasourceId: string): Promise<boolean> => {
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
export const updateDataSourceName = async (datasourceId: string, newName: string): Promise<{success: boolean, message: string, dataSource: DataSourceDocument | null}> => {
  try {
    const datasourceRepository = AppDataSource.getRepository(Datasource);
    
    const existingDataSource = await datasourceRepository.findOne({
      where: { id: datasourceId }
    });
    
    if (!existingDataSource) {
      return {
        success: false,
        message: 'Data source not found',
        dataSource: null
      };
    }

    const duplicateCheck = await datasourceRepository.findOne({
      where: { 
        projectId: newName,
        userId: existingDataSource.userId,
        id: Not(datasourceId)
      }
    });

    if (duplicateCheck) {
      return {
        success: false,
        message: 'Project name already exists',
        dataSource: null
      };
    }

    await datasourceRepository.update(
      { id: datasourceId },
      { projectId: newName }
    );

    const updatedDataSource = await datasourceRepository.findOne({
      where: { id: datasourceId }
    });

    return {
      success: true,
      message: 'Data source name updated successfully',
      dataSource: updatedDataSource as DataSourceDocument
    };

  } catch (error: any) {
    console.error('Error updating data source name:', error);
    return {
      success: false,
      message: error?.message || 'Failed to update data source name',
      dataSource: null
    };
  }
}

export const DatasourceService = {
  getDataSources,
  createNewDataSource,
  getDataSourceById,
  getDataSourceByProjectId,
  editDataSource,
  deleteDatasource,
   updateDataSourceName
};