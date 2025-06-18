import React from 'react'
import { useQuery } from 'react-query'
import {
  ChartBarIcon,
  BeakerIcon,
  DocumentTextIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { dashboardAPI } from '../services/api'

const Dashboard: React.FC = () => {
  const { data: stats } = useQuery('dashboard-stats', dashboardAPI.getStats)

  const cards = [
    {
      title: 'Active Research',
      value: stats?.activeResearch || '0',
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Molecules Analyzed',
      value: stats?.moleculesAnalyzed || '0',
      icon: BeakerIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Clinical Trials',
      value: stats?.clinicalTrials || '0',
      icon: ChartBarIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Team Members',
      value: stats?.teamMembers || '1',
      icon: UsersIcon,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to PharmOS - AI-Powered Pharmaceutical Innovation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
                  <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">New molecule analysis completed</span>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Research paper added to library</span>
              <span className="text-xs text-gray-500">5 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Clinical trial update received</span>
              <span className="text-xs text-gray-500">1 day ago</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full btn-primary text-left">
              Start New Research Analysis
            </button>
            <button className="w-full btn-secondary text-left">
              Upload Molecule Structure
            </button>
            <button className="w-full btn-secondary text-left">
              Search Clinical Trials
            </button>
            <button className="w-full btn-secondary text-left">
              Generate Safety Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard