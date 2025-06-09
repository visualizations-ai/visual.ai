import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

interface ChartPoint {
  x: number;
  y: number;
}

interface ChartData {
  id: string;
  name: string;
  type: string;
  data: ChartPoint[];
  userId: string;
  matrixData?: {
    title: string;
    matrix: (number | string)[][];
    rowLabels?: string[];
    columnLabels?: string[];
  };
}

interface ChartsState {
  charts: ChartData[];
  loading: boolean;
  error: string | null;
  generatingChart: boolean;
}

const INITIAL_MOCK_CHARTS: ChartData[] = [
  {
    id: "1",
    name: "Total Sales",
    type: "number",
    data: [{ x: 0, y: 1250000 }],
    userId: "1"
  },
  {
    id: "2",
    name: "Monthly Sales",
    type: "bar",
    data: [
      { x: 0, y: 100 },
      { x: 1, y: 150 },
      { x: 2, y: 200 }
    ],
    userId: "1"
  },
  {
    id: "3",
    name: "User Growth",
    type: "line",
    data: [
      { x: 0, y: 50 },
      { x: 1, y: 75 },
      { x: 2, y: 90 }
    ],
    userId: "1"
  },
  {
    id: "4",
    name: "Sales Matrix",
    type: "matrix",
    data: [],
    matrixData: {
      title: "Sales by Region and Month",
      matrix: [
        [1200, 1500, 1700],
        [1100, 1400, 1600],
        [1300, 1550, 1750]
      ],
      rowLabels: ["January", "February", "March"],
      columnLabels: ["North", "South", "East"]
    },
    userId: "1"
  }
];

const initialState: ChartsState = {
  charts: INITIAL_MOCK_CHARTS,
  loading: false,
  error: null,
  generatingChart: false
};

export const fetchCharts = createAsyncThunk(
  'charts/fetchCharts',
  async (userId: string, thunkAPI) => {
    try {
      // const response = await chartsAPI.getCharts(userId);
      // return response.data;
      
      return INITIAL_MOCK_CHARTS;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const createChart = createAsyncThunk(
  'charts/createChart',
  async (chartData: Omit<ChartData, 'id'>, thunkAPI) => {
    try {
      // const response = await chartsAPI.createChart(chartData);
      // return response.data;
      
      const newChart: ChartData = {
        ...chartData,
        id: String(Date.now())
      };
      
      return newChart;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const deleteChart = createAsyncThunk(
  'charts/deleteChart',
  async (chartId: string, thunkAPI) => {
    try {

      // await chartsAPI.deleteChart(chartId);
      
      return chartId;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const chartsSlice = createSlice({
  name: 'charts',
  initialState,
  reducers: {
    addChartOptimistic: (state, action: PayloadAction<ChartData>) => {
      state.charts.push(action.payload);
    },
    
    removeChartOptimistic: (state, action: PayloadAction<string>) => {
      state.charts = state.charts.filter(chart => chart.id !== action.payload);
    },
    
    updateChart: (state, action: PayloadAction<{ id: string; updates: Partial<ChartData> }>) => {
      const { id, updates } = action.payload;
      const chartIndex = state.charts.findIndex(chart => chart.id === id);
      if (chartIndex !== -1) {
        state.charts[chartIndex] = { ...state.charts[chartIndex], ...updates };
      }
    },
    
    setGeneratingChart: (state, action: PayloadAction<boolean>) => {
      state.generatingChart = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetCharts: (state) => {
      state.charts = INITIAL_MOCK_CHARTS;
      state.loading = false;
      state.error = null;
      state.generatingChart = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCharts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCharts.fulfilled, (state, action) => {
        state.loading = false;
        state.charts = action.payload;
        state.error = null;
      })
      .addCase(fetchCharts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createChart.pending, (state) => {
        state.generatingChart = true;
        state.error = null;
      })
      .addCase(createChart.fulfilled, (state, action) => {
        state.generatingChart = false;
        const existingIndex = state.charts.findIndex(chart => chart.id === action.payload.id);
        if (existingIndex === -1) {
          state.charts.push(action.payload);
        }
        state.error = null;
      })
      .addCase(createChart.rejected, (state, action) => {
        state.generatingChart = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(deleteChart.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteChart.fulfilled, (state, action) => {
        state.error = null;
      })
      .addCase(deleteChart.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  }
});

export const {
  addChartOptimistic,
  removeChartOptimistic,
  updateChart,
  setGeneratingChart,
  clearError,
  resetCharts
} = chartsSlice.actions;

export default chartsSlice.reducer;