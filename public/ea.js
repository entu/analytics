(function () {
  'use strict'

  function getScriptConfig () {
    const scripts = document.querySelectorAll('script[src*="ea.js"]')
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

  const { site, endpoint } = getScriptConfig()

  const shouldTrack = site
    && endpoint
    && !location.hostname.includes('localhost')
    && !location.hostname.includes('127.0.0.1')
    && location.hostname !== ''

  function getSessionId () {
    let sessionId = sessionStorage.getItem('ea_session')

    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()
      sessionStorage.setItem('ea_session', sessionId)
    }

    return sessionId
  }

  function getUserId () {
    let userId = localStorage.getItem('ea_user')

    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()
      localStorage.setItem('ea_user', userId)
    }

    return userId
  }

  function track (eventType = 'pageview', eventData = {}) {
    if (!shouldTrack) return

    const payload = {
      site: site,
      domain: location.hostname,
      path: location.pathname,
      query: location.search,
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
