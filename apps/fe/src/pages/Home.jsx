import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import { gsap } from 'gsap'

const practices = [
  {
    id: 'todo',
    title: 'Todo App',
    description: 'CRUD · useState · useEffect · fetch API',
    path: '/todo',
    status: 'done',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const headerRef = useRef(null)
  const gridRef = useRef(null)

  // Three.js — floating particles
  useEffect(() => {
    const canvas = canvasRef.current
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 5

    // Particles
    const count = 180
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 18
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const mat = new THREE.PointsMaterial({
      color: 0x3b7de8,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
    })

    const particles = new THREE.Points(geo, mat)
    scene.add(particles)

    // Subtle torus knot
    const torusGeo = new THREE.TorusKnotGeometry(1, 0.28, 120, 16)
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0x1e3a6e,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    })
    const torus = new THREE.Mesh(torusGeo, torusMat)
    torus.position.set(3.5, -1, -2)
    scene.add(torus)

    let animId
    const animate = () => {
      animId = requestAnimationFrame(animate)
      particles.rotation.y += 0.0008
      particles.rotation.x += 0.0003
      torus.rotation.x += 0.004
      torus.rotation.y += 0.006
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  }, [])

  // GSAP entrance
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(
      headerRef.current.children,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.12 }
    ).fromTo(
      gridRef.current.children,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
      '-=0.3'
    )
  }, [])

  return (
    <div className="home">
      <canvas ref={canvasRef} className="home-canvas" />

      <div className="home-content">
        <header ref={headerRef} className="home-header">
          <p className="home-label">practice lab</p>
          <h1 className="home-title">FE Playground</h1>
          <p className="home-subtitle">React · Hooks · Patterns · Interview Prep</p>
        </header>

        <main ref={gridRef} className="home-grid">
          {practices.map(p => (
            <button
              key={p.id}
              className="practice-card"
              onClick={() => navigate(p.path)}
            >
              <div className="card-top">
                <span className={`card-status ${p.status}`}>{p.status}</span>
              </div>
              <h2 className="card-title">{p.title}</h2>
              <p className="card-desc">{p.description}</p>
            </button>
          ))}
        </main>
      </div>
    </div>
  )
}
