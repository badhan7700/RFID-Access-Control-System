# Simple RFID Web Dashboard

A full-stack web application that integrates with an Arduino Uno + MFRC522 RFID module to display and log RFID scan events.

## Features

- Real-time display of the latest RFID UID scanned
- Logging of all scanned UIDs with timestamps
- Access status indication ("Granted" or "Denied")
- MongoDB database for persistent storage
- Clean, minimal web interface

## Requirements

### Hardware
- Arduino Uno
- MFRC522 RFID module
- RFID cards/tags

### Software
- Node.js and npm
- MongoDB
- Arduino IDE

## Setup Instructions

### 1. Arduino Setup
1. Connect the MFRC522 RFID module to the Arduino Uno:
   - SDA(SS) -> Pin 10
   - SCK -> Pin 13
   - MOSI -> Pin 11
   - MISO -> Pin 12
   - GND -> GND
   - RST -> Pin 9
   - 3.3V -> 3.3V

2. Install the MFRC522 library in the Arduino IDE:
   - In Arduino IDE, go to Sketch > Include Library > Manage Libraries
   - Search for "MFRC522" and install the library by GithubCommunity

3. Upload the `arduino_rfid_reader.ino` sketch to your Arduino Uno

### 2. Backend Setup
1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/rfid_db
   COM_PORT=COM7
   ```
   (Adjust COM_PORT to match your Arduino's serial port)

4. Start MongoDB service on your machine

5. Run the application:
   ```
   npm start
   ```

### 3. Access the Web Interface
Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure
```
rfid-simple-web/
│
├── server.js                # Node.js backend
├── package.json
│
├── public/                  # Static frontend
│   ├── index.html           # Simple dashboard
│   ├── style.css
│   └── script.js
│
├── db/
│   └── connect.js           # MongoDB connection helper
│
├── arduino_rfid_reader.ino  # Arduino code
├── .env                     # Environment variables
└── README.md
```

## Customizing Access Control
You can customize the access control logic in `server.js`. Currently, it uses a simple check against a hardcoded UID. For a more robust solution, you could:

1. Create an allowed UIDs collection in MongoDB
2. Implement user management features
3. Add authentication to the web interface

## Troubleshooting
- **Serial port not found**: Make sure you've specified the correct COM port in the `.env` file
- **MongoDB connection issues**: Ensure MongoDB is running and accessible
- **RFID read issues**: Check the wiring connections between Arduino and the RFID module

## License
MIT
