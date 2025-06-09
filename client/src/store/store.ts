import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth-slice';
import chartsReducer from './charts-slice';
import dataSourcesReducer from './dataSources-slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    charts: chartsReducer,
    dataSources: dataSourcesReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;