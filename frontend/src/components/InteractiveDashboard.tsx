import React, { useEffect, useState, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
} from 'chart.js'
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  BeakerIcon,
  DocumentTextIcon,
  UsersIcon,
  CubeIcon,
  HeartIcon,
  ShieldCheckIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale
)

interface DashboardMetric {
  id: string
  title: string
  value: string | number
  change: number
  trend: 'up' | 'down' | 'neutral'
  icon: any
  color: string
}

interface ChartData {
  labels: string[]
  datasets: any[]
}

const InteractiveDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [activeMetric, setActiveMetric] = useState<string | null>(null)
  const [isRealTime, setIsRealTime] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Sample metrics data
  const metrics: DashboardMetric[] = [
    {
      id: 'research',
      title: 'Active Research',
      value: 47,
      change: 12.5,
      trend: 'up',
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
    },
    {
      id: 'molecules',
      title: 'Molecules Analyzed',
      value: 1284,
      change: 8.2,
      trend: 'up',
      icon: BeakerIcon,
      color: 'bg-green-500',
    },
    {
      id: 'trials',
      title: 'Clinical Trials',
      value: 23,
      change: -2.1,
      trend: 'down',
      icon: HeartIcon,
      color: 'bg-purple-500',
    },
    {
      id: 'safety',
      title: 'Safety Events',
      value: 3,
      change: -15.3,
      trend: 'down',
      icon: ShieldCheckIcon,
      color: 'bg-red-500',
    },
  ]

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  }

  // Research activity chart data
  const researchActivityData: ChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'New Research',
        data: [12, 19, 3, 5, 2, 3, 8],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
      {
        label: 'Completed',
        data: [8, 15, 7, 12, 9, 6, 11],
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
      },
    ],
  }

  // Molecule analysis trends
  const moleculeTrendsData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Molecules Analyzed',
        data: [65, 89, 123, 156, 178, 184],
        fill: true,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: 'rgba(139, 92, 246, 1)',
        tension: 0.4,
      },
    ],
  }

  // Drug efficacy distribution
  const efficacyData: ChartData = {
    labels: ['High Efficacy', 'Medium Efficacy', 'Low Efficacy', 'Inconclusive'],
    datasets: [
      {
        data: [35, 42, 18, 5],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  }

  // Safety radar chart
  const safetyRadarData: ChartData = {
    labels: ['Toxicity', 'Side Effects', 'Interactions', 'Contraindications', 'Adverse Events'],
    datasets: [
      {
        label: 'Safety Score',
        data: [85, 92, 78, 88, 90],
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgba(16, 185, 129, 1)',
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
      },
    ],
  }

  // Real-time data simulation
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRealTime) {
      interval = setInterval(() => {
        setLastUpdate(new Date())
        // Update chart data here in real implementation
      }, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRealTime])

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
      case 'down':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interactive Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time pharmaceutical research analytics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          {/* Real-time Toggle */}
          <button
            onClick={() => setIsRealTime(!isRealTime)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
              isRealTime
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <EyeIcon className="h-4 w-4" />
            <span>{isRealTime ? 'Live' : 'Static'}</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon
          const isActive = activeMetric === metric.id
          
          return (
            <div
              key={metric.id}
              onClick={() => setActiveMetric(isActive ? null : metric.id)}
              className={`card cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                isActive ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg'
              }`}
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${metric.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-medium text-gray-500">{metric.title}</h3>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(metric.trend)}
                      <span className={`text-sm ${
                        metric.trend === 'up' ? 'text-green-600' : 
                        metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {formatChange(metric.change)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Research Activity Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Research Activity</h2>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Bar data={researchActivityData} options={chartOptions} />
          </div>
        </div>

        {/* Molecule Analysis Trends */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Molecule Analysis Trends</h2>
            <BeakerIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Line data={moleculeTrendsData} options={chartOptions} />
          </div>
        </div>

        {/* Drug Efficacy Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Drug Efficacy Distribution</h2>
            <CubeIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48">
              <Doughnut 
                data={efficacyData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                }} 
              />
            </div>
          </div>
        </div>

        {/* Safety Radar */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Safety Assessment</h2>
            <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="w-56 h-56">
              <Radar 
                data={safetyRadarData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100,
                    },
                  },
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            <div className={`w-2 h-2 rounded-full ${isRealTime ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span>{isRealTime ? 'Live data' : 'Static data'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            <span>Showing data for {timeRange}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InteractiveDashboard