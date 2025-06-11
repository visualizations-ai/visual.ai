import { AppDataSource } from '@/database/config';
import { Chart } from '../entities/chart.entity';
import { ICreateChartInput, IUpdateChartInput } from '@/interfaces/chart.interface';
import { GraphQLError } from 'graphql';

// עדכון ה-Chart Resolver
export const ChartResolvers = {
  Query: {
    async getChart(_: undefined, args: { id: string }, contextValue: any): Promise<any> {
      const { req } = contextValue;
      if (!req.currentUser?.userId) {
        throw new GraphQLError('Authentication required');
      }

      const chartService = new ChartService();
      const chartEntity = await chartService.getChart(args.id, req.currentUser.userId);

      return {
        ...chartEntity,
        data: chartEntity.data.map(([x, y]) => ({ x, y })),
        createdAt: chartEntity.createdAt.toISOString(),
        updatedAt: chartEntity.updatedAt.toISOString()
      };
    },

    async getCharts(_: undefined, __: undefined, contextValue: any): Promise<any[]> {
      const { req } = contextValue;
      if (!req.currentUser?.userId) {
        throw new GraphQLError('Authentication required');
      }

      const chartService = new ChartService();
      const charts = await chartService.getCharts(req.currentUser.userId);
      
      return charts.map(chart => ({
        ...chart,
        data: chart.data.map(([x, y]) => ({ x, y })),
        createdAt: chart.createdAt.toISOString(),
        updatedAt: chart.updatedAt.toISOString()
      }));
    }
  },

  Mutation: {
    async createChart(
      _: undefined, 
      args: { input: ICreateChartInput }, 
      contextValue: any
    ): Promise<any> {
      const { req } = contextValue;
      if (!req.currentUser?.userId) {
        throw new GraphQLError('Authentication required');
      }

      const chartService = new ChartService();
      const chartEntity = await chartService.createChart(args.input, req.currentUser.userId);

      return {
        ...chartEntity,
        data: chartEntity.data.map(([x, y]) => ({ x, y })),
        createdAt: chartEntity.createdAt.toISOString(),
        updatedAt: chartEntity.updatedAt.toISOString()
      };
    },

    async updateChart(
      _: undefined,
      args: { id: string; input: IUpdateChartInput },
      contextValue: any
    ): Promise<any> {
      const { req } = contextValue;
      if (!req.currentUser?.userId) {
        throw new GraphQLError('Authentication required');
      }

      const chartService = new ChartService();
      
      const updateInput = {
        ...args.input,
        data: args.input.data ? args.input.data.map(point => [point.x, point.y]) as [number, number][] : undefined
      };

      const updatedChart = await chartService.updateChart(
        args.id, 
        updateInput, 
        req.currentUser.userId
      );

      return {
        ...updatedChart,
        data: updatedChart.data.map(([x, y]) => ({ x, y })),
        createdAt: updatedChart.createdAt.toISOString(),
        updatedAt: updatedChart.updatedAt.toISOString()
      };
    },

    async deleteChart(
      _: undefined,
      args: { id: string },
      contextValue: any
    ): Promise<{ message: string }> {
      const { req } = contextValue;
      if (!req.currentUser?.userId) {
        throw new GraphQLError('Authentication required');
      }

      const chartService = new ChartService();
      await chartService.deleteChart(args.id, req.currentUser.userId);
      
      return {
        message: "Chart deleted successfully"
      };
    }
  }
};

export class ChartService {
  async getChart(chartId: string, userId: string): Promise<Chart> {
    const chartRepository = AppDataSource.getRepository(Chart);
    const chart = await chartRepository.findOne({
      where: {
        id: chartId,
        userId: userId
      }
    });

    if (!chart) {
      throw new GraphQLError(`Chart with id ${chartId} not found`);
    }
    return chart;
  }

  async getCharts(userId: string): Promise<Chart[]> {
    try {
      const chartRepository = AppDataSource.getRepository(Chart);
      console.log(`📊 Fetching charts for user: ${userId}`);
      
      const charts = await chartRepository.find({
        where: {
          userId: userId
        },
        order: {
          createdAt: 'DESC'
        }
      });

      console.log(`📊 Found ${charts.length} charts for user ${userId}`);
      return charts;
    } catch (error: any) {
      console.error('Error fetching charts:', error);
      throw new GraphQLError(`Failed to fetch charts: ${error.message}`);
    }
  }

