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
    domain: body.domain || undefined,
    path: body.path || undefined,
    query: body.query || undefined,
    title: body.title || undefined,
    referrer: body.referrer || undefined,
    ip: clientIP || undefined,
    ua: agent.ua || undefined,
    device: agent.device || undefined,
    cpu: agent.cpu || undefined,
    os: agent.os || undefined,
    browser: agent.browser || undefined,
    engine: agent.engine || undefined,
    screen: body.screen || undefined,
    viewport: body.viewport || undefined,
    language: body.language || undefined,
    user: body.user || undefined,
    session: body.session || undefined,
    event: body.event || undefined
  })

  return { success: true }
})
