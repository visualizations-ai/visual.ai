export interface IPoint {
  x: number;
  y: number;
}

export interface IChart {
  id: string;
  name: string;
  type: string;
  data: IPoint[];
  userId: string;
  projectId: string;
  labels?: string[];
  categories?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateChartInput {
  name: string;
  type: string;
  data: IPoint[];
  userId: string;
  projectId: string;
  labels?: string[];
  categories?: string[];
}

export interface IUpdateChartInput {
  name?: string;
  type?: string;
  data?: IPoint[];
  labels?: string[];
  categories?: string[];
}