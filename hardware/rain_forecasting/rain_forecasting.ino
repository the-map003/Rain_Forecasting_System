#include <Wire.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <EEPROM.h>

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

// Buzzer timing constants
#define BUZZER_ACTIVE_TIME 15000    // 15 seconds in milliseconds
#define BUZZER_SILENT_TIME 60000    // 1 minute in milliseconds

// Buzzer state variables
unsigned long buzzerStartTime = 0;
bool buzzerActive = false;
bool buzzerInSilentPeriod = false;
bool lastRainCondition = false;

// WiFi credentials
const char* ssid = "GIHANGA DYNAMICS";
const char* password = "gihanga@2025";

// MQTT broker - same as defined in frontend MQTT_CONFIG
const char* mqtt_server = "test.mosquitto.org";
WiFiClient espClient;
PubSubClient client(espClient);

// Device ID - This will be stored in EEPROM
String deviceId = "";

// EEPROM configuration
#define EEPROM_SIZE 512
#define DEVICE_ID_ADDR 0
#define DEVICE_ID_LENGTH 16 // 8 bytes in hex = 16 characters

// Function to handle serial commands for device ID management
void handleSerialCommands() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    // Command to set device ID: SET_ID:025dfe862f858c4d
    if (command.startsWith("SET_ID:")) {
      String newId = command.substring(7);
      if (newId.length() > 0 && newId.length() <= DEVICE_ID_LENGTH) {
        saveDeviceIdToEEPROM(newId);
        Serial.println("✅ Device ID updated successfully!");
        Serial.println("New Device ID: " + newId);
        Serial.println("Restarting device to apply changes...");
        delay(1000);
        ESP.restart();
      } else {
        Serial.println("❌ Invalid device ID length. Must be 1-16 characters.");
      }
    }
    // Command to view current device ID
    else if (command == "GET_ID") {
      Serial.println("Current Device ID: " + deviceId);
    }
    // Command to clear device ID (reset to placeholder)
    else if (command == "CLEAR_ID") {
      for (int i = 0; i < DEVICE_ID_LENGTH; i++) {
        EEPROM.write(DEVICE_ID_ADDR + i, 0);
      }
      EEPROM.commit();
      Serial.println("Device ID cleared. Restarting...");
      delay(1000);
      ESP.restart();
    }
    // Command to show help
    else if (command == "HELP") {
      Serial.println("=== Device ID Management Commands ===");
      Serial.println("SET_ID:xxxxx  - Set device ID (e.g., SET_ID:025dfe862f858c4d)");
      Serial.println("GET_ID        - Show current device ID");
      Serial.println("CLEAR_ID      - Clear device ID (reset to placeholder)");
      Serial.println("HELP          - Show this help message");
      Serial.println("=====================================");
    }
  }
}

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

// MQTT message callback function
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);
  
  // Convert payload to string
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("Message: ");
  Serial.println(message);
  
  // Check if this is a device ID configuration message
  // Using the same topic structure as defined in frontend MQTT_CONFIG.getDeviceConfigTopic
  String configTopic = "rain_forecasting/" + deviceId + "/config";
  if (String(topic) == configTopic) {
    // Parse JSON message to extract device ID
    // This is a simple implementation - in production, use a JSON library
    if (message.indexOf("device_id") > 0) {
      int startPos = message.indexOf(":") + 2; // Skip ': "'
      int endPos = message.indexOf("\"", startPos);
      if (startPos > 0 && endPos > startPos) {
        String newDeviceId = message.substring(startPos, endPos);
        saveDeviceIdToEEPROM(newDeviceId);
      }
    }
  }
}

// Function to reconnect to MQTT
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32Client-";
    clientId += deviceId; // Use device ID as part of client ID
    if (client.connect(clientId.c_str())) {
      Serial.println("connected ✅");
      
      // Subscribe to device configuration topic
      // Using the same topic structure as defined in frontend MQTT_CONFIG.getDeviceConfigTopic
      String configTopic = "rain_forecasting/" + deviceId + "/config";
      client.subscribe(configTopic.c_str());
      Serial.print("Subscribed to: ");
      Serial.println(configTopic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 1 seconds...");
      delay(1000);
    }
  }
}

