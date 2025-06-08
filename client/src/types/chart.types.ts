// Chart data types matching GraphQL schema exactly
export interface ChartPoint {
  x: number;
  y: number;
}

export interface ChartData {
  id: string;
  name: string;
  type: 'bar' | 'line' | 'pie';
  data: ChartPoint[];
  projectId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateChartInput {
  name: string;
  type: 'bar' | 'line' | 'pie';
  data: ChartPoint[];
  projectId: string;
}

export interface UpdateChartInput {
  name?: string;
  type?: 'bar' | 'line' | 'pie';
  data?: ChartPoint[];
}

// Chart.js specific types for rendering
export interface ChartJSDataset {
  label?: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

export interface ChartJSData {
  labels: string[];
  datasets: ChartJSDataset[];
}

// Form for creating new charts
export interface NewChartForm {
  name: string;
  prompt: string;
  type: 'bar' | 'line' | 'pie';
}