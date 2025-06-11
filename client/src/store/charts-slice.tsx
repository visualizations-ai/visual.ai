import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import client from '../graphql/apollo-client';
import { GET_CHARTS_QUERY, CREATE_CHART_MUTATION, DELETE_CHART_MUTATION } from '../graphql/charts';

interface ChartPoint {
  x: number;
  y: number;
}

interface Chart {
  id: string;
  name: string;
  type: string;
  data: ChartPoint[];
  userId: string;
  projectId: string;
  labels?: string[];
  categories?: string[];
  matrixData?: {
    title: string;
    matrix: (number | string)[][];
    rowLabels?: string[];
    columnLabels?: string[];
  };
  createdAt: string;
}

interface ChartsState {
  charts: Chart[];
  loading: boolean;
  error: string | null;
}

const initialState: ChartsState = {
  charts: [],
  loading: false,
  error: null
};

// Helper functions for localStorage
const getChartsFromStorage = (userId: string): Chart[] => {
  try {
    const storedCharts = localStorage.getItem(`charts_${userId}`);
    if (storedCharts) {
      const parsed = JSON.parse(storedCharts);
      console.log(`📊 Loaded ${parsed.length} charts from localStorage for user ${userId}`);
      return parsed;
    }
    return [];
  } catch (error) {
    console.error("Error reading charts from localStorage:", error);
    return [];
  }
};

const saveChartsToStorage = (userId: string, charts: Chart[]) => {
  try {
    // שמור רק גרפים שיש להם ID אמיתי (לא זמני)
    const realCharts = charts.filter(chart => !chart.id.startsWith('temp_'));
    localStorage.setItem(`charts_${userId}`, JSON.stringify(realCharts));
    console.log(`💾 Saved ${realCharts.length} charts to localStorage for user ${userId}`);
  } catch (error) {
    console.error("Error saving charts to localStorage:", error);
  }
};

