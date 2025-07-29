import { Client } from '@opensearch-project/opensearch'

let dbConnection

export async function connectOpenSearchDb () {
  if (!dbConnection) {
    const { opensearchHostname, opensearchPort, opensearchUsername, opensearchPassword } = useRuntimeConfig()
    dbConnection = new Client({
      node: `https://${opensearchHostname}:${opensearchPort}`,
      auth: {
        username: opensearchUsername,
        password: opensearchPassword
      }
    })
  }

  return dbConnection
}

export async function indexOpenSearchDb (body) {
  const client = await connectOpenSearchDb()
  const response = await client.index({
    index: getIndexName(body.site, body['@timestamp']),
    body
  })

  return response
}

function getIndexName (site, timestamp) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `analytics-${site.replaceAll('.', '-').toLowerCase()}-${year}-${month}`
}
