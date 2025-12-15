import { UAParser } from 'ua-parser-js'
import { IP2Location } from 'ip2location-nodejs'
import { existsSync, createWriteStream } from 'fs'
import { writeFile } from 'fs/promises'
import { Open } from 'unzipper'

let ip2location

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const userAgent = getHeader(event, 'user-agent')
  const clientIP = body.ip || getRequestIP(event, { xForwardedFor: true })
  const agent = UAParser(userAgent)
  const location = await getIPLocation(clientIP)

  if (!body.site) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required field: site'
    })
  }

  const document = {
    date: new Date(),
    site: body.site,
    domain: body.domain,
    path: body.path,
    query: body.query,
    title: body.title,
    referrer: body.referrer,
    ip: clientIP,
    country: location.country,
    region: location.region,
    city: location.city,
    ua: userAgent,
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
    event: body.event
  }

  // Remove empty values (null, undefined, empty string, empty object)
  const cleanDocument = Object.fromEntries(
    Object.entries(document).filter(([_, value]) => {
      if (value === null || value === undefined || value === '') return false
      if (typeof value === 'object' && Object.keys(value).length === 0) return false
      return true
    })
  )

  await insertDocument(cleanDocument)

  return { success: true }
})

async function getIPLocation (ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return {}

  const dbPath = './IP2LOCATION.BIN'

  if (!existsSync(dbPath)) {
    const downloaded = await downloadIP2LocationDB(dbPath)
    if (!downloaded) return {}
  }

  try {
    if (!ip2location) {
      ip2location = new IP2Location()
      await ip2location.openAsync(dbPath)
    }

    const { countryLong, region, city } = ip2location.getAll(ip)

    return {
      country: countryLong,
      region: region,
      city: city
    }
  }
  catch (error) {
    console.error('Failed to get IP location:', error.message)

    return {}
  }
}

async function downloadIP2LocationDB (dbPath) {
  const { ip2locationToken } = useRuntimeConfig()

  const downloadUrl = `https://www.ip2location.com/download/?token=${ip2locationToken}&file=DB3LITEBINIPV6`
  // const downloadUrl = `https://swpublisher.entu.eu/IP2LOCATION-LITE-DB3.IPV6.BIN.zip`
  const zipPath = `${dbPath}.zip`

  try {
    const response = await fetch(downloadUrl)
    if (!response.ok) {
      console.error(`Failed to download IP2Location database: ${response.status}`)
      return false
    }

    const buffer = await response.arrayBuffer()
    const zipBuffer = Buffer.from(buffer)

    await writeFile(zipPath, zipBuffer)

    const zipDirectory = await Open.file(zipPath)
    const dataFile = zipDirectory.files.find((file) => file.path.toLowerCase().endsWith('.bin'))

    if (!dataFile) {
      console.error('No .BIN file found in ZIP archive')

      return false
    }

    await new Promise((resolve, reject) => {
      const writeStream = createWriteStream(dbPath)
      dataFile
        .stream()
        .pipe(writeStream)
        .on('error', reject)
        .on('finish', resolve)
    })

    console.log('IP2Location database downloaded and extracted successfully')

    return true
  }
  catch (error) {
    console.error('Failed to download IP2Location database:', error.message)
    return false
  }
}
