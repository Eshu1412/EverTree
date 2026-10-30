import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaHome, FaChevronRight, FaCheckCircle, FaLock, FaShieldAlt, FaHeartbeat, FaHammer, FaHandHoldingUsd, FaGavel, FaStethoscope, FaHeart, FaFileAlt, FaCar, FaHome as FaHomeIcon, FaLayerGroup, FaTint, FaThermometerHalf, FaWindowMaximize, FaBath, FaBug, FaWater, FaWrench, FaTools, FaBroom, FaTree, FaChartLine, FaMoneyBillWave, FaCarCrash, FaUserNurse } from 'react-icons/fa'
import { servicesDb } from '../data/servicesData'
import './SubVerticalView.css'

const iconMap = {
  FaHeartbeat,
  FaShieldAlt,
  FaHammer,
  FaHandHoldingUsd,
  FaGavel,
  FaStethoscope,
  FaHeart,
  FaFileAlt,
  FaCar,
  FaHome: FaHomeIcon,
  FaLayerGroup,
  FaTint,
  FaThermometerHalf,
  FaWindowMaximize,
  FaBath,
  FaBug,
  FaWater,
  FaWrench,
  FaTools,
  FaBroom,
  FaTree,
  FaChartLine,
  FaMoneyBillWave,
  FaCarCrash,
  FaUserNurse,
  FaActivity: FaHeartbeat
}

