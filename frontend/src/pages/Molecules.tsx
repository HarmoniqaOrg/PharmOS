import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { addMolecule, setLoading } from '../store/moleculeSlice'
import { CubeIcon, PlusIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { moleculesAPI, mlAPI } from '../services/api'

const Molecules: React.FC = () => {
  const dispatch = useDispatch()
  const { molecules } = useSelector((state: RootState) => state.molecules)
  const [showAddForm, setShowAddForm] = useState(false)
  const [smiles, setSmiles] = useState('')
  const [name, setName] = useState('')

  const handleAddMolecule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!smiles) {
      toast.error('SMILES string is required')
      return
    }

    try {
      dispatch(setLoading(true))
      
      // Analyze molecule to get properties
      const analysis = await moleculesAPI.analyze(smiles)
      
      const newMolecule = {
        id: Date.now().toString(),
        smiles,
        name: name || undefined,
        properties: {
          molecularWeight: analysis.analysis.molecular_weight,
          logP: analysis.analysis.logp,
          hbondDonors: analysis.analysis.hbond_donors,
          hbondAcceptors: analysis.analysis.hbond_acceptors
        },
      }

      dispatch(addMolecule(newMolecule))
      toast.success('Molecule added and analyzed successfully!')
      setSmiles('')
      setName('')
      setShowAddForm(false)
    } catch (error) {
      toast.error('Failed to analyze molecule')
    } finally {
      dispatch(setLoading(false))
    }
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Molecule Library</h1>
          <p className="mt-2 text-gray-600">Design and analyze molecular structures</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Add Molecule
        </button>
      </div>

      {showAddForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Molecule</h2>
          <form onSubmit={handleAddMolecule} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SMILES String *
              </label>
              <input
                type="text"
                value={smiles}
                onChange={(e) => setSmiles(e.target.value)}
                placeholder="e.g., CC(C)Cc1ccc(cc1)C(C)C(=O)O"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Ibuprofen"
                className="input"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                Add Molecule
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {molecules.length === 0 ? (
          <div className="col-span-full">
            <div className="card text-center py-12">
              <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">No molecules in library. Add your first molecule!</p>
            </div>
          </div>
        ) : (
          molecules.map((molecule) => (
            <div key={molecule.id} className="card hover:shadow-lg transition-shadow">
              <h3 className="font-semibold text-lg mb-2">
                {molecule.name || 'Unnamed Molecule'}
              </h3>
              <p className="text-sm text-gray-600 font-mono break-all mb-4">
                {molecule.smiles}
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Molecular Weight:</span>
                  <span>{molecule.properties.molecularWeight ? `${parseFloat(molecule.properties.molecularWeight).toFixed(2)} g/mol` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">LogP:</span>
                  <span>{molecule.properties.logP || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">H-bond Donors:</span>
                  <span>{molecule.properties.hbondDonors || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">H-bond Acceptors:</span>
                  <span>{molecule.properties.hbondAcceptors || 'N/A'}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="btn-secondary text-sm py-1">Analyze</button>
                <button className="btn-secondary text-sm py-1">3D View</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 card">
        <h2 className="text-xl font-semibold mb-4">Molecule Analysis Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border rounded-lg hover:bg-gray-50">
            <h3 className="font-semibold">Property Prediction</h3>
            <p className="text-sm text-gray-600 mt-1">Calculate molecular properties</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50">
            <h3 className="font-semibold">Similarity Search</h3>
            <p className="text-sm text-gray-600 mt-1">Find similar compounds</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50">
            <h3 className="font-semibold">Lead Optimization</h3>
            <p className="text-sm text-gray-600 mt-1">Optimize drug candidates</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50">
            <h3 className="font-semibold">ADMET Prediction</h3>
            <p className="text-sm text-gray-600 mt-1">Predict pharmacokinetics</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Molecules