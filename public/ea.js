(function () {
  'use strict'

  function getScriptConfig () {
    const scripts = document.querySelectorAll('script[src$="/ea.js"], script[src$="/ea.min.js"]')
    const currentScript = scripts[scripts.length - 1]

    if (!currentScript) return {}

    const site = currentScript.getAttribute('data-site')

    if (!site) return {}

    const url = new URL(currentScript.src)

    return {
      site,
      endpoint: `${url.protocol}//${url.host}/api/track`
    }
  }

  function generateUniqueId () {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID()
      } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        return `${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`
      } else {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      }
    } catch (e) {
      return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    }
  }

  function getSessionId () {
    let sessionId = sessionStorage.getItem('ea_session')

    if (!sessionId) {
      sessionId = generateUniqueId()
      sessionStorage.setItem('ea_session', sessionId)
    }

    return sessionId
  }

  function getUserId () {
    let userId = localStorage.getItem('ea_user')

    if (!userId) {
      userId = generateUniqueId()
      localStorage.setItem('ea_user', userId)
    }

    return userId
  }

  function cleanupQuery (queryString) {
    if (!queryString) return ''
    
    const params = new URLSearchParams(queryString)
    const sensitiveParams = ['key', 'token', 'code', 'access_token', 'refresh_token', 'api_key', 'auth', 'password', 'secret']
    
    sensitiveParams.forEach(param => {
      params.delete(param)
    })
    
    return params.toString()
  }

  function track (eventType = 'pageview', eventData = {}) {
    if (!shouldTrack) return

    const payload = {
      site: site,
      domain: location.hostname,
      path: location.pathname,
      query: cleanupQuery(location.search),
      title: document.title,
      referrer: document.referrer,
      language: navigator.language,
      session: getSessionId(),
      user: getUserId(),
      screen: screen.width + 'x' + screen.height,
      viewport: window.innerWidth + 'x' + window.innerHeight,
      event: {
        ...eventData,
        type: eventType
      }
    }

    // Send data to analytics endpoint
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch((err) => {
      console.warn('Analytics tracking failed:', err)
    })
  }

  const { site, endpoint } = getScriptConfig()

  const shouldTrack = site
    && endpoint
    && !location.hostname.includes('localhost')
    && !location.hostname.includes('127.0.0.1')
    && location.hostname !== ''

  // Auto-track page views with delay to allow title updates
  setTimeout(() => {
    track()
  }, 100)

  // Track page views on navigation (for SPAs)
  let currentPath = location.pathname
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState

  history.pushState = function () {
    originalPushState.apply(history, arguments)

    setTimeout(() => {
      if (currentPath !== location.pathname) {
        currentPath = location.pathname
        track()
      }
    }, 100) // Small delay to allow title updates
  }

  history.replaceState = function () {
    originalReplaceState.apply(history, arguments)

    setTimeout(() => {
      if (currentPath !== location.pathname) {
        currentPath = location.pathname
        track()
      }
    }, 100) // Small delay to allow title updates
  }

  window.addEventListener('popstate', () => {
    setTimeout(() => {
      if (currentPath !== location.pathname) {
        currentPath = location.pathname
        track()
      }
    }, 100) // Small delay to allow title updates
  })

  // Expose tracking function globally
  window.analytics = {
    track: track
  }
})()
