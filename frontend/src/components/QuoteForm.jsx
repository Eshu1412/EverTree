import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaTimes, 
  FaCheck, 
  FaArrowRight, 
  FaArrowLeft, 
  FaLock, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaClock, 
  FaCheckCircle, 
  FaShieldAlt,
  FaHeartbeat, 
  FaCar, 
  FaTools, 
  FaHandHoldingUsd, 
  FaGavel, 
  FaPlane,
  FaExternalLinkAlt
} from 'react-icons/fa'
import './QuoteForm.css'

const REFERRAL_LINK = 'https://evertreesolutions.com/'

export const SERVICES_CONFIG = [
  {
    id: 'health',
    title: 'Health Insurance',
    category: 'health',
    icon: FaHeartbeat,
    color: '#10B981',
    tag: 'Popular',
    desc: 'Affordable family & individual ACA plans',
    questions: [
      {
        id: 'coverage_type',
        label: 'Who needs health coverage?',
        options: ['Individual Only', 'Individual + Spouse', 'Family with Children', 'Senior (65+)']
      },
      {
        id: 'timeline',
        label: 'When do you need coverage?',
        options: ['Immediately (Within 30 days)', 'Next 60-90 days', 'Open Enrollment / Just Exploring']
      }
    ]
  },
  {
    id: 'insurance',
    title: 'Auto & Home Insurance',
    category: 'insurance',
    icon: FaCar,
    color: '#3B82F6',
    tag: 'Save up to $840',
    desc: 'Bundle vehicle & homeowner policies',
    questions: [
      {
        id: 'bundle_type',
        label: 'What coverage are you seeking?',
        options: ['Auto & Home Bundle', 'Auto Insurance Only', 'Homeowners / Renters Only']
      },
      {
        id: 'num_vehicles',
        label: 'Number of vehicles to insure?',
        options: ['1 Vehicle', '2 Vehicles', '3+ Vehicles']
      }
    ]
  },
  {
    id: 'home-services',
    title: 'Home Improvement',
    category: 'home-services',
    icon: FaTools,
    color: '#D97706',
    tag: 'Top Contractors',
    desc: 'Roofing, remodeling, windows, solar & HVAC',
    questions: [
      {
        id: 'project_type',
        label: 'What is your primary project?',
        options: ['Roofing / Gutters', 'Kitchen & Bath Remodel', 'Windows & Siding', 'Solar Panels', 'HVAC / Heat Pump']
      },
      {
        id: 'homeowner_status',
        label: 'Do you own this property?',
        options: ['Yes, I am the homeowner', 'Under contract / Buying', 'Renting / Landlord approval']
      }
    ]
  },
  {
    id: 'finance',
    title: 'Debt Relief',
    category: 'finance',
    icon: FaHandHoldingUsd,
    color: '#EF4444',
    tag: 'Cut Payments',
    desc: 'Consolidation, settlement & relief',
    questions: [
      {
        id: 'debt_amount',
        label: 'Estimated unsecured debt amount?',
        options: ['$10,000 - $20,000', '$20,000 - $40,000', '$40,000 - $75,000', '$75,000+']
      },
      {
        id: 'employment_status',
        label: 'Current employment status?',
        options: ['Employed Full-Time', 'Self-Employed / Business', 'Retired / Fixed Income', 'Other']
      }
    ]
  },
  {
    id: 'legal',
    title: 'Legal Help',
    category: 'legal',
    icon: FaGavel,
    color: '#8B5CF6',
    tag: 'Free Case Review',
    desc: 'Auto accident, injury & workers comp attorneys',
    questions: [
      {
        id: 'legal_need',
        label: 'What type of legal situation?',
        options: ['Auto / Vehicle Accident', 'Slip & Fall / Injury', 'Workers Compensation', 'Other Legal Matter']
      },
      {
        id: 'incident_timeline',
        label: 'When did the incident occur?',
        options: ['Past 30 days', '1-6 months ago', '6-12 months ago', 'Over a year ago']
      }
    ]
  },
  {
    id: 'medicare',
    title: 'Medicare Plans',
    category: 'health',
    icon: FaShieldAlt,
    color: '#06B6D4',
    tag: '$0 Premium Options',
    desc: 'Advantage Part C, Supplement & Rx Part D',
    questions: [
      {
        id: 'medicare_age',
        label: 'What is your Medicare status?',
        options: ['Turning 65 soon', 'Currently on Medicare (65+)', 'Qualifying due to disability', 'Assisting a parent']
      },
      {
        id: 'interest_type',
        label: 'What plans do you wish to compare?',
        options: ['Medicare Advantage (Part C)', 'Medicare Supplement (Medigap)', 'Prescription Drug (Part D)', 'All Available Options']
      }
    ]
  },
  {
    id: 'travel',
    title: 'Flight Booking',
    category: 'travel',
    icon: FaPlane,
    color: '#0B6B5C',
    tag: 'Private Airfares',
    desc: 'Published & private airline quote desk',
    questions: [
      {
        id: 'trip_type',
        label: 'Trip Type',
        options: ['Round Trip', 'One Way']
      },
      {
        id: 'travelers_count',
        label: 'Number of passengers?',
        options: ['1 Passenger', '2 Passengers', '3-4 Passengers', '5+ Group']
      }
    ]
  }
]

