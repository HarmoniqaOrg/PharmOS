import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { store } from './store'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Research from './pages/Research'
import Molecules from './pages/Molecules'
import ClinicalTrials from './pages/ClinicalTrials'
import Safety from './pages/Safety'
import Login from './pages/Login'

const queryClient = new QueryClient()

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="research" element={<Research />} />
              <Route path="molecules" element={<Molecules />} />
              <Route path="clinical-trials" element={<ClinicalTrials />} />
              <Route path="safety" element={<Safety />} />
            </Route>
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </QueryClientProvider>
    </Provider>
  )
}

export default App