import { useState } from 'react'
import { FaPlus } from 'react-icons/fa'
import ScrollReveal from './ScrollReveal'
import './FAQ.css'

const faqs = [
  {
    id: 1,
    question: 'Is EverTree Solutions really free to use?',
    answer: 'Yes, absolutely! Our comparison service is 100% free for consumers. We are compensated by our network of service providers, so you never pay a dime to use our platform.',
  },
  {
    id: 2,
    question: 'How do you find and vet professionals?',
    answer: 'We partner with a nationwide network of licensed, insured, and pre-screened professionals. Every provider in our network undergoes a thorough background check and must meet our quality standards before they can offer quotes through our platform.',
  },
  {
    id: 3,
    question: 'How quickly will I receive quotes?',
    answer: 'Most users receive their first quotes within minutes of submitting a request. Depending on the service type and your location, you may receive multiple quotes within the first hour.',
  },
  {
    id: 4,
    question: 'Is my personal information secure?',
    answer: 'Absolutely. We use industry-standard 256-bit SSL encryption to protect your data. We never sell your personal information to third parties, and you can request deletion of your data at any time.',
  },
  {
    id: 5,
    question: 'Can I compare quotes from multiple providers?',
    answer: "Yes — that's our core feature! We present you with multiple competitive quotes side-by-side so you can easily compare pricing, coverage, and reviews to make the best decision.",
  },
  {
    id: 6,
    question: 'What areas do you serve?',
    answer: 'We serve customers across all 50 US states. Our network includes thousands of professionals and providers nationwide, ensuring coverage no matter where you live.',
  },
]

export default function FAQ({ onQuoteClick }) {
  const [activeId, setActiveId] = useState(null)

  const toggle = (id) => {
    setActiveId(activeId === id ? null : id)
  }

  return (
    <section className="faq section" id="faq">
      <div className="faq-deco"></div>
      <div className="container">
        <div className="faq-layout">
          <div className="faq-left">
            <ScrollReveal duration={0.4}>
              <span className="section-label">Got Questions?</span>
              <h2 className="section-title">
                Frequently Asked Questions
              </h2>
              <p className="section-subtitle">
                Everything you need to know about our service. Can't find what you're looking for? Reach out to our team.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.15} duration={0.4}>
              <div className="faq-cta">
                <div className="faq-cta-card">
                  <h4 className="faq-cta-title">Still have questions?</h4>
                  <p className="faq-cta-text">
                    Our support team is here to help you find exactly what you need.
                  </p>
                  <button className="btn btn-primary" onClick={onQuoteClick}>
                    Contact Us
                  </button>
                </div>
              </div>
            </ScrollReveal>
          </div>

          <div className="faq-list">
            {faqs.map((faq, i) => (
              <ScrollReveal key={faq.id} delay={i * 0.05} duration={0.4}>
                <div className={`faq-item ${activeId === faq.id ? 'active' : ''}`}>
                  <button className="faq-question" onClick={() => toggle(faq.id)}>
                    <span>{faq.question}</span>
                    <span className="faq-icon"><FaPlus /></span>
                  </button>
                  <div className="faq-answer">
                    <p className="faq-answer-text">{faq.answer}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