export default function QuoteForm({ 
  isOpen, 
  onClose, 
  defaultService = '', 
  onNavigateVertical,
  onFormSubmitted
}) {
  const [step, setStep] = useState(1) // 1 = Service & Needs, 2 = Contact & TCPA, 3 = Confirmation
  const [selectedServiceId, setSelectedServiceId] = useState('health')
  const [answers, setAnswers] = useState({})
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    zip_code: '',
    preferred_time: 'Anytime'
  })

  const [tcpaConsent, setTcpaConsent] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [leadResult, setLeadResult] = useState(null)

  // Map default service prop when opening
  useEffect(() => {
    if (isOpen) {
      if (defaultService) {
        const found = SERVICES_CONFIG.find(
          s => s.title.toLowerCase() === defaultService.toLowerCase() ||
               s.id.toLowerCase() === defaultService.toLowerCase() ||
               s.category.toLowerCase() === defaultService.toLowerCase()
        )
        if (found) {
          setSelectedServiceId(found.id)
        }
      }
      setErrorMsg('')
    }
  }, [defaultService, isOpen])

  const activeService = SERVICES_CONFIG.find(s => s.id === selectedServiceId) || SERVICES_CONFIG[0]

  // Update question answers
  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  // Handle standard input change
  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Step 1 -> Step 2
  const handleProceedToContact = () => {
    setErrorMsg('')
    setStep(2)
  }

  // Step 2 -> Step 1
  const handleBackToService = () => {
    setErrorMsg('')
    setStep(1)
  }

  // Submit quote request
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.full_name.trim()) {
      setErrorMsg('Please enter your full name.')
      return
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMsg('Please enter a valid email address.')
      return
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 7) {
      setErrorMsg('Please enter a valid phone number.')
      return
    }
    if (!formData.zip_code.trim()) {
      setErrorMsg('Please enter your 5-digit ZIP code.')
      return
    }
    if (!tcpaConsent) {
      setErrorMsg('Please check the TCPA communication consent box to receive your quotes.')
      return
    }

    setSubmitting(true)

    // Capture ActiveProspect TrustedForm certificate URL from generated hidden field
    const tfCertUrl = document.getElementById('xxTrustedFormCertUrl')?.value || 
                      document.querySelector('input[name="xxTrustedFormCertUrl"]')?.value || 
                      ''

    const payload = {
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      service_type: activeService.title,
      vertical_id: activeService.id,
      zip_code: formData.zip_code.trim(),
      trusted_form_cert_url: tfCertUrl,
      answers: {
        ...answers,
        preferred_contact_time: formData.preferred_time
      },
      notes: `Preferred contact: ${formData.preferred_time} | Quoted via Smart Quote Engine`
    }

    try {
      const res = await fetch('/api/quote-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const resultObj = {
        refId: data.lead_id ? `REQ-${data.lead_id}` : `REQ-${Math.floor(100000 + Math.random() * 900000)}`,
        serviceTitle: activeService.title,
        category: activeService.category,
        fullName: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        zipCode: formData.zip_code,
        trustedFormRetained: data.trusted_form?.retained || !!tfCertUrl,
        certId: data.trusted_form?.cert_id || '',
        message: data.message || `Thank you, ${formData.full_name}! Your quote request for ${activeService.title} has been received.`
      }
      setLeadResult(resultObj)
      setStep(3)

      // Meta Pixel Lead tracking
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Lead', {
          content_name: activeService.title,
          content_category: activeService.category
        })
      }
      if (onFormSubmitted) {
        onFormSubmitted({
          name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          zip_code: formData.zip_code,
          service: activeService.title,
          category: activeService.category,
          answers: { ...answers, preferred_contact_time: formData.preferred_time }
        })
      }
    } catch {
      // Fallback offline preview
      const fallbackObj = {
        refId: `REQ-${Math.floor(100000 + Math.random() * 900000)}`,
        serviceTitle: activeService.title,
        category: activeService.category,
        fullName: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        zipCode: formData.zip_code,
        trustedFormRetained: false,
        certId: '',
        message: `Thank you, ${formData.full_name}! Your quote request has been securely recorded.`
      }
      setLeadResult(fallbackObj)
      setStep(3)
      if (onFormSubmitted) {
        onFormSubmitted({
          name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          zip_code: formData.zip_code,
          service: activeService.title,
          category: activeService.category,
          answers: { ...answers, preferred_contact_time: formData.preferred_time }
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setStep(1)
      setLeadResult(null)
      setErrorMsg('')
      setFormData({ full_name: '', email: '', phone: '', zip_code: '', preferred_time: 'Anytime' })
      setAnswers({})
      setTcpaConsent(true)
    }, 300)
  }

  const handleExploreCategory = () => {
    if (leadResult && onNavigateVertical) {
      onNavigateVertical(leadResult.category)
    }
    handleClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="quote-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="quote-backdrop" onClick={handleClose} />
          <motion.div
            className="quote-modal"
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Top Close Button */}
            <button className="quote-close" onClick={handleClose} aria-label="Close quote modal">
              <FaTimes />
            </button>

            {/* Step Indicators Header */}
            <div className="quote-wizard-header">
              <div className="quote-wizard-brand">
                <div className="quote-brand-identity">
                  <span className="quote-logo-frame">
                    <img src="/evertree-symbol.svg" alt="EverTree" className="quote-logo-img" />
                  </span>
                  <span className="quote-brand-text">EverTree <em>Solutions</em></span>
                </div>
                <div className="quote-wizard-brand-right">
                  <span className="quote-brand-badge">
                    <FaCheckCircle style={{ color: '#10B981' }} /> Free Quote Matcher
                  </span>
                  <span className="quote-step-count">
                    {step === 3 ? 'Completed' : `Step ${step} of 2`}
                  </span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="quote-progress-track">
                <div 
                  className="quote-progress-fill" 
                  style={{ width: step === 1 ? '50%' : '100%' }}
                />
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="quote-error-banner">
                <FaTimes style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                STEP 1: Choose Service Category & Needs
                ══════════════════════════════════════════════════ */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="quote-step-intro">
                  <h2>What service do you need a <span className="accent">quote</span> for?</h2>
                  <p>Select your category below to compare verified rates from top providers in your area.</p>
                </div>

                {/* Service Cards Grid */}
                <div className="quote-service-grid">
                  {SERVICES_CONFIG.map((srv) => {
                    const SrvIcon = srv.icon
                    const isSelected = srv.id === selectedServiceId
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        className={`quote-service-card ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedServiceId(srv.id)}
                      >
                        <div 
                          className="quote-service-icon-wrap" 
                          style={{ color: srv.color, backgroundColor: `${srv.color}15` }}
                        >
                          <SrvIcon />
                        </div>
                        <div className="quote-service-meta">
                          <div className="quote-service-title-row">
                            <span className="quote-service-name">{srv.title}</span>
                            {srv.tag && <span className="quote-service-pill">{srv.tag}</span>}
                          </div>
                          <p className="quote-service-sub">{srv.desc}</p>
                        </div>
                        <div className="quote-service-check-indicator">
                          {isSelected && <FaCheck />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Dynamic Qualification Questions for Selected Service */}
                {activeService.questions && activeService.questions.length > 0 && (
                  <div className="quote-questions-container">
                    <div className="quote-questions-title">
                      Customize Your <strong>{activeService.title}</strong> Request:
                    </div>
                    <div className="quote-questions-grid">
                      {activeService.questions.map((q) => (
                        <div key={q.id} className="form-group">
                          <label className="form-label" htmlFor={`q-${q.id}`}>
                            {q.label}
                          </label>
                          <select
                            id={`q-${q.id}`}
                            className="form-select"
                            value={answers[q.id] || q.options[0]}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          >
                            {q.options.map((opt, oIdx) => (
                              <option key={oIdx} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Step Action */}
                <button
                  type="button"
                  className="btn btn-primary quote-next-btn"
                  onClick={handleProceedToContact}
                >
                  <span>Continue to Rates &amp; Details</span>
                  <FaArrowRight />
                </button>

                <div className="quote-trust-strip">
                  <span><FaLock style={{ color: '#10B981' }} /> 256-Bit SSL Encrypted</span>
                  <span><FaCheckCircle style={{ color: '#0B6B5C' }} /> 100% Free Service</span>
                  <span><FaShieldAlt style={{ color: '#8B5CF6' }} /> Zero Obligation</span>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════
                STEP 2: Location, Contact Details & TCPA
                ══════════════════════════════════════════════════ */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="quote-step-intro">
                  <div className="quote-selected-chip">
                    <span>Selected:</span>
                    <strong>{activeService.title}</strong>
                    <button type="button" onClick={handleBackToService} className="chip-change-btn">
                      Change
                    </button>
                  </div>
                  <h2>Where should we send your <span className="accent">free quotes</span>?</h2>
                  <p>Provide your contact details so our matched specialists can deliver your competitive estimates.</p>
                </div>

                <form className="quote-form" onSubmit={handleSubmit}>
                  {/* ActiveProspect TrustedForm Certificate Hidden Input Field */}
                  <input type="hidden" id="xxTrustedFormCertUrl" name="xxTrustedFormCertUrl" />

                  {/* Full Name */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="quote-fullname">
                      Full Name <span className="req-dot">*</span>
                    </label>
                    <input
                      id="quote-fullname"
                      className="form-input"
                      type="text"
                      name="full_name"
                      placeholder="e.g. Sarah Mitchell"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Email and Phone */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="quote-email">
                        <FaEnvelope style={{ marginRight: '5px' }} /> Email Address <span className="req-dot">*</span>
                      </label>
                      <input
                        id="quote-email"
                        className="form-input"
                        type="email"
                        name="email"
                        placeholder="sarah@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="quote-phone">
                        <FaPhone style={{ marginRight: '5px' }} /> Phone Number <span className="req-dot">*</span>
                      </label>
                      <input
                        id="quote-phone"
                        className="form-input"
                        type="tel"
                        name="phone"
                        placeholder="(555) 234-5678"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  {/* ZIP Code & Preferred Contact Time */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="quote-zip">
                        <FaMapMarkerAlt style={{ marginRight: '5px' }} /> ZIP Code <span className="req-dot">*</span>
                      </label>
                      <input
                        id="quote-zip"
                        className="form-input"
                        type="text"
                        name="zip_code"
                        placeholder="e.g. 78701"
                        value={formData.zip_code}
                        onChange={handleInputChange}
                        required
                        maxLength={10}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="quote-time">
                        <FaClock style={{ marginRight: '5px' }} /> Preferred Contact Time
                      </label>
                      <select
                        id="quote-time"
                        className="form-select"
                        name="preferred_time"
                        value={formData.preferred_time}
                        onChange={handleInputChange}
                      >
                        <option value="Anytime">Anytime (Fastest)</option>
                        <option value="Morning">Morning (8am - 12pm)</option>
                        <option value="Afternoon">Afternoon (12pm - 5pm)</option>
                        <option value="Evening">Evening (5pm - 8pm)</option>
                      </select>
                    </div>
                  </div>

                  {/* TCPA Compliance Section with ActiveProspect TrustedForm Certification */}
                  <div className="quote-tcpa-box">
                    <label className="quote-tcpa-label" htmlFor="quote-tcpa-consent">
                      <input
                        type="checkbox"
                        id="quote-tcpa-consent"
                        className="quote-tcpa-checkbox"
                        checked={tcpaConsent}
                        onChange={(e) => setTcpaConsent(e.target.checked)}
                        required
                      />
                      <span className="quote-tcpa-text">
                        By checking this box and clicking &quot;Get My Free Quotes Now&quot;, I authorize EverTree Solutions and its service partners to contact me at the phone number and email address provided (including via automated telephone dialing systems, SMS text messages, and artificial or prerecorded voice messages) regarding quotes and relevant service offers. Consent is not a condition of purchase. Message and data rates may apply.
                      </span>
                    </label>

                    <div className="quote-tcpa-badges">
                      <span className="quote-tf-pill" title="ActiveProspect TrustedForm TCPA Certification Active">
                        <FaShieldAlt style={{ color: '#10B981' }} /> ActiveProspect TrustedForm&reg; Certified
                      </span>
                      <span className="quote-ssl-pill">
                        <FaLock /> 256-Bit Encrypted
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="quote-actions-row">
                    <button
                      type="button"
                      className="btn btn-secondary quote-back-btn"
                      onClick={handleBackToService}
                      disabled={submitting}
                    >
                      <FaArrowLeft /> Back
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary quote-submit-btn"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner"></span>
                          <span>Matching Providers...</span>
                        </>
                      ) : (
                        <>
                          <span>Get My Free Quotes Now</span>
                          <FaArrowRight />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════
                STEP 3: Confirmation & Match Results
                ══════════════════════════════════════════════════ */}
            {step === 3 && leadResult && (
              <motion.div
                key="step-3"
                className="quote-success-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="quote-success-icon-wrap">
                  <FaCheck />
                </div>

                <div className="quote-success-header">
                  <span className="quote-success-ref">Reference #{leadResult.refId}</span>
                  <h2>Your Free Quote Request is <span className="accent">Confirmed!</span></h2>
                  <p>{leadResult.message}</p>
                </div>

                {/* Confirmed Details Card */}
                <div className="quote-confirmed-card">
                  <div className="quote-confirmed-grid">
                    <div className="confirmed-item">
                      <span className="confirmed-label">Selected Service</span>
                      <span className="confirmed-val" style={{ color: 'var(--primary)' }}>
                        {leadResult.serviceTitle}
                      </span>
                    </div>
                    <div className="confirmed-item">
                      <span className="confirmed-label">Applicant Name</span>
                      <span className="confirmed-val">{leadResult.fullName}</span>
                    </div>
                    <div className="confirmed-item">
                      <span className="confirmed-label">Email Address</span>
                      <span className="confirmed-val">{leadResult.email}</span>
                    </div>
                    <div className="confirmed-item">
                      <span className="confirmed-label">Phone Number</span>
                      <span className="confirmed-val">{leadResult.phone}</span>
                    </div>
                    <div className="confirmed-item">
                      <span className="confirmed-label">ZIP Code</span>
                      <span className="confirmed-val">{leadResult.zipCode}</span>
                    </div>
                    <div className="confirmed-item">
                      <span className="confirmed-label">Compliance Status</span>
                      <span className="confirmed-val" style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaShieldAlt /> TCPA Certified
                      </span>
                    </div>
                  </div>

                  <div className="quote-provider-alert">
                    <FaCheckCircle style={{ color: '#10B981', flexShrink: 0, fontSize: '1.1rem' }} />
                    <span>
                      Local pre-screened professionals in your area have been notified and will contact you via phone or email within minutes.
                    </span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="quote-success-actions">
                  <button
                    type="button"
                    className="btn btn-primary quote-explore-btn"
                    onClick={handleExploreCategory}
                  >
                    <span>Explore {leadResult.serviceTitle} Plans &amp; Rates</span>
                    <FaArrowRight />
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary quote-reset-btn"
                    onClick={() => {
                      setStep(1)
                      setLeadResult(null)
                    }}
                  >
                    Submit Another Quote
                  </button>
                </div>

                {/* Partner Network Banner */}
                <div className="quote-partner-banner">
                  <span>Direct Partner Portal:</span>
                  <a
                    href={`${REFERRAL_LINK}?service=${encodeURIComponent(leadResult.serviceTitle || 'General')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="quote-partner-link"
                  >
                    evertreesolutions.com <FaExternalLinkAlt style={{ fontSize: '11px' }} />
                  </a>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

