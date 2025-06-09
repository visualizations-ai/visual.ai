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

export const fetchDataSources = createAsyncThunk(
  'dataSources/fetchDataSources',
  async (_, thunkAPI) => {
    try {
      const response = await client.query({
        query: GET_DATA_SOURCES,
        fetchPolicy: 'cache-and-network'
      });
      
      return response.data.getDataSources?.dataSource || [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const createDataSource = createAsyncThunk(
  'dataSources/createDataSource',
  async (dataSourceData: any, thunkAPI) => {
    try {
      const response = await client.mutate({
        mutation: CREATE_DATASOURCE,
        variables: { source: dataSourceData },
        refetchQueries: [{ query: GET_DATA_SOURCES }]
      });
      
      return response.data.createPostgresqlDataSource?.dataSource || [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const deleteDataSource = createAsyncThunk(
  'dataSources/deleteDataSource',
  async (dataSourceId: string, thunkAPI) => {
    try {
      await client.mutate({
        mutation: DELETE_DATASOURCE,
        variables: { datasourceId: dataSourceId },
        refetchQueries: [{ query: GET_DATA_SOURCES }]
      });
      
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
  resetDataSources
} = dataSourcesSlice.actions;

export default dataSourcesSlice.reducer;