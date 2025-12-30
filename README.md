# 🚐 Ma3Flow: Nairobi Matatu Digital Twin

> **AI-Powered Urban Mobility Simulator for Nairobi's Matatu Ecosystem.**
> *Built for the Google Cloud x Confluent AI Partner Catalyst.*

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Stack](https://img.shields.io/badge/tech-React%20%7C%20Confluent%20%7C%20Vertex%20AI-orange)

## 📖 Overview

**Ma3Flow** is a dual-mode simulation platform that digitizes the chaotic but vital *Matatu* (minibus) industry in Nairobi, Kenya.

It serves two purposes:
1. **For Drivers:** A "Co-Pilot" that uses Real-Time Data Streaming and AI to predict passenger demand and optimize earnings.
2. **For Passengers:** A reliable journey planner that navigates the complex web of Nairobi's informal bus stops.

## 🏗️ Architecture

Ma3Flow uses a **Hybrid Edge-Cloud Architecture**:

1. **Frontend (The Edge):** A React-based spatial engine that parses GTFS data (Routes & Stops) locally for zero-latency UI performance.
2. **Data Streaming (The Pulse):** **Confluent Cloud** (Kafka) ingests real-time telemetry (Location, Speed, Passenger Count) from the active fleet.
3. **Intelligence (The Brain):** **Google Cloud Vertex AI** analyzes the stream to detect traffic patterns, while **Gemini Pro** generates contextual advice for drivers in local slang (*Sheng*).

## 🚀 Key Features

### 🎮 1. The Simulation Engine (Core)
* **Real-World Data:** Powered by `TransitManager`, utilizing spatial indexing (Grid Cells) to query over 3,000 real Nairobi bus stops and 100+ routes instantly.
* **Dual Modes:**
  * **Driver Mode:** Simulates revenue, fuel costs, and passenger boarding based on stochastic models.
  * **Passenger Mode:** Implements a routing algorithm to find direct paths or "Hub Transfers" (e.g., stopping at *Kencom* CBD to switch matatus).

### 🌊 2. Real-Time Streaming (Confluent Track)
* **TelemetryService:** Automatically captures vehicle state every 2 seconds.
* **Kafka Producer:** Streams `lat`, `lon`, `occupancy`, and `revenue` to Confluent Cloud.
* **Stream Processing:** Filters "Idle" vehicles vs. "Active" vehicles to calculate fleet efficiency.

### 🧠 3. AI Advisory (Google Cloud Track)
* **Gemini Integration:** The `AiAdvisorService` acts as a ride-along assistant.
* **Contextual Tips:** Instead of generic alerts, it speaks the language of the street:
  * *Input:* `Traffic: Heavy`, `Rain: True`, `Location: Westlands`.
  * *AI Output:* "Wazi dere! Mvua inanyesha Westy. Pandisha fare 50 Bob." *(Cool driver! It's raining in Westlands. Raise fare by 50 Shillings.)*

## 🛠️ Tech Stack

### Frontend & Simulation
* **Framework:** React + Vite (TypeScript)
* **UI Library:** Tailwind CSS + shadcn-ui + Framer Motion
* **Maps:** Google Maps JavaScript API
* **Logic:** Haversine Formula for geospatial calculations

### Backend & Cloud
* **Streaming:** Confluent Cloud (Apache Kafka)
* **AI Models:** Google Vertex AI (Gemini Pro)
* **Hosting:** Vercel

## 📂 Project Structure

```bash
src/
├── data/               # Raw CSV Data (Stops & Routes)
├── components/         # UI Components (DriverHUD, MatatuMap)
├── services/           # Business Logic Layer
│   ├── TransitManager.ts       # Spatial Grid & Pathfinding
│   ├── TelemetryService.ts     # Confluent Producer
│   ├── AiAdvisorService.ts     # Google Vertex AI Consumer
│   ├── SimulationService.ts    # The Game Loop
│   └── MatatuService.ts        # Fleet Management
├── screens/            # Main Views (Driver, Passenger, ModeSelector)
├── hooks/              # React Hooks (useSimulation, useBoardingEvents)
└── components/HUD/     # Heads-Up Display Components
```

## ⚡ How to Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/paulbundi/ma3flow.git
   cd ma3flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_key_here
   VITE_CONFLUENT_REST_URL=your_kafka_url
   VITE_GOOGLE_CLOUD_FUNCTION_URL=your_ai_endpoint
   ```

4. **Start the Simulator**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

## 🏆 Hackathon Implementation Details

### Confluent Integration
We utilized the **Confluent REST Proxy** to allow our web-based simulator to produce Kafka messages directly without a heavy backend, simulating IoT devices in 14-seater vans. Real-time telemetry (GPS coordinates, occupancy, revenue) flows into Confluent Cloud topics for stream processing.

### Google Cloud Integration
We used **Cloud Functions** to act as a bridge between the Confluent stream and **Vertex AI**, ensuring that AI predictions are triggered by real-time data events. The `AiAdvisorService` consumes predictions and surfaces them to drivers in real-time.

## 🎯 Use Cases

- **Fleet Operators:** Monitor real-time vehicle positions, occupancy, and earnings across the fleet.
- **Urban Planners:** Analyze matatu flow patterns to identify congestion hotspots and optimize stop placement.
- **Passengers:** Get accurate journey plans with transfer points and estimated arrival times.
- **Researchers:** Study informal transit systems in developing cities using real Nairobi data.

## 📊 Data Sources

- **Stops & Routes:** GTFS data from Nairobi's public transit system (3,000+ stops, 100+ routes)
- **Simulation:** Stochastic models for passenger demand, traffic conditions, and weather

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Made with ❤️ in Nairobi.*
