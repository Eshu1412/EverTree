import React, { useEffect, useRef } from 'react'
import './Hero.css'

function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: '16px', height: '16px', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 }}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function TrustedBy() {
  return (
    <div className="trusted animate-fade-up stagger-5">
      <div className="trusted__meta">
        <span className="trusted__stars">★★★★★</span>
        <span className="trusted__score">4.9/5 Rating</span>
        <span className="trusted__sep">•</span>
        <span>15,000+ Comparisons</span>
        <span className="trusted__sep">•</span>
        <span className="trusted__badge">Top 100 US Providers</span>
      </div>
      <p>Explore with confidence across verified verticals</p>
      <div className="trusted__logos animate-fade-up stagger-6">
        <span className="logo-playfair">Insurance</span>
        <span className="logo-oswald">HOME</span>
        <span className="logo-montserrat">Finance</span>
        <span className="logo-roboto">TRAVEL</span>
        <span className="logo-raleway">Wellbeing</span>
      </div>
    </div>
  )
}

export default function Hero({ onShowPartners }) {
  const heroRef = useRef(null)
  const mediaRef = useRef(null)
  const auroraRef = useRef(null)
  const orbitOneRef = useRef(null)
  const orbitTwoRef = useRef(null)
  const orbitThreeRef = useRef(null)
  const kickerRef = useRef(null)
  const titleRef = useRef(null)
  const summaryRef = useRef(null)
  const actionsRef = useRef(null)
  const trustedRef = useRef(null)
  const scrollPromptRef = useRef(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    let isMounted = true
    let frameId = null

    // Target values (updated on scroll / mouse)
    let targetScroll = window.scrollY
    let targetMouseX = 0
    let targetMouseY = 0

    // Interpolated values (Lerped every frame for silky inertia)
    let currentScroll = targetScroll
    let currentMouseX = 0
    let currentMouseY = 0

    const onScroll = () => {
      targetScroll = window.scrollY
    }

    const onMouseMove = (e) => {
      // Normalize mouse to -1 ... +1 from center of screen
      targetMouseX = ((e.clientX / window.innerWidth) - 0.5) * 2
      targetMouseY = ((e.clientY / window.innerHeight) - 0.5) * 2
    }

    const render = () => {
      if (!isMounted) return

      // Smooth Lerping physics:
      // Scroll momentum (0.082 = buttery responsive weight)
      currentScroll += (targetScroll - currentScroll) * 0.082
      // Mouse coordinates momentum (0.055 = silky optical drift)
      currentMouseX += (targetMouseX - currentMouseX) * 0.055
      currentMouseY += (targetMouseY - currentMouseY) * 0.055

      // Only perform transforms if hero is within or near viewport
      const heroHeight = heroRef.current ? heroRef.current.offsetHeight : 900
      if (currentScroll < heroHeight * 1.35) {
        // 1. Layer 0: Deep Paper Media (moves down slowly + zooms in, net scroll is 0.6x)
        if (mediaRef.current) {
          const mediaY = currentScroll * 0.38 + currentMouseY * 8
          const mediaX = currentMouseX * 10
          const mediaScale = 1.08 + Math.min(currentScroll * 0.00018, 0.15)
          mediaRef.current.style.transform = `translate3d(${mediaX}px, ${mediaY}px, -60px) scale(${mediaScale})`
        }

        // 2. Layer 1: Aurora Mesh (drifts and rotates counter-directionally)
        if (auroraRef.current) {
          const auroraY = currentScroll * -0.22 + currentMouseY * -16
          const auroraX = currentMouseX * -18
          const auroraRot = currentScroll * 0.045
          auroraRef.current.style.transform = `translate3d(${auroraX}px, ${auroraY}px, 0) rotate(${auroraRot}deg)`
        }

        // 3. Layer 2: 3D Celestial Orbit Rings
        if (orbitOneRef.current) {
          const o1Y = currentScroll * -0.18 + currentMouseY * -24
          const o1X = currentMouseX * -28
          const o1Rot = currentScroll * 0.075
          orbitOneRef.current.style.transform = `translate3d(${o1X}px, ${o1Y}px, 50px) rotateX(62deg) rotateZ(${o1Rot}deg) rotateY(${currentMouseX * 6}deg)`
        }

        if (orbitTwoRef.current) {
          const o2Y = currentScroll * -0.32 + currentMouseY * 30
          const o2X = currentMouseX * 36
          const o2Rot = currentScroll * -0.1
          orbitTwoRef.current.style.transform = `translate3d(${o2X}px, ${o2Y}px, 100px) rotateX(50deg) rotateZ(${o2Rot}deg) rotateY(${currentMouseY * -8}deg)`
        }

        if (orbitThreeRef.current) {
          const o3Y = currentScroll * -0.12 + currentMouseY * -14
          const o3X = currentMouseX * -18
          const o3Rot = currentScroll * 0.12
          orbitThreeRef.current.style.transform = `translate3d(${o3X}px, ${o3Y}px, 20px) rotateX(72deg) rotateZ(${o3Rot}deg)`
        }

        // 4. Layer 3: Floating Deconstructed Typography Plates
        // As you scroll down, typography separates outward with gentle negative lift and soft dissolve
        if (kickerRef.current) {
          const kickerY = currentScroll * -0.06 + currentMouseY * -4
          const kickerX = currentMouseX * -6
          kickerRef.current.style.transform = `translate3d(${kickerX}px, ${kickerY}px, 30px)`
        }

        if (titleRef.current) {
          const titleY = currentScroll * -0.14 + currentMouseY * -8
          const titleX = currentMouseX * -12
          const titleOpacity = Math.max(0, 1 - currentScroll / 480)
          const titleBlur = Math.min(6, Math.max(0, (currentScroll - 120) * 0.012))
          titleRef.current.style.transform = `translate3d(${titleX}px, ${titleY}px, 70px)`
          titleRef.current.style.opacity = titleOpacity
          titleRef.current.style.filter = titleBlur > 0.2 ? `blur(${titleBlur}px)` : 'none'
        }

        if (summaryRef.current) {
          const summaryY = currentScroll * -0.08 + currentMouseY * -12
          const summaryX = currentMouseX * -16
          const summaryOpacity = Math.max(0, 1 - currentScroll / 420)
          summaryRef.current.style.transform = `translate3d(${summaryX}px, ${summaryY}px, 100px)`
          summaryRef.current.style.opacity = summaryOpacity
        }

        if (actionsRef.current) {
          const actionsY = currentScroll * -0.02 + currentMouseY * -16
          const actionsX = currentMouseX * -20
          const actionsOpacity = Math.max(0, 1 - currentScroll / 380)
          actionsRef.current.style.transform = `translate3d(${actionsX}px, ${actionsY}px, 130px)`
          actionsRef.current.style.opacity = actionsOpacity
        }

        if (trustedRef.current) {
          const trustedY = currentScroll * 0.08 + currentMouseY * -4
          const trustedX = currentMouseX * -8
          trustedRef.current.style.transform = `translate3d(${trustedX}px, ${trustedY}px, 40px)`
        }

        // 5. Layer 4: Scroll Indicator (accelerates and fades out quickly)
        if (scrollPromptRef.current) {
          const promptOpacity = Math.max(0, 1 - currentScroll / 120)
          const promptY = currentScroll * 0.5
          scrollPromptRef.current.style.opacity = promptOpacity
          scrollPromptRef.current.style.transform = `translate3d(0, ${promptY}px, 0)`
          scrollPromptRef.current.style.pointerEvents = promptOpacity < 0.1 ? 'none' : 'auto'
        }
      }

      frameId = window.requestAnimationFrame(render)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    frameId = window.requestAnimationFrame(render)

    return () => {
      isMounted = false
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouseMove)
      if (frameId) window.cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <section className="hero hero--ultra-parallax" id="top" ref={heroRef}>
      <div className="hero__media" ref={mediaRef} aria-hidden="true">
        <img src="/evertree-hero-paper.png" alt="EverTree Paper Landscape" />
        <span className="hero__aurora" ref={auroraRef} />
        <span className="hero__orbit hero__orbit--one" ref={orbitOneRef} />
        <span className="hero__orbit hero__orbit--two" ref={orbitTwoRef} />
        <span className="hero__orbit hero__orbit--three" ref={orbitThreeRef} />
      </div>

      <div className="hero__content">
        <span className="hero-kicker animate-fade-up stagger-3" ref={kickerRef}>
          EverTree Solutions
        </span>
        <h1 className="animate-fade-up stagger-4" ref={titleRef}>
          A calmer way to find<br className="desktop-break" /> your next right step.
        </h1>
        <p className="hero-summary animate-fade-up stagger-5" ref={summaryRef}>
          Explore essential services, compare your options, and move forward with confidence.
        </p>
        <div className="hero-actions animate-fade-up stagger-6" ref={actionsRef}>
          <button className="hero-cta" onClick={() => onShowPartners('buyer')}>
            I’m a buyer <ArrowRight />
          </button>
          <button className="hero-secondary" onClick={() => onShowPartners('publisher')}>
            I’m a publisher <ArrowRight />
          </button>
        </div>
        <button 
          className="hero-explore animate-fade-up stagger-6" 
          onClick={() => document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          Explore all services <ArrowRight />
        </button>
        <div ref={trustedRef}>
          <TrustedBy />
        </div>
      </div>

      <button 
        className="hero__scroll" 
        ref={scrollPromptRef}
        onClick={() => document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      >
        <span>Scroll to explore</span>
        <i />
      </button>
    </section>
  )
}
