import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaShieldAlt, FaArrowRight } from 'react-icons/fa'
import './SplashScreen.css'

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    // Fast, crisp, native-app luxury duration: 1.4 seconds total
    const durationMs = 1400
    const intervalMs = 20
    const step = 100 / (durationMs / intervalMs)

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step
        if (next >= 100) {
          clearInterval(timer)
          handleExit()
          return 100
        }
        return next
      })
    }, intervalMs)

    return () => clearInterval(timer)
  }, [])

  const handleExit = () => {
    setExiting(true)
    setTimeout(() => {
      onComplete?.()
    }, 450)
  }

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          className="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Ambient Luxury Gradient Atmosphere */}
          <div className="splash-ambient-bg">
            <div className="splash-ambient-orb orb-1" />
            <div className="splash-ambient-orb orb-2" />
          </div>

          {/* Quick Skip button */}
          <button 
            type="button" 
            className="splash-quick-skip" 
            onClick={handleExit}
            aria-label="Skip splash screen"
          >
            <span>Skip</span>
            <FaArrowRight className="splash-skip-icon" />
          </button>

          {/* Center Brand Identity Container */}
          <motion.div 
            className="splash-brand-stage"
            initial={{ opacity: 0, scale: 0.88, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Framed Official Logo */}
            <div className="splash-logo-container">
              <img 
                src="/evertree-symbol.svg" 
                alt="EverTree Solutions Logo" 
                className="splash-logo-img" 
              />
              <div className="splash-glow-ring" />
            </div>

            {/* Brand Typography */}
            <h1 className="splash-title">
              EverTree <span className="splash-gold-word">Solutions</span>
            </h1>
            <p className="splash-subtitle">Rooted in better choices</p>

            {/* Verification Trust Pill */}
            <div className="splash-trust-badge">
              <FaShieldAlt className="splash-shield-icon" />
              <span>Enterprise Lead & Consultation Network</span>
            </div>

            {/* Hairline Luminous Progress Track */}
            <div className="splash-progress-track" aria-hidden="true">
              <div 
                className="splash-progress-fill" 
                style={{ width: `${Math.min(100, Math.round(progress))}%` }} 
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
