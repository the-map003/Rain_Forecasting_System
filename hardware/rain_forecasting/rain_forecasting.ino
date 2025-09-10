#include <Wire.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

// Create BME280 object
Adafruit_BME280 bme;

// Pin definitions
#define RAIN_ANALOG_PIN 34   // Rain sensor analog pin
#define BUZZER_PIN 26        // Buzzer pin
#define LED_PIN 23           // System status LED pin

// Thresholds
#define RAIN_THRESHOLD 2000   // Adjust based on your sensor calibration
#define HUMIDITY_THRESHOLD 70.0
#define PRESSURE_THRESHOLD 845.0  // hPa
#define TEMP_BASELINE 28.0
#define TEMP_DROP_THRESHOLD 5.0    // Temperature drop indicator

// WiFi credentials
const char* ssid = "GIHANGA DYNAMICS";
const char* password = "gihanga@2025";

// MQTT broker
const char* mqtt_server = "test.mosquitto.org";
WiFiClient espClient;
PubSubClient client(espClient);

// Function to connect to WiFi
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected ✅");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// Function to reconnect to MQTT
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println("connected ✅");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 3 seconds...");
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  // Initialize BME280
  if (!bme.begin(0x76)) {
    Serial.println("Could not find BME280 sensor!");
    while (1);
  }

  pinMode(RAIN_ANALOG_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  // 🔹 Turn system LED ON (system active)
  digitalWrite(LED_PIN, HIGH);

  setup_wifi();
  client.setServer(mqtt_server, 1883);

  Serial.println("Rain Forecasting System Started...");
  Serial.println("=================================");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Read rain sensor
  int rainValue = analogRead(RAIN_ANALOG_PIN);

  // Read BME280 values
  float temperature = bme.readTemperature();
  float humidity = bme.readHumidity();
  float pressure = bme.readPressure() / 100.0F;

  // Print sensor values locally
  Serial.print("Temp: "); Serial.print(temperature); Serial.print(" °C, ");
  Serial.print("Humidity: "); Serial.print(humidity); Serial.print(" %, ");
  Serial.print("Pressure: "); Serial.print(pressure); Serial.println(" hPa");
  Serial.print("Rain Sensor Value: "); Serial.println(rainValue);

  // Forecasting logic
  bool rainDetected = false;
  bool forecastRain = false;

  if (rainValue < RAIN_THRESHOLD) {
      Serial.println("🌧️ Rain Detected: It is raining!");
      rainDetected = true;
  } else {
      Serial.println("☀️ No rain detected");
      rainDetected = false;
  }
  
  if ((humidity > HUMIDITY_THRESHOLD && pressure < PRESSURE_THRESHOLD) || 
      (temperature < (TEMP_BASELINE - TEMP_DROP_THRESHOLD))) {
      Serial.println("☁️ Forecast: High chance of rain!");
      forecastRain = true;
  }

  // Buzzer alert
  if (rainDetected || forecastRain) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(500);
    digitalWrite(BUZZER_PIN, LOW);
    delay(500);
  } else {
    digitalWrite(BUZZER_PIN, LOW);
    delay(2000);
  }

  // Publish data to MQTT broker
  String payload = "{";
  payload += "\"temperature\": " + String(temperature) + ",";
  payload += "\"humidity\": " + String(humidity) + ",";
  payload += "\"pressure\": " + String(pressure) + ",";
  payload += "\"rain_value\": " + String(rainValue) + ",";
  payload += "\"rain_detected\": " + String(rainDetected ? "true" : "false") + ",";
  payload += "\"forecast_rain\": " + String(forecastRain ? "true" : "false");
  payload += "}";

  client.publish("rain_forecasting/data", payload.c_str());

  Serial.println("Published to MQTT: " + payload);
  Serial.println("---------------------------------");

  delay(2000);
}
