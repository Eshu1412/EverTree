import { motion } from 'framer-motion'
import { FaBullseye, FaFilter, FaHandshake } from 'react-icons/fa'
import ScrollReveal from './ScrollReveal'
import './HowItWorks.css'

const layers = [
  {
    num: '01',
    title: 'Attract',
    icon: FaBullseye,
    tag: 'Targeted Intent',
    description: 'Targeted campaigns put your offer in front of consumers and businesses already actively looking for it.',
    points: ['High-intent audience matching', 'Multi-channel acquisition', 'Verified geographic routing']
  },
  {
    num: '02',
    title: 'Qualify',
    icon: FaFilter,
    tag: 'Smart Screening',
    description: 'Smart screening filters out the noise so only serious, high-intent prospects move forward into your pipeline.',
    points: ['ActiveProspect TrustedForm TCPA', 'Multi-tier intake questions', 'Instant fraud & bot rejection']
  },
  {
    num: '03',
    title: 'Convert',
    icon: FaHandshake,
    tag: 'Warm Delivery',
    description: 'Warm, ready-to-talk leads land directly with your team in real time, prepared to become long-term clients.',
    points: ['Live phone hotline routing', 'Instant CRM data delivery', 'Transparent conversion reporting']
  }
]

export default function HowItWorks() {
  return (
    <section className="how-it-works section" id="how">
      <div className="container">
        <div className="how-header">
          <ScrollReveal duration={0.4}>
            <span className="section-label">HOW IT WORKS</span>
          </ScrollReveal>
          <ScrollReveal delay={0.08} duration={0.4}>
            <h2 className="how-title">
              Three stages. Zero guesswork.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.16} duration={0.4}>
            <p className="how-subtitle">
              Our verified three-stage matching protocol connects you with pre-screened, licensed providers offering the most competitive rates in your area.
            </p>
          </ScrollReveal>
        </div>

        <div className="how-grid">
          {layers.map((layer, idx) => {
            const IconComp = layer.icon
            return (
              <ScrollReveal key={layer.num} delay={0.1 * idx} duration={0.4}>
                <motion.div
                  className="how-card"
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="how-watermark">{layer.num}</div>

                  <div className="how-card-header">
                    <div className="how-icon-box">
                      <IconComp />
                    </div>
                    <span className="how-tag-pill">{layer.tag}</span>
                  </div>

                  <div className="how-step-indicator">STAGE {layer.num}</div>
                  <h3 className="how-card-title">{layer.title}</h3>
                  <p className="how-card-desc">{layer.description}</p>

                  <ul className="how-points-list">
                    {layer.points.map((pt, pIdx) => (
                      <li key={pIdx}>
                        <span className="how-check">✓</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
