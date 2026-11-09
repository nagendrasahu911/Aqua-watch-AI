/*
 * =========================================================================
 * AquaWatch AI - ESP32 Smart Water Quality Telemetry Firmware
 * Target Microcontroller: ESP32-WROOM-32 / NodeMCU-32S
 * Sensors Supported:
 *   - Analog pH Sensor (pH-4502C / DFRobot SEN0161)
 *   - Analog TDS Meter (DFRobot SEN0244)
 *   - Analog Turbidity Sensor (TSW-30 / DFRobot SEN0189)
 *   - Digital Temperature Sensor (DS18B20 1-Wire)
 * =========================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// Fallback to default configs if config.h is not yet created from config.h.example
#if __has_include("config.h")
  #include "config.h"
#else
  #define WIFI_SSID              "YOUR_WIFI_SSID"
  #define WIFI_PASSWORD          "YOUR_WIFI_PASSWORD"
  #define SERVER_URL             "http://192.168.1.100:8000/iot/readings"
  #define REGISTER_URL           "http://192.168.1.100:8000/iot/devices/register"
  #define DEVICE_ID              "ESP32-NODE-01"
  #define DEVICE_NAME            "AquaWatch Field Node #1"
  #define LOCATION_NAME          "Main Storage Reservoir"
  #define API_KEY                "aquawatch-secret-key-2026"
  #define FIRMWARE_VER           "1.0.0"
  #define TELEMETRY_INTERVAL_MS   10000
  #define PIN_PH_SENSOR          34
  #define PIN_TDS_SENSOR         35
  #define PIN_TURBIDITY_SENSOR   32
  #define PIN_DS18B20_TEMP       4
  #define PIN_STATUS_LED         2
  #define ESP32_VREF             3.3f
  #define ADC_RESOLUTION         4095.0f
  #define PH_VOLTAGE_AT_7        2.50f
  #define PH_SLOPE               0.18f
  #define TDS_CALIBRATION_FACTOR 0.5f
  #define TURBIDITY_CLEAR_VOLTAGE 3.0f
#endif

// Dallas Temperature 1-Wire setup
OneWire oneWire(PIN_DS18B20_TEMP);
DallasTemperature tempSensor(&oneWire);

unsigned long lastTelemetryTime = 0;
bool isRegistered = false;

// Multi-sample smoothed ADC read (ESP32 ADC has non-linearity & noise)
float readAveragedVoltage(int pin, int samples = 20) {
  long sum = 0;
  for (int i = 0; i < samples; i++) {
    sum += analogRead(pin);
    delay(2);
  }
  float avgRaw = (float)sum / samples;
  // Convert 12-bit ADC value (0-4095) to Voltage (0-3.3V)
  return (avgRaw / ADC_RESOLUTION) * ESP32_VREF;
}

// Convert voltage to pH level
float calculatePH(float voltage) {
  // Typical electrode calibration: pH 7.0 = PH_VOLTAGE_AT_7 (typically 2.50V)
  // Higher acidity (< 7.0) yields higher voltage on standard op-amp modules
  float ph = 7.0f + ((PH_VOLTAGE_AT_7 - voltage) / PH_SLOPE);
  if (ph < 0.0f) ph = 0.0f;
  if (ph > 14.0f) ph = 14.0f;
  return ph;
}

// Convert voltage to TDS ppm with temperature compensation
float calculateTDS(float voltage, float tempC) {
  // Temperature compensation formula: fFinalResult(25^C) = fFinalResult(current)/(1.0 + 0.02*(fTP-25.0));
  float compensationCoefficient = 1.0f + 0.02f * (tempC - 25.0f);
  if (compensationCoefficient <= 0.0f) compensationCoefficient = 1.0f;
  float compensationVoltage = voltage / compensationCoefficient;

  // DFRobot polynomial curve
  float tdsValue = (133.42f * compensationVoltage * compensationVoltage * compensationVoltage
                  - 255.86f * compensationVoltage * compensationVoltage
                  + 857.39f * compensationVoltage) * TDS_CALIBRATION_FACTOR;

  if (tdsValue < 0.0f) tdsValue = 0.0f;
  return tdsValue;
}

// Convert voltage to Turbidity NTU
float calculateTurbidity(float voltage) {
  // If voltage exceeds clear threshold, turbidity is close to 0 NTU
  if (voltage >= TURBIDITY_CLEAR_VOLTAGE) {
    return 0.5f;
  }
  // Standard approximation curve: NTU = -1120.4*V^2 + 5742.3*V - 4352.9
  float ntu = -1120.4f * (voltage * voltage) + 5742.3f * voltage - 4352.9f;
  if (ntu < 0.0f) ntu = 0.0f;
  if (ntu > 500.0f) ntu = 500.0f;
  return ntu;
}

void registerWithBackend() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(REGISTER_URL);
  http.addHeader("Content-Type", "application/json");

  String payload = "{";
  payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"device_name\":\"" + String(DEVICE_NAME) + "\",";
  payload += "\"location_name\":\"" + String(LOCATION_NAME) + "\",";
  payload += "\"api_key\":\"" + String(API_KEY) + "\",";
  payload += "\"firmware_version\":\"" + String(FIRMWARE_VER) + "\"";
  payload += "}";

  Serial.println("[HTTP] Registering device with backend: " + String(REGISTER_URL));
  int httpCode = http.POST(payload);

  if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
    Serial.println("[HTTP] Device registration successful!");
    isRegistered = true;
  } else {
    Serial.printf("[HTTP] Device registration returned code: %d\n", httpCode);
  }
  http.end();
}

void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Lost connection, attempting reconnect...");
    WiFi.reconnect();
    return;
  }

  // 1. Read Digital Temperature
  tempSensor.requestTemperatures();
  float waterTemp = tempSensor.getTempCByIndex(0);
  if (waterTemp < -50.0f || waterTemp > 120.0f) {
    waterTemp = 25.0f; // Default room temperature fallback if sensor detached
  }

  // 2. Read Analog Voltages
  float vPH = readAveragedVoltage(PIN_PH_SENSOR);
  float vTDS = readAveragedVoltage(PIN_TDS_SENSOR);
  float vTurb = readAveragedVoltage(PIN_TURBIDITY_SENSOR);

  // 3. Compute Calibrated Physical Quantities
  float ph = calculatePH(vPH);
  float tds = calculateTDS(vTDS, waterTemp);
  float turbidity = calculateTurbidity(vTurb);
  float conductivity = tds * 2.0f; // Approximate EC in uS/cm from TDS

  // Print diagnostic readout to Serial Monitor
  Serial.println("--------------------------------------------------");
  Serial.printf("TELEMETRY: pH=%.2f (%.2fV) | TDS=%.0f ppm (%.2fV) | Turb=%.2f NTU (%.2fV) | Temp=%.1f C\n",
                ph, vPH, tds, vTDS, turbidity, vTurb, waterTemp);

  // 4. Send Authenticated JSON POST Request to Backend
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON body (Explicitly mark is_simulated: false for real hardware)
  String payload = "{";
  payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"api_key\":\"" + String(API_KEY) + "\",";
  payload += "\"is_simulated\":false,";
  payload += "\"ph\":" + String(ph, 2) + ",";
  payload += "\"tds\":" + String(tds, 1) + ",";
  payload += "\"turbidity\":" + String(turbidity, 2) + ",";
  payload += "\"temperature\":" + String(waterTemp, 1) + ",";
  payload += "\"conductivity\":" + String(conductivity, 1) + ",";
  payload += "\"ph_voltage\":" + String(vPH, 3) + ",";
  payload += "\"tds_voltage\":" + String(vTDS, 3) + ",";
  payload += "\"turbidity_voltage\":" + String(vTurb, 3);
  payload += "}";

  digitalWrite(PIN_STATUS_LED, HIGH); // Blink LED during transmission
  int httpCode = http.POST(payload);
  digitalWrite(PIN_STATUS_LED, LOW);

  if (httpCode == HTTP_CODE_OK) {
    String response = http.getString();
    Serial.println("[HTTP] Ingest successful (200 OK):");
    Serial.println(response);
  } else {
    Serial.printf("[HTTP] Ingest POST failed! Error code: %d\n", httpCode);
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n==================================================");
  Serial.println("   AquaWatch AI - ESP32 Telemetry Hardware Boot   ");
  Serial.println("==================================================");

  // Configure Status LED
  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_STATUS_LED, LOW);

  // Configure 12-bit ADC resolution (0-4095) & attenuation for 0-3.3V input range
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db); // Full range: ~0V to 3.3V

  // Initialize DS18B20 1-Wire temperature bus
  tempSensor.begin();

  // Connect to Wi-Fi
  Serial.printf("[WiFi] Connecting to SSID: %s ", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
    digitalWrite(PIN_STATUS_LED, HIGH);

    // Initial hardware registration
    registerWithBackend();
  } else {
    Serial.println("\n[WiFi] Failed to connect! Will retry in main loop.");
    digitalWrite(PIN_STATUS_LED, LOW);
  }
}

void loop() {
  unsigned long now = millis();
  if (now - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = now;
    if (!isRegistered) {
      registerWithBackend();
    }
    sendTelemetry();
  }
  delay(100);
}