export default function SubVerticalView({ verticalId, subId, onNavigateHome, onNavigateVertical, onFormSubmitted }) {
  const vertical = servicesDb[verticalId]
  const sub = vertical?.subs?.[subId]

  const [customAnswers, setCustomAnswers] = useState({})
  const [contactData, setContactData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    zip_code: '',
    tcpa_consent: false,
  })
  const [submitting, setSubmitting] = useState(false)

  if (!vertical || !sub) {
    return (
      <div className="subvertical-error">
        <h2>Service Not Found</h2>
        <button onClick={onNavigateHome} className="btn btn-primary">Return Home</button>
      </div>
    )
  }

  const HeaderIcon = iconMap[sub.icon] || FaShieldAlt

  const handleCustomChange = (e) => {
    setCustomAnswers({ ...customAnswers, [e.target.name]: e.target.value })
  }

  const handleContactChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setContactData({ ...contactData, [e.target.name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const tfCertUrl = document.getElementById('xxTrustedFormCertUrl')?.value || document.querySelector('input[name="xxTrustedFormCertUrl"]')?.value || ''
    const payload = {
      vertical_id: verticalId,
      sub_id: subId,
      service_type: sub.title,
      full_name: `${contactData.first_name} ${contactData.last_name}`.trim(),
      email: contactData.email,
      phone: contactData.phone,
      zip_code: contactData.zip_code,
      trusted_form_cert_url: tfCertUrl,
      answers: customAnswers,
    }

    try {
      await fetch('/api/quote-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (err) {
      console.warn('Backend endpoint unavailable, continuing to confirmation view.', err)
    } finally {
      setSubmitting(false)
      if (onFormSubmitted) {
        onFormSubmitted({
          name: `${contactData.first_name} ${contactData.last_name}`.trim() || 'Valued Customer',
          first_name: contactData.first_name,
          last_name: contactData.last_name,
          email: contactData.email,
          phone: contactData.phone,
          zip_code: contactData.zip_code,
          service: sub.title,
          answers: customAnswers,
        })
      }
    }
  }

  return (
    <div className="subvertical-view section">
      <div className="container max-w-5xl">
        {/* Breadcrumbs */}
        <nav className="breadcrumb">
          <button onClick={onNavigateHome} className="breadcrumb-link">
            <FaHome style={{ marginRight: '6px' }} /> Home
          </button>
          <FaChevronRight className="breadcrumb-separator" />
          <button onClick={() => onNavigateVertical(verticalId)} className="breadcrumb-link">
            {vertical.title}
          </button>
          <FaChevronRight className="breadcrumb-separator" />
          <span className="breadcrumb-current">{sub.title}</span>
        </nav>

        {/* Header */}
        <div className="subvertical-header">
          <div className="subvertical-icon-box">
            <HeaderIcon />
          </div>
          <h1 className="subvertical-title">{sub.title} Plans & Quotes</h1>
          <p className="subvertical-subtitle">
            Review the available service levels below. Fill out the form to check your eligibility and get exact local pricing securely.
          </p>
        </div>

        {/* Plans Grid */}
        <div className={`plans-grid plans-grid--${Math.min(sub.plans.length, 3)}`}>
          {sub.plans.map((plan, idx) => (
            <motion.div
              key={idx}
              className="plan-card"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="plan-card-top"></div>
              <div className="plan-card-body">
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price">{plan.price}</div>
                <p className="plan-detail">{plan.detail}</p>
                <ul className="plan-features">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="plan-feature-item">
                      <FaCheckCircle className="feature-check" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Form Container */}
        <div className="form-wrapper" id="form-container">
          <div className="form-banner">
            <h2>Check Qualifications & Pricing</h2>
            <p>
              <FaLock style={{ marginRight: '6px' }} /> Takes less than 60 seconds. Secure and confidential.
            </p>
          </div>

          <form className="qualification-form" onSubmit={handleSubmit}>
            {/* TrustedForm Certificate Hidden Field */}
            <input type="hidden" id="xxTrustedFormCertUrl" name="xxTrustedFormCertUrl" />
            {/* Step 1: Your Needs */}
            <div className="form-section">
              <h3 className="form-section-title">
                <span className="step-badge">1</span> Your Needs
              </h3>
              <div className="form-questions-grid">
                {sub.form.map((field, fIdx) => (
                  <div key={fIdx} className="form-field-group">
                    <label className="form-label">{field.label}</label>
                    <select
                      name={field.name}
                      required
                      className="form-select"
                      value={customAnswers[field.name] || ''}
                      onChange={handleCustomChange}
                    >
                      <option value="" disabled>-- Select an option --</option>
                      {field.options.map((opt, oIdx) => (
                        <option key={oIdx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Contact Details */}
            <div className="form-section pt-4">
              <h3 className="form-section-title">
                <span className="step-badge">2</span> Contact Details
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    className="form-input"
                    placeholder="John"
                    value={contactData.first_name}
                    onChange={handleContactChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    className="form-input"
                    placeholder="Doe"
                    value={contactData.last_name}
                    onChange={handleContactChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="form-input"
                    placeholder="(555) 000-0000"
                    value={contactData.phone}
                    onChange={handleContactChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="form-input"
                    placeholder="john@example.com"
                    value={contactData.email}
                    onChange={handleContactChange}
                  />
                </div>
              </div>

              <div className="form-group zip-group">
                <label className="form-label">Zip Code</label>
                <input
                  type="text"
                  name="zip_code"
                  required
                  pattern="[0-9]{5}"
                  maxLength={5}
                  className="form-input"
                  placeholder="12345"
                  value={contactData.zip_code}
                  onChange={handleContactChange}
                />
              </div>
            </div>

            {/* TCPA Compliance */}
            <div className="tcpa-box">
              <label className="tcpa-label">
                <input
                  type="checkbox"
                  name="tcpa_consent"
                  required
                  checked={contactData.tcpa_consent}
                  onChange={handleContactChange}
                  className="tcpa-checkbox"
                />
                <span className="tcpa-text">
                  By checking this box and clicking "Get My Quote Securely", you agree to our Terms of Service and Privacy Policy. You authorize EverTree Solutions and its partners to contact you at the phone number provided, including via automated dialing systems, prerecorded messages, and text messages. Consent is not a condition of purchase.
                </span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary submit-btn" disabled={submitting}>
              <FaShieldAlt style={{ marginRight: '8px' }} />
              <span>{submitting ? 'Processing Request...' : 'Get My Quote Securely'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
