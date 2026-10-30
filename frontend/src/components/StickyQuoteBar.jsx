import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBolt, FaPhoneAlt, FaTimes, FaShieldAlt, FaArrowRight } from 'react-icons/fa'
import './StickyQuoteBar.css'

const SERVICES_LIST = [
  'Auto & Home Insurance',
  'Health Insurance',
  'Home Improvement',
  'Debt Relief',
  'Legal Help',
  'Medicare',
  'Flight Booking'
]

export default function StickyQuoteBar({ onQuoteClick, phone = '1-855-831-2264' }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [selectedService, setSelectedService] = useState('Auto & Home Insurance')
  const [zipCode, setZipCode] = useState('')

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 420) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onQuoteClick) {
      onQuoteClick(selectedService)
    }
  }

  if (isDismissed || !isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        className="sticky-quote-bar"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="container sticky-quote-container">
          {/* Left badge */}
          <div className="sticky-badge">
            <span className="sticky-beacon"></span>
            <span className="sticky-badge-text">Instant Comparison</span>
          </div>

          {/* Center form */}
          <form className="sticky-form" onSubmit={handleSubmit}>
            <select
              className="sticky-select"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              aria-label="Select insurance or service type"
            >
              {SERVICES_LIST.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Enter ZIP (e.g. 90210)"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
              className="sticky-zip-input"
              maxLength={5}
              aria-label="ZIP Code"
            />

            <button type="submit" className="sticky-submit-btn">
              <span>Compare Quotes</span>
              <FaArrowRight className="sticky-arrow" />
            </button>
          </form>

          {/* Right Phone Call & Close */}
          <div className="sticky-right">
            <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="sticky-phone-btn">
              <FaPhoneAlt className="sticky-phone-icon" />
              <span className="sticky-phone-number">{phone}</span>
            </a>

            <button
              type="button"
              className="sticky-close-btn"
              onClick={() => setIsDismissed(true)}
              aria-label="Dismiss sticky quote bar"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
