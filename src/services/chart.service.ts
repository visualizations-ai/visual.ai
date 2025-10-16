import { AppDataSource } from '@/database/config';
import { Chart } from '../entities/chart.entity';
import { ICreateChartInput, IUpdateChartInput } from '@/interfaces/chart.interface';
import { GraphQLError } from 'graphql';

// הגדרת interface עבור עדכון Chart entity
interface ChartEntityUpdateInput {
  name?: string;
  type?: string;
  data?: [number, number][];
  labels?: string[];
  categories?: string[];
}

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
      console.log(`📊 Service: Fetching charts for user: ${userId}`);
      
      const charts = await chartRepository.find({
        where: {
          userId: userId
        },
        order: {
          createdAt: 'DESC'
        }
      });

      console.log(`📊 Service: Found ${charts.length} charts for user ${userId}`);
      
      // Log chart details for debugging
      if (charts.length > 0) {
        console.log(`📊 Service: Charts found:`, charts.map(c => ({
          id: c.id.slice(0, 8),
          name: c.name,
          type: c.type,
          hasLabels: !!(c.labels && c.labels.length > 0),
          hasCategories: !!(c.categories && c.categories.length > 0)
        })));
      }
      
      return charts;
    } catch (error: any) {
      console.error('📊 Service: Error fetching charts:', error);
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

      console.log(`📊 Service: Creating chart for user ${userId}:`, {
        name: input.name,
        type: input.type,
        dataLength: chartData.length,
        projectId: input.projectId,
        hasLabels: !!(input.labels && input.labels.length > 0),
        hasCategories: !!(input.categories && input.categories.length > 0),
        labels: input.labels,
        categories: input.categories
      });

      const chart = chartRepository.create({
        name: input.name,
        type: input.type,
        data: chartData,
        userId: userId,
        projectId: input.projectId,
        labels: input.labels || null,
        categories: input.categories || null
      });

      const savedChart = await chartRepository.save(chart);
      console.log(`📊 Service: Chart created successfully with ID: ${savedChart.id}`);
      console.log(`📊 Service: Saved chart details:`, {
        id: savedChart.id.slice(0, 8),
        name: savedChart.name,
        type: savedChart.type,
        labels: savedChart.labels,
        categories: savedChart.categories,
        dataLength: savedChart.data.length
      });
      
      return savedChart;
    } catch (error: any) {
      console.error('📊 Service: Error creating chart:', error);
      throw new GraphQLError(`Failed to create chart: ${error.message}`);
    }
  }

  async updateChart(chartId: string, input: ChartEntityUpdateInput, userId: string): Promise<Chart> {
    try {
      const chartRepository = AppDataSource.getRepository(Chart);
      const existingChart = await this.getChart(chartId, userId);

      console.log(`📊 Service: Updating chart ${chartId} for user ${userId}`, {
        hasName: !!input.name,
        hasType: !!input.type,
        hasData: !!(input.data && input.data.length > 0),
        hasLabels: !!(input.labels && input.labels.length > 0),
        hasCategories: !!(input.categories && input.categories.length > 0)
      });
      
      // עדכון השדות שנשלחו
      if (input.name !== undefined) existingChart.name = input.name;
      if (input.type !== undefined) existingChart.type = input.type;
      if (input.data !== undefined) existingChart.data = input.data;
      if (input.labels !== undefined) existingChart.labels = input.labels;
      if (input.categories !== undefined) existingChart.categories = input.categories;

      const updatedChart = await chartRepository.save(existingChart);
      
      console.log(`📊 Service: Chart ${chartId} updated successfully`);
      return updatedChart;
    } catch (error: any) {
      console.error('📊 Service: Error updating chart:', error);
      throw new GraphQLError(`Failed to update chart: ${error.message}`);
    }
  }

  async deleteChart(chartId: string, userId: string): Promise<boolean> {
    try {
      const chartRepository = AppDataSource.getRepository(Chart);
      
      console.log(`📊 Service: Attempting to delete chart ${chartId.slice(0, 8)} for user ${userId}`);
      
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
      console.log(`📊 Service: Chart ${chartId.slice(0, 8)} deleted successfully`);
      
      return true;
    } catch (error: any) {
      console.error('📊 Service: Error deleting chart:', error);
      throw new GraphQLError(`Failed to delete chart: ${error.message}`);
    }
  }

  async deleteAllChartsForUser(userId: string): Promise<number> {
    try {
      const chartRepository = AppDataSource.getRepository(Chart);
      
      console.log(`📊 Service: Deleting all charts for user ${userId}`);
      
      const result = await chartRepository.delete({ userId });
      const deletedCount = result.affected || 0;
      
      console.log(`📊 Service: Deleted ${deletedCount} charts for user ${userId}`);
      return deletedCount;
    } catch (error: any) {
      console.error('📊 Service: Error deleting all charts for user:', error);
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

      console.log(`📊 Service: Found ${charts.length} charts for project ${projectId}`);
      return charts;
    } catch (error: any) {
      console.error('📊 Service: Error fetching charts by project:', error);
      throw new GraphQLError(`Failed to fetch charts: ${error.message}`);
    }
  }
}