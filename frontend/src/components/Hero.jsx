import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaCheck, FaStar, FaShieldAlt } from 'react-icons/fa'
import ScrollReveal from './ScrollReveal'
import { trackLead } from '../integrations/tracking'
import './Hero.css'

export default function Hero({ onQuoteClick, onFormSubmitted }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    goal: 'Health Insurance'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)

  const benefits = [
    'Pre-Screened & Licensed Professionals',
    'Transparent Real-Time Comparisons',
    '100% Free & Obligation-Free'
  ]

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleConsultationSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.phone.trim()) {
      if (onQuoteClick) onQuoteClick(formData.goal)
      return
    }

    setIsSubmitting(true)

    const tfCertUrl = document.getElementById('xxTrustedFormCertUrl')?.value ||
                      document.querySelector('input[name="xxTrustedFormCertUrl"]')?.value ||
                      ''

    const payload = {
      full_name: formData.name.trim(),
      email: formData.email.trim() || 'lead@evertreesolutions.com',
      phone: formData.phone.trim(),
      service_type: formData.goal,
      zip_code: '00000',
      trusted_form_cert_url: tfCertUrl,
      notes: `Hero Consultation Request | Service: ${formData.goal}`
    }

    try {
      const res = await fetch('/api/quote-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setFormSuccess(true)
        trackLead(formData.goal, 'Hero Consultation')
        if (onFormSubmitted) {
          onFormSubmitted({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            zip_code: '00000',
            service: formData.goal,
            category: 'general'
          })
        }
      } else {
        if (onQuoteClick) onQuoteClick(formData.goal)
      }
    } catch {
      if (onQuoteClick) onQuoteClick(formData.goal)
    } finally {
      setIsSubmitting(false)
    }
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
                  onClick={() => onQuoteClick && onQuoteClick('')}
                >
                  Get my free plan
                </button>
                <a
                  className="btn btn-outline"
                  href="#how"
                  onClick={(e) => {
                    e.preventDefault()
                    document.querySelector('#how')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  How it works
                </a>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={0.2} duration={0.4}>
            <div id="start" className="hero-consultation" aria-label="Start your free consultation">
              <h2 className="consultation-title">Get your free consultation</h2>
              <p className="consultation-desc">Tell us a little about your business or needs.</p>

              {formSuccess ? (
                <div className="consultation-success" role="alert">
                  <strong>Thank you, {formData.name}!</strong>
                  <p>Your free consultation request is received. An EverTree advisor will connect with you shortly.</p>
                </div>
              ) : (
                <form className="consultation-form" onSubmit={handleConsultationSubmit}>
                  {/* Hidden ActiveProspect TrustedForm Token Field */}
                  <input type="hidden" id="xxTrustedFormCertUrl" name="xxTrustedFormCertUrl" />

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

                  <div className="consultation-field">
                    <label htmlFor="q">Service needed</label>
                    <select
                      id="q"
                      name="goal"
                      value={formData.goal}
                      onChange={handleInputChange}
                    >
                      <option value="Health Insurance">Health &amp; Life Insurance</option>
                      <option value="Auto & Home Insurance">Auto &amp; Home Insurance</option>
                      <option value="Home Improvement">Home Improvement</option>
                      <option value="Debt Relief">Debt Relief &amp; Finance</option>
                      <option value="Legal Help">Legal Help &amp; Representation</option>
                      <option value="Medicare">Medicare Plans</option>
                      <option value="Flight Booking">Flight Booking &amp; Travel</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="consultation-cta"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Securing Consultation...' : 'Get my free plan'}
                  </button>
                  <small>No cost. No obligation. 100% confidential &amp; secure.</small>
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