// Function to read device ID from EEPROM
void readDeviceIdFromEEPROM() {
  deviceId = "";
  for (int i = 0; i < DEVICE_ID_LENGTH; i++) {
    char c = EEPROM.read(DEVICE_ID_ADDR + i);
    if (c == 0 || c == 255) break; // End of string or uninitialized EEPROM
    deviceId += c;
  }
  
  // If no device ID is stored, use a default placeholder
  if (deviceId.length() == 0 || deviceId == String('\xFF', DEVICE_ID_LENGTH)) {
    deviceId = "DEVICE_ID_PLACEHOLDER";
    Serial.println("No device ID found in EEPROM, using placeholder");
  } else {
    Serial.print("Device ID loaded from EEPROM: ");
    Serial.println(deviceId);
  }
}

// Function to save device ID to EEPROM
void saveDeviceIdToEEPROM(String id) {
  // Only save if different from current
  if (id != deviceId) {
    Serial.print("Saving new device ID to EEPROM: ");
    Serial.println(id);
    
    for (int i = 0; i < DEVICE_ID_LENGTH; i++) {
      if (i < id.length()) {
        EEPROM.write(DEVICE_ID_ADDR + i, id[i]);
      } else {
        EEPROM.write(DEVICE_ID_ADDR + i, 0); // Null terminator
      }
    }
    EEPROM.commit();
    deviceId = id;
  }
}

// Function to handle buzzer timing logic
void handleBuzzer(bool rainCondition) {
  unsigned long currentTime = millis();
  
  // If rain condition changes from false to true, reset timing
  if (rainCondition && !lastRainCondition) {
    buzzerStartTime = currentTime;
    buzzerActive = true;
    buzzerInSilentPeriod = false;
    digitalWrite(BUZZER_PIN, HIGH);
    Serial.println("🚨 Buzzer activated - Rain condition detected!");
  }
  
  // If no rain condition, turn off buzzer and reset states
  if (!rainCondition) {
    digitalWrite(BUZZER_PIN, LOW);
    buzzerActive = false;
    buzzerInSilentPeriod = false;
    if (lastRainCondition) {
      Serial.println("🔇 Buzzer deactivated - No rain condition");
    }
  }
  
  // Handle timing for active rain condition
  if (rainCondition) {
    unsigned long elapsedTime = currentTime - buzzerStartTime;
    
    if (buzzerActive && elapsedTime >= BUZZER_ACTIVE_TIME) {
      // Switch to silent period
      digitalWrite(BUZZER_PIN, LOW);
      buzzerActive = false;
      buzzerInSilentPeriod = true;
      buzzerStartTime = currentTime; // Reset timer for silent period
      Serial.println("🔇 Buzzer entering silent period (1 minute)");
    }
    else if (buzzerInSilentPeriod && elapsedTime >= BUZZER_SILENT_TIME) {
      // Switch back to active period
      digitalWrite(BUZZER_PIN, HIGH);
      buzzerActive = true;
      buzzerInSilentPeriod = false;
      buzzerStartTime = currentTime; // Reset timer for active period
      Serial.println("🚨 Buzzer reactivated after silent period");
    }
  }
  
  lastRainCondition = rainCondition;
}

void setup() {
  Serial.begin(115200);

  // Initialize EEPROM
  EEPROM.begin(EEPROM_SIZE);
  readDeviceIdFromEEPROM();

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
  
  // Subscribe to a configuration topic to receive device ID updates
  client.setCallback(callback);

  Serial.println("Rain Forecasting System Started...");
  Serial.println("Device ID: " + deviceId);
  Serial.println("=================================");
}

void loop() {
  handleSerialCommands();
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

  // Handle buzzer with new timing logic
  bool rainCondition = rainDetected || forecastRain;
  handleBuzzer(rainCondition);

  // Publish data to MQTT broker
  // Create JSON payload with device data
  String payload = "{";
  payload += "\"device_id\": \"" + deviceId + "\",";
  payload += "\"temperature\": " + String(temperature) + ",";
  payload += "\"humidity\": " + String(humidity) + ",";
  payload += "\"pressure\": " + String(pressure) + ",";
  payload += "\"rain_value\": " + String(rainValue) + ",";
  payload += "\"rain_detected\": " + String(rainDetected ? "true" : "false") + ",";
  payload += "\"forecast_rain\": " + String(forecastRain ? "true" : "false");
  payload += "}";

  // Include device ID in the MQTT topic
  // Using the same topic structure as defined in frontend MQTT_CONFIG.getDeviceTopic
  String topic = "rain_forecasting/" + deviceId + "/data";
  client.publish(topic.c_str(), payload.c_str());

  Serial.println("Published to MQTT topic: " + topic);
  Serial.println("Payload: " + payload);
  Serial.println("---------------------------------");

  delay(2000);
}