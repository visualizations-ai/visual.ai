import type{ ChartData, ChartPoint, ChartJSData } from '../types/chart.types';

export const convertAIToChartJS = (chartConfig: any, chartType: string): ChartJSData => {
  const { chart } = chartConfig;
  
  switch (chartType) {
    case 'number':
      return { labels: [], datasets: [] };
      
    case 'matrix':
      return { labels: [], datasets: [] };
      
    case 'bar':
    case 'line':
      return {
        labels: chart.data?.map((item: any) => item[chart.xAxis]) || [],
        datasets: [{
          label: chart.yAxis || 'Value',
          data: chart.data?.map((item: any) => item[chart.yAxis]) || [],
          backgroundColor: chartType === 'bar' ? 'rgba(99, 102, 241, 0.5)' : undefined,
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 2,
          fill: chartType === 'line' ? false : undefined
        }]
      };
    
    case 'pie':
    case 'doughnut':
      return {
        labels: chart.data?.map((item: any) => item.segment || item[chart.xAxis]) || [],
        datasets: [{
          data: chart.data?.map((item: any) => item.value || item[chart.yAxis]) || [],
          backgroundColor: chart.data?.map((item: any, index: number) => 
            item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`
          ) || []
        }]
      };
    
    default:
      return { labels: [], datasets: [] };
  }
};


export const convertChartJSToGraphQL = (chartJSData: ChartJSData, chartType: string): ChartPoint[] => {
  const points: ChartPoint[] = [];
  
  if (chartType === 'pie' || chartType === 'doughnut') {
    chartJSData.datasets[0].data.forEach((value: number, index: number) => {
      points.push({ x: index, y: value });
    });
  } else {
    chartJSData.datasets[0].data.forEach((value: number, index: number) => {
      points.push({ x: index, y: value });
    });
  }
  
  return points;
};


export const convertGraphQLToChartJS = (chart: ChartData): ChartJSData => {
  const labels = chart.data.map((point, index) => `Item ${index + 1}`);
  const data = chart.data.map(point => point.y);
  
  switch (chart.type) {
    case 'number':
      return { labels: [], datasets: [] };
      
    case 'matrix':
      return { labels: [], datasets: [] };
      
    case 'bar':
      return {
        labels,
        datasets: [{
          label: chart.name,
          data,
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 2
        }]
      };
    
    case 'line':
      return {
        labels,
        datasets: [{
          label: chart.name,
          data,
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 2,
          fill: false
        }]
      };
    
    case 'pie':
    case 'doughnut':
      return {
        labels,
        datasets: [{
          data,
          backgroundColor: labels.map((_, index) => 
            `hsl(${(index * 137.5) % 360}, 70%, 50%)`
          )
        }]
      };
    
    default:
      return { labels: [], datasets: [] };
  }
};


export const exportChart = (chart: ChartData): void => {
  const dataStr = JSON.stringify(chart, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${chart.name.replace(/\s+/g, '_')}_chart.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};