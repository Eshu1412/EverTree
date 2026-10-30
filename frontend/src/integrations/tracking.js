/**
 * EverTree Solutions — Marketing & Compliance Integrations
 * 
 * Supports:
 * 1. ActiveProspect TrustedForm (TCPA Certificate Generation & Verification)
 * 2. Meta Pixel (Facebook Events / Lead Tracking / Conversions API readiness)
 * 
 * Both services are fully instrumented. They activate automatically as soon as
 * their corresponding environment variables are set in .env:
 * - VITE_META_PIXEL_ID (e.g. 123456789012345)
 * - VITE_TRUSTEDFORM_ENABLED ('true' or default enabled)
 */

const pixelId = import.meta.env.VITE_META_PIXEL_ID || ''
const trustedFormEnabled = import.meta.env.VITE_TRUSTEDFORM_ENABLED !== 'false'

function injectScript(src, id) {
  if (typeof document === 'undefined') return
  if (document.getElementById(id)) return
  const script = document.createElement('script')
  script.id = id
  script.async = true
  script.src = src
  document.head.appendChild(script)
}

/**
 * Initialize all third-party tracking scripts safely.
 */
export function initialiseTracking() {
  // 1. ActiveProspect TrustedForm Script Injection
  if (trustedFormEnabled && typeof document !== 'undefined') {
    try {
      injectScript(
        'https://api.trustedform.com/trustedform.js?provide_referral=false&field=xxTrustedFormCertUrl&use_ping=true',
        'trustedform-script'
      )
      console.log('[Compliance] ActiveProspect TrustedForm script initialized.')
    } catch (e) {
      console.warn('[Compliance] TrustedForm initialization skipped:', e)
    }
  }

  // 2. Meta Pixel Script Initialization
  if (pixelId && typeof window !== 'undefined' && !window.fbq) {
    try {
      window.fbq = function fbq(...args) {
        window.fbq.callMethod ? window.fbq.callMethod(...args) : window.fbq.queue.push(args)
      }
      window.fbq.queue = []
      window.fbq.loaded = true
      window.fbq.version = '2.0'
      injectScript('https://connect.facebook.net/en_US/fbevents.js', 'meta-pixel-script')
      window.fbq('init', pixelId)
      window.fbq('track', 'PageView')
      console.log(`[Analytics] Meta Pixel initialized with ID: ${pixelId}`)
    } catch (e) {
      console.warn('[Analytics] Meta Pixel initialization failed:', e)
    }
  } else if (!pixelId) {
    // Development placeholder for tracking calls
    console.info('[Tracking Ready] Meta Pixel will activate once VITE_META_PIXEL_ID is set in .env')
  }
}

/**
 * Track standard Lead conversion event
 */
export function trackLead(service, category = 'General', value = 0) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'Lead', {
      content_name: service,
      content_category: category,
      currency: 'USD',
      value: value || 0
    })
  }
}

/**
 * Track PageView event (useful for SPA navigation)
 */
export function trackPageView(pageName = '') {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'PageView', { page_name: pageName })
  }
}

/**
 * Track ViewContent event (viewing specific service/category)
 */
export function trackViewContent(service, category) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'ViewContent', {
      content_name: service,
      content_category: category
    })
  }
}

/**
 * Track Contact / Hotline phone click
 */
export function trackContactClick(service, phone) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'Contact', {
      content_name: service,
      phone_number: phone
    })
  }
}
