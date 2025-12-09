import { MongoClient } from 'mongodb'

const { mongodbUri } = useRuntimeConfig()
let dbConnection

export async function connectMongoDb () {
  if (!dbConnection) {
    const client = new MongoClient(mongodbUri)
    await client.connect()
    dbConnection = client.db()
  }

  return dbConnection
}

export async function insertDocument (body) {
  const db = await connectMongoDb()
  const collectionName = getCollectionName(body.site, body['@timestamp'])
  const collection = db.collection(collectionName)
  const response = await collection.insertOne(body)

  return response
}

function getCollectionName (site, timestamp) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `analytics-${site.replaceAll('.', '-').toLowerCase()}-${year}-${month}`
}
