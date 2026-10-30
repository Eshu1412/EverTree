import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaCalculator, 
  FaCar, 
  FaHome, 
  FaCreditCard, 
  FaHeartbeat, 
  FaPlane, 
  FaCheckCircle, 
  FaArrowRight, 
  FaShieldAlt, 
  FaPhoneAlt 
} from 'react-icons/fa'
import ScrollReveal from './ScrollReveal'
import './RateCalculator.css'

const CALCULATOR_VERTICALS = [
  {
    id: 'auto-home',
    title: 'Auto & Home',
    icon: FaCar,
    serviceKey: 'Auto & Home Insurance',
    headline: 'Insurance Bundle Savings Estimator',
    description: 'Calculate how much you could save annually by bundling auto and home policies with top-tier carriers.',
    minVal: 80,
    maxVal: 600,
    step: 10,
    defaultVal: 220,
    unit: '$/mo',
    sliderLabel: 'Your Current Monthly Insurance Cost',
    subOptions: [
      { id: 'auto-only', label: 'Auto Only', discountRate: 0.22 },
      { id: 'bundle', label: 'Auto + Home Bundle (Best Value)', discountRate: 0.34 },
      { id: 'multi-car', label: 'Multi-Vehicle + Home', discountRate: 0.38 }
    ]
  },
  {
    id: 'debt-relief',
    title: 'Debt Relief',
    icon: FaCreditCard,
    serviceKey: 'Debt Relief',
    headline: 'Unsecured Debt Settlement Estimator',
    description: 'See how significantly certified debt restructuring could reduce your total balances and monthly obligations.',
    minVal: 10000,
    maxVal: 120000,
    step: 2500,
    defaultVal: 35000,
    unit: '$',
    sliderLabel: 'Total Unsecured Debt Balance',
    subOptions: [
      { id: 'standard', label: 'Standard Enrollment (36-48 mo)', discountRate: 0.45 },
      { id: 'accelerated', label: 'Accelerated Program (24-36 mo)', discountRate: 0.50 }
    ]
  },
  {
    id: 'home-improvement',
    title: 'Home Remodeling',
    icon: FaHome,
    serviceKey: 'Home Improvement',
    headline: 'Contractor Rebate & Project Estimator',
    description: 'Calculate average negotiated group discounts and manufacturer rebates available across certified local contractors.',
    minVal: 3000,
    maxVal: 80000,
    step: 1000,
    defaultVal: 18000,
    unit: '$',
    sliderLabel: 'Estimated Project Budget',
    subOptions: [
      { id: 'roofing', label: 'Roofing & Siding', discountRate: 0.18 },
      { id: 'windows', label: 'Windows & Doors', discountRate: 0.22 },
      { id: 'kitchen-bath', label: 'Kitchen & Bath Remodel', discountRate: 0.20 },
      { id: 'solar', label: 'Solar & Clean Energy', discountRate: 0.26 }
    ]
  },
  {
    id: 'health-medicare',
    title: 'Health & Medicare',
    icon: FaHeartbeat,
    serviceKey: 'Health Insurance',
    headline: 'Healthcare Plan Subsidy & Savings Calculator',
    description: 'Estimate government premium tax credit subsidies and plan savings tailored to your household profile.',
    minVal: 150,
    maxVal: 900,
    step: 25,
    defaultVal: 400,
    unit: '$/mo',
    sliderLabel: 'Current Unsubsidized Monthly Premium',
    subOptions: [
      { id: 'individual', label: 'Individual Plan', discountRate: 0.40 },
      { id: 'family', label: 'Family Coverage (2+)', discountRate: 0.48 },
      { id: 'medicare', label: 'Medicare Advantage Supplement', discountRate: 0.55 }
    ]
  },
  {
    id: 'flight-booking',
    title: 'Flight Booking',
    icon: FaPlane,
    serviceKey: 'Flight Booking',
    headline: 'Consolidator Airfare Fare Difference',
    description: 'Compare published commercial airline ticket prices against wholesale consolidator private airfares.',
    minVal: 400,
    maxVal: 4500,
    step: 50,
    defaultVal: 1200,
    unit: '$',
    sliderLabel: 'Standard Published Ticket Price',
    subOptions: [
      { id: 'domestic', label: 'Domestic U.S. Flight', discountRate: 0.24 },
      { id: 'international', label: 'International Transatlantic/Pacific', discountRate: 0.35 },
      { id: 'business', label: 'Business / First Class Consolidator', discountRate: 0.42 }
    ]
  }
]

