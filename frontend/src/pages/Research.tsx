import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { setSearchQuery, searchStart, searchSuccess, searchFailure } from '../store/researchSlice'
import { MagnifyingGlassIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { researchAPI } from '../services/api'

const Research: React.FC = () => {
  const dispatch = useDispatch()
  const { papers, searchQuery, loading } = useSelector((state: RootState) => state.research)
  const [localQuery, setLocalQuery] = useState(searchQuery)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(setSearchQuery(localQuery))
    dispatch(searchStart())
    
    try {
      const response = await researchAPI.searchPapers(localQuery)
      dispatch(searchSuccess(response.results))
      toast.success(`Found ${response.count} papers`)
    } catch (error) {
      dispatch(searchFailure('Failed to search papers'))
      toast.error('Search failed')
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Research Hub</h1>
        <p className="mt-2 text-gray-600">Search and analyze pharmaceutical research papers</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Search for papers, compounds, diseases..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary px-6"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
            {papers.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500">No papers found. Try searching for a topic.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {papers.map((paper) => (
                  <div key={paper.id} className="border-b pb-4">
                    <h3 className="font-semibold text-lg">{paper.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{paper.authors.join(', ')}</p>
                    <p className="text-gray-700 mt-2">{paper.abstract}</p>
                    <div className="mt-2 flex gap-4 text-sm text-gray-500">
                      <span>Published: {paper.publishedDate}</span>
                      {paper.pmid && <span>PMID: {paper.pmid}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Quick Filters</h2>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">Peer Reviewed Only</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">Last 5 Years</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">Clinical Trials</span>
              </label>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Popular Topics</h2>
            <div className="flex flex-wrap gap-2">
              {['Cardiovascular', 'Oncology', 'Neurology', 'Immunology', 'Infectious Disease'].map((topic) => (
                <button
                  key={topic}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                  onClick={() => setLocalQuery(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Research