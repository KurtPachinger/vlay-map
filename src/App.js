import vlay from './vlay.js'
import * as THREE from 'three'
//threejs.org/examples/?q=modifi#webgl_modifier_subdivision
//threejs.org/examples/?q=simp#webgl_modifier_simplifier
//three/examples/jsm/materials/MeshGouraudMaterial.js
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, MeshReflectorMaterial, AdaptiveDpr } from '@react-three/drei'
import { Brush, Subtraction } from '@react-three/csg'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { TeapotGeometry } from 'three/examples/jsm/geometries/TeapotGeometry.js'
//

export default function App() {
  // output, positive defects
  vlay.v.out = useRef()

  const R = vlay.v.R * 8
  return (
    <Canvas
      performance={{ min: 0.2 }}
      frameloop="demand"
      gl={{ antialias: false }}
      shadows
      camera={{ position: [0, R, R] }}
      onCreated={(state) => vlay.init(state)}>
      <fog attach="fog" args={['black', 0, 400]} />
      <OrbitControls makeDefault />
      <pointLight name="top" intensity={60000} decay={2} position={[0, R * 2, R]} castShadow />
      <pointLight name="mid" intensity={200} position={[0, vlay.v.R / 2, 0]} castShadow />
      <directionalLight name="low" intensity={0.25} position={[0, -1, -1]} />
      <gridHelper args={[R, 4]} position={0} />
      <axesHelper args={[R]} />
      <group name="out" ref={vlay.v.out}>
        <mesh name={'CSG'} castShadow receiveShadow>
          <CSG />
        </mesh>
      </group>
      <mesh name="sea" renderOrder={2} material={vlay.mat.neg}>
        <icosahedronGeometry args={[vlay.v.R * 2.5, 2]} />
      </mesh>
      <mesh name="mirror" rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[R, R]} />
        <MeshReflectorMaterial
          blur={[256, 128]}
          resolution={512}
          mixBlur={0.75}
          mixStrength={25}
          roughness={1}
          depthScale={0.5}
          color={0x202020}
          metalness={0.5}
        />
      </mesh>
      <AdaptiveDpr pixelated />
    </Canvas>
  )
}

function CSG() {
  //docs.pmnd.rs/react-three-fiber/api/events
  useFrame((state) => {
    if (vlay.v.csg.update) {
      console.log('r3f', state.gl.info)
      vlay.v.csg.update = false
      // invalidate stale mutated
      const geom = vlay.v.csg.geo.current
      geom.geometry.computeVertexNormals()
      geom.needsUpdate = true
    }
  })

  // ray-test CSG
  vlay.v.csg.neg = useRef()
  vlay.v.csg.geo = useRef()

  // LOD (and mat.MAX) can qualify non-critical geometry/texture
  vlay.v.LOD = Math.round(Math.min(window.innerWidth, window.innerHeight) / 256)
  //vlay.v.LOD = 14
  let neg = new THREE.PlaneGeometry(0, 0)
  let geo = new THREE.IcosahedronGeometry(vlay.v.R * 2, vlay.v.LOD * 3)
  //let geo = new THREE.TorusKnotGeometry(vlay.v.R * 2, vlay.v.R / 2, vlay.v.LOD * 32, 32)
  //let geo = new TeapotGeometry(vlay.v.R * 2, vlay.v.LOD * 4)

  geo = mergeVertices(geo, vlay.v.R / 4)

  //
  geo.userData.pos = geo.getAttribute('position').clone()

  return (
    // Difference, Intersection, Addition, Subtraction
    <Subtraction useGroups>
      <Brush a ref={vlay.v.csg.geo} geometry={geo} material={vlay.mat.pos} />
      <Brush b ref={vlay.v.csg.neg} geometry={neg} material={vlay.mat.neg} />
    </Subtraction>
  )
}