export default function RateCalculator({ onQuoteClick, phone = '1-855-831-2264' }) {
  const [selectedVerticalId, setSelectedVerticalId] = useState('auto-home')
  const [sliderValue, setSliderValue] = useState(220)
  const [selectedSubOptionId, setSelectedSubOptionId] = useState('bundle')

  const activeVertical = useMemo(
    () => CALCULATOR_VERTICALS.find((v) => v.id === selectedVerticalId) || CALCULATOR_VERTICALS[0],
    [selectedVerticalId]
  )

  const activeSubOption = useMemo(
    () => activeVertical.subOptions.find((o) => o.id === selectedSubOptionId) || activeVertical.subOptions[0],
    [activeVertical, selectedSubOptionId]
  )

  // Switch vertical tab & reset defaults
  const handleVerticalChange = (v) => {
    setSelectedVerticalId(v.id)
    setSliderValue(v.defaultVal)
    setSelectedSubOptionId(v.subOptions[0].id)
  }

  // Calculate savings metrics
  const { estimatedSavings, newProjectedCost, annualSavings, savingsPct } = useMemo(() => {
    const rate = activeSubOption.discountRate
    const savings = Math.round(sliderValue * rate)
    const newCost = Math.max(0, sliderValue - savings)
    const pct = Math.round(rate * 100)

    let annual = 0
    if (activeVertical.unit === '$/mo') {
      annual = savings * 12
    } else {
      annual = savings // Lump sum for project/debt/flights
    }

    return {
      estimatedSavings: savings,
      newProjectedCost: newCost,
      annualSavings: annual,
      savingsPct: pct
    }
  }, [sliderValue, activeSubOption, activeVertical])

  const handleClaimEstimate = () => {
    if (onQuoteClick) {
      onQuoteClick(activeVertical.serviceKey)
    }
  }

  return (
    <section className="rate-calc-section section" id="calculator">
      <div className="container">
        {/* Section Header */}
        <div className="rate-calc-header text-center">
          <ScrollReveal duration={0.35}>
            <div className="rate-calc-pill">
              <FaCalculator className="rate-calc-pill-icon" />
              <span>REAL-TIME RATE & SAVINGS ESTIMATOR</span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.06} duration={0.35}>
            <h2 className="rate-calc-title">
              Instant Price & Savings Calculator
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.12} duration={0.35}>
            <p className="rate-calc-subtitle">
              Adjust your current costs or project parameters below to see calculated savings based on our active network rates.
            </p>
          </ScrollReveal>
        </div>

        {/* Vertical Tabs Strip */}
        <div className="rate-calc-tabs">
          {CALCULATOR_VERTICALS.map((vert) => {
            const IconComp = vert.icon
            const isActive = vert.id === selectedVerticalId
            return (
              <button
                key={vert.id}
                type="button"
                className={`rate-calc-tab ${isActive ? 'active' : ''}`}
                onClick={() => handleVerticalChange(vert)}
              >
                <span className="rate-calc-tab-icon">
                  <IconComp />
                </span>
                <span className="rate-calc-tab-text">{vert.title}</span>
              </button>
            )
          })}
        </div>

        {/* Main Calculator Engine Container */}
        <motion.div 
          className="rate-calc-container"
          key={activeVertical.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Left Column: Interactive Inputs */}
          <div className="rate-calc-controls-col">
            <div className="rate-calc-headline-block">
              <h3 className="rate-calc-panel-title">{activeVertical.headline}</h3>
              <p className="rate-calc-panel-desc">{activeVertical.description}</p>
            </div>

            {/* Sub-Option Radios/Chips */}
            <div className="rate-calc-options-group">
              <label className="rate-calc-field-label">Coverage / Plan Category</label>
              <div className="rate-calc-chip-row">
                {activeVertical.subOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`rate-calc-chip ${opt.id === selectedSubOptionId ? 'active' : ''}`}
                    onClick={() => setSelectedSubOptionId(opt.id)}
                  >
                    <span>{opt.label}</span>
                    <span className="rate-calc-chip-badge">{Math.round(opt.discountRate * 100)}% est.</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Slider Input Block */}
            <div className="rate-calc-slider-block">
              <div className="rate-calc-slider-header">
                <label className="rate-calc-field-label">{activeVertical.sliderLabel}</label>
                <span className="rate-calc-current-value">
                  ${sliderValue.toLocaleString()} {activeVertical.unit === '$/mo' ? '/mo' : ''}
                </span>
              </div>

              <input
                type="range"
                min={activeVertical.minVal}
                max={activeVertical.maxVal}
                step={activeVertical.step}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="rate-calc-slider-input"
              />

              <div className="rate-calc-slider-range-labels">
                <span>${activeVertical.minVal.toLocaleString()}</span>
                <span>${activeVertical.maxVal.toLocaleString()}</span>
              </div>
            </div>

            {/* Trust Assurance Strip */}
            <div className="rate-calc-assurance-strip">
              <div className="rate-calc-assurance-item">
                <FaCheckCircle className="rate-calc-assurance-icon" />
                <span>Calculated via live carrier & contractor index</span>
              </div>
              <div className="rate-calc-assurance-item">
                <FaShieldAlt className="rate-calc-assurance-icon" />
                <span>No credit check required to view rate matches</span>
              </div>
            </div>
          </div>

          {/* Right Column: Calculated Results & Direct Action */}
          <div className="rate-calc-results-col">
            <div className="rate-calc-card">
              <div className="rate-calc-card-top">
                <span className="rate-calc-tag">PROJECTED SAVINGS</span>
                <span className="rate-calc-pct-badge">{savingsPct}% REDUCTION</span>
              </div>

              {/* Main Savings Display */}
              <div className="rate-calc-amount-box">
                <div className="rate-calc-big-amount">
                  ${annualSavings.toLocaleString()}
                </div>
                <div className="rate-calc-amount-label">
                  {activeVertical.unit === '$/mo' ? 'Estimated Total Annual Savings' : 'Estimated Net Balance Saved'}
                </div>
              </div>

              {/* Cost Comparison Matrix */}
              <div className="rate-calc-comparison-grid">
                <div className="rate-calc-comp-item">
                  <span className="comp-label">Baseline Cost:</span>
                  <span className="comp-val original">${sliderValue.toLocaleString()}</span>
                </div>
                <div className="rate-calc-comp-item">
                  <span className="comp-label">New Negotiated Cost:</span>
                  <span className="comp-val new">${newProjectedCost.toLocaleString()}</span>
                </div>
                {activeVertical.unit === '$/mo' && (
                  <div className="rate-calc-comp-item">
                    <span className="comp-label">Monthly Savings:</span>
                    <span className="comp-val highlight">+${estimatedSavings.toLocaleString()}/mo</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="rate-calc-actions">
                <button
                  type="button"
                  className="rate-calc-cta-btn"
                  onClick={handleClaimEstimate}
                >
                  <span>Lock In This Estimate & Compare Rates</span>
                  <FaArrowRight />
                </button>

                <div className="rate-calc-phone-row">
                  <span>Prefer immediate verbal confirmation?</span>
                  <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="rate-calc-phone-link">
                    <FaPhoneAlt className="rate-calc-phone-icon" />
                    <span>Call {phone}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
