import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { ApolloError } from '@apollo/client';
import client from '../graphql/apollo-client';
import { LOGIN_MUTATION, REGISTER_MUTATION, CHECK_CURRENT_USER, LOGOUT_MUTATION } from '../graphql/auth';

interface User {
  id: string;
  email: string;
  role: string;
}

interface DataSource {
  id: string;
  projectId: string;
  type: string;
  database: string;
}

interface AuthState {
  user: User | null;
  projectIds: DataSource[];
  collections: string[];
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthResponse {
  user: User;
  projectIds: DataSource[];
  collections: string[];
}

const initialState: AuthState = {
  user: null,
  projectIds: [],
  collections: [],
  isAuthenticated: false,
  loading: false,
  error: null
};

// פונקציה לניקוי Local Storage של Data Sources
const clearDataSourcesCache = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('dataSources_') || key.startsWith('dataSourcesMeta_')) {
        localStorage.removeItem(key);
      }
    });
    console.log("Cleared all data sources cache on logout");
  } catch (error) {
    console.error("Failed to clear data sources cache:", error);
  }
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, thunkAPI) => {
    try {
      const response = await client.mutate({
        mutation: LOGIN_MUTATION,
        variables: credentials
      });
      
      return response.data.loginUser as AuthResponse;
    } catch (error: unknown) {
      if (error instanceof ApolloError || error instanceof Error) {
        return thunkAPI.rejectWithValue(error.message);
      }
      return thunkAPI.rejectWithValue('An unknown error occurred');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials: { email: string; password: string }, thunkAPI) => {
    try {
      const response = await client.mutate({
        mutation: REGISTER_MUTATION,
        variables: {
          user: credentials
        }
      });
      
      return response.data.registerUser as AuthResponse;
    } catch (error: unknown) {
      if (error instanceof ApolloError || error instanceof Error) {
        return thunkAPI.rejectWithValue(error.message);
      }
      return thunkAPI.rejectWithValue('Registration failed');
    }
  }
);

export const checkCurrentUser = createAsyncThunk(
  'auth/checkCurrentUser',
  async (_, thunkAPI) => {
    try {
      const response = await client.query({
        query: CHECK_CURRENT_USER,
        fetchPolicy: 'network-only'
      });
      
      return response.data.checkCurrentUser as AuthResponse;
    } catch (error: unknown) {
      if (error instanceof ApolloError || error instanceof Error) {
        return thunkAPI.rejectWithValue(error.message);
      }
      return thunkAPI.rejectWithValue('Not authenticated');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, thunkAPI) => {
    try {
      await client.mutate({
        mutation: LOGOUT_MUTATION
      });
      
      // נקה את קאש הData Sources
      clearDataSourcesCache();
      
      return undefined;
    } catch (error: unknown) {
      // גם אם הlogout נכשל, נקה את הקאש
      clearDataSourcesCache();
      
      if (error instanceof ApolloError || error instanceof Error) {
        return thunkAPI.rejectWithValue(error.message);
      }
      return thunkAPI.rejectWithValue('Logout failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetAuthState: (state) => {
      state.loading = false;
      state.error = null;
    },
    forceLogout: (state) => {
      clearDataSourcesCache();
      
      state.user = null;
      state.projectIds = [];
      state.collections = [];
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        console.log('Login pending...');
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log('Login fulfilled:', action.payload);
        state.loading = false;
        if (action.payload && action.payload.user) {
          state.user = {
            id: action.payload.user.id,
            email: action.payload.user.email,
            role: 'user'
          };
          state.projectIds = action.payload.projectIds || [];
          state.collections = action.payload.collections || [];
          state.isAuthenticated = true;
        }
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        console.log('Login rejected:', action.payload);
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      });

    builder
      .addCase(registerUser.pending, (state) => {
        console.log('Register pending...');
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        console.log('Register fulfilled:', action.payload);
        state.loading = false;
        if (action.payload && action.payload.user) {
          state.user = {
            id: action.payload.user.id,
            email: action.payload.user.email,
            role: 'user'
          };
          state.projectIds = action.payload.projectIds || [];
          state.collections = action.payload.collections || [];
          state.isAuthenticated = true;
        }
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        console.log('Register rejected:', action.payload);
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      });

    builder
      .addCase(checkCurrentUser.pending, () => {
        console.log('Check user pending...');
      })
      .addCase(checkCurrentUser.fulfilled, (state, action) => {
        console.log('Check user fulfilled:', action.payload);
        state.loading = false;
        if (action.payload && action.payload.user) {
          state.user = {
            id: action.payload.user.id,
            email: action.payload.user.email,
            role: 'user'
          };
          state.projectIds = action.payload.projectIds || [];
          state.collections = action.payload.collections || [];
          state.isAuthenticated = true;
        }
        state.error = null;
      })
      .addCase(checkCurrentUser.rejected, (state) => {
        console.log('Check user rejected');
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
      });

    builder
      .addCase(logoutUser.pending, () => {
        console.log('Logout pending...');
      })
      .addCase(logoutUser.fulfilled, (state) => {
        console.log('Logout fulfilled');
        state.loading = false;
        state.user = null;
        state.projectIds = [];
        state.collections = [];
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        console.log('Logout rejected - but cleaning anyway');
        state.loading = false;
        state.user = null;
        state.projectIds = [];
        state.collections = [];
        state.isAuthenticated = false;
        state.error = null;
      });
  }
});

export const { setUser, clearError, resetAuthState, forceLogout } = authSlice.actions;
export default authSlice.reducer;