  async createChart(input: ICreateChartInput, userId: string): Promise<Chart> {
    try {
      if (!userId || !input.projectId) {
        throw new GraphQLError('userId and projectId are required');
      }

      if (!input.name || !input.type || !input.data) {
        throw new GraphQLError('Missing required fields: name, type, and data are required');
      }

      const chartRepository = AppDataSource.getRepository(Chart);
      
      // המרת הנתונים לפורמט של המסד נתונים
      const chartData = input.data.map(point => [point.x, point.y]) as [number, number][];

      console.log(`📊 Creating chart for user ${userId}:`, {
        name: input.name,
        type: input.type,
        dataLength: chartData.length,
        projectId: input.projectId
      });

      const chart = chartRepository.create({
        name: input.name,
        type: input.type,
        data: chartData,
        userId: userId,
        projectId: input.projectId
      });

      const savedChart = await chartRepository.save(chart);
      console.log(`✅ Chart created successfully with ID: ${savedChart.id}`);
      
      return savedChart;
    } catch (error: any) {
      console.error('Error creating chart:', error);
      throw new GraphQLError(`Failed to create chart: ${error.message}`);
    }
  }

  async updateChart(chartId: string, input: Partial<Chart>, userId: string): Promise<Chart> {
    try {
      const chartRepository = AppDataSource.getRepository(Chart);
      const existingChart = await this.getChart(chartId, userId);

      // הסרת שדות שלא ניתן לעדכן
      const { userId: _, projectId: __, ...updateData } = input;

      console.log(`📊 Updating chart ${chartId} for user ${userId}`);
      
      Object.assign(existingChart, updateData);
      const updatedChart = await chartRepository.save(existingChart);
      
      console.log(`✅ Chart ${chartId} updated successfully`);
      return updatedChart;
    } catch (error: any) {
      console.error('Error updating chart:', error);
      throw new GraphQLError(`Failed to update chart: ${error.message}`);
    }
  }

  async deleteChart(chartId: string, userId: string): Promise<boolean> {
    try {
      const chartRepository = AppDataSource.getRepository(Chart);
      
      console.log(`🗑️ Attempting to delete chart ${chartId} for user ${userId}`);
      
      // וודא שהגרף קיים ושייך למשתמש
      const chart = await chartRepository.findOne({
        where: {
          id: chartId,
          userId: userId
        }
      });

      if (!chart) {
        throw new GraphQLError(`Chart with id ${chartId} not found or does not belong to user`);
      }

      await chartRepository.remove(chart);
      console.log(`✅ Chart ${chartId} deleted successfully`);
      
      return true;
    } catch (error: any) {
      console.error('Error deleting chart:', error);
      throw new GraphQLError(`Failed to delete chart: ${error.message}`);
    }
  }

  async deleteAllChartsForUser(userId: string): Promise<number> {
    try {
      const chartRepository = AppDataSource.getRepository(Chart);
      
      console.log(`🗑️ Deleting all charts for user ${userId}`);
      
      const result = await chartRepository.delete({ userId });
      const deletedCount = result.affected || 0;
      
      console.log(`✅ Deleted ${deletedCount} charts for user ${userId}`);
      return deletedCount;
    } catch (error: any) {
      console.error('Error deleting all charts for user:', error);
      throw new GraphQLError(`Failed to delete charts: ${error.message}`);
    }
  }

  async getChartsByProject(projectId: string, userId: string): Promise<Chart[]> {
    try {
      const chartRepository = AppDataSource.getRepository(Chart);
      
      const charts = await chartRepository.find({
        where: {
          projectId: projectId,
          userId: userId
        },
        order: {
          createdAt: 'DESC'
        }
      });

      console.log(`📊 Found ${charts.length} charts for project ${projectId}`);
      return charts;
    } catch (error: any) {
      console.error('Error fetching charts by project:', error);
      throw new GraphQLError(`Failed to fetch charts: ${error.message}`);
    }
  }
}