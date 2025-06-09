import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import client from '../graphql/apollo-client';
import { GET_DATA_SOURCES, CREATE_DATASOURCE, DELETE_DATASOURCE } from '../graphql/data-sources';

interface DataSource {
  id: string;
  projectId: string;
  type: string;
  database: string;
}

interface DataSourcesState {
  dataSources: DataSource[];
  selectedDataSource: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: DataSourcesState = {
  dataSources: [],
  selectedDataSource: null,
  loading: false,
  error: null
};

const getDataSourcesFromStorage = (userId: string) => {
  try {
    const storedData = localStorage.getItem(`dataSources_${userId}`);
    const storedMeta = localStorage.getItem(`dataSourcesMeta_${userId}`);
    
    if (storedData && storedMeta) {
      const meta = JSON.parse(storedMeta);
      const data = JSON.parse(storedData);
      
      const isDataFresh = (Date.now() - meta.lastUpdated) < (24 * 60 * 60 * 1000);
      
      if (isDataFresh) {
        console.log(` Redux: Loading ${data.length} data sources from localStorage`);
        return { data, isFresh: true };
      } else {
        console.log(' Redux: Local data is stale, will fetch from server');
        return { data: null, isFresh: false };
      }
    }
  } catch (error) {
    console.error("Redux: Error reading from localStorage:", error);
  }
  return { data: null, isFresh: false };
};

const saveDataSourcesToStorage = (userId: string, dataSources: DataSource[]) => {
  try {
    localStorage.setItem(`dataSources_${userId}`, JSON.stringify(dataSources));
    localStorage.setItem(`dataSourcesMeta_${userId}`, JSON.stringify({
      lastUpdated: Date.now(),
      count: dataSources.length
    }));
    console.log(` Redux: Saved ${dataSources.length} data sources to localStorage`);
  } catch (error) {
    console.error("Redux: Error saving to localStorage:", error);
  }
};

export const fetchDataSources = createAsyncThunk(
  'dataSources/fetchDataSources',
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const userId = state.auth.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data: localData, isFresh } = getDataSourcesFromStorage(userId);
      
      if (localData && isFresh) {
        console.log(' Redux: Using fresh data from localStorage');
        return localData;
      }

     
      console.log(' Redux: Fetching fresh data from server');
      const response = await client.query({
        query: GET_DATA_SOURCES,
        fetchPolicy: 'network-only' 
      });
      
      const serverData = response.data.getDataSources?.dataSource || [];
      

      saveDataSourcesToStorage(userId, serverData);
      
      return serverData;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const createDataSource = createAsyncThunk(
  'dataSources/createDataSource',
  async (dataSourceData: any, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const userId = state.auth.user?.id;

      const response = await client.mutate({
        mutation: CREATE_DATASOURCE,
        variables: { source: dataSourceData },
        refetchQueries: [{ query: GET_DATA_SOURCES }]
      });
      
      const newDataSources = response.data.createPostgresqlDataSource?.dataSource || [];
      
      if (userId) {
        saveDataSourcesToStorage(userId, newDataSources);
      }
      
      return newDataSources;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const deleteDataSource = createAsyncThunk(
  'dataSources/deleteDataSource',
  async (dataSourceId: string, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const userId = state.auth.user?.id;

      await client.mutate({
        mutation: DELETE_DATASOURCE,
        variables: { datasourceId: dataSourceId },
        refetchQueries: [{ query: GET_DATA_SOURCES }]
      });
      
      if (userId) {
        const currentDataSources = state.dataSources.dataSources.filter(
          (ds: DataSource) => ds.id !== dataSourceId
        );
        saveDataSourcesToStorage(userId, currentDataSources);
      }
      
      return dataSourceId;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const dataSourcesSlice = createSlice({
  name: 'dataSources',
  initialState,
  reducers: {
    setSelectedDataSource: (state, action: PayloadAction<string | null>) => {
      state.selectedDataSource = action.payload;
    },
    
    addDataSourceOptimistic: (state, action: PayloadAction<DataSource>) => {
      state.dataSources.push(action.payload);
    },
    
    removeDataSourceOptimistic: (state, action: PayloadAction<string>) => {
      state.dataSources = state.dataSources.filter(ds => ds.id !== action.payload);
      if (state.selectedDataSource === action.payload) {
        state.selectedDataSource = state.dataSources.length > 0 ? state.dataSources[0].id : null;
      }
    },
    
    updateDataSourceOptimistic: (state, action: PayloadAction<{ id: string; updates: Partial<DataSource> }>) => {
      const { id, updates } = action.payload;
      const dsIndex = state.dataSources.findIndex(ds => ds.id === id);
      if (dsIndex !== -1) {
        state.dataSources[dsIndex] = { ...state.dataSources[dsIndex], ...updates };
      }
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetDataSources: (state) => {
      state.dataSources = [];
      state.selectedDataSource = null;
      state.loading = false;
      state.error = null;
    },

    loadFromLocalStorage: (state, action: PayloadAction<{ userId: string }>) => {
      const { userId } = action.payload;
      const { data: localData } = getDataSourcesFromStorage(userId);
      
      if (localData) {
        state.dataSources = localData;
        if (!state.selectedDataSource && localData.length > 0) {
          state.selectedDataSource = localData[0].id;
        }
        console.log(` Redux: Loaded ${localData.length} data sources from localStorage`);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDataSources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDataSources.fulfilled, (state, action) => {
        state.loading = false;
        state.dataSources = action.payload;
        state.error = null;
        
        if (!state.selectedDataSource && action.payload.length > 0) {
          state.selectedDataSource = action.payload[0].id;
        }
      })
      .addCase(fetchDataSources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createDataSource.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDataSource.fulfilled, (state, action) => {
        state.loading = false;
        state.dataSources = action.payload;
        state.error = null;
      })
      .addCase(createDataSource.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(deleteDataSource.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteDataSource.fulfilled, (state, action) => {
        state.dataSources = state.dataSources.filter(ds => ds.id !== action.payload);
        
        if (state.selectedDataSource === action.payload) {
          state.selectedDataSource = state.dataSources.length > 0 ? state.dataSources[0].id : null;
        }
        
        state.error = null;
      })
      .addCase(deleteDataSource.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  }
});

export const {
  setSelectedDataSource,
  addDataSourceOptimistic,
  removeDataSourceOptimistic,
  updateDataSourceOptimistic,
  clearError,
  resetDataSources,
  loadFromLocalStorage
} = dataSourcesSlice.actions;

export default dataSourcesSlice.reducer;