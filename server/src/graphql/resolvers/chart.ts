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
        ...chartEntity,
        data: entityDataToPoints(chartEntity.data)
      };
    },

    async getCharts(_: undefined, __: undefined, contextValue: AppContext): Promise<IChart[]> {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      const charts = await chartService.getCharts(`${req.currentUser?.userId}`);
      return charts.map(chart => ({
        ...chart,
        data: entityDataToPoints(chart.data)
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

      const chartEntity = await chartService.createChart(args.input, `${req.currentUser?.userId}`);

      return {
        ...chartEntity,
        data: entityDataToPoints(chartEntity.data)
      };
    },

    async updateChart(
      _: undefined,
      args: { id: string; input: IUpdateChartInput },
      contextValue: AppContext
    ): Promise<IChart> {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      const updateInput = {
        ...args.input,
        data: args.input.data ? pointsToEntityData(args.input.data) : undefined
      };

      const updatedChart = await chartService.updateChart(
        args.id, 
        updateInput, 
        `${req.currentUser?.userId}`
      );

      return {
        ...updatedChart,
        data: entityDataToPoints(updatedChart.data)
      };
    }
  }
};
