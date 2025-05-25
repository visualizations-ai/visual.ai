import { AppDataSource } from '@/database/config';
import { Chart } from '../entities/chart.entity';
import { ICreateChartInput, IUpdateChartInput } from '@/interfaces/chart.interface';

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
      throw new Error(`Chart with id ${chartId} not found`);
    }
    return chart;
  }

  async getCharts(userId: string): Promise<Chart[]> {
    const chartRepository = AppDataSource.getRepository(Chart);
    return await chartRepository.find({
      where: {
        userId: userId
      }
    });
  }

  async createChart(input: ICreateChartInput, userId: string): Promise<Chart> {
    console.log('ChartService.createChart called with:', { input, userId });

    if (!userId) {
      throw new Error('userId is required');
    }

    if (!input.name || !input.type || !input.data) {
      throw new Error('Missing required fields: name, type, and data are required');
    }

    const chartRepository = AppDataSource.getRepository(Chart);
    console.log('Repository obtained:', !!chartRepository);

    const chart = chartRepository.create({
      ...input,
      userId: userId
    });

    console.log('Chart created (before save):', chart);

    // וודא שהמסד נתונים מחובר
    if (!AppDataSource.isInitialized) {
      throw new Error('Database is not initialized');
    }

    const savedChart = await chartRepository.save(chart);
    console.log('Chart saved to database:', savedChart);

    return savedChart;
  }

  async updateChart(chartId: string, input: IUpdateChartInput, userId: string): Promise<Chart> {
    const chartRepository = AppDataSource.getRepository(Chart);
    const chart = await this.getChart(chartId, userId);

    Object.assign(chart, input);
    return await chartRepository.save(chart);
  }

  async deleteChart(chartId: string, userId: string): Promise<boolean> {
    const chartRepository = AppDataSource.getRepository(Chart);
    const chart = await this.getChart(chartId, userId);

    await chartRepository.remove(chart);
    return true;
  }
}
