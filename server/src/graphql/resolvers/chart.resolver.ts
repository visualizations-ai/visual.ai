const resolvers = {
  Mutation: {
    generateChart: async (_: any, { info }: { info: AiChartQuery }) => {
      try {
        // Your AI chart generation logic here
        const result = await generateChartLogic(info);
        
        // Make sure to always return a string
        return JSON.stringify(result);
      } catch (error) {
        // Instead of returning null, throw an error
        throw new Error(`Failed to generate chart: ${error.message}`);
      }
    }
  }
};