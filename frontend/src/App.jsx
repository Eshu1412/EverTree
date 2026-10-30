import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SplashScreen from './components/SplashScreen'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import HowItWorks from './components/HowItWorks'
import Testimonials from './components/Testimonials'
import FAQ from './components/FAQ'
import QuoteForm from './components/QuoteForm'
import Footer from './components/Footer'
import CategoryView from './components/CategoryView'
import SubVerticalView from './components/SubVerticalView'
import ThankYouView from './components/ThankYouView'
import AdminDashboard from './components/Admin/AdminDashboard'
import TravelServicesView from './components/Travel/TravelServicesView'
import ContactRedirectModal from './components/ContactRedirectModal'
import { DEFAULT_CONTACT_CONFIG, getServicePhone } from './utils/serviceContact'

export default function App() {
  const [splashDone, setSplashDone] = useState(false)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [selectedService, setSelectedService] = useState('')

  // View state: 'home' | 'vertical' | 'sub-vertical' | 'thank-you' | 'admin'
  const [viewState, setViewState] = useState('home')
  const [activeVertical, setActiveVertical] = useState('')
  const [activeSub, setActiveSub] = useState('')
  const [submittedLead, setSubmittedLead] = useState(null)

  // On-screen Contact & Redirect Window state
  const [showContactModal, setShowContactModal] = useState(false)
  const [activeServicePhone, setActiveServicePhone] = useState('')
  const [contactConfig, setContactConfig] = useState(() => {
    try {
      const cached = localStorage.getItem('contact_config')
      return cached ? JSON.parse(cached) : DEFAULT_CONTACT_CONFIG
    } catch {
      return DEFAULT_CONTACT_CONFIG
    }
  })

  // Listen to #admin hash or location changes
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin' || window.location.pathname === '/admin') {
        setViewState('admin')
      }
    }
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [])

  // Fetch admin contact configuration on mount
  useEffect(() => {
    const fetchContactSettings = async () => {
      try {
        const res = await fetch('/api/settings/contact')
        if (res.ok) {
          const data = await res.json()
          setContactConfig(data)
          localStorage.setItem('contact_config', JSON.stringify(data))
        }
      } catch (err) {
        console.warn('Using cached contact settings', err)
      }
    }
    fetchContactSettings()
  }, [])

  // Listen to contact config updates across tabs or admin panel saves
  useEffect(() => {
    const handleConfigSync = (e) => {
      if (e?.detail) setContactConfig(e.detail)
    }
    window.addEventListener('contact_config_updated', handleConfigSync)
    return () => window.removeEventListener('contact_config_updated', handleConfigSync)
  }, [])

  // Track Meta Pixel PageView on SPA view navigation
  useEffect(() => {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView')
    }
  }, [viewState, activeVertical, activeSub])

  const handleSplashComplete = useCallback(() => {
    setSplashDone(true)
  }, [])

  const handleNavigateHome = () => {
    if (window.location.hash === '#admin') {
      window.location.hash = ''
    }
    try {
      const cached = localStorage.getItem('contact_config')
      if (cached) setContactConfig(JSON.parse(cached))
    } catch {}
    setViewState('home')
    setActiveVertical('')
    setActiveSub('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNavigateAdmin = () => {
    window.location.hash = 'admin'
    setViewState('admin')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNavigateVertical = (verticalId) => {
    setActiveVertical(verticalId)
    setViewState('vertical')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNavigateSubVertical = (verticalId, subId) => {
    setActiveVertical(verticalId)
    setActiveSub(subId)
    setViewState('sub-vertical')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFormSubmitted = (leadInfo) => {
    setSubmittedLead(leadInfo)
    setViewState('thank-you')
    if (quoteOpen) setQuoteOpen(false)

    // Pull absolute latest config (from localStorage if present, or state)
    let liveConfig = contactConfig
    try {
      const cached = localStorage.getItem('contact_config')
      if (cached) {
        liveConfig = JSON.parse(cached)
        setContactConfig(liveConfig)
      }
    } catch {}

    // Resolve individual service hotline phone number
    const sPhone = getServicePhone(leadInfo?.service, leadInfo?.category, liveConfig)

    // STRICT RULE: If the number is not provided, the on-screen contact window will NOT display
    if (liveConfig?.enabled !== false && sPhone && sPhone.trim().length > 0) {
      setActiveServicePhone(sPhone.trim())
      setShowContactModal(true)
    } else {
      setActiveServicePhone('')
      setShowContactModal(false)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenQuote = (service = '') => {
    setSelectedService(service)
    setQuoteOpen(true)
  }

  const activeKey = `${viewState}-${activeVertical}-${activeSub}`

  if (viewState === 'admin') {
    return <AdminDashboard onNavigateHome={handleNavigateHome} />
  }

  return (
    <>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Top Sweep Progress Indicator on Page Transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bar-${activeKey}`}
          className="page-transition-bar"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </AnimatePresence>

      <Navbar
        onQuoteClick={() => handleOpenQuote('')}
        onNavigateHome={handleNavigateHome}
        onNavigateVertical={handleNavigateVertical}
        viewState={viewState}
        activeVertical={activeVertical}
      />

      <main style={{ position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {viewState === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.995 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <Hero onQuoteClick={() => handleOpenQuote('')} />
              <Services onSelectSubVertical={handleNavigateSubVertical} />
              <HowItWorks />
              <Testimonials />
              <FAQ onQuoteClick={() => handleOpenQuote('')} />
            </motion.div>
          )}

          {viewState === 'vertical' && (
            <motion.div
              key={`vertical-${activeVertical}`}
              initial={{ opacity: 0, y: 20, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.995 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeVertical === 'travel' ? (
                <TravelServicesView
                  onNavigateHome={handleNavigateHome}
                  onFormSubmitted={handleFormSubmitted}
                />
              ) : (
                <CategoryView
                  verticalId={activeVertical}
                  onNavigateHome={handleNavigateHome}
                  onSelectSubVertical={handleNavigateSubVertical}
                />
              )}
            </motion.div>
          )}

          {viewState === 'sub-vertical' && (
            <motion.div
              key={`sub-vertical-${activeVertical}-${activeSub}`}
              initial={{ opacity: 0, y: 20, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.995 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <SubVerticalView
                verticalId={activeVertical}
                subId={activeSub}
                onNavigateHome={handleNavigateHome}
                onNavigateVertical={handleNavigateVertical}
                onFormSubmitted={handleFormSubmitted}
              />
            </motion.div>
          )}

          {viewState === 'thank-you' && (
            <motion.div
              key="thank-you"
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -15 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <ThankYouView
                leadData={submittedLead}
                onNavigateHome={handleNavigateHome}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer
        onQuoteClick={() => handleOpenQuote('')}
      />
      <QuoteForm
        isOpen={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        defaultService={selectedService}
        onNavigateVertical={handleNavigateVertical}
        onFormSubmitted={handleFormSubmitted}
      />

      {/* On-screen Contact Us & Redirection Message Window */}
      <ContactRedirectModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        config={contactConfig}
        leadData={submittedLead}
        overridePhone={activeServicePhone}
      />
    </>
  )
}


