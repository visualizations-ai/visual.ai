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

// Enhanced localStorage functions with better error handling
const getChartsFromStorage = (userId: string): Chart[] => {
  try {
    const key = `charts_${userId}`;
    const storedCharts = localStorage.getItem(key);
    
    if (storedCharts) {
      const parsed = JSON.parse(storedCharts);
      console.log(`📊 localStorage: Loaded ${parsed.length} charts for user ${userId}`);
      
      // Validate data structure
      const validCharts = parsed.filter((chart: any) => 
        chart && chart.id && chart.name && chart.type && chart.data
      );
      
      if (validCharts.length !== parsed.length) {
        console.warn(`📊 localStorage: Filtered ${parsed.length - validCharts.length} invalid charts`);
      }
      
      return validCharts;
    }
    
    console.log(`📊 localStorage: No charts found for user ${userId}`);
    return [];
  } catch (error) {
    console.error("📊 localStorage: Error reading charts:", error);
    // Clear corrupted data
    try {
      localStorage.removeItem(`charts_${userId}`);
    } catch (clearError) {
      console.error("📊 localStorage: Error clearing corrupted data:", clearError);
    }
    return [];
  }
};

const saveChartsToStorage = (userId: string, charts: Chart[]): boolean => {
  try {
    const key = `charts_${userId}`;
    
    // Filter out temporary charts and validate data
    const realCharts = charts.filter(chart => 
      chart && 
      chart.id && 
      !chart.id.startsWith('temp_') && 
      chart.name && 
      chart.type && 
      chart.data
    );
    
    const dataToSave = JSON.stringify(realCharts);
    localStorage.setItem(key, dataToSave);
    
    console.log(`📊 localStorage: Saved ${realCharts.length} charts for user ${userId}`);
    console.log(`📊 localStorage: Charts saved:`, realCharts.map(c => ({ 
      id: c.id.slice(0, 8), 
      name: c.name 
    })));
    
    // Verify save was successful
    const verification = localStorage.getItem(key);
    if (verification !== dataToSave) {
      throw new Error('localStorage save verification failed');
    }
    
    return true;
  } catch (error) {
    console.error("📊 localStorage: Error saving charts:", error);
    return false;
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

      console.log('📊 Server: Fetching charts from server for user:', userId);
      const response = await client.query({
        query: GET_CHARTS_QUERY,
        fetchPolicy: 'network-only'
      });
      
      const serverCharts = response.data.getCharts || [];
      console.log(`📊 Server: Received ${serverCharts.length} charts from server`);
      
      if (serverCharts.length > 0) {
        console.log('📊 Server: Charts received:', serverCharts.map((c: Chart) => ({ 
          id: c.id.slice(0, 8), 
          name: c.name 
        })));
        
        // Save to localStorage
        saveChartsToStorage(userId, serverCharts);
      }
      
      return serverCharts;
    } catch (error: any) {
      console.error('📊 Server: Error fetching charts:', error);
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

      console.log('📊 Server: Creating chart on server:', {
        name: chartData.name,
        type: chartData.type,
        userId: chartData.userId,
        projectId: chartData.projectId,
        hasLabels: !!(chartData.labels && chartData.labels.length > 0),
        hasCategories: !!(chartData.categories && chartData.categories.length > 0)
      });

      const response = await client.mutate({
        mutation: CREATE_CHART_MUTATION,
        variables: { input: chartData }
      });
      
      if (!response.data?.createChart) {
        throw new Error('No chart data returned from server');
      }
      
      const newChart = response.data.createChart;
      console.log('📊 Server: Chart created successfully on server:', {
        id: newChart.id.slice(0, 8),
        name: newChart.name
      });
      
      // Update localStorage immediately
      if (userId && newChart) {
        const currentCharts = state.charts.charts;
        const updatedCharts = [newChart, ...currentCharts.filter((c: Chart) => c.id !== newChart.id)];
        const saveSuccess = saveChartsToStorage(userId, updatedCharts);
        
        if (!saveSuccess) {
          console.warn('📊 localStorage: Failed to save charts after create');
        }
      }
      
      return newChart;
    } catch (error: any) {
      console.error('📊 Server: Error creating chart:', error);
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

      console.log('📊 Server: Deleting chart:', chartId.slice(0, 8));

      await client.mutate({
        mutation: DELETE_CHART_MUTATION,
        variables: { id: chartId }
      });
      
      console.log('📊 Server: Chart deleted successfully from server');
      
      // Update localStorage
      if (userId) {
        const currentCharts = state.charts.charts.filter(
          (chart: Chart) => chart.id !== chartId
        );
        saveChartsToStorage(userId, currentCharts);
      }
      
      return chartId;
    } catch (error: any) {
      console.error('📊 Server: Error deleting chart:', error);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const chartsSlice = createSlice({
  name: 'charts',
  initialState,
  reducers: {
    addChartOptimistic: (state, action: PayloadAction<Chart>) => {
      console.log('📊 Redux: Adding chart optimistically:', action.payload.name);
      // Remove any existing chart with same name or temp ID
      state.charts = state.charts.filter(chart => 
        chart.id !== action.payload.id && chart.name !== action.payload.name
      );
      // Add new chart at the beginning
      state.charts.unshift(action.payload);
      console.log(`📊 Redux: Total charts after optimistic add: ${state.charts.length}`);
    },
    
    removeChartOptimistic: (state, action: PayloadAction<string>) => {
      const chartToRemove = state.charts.find(chart => chart.id === action.payload);
      console.log('📊 Redux: Removing chart optimistically:', chartToRemove?.name);
      state.charts = state.charts.filter(chart => chart.id !== action.payload);
      console.log(`📊 Redux: Total charts after optimistic remove: ${state.charts.length}`);
    },
    
    updateChartOptimistic: (state, action: PayloadAction<{ id: string; updates: Partial<Chart> }>) => {
      const { id, updates } = action.payload;
      const chartIndex = state.charts.findIndex(chart => chart.id === id);
      if (chartIndex !== -1) {
        state.charts[chartIndex] = { ...state.charts[chartIndex], ...updates };
        console.log('📊 Redux: Chart updated optimistically:', state.charts[chartIndex].name);
      }
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetCharts: (state) => {
      console.log('📊 Redux: Resetting all charts');
      state.charts = [];
      state.loading = false;
      state.error = null;
    },

    loadFromLocalStorage: (state, action: PayloadAction<{ userId: string }>) => {
      const { userId } = action.payload;
      console.log('📊 Redux: Loading charts from localStorage for user:', userId);
      const localCharts = getChartsFromStorage(userId);
      
      if (localCharts.length > 0) {
        // Sort by creation date
        const sortedCharts = [...localCharts].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        state.charts = sortedCharts;
        console.log(`📊 Redux: Loaded ${sortedCharts.length} charts from localStorage`);
        console.log(`📊 Redux: Charts loaded:`, sortedCharts.map(c => ({ 
          id: c.id.slice(0, 8), 
          name: c.name 
        })));
      } else {
        console.log('📊 Redux: No charts found in localStorage');
        state.charts = [];
      }
    },

    syncWithLocalStorage: (state, action: PayloadAction<{ userId: string }>) => {
      const { userId } = action.payload;
      console.log('📊 Redux: Syncing with localStorage for user:', userId);
      const saveSuccess = saveChartsToStorage(userId, state.charts);
      
      if (!saveSuccess) {
        console.error('📊 Redux: Failed to sync with localStorage');
      }
    },

    replaceTemporaryChart: (state, action: PayloadAction<{ tempId: string; realChart: Chart }>) => {
      const { tempId, realChart } = action.payload;
      const chartIndex = state.charts.findIndex(chart => chart.id === tempId);
      
      if (chartIndex !== -1) {
        state.charts[chartIndex] = realChart;
        console.log('📊 Redux: Temporary chart replaced with real chart:', {
          oldId: tempId.slice(0, 8),
          newId: realChart.id.slice(0, 8),
          name: realChart.name
        });
      } else {
        // If temp chart not found, add the real chart
        state.charts.unshift(realChart);
        console.log('📊 Redux: Real chart added (temp not found):', realChart.name);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCharts.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('📊 Redux: Fetching charts from server...');
      })
      .addCase(fetchCharts.fulfilled, (state, action) => {
        state.loading = false;
        const sortedCharts = [...action.payload].sort((a: Chart, b: Chart) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        state.charts = sortedCharts;
        state.error = null;
        console.log(`📊 Redux: Charts fetched successfully: ${sortedCharts.length} charts`);
      })
      .addCase(fetchCharts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        console.error('📊 Redux: Failed to fetch charts:', action.payload);
      });

    builder
      .addCase(createChart.pending, (state) => {
        state.error = null;
        console.log('📊 Redux: Creating chart on server...');
      })
      .addCase(createChart.fulfilled, (state, action) => {
        // Find and replace temporary chart, or add if not found
        const tempChartIndex = state.charts.findIndex(chart => 
          chart.name === action.payload.name && chart.id.startsWith('temp_')
        );
        
        if (tempChartIndex !== -1) {
          state.charts[tempChartIndex] = action.payload;
          console.log('📊 Redux: Replaced temporary chart with server chart:', action.payload.name);
        } else {
          // Remove any duplicates and add the new chart
          state.charts = state.charts.filter(chart => chart.id !== action.payload.id);
          state.charts.unshift(action.payload);
          console.log('📊 Redux: Added new chart from server:', action.payload.name);
        }
        
        state.error = null;
        console.log(`📊 Redux: Total charts after server create: ${state.charts.length}`);
      })
      .addCase(createChart.rejected, (state, action) => {
        state.error = action.payload as string;
        console.error('📊 Redux: Failed to create chart on server:', action.payload);
      });

    builder
      .addCase(deleteChart.pending, (state) => {
        state.error = null;
        console.log('📊 Redux: Deleting chart on server...');
      })
      .addCase(deleteChart.fulfilled, (state, action) => {
        state.error = null;
        console.log('📊 Redux: Chart deleted successfully from server');
      })
      .addCase(deleteChart.rejected, (state, action) => {
        state.error = action.payload as string;
        console.error('📊 Redux: Failed to delete chart on server:', action.payload);
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