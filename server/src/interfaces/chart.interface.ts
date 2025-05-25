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
  id: string;
  name?: string;
  type?: string;
  data?: number[];
}
