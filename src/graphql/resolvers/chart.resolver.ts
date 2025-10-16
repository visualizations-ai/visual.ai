import { IChart, ICreateChartInput, IUpdateChartInput, IPoint } from '@/interfaces/chart.interface';
import { AppContext } from '@/interfaces/auth.interface';
import { ChartService } from '../../services/chart.service';
import { authenticateGraphQLRoute } from '@/utils/token-util';

const chartService = new ChartService();

function pointsToEntityData(points: IPoint[]): [number, number][] {
  return points.map(point => [point.x, point.y]);
}

function entityDataToPoints(data: [number, number][]): IPoint[] {
  return data.map(([x, y]) => ({ x, y }));
}

function convertLabelsAndCategories(labels: string[] | null | undefined, categories: string[] | null | undefined) {
  return {
    labels: labels || undefined,
    categories: categories || undefined
  };
}

export const ChartResolvers = {
  Query: {
    async getChart(_: undefined, args: { id: string }, contextValue: AppContext): Promise<IChart> {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      console.log('Resolver: Getting chart:', args.id.slice(0, 8));

      const chartEntity = await chartService.getChart(args.id, `${req.currentUser?.userId}`);
      const { labels, categories } = convertLabelsAndCategories(chartEntity.labels, chartEntity.categories);

      const result: IChart = {
        id: chartEntity.id,
        name: chartEntity.name,
        type: chartEntity.type,
        data: entityDataToPoints(chartEntity.data),
        userId: chartEntity.userId,
        projectId: chartEntity.projectId,
        labels,
        categories,
        createdAt: chartEntity.createdAt,
        updatedAt: chartEntity.updatedAt
      };

      console.log('Resolver: Returning chart:', {
        id: result.id.slice(0, 8),
        name: result.name,
        hasLabels: !!(result.labels && result.labels.length > 0),
        hasCategories: !!(result.categories && result.categories.length > 0)
      });

      return result;
    },

    async getCharts(_: undefined, __: undefined, contextValue: AppContext): Promise<IChart[]> {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      console.log('Resolver: Getting all charts for user:', req.currentUser?.userId);

      const charts = await chartService.getCharts(`${req.currentUser?.userId}`);
      
      const results = charts.map(chart => {
        const { labels, categories } = convertLabelsAndCategories(chart.labels, chart.categories);
        
        return {
          id: chart.id,
          name: chart.name,
          type: chart.type,
          data: entityDataToPoints(chart.data),
          userId: chart.userId,
          projectId: chart.projectId,
          labels,
          categories,
          createdAt: chart.createdAt,
          updatedAt: chart.updatedAt
        };
      });

      console.log('Resolver: Returning charts:', {
        count: results.length,
        charts: results.map(c => ({
          id: c.id.slice(0, 8),
          name: c.name,
          hasLabels: !!(c.labels && c.labels.length > 0),
          hasCategories: !!(c.categories && c.categories.length > 0)
        }))
      });

      return results;
    }
  },

  Mutation: {
    async createChart(
      _: undefined, 
      args: { input: ICreateChartInput }, 
      contextValue: AppContext
    ): Promise<IChart> {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      console.log('Resolver: Creating chart with input:', {
        name: args.input.name,
        type: args.input.type,
        userId: args.input.userId,
        projectId: args.input.projectId,
        hasLabels: !!(args.input.labels && args.input.labels.length > 0),
        hasCategories: !!(args.input.categories && args.input.categories.length > 0),
        dataLength: args.input.data?.length || 0,
        labels: args.input.labels,
        categories: args.input.categories
      });

      const chartEntity = await chartService.createChart(args.input, `${req.currentUser?.userId}`);
      const { labels, categories } = convertLabelsAndCategories(chartEntity.labels, chartEntity.categories);

      const result: IChart = {
        id: chartEntity.id,
        name: chartEntity.name,
        type: chartEntity.type,
        data: entityDataToPoints(chartEntity.data),
        userId: chartEntity.userId,
        projectId: chartEntity.projectId,
        labels,
        categories,
        createdAt: chartEntity.createdAt,
        updatedAt: chartEntity.updatedAt
      };

      console.log('Resolver: Chart created successfully:', {
        id: result.id.slice(0, 8),
        name: result.name,
        hasLabels: !!(result.labels && result.labels.length > 0),
        hasCategories: !!(result.categories && result.categories.length > 0),
        labels: result.labels,
        categories: result.categories
      });

      return result;
    },

    async updateChart(
      _: undefined,
      args: { id: string; input: IUpdateChartInput },
      contextValue: AppContext
    ): Promise<IChart> {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      console.log('Resolver: Updating chart with input:', {
        id: args.id.slice(0, 8),
        hasName: !!args.input.name,
        hasType: !!args.input.type,
        hasData: !!(args.input.data && args.input.data.length > 0),
        hasLabels: !!(args.input.labels && args.input.labels.length > 0),
        hasCategories: !!(args.input.categories && args.input.categories.length > 0)
      });

      const serviceUpdateInput = {
        name: args.input.name,
        type: args.input.type,
        data: args.input.data ? pointsToEntityData(args.input.data) : undefined,
        labels: args.input.labels,
        categories: args.input.categories
      };

      const updatedChart = await chartService.updateChart(
        args.id, 
        serviceUpdateInput,
        `${req.currentUser?.userId}`
      );

      const { labels, categories } = convertLabelsAndCategories(updatedChart.labels, updatedChart.categories);

      const result: IChart = {
        id: updatedChart.id,
        name: updatedChart.name,
        type: updatedChart.type,
        data: entityDataToPoints(updatedChart.data),
        userId: updatedChart.userId,
        projectId: updatedChart.projectId,
        labels,
        categories,
        createdAt: updatedChart.createdAt,
        updatedAt: updatedChart.updatedAt
      };

      console.log('Resolver: Chart updated successfully:', {
        id: result.id.slice(0, 8),
        name: result.name
      });

      return result;
    },

    async deleteChart(
      _: undefined,
      args: { id: string },
      contextValue: AppContext
    ): Promise<{ message: string }> {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      console.log('Resolver: Deleting chart:', args.id.slice(0, 8));

      await chartService.deleteChart(args.id, `${req.currentUser?.userId}`);
      
      console.log('Resolver: Chart deleted successfully');

      return {
        message: `Chart ${args.id} deleted successfully`
      };
    }
  }
};