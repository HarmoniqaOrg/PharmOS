import React, { useState } from 'react'
import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const Safety: React.FC = () => {
  const [reportForm, setReportForm] = useState({
    drugName: '',
    eventType: '',
    severity: '',
    description: '',
  })

  const mockEvents = [
    {
      id: 'EVT-001',
      drugName: 'Cardiovex-200',
      eventType: 'Cardiac Arrhythmia',
      severity: 'Moderate',
      reportedDate: '2024-06-15',
      status: 'Under Investigation',
    },
    {
      id: 'EVT-002',
      drugName: 'NeuroShield',
      eventType: 'Headache',
      severity: 'Mild',
      reportedDate: '2024-06-14',
      status: 'Resolved',
    },
  ]

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Safety event reported successfully!')
    setReportForm({
      drugName: '',
      eventType: '',
      severity: '',
      description: '',
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Safety Monitoring</h1>
        <p className="mt-2 text-gray-600">Track and analyze drug safety events</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Recent Safety Events</h2>
            <div className="space-y-4">
              {mockEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{event.drugName}</h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            event.severity === 'Mild'
                              ? 'bg-yellow-100 text-yellow-800'
                              : event.severity === 'Moderate'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {event.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Event: {event.eventType}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        ID: {event.id} • Reported: {event.reportedDate}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${
                        event.status === 'Resolved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Safety Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Events by Severity</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Mild</span>
                    <span className="text-sm font-semibold">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Moderate</span>
                    <span className="text-sm font-semibold">35%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Severe</span>
                    <span className="text-sm font-semibold">20%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Top Event Types</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Headache</span>
                    <span className="font-semibold">124</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Nausea</span>
                    <span className="font-semibold">89</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Dizziness</span>
                    <span className="font-semibold">67</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Fatigue</span>
                    <span className="font-semibold">45</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Insomnia</span>
                    <span className="font-semibold">32</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-semibold">Report Safety Event</h2>
            </div>
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drug Name
                </label>
                <input
                  type="text"
                  value={reportForm.drugName}
                  onChange={(e) => setReportForm({ ...reportForm, drugName: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <input
                  type="text"
                  value={reportForm.eventType}
                  onChange={(e) => setReportForm({ ...reportForm, eventType: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  value={reportForm.severity}
                  onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select severity</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  className="input"
                  rows={3}
                  required
                />
              </div>
              <button type="submit" className="w-full btn-primary">
                Submit Report
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full btn-secondary text-left">
                Generate Safety Report
              </button>
              <button className="w-full btn-secondary text-left">
                View FDA Alerts
              </button>
              <button className="w-full btn-secondary text-left">
                Risk Assessment Tool
              </button>
              <button className="w-full btn-secondary text-left">
                Export Event Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Safety