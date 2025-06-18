import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/v1/auth/login', { email, password })
    return response.data
  },
  register: async (email: string, password: string, full_name: string) => {
    const response = await api.post('/api/v1/auth/register', { email, password, full_name })
    return response.data
  },
  getMe: async () => {
    const response = await api.get('/api/v1/auth/me')
    return response.data
  },
}

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/api/v1/stats')
    return response.data
  },
}

// Research API
export const researchAPI = {
  searchPapers: async (query: string, limit = 10) => {
    const response = await api.get('/api/v1/research/search', {
      params: { query, limit },
    })
    return response.data
  },
  getInsights: async (topic?: string) => {
    const response = await api.get('/api/v1/research/insights', {
      params: { topic },
    })
    return response.data
  },
}

// Molecules API
export const moleculesAPI = {
  getAll: async () => {
    const response = await api.get('/api/v1/molecules')
    return response.data
  },
  analyze: async (smiles: string, properties?: string[]) => {
    const response = await api.post('/api/v1/molecules/analyze', {
      smiles,
      properties,
    })
    return response.data
  },
  getPredictions: async (moleculeId: string) => {
    const response = await api.get(`/api/v1/molecules/${moleculeId}/predictions`)
    return response.data
  },
}

// Clinical Trials API
export const clinicalAPI = {
  getTrials: async (filters?: {
    status?: string
    phase?: string
    condition?: string
  }) => {
    const response = await api.get('/api/v1/clinical/trials', {
      params: filters,
    })
    return response.data
  },
  getTrial: async (id: string) => {
    const response = await api.get(`/api/v1/clinical/trials/${id}`)
    return response.data
  },
}

// Safety API
export const safetyAPI = {
  getEvents: async (drug?: string) => {
    const response = await api.get('/api/v1/safety/events', {
      params: { drug },
    })
    return response.data
  },
  reportEvent: async (data: {
    drug_name: string
    event_type: string
    severity: string
    description?: string
  }) => {
    const response = await api.post('/api/v1/safety/events', data)
    return response.data
  },
}

// ML API
export const mlAPI = {
  predictProperties: async (smiles: string) => {
    const response = await api.post('/api/v1/ml/molecule/properties', {
      smiles,
    })
    return response.data
  },
  generateMolecules: async (scaffold?: string, properties?: any) => {
    const response = await api.post('/api/v1/ml/generate', {
      scaffold,
      properties,
    })
    return response.data
  },
  calculateSimilarity: async (reference: string, candidates: string[]) => {
    const response = await api.post('/api/v1/ml/similarity', {
      reference,
      candidates,
    })
    return response.data
  },
  predictSafety: async (compound: string) => {
    const response = await api.post('/api/v1/ai/safety/predict', {
      compound,
    })
    return response.data
  },
}

export default api