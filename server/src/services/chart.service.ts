import { AppDataSource } from "@/database/config";
import { Chart } from "../entities/chart.entity";
import { ICreateChartInput, IUpdateChartInput } from "@/interfaces/chart.interface";

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

    async createChart(input: ICreateChartInput, userId: string): Promise<Chart> {
        const chartRepository = AppDataSource.getRepository(Chart);
        const chart = chartRepository.create({
            ...input,
            userId: userId
        });
        return await chartRepository.save(chart);
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