// Async thunks
export const fetchCharts = createAsyncThunk(
  'charts/fetchCharts',
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const userId = state.auth.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('📊 Fetching charts from server');
      const response = await client.query({
        query: GET_CHARTS_QUERY,
        fetchPolicy: 'network-only'
      });
      
      const serverCharts = response.data.getCharts || [];
      console.log(`📊 Received ${serverCharts.length} charts from server`);
      
      // שמור בלוקאל
      saveChartsToStorage(userId, serverCharts);
      
      return serverCharts;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const createChart = createAsyncThunk(
  'charts/createChart',
  async (chartData: any, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const userId = state.auth.user?.id;

      console.log('📊 Creating chart on server:', chartData);

      const response = await client.mutate({
        mutation: CREATE_CHART_MUTATION,
        variables: { input: chartData },
        refetchQueries: [{ query: GET_CHARTS_QUERY }]
      });
      
      const newChart = response.data.createChart;
      console.log('✅ Chart created on server with ID:', newChart.id);
      
      if (userId) {
        const currentCharts = state.charts.charts;
        const updatedCharts = [...currentCharts, newChart];
        saveChartsToStorage(userId, updatedCharts);
      }
      
      return newChart;
    } catch (error: any) {
      console.error('❌ Error creating chart:', error);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const deleteChart = createAsyncThunk(
  'charts/deleteChart',
  async (chartId: string, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const userId = state.auth.user?.id;

      console.log('🗑️ Deleting chart from server:', chartId);

      await client.mutate({
        mutation: DELETE_CHART_MUTATION,
        variables: { id: chartId },
        refetchQueries: [{ query: GET_CHARTS_QUERY }]
      });
      
      console.log('✅ Chart deleted from server');
      
      if (userId) {
        const currentCharts = state.charts.charts.filter(
          (chart: Chart) => chart.id !== chartId
        );
        saveChartsToStorage(userId, currentCharts);
      }
      
      return chartId;
    } catch (error: any) {
      console.error('❌ Error deleting chart:', error);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const chartsSlice = createSlice({
  name: 'charts',
  initialState,
  reducers: {
    addChartOptimistic: (state, action: PayloadAction<Chart>) => {
      // הוסף בתחילת הרשימה כדי שיופיע ראשון
      state.charts.unshift(action.payload);
      console.log('📊 Chart added optimistically:', action.payload.name);
    },
    
    removeChartOptimistic: (state, action: PayloadAction<string>) => {
      const chartToRemove = state.charts.find(chart => chart.id === action.payload);
      state.charts = state.charts.filter(chart => chart.id !== action.payload);
      console.log('🗑️ Chart removed optimistically:', chartToRemove?.name);
    },
    
    updateChartOptimistic: (state, action: PayloadAction<{ id: string; updates: Partial<Chart> }>) => {
      const { id, updates } = action.payload;
      const chartIndex = state.charts.findIndex(chart => chart.id === id);
      if (chartIndex !== -1) {
        state.charts[chartIndex] = { ...state.charts[chartIndex], ...updates };
        console.log('📊 Chart updated optimistically:', state.charts[chartIndex].name);
      }
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetCharts: (state) => {
      state.charts = [];
      state.loading = false;
      state.error = null;
      console.log('🧹 Charts reset');
    },

    loadFromLocalStorage: (state, action: PayloadAction<{ userId: string }>) => {
      const { userId } = action.payload;
      const localCharts = getChartsFromStorage(userId);
      
      if (localCharts.length > 0) {
        // מיין לפי תאריך יצירה (החדשים ראשון)
        const sortedCharts = localCharts.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        state.charts = sortedCharts;
        console.log(`📊 Redux: Loaded ${sortedCharts.length} charts from localStorage`);
      }
    },

    syncWithLocalStorage: (state, action: PayloadAction<{ userId: string }>) => {
      const { userId } = action.payload;
      saveChartsToStorage(userId, state.charts);
    },

    // פונקציה להחלפת גרף זמני בגרף אמיתי מהשרת
    replaceTemporaryChart: (state, action: PayloadAction<{ tempId: string; realChart: Chart }>) => {
      const { tempId, realChart } = action.payload;
      const chartIndex = state.charts.findIndex(chart => chart.id === tempId);
      if (chartIndex !== -1) {
        state.charts[chartIndex] = realChart;
        console.log('🔄 Temporary chart replaced with real chart:', realChart.name);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCharts.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('📊 Fetching charts...');
      })
      .addCase(fetchCharts.fulfilled, (state, action) => {
        state.loading = false;
        // מיין לפי תאריך יצירה (החדשים ראשון)
        const sortedCharts = action.payload.sort((a: Chart, b: Chart) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        state.charts = sortedCharts;
        state.error = null;
        console.log(`✅ Charts fetched successfully: ${sortedCharts.length} charts`);
      })
      .addCase(fetchCharts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        console.error('❌ Failed to fetch charts:', action.payload);
      });

    builder
      .addCase(createChart.pending, (state) => {
        state.error = null;
        console.log('📊 Creating chart...');
      })
      .addCase(createChart.fulfilled, (state, action) => {
        // אל תוסיף כאן כי כבר הוספנו באופן אופטימיסטי
        // רק החלף אם זה גרף זמני
        const existingIndex = state.charts.findIndex(chart => chart.name === action.payload.name);
        if (existingIndex !== -1 && state.charts[existingIndex].id.startsWith('temp_')) {
          state.charts[existingIndex] = action.payload;
        }
        state.error = null;
        console.log('✅ Chart created successfully on server:', action.payload.name);
      })
      .addCase(createChart.rejected, (state, action) => {
        state.error = action.payload as string;
        console.error('❌ Failed to create chart:', action.payload);
      });

    builder
      .addCase(deleteChart.pending, (state) => {
        state.error = null;
        console.log('🗑️ Deleting chart...');
      })
      .addCase(deleteChart.fulfilled, (state, action) => {
        // הגרף כבר הוסר באופן אופטימיסטי
        state.error = null;
        console.log('✅ Chart deleted successfully from server');
      })
      .addCase(deleteChart.rejected, (state, action) => {
        state.error = action.payload as string;
        console.error('❌ Failed to delete chart:', action.payload);
      });
  }
});

export const {
  addChartOptimistic,
  removeChartOptimistic,
  updateChartOptimistic,
  clearError,
  resetCharts,
  loadFromLocalStorage,
  syncWithLocalStorage,
  replaceTemporaryChart
} = chartsSlice.actions;

export default chartsSlice.reducer;