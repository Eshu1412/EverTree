import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Hero from './components/Hero'
import QuoteForm from './components/QuoteForm'
import CategoryView from './components/CategoryView'
import SubVerticalView from './components/SubVerticalView'
import ThankYouView from './components/ThankYouView'
import TravelServicesView from './components/Travel/TravelServicesView'
import AdminDashboard from './components/Admin/AdminDashboard'
import ContactRedirectModal from './components/ContactRedirectModal'
import { DEFAULT_CONTACT_CONFIG, getServicePhone } from './utils/serviceContact'

const services = [
  { number: '01', title: 'Health & Life', route: 'health', copy: 'Compare health, life, final expense, SSDI, and Medicare options.', tag: 'Protection', eta: '~2 min turnaround' },
  { number: '02', title: 'Auto & Home', route: 'insurance', copy: 'Find coverage for your vehicle, home, and the things that keep life moving.', tag: 'Insurance', eta: '50-state network' },
  { number: '03', title: 'Home Services', route: 'home-services', copy: 'Meet vetted professionals for repairs, renovations, maintenance, and more.', tag: 'Home services', eta: 'Pre-screened pros' },
  { number: '04', title: 'Finance', route: 'finance', copy: 'Explore debt relief, loans, and practical steps toward financial wellbeing.', tag: 'Financial wellbeing', eta: 'No obligation' },
  { number: '05', title: 'Legal Help', route: 'legal', copy: 'Connect with local legal support for the moments when advocacy matters.', tag: 'Legal services', eta: 'Confidential review' },
  { number: '06', title: 'Medicare', quote: 'medicare', copy: 'Compare Medicare Advantage, Supplement, and prescription drug plans.', tag: 'Medicare plans', eta: 'Licensed specialists' },
  { number: '07', title: 'Travel', route: 'travel', copy: 'Compare flights and vacation packages for the trip ahead.', tag: 'Travel planning', eta: 'Direct assistance' },
]
const faqs = [
  ['Is EverTree Solutions really free to use?', 'Yes. Our comparison service is free for consumers. We are compensated by members of our provider network, never by charging you to explore options.'],
  ['How do you find and vet professionals?', 'We work with licensed, insured, and pre-screened professionals who meet the standards for the services they offer.'],
  ['How quickly will I receive quotes?', 'Timing depends on the service and your location, but many requests receive a response within minutes or the same day.'],
  ['Is my personal information secure?', 'We use standard safeguards for quote requests and collect only the information needed to help connect you with relevant options.'],
]
function ChevronDown() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg> }
function ArrowRight() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg> }
function ArrowUpRight() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M8 5h11v11" /></svg> }
function BrandMark() { return <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 22 21H2L12 3Z" /></svg> }

function Navbar({ onQuoteClick, onNavigateHome, onNavigateSection }) {
  const [menuOpen, setMenuOpen] = useState(false); const [scrolled, setScrolled] = useState(false)
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 20); onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll) }, [])
  useEffect(() => { document.body.style.overflow = menuOpen ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [menuOpen])
  const home = (event) => { event.preventDefault(); setMenuOpen(false); onNavigateHome() }
  const quote = (event) => { event.preventDefault(); setMenuOpen(false); onQuoteClick() }
  return <header className={`site-nav ${scrolled ? 'site-nav--scrolled' : ''}`}><div className="nav-inner">
    <nav className="nav-links animate-fade-down stagger-1" aria-label="Primary navigation"><a className="nav-link nav-link--solutions" href="#solutions" onClick={(e) => onNavigateSection(e, 'solutions')}>Services <ChevronDown /></a><a className="nav-link" href="#how-it-works" onClick={(e) => onNavigateSection(e, 'how-it-works')}>How it works</a><a className="nav-link" href="#faq" onClick={(e) => onNavigateSection(e, 'faq')}>FAQ</a></nav>
    <a className="brand animate-fade-down stagger-2" href="#top" onClick={home} aria-label="EverTree home"><BrandMark /><span>EverTree</span></a><a className="nav-cta animate-fade-down stagger-3" href="#start" onClick={quote}>Find Your Match</a>
    <button className={`menu-toggle ${menuOpen ? 'menu-toggle--open' : ''}`} type="button" aria-label="Toggle menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
    <div className={`mobile-menu ${menuOpen ? 'mobile-menu--open' : ''}`}><nav className="mobile-menu__links" aria-label="Mobile navigation"><a href="#solutions" onClick={(e) => { setMenuOpen(false); onNavigateSection(e, 'solutions') }}>Services</a><a href="#how-it-works" onClick={(e) => { setMenuOpen(false); onNavigateSection(e, 'how-it-works') }}>How it works</a><a href="#faq" onClick={(e) => { setMenuOpen(false); onNavigateSection(e, 'faq') }}>FAQ</a><a className="mobile-menu__cta" href="#start" onClick={quote}>Find Your Match</a></nav><div className="mobile-menu__contact"><span className="mobile-menu__contact-title">Direct Inquiries</span><a href="tel:8558312264" className="mobile-menu__contact-link">📞 (855) 831-2264</a><a href="mailto:support@evertreesolutions.com" className="mobile-menu__contact-link">✉ support@evertreesolutions.com</a></div></div>
  </div></header>
}
function TrustedBy() { return <div className="trusted animate-fade-up stagger-5"><div className="trusted__meta"><span className="trusted__stars">★★★★★</span><span className="trusted__score">4.9/5 Rating</span><span className="trusted__sep">•</span><span>15,000+ Comparisons</span><span className="trusted__sep">•</span><span className="trusted__badge">Top 100 US Providers</span></div><p>Explore with confidence across verified verticals</p><div className="trusted__logos animate-fade-up stagger-6"><span className="logo-playfair">Insurance</span><span className="logo-oswald">HOME</span><span className="logo-montserrat">Finance</span><span className="logo-roboto">TRAVEL</span><span className="logo-raleway">Wellbeing</span></div></div> }
/* Hero imported from ./components/Hero */
function Intro() { return <section className="intro section-pad" id="about"><div className="eyebrow">Designed around real life</div><div className="intro__grid"><h2>Big decisions deserve a more human starting point.</h2><div className="intro__copy"><p>EverTree brings helpful choices into one considered place—so you can spend less time sorting through options and more time moving forward.</p><a className="text-link" href="#how-it-works">How EverTree works <ArrowRight /></a></div></div></section> }
function Services({ onOpenQuote }) { return <section className="services" id="solutions"><div className="services__heading section-pad"><div><div className="eyebrow eyebrow--light">Where can we help?</div><h2>Pick a service. Get help without the detour.</h2></div><p>Choose a service to open its short quote form immediately.</p></div><div className="service-grid">{services.map((service) => <button className="service-card" type="button" onClick={() => onOpenQuote(service.quote || service.route)} key={service.title}><div className="service-card__top"><span>{service.number}</span><span className="service-card__eta">{service.eta}</span><ArrowUpRight /></div><div><span className="service-card__tag">{service.tag}</span><h3>{service.title}</h3><p>{service.copy}</p></div><span className="service-card__cta">Get a quote <ArrowRight /></span></button>)}</div></section> }
function Partners({ onFormSubmitted, initialRole = 'buyer' }) {
  const [role, setRole] = useState(initialRole);
  const [vertical, setVertical] = useState('Health & Life Insurance');
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState('');

  const formatPhone = (val) => {
    const cleaned = ('' + val).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return val;
    let res = '';
    if (match[1]) res = `(${match[1]}`;
    if (match[1]?.length === 3) res += ') ';
    if (match[2]) res += match[2];
    if (match[2]?.length === 3) res += '-';
    if (match[3]) res += match[3];
    return res;
  };

  const handlePhoneChange = (e) => {
    setForm(prev => ({ ...prev, phone: formatPhone(e.target.value) }));
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const options = role === 'buyer'
    ? ['Health & Life Insurance', 'Final Expense', 'SSDI', 'Auto & Home Insurance', 'Home Improvement', 'Debt Relief & Settlement', 'Business Funding / MCA', 'IRS Tax Settlement', 'Legal Help', 'Medicare Plans', 'Flight Booking & Travel', 'Other']
    : ['Final Expense supply', 'SSDI supply', 'MVA (CPA)', 'Mass Torts', 'Insurance Inbound Leads', 'Debt Relief supply', 'Other'];

  const changeRole = (nextRole) => {
    setRole(nextRole);
    setVertical(nextRole === 'buyer' ? 'Health & Life Insurance' : 'Final Expense supply');
  };

  useEffect(() => changeRole(initialRole), [initialRole]);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('Sending…');
    const payload = {
      full_name: form.name.trim(),
      company: form.company.trim() || 'Independent',
      email: form.email.trim(),
      phone: form.phone.trim(),
      vertical,
      message: form.message.trim(),
      notes: `Submitted from EverTree partner section | ${role}`
    };
    try {
      const response = await fetch(role === 'buyer' ? '/api/buyers/register' : '/api/publishers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error();
      setStatus('Request received. Thank you.');
      onFormSubmitted({
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        service: vertical,
        category: role
      });
    } catch {
      setStatus('We could not send that request just now. Please try again.');
    }
  };

  return (
    <section className="partners section-pad" id="partners">
      <div className="partners__intro">
        <div className="eyebrow">For partners</div>
        <h2>Built for buyers and publishers, too.</h2>
        <p>Access quality lead opportunities or introduce your traffic supply to EverTree’s team.</p>
      </div>
      <form className="partner-form" onSubmit={submit}>
        <div className="partner-switch" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={role === 'buyer'}
            className={`partner-switch__btn ${role === 'buyer' ? 'is-active' : ''}`}
            onClick={() => changeRole('buyer')}
          >
            I’m a buyer
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'publisher'}
            className={`partner-switch__btn ${role === 'publisher' ? 'is-active' : ''}`}
            onClick={() => changeRole('publisher')}
          >
            I’m a publisher
          </button>
        </div>

        <label className="partner-vertical">
          {role === 'buyer' ? 'Vertical / Service needed' : 'Traffic supply vertical'}
          <select value={vertical} onChange={(e) => setVertical(e.target.value)}>
            {options.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>

        <div className="partner-fields">
          <label>
            Full name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
          </label>
          <label>
            Company
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
          </label>
          <label className="field-with-validation">
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Email {isEmailValid && <span className="valid-pill">✓ Valid</span>}
            </span>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com" />
          </label>
          <label>
            Phone
            <input required type="tel" value={form.phone} onChange={handlePhoneChange} placeholder="(555) 000-0000" />
          </label>
        </div>

        <label className="partner-message">
          How can we help?
          <textarea rows="3" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Target states, lead volume, or requirements…" />
        </label>

        <button className="button button--dark" type="submit">
          {role === 'buyer' ? 'Request buyer access' : 'Apply as a publisher'} <ArrowRight />
        </button>

        <p className="partner-tcpa">
          By submitting, you agree to receive communications from EverTree Solutions at the email and phone number provided. Consent is not a condition of purchase. Message and data rates may apply.
        </p>

        {status && <p className="partner-status">{status}</p>}
      </form>
    </section>
  );
}
function HowItWorks({ onOpenQuote }) { const steps = [['Choose your service', 'Pick the help you need and open its short quote form right away.'], ['Share the essentials', 'Provide your name, contact details, and ZIP code. Add context only if you want to.'], ['Get local options', 'A matched specialist follows up with relevant quotes and next steps.']]; return <section className="process section-pad" id="how-it-works"><div className="process__lead"><div className="eyebrow">A simpler process</div><h2>One service. One short form. Clear next steps.</h2><p>Choose what you need and share only the essentials to start receiving relevant local options.</p><button className="button button--dark" onClick={() => onOpenQuote('')}>Start a quote <ArrowRight /></button></div><ol className="process__steps">{steps.map(([title, copy], index) => <li key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol></section> }
function FAQ({ onOpenQuote }) { const [open, setOpen] = useState(null); return <section className="faq-new section-pad" id="faq"><div><div className="eyebrow">Answers, clearly</div><h2>Questions before you start?</h2><p>Everything you need to know about exploring services and requesting support.</p><button className="button button--dark" onClick={() => onOpenQuote('')}>Start a quote <ArrowRight /></button></div><div className="faq-new__list">{faqs.map(([question, answer], index) => <article className={open === index ? 'is-open' : ''} key={question}><button onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index}><span>{question}</span><b>{open === index ? '−' : '+'}</b></button>{open === index && <p>{answer}</p>}</article>)}</div></section> }
function Quote() { return <section className="quote"><div className="quote__mark">“</div><blockquote>EverTree helped me stop spiralling through search results and finally make a decision I felt good about.</blockquote><div className="quote__person"><span className="person-dot">JM</span><div><strong>Jordan M.</strong><small>EverTree customer</small></div></div></section> }
function Start({ onOpenQuote }) { return <section className="start" id="start"><div className="start__orb" aria-hidden="true" /><div className="start__content"><div className="eyebrow eyebrow--light">Ready when you are</div><h2>Find a clearer way forward.</h2><p>Choose a service, answer a few relevant questions, then use the restored quote flow to request help.</p><button className="button button--light" onClick={() => onOpenQuote('')}>Find Your Match <ArrowRight /></button></div></section> }
function Footer({ onNavigateHome, onOpenQuote }) { return <footer className="footer"><div className="footer__top"><a className="brand" href="#top" onClick={(e) => { e.preventDefault(); onNavigateHome() }}><BrandMark /><span>EverTree</span></a><p>A more considered way to navigate life’s next decision.</p><button className="footer__toplink" onClick={() => onNavigateHome()}>Back to top <ArrowUpRight /></button></div><div className="footer__bottom"><span>© 2026 EverTree Solutions</span><div><a href="#faq">FAQ</a><button onClick={() => onOpenQuote('')}>Get a quote</button><a href="mailto:hello@evertree.example">Contact</a></div></div></footer> }
function Home({ onNavigateVertical, onOpenQuote, onFormSubmitted }) { const [partnerRole, setPartnerRole] = useState('buyer'); const showPartners = (role) => { setPartnerRole(role); window.setTimeout(() => document.getElementById('partners')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0) }; return <><Hero onShowPartners={showPartners} /><Intro /><Services onNavigateVertical={onNavigateVertical} onOpenQuote={onOpenQuote} /><HowItWorks onOpenQuote={onOpenQuote} /><Partners initialRole={partnerRole} onFormSubmitted={onFormSubmitted} /><FAQ onOpenQuote={onOpenQuote} /><Quote /><Start onOpenQuote={onOpenQuote} /></> }

export default function App() {
  const [quoteOpen, setQuoteOpen] = useState(false); const [selectedService, setSelectedService] = useState(''); const [viewState, setViewState] = useState('home'); const [activeVertical, setActiveVertical] = useState(''); const [activeSub, setActiveSub] = useState(''); const [submittedLead, setSubmittedLead] = useState(null); const [showContactModal, setShowContactModal] = useState(false); const [activeServicePhone, setActiveServicePhone] = useState('')
  const [showFloatingPill, setShowFloatingPill] = useState(false)
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingPill(window.scrollY > 550 && viewState === 'home');
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [viewState]);
  const [contactConfig, setContactConfig] = useState(() => { try { const cached = localStorage.getItem('contact_config'); return cached ? JSON.parse(cached) : DEFAULT_CONTACT_CONFIG } catch { return DEFAULT_CONTACT_CONFIG } })
  useEffect(() => { const checkHash = () => { if (window.location.hash === '#admin' || window.location.pathname === '/admin') { setViewState('admin'); document.title = 'EverTree | Admin Portal' } }; checkHash(); window.addEventListener('hashchange', checkHash); return () => window.removeEventListener('hashchange', checkHash) }, [])
  useEffect(() => { fetch('/api/settings/contact').then((res) => res.ok ? res.json() : null).then((data) => { if (data) { setContactConfig(data); localStorage.setItem('contact_config', JSON.stringify(data)) } }).catch(() => {}) }, [])
  const navigateHome = () => { if (window.location.hash === '#admin') window.history.pushState(null, '', window.location.pathname); setViewState('home'); setActiveVertical(''); setActiveSub(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const navigateSection = (event, id) => { event.preventDefault(); setViewState('home'); setActiveVertical(''); setActiveSub(''); window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) }
  const navigateVertical = (verticalId) => { setActiveVertical(verticalId); setViewState('vertical'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const navigateSubVertical = (verticalId, subId) => { setActiveVertical(verticalId); setActiveSub(subId); setViewState('sub-vertical'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const openQuote = (service = '') => { setSelectedService(service); setQuoteOpen(true) }
  const onFormSubmitted = (lead) => { setSubmittedLead(lead); setQuoteOpen(false); setViewState('thank-you'); const phone = getServicePhone(lead?.service, lead?.category, contactConfig); if (contactConfig?.enabled !== false && phone?.trim()) { setActiveServicePhone(phone.trim()); setShowContactModal(true) }; window.scrollTo({ top: 0, behavior: 'smooth' }) }
  if (viewState === 'admin') return <AdminDashboard onNavigateHome={navigateHome} />
  return <><Navbar onQuoteClick={() => openQuote('')} onNavigateHome={navigateHome} onNavigateSection={navigateSection} /><main className="app-main"><AnimatePresence mode="wait">{viewState === 'home' && <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Home onNavigateVertical={navigateVertical} onOpenQuote={openQuote} onFormSubmitted={onFormSubmitted} /></motion.div>}{viewState === 'vertical' && <motion.div key={`vertical-${activeVertical}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{activeVertical === 'travel' ? <TravelServicesView onNavigateHome={navigateHome} onFormSubmitted={onFormSubmitted} /> : <CategoryView verticalId={activeVertical} onNavigateHome={navigateHome} onSelectSubVertical={navigateSubVertical} />}</motion.div>}{viewState === 'sub-vertical' && <motion.div key={`sub-${activeVertical}-${activeSub}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><SubVerticalView verticalId={activeVertical} subId={activeSub} onNavigateHome={navigateHome} onNavigateVertical={navigateVertical} onFormSubmitted={onFormSubmitted} /></motion.div>}{viewState === 'thank-you' && <ThankYouView leadData={submittedLead} onNavigateHome={navigateHome} />}</AnimatePresence></main><Footer onNavigateHome={navigateHome} onOpenQuote={openQuote} /><QuoteForm isOpen={quoteOpen} onClose={() => setQuoteOpen(false)} defaultService={selectedService} onNavigateVertical={navigateVertical} onFormSubmitted={onFormSubmitted} /><ContactRedirectModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} config={contactConfig} leadData={submittedLead} overridePhone={activeServicePhone} />
    <AnimatePresence>
      {showFloatingPill && !quoteOpen && (
        <motion.button
          type="button"
          className="floating-quote-pill"
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.92 }}
          transition={{ duration: 0.22 }}
          onClick={() => openQuote('')}
          aria-label="Start your quote comparison"
        >
          <span className="floating-quote-dot" />
          <span>Find Your Match</span>
          <ArrowRight />
        </motion.button>
      )}
    </AnimatePresence>
  </>
}
