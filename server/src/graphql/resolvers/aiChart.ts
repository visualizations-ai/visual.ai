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
      const result = await getSQLQueryData(info);
      return JSON.stringify(result);
    },
    async generateChart(_: undefined, args: {info: AiChart}, contextValue: AppContext) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { info } = args;
      const result = await generateChart(info);
      console.log('result', result);
      return JSON.stringify(result);
    }
  },
};
