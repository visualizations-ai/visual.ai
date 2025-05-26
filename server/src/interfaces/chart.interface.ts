export interface IPoint {
  x: number;
  y: number;
}

export interface IChart {
  id: string;
  name: string;
  type: string;
  data: IPoint[];
}

export interface ICreateChartInput {
  name: string;
  type: string;
  data: IPoint[];
  projectId: string;  
}

export interface IUpdateChartInput {
  name?: string;
  type?: string;
  data?: IPoint[];
}
