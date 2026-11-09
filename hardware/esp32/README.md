# AquaWatch AI – ESP32 Smart Water Quality Hardware Integration

This directory contains production firmware, circuit schematics, and calibration instructions for interfacing real ESP32-WROOM-32 microcontrollers with multi-parameter analog and digital water sensors.

---

## ⚡ 1. Hardware Pinout & Voltage Compatibility

### ⚠️ CRITICAL ESP32 Voltage Warning
- The ESP32 operates at **3.3V logic**. Its ADC pins **cannot tolerate 5.0V directly** without damaging the SoC.
- Many analog water sensors (TSW-30 Turbidity, pH-4502C) require 5.0V VCC to power their internal op-amps.
- **Signal Conditioning:** If a sensor outputs up to 5.0V analog signals, use a 2:3 voltage divider (e.g. 10kΩ and 20kΩ resistors) or a 3.3V rail clamp before connecting to the ESP32 ADC pin.

### ⚠️ Wi-Fi ADC Limitation (ADC1 vs ADC2)
- On the ESP32, **ADC2 is permanently disabled** whenever Wi-Fi is active.
- Therefore, **only ADC1 pins** are utilized in this firmware:
  - **pH Sensor:** GPIO 34 (ADC1_CH6)
  - **TDS Sensor:** GPIO 35 (ADC1_CH7)
  - **Turbidity Sensor:** GPIO 32 (ADC1_CH4)
  - **DS18B20 Temp:** GPIO 4 (1-Wire digital bus, requires 4.7kΩ pullup to 3.3V)
  - **Status LED:** GPIO 2 (Onboard blue LED)

---

## 🔌 2. Wiring Diagram

```
+--------------------------------------------------------------+
|                        ESP32 DevKit                          |
|                                                              |
|   3V3  ----------------- VCC (DS18B20 Temp)                  |
|   5V   ----------------- VCC (pH-4502C, TDS, Turbidity)     |
|   GND  ----------------- Common GND (All Sensors)            |
|                                                              |
|   GPIO 34 (ADC1_CH6) --- pH Sensor Analog Output (Po)        |
|   GPIO 35 (ADC1_CH7) --- TDS Sensor Analog Output            |
|   GPIO 32 (ADC1_CH4) --- Turbidity Sensor Analog Output      |
|   GPIO 4  -------------- DS18B20 Data (4.7kΩ pull-up to 3V3) |
|   GPIO 2  -------------- Status Activity LED                 |
+--------------------------------------------------------------+
```

---

## 🧪 3. Sensor Calibration Guide

### A. pH Sensor (pH-4502C or DFRobot SEN0161)
1. Immerse the glass electrode in **pH 7.00 buffer solution**.
2. Measure the voltage output on the signal pin or observe the Serial Monitor output.
3. Adjust the onboard potentiometer (gain) until the voltage reads approximately `2.50V`.
4. Update `PH_VOLTAGE_AT_7` in `config.h` if your reading differs.
5. Dip the probe in **pH 4.01 buffer solution** to determine the slope ($V_{\text{diff}} / 3.0$).

### B. TDS Sensor (DFRobot Gravity Analog TDS Meter)
1. Submerge the two probe pins into a known standard solution (e.g., **500 ppm NaCl**).
2. Read the raw TDS telemetry and adjust `TDS_CALIBRATION_FACTOR` in `config.h`.

### C. Turbidity Sensor (TSW-30 / SEN0189)
1. In clean distilled water, the phototransistor output voltage should be $\ge 3.0\text{V}$.
2. In murky water or milk suspension, the voltage will drop below $2.5\text{V}$.

---

## 🚀 4. How to Flash the Firmware

1. Open **Arduino IDE** (or PlatformIO).
2. Install board support: **Tools $\rightarrow$ Board Manager $\rightarrow$ ESP32 by Espressif Systems**.
3. Install required libraries via Library Manager:
   - `DallasTemperature` by Miles Burton
   - `OneWire` by Paul Stoffregen
4. Copy `config.h.example` to `config.h`:
   ```bash
   cp config.h.example config.h
   ```
5. Edit `config.h` with:
   - Your local Wi-Fi SSID & Password.
   - Your computer's LAN IP address (e.g., `http://192.168.1.100:8000/iot/readings`).
6. Select **NodeMCU-32S** (or **ESP32 Dev Module**) and your COM port.
7. Click **Upload**.
8. Open the Serial Monitor at **115200 baud** to view live sensor telemetry packets.
