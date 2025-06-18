import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import researchReducer from './researchSlice'
import moleculeReducer from './moleculeSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    research: researchReducer,
    molecules: moleculeReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch