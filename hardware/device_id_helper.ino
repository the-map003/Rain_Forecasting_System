// Add this code to your rain_forecasting.ino file to help with device ID management

// Function to manually set device ID via Serial Monitor
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

// Add this to your loop() function:
// void loop() {
//   handleSerialCommands();  // Add this line
//   
//   // ... rest of your existing loop code ...
// }
