import axios from 'axios';
import { createAsyncThunk, createSlice, isPending, isRejected } from '@reduxjs/toolkit';

import { serializeAxiosError } from 'app/shared/reducers/reducer.utils';

const initialState = {
  loading: false,
  errorMessage: null,
  gateway: {
    routes: [],
  },
  totalItems: 0,
};

export type AdministrationState = Readonly<typeof initialState>;

// Actions
export const getGatewayRoutes = createAsyncThunk('administration/fetch_gateway_route', async () => axios.get<any>('api/gateway/routes'), {
  serializeError: serializeAxiosError,
});

export const AdministrationSlice = createSlice({
  name: 'administration',
  initialState: initialState as AdministrationState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(getGatewayRoutes.fulfilled, (state, action) => {
        state.loading = false;
        state.gateway = {
          routes: action.payload.data,
        };
      })
      .addMatcher(isPending(getGatewayRoutes), state => {
        state.errorMessage = null;
        state.loading = true;
      })
      .addMatcher(isRejected(getGatewayRoutes), (state, action) => {
        state.errorMessage = action.error.message;
        state.loading = false;
      });
  },
});

// Reducer
export default AdministrationSlice.reducer;
