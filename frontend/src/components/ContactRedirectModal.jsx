import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaPhoneAlt, 
  FaCheckCircle, 
  FaTimes, 
  FaClock, 
  FaHeadset, 
  FaShieldAlt, 
  FaPause, 
  FaPlay 
} from 'react-icons/fa'
import './ContactRedirectModal.css'
import { getServicePhone } from '../utils/serviceContact'

export default function ContactRedirectModal({ 
  isOpen, 
  onClose, 
  config, 
  leadData = null,
  overridePhone = null
}) {
  const resolvedPhone = (overridePhone !== null && overridePhone !== undefined)
    ? overridePhone
    : (leadData?.service ? getServicePhone(leadData.service, leadData.category, config) : (config?.phone_number || ''))

  const phone = (resolvedPhone || '').trim()
  const cleanPhone = phone.replace(/[^0-9+]/g, '')
  const title = config?.modal_title || 'Speak With an Advisor Right Now'
  const message = config?.modal_message || 'Your request has been received! Our support specialists are available immediately to provide personal assistance and lowest quote rates.'
  const autoRedirect = Boolean(config?.auto_redirect)
  const initialSeconds = Number(config?.auto_redirect_seconds) || 5

  const [countdown, setCountdown] = useState(initialSeconds)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setCountdown(initialSeconds)
      setIsPaused(false)
    }
  }, [isOpen, initialSeconds])

  useEffect(() => {
    if (!isOpen || !autoRedirect || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleCallClick()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isOpen, autoRedirect, isPaused, cleanPhone])

  const handleCallClick = () => {
    window.location.href = `tel:${cleanPhone}`
  }

  // STRICT REQUIREMENT: If the phone number is not provided, the contact window MUST NOT display
  if (!isOpen || !phone) return null

  return (
    <AnimatePresence>
      <div className="crm-overlay" onClick={onClose}>
        <motion.div 
          className="crm-modal"
          initial={{ opacity: 0, scale: 0.9, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button 
            type="button" 
            className="crm-close-btn" 
            onClick={onClose} 
            aria-label="Close message window"
          >
            <FaTimes />
          </button>

          {/* Modal Header */}
          <div className="crm-header">
            <div className="crm-brand-top">
              <span className="crm-logo-frame">
                <img src="/evertree-symbol.svg" alt="EverTree" className="crm-logo-img" />
              </span>
              <span className="crm-brand-name">EverTree <em>Solutions</em></span>
            </div>
            <div className="crm-status-pill">
              <span className="crm-pulse-dot"></span>
              <span>Specialist Standing By</span>
            </div>
            <div className="crm-icon-badge">
              <FaHeadset />
            </div>
            <h2 className="crm-title">{title}</h2>
            <p className="crm-message">{message}</p>
          </div>

          {/* Lead confirmation snippet if available */}
          {leadData && (
            <div className="crm-lead-summary">
              <div className="crm-lead-left">
                <FaCheckCircle style={{ color: '#10b981', fontSize: '1.1rem' }} />
                <div>
                  <div className="crm-lead-service">{leadData.service || 'Quote Request'} Logged</div>
                  <div className="crm-lead-name">Reference for: <strong>{leadData.name || 'Valued Customer'}</strong></div>
                </div>
              </div>
              <span className="crm-secure-tag">
                <FaShieldAlt /> 100% Verified
              </span>
            </div>
          )}

          {/* Highlight Contact Box */}
          <div className="crm-phone-card">
            <div className="crm-phone-label">Direct Priority Contact Desk:</div>
            <a 
              href={`tel:${cleanPhone}`} 
              className="crm-phone-display" 
              title="Click to dial directly"
            >
              <FaPhoneAlt className="crm-phone-icon" />
              <span>{phone}</span>
            </a>
            <div className="crm-phone-subtext">Toll-Free • Instant Connection • Zero Waiting Time</div>
          </div>

          {/* Action Buttons */}
          <div className="crm-actions">
            <button 
              type="button" 
              className="crm-btn crm-btn-call" 
              onClick={handleCallClick}
            >
              <FaPhoneAlt />
              <span>Call {phone} Now</span>
            </button>
          </div>

          {/* Auto Redirect Countdown Bar (if enabled) */}
          {autoRedirect && (
            <div className="crm-countdown-card">
              <div className="crm-countdown-content">
                <FaClock className="crm-clock-icon" />
                <span className="crm-countdown-text">
                  Auto-connecting in <strong>{countdown}s</strong>...
                </span>
                <button 
                  type="button" 
                  className="crm-pause-btn"
                  onClick={() => setIsPaused(!isPaused)}
                  title={isPaused ? "Resume auto-redirect" : "Pause auto-redirect"}
                >
                  {isPaused ? <><FaPlay /> Resume</> : <><FaPause /> Pause</>}
                </button>
              </div>
              <div className="crm-progress-track">
                <div 
                  className="crm-progress-fill" 
                  style={{ 
                    width: `${Math.max(0, (countdown / initialSeconds) * 100)}%`,
                    transition: isPaused ? 'none' : 'width 1s linear'
                  }}
                />
              </div>
            </div>
          )}

          {/* Footer Dismiss Button */}
          <div className="crm-footer">
            <button 
              type="button" 
              className="crm-dismiss-btn" 
              onClick={onClose}
            >
              Close & View Summary
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
