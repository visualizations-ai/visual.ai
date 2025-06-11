export interface ChartPoint {
  x: number;
  y: number;
}

export interface ChartData {
  id: string;
  name: string;
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'number' | 'matrix';
  data: ChartPoint[];
  projectId: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  matrixData?: {
    title: string;
    matrix: (number | string)[][];
    rowLabels?: string[];
    columnLabels?: string[];
  };
}

export interface CreateChartInput {
  name: string;
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'number' | 'matrix';
  data: ChartPoint[];
  projectId: string;
  userId: string;
  matrixData?: {
    title: string;
    matrix: (number | string)[][];
    rowLabels?: string[];
    columnLabels?: string[];
  };
}

export interface UpdateChartInput {
  name?: string;
  type?: 'bar' | 'line' | 'pie' | 'doughnut' | 'number' | 'matrix';
  data?: ChartPoint[];
  matrixData?: {
    title: string;
    matrix: (number | string)[][];
    rowLabels?: string[];
    columnLabels?: string[];
  };
}

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

export interface NewChartForm {
  name: string;
  prompt: string;
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'number' | 'matrix';
}