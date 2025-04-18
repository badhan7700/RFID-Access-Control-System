const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rfid_db';

let client;
let dbInstance;

async function connectDB() {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    dbInstance = client.db();
    console.log('Connected to MongoDB successfully');
    return dbInstance;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function closeDB() {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
    dbInstance = null;
  }
}

module.exports = { connectDB, closeDB };
