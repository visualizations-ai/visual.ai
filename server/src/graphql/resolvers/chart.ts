import { IChart, ICreateChartInput, IUpdateChartInput } from '@/interfaces/chart.interface';
import { AppContext } from '@/interfaces/auth.interface';
import { ChartService } from '../../services/chart.service';
import { authenticateGraphQLRoute } from '@/utils/token-util';

const chartService = new ChartService();
export const ChartResolvers = {
  Query: {
    async getChart(_: undefined, args: { id: string }, contextValue: AppContext): Promise<IChart> {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      const result: IChart = await chartService.getChart(args.id, `${req.currentUser?.userId}`);
      return result;
    }
  },

  Mutation: {
    async createChart(_: undefined, args: { input: ICreateChartInput }, contextValue: AppContext): Promise<IChart> {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      console.log('createChart called with input:', args.input);
      console.log('Current user ID:', req.currentUser?.userId);

      try {
        const result: IChart = await chartService.createChart(args.input, `${req.currentUser?.userId}`);
        console.log('Chart created successfully:', result);
        return result;
      } catch (error) {
        console.error('Error in createChart:', error);
        throw error;
      }
    },

    async updateChart(
      _: undefined,
      args: { id: string; input: IUpdateChartInput },
      contextValue: AppContext
    ): Promise<IChart> {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      const result: IChart = await chartService.updateChart(args.id, args.input, `${req.currentUser?.userId}`);
      return result;
    },

    async deleteChart(_: undefined, args: { id: string }, contextValue: AppContext): Promise<{ message: string }> {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      await chartService.deleteChart(args.id, `${req.currentUser?.userId}`);
      return { message: 'Chart deleted successfully' };
    }
  }
};
