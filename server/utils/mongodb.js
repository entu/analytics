import { MongoClient, ObjectId } from 'mongodb'

let dbConnection

export async function connectMongoDb () {
  const { mongodbUrl, mongodbDb } = useRuntimeConfig()

  if (!dbConnection) {
    const dbClient = new MongoClient(mongodbUrl)
    const dbClientConnection = await dbClient.connect()

    dbConnection = dbClientConnection.db(mongodbDb)
  }

  return dbConnection
}

export function objectId (id) {
  try {
    return new ObjectId(id)
  }
  catch (error) {
    throw new Error('Invalid ObjectId')
  }
}

export async function insertDocument (body) {
  const db = await connectMongoDb()
  const collectionName = getCollectionName(body.site)
  const collection = db.collection(collectionName)

  const response = await collection.insertOne(body)

  return response
}

function getCollectionName (site) {
  return site.replaceAll('.', '-').toLowerCase()
}
