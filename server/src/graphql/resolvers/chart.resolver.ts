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

export const ChartResolvers = {
  Query: {
    async getChart(_: undefined, args: { id: string }, contextValue: AppContext): Promise<IChart> {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      const chartEntity = await chartService.getChart(args.id, `${req.currentUser?.userId}`);

      return {
        id: chartEntity.id,
        name: chartEntity.name,
        type: chartEntity.type,
        data: entityDataToPoints(chartEntity.data),
        userId: chartEntity.userId,
        projectId: chartEntity.projectId,
        labels: chartEntity.labels || [],
        categories: chartEntity.categories || [],
        createdAt: chartEntity.createdAt,
        updatedAt: chartEntity.updatedAt
      };
    },

    async getCharts(_: undefined, __: undefined, contextValue: AppContext): Promise<IChart[]> {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      const charts = await chartService.getCharts(`${req.currentUser?.userId}`);
      
      return charts.map(chart => ({
        id: chart.id,
        name: chart.name,
        type: chart.type,
        data: entityDataToPoints(chart.data),
        userId: chart.userId,
        projectId: chart.projectId,
        labels: chart.labels || [],
        categories: chart.categories || [],
        createdAt: chart.createdAt,
        updatedAt: chart.updatedAt
      }));
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

      console.log('🎯 Creating chart with input:', {
        name: args.input.name,
        type: args.input.type,
        hasLabels: !!(args.input.labels && args.input.labels.length > 0),
        hasCategories: !!(args.input.categories && args.input.categories.length > 0),
        dataLength: args.input.data?.length || 0
      });

      const chartEntity = await chartService.createChart(args.input, `${req.currentUser?.userId}`);

      return {
        id: chartEntity.id,
        name: chartEntity.name,
        type: chartEntity.type,
        data: entityDataToPoints(chartEntity.data),
        userId: chartEntity.userId,
        projectId: chartEntity.projectId,
        labels: chartEntity.labels || [],
        categories: chartEntity.categories || [],
        createdAt: chartEntity.createdAt,
        updatedAt: chartEntity.updatedAt
      };
    },

    async updateChart(
      _: undefined,
      args: { id: string; input: IUpdateChartInput },
      contextValue: AppContext
    ): Promise<IChart> {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      console.log('🎯 Updating chart with input:', {
        id: args.id,
        hasName: !!args.input.name,
        hasType: !!args.input.type,
        hasData: !!(args.input.data && args.input.data.length > 0),
        hasLabels: !!(args.input.labels && args.input.labels.length > 0),
        hasCategories: !!(args.input.categories && args.input.categories.length > 0)
      });

      const updatedChart = await chartService.updateChart(
        args.id, 
        args.input,
        `${req.currentUser?.userId}`
      );

      return {
        id: updatedChart.id,
        name: updatedChart.name,
        type: updatedChart.type,
        data: entityDataToPoints(updatedChart.data),
        userId: updatedChart.userId,
        projectId: updatedChart.projectId,
        labels: updatedChart.labels || [],
        categories: updatedChart.categories || [],
        createdAt: updatedChart.createdAt,
        updatedAt: updatedChart.updatedAt
      };
    },

    async deleteChart(
      _: undefined,
      args: { id: string },
      contextValue: AppContext
    ): Promise<{ message: string }> {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      console.log('🗑️ Deleting chart:', args.id);

      await chartService.deleteChart(args.id, `${req.currentUser?.userId}`);
      
      return {
        message: `Chart ${args.id} deleted successfully`
      };
    }
  }
};