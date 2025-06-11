import { AppContext } from "@/interfaces/auth.interface";
import { AiQuery } from "@/AI/interface/aiQuery.interface";
import { AiChart } from "@/AI/interface/aiChart.interface";
import { generateChart, getSQLQueryData } from "@/AI/services/chartAI.service";
import { authenticateGraphQLRoute } from "@/utils/token-util";

export const AiChartResolver = {
  Query: {
    async getSQLQueryData(_: undefined, args: {info: AiQuery}, contextValue: AppContext) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { info } = args;
      
      try {
        const result = await getSQLQueryData(info);
        return JSON.stringify(result);
      } catch (error: any) {
        console.error('getSQLQueryData error:', error);
        throw new Error(`Failed to get SQL query data: ${error.message}`);
      }
    }
  },
  Mutation: {
    async generateChart(_: undefined, args: {info: AiChart}, contextValue: AppContext) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { info } = args;
      
      try {
        console.log('Generating chart with info:', info);
        const result = await generateChart(info);
        console.log('Chart generation result:', result);

        if (!result) {
          console.error('generateChart returned null or undefined');
          throw new Error('No chart data generated');
        }
        
        const jsonResult = JSON.stringify(result);
        console.log('Returning JSON result:', jsonResult);
        return jsonResult;
      } catch (error: any) {
        console.error('Chart generation error:', error);
        throw new Error(`Failed to generate chart: ${error.message}`);
      }
    }
  }
};