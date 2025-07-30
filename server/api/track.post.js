import { UAParser } from 'ua-parser-js'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const userAgent = getHeader(event, 'user-agent')
  const clientIP = getRequestIP(event, { xForwardedFor: true })
  const agent = UAParser(userAgent)

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
    ip: clientIP,
    ua: agent.ua,
    device: agent.device,
    cpu: agent.cpu,
    os: agent.os,
    browser: agent.browser,
    engine: agent.engine,
    screen: body.screen,
    viewport: body.viewport,
    language: body.language,
    user: body.user,
    session: body.session,
    event: body.event || {}
  })

  return { success: true }
})
