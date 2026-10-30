import { motion } from 'framer-motion'
import { FaHeartbeat, FaHome, FaCar, FaHandHoldingUsd, FaGavel, FaShieldAlt, FaPlane } from 'react-icons/fa'
import ScrollReveal from './ScrollReveal'
import './Services.css'

const iconMap = {
  health: FaHeartbeat,
  home: FaHome,
  auto: FaCar,
  debt: FaHandHoldingUsd,
  legal: FaGavel,
  medicare: FaShieldAlt,
  travel: FaPlane,
}

const services = [
  {
    id: 1,
    title: 'Health Insurance',
    verticalId: 'health',
    subId: 'health-aca',
    badge: 'Popular',
    description: 'Find affordable ACA health coverage tailored to your family and budget. Compare subsidies and bronze-to-gold tiers.',
    icon: 'health',
    color: '#0B6B5C',
    bg: '#EDF7F5',
  },
  {
    id: 2,
    title: 'Home Improvement',
    verticalId: 'home-services',
    subId: 'remodeling',
    badge: 'Top Contractors',
    description: 'Connect with pre-screened, local licensed contractors for roofing, remodels, plumbing, HVAC, and window replacement.',
    icon: 'home',
    color: '#D99F26',
    bg: '#FFFDF0',
  },
  {
    id: 3,
    title: 'Auto & Home Insurance',
    verticalId: 'insurance',
    subId: 'auto',
    badge: 'Save up to $840',
    description: 'Bundle your auto and homeowner policies to unlock maximum multi-policy discounts with leading nationwide carriers.',
    icon: 'auto',
    color: '#03363A',
    bg: '#F6F9F7',
  },
  {
    id: 4,
    title: 'Debt Relief',
    verticalId: 'finance',
    subId: 'debt-relief',
    badge: 'Reduce Payments',
    description: 'Explore certified debt relief, loan consolidation, and settlement options to lower interest rates and resolve debt faster.',
    icon: 'debt',
    color: '#B93829',
    bg: '#FDF3F2',
  },
  {
    id: 5,
    title: 'Legal Help',
    verticalId: 'legal',
    subId: 'auto-accident',
    badge: 'No Fee Unless You Win',
    description: 'Connect with seasoned local trial attorneys specializing in auto collisions, personal injury, and workers compensation.',
    icon: 'legal',
    color: '#5B48D9',
    bg: '#F6F4FE',
  },
  {
    id: 6,
    title: 'Medicare Plans',
    verticalId: 'health',
    subId: 'medicare',
    badge: '$0 Premium Options',
    description: 'Navigate Medicare with total clarity. Compare Medicare Advantage (Part C), Medigap Supplements, and Part D drug plans.',
    icon: 'medicare',
    color: '#0B6B5C',
    bg: '#EDF7F5',
  },
  {
    id: 7,
    title: 'Flight Booking & Travel',
    verticalId: 'travel',
    subId: 'flights',
    badge: 'Private Airfares',
    description: 'Access unpublished consolidated airline fares, compare domestic and international routes, and consult our flight desk.',
    icon: 'travel',
    color: '#03363A',
    bg: '#F6F9F7',
  },
]

export default function Services({ onSelectSubVertical }) {
  const handleCardClick = (service) => {
    if (onSelectSubVertical) {
      onSelectSubVertical(service.verticalId, service.subId)
    }
  }

  return (
    <section className="services section" id="services">
      <div className="container">
        <div className="services-header">
          <ScrollReveal duration={0.4}>
            <span className="section-label">NATIONWIDE SERVICE DIRECTORY</span>
          </ScrollReveal>
          <ScrollReveal delay={0.08} duration={0.4}>
            <h2 className="section-title">
              Services We Connect &amp; Deliver
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.16} duration={0.4}>
            <p className="section-subtitle">
              From healthcare coverage to home repairs, debt relief, and flight booking — we connect you with vetted professionals for every milestone.
            </p>
          </ScrollReveal>
        </div>

        <div className="services-grid">
          {services.map((service, i) => {
            const IconComp = iconMap[service.icon]
            return (
              <ScrollReveal key={service.id} delay={i * 0.05} duration={0.4}>
                <motion.div
                  className="service-card"
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => handleCardClick(service)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleCardClick(service)
                    }
                  }}
                >
                  <div className="service-card-top">
                    <div
                      className="service-icon-wrap"
                      style={{
                        color: service.color,
                        backgroundColor: service.bg
                      }}
                    >
                      <IconComp />
                    </div>
                    {service.badge && (
                      <span className="service-badge-pill">{service.badge}</span>
                    )}
                  </div>

                  <h3 className="service-title">{service.title}</h3>
                  <p className="service-desc">{service.description}</p>

                  <div className="service-actions">
                    <span className="service-link">
                      View Plans &amp; Rates <span className="service-arrow">→</span>
                    </span>
                  </div>
                </motion.div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
