import React, { useState } from 'react'
import { HeartIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const ClinicalTrials: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    phase: '',
    status: '',
    condition: '',
  })

  const mockTrials = [
    {
      id: 'NCT123456',
      title: 'A Study of Novel Cardiovascular Drug XYZ',
      phase: 'Phase 3',
      status: 'Recruiting',
      condition: 'Heart Failure',
      sponsor: 'PharmOS Research',
      startDate: '2024-01-15',
      estimatedCompletion: '2025-12-31',
      enrollment: 500,
    },
    {
      id: 'NCT789012',
      title: 'Safety and Efficacy of ABC in Hypertension',
      phase: 'Phase 2',
      status: 'Active',
      condition: 'Hypertension',
      sponsor: 'CardioHealth Inc',
      startDate: '2023-06-01',
      estimatedCompletion: '2024-11-30',
      enrollment: 200,
    },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clinical Trials</h1>
        <p className="mt-2 text-gray-600">Search and manage clinical trial data</p>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search trials by ID, title, or condition..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button type="submit" className="btn-primary px-6">
            Search
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Active Trials</h2>
            <div className="space-y-4">
              {mockTrials.map((trial) => (
                <div key={trial.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{trial.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">ID: {trial.id}</p>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Phase:</span>
                          <p className="font-medium">{trial.phase}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <p className="font-medium text-green-600">{trial.status}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Condition:</span>
                          <p className="font-medium">{trial.condition}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Enrollment:</span>
                          <p className="font-medium">{trial.enrollment} patients</p>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-600">
                        <span>Sponsor: {trial.sponsor}</span>
                        <span className="mx-2">•</span>
                        <span>Start: {trial.startDate}</span>
                        <span className="mx-2">•</span>
                        <span>Est. Completion: {trial.estimatedCompletion}</span>
                      </div>
                    </div>
                    <button className="ml-4 btn-secondary text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Filters</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phase
                </label>
                <select
                  value={filters.phase}
                  onChange={(e) => setFilters({ ...filters, phase: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Phases</option>
                  <option value="phase1">Phase 1</option>
                  <option value="phase2">Phase 2</option>
                  <option value="phase3">Phase 3</option>
                  <option value="phase4">Phase 4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="recruiting">Recruiting</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <input
                  type="text"
                  value={filters.condition}
                  onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                  placeholder="e.g., Cardiovascular"
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Trials</span>
                <span className="font-semibold">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Trials</span>
                <span className="font-semibold text-green-600">89</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold">52</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Enrollment</span>
                <span className="font-semibold">12,450</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClinicalTrials