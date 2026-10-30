import { useState, useEffect, useCallback } from 'react'
import { FaStar, FaRegStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import ScrollReveal from './ScrollReveal'
import './Testimonials.css'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    role: 'Homeowner, Austin TX',
    quote: 'EverTree Solutions saved me over $1,200 on my home insurance. The comparison process was incredibly easy and I had quotes within minutes.',
    rating: 5,
    initial: 'S',
  },
  {
    id: 2,
    name: 'James Rodriguez',
    role: 'Small Business Owner, Miami FL',
    quote: "I was overwhelmed with debt and didn't know where to turn. This platform connected me with an advisor who created a realistic payoff plan.",
    rating: 5,
    initial: 'J',
  },
  {
    id: 3,
    name: 'Linda Chen',
    role: 'Retiree, Portland OR',
    quote: 'Navigating Medicare was so confusing until I found EverTree Solutions. They made it simple to compare plans and find the right coverage.',
    rating: 5,
    initial: 'L',
  },
  {
    id: 4,
    name: 'Marcus Thompson',
    role: 'New Homeowner, Denver CO',
    quote: 'Found an amazing contractor for my kitchen renovation through this site. The whole process from quote to completion was seamless.',
    rating: 4,
    initial: 'M',
  },
]

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cardsPerView, setCardsPerView] = useState(3)

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth <= 768) setCardsPerView(1)
      else if (window.innerWidth <= 1024) setCardsPerView(2)
      else setCardsPerView(3)
    }
    updateCardsPerView()
    window.addEventListener('resize', updateCardsPerView)
    return () => window.removeEventListener('resize', updateCardsPerView)
  }, [])

  const maxIndex = Math.max(0, testimonials.length - cardsPerView)
  const totalDots = maxIndex + 1

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }, [maxIndex])

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
  }, [maxIndex])

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  const trackOffset = currentIndex * (100 / cardsPerView)

  return (
    <section className="testimonials section" id="testimonials">
      <div className="testimonials-deco"></div>
      <div className="container">
        <div className="testimonials-header">
          <ScrollReveal duration={0.4}>
            <span className="section-label">Social Proof</span>
          </ScrollReveal>
          <ScrollReveal delay={0.08} duration={0.4}>
            <h2 className="section-title" style={{ textAlign: 'center', margin: '0 auto var(--space-4)' }}>
              What Our Users Say
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.16} duration={0.4}>
            <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto var(--space-12)' }}>
              Join thousands of satisfied users who found better deals through our platform.
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal duration={0.4}>
          <div className="testimonials-track-wrapper">
            <div
              className="testimonials-track"
              style={{ transform: `translateX(-${trackOffset}%)` }}
            >
              {testimonials.map((t) => (
                <div key={t.id} className="testimonial-card-slot">
                  <div className="testimonial-card">
                    <span className="testimonial-quote-mark">"</span>
                    <div className="testimonial-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`testimonial-star ${star <= t.rating ? '' : 'empty'}`}>
                          {star <= t.rating ? <FaStar /> : <FaRegStar />}
                        </span>
                      ))}
                    </div>
                    <p className="testimonial-text">"{t.quote}"</p>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar">{t.initial}</div>
                      <div>
                        <div className="testimonial-name">{t.name}</div>
                        <div className="testimonial-role">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <div className="testimonials-nav">
          <button className="testimonials-arrow" onClick={prev} aria-label="Previous testimonial">
            <FaChevronLeft />
          </button>
          <div className="testimonials-dots">
            {Array.from({ length: totalDots }).map((_, i) => (
              <button
                key={i}
                className={`testimonials-dot ${i === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
          <button className="testimonials-arrow" onClick={next} aria-label="Next testimonial">
            <FaChevronRight />
          </button>
        </div>
      </div>
    </section>
  )
}
