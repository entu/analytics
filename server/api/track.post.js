import { UAParser } from 'ua-parser-js'
import { IP2Location } from 'ip2location-nodejs'
import { existsSync, createWriteStream } from 'fs'
import { writeFile, unlink } from 'fs/promises'
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

    // Check if the response is actually a ZIP file
    const zipMagicBytes = zipBuffer.slice(0, 4)
    const isZipFile = zipMagicBytes[0] === 0x50 && zipMagicBytes[1] === 0x4B
      && (zipMagicBytes[2] === 0x03 || zipMagicBytes[2] === 0x05 || zipMagicBytes[2] === 0x07)

    if (!isZipFile) {
      console.error('Downloaded file is not a valid ZIP file')
      console.log('First 100 bytes as string:', zipBuffer.slice(0, 100).toString('utf8'))
      return false
    }

    await writeFile(zipPath, zipBuffer)
    console.log(`Downloaded ZIP file (${zipBuffer.length} bytes) saved to ${zipPath}`)

    // Extract from the saved ZIP file
    let zipDirectory
    try {
      zipDirectory = await Open.file(zipPath)
    }
    catch (zipError) {
      console.error('Failed to open ZIP file:', zipError)
      // Clean up the corrupted ZIP file
      try {
        await unlink(zipPath)
      }
      catch (unlinkError) {
        console.error('Failed to clean up ZIP file:', unlinkError)
      }
      return false
    }

    // Find the BIN file in the ZIP archive
    const dataFile = zipDirectory.files.find((file) => file.path.toLowerCase().endsWith('.bin'))

    if (!dataFile) {
      console.error('No .BIN file found in the ZIP archive')
      console.log('Available files:', zipDirectory.files.map((f) => f.path))
      // Clean up the ZIP file
      try {
        await unlink(zipPath)
      }
      catch (unlinkError) {
        console.error('Failed to clean up ZIP file:', unlinkError)
      }
      return false
    }

    console.log(`Found database file: ${dataFile.path}`)

    try {
      await new Promise((resolve, reject) => {
        const writeStream = createWriteStream(dbPath)
        dataFile
          .stream()
          .pipe(writeStream)
          .on('error', reject)
          .on('finish', resolve)
      })

      console.log(`IP2Location database saved to ${dbPath}`)

      // Clean up the ZIP file after successful extraction
      try {
        await unlink(zipPath)
        console.log('ZIP file cleaned up')
      }
      catch (unlinkError) {
        console.error('Failed to clean up ZIP file:', unlinkError)
      }

      return true
    }
    catch (extractError) {
      console.error('Failed to extract database file:', extractError)
      // Clean up partial files
      try {
        await unlink(zipPath)
      }
      catch (unlinkError) {
        console.error('Failed to clean up ZIP file:', unlinkError)
      }
      return false
    }
  }
  catch (error) {
    console.error('Failed to download IP2Location database:', error)

    return false
  }
}
