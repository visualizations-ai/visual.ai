export interface IChart {
  id: string;
  name: string;
  type: string;
  data: number[];
}

export interface ICreateChartInput {
  name: string;
  type: string;
  data: number[];
}

export interface IUpdateChartInput {
  name?: string;
  type?: string;
  data?: number[];
}