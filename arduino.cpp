#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Servo.h>

#define SS_PIN 10
#define RST_PIN 9
#define BUZZER 2

MFRC522 mfrc522(SS_PIN, RST_PIN);
Servo myServo;
LiquidCrystal_I2C lcd(0x27, 16, 2);  // Adjust if your LCD has a different I2C address

String incomingData = "";
bool dataReady = false;

void setup() {
  Serial.begin(9600);
  SPI.begin();
  mfrc522.PCD_Init();
  myServo.attach(6);
  myServo.write(0);
  pinMode(BUZZER, OUTPUT);
  noTone(BUZZER);

  lcd.init();
  lcd.clear();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("  Toll System   ");
  lcd.setCursor(0, 1);
  lcd.print("Ready for cards ");

  Serial.println("System Ready. Waiting for card...");
}

void loop() {
  // Read serial data from Node.js
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n') {
      dataReady = true;
    } else {
      incomingData += c;
    }
  }

  // Process incoming command from Node.js
  if (dataReady) {
    if (incomingData == "ACCESS_GRANTED") {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Access Granted");
      lcd.setCursor(0, 1);
      lcd.print("Gate Opening...");
      
      // Sound success tone
      tone(BUZZER, 500);
      delay(300);
      noTone(BUZZER);
      
      // Open gate
      myServo.write(90);
      delay(5000);
      myServo.write(0);
      
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("  Toll System   ");
      lcd.setCursor(0, 1);
      lcd.print("Ready for cards ");
    } 
    else if (incomingData == "ACCESS_DENIED") {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Access Denied");
      lcd.setCursor(0, 1);
      lcd.print("Insuff. Balance");
      
      // Sound error tone
      tone(BUZZER, 300);
      delay(1000);
      noTone(BUZZER);
      
      delay(3000);
      
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("  Toll System   ");
      lcd.setCursor(0, 1);
      lcd.print("Ready for cards ");
    }
    
    incomingData = "";
    dataReady = false;
  }

  // Check for new card
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Card Detected");
  lcd.setCursor(0, 1);
  lcd.print("Processing...");

  String content = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    content.concat(String(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " "));
    content.concat(String(mfrc522.uid.uidByte[i], HEX));
  }
  content.toUpperCase();

  // Send UID to Node.js backend
  Serial.print("UID:");
  Serial.println(content.substring(1));
  
  delay(1000);  // Wait for server response
}
