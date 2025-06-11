import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth-slice';
import dataSourcesReducer from './dataSources-slice';
import chartsReducer from './charts-slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dataSources: dataSourcesReducer,
    charts: chartsReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;