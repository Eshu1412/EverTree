/**
 * Contact configuration utilities & service hotline resolution.
 */

export const DEFAULT_SERVICE_HOTLINE = '+18558312264';

export const SERVICE_VERTICALS = [
  {
    id: 'health',
    title: 'Health Insurance',
    category: 'health',
    description: 'ACA individual & family health plans',
    tag: 'Healthcare',
    color: '#10B981'
  },
  {
    id: 'medicare',
    title: 'Medicare',
    category: 'health',
    description: 'Medicare Advantage & Medigap supplement',
    tag: 'Seniors',
    color: '#06B6D4'
  },
  {
    id: 'insurance',
    title: 'Auto & Home Insurance',
    category: 'insurance',
    description: 'Bundled auto & homeowners policies',
    tag: 'Insurance',
    color: '#3B82F6'
  },
  {
    id: 'home-services',
    title: 'Home Improvement',
    category: 'home-services',
    description: 'Roofing, remodeling, HVAC & plumbing',
    tag: 'Home Services',
    color: '#D97706'
  },
  {
    id: 'finance',
    title: 'Debt Relief',
    category: 'finance',
    description: 'Debt consolidation & settlement programs',
    tag: 'Debt & Credit',
    color: '#EF4444'
  },
  {
    id: 'legal',
    title: 'Legal Help',
    category: 'legal',
    description: 'Auto accidents, injury & legal consultations',
    tag: 'Legal Help',
    color: '#8B5CF6'
  },
  {
    id: 'travel',
    title: 'Flight Booking',
    category: 'travel',
    description: 'Private & published airline quote desk',
    tag: 'Aviation Desk',
    color: '#0B6B5C'
  }
];

export const DEFAULT_CONTACT_CONFIG = {
  enabled: true,
  phone_number: '+18558312264',
  modal_title: 'Speak With an Advisor Right Now',
  modal_message: 'Your request has been received! Our support specialists are available immediately to provide personal assistance and lowest quote rates.',
  auto_redirect: true,
  auto_redirect_seconds: 5,
  services: {
    'Health Insurance': '+18558312264',
    'Home Improvement': '+18558312264',
    'Auto & Home Insurance': '+18558312264',
    'Debt Relief': '+18558312264',
    'Legal Help': '+18558312264',
    'Medicare': '+18558312264',
    'Flight Booking': '+18558312264'
  }
};

/**
 * Resolves the phone number for a given service and category.
 * Returns an empty string `""` if no number is configured, which indicates
 * that the on-screen contact modal window should NOT display.
 * 
 * @param {string} serviceName - e.g. 'Flight Booking', 'Health Insurance (ACA)', etc.
 * @param {string} category - e.g. 'travel', 'health', 'insurance', etc.
 * @param {object} config - The contactConfig object
 * @returns {string} The resolved phone number or "" if not provided
 */
export function getServicePhone(serviceName, category, config) {
  if (!config) return '';
  const services = config.services || {};

  // 1. Direct exact match
  if (serviceName && typeof services[serviceName] === 'string') {
    return services[serviceName].trim();
  }

  // 2. Case-insensitive exact match
  const cleanName = (serviceName || '').trim().toLowerCase();
  for (const [key, val] of Object.entries(services)) {
    if (key.trim().toLowerCase() === cleanName) {
      return (val || '').trim();
    }
  }

  // 3. Keyword / Sub-vertical heuristic matching
  if (cleanName) {
    if (cleanName.includes('flight') || cleanName.includes('airline') || cleanName.includes('travel') || cleanName.includes('plane')) {
      if (typeof services['Flight Booking'] === 'string') return services['Flight Booking'].trim();
    }
    if (cleanName.includes('medicare') || cleanName.includes('medicaid')) {
      if (typeof services['Medicare'] === 'string') return services['Medicare'].trim();
    }
    if (cleanName.includes('health') || cleanName.includes('aca') || cleanName.includes('disability') || cleanName.includes('ssdi') || cleanName.includes('final expense')) {
      if (typeof services['Health Insurance'] === 'string') return services['Health Insurance'].trim();
    }
    if (cleanName.includes('auto') || cleanName.includes('car') || cleanName.includes('homeowner') || cleanName.includes('renter') || cleanName.includes('vehicle') || cleanName.includes('insurance')) {
      if (typeof services['Auto & Home Insurance'] === 'string') return services['Auto & Home Insurance'].trim();
    }
    if (cleanName.includes('roof') || cleanName.includes('plumb') || cleanName.includes('hvac') || cleanName.includes('window') || cleanName.includes('bath') || cleanName.includes('kitchen') || cleanName.includes('home') || cleanName.includes('remodel') || cleanName.includes('solar')) {
      if (typeof services['Home Improvement'] === 'string') return services['Home Improvement'].trim();
    }
    if (cleanName.includes('debt') || cleanName.includes('settlement') || cleanName.includes('consolidation') || cleanName.includes('credit') || cleanName.includes('bankruptcy')) {
      if (typeof services['Debt Relief'] === 'string') return services['Debt Relief'].trim();
    }
    if (cleanName.includes('legal') || cleanName.includes('lawyer') || cleanName.includes('attorney') || cleanName.includes('accident') || cleanName.includes('injury') || cleanName.includes('malpractice')) {
      if (typeof services['Legal Help'] === 'string') return services['Legal Help'].trim();
    }
  }

  // 4. Category / Vertical ID fallback
  const cleanCategory = (category || '').trim().toLowerCase();
  if (cleanCategory) {
    const categoryToKey = {
      'health': 'Health Insurance',
      'medicare': 'Medicare',
      'insurance': 'Auto & Home Insurance',
      'home-services': 'Home Improvement',
      'home': 'Home Improvement',
      'finance': 'Debt Relief',
      'debt': 'Debt Relief',
      'legal': 'Legal Help',
      'travel': 'Flight Booking',
      'flight': 'Flight Booking'
    };
    const mappedKey = categoryToKey[cleanCategory];
    if (mappedKey && typeof services[mappedKey] === 'string') {
      return services[mappedKey].trim();
    }
  }

  // 5. If services dictionary is not present at all, fall back to global phone_number
  if (!config.services || Object.keys(config.services).length === 0) {
    return (config.phone_number || '').trim();
  }

  // If service was mapped to services dictionary and is empty/missing, return empty string
  return '';
}
