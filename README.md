# LTE Handover Validation Dashboard

A professional telecom network validation dashboard for visualizing and analyzing LTE handover performance during drive tests.

## Overview

This dashboard displays real-time mobility validation data for **Orange Cameroun**, following 3GPP TS 36.331 standards. It provides interactive visualization of drive test data with signal quality metrics and network events.

## Features

- **Interactive Map Visualization** with MapLibre GL
- **CSV Data Upload** for drive test results
- **Color-Coded Signal Quality** (RSRP-based)
- **Event Markers** with icons (Handover, RRC Setup/Release, Cell Reselection, etc.)
- **Performance KPIs** (HO Success Rate, Video Continuity)
- **Technical Analysis** with L3 message flow
- **Network Optimization Parameters** (TTT, Hysteresis)

## Quick Start

1. Open `index.html` in a web browser
2. Click **"📁 UPLOAD CSV"** button
3. Select your drive test CSV file
4. View the interactive map with signal quality and events

## CSV Format

Your CSV file should include these columns:

```
#,time,latitude,longitude,rsrp,rsrq,sinr,pci,band,event
```

### Required Columns:
- `latitude` - GPS latitude coordinate
- `longitude` - GPS longitude coordinate
- `rsrp` - Reference Signal Received Power (dBm)

### Optional Columns:
- `rsrq` - Reference Signal Received Quality (dB)
- `sinr` - Signal-to-Interference-plus-Noise Ratio (dB)
- `pci` - Physical Cell ID
- `band` - Frequency band
- `event` - Network event type (see Event Types below)

## Event Types

The dashboard supports these network events:

| Event | Icon | Color | Description |
|-------|------|-------|-------------|
| **handover** | ↔ | Orange | LTE handover event |
| **cell_reselection** | 📶 | Purple | Cell reselection in idle mode |
| **rrc_setup** | ▶ | Green | RRC connection setup |
| **rrc_release** | ⏹ | Blue | RRC connection release |
| **attach** | ⚡ | Blue | Network attach |
| **detach** | 🔌 | Gray | Network detach |
| **rlf** | ⚠ | Red | Radio Link Failure |
| **service_request** | 📡 | Yellow | Service request procedure |

## Signal Quality Thresholds

| Quality | RSRP Range | Color |
|---------|-----------|-------|
| Excellent | ≥ -80 dBm | Green |
| Good | -80 to -90 dBm | Blue |
| Fair | -90 to -100 dBm | Yellow |
| Poor | -100 to -110 dBm | Orange |
| Very Poor | < -110 dBm | Red |

## Technology Stack

- **MapLibre GL JS** - Open-source mapping library
- **Tailwind CSS** - Utility-first CSS framework
- **JetBrains Mono** - Monospace font for technical aesthetic
- **Vanilla JavaScript** - No framework dependencies

## Design Style

- **Neo-brutalist** design with heavy borders and bold shadows
- **Cyber aesthetic** with yellow (#FFD600) accents on black
- **Grid overlay** with subtle orange-tinted background
- **Scanline effect** for CRT monitor simulation

## Files

```
colleague-map/
├── index.html    # Main dashboard page
├── styles.css    # Custom styling
└── README.md     # This file
```

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari

## Use Case

Designed for **RF optimization engineers** to:
- Validate handover performance during drive tests
- Identify coverage gaps and signal degradation
- Analyze L3 signaling messages
- Optimize network parameters (TTT, Hysteresis)
- Generate reports for network quality assurance

## Standards Compliance

- **3GPP TS 36.331** - Radio Resource Control (RRC) Protocol
- **LTE Frequency Bands**: EARFCN 1300 (1800MHz) / 6300 (800MHz)

## License

© 2026 ORANGE CAMEROUN - RF OPTIMIZATION TEAM  
CONFIDENTIAL - INTERNAL USE ONLY
