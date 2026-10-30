import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaCheckCircle, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaShieldAlt } from 'react-icons/fa'
import './ThankYouView.css'

export default function ThankYouView({ leadData, onNavigateHome }) {
  const userName = leadData?.name || 'Valued Customer'
  const serviceName = leadData?.service || 'Service'
  const answers = leadData?.answers || {}

  useEffect(() => {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead', {
        content_name: serviceName
      })
    }
  }, [serviceName])

  const answerEntries = Object.entries(answers).filter(([_, v]) => Boolean(v))

  return (
    <div className="thankyou-view section">
      <div className="container max-w-xl text-center">
        <motion.div
          className="thankyou-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="thankyou-brand-badge">
            <span className="thankyou-logo-frame">
              <img src="/evertree-symbol.svg" alt="EverTree" className="thankyou-logo-img" />
            </span>
            <span>EverTree <em>Solutions</em></span>
          </div>

          <div className="thankyou-icon">
            <FaCheckCircle />
          </div>
          <h1 className="thankyou-title">Request Received!</h1>
          <p className="thankyou-message">
            Thank you, <strong>{userName}</strong>, for submitting your details regarding <strong>{serviceName}</strong>. A licensed specialist will review your information and reach out with your quotes.
          </p>

          {/* Submission Summary Card */}
          <div className="thankyou-summary-card">
            <div className="thankyou-summary-header">
              <FaShieldAlt className="thankyou-shield" />
              <span>Submitted Request Details</span>
            </div>

            <div className="thankyou-grid">
              <div className="thankyou-grid-item">
                <span className="thankyou-label"><FaUser /> Name</span>
                <span className="thankyou-val">{userName}</span>
              </div>
              {leadData?.service && (
                <div className="thankyou-grid-item">
                  <span className="thankyou-label">Service</span>
                  <span className="thankyou-val thankyou-service-badge">{serviceName}</span>
                </div>
              )}
              {leadData?.email && (
                <div className="thankyou-grid-item">
                  <span className="thankyou-label"><FaEnvelope /> Email</span>
                  <span className="thankyou-val">{leadData.email}</span>
                </div>
              )}
              {leadData?.phone && (
                <div className="thankyou-grid-item">
                  <span className="thankyou-label"><FaPhone /> Phone</span>
                  <span className="thankyou-val">{leadData.phone}</span>
                </div>
              )}
              {leadData?.zip_code && (
                <div className="thankyou-grid-item">
                  <span className="thankyou-label"><FaMapMarkerAlt /> ZIP Code</span>
                  <span className="thankyou-val">{leadData.zip_code}</span>
                </div>
              )}
            </div>

            {answerEntries.length > 0 && (
              <div className="thankyou-answers-section">
                <div className="thankyou-answers-title">Questionnaire Responses:</div>
                <div className="thankyou-answers-list">
                  {answerEntries.map(([key, val], idx) => (
                    <div key={idx} className="thankyou-answer-row">
                      <span className="thankyou-ans-key">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                      <span className="thankyou-ans-val">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={onNavigateHome} className="btn btn-secondary thankyou-btn">
            Return to Home Page
          </button>
        </motion.div>
      </div>
    </div>
  )
}
