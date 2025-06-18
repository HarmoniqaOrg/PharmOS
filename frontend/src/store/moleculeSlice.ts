import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Molecule {
  id: string
  smiles: string
  name?: string
  properties: {
    molecularWeight?: number
    logP?: number
    hbondDonors?: number
    hbondAcceptors?: number
  }
}

interface MoleculeState {
  molecules: Molecule[]
  currentMolecule: Molecule | null
  loading: boolean
  error: string | null
}

const initialState: MoleculeState = {
  molecules: [],
  currentMolecule: null,
  loading: false,
  error: null,
}

const moleculeSlice = createSlice({
  name: 'molecules',
  initialState,
  reducers: {
    addMolecule: (state, action: PayloadAction<Molecule>) => {
      state.molecules.push(action.payload)
    },
    selectMolecule: (state, action: PayloadAction<Molecule>) => {
      state.currentMolecule = action.payload
    },
    updateMoleculeProperties: (state, action: PayloadAction<{ id: string; properties: any }>) => {
      const molecule = state.molecules.find(m => m.id === action.payload.id)
      if (molecule) {
        molecule.properties = { ...molecule.properties, ...action.payload.properties }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const { addMolecule, selectMolecule, updateMoleculeProperties, setLoading, setError } = moleculeSlice.actions
export default moleculeSlice.reducer