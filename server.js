const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rfid_db';
const COM_PORT = process.env.COM_PORT || 'COM7';


// Middleware
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Serial Port Setup
let latestUID = { uid: "None", timestamp: new Date(), access: "N/A" };
let serialConnected = false;

const port = new SerialPort({ 
  path: COM_PORT, 
  baudRate: 9600 
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

port.on('open', () => {
  console.log(`Serial port ${COM_PORT} opened successfully`);
  serialConnected = true;
});

port.on('error', (err) => {
  console.error('Serial port error:', err.message);
  serialConnected = false;
});

// Process incoming RFID data
parser.on('data', async (data) => {
  console.log('Received data:', data);
  
  try {
    // Expected format: "UID: XX XX XX XX"
    if (data.includes("UID:")) {
      const uid = data.trim();
      // Determine access (simple logic - you can enhance this)
      const access = uid.includes("C0 5F 6E 1D") ? "granted" : "denied";
      
      latestUID = {
        uid: uid,
        timestamp: new Date(),
        access: access
      };
      console.log('Processed UID:', latestUID);


      // Store in database
      await storeUIDLog(latestUID);
    }
  } catch (error) {
    console.error('Error processing RFID data:', error);
  }
});

// Database Connection
let db;

async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB successfully');
    db = client.db();
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function storeUIDLog(uidData) {
  try {
    if (!db) await connectToDatabase();
    await db.collection('rfid_logs').insertOne(uidData);
    console.log('UID saved to database:', uidData);
  } catch (error) {
    console.error('Error saving to database:', error);
  }
}

// API Endpoints
app.get('/api/uid', (req, res) => {
  res.json({
    latestUID,
    serialConnected
  });
});

app.get('/api/logs', async (req, res) => {
  try {
    if (!db) await connectToDatabase();
    const logs = await db.collection('rfid_logs')
                        .find({})
                        .sort({ timestamp: -1 })
                        .limit(50)
                        .toArray();
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Initialize the app
async function init() {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Initialization error:', error);
    process.exit(1);
  }
}

init();
