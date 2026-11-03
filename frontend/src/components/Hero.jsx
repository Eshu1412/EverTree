import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaCheck, FaShieldAlt } from 'react-icons/fa'
import { FiRadio, FiShoppingBag, FiArrowRight, FiCheckCircle } from 'react-icons/fi'
import ScrollReveal from './ScrollReveal'
import { trackLead } from '../integrations/tracking'
import './Hero.css'

export default function Hero({ onQuoteClick, onFormSubmitted }) {
  // 'buyer' | 'publisher'
  const [role, setRole] = useState('buyer')
  const formCardRef = useRef(null)

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    vertical: 'Health & Life Insurance',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [submitError, setSubmitError] = useState('')

  const benefits = [
    'Pre-Screened & Licensed Professionals',
    'Transparent Real-Time Comparisons',
    '100% Free & Obligation-Free'
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSubmitError('')
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectRole = (newRole) => {
    setRole(newRole)
    setSubmitError('')
    const defaultVertical = newRole === 'buyer' ? 'Health & Life Insurance' : 'Final Expense supply'
    setFormData((prev) => ({ ...prev, vertical: defaultVertical }))
    if (formCardRef.current) {
      formCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      return
    }

    setIsSubmitting(true)

    const endpoint = role === 'buyer' ? '/api/buyers/register' : '/api/publishers/register'
    const payload = {
      full_name: formData.name.trim(),
      company: formData.company.trim() || 'Independent',
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      vertical: formData.vertical || 'Other',
      message: formData.message.trim(),
      notes: `Submitted via EverTree Consultation Card | Role: ${role}`
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await res.json()
      if (res.ok && result.success) {
        setSuccessMessage(result.message || 'Your request has been received!')
        setFormSuccess(true)
        trackLead(formData.vertical || role, role === 'buyer' ? 'Buyer Access' : 'Publisher Application')
        if (onFormSubmitted) {
          onFormSubmitted({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            company: formData.company,
            service: formData.vertical || role,
            category: role
          })
        }
      } else {
        setSubmitError(result.detail || 'Could not submit your request. Please check your details and try again.')
      }
    } catch (err) {
      console.error('Submission error:', err)
      setSubmitError('Unable to connect to server. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetForm = () => {
    setSubmitError('')
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      vertical: role === 'buyer' ? 'Health & Life Insurance' : 'Final Expense supply',
      message: ''
    })
    setFormSuccess(false)
    setSuccessMessage('')
  }

  return (
    <>
      <section className="hero" id="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <ScrollReveal delay={0.08} duration={0.4}>
              <div className="hero-badge-wrap">
                <span className="hero-badge-dot"></span>
                <p className="hero-badge">LEAD GENERATION, DONE RIGHT</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.16} duration={0.4}>
              <h1 className="hero-title">
                Leads that <span className="hero-title-gradient">grow with you.</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={0.24} duration={0.4}>
              <p className="hero-subtitle">
                We attract, qualify, and deliver ready-to-talk prospects, so your team spends its time closing, not chasing.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.32} duration={0.4}>
              <div className="hero-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleSelectRole('buyer')}
                >
                  <span>I’m a Buyer</span>
                  <FiArrowRight style={{ marginLeft: '6px' }} />
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleSelectRole('publisher')}
                >
                  <span>I’m a Publisher</span>
                  <FiArrowRight style={{ marginLeft: '6px' }} />
                </button>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={0.2} duration={0.4}>
            <div id="start" ref={formCardRef} className="hero-consultation compact" aria-label="Start your free consultation">
              <h2 className="consultation-title">Get your free consultation</h2>
              <p className="consultation-desc">Tell us a little about your business or needs.</p>

              {/* EverTree Luxury Role Switcher */}
              <div className="consultation-role-switcher" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={role === 'buyer'}
                  className={`consultation-role-btn ${role === 'buyer' ? 'active' : ''}`}
                  onClick={() => handleSelectRole('buyer')}
                >
                  <FiShoppingBag className="role-icon" />
                  <span>I am a Buyer</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={role === 'publisher'}
                  className={`consultation-role-btn ${role === 'publisher' ? 'active' : ''}`}
                  onClick={() => handleSelectRole('publisher')}
                >
                  <FiRadio className="role-icon" />
                  <span>I am a Publisher</span>
                </button>
              </div>

              {formSuccess ? (
                <div className="consultation-success" role="alert">
                  <strong>Thank you, {formData.name}!</strong>
                  <p>{successMessage || 'Your request has been received. An EverTree advisor will connect with you shortly.'}</p>
                  <button
                    type="button"
                    className="consultation-cta"
                    onClick={handleResetForm}
                    style={{ marginTop: '0.75rem', padding: '10px' }}
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form className="consultation-form" onSubmit={handleSubmit}>
                  {/* Row 1: 2-column grid for Name & Company */}
                  <div className="consultation-row-2col">
                    <div className="consultation-field">
                      <label htmlFor="n">Full name</label>
                      <input
                        id="n"
                        name="name"
                        type="text"
                        placeholder="Jane Doe"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="consultation-field">
                      <label htmlFor="c">Company <span style={{ fontWeight: 400, color: '#5E7673', fontSize: '11px' }}>(optional)</span></label>
                      <input
                        id="c"
                        name="company"
                        type="text"
                        placeholder="Acme Financial"
                        value={formData.company}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Row 2: 2-column grid for Email & Phone */}
                  <div className="consultation-row-2col">
                    <div className="consultation-field">
                      <label htmlFor="e">Work email</label>
                      <input
                        id="e"
                        name="email"
                        type="email"
                        placeholder="jane@company.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="consultation-field">
                      <label htmlFor="p">Phone</label>
                      <input
                        id="p"
                        name="phone"
                        type="tel"
                        placeholder="(555) 000-0000"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Row 3: Vertical dropdown */}
                  <div className="consultation-field">
                    <label htmlFor="q">
                      {role === 'buyer' ? 'Vertical / Service needed' : 'Traffic supply vertical'}
                    </label>
                    <select
                      id="q"
                      name="vertical"
                      value={formData.vertical}
                      onChange={handleInputChange}
                      required
                    >
                      {role === 'buyer' ? (
                        <>
                          <option value="Health & Life Insurance">Health &amp; Life Insurance</option>
                          <option value="Final Expense">Final Expense</option>
                          <option value="SSDI">SSDI</option>
                          <option value="Auto & Home Insurance">Auto &amp; Home Insurance</option>
                          <option value="Home Improvement">Home Improvement</option>
                          <option value="Debt Settlement">Debt Relief &amp; Settlement</option>
                          <option value="Business Funding / MCA">Business Funding / MCA</option>
                          <option value="IRS Tax Settlement">IRS Tax Settlement</option>
                          <option value="Legal Help">Legal Help &amp; Representation</option>
                          <option value="Medicare">Medicare Plans</option>
                          <option value="Flight Booking">Flight Booking &amp; Travel</option>
                          <option value="Other">Other</option>
                        </>
                      ) : (
                        <>
                          <option value="Final Expense supply">Final Expense supply</option>
                          <option value="SSDI supply">SSDI supply</option>
                          <option value="MVA (CPA)">MVA (CPA)</option>
                          <option value="Mass Torts">Mass Torts</option>
                          <option value="Insurance Inbound Leads">Insurance Inbound Leads</option>
                          <option value="Debt Relief supply">Debt Relief supply</option>
                          <option value="Other">Other</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Row 4: Compact Message (optional) */}
                  <div className="consultation-field">
                    <label htmlFor="m">
                      Message <span style={{ fontWeight: 400, color: '#5E7673', fontSize: '11px' }}>(optional)</span>
                    </label>
                    <textarea
                      id="m"
                      name="message"
                      rows="2"
                      placeholder="Volume, target states, requirements, or anything that helps."
                      value={formData.message}
                      onChange={handleInputChange}
                    />
                  </div>

                  {submitError && (
                    <div className="consultation-error-banner" role="alert">
                      {submitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="consultation-cta"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Submitting...'
                      : (
                        <>
                          <span>{role === 'buyer' ? 'Request Buyer Access' : 'Apply as a Publisher'}</span>
                          <FiArrowRight style={{ marginLeft: '6px' }} />
                        </>
                      )}
                  </button>

                  <small>No cost. No obligation. 100% confidential &amp; secure.</small>

                  <p className="consultation-tcpa">
                    By submitting this form, you provide your express written consent for EverTree Solutions, Inc., and its representatives to contact you at the phone number and email address you provided, including by autodialed and prerecorded or artificial-voice calls and text messages, even if your number is on a federal, state, or internal Do Not Call list. Consent is not a condition of any purchase. Message frequency varies. Message and data rates may apply. Reply STOP to opt out at any time. See our{' '}
                    <button
                      type="button"
                      className="consultation-legal-link"
                      onClick={() => window.dispatchEvent(new CustomEvent('open_legal_modal', { detail: 'privacy' }))}
                    >
                      Privacy Policy
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      className="consultation-legal-link"
                      onClick={() => window.dispatchEvent(new CustomEvent('open_legal_modal', { detail: 'terms' }))}
                    >
                      Terms of Use
                    </button>.
                  </p>
                </form>
              )}
            </div>
          </ScrollReveal>
        </div>

        <div className="hero-benefits container">
          {benefits.map((benefit) => (
            <div className="hero-benefit-item" key={benefit}>
              <span className="benefit-icon-badge"><FaCheck /></span>
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Enterprise Social Proof / Trusted By Bar ── */}
      <section className="trusted-by-bar" aria-label="Trusted by top partners">
        <div className="container trusted-by-inner">
          <span className="trusted-by-label">TRUSTED NATIONWIDE</span>
          <div className="trusted-by-items">
            <span className="trusted-by-item">
              <span className="trusted-by-rating">★★★★★</span> 4.9/5 Rating
            </span>
            <span className="trusted-by-item">
              <FaShieldAlt style={{ color: '#0B6B5C' }} /> Top 100 US Carrier Network
            </span>
            <span className="trusted-by-item">Licensed Contractors</span>
            <span className="trusted-by-item trusted-by-highlight">50,000+ leads generated</span>
          </div>
        </div>
      </section>
    </>
  )
}
