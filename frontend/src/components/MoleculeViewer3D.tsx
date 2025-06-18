import React, { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame, useThree, RootState } from '@react-three/fiber'
import { OrbitControls, Sphere, Cylinder, Html, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import {
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  CubeIcon,
  EyeIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline'

interface Atom {
  id: string
  element: string
  position: [number, number, number]
  color: string
  radius: number
}

interface Bond {
  id: string
  atom1: string
  atom2: string
  order: number
  color: string
}

interface MoleculeData {
  name: string
  formula: string
  atoms: Atom[]
  bonds: Bond[]
}

interface AtomComponentProps {
  atom: Atom
  isSelected: boolean
  onSelect: (id: string) => void
  showLabels: boolean
}

const AtomComponent: React.FC<AtomComponentProps> = ({ 
  atom, 
  isSelected, 
  onSelect, 
  showLabels 
}: AtomComponentProps) => {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame((state: RootState) => {
    if (meshRef.current && isSelected) {
      meshRef.current.rotation.y += 0.02
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1
      meshRef.current.scale.setScalar(scale)
    }
  })

  return (
    <group position={atom.position}>
      <Sphere
        ref={meshRef}
        args={[atom.radius, 32, 32]}
        onClick={() => onSelect(atom.id)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshPhongMaterial
          color={isSelected ? '#fbbf24' : atom.color}
          transparent
          opacity={hovered ? 0.8 : 1}
          shininess={100}
        />
      </Sphere>
      {(showLabels || hovered) && (
        <Html distanceFactor={10}>
          <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs pointer-events-none">
            {atom.element}
          </div>
        </Html>
      )}
    </group>
  )
}

interface BondComponentProps {
  bond: Bond
  atoms: Atom[]
  visualizationMode: string
}

const BondComponent: React.FC<BondComponentProps> = ({ bond, atoms, visualizationMode }) => {
  const atom1 = atoms.find((a: Atom) => a.id === bond.atom1)
  const atom2 = atoms.find((a: Atom) => a.id === bond.atom2)
  
  if (!atom1 || !atom2 || visualizationMode === 'spaceFilling') return null

  const start = new THREE.Vector3(...atom1.position)
  const end = new THREE.Vector3(...atom2.position)
  const direction = end.clone().sub(start)
  const length = direction.length()
  const position = start.clone().add(direction.clone().multiplyScalar(0.5))

  // Create rotation to align cylinder with bond direction
  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())

  const bondRadius = visualizationMode === 'wireframe' ? 0.05 : 0.1

  return (
    <group position={position.toArray()} quaternion={quaternion.toArray()}>
      <Cylinder args={[bondRadius, bondRadius, length, 8]}>
        <meshPhongMaterial color={bond.color} shininess={50} />
      </Cylinder>
    </group>
  )
}

interface MoleculeSceneProps {
  molecule: MoleculeData
  visualizationMode: string
  showLabels: boolean
  isRotating: boolean
  selectedAtom: string | null
  onAtomSelect: (id: string) => void
}

const MoleculeScene: React.FC<MoleculeSceneProps> = ({
  molecule,
  visualizationMode,
  showLabels,
  isRotating,
  selectedAtom,
  onAtomSelect,
}) => {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame(() => {
    if (groupRef.current && isRotating) {
      groupRef.current.rotation.y += 0.005
    }
  })

  const atomRadiusMultiplier = visualizationMode === 'spaceFilling' ? 2 : 1

  return (
    <group ref={groupRef}>
      {/* Atoms */}
      {molecule.atoms.map((atom: Atom) => (
        <AtomComponent
          key={atom.id}
          atom={{
            ...atom,
            radius: atom.radius * atomRadiusMultiplier,
          }}
          isSelected={selectedAtom === atom.id}
          onSelect={onAtomSelect}
          showLabels={showLabels}
        />
      ))}
      
      {/* Bonds */}
      {molecule.bonds.map((bond: Bond) => (
        <BondComponent
          key={bond.id}
          bond={bond}
          atoms={molecule.atoms}
          visualizationMode={visualizationMode}
        />
      ))}
    </group>
  )
}

interface MoleculeViewer3DProps {
  molecule?: MoleculeData
  className?: string
  height?: string
}

const MoleculeViewer3D: React.FC<MoleculeViewer3DProps> = ({
  molecule: propMolecule,
  className = '',
  height = '500px',
}) => {
  const [visualizationMode, setVisualizationMode] = useState<'ballStick' | 'spaceFilling' | 'wireframe'>('ballStick')
  const [showLabels, setShowLabels] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [selectedAtom, setSelectedAtom] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Sample molecule data (caffeine)
  const defaultMolecule: MoleculeData = useMemo(() => ({
    name: 'Caffeine',
    formula: 'C₈H₁₀N₄O₂',
    atoms: [
      { id: 'C1', element: 'C', position: [0, 0, 0], color: '#404040', radius: 0.7 },
      { id: 'C2', element: 'C', position: [1.4, 0, 0], color: '#404040', radius: 0.7 },
      { id: 'C3', element: 'C', position: [2.1, 1.2, 0], color: '#404040', radius: 0.7 },
      { id: 'C4', element: 'C', position: [1.4, 2.4, 0], color: '#404040', radius: 0.7 },
      { id: 'C5', element: 'C', position: [0, 2.4, 0], color: '#404040', radius: 0.7 },
      { id: 'C6', element: 'C', position: [-0.7, 1.2, 0], color: '#404040', radius: 0.7 },
      { id: 'N1', element: 'N', position: [2.8, 1.2, 0], color: '#3050f8', radius: 0.65 },
      { id: 'N2', element: 'N', position: [2.1, 3.6, 0], color: '#3050f8', radius: 0.65 },
      { id: 'N3', element: 'N', position: [-1.4, 1.2, 0], color: '#3050f8', radius: 0.65 },
      { id: 'N4', element: 'N', position: [-0.7, 3.6, 0], color: '#3050f8', radius: 0.65 },
      { id: 'O1', element: 'O', position: [3.5, 0, 0], color: '#ff0d0d', radius: 0.6 },
      { id: 'O2', element: 'O', position: [-2.1, 0, 0], color: '#ff0d0d', radius: 0.6 },
    ],
    bonds: [
      { id: 'B1', atom1: 'C1', atom2: 'C2', order: 1, color: '#666666' },
      { id: 'B2', atom1: 'C2', atom2: 'C3', order: 2, color: '#666666' },
      { id: 'B3', atom1: 'C3', atom2: 'C4', order: 1, color: '#666666' },
      { id: 'B4', atom1: 'C4', atom2: 'C5', order: 2, color: '#666666' },
      { id: 'B5', atom1: 'C5', atom2: 'C6', order: 1, color: '#666666' },
      { id: 'B6', atom1: 'C6', atom2: 'C1', order: 2, color: '#666666' },
      { id: 'B7', atom1: 'C3', atom2: 'N1', order: 1, color: '#666666' },
      { id: 'B8', atom1: 'C4', atom2: 'N2', order: 1, color: '#666666' },
      { id: 'B9', atom1: 'C6', atom2: 'N3', order: 1, color: '#666666' },
      { id: 'B10', atom1: 'C5', atom2: 'N4', order: 1, color: '#666666' },
      { id: 'B11', atom1: 'N1', atom2: 'O1', order: 2, color: '#666666' },
      { id: 'B12', atom1: 'N3', atom2: 'O2', order: 2, color: '#666666' },
    ],
  }), [])

  const molecule = propMolecule || defaultMolecule

  const resetView = () => {
    setSelectedAtom(null)
    setIsRotating(false)
  }

  const exportImage = () => {
    // TODO: Implement screenshot functionality
    console.log('Export image functionality')
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{molecule.name}</h3>
            <p className="text-blue-100 text-sm">{molecule.formula}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsRotating(!isRotating)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title={isRotating ? 'Pause rotation' : 'Start rotation'}
            >
              {isRotating ? (
                <PauseIcon className="h-5 w-5" />
              ) : (
                <PlayIcon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={resetView}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Reset view"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">View:</label>
              <select
                value={visualizationMode}
                onChange={(e) => setVisualizationMode(e.target.value as 'ballStick' | 'spaceFilling' | 'wireframe')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ballStick">Ball & Stick</option>
                <option value="spaceFilling">Space Filling</option>
                <option value="wireframe">Wireframe</option>
              </select>
            </div>
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                showLabels
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              Labels
            </button>
          </div>
          
          {selectedAtom && (
            <div className="text-sm text-gray-600">
              Selected: <span className="font-medium">{selectedAtom}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3D Viewer */}
      <div style={{ height }} className="relative bg-gradient-to-br from-gray-100 to-gray-200">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        <Canvas
          camera={{ position: [10, 10, 10], fov: 50 }}
          className="cursor-grab active:cursor-grabbing"
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />
          <pointLight position={[0, 0, 10]} intensity={0.5} />
          
          <MoleculeScene
            molecule={molecule}
            visualizationMode={visualizationMode}
            showLabels={showLabels}
            isRotating={isRotating}
            selectedAtom={selectedAtom}
            onAtomSelect={setSelectedAtom}
          />
          
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={50}
          />
        </Canvas>
      </div>

      {/* Info Panel */}
      {selectedAtom && (
        <div className="bg-blue-50 border-t p-4">
          <div className="text-sm">
            <h4 className="font-medium text-blue-900 mb-1">Atom Information</h4>
            <div className="text-blue-700">
              <p><strong>Element:</strong> {molecule.atoms.find((a: Atom) => a.id === selectedAtom)?.element}</p>
              <p><strong>ID:</strong> {selectedAtom}</p>
              <p><strong>Position:</strong> {molecule.atoms.find((a: Atom) => a.id === selectedAtom)?.position.join(', ')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MoleculeViewer3D