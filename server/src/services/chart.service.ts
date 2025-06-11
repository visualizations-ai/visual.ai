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
      },
      order: {
        createdAt: 'DESC'
      }
    });
  }

  async createChart(input: ICreateChartInput, userId: string): Promise<Chart> {
    if (!userId || !input.projectId) {
      throw new Error('userId and projectId are required');
    }

    if (!input.name || !input.type || !input.data) {
      throw new Error('Missing required fields: name, type, and data are required');
    }

    const chartRepository = AppDataSource.getRepository(Chart);
    
    const chartData = input.data.map(point => [point.x, point.y]) as [number, number][];

    const chart = chartRepository.create({
      name: input.name,
      type: input.type,
      data: chartData,
      userId: userId,
      projectId: input.projectId
    });

    return await chartRepository.save(chart);
  }

  async updateChart(chartId: string, input: Partial<Chart>, userId: string): Promise<Chart> {
    const chartRepository = AppDataSource.getRepository(Chart);
    const existingChart = await this.getChart(chartId, userId);

    const { userId: _, projectId: __, ...updateData } = input;

    Object.assign(existingChart, updateData);
    return await chartRepository.save(existingChart);
  }

  async deleteChart(chartId: string, userId: string): Promise<boolean> {
    const chartRepository = AppDataSource.getRepository(Chart);
    const chart = await this.getChart(chartId, userId);

    await chartRepository.remove(chart);
    return true;
  }
}