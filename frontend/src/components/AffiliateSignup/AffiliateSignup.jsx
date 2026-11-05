import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TERMS_AND_CONDITIONS } from './termsText';
import './AffiliateSignup.css';

const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Netherlands',
  'Sweden',
  'Norway',
  'Denmark',
  'Finland',
  'Ireland',
  'New Zealand',
  'Singapore',
  'Other'
];

const LEGAL_ENTITY_TYPES = [
  'Individual / Sole Proprietorship',
  'LLC',
  'Corporation',
  'Partnership'
];

const PAYMENT_METHODS = [
  { value: 'tipalti', label: 'Tipalti' },
  { value: 'wire', label: 'Wire Transfer' },
  { value: 'ach_direct_deposit', label: 'ACH / Direct Deposit' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'check', label: 'Check' },
  { value: 'none', label: 'None / Later' }
];

const AD_BUDGET_OPTIONS = [
  '$0 to $1,000',
  '$1,000 to $5,000',
  '$5,000 to $10,000',
  '$10,000 to $25,000',
  '$25,000 or more'
];

const OTHER_NETWORKS_VOLUME = [
  '$0 to $10,000',
  '$10,000 to $25,000',
  '$25,000 or more'
];

export default function AffiliateSignup({ onNavigateHome }) {
  // Referral code extraction from query param ?q=8FS918X or hash
  const [referralCode, setReferralCode] = useState('');
  const [formBlocked, setFormBlocked] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Form fields state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    emailConfirm: '',
    phone: '',
    legalEntityType: '',
    companyName: '',
    websiteUrl: '',
    address: '',
    address2: '',
    country: 'United States',
    city: '',
    zipCode: '',
    paymentMethod: 'tipalti',
    taxId: '',
    teamsUserId: '',
    offerTypes: ['Pay Per Call'],
    trafficSource: '',
    monthlyAdBudget: '',
    otherNetworks: '',
    monthlyVolumeOtherNetworks: '',
    advertisingMethods: '',
    collectsTrustedformJornaya: '',
    agreedTerms: false
  });

  const [termsScrolled, setTermsScrolled] = useState(false);
  const termsBoxRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(null);

  // Check referral code on mount
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let q = urlParams.get('q');
      if (!q && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        const hashParams = new URLSearchParams(hashQuery);
        q = hashParams.get('q');
      }
      if (q) {
        setReferralCode(q.trim());
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  // Check whether route is blocked
  useEffect(() => {
    fetch('/api/affiliates/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setFormBlocked(Boolean(data.blocked));
      })
      .catch(() => {})
      .finally(() => {
        setCheckingStatus(false);
      });
  }, []);

  // Format phone helper
  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    let formatted = raw;
    if (raw.length > 6) {
      formatted = `(${raw.slice(0, 3)}) ${raw.slice(3, 6)}-${raw.slice(6)}`;
    } else if (raw.length > 3) {
      formatted = `(${raw.slice(0, 3)}) ${raw.slice(3)}`;
    } else if (raw.length > 0) {
      formatted = `(${raw}`;
    }
    setFormData((prev) => ({ ...prev, phone: formatted }));
  };

  // Toggle multi-checkbox offer types
  const toggleOfferType = (type) => {
    setFormData((prev) => {
      const exists = prev.offerTypes.includes(type);
      const updated = exists
        ? prev.offerTypes.filter((t) => t !== type)
        : [...prev.offerTypes, type];
      return { ...prev, offerTypes: updated };
    });
  };

  // Check scroll on terms box
  const handleTermsScroll = () => {
    if (termsBoxRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = termsBoxRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 30) {
        setTermsScrolled(true);
      }
    }
  };

  // Validations
  const isEmailValid = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(formData.email.trim());
  const isEmailMatch = formData.emailConfirm.trim().length > 0 && formData.email.trim().toLowerCase() === formData.emailConfirm.trim().toLowerCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (formBlocked) {
      setErrorMessage('Affiliate registrations are currently closed.');
      return;
    }

    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!isEmailMatch) {
      setErrorMessage('Email and Email Confirmation do not match.');
      return;
    }

    if (!formData.legalEntityType) {
      setErrorMessage('Please select a Legal Entity Type.');
      return;
    }

    if (formData.offerTypes.length === 0) {
      setErrorMessage('Please select at least one offer type (e.g., Pay Per Call or CPL/CPA).');
      return;
    }

    if (!formData.monthlyAdBudget) {
      setErrorMessage('Please select your monthly advertising budget.');
      return;
    }

    if (!formData.monthlyVolumeOtherNetworks) {
      setErrorMessage('Please select your average monthly volume with other networks.');
      return;
    }

    if (!formData.collectsTrustedformJornaya) {
      setErrorMessage('Please answer whether you collect TrustedForm or Jornaya data.');
      return;
    }

    if (!formData.agreedTerms) {
      setErrorMessage('You must review and agree to Xy7Elite Terms of Service to apply.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        referral_code: referralCode,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        legal_entity_type: formData.legalEntityType,
        company_name: formData.companyName.trim(),
        website_url: formData.websiteUrl.trim(),
        address: formData.address.trim(),
        address2: formData.address2.trim(),
        country: formData.country,
        city: formData.city.trim(),
        zip_code: formData.zipCode.trim(),
        payment_method: formData.paymentMethod,
        tax_id: formData.taxId.trim(),
        teams_user_id: formData.teamsUserId.trim(),
        offer_types: formData.offerTypes,
        traffic_source: formData.trafficSource.trim(),
        monthly_ad_budget: formData.monthlyAdBudget,
        other_networks: formData.otherNetworks.trim(),
        monthly_volume_other_networks: formData.monthlyVolumeOtherNetworks,
        advertising_methods: formData.advertisingMethods.trim(),
        collects_trustedform_jornaya: formData.collectsTrustedformJornaya,
        agreed_terms: true
      };

      const res = await fetch('/api/affiliates/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.detail || resData.message || 'Submission failed. Please check your inputs.');
      }

      setSubmittedSuccess({
        id: resData.id,
        name: `${formData.firstName} ${formData.lastName}`,
        company: formData.companyName,
        email: formData.email,
        referralCode: referralCode || 'Direct Application',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="affiliate-loading-view">
        <div className="affiliate-spinner" />
        <p>Loading application portal...</p>
      </div>
    );
  }

  // ── Blocked Route View ───────────────────────────────────
  if (formBlocked) {
    return (
      <div className="affiliate-page-wrap">
        <nav className="affiliate-nav">
          <div className="affiliate-nav__inner">
            <button type="button" className="affiliate-nav__brand" onClick={onNavigateHome}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="brand-mark">
                <path d="M12 3 22 21H2L12 3Z" />
              </svg>
              <span>EverTree</span>
            </button>
            <button type="button" className="affiliate-nav__return" onClick={onNavigateHome}>
              ← Back to EverTree Solutions
            </button>
          </div>
        </nav>

        <main className="affiliate-main-container">
          <motion.div
            className="affiliate-card affiliate-card--blocked"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="affiliate-blocked-badge">
              <span className="blocked-pulse-dot" />
              <span>Route Paused</span>
            </div>

            <div className="affiliate-blocked-icon">🔒</div>
            <h2>Affiliate Applications Temporarily Paused</h2>
            <p className="affiliate-blocked-desc">
              The Xy7Elite / EverTree affiliate onboarding application is currently not accepting new online submissions. If you have an active publisher partnership inquiry or were invited directly, please contact our publisher management team.
            </p>

            <div className="affiliate-blocked-contact">
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <div>
                  <div className="contact-label">Direct Publisher Line</div>
                  <a href="tel:8558312264" className="contact-value">(855) 831-2264</a>
                </div>
              </div>

              <div className="contact-item">
                <span className="contact-icon">✉</span>
                <div>
                  <div className="contact-label">Partner Desk Email</div>
                  <a href="mailto:support@evertreesolutions.com" className="contact-value">support@evertreesolutions.com</a>
                </div>
              </div>
            </div>

            <button type="button" className="affiliate-btn affiliate-btn--primary" onClick={onNavigateHome}>
              Return to Homepage
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  // ── Success Confirmation View ────────────────────────────
  if (submittedSuccess) {
    return (
      <div className="affiliate-page-wrap">
        <nav className="affiliate-nav">
          <div className="affiliate-nav__inner">
            <button type="button" className="affiliate-nav__brand" onClick={onNavigateHome}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="brand-mark">
                <path d="M12 3 22 21H2L12 3Z" />
              </svg>
              <span>EverTree</span>
            </button>
            <button type="button" className="affiliate-nav__return" onClick={onNavigateHome}>
              ← Back to EverTree Solutions
            </button>
          </div>
        </nav>

        <main className="affiliate-main-container">
          <motion.div
            className="affiliate-card affiliate-card--success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="affiliate-success-check">✓</div>
            <span className="affiliate-badge-gold">Application Successfully Received</span>
            <h2>Welcome to Xy7Elite, {submittedSuccess.name.split(' ')[0]}!</h2>
            <p className="affiliate-success-copy">
              Your publisher application has been logged into our partner management system. A dedicated affiliate manager will review your submission and connect with you on Microsoft Teams or email within <strong>24 business hours</strong>.
            </p>

            <div className="affiliate-summary-box">
              <div className="summary-row">
                <span className="label">Application Reference ID:</span>
                <span className="val-mono">#AFF-{String(submittedSuccess.id).padStart(5, '0')}</span>
              </div>
              <div className="summary-row">
                <span className="label">Company / Entity:</span>
                <span className="val">{submittedSuccess.company}</span>
              </div>
              <div className="summary-row">
                <span className="label">Contact Email:</span>
                <span className="val">{submittedSuccess.email}</span>
              </div>
              <div className="summary-row">
                <span className="label">Referral Program:</span>
                <span className="val-badge">{submittedSuccess.referralCode}</span>
              </div>
              <div className="summary-row">
                <span className="label">Submission Date:</span>
                <span className="val">{submittedSuccess.date}</span>
              </div>
            </div>

            <div className="affiliate-success-footer">
              <button type="button" className="affiliate-btn affiliate-btn--primary" onClick={onNavigateHome}>
                Return to EverTree Solutions
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // ── Full Multi-Section Application Form View ─────────────
  return (
    <div className="affiliate-page-wrap">
      {/* Brand Header */}
      <header className="affiliate-nav">
        <div className="affiliate-nav__inner">
          <div className="affiliate-nav__brand-group">
            <button type="button" className="affiliate-nav__brand" onClick={onNavigateHome} aria-label="EverTree home">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="brand-mark">
                <path d="M12 3 22 21H2L12 3Z" />
              </svg>
              <span>EverTree</span>
            </button>
            <span className="affiliate-nav__sep">/</span>
            <div className="affiliate-nav__network">
              <span className="network-pill">Xy7Elite Partner Network</span>
            </div>
          </div>

          <div className="affiliate-nav__actions">
            {referralCode && (
              <span className="referral-tag" title="Referred Partner Tracking Active">
                Referral: <strong>{referralCode}</strong>
              </span>
            )}
            <button type="button" className="affiliate-nav__return" onClick={onNavigateHome}>
              ← Back to Public Site
            </button>
          </div>
        </div>
      </header>

      <main className="affiliate-main-container">
        {/* Banner Section */}
        <section className="affiliate-hero">
          <div className="affiliate-hero__eyebrow">PUBLISHER & AFFILIATE ONBOARDING</div>
          <h1 className="affiliate-hero__title">Affiliate Network Application</h1>
          <p className="affiliate-hero__subtitle">
            Scale your performance with Xy7Elite. Direct high-converting CPA, CPL, and Pay Per Call offers with automated tracking, dedicated affiliate reps, and reliable bi-weekly or weekly disbursements.
          </p>
        </section>

        {/* Main Application Form Container */}
        <form className="affiliate-card affiliate-form" onSubmit={handleSubmit} noValidate>
          <div className="form-mandatory-notice">
            Fields with an asterisk (<span>*</span>) are mandatory.
          </div>

          {errorMessage && (
            <div className="affiliate-error-banner" role="alert">
              <span className="error-icon">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ──────────────── 1. GENERAL ──────────────── */}
          <div className="form-section">
            <div className="section-header">
              <span className="section-number">01</span>
              <div>
                <h3>General</h3>
                <p>Personal and primary contact information</p>
              </div>
            </div>

            <div className="form-grid form-grid--2col">
              <label className="form-field">
                <span className="field-label">First Name <span>*</span></span>
                <input
                  type="text"
                  required
                  placeholder="e.g. John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </label>

              <label className="form-field">
                <span className="field-label">Last Name <span>*</span></span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smith"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </label>
            </div>

            <div className="form-grid form-grid--2col">
              <label className="form-field">
                <span className="field-label">
                  Email <span>*</span>
                  {isEmailValid && <span className="valid-pill">✓ Valid</span>}
                </span>
                <input
                  type="email"
                  required
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </label>

              <label className="form-field">
                <span className="field-label">
                  Email Confirmation <span>*</span>
                  {isEmailMatch && <span className="valid-pill">✓ Matches</span>}
                </span>
                <input
                  type="email"
                  required
                  placeholder="Repeat your email"
                  value={formData.emailConfirm}
                  onChange={(e) => setFormData({ ...formData, emailConfirm: e.target.value })}
                />
              </label>
            </div>

            <div className="form-grid form-grid--2col">
              <label className="form-field">
                <span className="field-label">Phone Number</span>
                <input
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                />
              </label>
            </div>
          </div>

          {/* ──────────────── 2. COMPANY ──────────────── */}
          <div className="form-section">
            <div className="section-header">
              <span className="section-number">02</span>
              <div>
                <h3>Company</h3>
                <p>Your operating legal business entity and presence</p>
              </div>
            </div>

            <div className="form-grid form-grid--2col">
              <label className="form-field">
                <span className="field-label">Legal Entity Type <span>*</span></span>
                <select
                  required
                  value={formData.legalEntityType}
                  onChange={(e) => setFormData({ ...formData, legalEntityType: e.target.value })}
                >
                  <option value="">Select Legal Entity Type...</option>
                  {LEGAL_ENTITY_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span className="field-label">Company/Business Name <span>*</span></span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Growth Media LLC"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </label>
            </div>

            <label className="form-field">
              <span className="field-label">Website/Social Media <span>*</span></span>
              <input
                type="url"
                required
                placeholder="http(s)://"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              />
            </label>
          </div>

          {/* ──────────────── 3. ADDRESS ──────────────── */}
          <div className="form-section">
            <div className="section-header">
              <span className="section-number">03</span>
              <div>
                <h3>Address</h3>
                <p>Physical business registered location</p>
              </div>
            </div>

            <div className="form-grid form-grid--2col">
              <label className="form-field">
                <span className="field-label">Address <span>*</span></span>
                <input
                  type="text"
                  required
                  placeholder="Street address or P.O. Box"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </label>

              <label className="form-field">
                <span className="field-label">Apartment, suite, etc.</span>
                <input
                  type="text"
                  placeholder="Apt, Suite, Floor (optional)"
                  value={formData.address2}
                  onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                />
              </label>
            </div>

            <div className="form-grid form-grid--3col">
              <label className="form-field">
                <span className="field-label">Country <span>*</span></span>
                <select
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span className="field-label">City <span>*</span></span>
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </label>

              <label className="form-field">
                <span className="field-label">ZIP/Postal Code <span>*</span></span>
                <input
                  type="text"
                  required
                  placeholder="ZIP or Postal Code"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                />
              </label>
            </div>
          </div>

          {/* ──────────────── 4. BILLING ──────────────── */}
          <div className="form-section">
            <div className="section-header">
              <span className="section-number">04</span>
              <div>
                <h3>Billing</h3>
                <p>Disbursement and tax preferences</p>
              </div>
            </div>

            <div className="form-grid form-grid--2col">
              <label className="form-field">
                <span className="field-label">Payment Method <span>*</span></span>
                <select
                  required
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  <option value="">Select Payment Method...</option>
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.value} value={pm.value}>{pm.label}</option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span className="field-label">Tax ID / VAT or SSN</span>
                <input
                  type="text"
                  placeholder="EIN, SSN, or VAT ID (optional)"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                />
              </label>
            </div>
          </div>

          {/* ──────────────── 5. ADDITIONAL INFORMATION ──────────────── */}
          <div className="form-section">
            <div className="section-header">
              <span className="section-number">05</span>
              <div>
                <h3>Additional Information</h3>
                <p>Publisher questionnaire and media capabilities</p>
              </div>
            </div>

            <label className="form-field">
              <span className="field-label">
                Teams User ID <span>*</span>
                <span className="field-tooltip" title="Your Microsoft Teams email or username for direct partner chat">ⓘ Teams User ID</span>
              </span>
              <input
                type="text"
                required
                placeholder="e.g. john@teams.com or @john_media"
                value={formData.teamsUserId}
                onChange={(e) => setFormData({ ...formData, teamsUserId: e.target.value })}
              />
            </label>

            {/* Multi-checkbox for offer types */}
            <div className="form-field">
              <span className="field-label">What type of offers do you primarily focus on <span>*</span></span>
              <div className="checkbox-group">
                {['CPL/CPA/Lead Gen', 'Pay Per Call', 'Other'].map((type) => {
                  const checked = formData.offerTypes.includes(type);
                  return (
                    <label key={type} className={`checkbox-card ${checked ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOfferType(type)}
                      />
                      <span className="custom-check-box">{checked ? '✓' : ''}</span>
                      <span className="checkbox-text">{type}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <label className="form-field">
              <span className="field-label">
                What is your primary traffic source? <span>*</span>
                <span className="field-tooltip" title="Search, Native, Social, Email, Display, SEO, Call Center">ⓘ Traffic source</span>
              </span>
              <input
                type="text"
                required
                placeholder="e.g. Google Search Ads, TikTok Ads, SEO, SMS"
                value={formData.trafficSource}
                onChange={(e) => setFormData({ ...formData, trafficSource: e.target.value })}
              />
            </label>

            <div className="form-grid form-grid--2col">
              <label className="form-field">
                <span className="field-label">
                  What is your monthly advertising budget? <span>*</span>
                </span>
                <select
                  required
                  value={formData.monthlyAdBudget}
                  onChange={(e) => setFormData({ ...formData, monthlyAdBudget: e.target.value })}
                >
                  <option value="">-- Make a Selection --</option>
                  {AD_BUDGET_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span className="field-label">
                  Your avg. monthly volume with other networks? <span>*</span>
                </span>
                <select
                  required
                  value={formData.monthlyVolumeOtherNetworks}
                  onChange={(e) => setFormData({ ...formData, monthlyVolumeOtherNetworks: e.target.value })}
                >
                  <option value="">-- Make a Selection --</option>
                  {OTHER_NETWORKS_VOLUME.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="form-field">
              <span className="field-label">Other networks that you currently work with? <span>*</span></span>
              <input
                type="text"
                required
                placeholder="e.g. CJ, Impact, Rakuten, Aragon, Direct Buyers"
                value={formData.otherNetworks}
                onChange={(e) => setFormData({ ...formData, otherNetworks: e.target.value })}
              />
            </label>

            <label className="form-field">
              <span className="field-label">Describe the sites and methods used to advertise</span>
              <textarea
                rows={3}
                placeholder="Include domains, creative angles, landing page styles, or compliance measures you employ…"
                value={formData.advertisingMethods}
                onChange={(e) => setFormData({ ...formData, advertisingMethods: e.target.value })}
              />
            </label>
          </div>

          {/* ──────────────── 6. PAY PER CALL QUESTIONNAIRE ──────────────── */}
          <div className="form-section">
            <div className="section-header">
              <span className="section-number">06</span>
              <div>
                <h3>Pay Per Call Questionnaire</h3>
                <p>Call verification and consumer consent compliance</p>
              </div>
            </div>

            <label className="form-field">
              <span className="field-label">
                Do you collect Trustedform or Jornaya data? <span>*</span>
                <span className="field-tooltip" title="At any point with your calls, do you collect TrustedForm and/or Jornaya data for your callers?">
                  ⓘ Consent certificate
                </span>
              </span>
              <select
                required
                value={formData.collectsTrustedformJornaya}
                onChange={(e) => setFormData({ ...formData, collectsTrustedformJornaya: e.target.value })}
              >
                <option value="">-- Make a Selection --</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </label>
          </div>

          {/* ──────────────── 7. TERMS AND CONDITIONS ──────────────── */}
          <div className="form-section">
            <div className="section-header">
              <span className="section-number">07</span>
              <div>
                <h3>Terms and Conditions</h3>
                <p>Publisher Agreement & Network Rules</p>
              </div>
            </div>

            <div className="terms-container">
              <div
                className="terms-scroll-box"
                ref={termsBoxRef}
                onScroll={handleTermsScroll}
                tabIndex={0}
                aria-label="Scroll through Terms & Conditions"
              >
                <pre className="terms-pre-text">{TERMS_AND_CONDITIONS}</pre>
              </div>

              {!termsScrolled && (
                <div className="terms-scroll-hint">
                  <span>↓ Scroll down through terms to review agreement</span>
                </div>
              )}
            </div>

            <label className={`terms-checkbox-wrap ${formData.agreedTerms ? 'checked' : ''}`}>
              <input
                type="checkbox"
                required
                checked={formData.agreedTerms}
                onChange={(e) => setFormData({ ...formData, agreedTerms: e.target.checked })}
              />
              <span className="custom-check-box">{formData.agreedTerms ? '✓' : ''}</span>
              <span className="terms-label-text">
                I agree to <strong>Xy7Elite's Terms of Service</strong> and certify that all provided information is accurate and compliant with industry regulations. <span>*</span>
              </span>
            </label>
          </div>

          {/* Action Row */}
          <div className="form-actions-row">
            <button
              type="submit"
              className="affiliate-btn affiliate-btn--primary affiliate-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="btn-spinner" />
                  <span>Submitting Application…</span>
                </>
              ) : (
                <>
                  <span>Apply</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-arrow">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="affiliate-trust-footer">
            <div className="trust-badge">
              <span className="trust-icon">🔒</span>
              <span>256-Bit SSL Encrypted</span>
            </div>
            <div className="trust-sep">•</div>
            <div className="trust-badge">
              <span className="trust-icon">⚡</span>
              <span>Rapid 24h Review</span>
            </div>
            <div className="trust-sep">•</div>
            <div className="trust-badge">
              <span className="trust-icon">🤝</span>
              <span>Direct Network Rep</span>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
