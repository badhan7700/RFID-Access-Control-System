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
  lcd.print("  Put card on   ");
  lcd.setCursor(0, 1);
  lcd.print("     reader     ");

  Serial.println("System Ready. Waiting for card...");
}

void loop() {
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("UID tag:");

  String content = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    lcd.print(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ");
    lcd.print(mfrc522.uid.uidByte[i], HEX);
    content.concat(String(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " "));
    content.concat(String(mfrc522.uid.uidByte[i], HEX));
  }
  content.toUpperCase();

  // ✨ THIS is the line that your Node.js backend listens for:
  Serial.print("UID:");
  Serial.println(content);

  lcd.setCursor(0, 1);
  if (content.substring(1) == "C0 5F 6E 1D") {  // Replace with your actual UID
    lcd.print("Access Granted");
    tone(BUZZER, 500);
    delay(300);
    noTone(BUZZER);
    myServo.write(90);
    delay(5000);
    myServo.write(0);
  } else {
    lcd.print("Access Denied");
    tone(BUZZER, 300);
    delay(2000);
    noTone(BUZZER);
  }

  delay(2000);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("  Put card on   ");
  lcd.setCursor(0, 1);
  lcd.print("     reader     ");
}
