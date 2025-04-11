import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  // Add other user properties as needed
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    userRegistration: (state, action: PayloadAction<{ token: string }>) => {
      state.token = action.payload.token;
      state.isLoading = false;
    },
    userLoggedIn: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>
    ) => {
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    userLoggedOut: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    authRequestStarted: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    authRequestFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    tokenRefreshed: (state, action: PayloadAction<{ accessToken: string }>) => {
      state.token = action.payload.accessToken;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  userRegistration,
  userLoggedIn,
  userLoggedOut,
  authRequestStarted,
  authRequestFailed,
  tokenRefreshed,
} = authSlice.actions;

export default authSlice.reducer;