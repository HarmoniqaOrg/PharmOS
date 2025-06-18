import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Paper {
  id: string
  title: string
  abstract: string
  authors: string[]
  publishedDate: string
  pmid?: string
}

interface ResearchState {
  papers: Paper[]
  currentPaper: Paper | null
  searchQuery: string
  loading: boolean
  error: string | null
}

const initialState: ResearchState = {
  papers: [],
  currentPaper: null,
  searchQuery: '',
  loading: false,
  error: null,
}

const researchSlice = createSlice({
  name: 'research',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    searchStart: (state) => {
      state.loading = true
      state.error = null
    },
    searchSuccess: (state, action: PayloadAction<Paper[]>) => {
      state.papers = action.payload
      state.loading = false
    },
    searchFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },
    selectPaper: (state, action: PayloadAction<Paper>) => {
      state.currentPaper = action.payload
    },
  },
})

export const { setSearchQuery, searchStart, searchSuccess, searchFailure, selectPaper } = researchSlice.actions
export default researchSlice.reducer