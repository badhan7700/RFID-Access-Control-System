const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { MongoClient } = require('mongodb');
const path = require('path');
const balanceManager = require('./balanceManager');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rfid_db';
const COM_PORT = process.env.COM_PORT || 'COM7';

// Middleware
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
      const uid = data.substring(4).trim();
      
      // Check balance and deduct toll
      const tollResult = await balanceManager.deductToll(uid);
      const access = tollResult.success ? "granted" : "denied";
      
      latestUID = {
        uid: "UID:" + uid,
        timestamp: new Date(),
        access: access,
        balance: tollResult.balance,
        message: tollResult.message
      };
      
      console.log('Processed UID:', latestUID);

      // Send response back to Arduino
      if (access === "granted") {
        port.write("ACCESS_GRANTED\n");
      } else {
        port.write("ACCESS_DENIED\n");
      }

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

// Balance API Endpoints
app.get('/api/balances', async (req, res) => {
  try {
    const balances = balanceManager.getAllBalances();
    res.json(balances);
  } catch (error) {
    console.error('Error fetching balances:', error);
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

app.get('/api/balance/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    const balance = balanceManager.getBalance(uid);
    res.json({ uid, balance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

app.post('/api/balance/add', async (req, res) => {
  try {
    const { uid, amount } = req.body;
    
    if (!uid || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid UID or amount' });
    }
    
    const newBalance = await balanceManager.addBalance(uid, Number(amount));
    res.json({ uid, balance: newBalance, message: 'Balance added successfully' });
  } catch (error) {
    console.error('Error adding balance:', error);
    res.status(500).json({ error: 'Failed to add balance' });
  }
});

app.get('/api/toll', (req, res) => {
  res.json({ amount: balanceManager.getTollAmount() });
});

// Initialize the app
async function init() {
  try {
    await balanceManager.init();
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
