function parseUserAgent (userAgent) {
  const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/?([\d.]+)?/)
  let osMatch
  let deviceType = 'Desktop'

  // OS detection
  if (userAgent.includes('Windows NT')) {
    osMatch = ['', 'Windows', userAgent.match(/Windows NT (\d+\.\d+)/)?.[1]]
  }
  else if (userAgent.includes('Mac OS X')) {
    osMatch = ['', 'macOS', userAgent.match(/Mac OS X (\d+_\d+)/)?.[1]?.replace('_', '.')]
  }
  else if (userAgent.includes('Linux')) {
    osMatch = ['', 'Linux', '']
  }
  else if (userAgent.includes('Android')) {
    osMatch = ['', 'Android', userAgent.match(/Android (\d+\.\d+)/)?.[1]]
    deviceType = 'Mobile'
  }
  else if (userAgent.includes('iOS')) {
    osMatch = ['', 'iOS', userAgent.match(/OS (\d+_\d+)/)?.[1]?.replace('_', '.')]
    deviceType = 'Mobile'
  }

  // Device type detection
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    deviceType = 'Mobile'
  }
  else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    deviceType = 'Tablet'
  }

  return {
    browser: browserMatch?.[1] || 'Unknown',
    browserVersion: browserMatch?.[2] || 'Unknown',
    os: osMatch?.[1] || 'Unknown',
    osVersion: osMatch?.[2] || 'Unknown',
    deviceType
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const userAgent = getHeader(event, 'user-agent')
  const clientIP = getRequestIP(event, { xForwardedFor: true })
  const agent = parseUserAgent(userAgent)

  if (!body.site) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required field: site'
    })
  }

  await indexOpenSearchDb({
    '@timestamp': new Date().toISOString(),
    site: body.site,
    domain: body.domain,
    path: body.path,
    query: body.query,
    title: body.title,
    referrer: body.referrer,
    browser: {
      name: agent.browser,
      version: agent.browserVersion,
      agent: userAgent
    },
    os: {
      name: agent.os,
      version: agent.osVersion,
      mobile: agent.deviceType === 'Mobile'
    },
    ip: clientIP,
    screen: body.screen,
    viewport: body.viewport,
    language: body.language,
    session: body.session,
    user: body.user,
    event: body.event || {}
  })

  return { success: true }
})
