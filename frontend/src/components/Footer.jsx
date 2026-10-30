import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram, FaEnvelope, FaPhone, FaMapMarkerAlt, FaShieldAlt } from 'react-icons/fa'
import ScrollReveal from './ScrollReveal'
import './Footer.css'

export default function Footer({ onQuoteClick }) {
  const currentYear = new Date().getFullYear()

  const scrollToHeroConsultation = (e) => {
    e.preventDefault()
    const target = document.querySelector('#start') || document.querySelector('#hero')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    } else if (onQuoteClick) {
      onQuoteClick('')
    }
  }

  return (
    <>
      {/* ── Why Us / Call-to-Action Section from theme-reference ── */}
      <section className="cta-why-band" id="why">
        <div className="container">
          <ScrollReveal duration={0.4}>
            <div className="cta-why-content">
              <h2 className="cta-why-title">Ready to grow something lasting?</h2>
              <p className="cta-why-text">
                Book your free consultation and see what a rooted lead pipeline looks like.
              </p>
              <a
                href="#start"
                className="cta-why-btn"
                onClick={scrollToHeroConsultation}
              >
                Get my free plan
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
                <span className="footer-logo-frame">
                  <img className="footer-logo-image" src="/evertree-symbol.svg" alt="EverTree Solutions" />
                </span>
                <span>EverTree <em>Solutions</em></span>
              </div>
              <p className="footer-tagline">
                Connecting you with vetted, pre-screened professionals nationwide. Transparent, secure, and obligation-free.
              </p>
              <div className="footer-socials">
                <a href="#" className="footer-social-link" aria-label="Facebook"><FaFacebookF /></a>
                <a href="#" className="footer-social-link" aria-label="Twitter"><FaTwitter /></a>
                <a href="#" className="footer-social-link" aria-label="LinkedIn"><FaLinkedinIn /></a>
                <a href="#" className="footer-social-link" aria-label="Instagram"><FaInstagram /></a>
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
                <a href="#" className="footer-link">Privacy Policy</a>
                <a href="#" className="footer-link">Terms of Service</a>
                <a href="#" className="footer-link">TCPA Disclosure</a>
                <a href="#" className="footer-link">Do Not Sell My Info</a>
                <a href="#" className="footer-link">Security Safeguards</a>
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
              EverTree Solutions is an independent matching and quote referral service. We connect consumers with licensed professionals and carriers nationwide.
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
