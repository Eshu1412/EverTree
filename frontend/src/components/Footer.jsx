import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram, FaEnvelope, FaPhone, FaMapMarkerAlt, FaShieldAlt } from 'react-icons/fa'
import { FiX, FiCheckCircle } from 'react-icons/fi'
import ScrollReveal from './ScrollReveal'
import './Footer.css'

export default function Footer({ onQuoteClick }) {
  const currentYear = new Date().getFullYear()
  const [activeModal, setActiveModal] = useState(null)

  useEffect(() => {
    const handleOpenModal = (e) => {
      if (e?.detail) {
        setActiveModal(e.detail)
        setOptOutSubmitted(false)
      }
    }
    window.addEventListener('open_legal_modal', handleOpenModal)
    return () => window.removeEventListener('open_legal_modal', handleOpenModal)
  }, [])
  const [optOutSubmitted, setOptOutSubmitted] = useState(false)
  const [optOutEmail, setOptOutEmail] = useState('')

  const scrollToHeroConsultation = (e) => {
    e.preventDefault()
    const target = document.querySelector('#start') || document.querySelector('#hero')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    } else if (onQuoteClick) {
      onQuoteClick('')
    }
  }

  const openLegalModal = (e, type) => {
    e.preventDefault()
    setActiveModal(type)
    setOptOutSubmitted(false)
  }

  const handleOptOutSubmit = (e) => {
    e.preventDefault()
    if (!optOutEmail.trim()) return
    setOptOutSubmitted(true)
  }

  return (
    <>
      {/* ── Why Us / Call-to-Action Section ── */}
      <section className="cta-why-band" id="why">
        <div className="container">
          <ScrollReveal duration={0.4}>
            <div className="cta-why-content">
              <h2 className="cta-why-title">Ready to grow something lasting?</h2>
              <p className="cta-why-text">
                Connect with our marketplace specialists and see what a high-converting, compliant pipeline looks like.
              </p>
              <a
                href="#start"
                className="cta-why-btn"
                onClick={scrollToHeroConsultation}
              >
                Start Your Free Request
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Comprehensive EverTree Footer ─────────────────────── */}
      <footer className="footer" id="footer">
        <div className="container">
          <div className="footer-grid">
            {/* Brand Block */}
            <div className="footer-brand">
              <div className="footer-logo">
                <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true" style={{ width: '22px', height: '22px', fill: 'currentColor' }}>
                  <path d="M12 3 22 21H2L12 3Z" />
                </svg>
                <span>EverTree</span>
              </div>
              <p className="footer-tagline">
                Connecting you with vetted, pre-screened professionals nationwide. Transparent, secure, and obligation-free.
              </p>
              <div className="footer-socials">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Facebook"><FaFacebookF /></a>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="X (Twitter)"><FaTwitter /></a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="LinkedIn"><FaLinkedinIn /></a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Instagram"><FaInstagram /></a>
              </div>
            </div>

            {/* Services */}
            <div className="footer-column">
              <h4 className="footer-column-title">Top Services</h4>
              <div className="footer-links">
                <a href="#services" className="footer-link">Health &amp; Life Insurance</a>
                <a href="#services" className="footer-link">Auto &amp; Home Insurance</a>
                <a href="#services" className="footer-link">Home Improvement</a>
                <a href="#services" className="footer-link">Debt Relief &amp; Finance</a>
                <a href="#services" className="footer-link">Legal Representation</a>
                <a href="#services" className="footer-link">Flight Booking &amp; Travel</a>
              </div>
            </div>

            {/* Legal & Compliance */}
            <div className="footer-column">
              <h4 className="footer-column-title">Trust &amp; Legal</h4>
              <div className="footer-links">
                <button type="button" onClick={(e) => openLegalModal(e, 'privacy')} className="footer-link-btn">Privacy Policy</button>
                <button type="button" onClick={(e) => openLegalModal(e, 'terms')} className="footer-link-btn">Terms of Service</button>
                <button type="button" onClick={(e) => openLegalModal(e, 'tcpa')} className="footer-link-btn">TCPA Disclosure</button>
                <button type="button" onClick={(e) => openLegalModal(e, 'donotsell')} className="footer-link-btn">Do Not Sell My Info</button>
                <button type="button" onClick={(e) => openLegalModal(e, 'security')} className="footer-link-btn">Security Safeguards</button>
              </div>
            </div>

            {/* Contact */}
            <div className="footer-column">
              <h4 className="footer-column-title">Direct Contact</h4>
              <div className="footer-contact-item">
                <FaEnvelope className="footer-contact-icon" />
                <span>support@evertreesolutions.com</span>
              </div>
              <div className="footer-contact-item">
                <FaPhone className="footer-contact-icon" />
                <span>(855) 831-2264</span>
              </div>
              <div className="footer-contact-item">
                <FaMapMarkerAlt className="footer-contact-icon" />
                <span>Nationwide, United States</span>
              </div>
              <div className="footer-tcpa-pill">
                <FaShieldAlt style={{ color: '#0B6B5C' }} /> ActiveProspect TrustedForm&reg; Ready
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              &copy; {currentYear} EverTree Solutions. All rights reserved.
            </p>
            <div className="footer-disclaimer">
              EverTree Solutions is an independent matching and quote referral service. We connect consumers and businesses with licensed professionals, certified carriers, and vetted marketplace partners nationwide.
            </div>
          </div>
        </div>
      </footer>

      {/* ── Comprehensive Legal Modals ──────────────────────── */}
      <AnimatePresence>
        {activeModal && (
          <div className="legal-modal-overlay" onClick={() => setActiveModal(null)}>
            <motion.div
              className="legal-modal-content"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="legal-modal-header">
                <h3>
                  {activeModal === 'privacy' && 'Privacy Policy'}
                  {activeModal === 'terms' && 'Terms of Service'}
                  {activeModal === 'tcpa' && 'TCPA Consent & Communication Disclosure'}
                  {activeModal === 'donotsell' && 'Do Not Sell or Share My Personal Information'}
                  {activeModal === 'security' && 'Security & Data Protection Safeguards'}
                </h3>
                <button type="button" className="legal-modal-close" onClick={() => setActiveModal(null)} aria-label="Close">
                  <FiX />
                </button>
              </div>

              <div className="legal-modal-body">
                {activeModal === 'privacy' && (
                  <>
                    <p><strong>Effective Date: January 1, 2026</strong></p>
                    <p>EverTree Solutions ("EverTree", "we", "us", or "our") is dedicated to safeguarding consumer privacy and personal data. This Privacy Policy describes how we collect, store, process, and protect your information when accessing our website and network services.</p>
                    <h4>1. Information We Collect</h4>
                    <p>We collect information you provide directly, including full name, business or company name, email address, phone number, zip code, service preferences, and any message or requirement notes submitted through our consultation forms.</p>
                    <h4>2. How We Use Your Data</h4>
                    <p>Your information is used strictly to match you with licensed insurance carriers, contractors, financial specialists, attorneys, and marketplace buyers or publishers capable of fulfilling your requests.</p>
                    <h4>3. Data Sharing & Security</h4>
                    <p>We do not sell personal information to unauthorized third-party brokers. All transmissions are encrypted using industry-standard 256-bit SSL protocols.</p>
                  </>
                )}

                {activeModal === 'terms' && (
                  <>
                    <p><strong>Last Updated: January 1, 2026</strong></p>
                    <p>By accessing or utilizing EverTree Solutions services, you agree to comply with and be bound by these Terms of Service. If you do not agree with any part of these terms, please refrain from using our platform.</p>
                    <h4>1. Referral & Marketplace Services</h4>
                    <p>EverTree Solutions operates as an independent matching engine and lead marketplace broker. We do not underwrite insurance policies, issue debt settlements, or perform direct contracting work. All quotes and estimates are delivered by independent licensed third-party partners.</p>
                    <h4>2. Accuracy of Information</h4>
                    <p>You agree to provide true, current, and accurate contact details so that partner specialists may verify quote eligibility and pricing accurately.</p>
                    <h4>3. Limitation of Liability</h4>
                    <p>EverTree Solutions shall not be liable for any direct, indirect, incidental, or consequential damages resulting from transactions conducted between consumers and matched third-party providers.</p>
                  </>
                )}

                {activeModal === 'tcpa' && (
                  <>
                    <p><strong>Telephone Consumer Protection Act (TCPA) Disclosure</strong></p>
                    <p>By submitting any contact or consultation form on EverTree Solutions, you provide express written consent authorizing EverTree Solutions, our verified service partners, and marketplace advertisers to contact you regarding your inquiry at the telephone number and email provided.</p>
                    <h4>Communication Methods</h4>
                    <p>Contact may occur via phone call, SMS/MMS text messages, and email, which may include autodialed or prerecorded artificial-voice transmissions, even if your phone number is currently listed on any State, Federal, or Corporate Do Not Call (DNC) Registry.</p>
                    <h4>Consent Is Not a Condition of Purchase</h4>
                    <p>Your consent is voluntary and not a condition of purchasing any good or service. Message and data rates may apply. You may opt out at any time by replying <strong>STOP</strong> to any text message or contacting our support team at (855) 831-2264.</p>
                  </>
                )}

                {activeModal === 'donotsell' && (
                  <>
                    <p><strong>California Consumer Privacy Act (CCPA) / State Privacy Rights</strong></p>
                    <p>If you are a resident of California or states with comparable consumer privacy legislation, you have the right to request that your personal information not be sold or shared for cross-context behavioral marketing.</p>
                    {optOutSubmitted ? (
                      <div style={{ background: '#EDF7F5', border: '1.5px solid #0B6B5C', padding: '16px', borderRadius: '8px', marginTop: '12px', textAlign: 'center' }}>
                        <FiCheckCircle style={{ color: '#0B6B5C', fontSize: '24px', marginBottom: '6px' }} />
                        <h4 style={{ margin: '0 0 6px', color: '#03363A' }}>Opt-Out Preference Recorded</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#3F5655' }}>
                          We have recorded your opt-out request for <strong>{optOutEmail}</strong>. Your personal data will not be shared across external marketing networks.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleOptOutSubmit} style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#12302F' }}>
                          Enter your email address to record your Do Not Sell preference:
                        </label>
                        <input
                          type="email"
                          placeholder="your-email@example.com"
                          value={optOutEmail}
                          onChange={(e) => setOptOutEmail(e.target.value)}
                          required
                          style={{ padding: '10px 12px', borderRadius: '7px', border: '1.5px solid #8AA3A0', fontSize: '14px' }}
                        />
                        <button
                          type="submit"
                          style={{ background: '#03363A', color: '#FFFFFF', padding: '11px', borderRadius: '7px', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: '4px' }}
                        >
                          Submit Opt-Out Request
                        </button>
                      </form>
                    )}
                  </>
                )}

                {activeModal === 'security' && (
                  <>
                    <p><strong>Enterprise Security &amp; Compliance Safeguards</strong></p>
                    <p>EverTree Solutions applies multi-tier defense architecture to protect consumer and enterprise partner data at rest and in transit.</p>
                    <h4>1. Cryptographic Protection</h4>
                    <p>All web traffic and API endpoints enforce TLS 1.3 encryption with 256-bit AES cipher suites, safeguarding all personal data against interception.</p>
                    <h4>2. ActiveProspect TrustedForm Validation</h4>
                    <p>Every inbound lead submission carries an immutable, cryptographically signed TrustedForm certificate verifying authentic consumer consent and origin transparency.</p>
                    <h4>3. Cloud Infrastructure</h4>
                    <p>Our server and database nodes operate within hardened cloud regions featuring role-based access control (RBAC), automated intrusion detection, and isolated container execution.</p>
                  </>
                )}
              </div>

              <div className="legal-modal-footer">
                <button type="button" className="legal-modal-done-btn" onClick={() => setActiveModal(null)}>
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
