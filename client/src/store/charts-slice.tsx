import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import client from '../graphql/apollo-client';
import { GET_CHARTS_QUERY, DELETE_CHART_MUTATION } from '../graphql/charts';

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


const getChartsFromStorage = (userId: string): Chart[] => {
  try {
    const key = `charts_${userId}`;
    const storedCharts = localStorage.getItem(key);
    
    if (storedCharts) {
      const parsed = JSON.parse(storedCharts);
      console.log(` localStorage: Loaded ${parsed.length} charts for user ${userId}`);
      
      const validCharts = parsed.filter((chart: any) => 
        chart && chart.id && chart.name && chart.type && chart.data
      );
      
      if (validCharts.length !== parsed.length) {
        console.warn(`ocalStorage: Filtered ${parsed.length - validCharts.length} invalid charts`);
      }
      
      return validCharts;
    }
    
    console.log(` localStorage: No charts found for user ${userId}`);
    return [];
  } catch (error) {
    console.error(" localStorage: Error reading charts:", error);
    try {
      localStorage.removeItem(`charts_${userId}`);
    } catch (clearError) {
      console.error(" localStorage: Error clearing corrupted data:", clearError);
    }
    return [];
  }
};

const saveChartsToStorage = (userId: string, charts: Chart[]): boolean => {
  try {
    const key = `charts_${userId}`;
    
    const realCharts = charts.filter(chart => 
      chart && 
      chart.id && 
      chart.name && 
      chart.type && 
      chart.data
    );
    
    const dataToSave = JSON.stringify(realCharts);
    localStorage.setItem(key, dataToSave);
    
    console.log(` localStorage: Saved ${realCharts.length} charts for user ${userId}`);
    
    const verification = localStorage.getItem(key);
    if (verification !== dataToSave) {
      throw new Error('localStorage save verification failed');
    }
    
    return true;
  } catch (error) {
    console.error(" localStorage: Error saving charts:", error);
    return false;
  }
};


export const fetchCharts = createAsyncThunk(
  'charts/fetchCharts',
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const userId = state.auth.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log(' Server: Fetching charts from server for user:', userId);
      const response = await client.query({
        query: GET_CHARTS_QUERY,
        fetchPolicy: 'network-only'
      });
      
      const serverCharts = response.data.getCharts || [];
      console.log(` Server: Received ${serverCharts.length} charts from server`);
      
      if (serverCharts.length > 0) {
        console.log(' Server: Charts received:', serverCharts.map((c: Chart) => ({ 
          id: c.id.slice(0, 8), 
          name: c.name 
        })));
        
        saveChartsToStorage(userId, serverCharts);
      }
      
      return serverCharts;
    } catch (error: any) {
      console.error(' Server: Error fetching charts:', error);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const deleteChart = createAsyncThunk(
  'charts/deleteChart',
  async (chartId: string, thunkAPI) => {
    try {
      console.log(' Server: Deleting chart:', chartId.slice(0, 8));

      await client.mutate({
        mutation: DELETE_CHART_MUTATION,
        variables: { id: chartId }
      });
      
      console.log(' Server: Chart deleted successfully from server');
      
      return chartId;
    } catch (error: any) {
      console.error('Server: Error deleting chart:', error);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const chartsSlice = createSlice({
  name: 'charts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    resetCharts: (state) => {
      console.log(' Redux: Resetting all charts');
      state.charts = [];
      state.loading = false;
      state.error = null;
    },

    loadFromLocalStorage: (state, action: PayloadAction<{ userId: string }>) => {
      const { userId } = action.payload;
      console.log(' Redux: Loading charts from localStorage for user:', userId);
      const localCharts = getChartsFromStorage(userId);
      
      if (localCharts.length > 0) {
        const sortedCharts = [...localCharts].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        state.charts = sortedCharts;
        console.log(` Redux: Loaded ${sortedCharts.length} charts from localStorage`);
        console.log(` Redux: Charts loaded:`, sortedCharts.map(c => ({ 
          id: c.id.slice(0, 8), 
          name: c.name 
        })));
      } else {
        console.log(' Redux: No charts found in localStorage');
        state.charts = [];
      }
    },

    syncWithLocalStorage: (state, action: PayloadAction<{ userId: string }>) => {
      const { userId } = action.payload;
      console.log(' Redux: Syncing with localStorage for user:', userId);
      const saveSuccess = saveChartsToStorage(userId, state.charts);
      
      if (!saveSuccess) {
        console.error('Redux: Failed to sync with localStorage');
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCharts.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log(' Redux: Fetching charts from server...');
      })
      .addCase(fetchCharts.fulfilled, (state, action) => {
        state.loading = false;
        const sortedCharts = [...action.payload].sort((a: Chart, b: Chart) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        state.charts = sortedCharts;
        state.error = null;
        console.log(`Redux: Charts fetched successfully: ${sortedCharts.length} charts`);
      })
      .addCase(fetchCharts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        console.error(' Redux: Failed to fetch charts:', action.payload);
      });

    builder
      .addCase(deleteChart.pending, (state) => {
        state.error = null;
        console.log(' Redux: Deleting chart on server...');
      })
      .addCase(deleteChart.fulfilled, (state, action) => {
        state.error = null;
        console.log(' Redux: Chart deleted successfully from server');
      })
      .addCase(deleteChart.rejected, (state, action) => {
        state.error = action.payload as string;
        console.error(' Redux: Failed to delete chart on server:', action.payload);
      });
  }
});

export const {
  clearError,
  resetCharts,
  loadFromLocalStorage,
  syncWithLocalStorage
} = chartsSlice.actions;

export default chartsSlice.reducer;