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

const clearDataSourcesCache = (specificUserId?: string) => {
  try {
    const keys = Object.keys(localStorage);
    let clearedCount = 0;
    
    keys.forEach(key => {
      if (key.startsWith('dataSources_') || key.startsWith('dataSourcesMeta_')) {
        if (specificUserId) {
          if (key.includes(specificUserId)) {
            localStorage.removeItem(key);
            clearedCount++;
          }
        } else {
          localStorage.removeItem(key);
          clearedCount++;
        }
      }
    });
    
    console.log(`🧹 Cleared ${clearedCount} data sources cache items${specificUserId ? ` for user ${specificUserId}` : ''}`);
    
    client.clearStore().catch(console.error);
    
  } catch (error) {
    console.error("Failed to clear data sources cache:", error);
  }
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, thunkAPI) => {
    try {
      clearDataSourcesCache();
      
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
      clearDataSourcesCache();
      
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
      
      clearDataSourcesCache();
      
      return undefined;
    } catch (error: unknown) {
      clearDataSourcesCache();
      
      if (error instanceof ApolloError || error instanceof Error) {
        return thunkAPI.rejectWithValue(error.message);
      }
      return thunkAPI.rejectWithValue('Logout failed');
    }
  }
);

const handleUserChange = (previousUser: User | null, newUser: User | null) => {

  if (previousUser && newUser && previousUser.id !== newUser.id) {
    console.log(`🔄 User changed from ${previousUser.id} to ${newUser.id} - clearing cache`);
    clearDataSourcesCache(previousUser.id);
  }

  else if (previousUser && !newUser) {
    console.log(`👋 User ${previousUser.id} logged out - clearing all cache`);
    clearDataSourcesCache();
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      const previousUser = state.user;
      const newUser = action.payload;
      

      handleUserChange(previousUser, newUser);
      
      state.user = newUser;
      state.isAuthenticated = !!newUser;
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
      const previousUser = state.user;
      
      clearDataSourcesCache();
      
      state.user = null;
      state.projectIds = [];
      state.collections = [];
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      
      console.log(`🚪 Force logout${previousUser ? ` for user ${previousUser.id}` : ''}`);
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
        const previousUser = state.user;
        
        state.loading = false;
        if (action.payload && action.payload.user) {
          const newUser = {
            id: action.payload.user.id,
            email: action.payload.user.email,
            role: 'user'
          };
          

          handleUserChange(previousUser, newUser);
          
          state.user = newUser;
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
        const previousUser = state.user;
        
        state.loading = false;
        if (action.payload && action.payload.user) {
          const newUser = {
            id: action.payload.user.id,
            email: action.payload.user.email,
            role: 'user'
          };
          
          handleUserChange(previousUser, newUser);
          
          state.user = newUser;
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
        const previousUser = state.user;
        
        state.loading = false;
        if (action.payload && action.payload.user) {
          const newUser = {
            id: action.payload.user.id,
            email: action.payload.user.email,
            role: 'user'
          };
          
          handleUserChange(previousUser, newUser);
          
          state.user = newUser;
          state.projectIds = action.payload.projectIds || [];
          state.collections = action.payload.collections || [];
          state.isAuthenticated = true;
        }
        state.error = null;
      })
      .addCase(checkCurrentUser.rejected, (state) => {
        console.log('Check user rejected');
        const previousUser = state.user;
        
        if (previousUser) {
          handleUserChange(previousUser, null);
        }
        
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
        const previousUser = state.user;
        
        handleUserChange(previousUser, null);
        
        state.loading = false;
        state.user = null;
        state.projectIds = [];
        state.collections = [];
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        console.log('Logout rejected - but cleaning anyway');
        const previousUser = state.user;
        
        handleUserChange(previousUser, null);
        
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