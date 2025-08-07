import { UAParser } from 'ua-parser-js'
import { IP2Location } from 'ip2location-nodejs'
import { existsSync } from 'fs'
import { createWriteStream, writeFile } from 'fs/promises'
import { Open } from 'unzipper'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const userAgent = getHeader(event, 'user-agent')
  const clientIP = getRequestIP(event, { xForwardedFor: true })
  const agent = UAParser(userAgent)
  const location = await getIPLocation(clientIP)

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
    country: location.country || undefined,
    region: location.region || undefined,
    city: location.city || undefined,
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

async function getIPLocation (ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return {}

  const ip2location = new IP2Location()
  const dbPath = './IP2LOCATION.BIN'

  if (!existsSync(dbPath)) {
    console.log('IP2Location database not found, downloading...')

    const downloaded = await downloadIP2LocationDB(dbPath)

    if (!downloaded) return {}
  }

  await ip2location.openAsync(dbPath)

  const { countryLong, region, city } = ip2location.getAll(ip)

  return {
    country: countryLong,
    region: region,
    city: city
  }
}

async function downloadIP2LocationDB (dbPath) {
  const { ip2locationToken } = useRuntimeConfig()
  const downloadUrl = `https://www.ip2location.com/download/?token=${ip2locationToken}&file=DB3LITEBINIPV6`
  const zipPath = `${dbPath}.zip`

  try {
    const response = await fetch(downloadUrl)

    if (!response.ok) {
      console.error(`Failed to download IP2Location database: ${response.status} ${response.statusText}`)

      return false
    }

    // Save ZIP file to disk first
    const buffer = await response.arrayBuffer()
    const zipBuffer = Buffer.from(buffer)
    await writeFile(zipPath, zipBuffer)
    console.log(`Downloaded ZIP file (${zipBuffer.length} bytes) saved to ${zipPath}`)

    // Extract from the saved ZIP file
    const zipDirectory = await Open.file(zipPath)

    // Find the BIN file in the ZIP archive
    const dataFile = zipDirectory.files.find((file) => file.path.toLowerCase().endsWith('.bin'))

    if (!dataFile) {
      console.error('No .BIN file found in the ZIP archive')
      console.log('Available files:', zipDirectory.files.map((f) => f.path))

      return false
    }

    console.log(`Found database file: ${dataFile.path}`)

    await new Promise((resolve, reject) => {
      dataFile
        .stream()
        .pipe(createWriteStream(dbPath))
        .on('error', reject)
        .on('finish', resolve)
    })

    console.log(`IP2Location database saved to ${dbPath}`)

    return true
  }
  catch (error) {
    console.error('Failed to download IP2Location database:', error)

    return false
  }
}
