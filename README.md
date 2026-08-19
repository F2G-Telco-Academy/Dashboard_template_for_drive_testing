# Telecom Drive Test Dashboard - Universal Template

A professional telecom network validation dashboard for creating **customizable test case presentations** with editable fields, KPI visualization, and client-ready exports.

## 🏗️ SYSTEM ARCHITECTURE

### **Application Overview**
- **Client-Side Only**: No server dependencies, all processing in browser
- **Single Page Application**: HTML + JavaScript + CSS with external libraries
- **Real-Time Processing**: Instant CSV parsing and visualization
- **Universal Compatibility**: Works with any telecom drive test data

### **Data Flow Pipeline**
```
CSV Upload → Multi-RAT Parser → Technology Detection → Data Storage → 
Map Visualization + KPI Charts + Statistics → Configuration Management → Client Sharing
```

### **Core Technologies**
- **Frontend**: Vanilla JavaScript, HTML5, TailwindCSS
- **Mapping**: MapLibre GL with OpenStreetMap/CartoDB tiles
- **Charts**: Chart.js with custom telecom-specific configurations
- **Compression**: Pako (gzip) for URL sharing
- **Storage**: Browser localStorage + File System Access API

### **Technology Detection Logic**
1. **Explicit Detection**: Uses `Technology` column values (NR, LTE, UMTS, GSM)
2. **Auto-Detection**: Infers from technology-specific column presence:
   - 5G NR: `nr_rsrp`, `nr_rsrq`, `nr_sinr` columns
   - 4G LTE: `rsrp`, `rsrq`, `sinr` columns (default fallback)
   - 3G UMTS: `wcdma_rscp`, `wcdma_ecno` columns
   - 2G GSM: `gsm_rxlev`, `rxlev`, `gsm_rxqual` columns
3. **Filtering**: Technology dropdown filters data in real-time

## 🆕 KEY FEATURES

### 📡 **Multi-RAT Support (2G/3G/4G/5G)**
- Technology filter dropdown to view specific RAT data
- Auto-detection of technology from CSV headers or Technology column
- Technology-specific KPI labels and visualization:
  - **5G NR**: NR-RSRP, NR-RSRQ, NR-SINR, NR-PCI, Beam ID
  - **4G LTE**: RSRP, RSRQ, SINR, PCI, EARFCN
  - **3G UMTS**: RSCP, Ec/No, PSC, UARFCN (no SINR/CQI/MCS/BLER)
  - **2G GSM**: RxLev, RxQual, BSIC, ARFCN (no SINR/CQI/MCS/BLER)
- Dynamic chart titles and labels based on detected technology
- Technology-aware KPI tabs (hides unavailable metrics per RAT)
- Smart scatter plot handling (hides redundant charts for 3G/2G)
- Fully backward compatible with existing LTE CSV files

### ✏️ **Full Edit Mode**
- Toggle edit mode to make ALL fields editable
- Click on any text to modify: titles, routes, device info, analysis sections
- Visual indicators show which fields are editable (orange dashed outlines)
- Guided placeholder text in all sections
- **Rich Text Formatting Toolbar** (NEW)
  - Bold, Italic, Underline (Ctrl+B/I/U)
  - Font size: 7 options (Tiny to XXL)
  - Text color: 9 colors (Green, Blue, Red, Orange, Purple, Pink, Teal, Black, Gray)
  - Clear formatting button
  - All formatting preserved in save/load/share

### 🔗 **Client View Sharing**
- Generate shareable read-only URLs for clients
- Compressed URLs with gzip (60-80% size reduction)
- Embedded CSV data and configuration in URL
- Client view shows blue banner and disables all editing
- No server required - works entirely client-side

### 📊 **KPI Visualization**
- Real-time signal quality charts with technology-specific labels
- Multiple chart types: Line, Area, Bar
- **Customizable Chart Visibility**
  - Individual hide/show buttons (✕) on each chart for quick control
  - Centralized "⚙️ Customize Charts" panel for bulk management
  - Select which charts to display (hide irrelevant KPIs for specific test scenarios)
  - State persists across sessions (saved in localStorage)
  - Technology-aware: only shows applicable charts per RAT
  - Reduces scrolling and clutter for focused analysis
- **Enhanced Tooltips with GPS Coordinates**
  - Latitude and longitude displayed in all chart tooltips (6 decimal precision)
  - Technology indicator in tooltip title (e.g., "Time: 12:34:56 [UMTS]")
  - Available in main KPI charts, comparison charts, and multi-KPI analysis
  - Helps correlate performance with exact geographic location
- **Technology-Adaptive KPI Tabs**
  - Auto-hide unavailable KPIs (e.g., SINR for UMTS, CQI for GSM)
  - Dynamic tab labels (RSRP→RSCP for UMTS, RSRP→RxLev for GSM)
- **Multi-KPI Synchronized Comparison** (NEW: Enhanced UX)
  - Select 2-9 KPIs simultaneously for correlation analysis (increased from 6)
  - **TxPower (Transmit Power)** now available for selection
  - Stacked charts with individual Y-axis per KPI (professional telecom tool style)
  - Synchronized vertical crosshair across all charts for precise time alignment
  - **Fixed Observation Panel** - Clean, non-intrusive side panel showing:
    - Timestamp at crosshair position
    - All KPI values at that point (color-coded)
    - Technology and PCI/PSC/BSIC metadata
    - Event detection (handovers, attaches, etc.)
  - No tooltip overlays blocking chart data
  - Smooth 60fps performance with throttled updates
  - Technology-aware labels (auto-updates for LTE/NR/UMTS/GSM)
  - Scrollable layout for many KPIs
  - Professional appearance matching Ericsson TEMS/Nemo Outdoor
- **KPI Comparison Section** (9 separate time-series charts)
  - Technology-specific chart titles and labels
  - Section title shows detected technology (e.g., "UMTS KPI COMPARISON ANALYSIS")
  - RSRP/RSCP/RxLev (dBm) - Independent optimized scale
  - RSRQ/Ec/No/RxQual (dB) - Independent optimized scale
  - SINR (dB) - Hidden for UMTS/GSM
  - Throughput DL (Mbps) - Independent optimized scale
  - Throughput UL (Mbps) - Independent optimized scale
  - BLER (%) - Hidden for UMTS/GSM
  - CQI - Hidden for UMTS/GSM
  - MCS - Hidden for UMTS/GSM
  - **TxPower (dBm)** - NEW! Transmit power visualization
- **Correlation Analysis Section** (scatter plots)
  - **Polynomial Regression Trendlines** - Smooth statistical trend visualization
    - Three polynomial curves per chart: 90th Percentile, Median, Average
    - Configurable polynomial degree (1-6, default: quadratic)
    - Dashed lines color-coded to match statistical measures (red, yellow, green)
    - Computed from binned statistical data for smooth, clean visualization
    - Single dropdown controls all polynomial curves simultaneously
    - Degree selection: Linear, Quadratic, Cubic, Quartic, Quintic, Sextic
    - Warning for high-degree polynomials (≥6) to prevent overfitting
  - **Optional Overall Trend Line** - Advanced feature for raw data analysis
    - Available in **zoom modal** (fullscreen view) of scatter plots
    - Toggle: "Show overall trend (advanced)" checkbox in modal header
    - When enabled, displays polynomial fit of ALL raw data points
    - Light purple dashed line (#a78bfa) with distinct pattern [4, 4]
    - Thinner line (2px) to distinguish from statistical curves
    - Shows "center of mass" of scatter cloud for validation
    - Useful for comparing statistical distribution vs raw trend
    - Default: OFF (keeps visualization clean)
    - Labeled as "Overall Trend (Deg N)" in legend
    - Only appears for scatter plots (not time-series charts)
  - **Smart Idle Sample Filtering** - Removes idle UE states for accurate correlation
    - Toggle: "Include idle samples (Tput=0)" checkbox with dark mode support
    - Default: OFF (filters idle samples for realistic analysis)
    - Filtering logic: Excludes throughput=0 when BLER=0/100, CQI=0, MCS=0 (idle UE)
    - Preserves real low-throughput scenarios (active sessions with poor performance)
    - Debug logging shows filtering statistics in browser console
  - Smart fallback: Uses RSRP when SINR unavailable (UMTS/GSM)
  - Hides redundant scatter plots for 3G/2G
  - **DL Throughput vs SINR/RSCP/RxLev** with polynomial trendlines (DL only - UE-side measurement)
  - **DL Throughput vs RSRP/RSCP/RxLev** with polynomial trendlines (DL only - UE-side measurement)
  - **DL Throughput vs RSRQ/Ec/No/RxQual** with polynomial trendlines (NEW - quality indicator correlation)
  - MCS vs CQI (LTE/NR only) with polynomial trendlines
  - **DL Throughput vs BLER** (LTE/NR only - DL only) with polynomial trendlines
  - **Note**: All throughput correlations use DL throughput only (UL SINR not available in UE logs)
- **Click-to-Zoom Modal**
  - Click any chart to open fullscreen analytics view
  - Technology-specific modal titles (e.g., "RSCP Chart" for UMTS)
  - Dashboard-style KPI summary cards, percentiles, and quality insights when the UI branch is active
  - Full light/dark theme support matching KPI panel
  - ESC key or background click to close
  - All charts support fullscreen view with correct labels
- Distribution histograms with technology-aware labels
- Statistics and signal quality distribution
- Grid/Table view modes

### 💾 **Save & Load Configurations**
- Save entire dashboard configuration as JSON file
- Choose save location and filename (Chrome/Edge)
- Load previously saved configs to reuse test templates
- Preserves empty fields correctly

### 🗺️ **Interactive Map**
- Drive test route visualization with color-coded signal quality
- Technology filter dropdown (All/5G NR/4G LTE/3G UMTS/2G GSM)
- Technology-specific map popups showing relevant KPIs
- Event markers: Handover, Attach, Detach, RLF, Cell Reselection, CSFB
- Legend positioned below upload button
- Dark/Light mode toggle
- Fullscreen support

---

## 🚀 Quick Start Guide

### 1. **Upload Your Drive Test CSV**
```
Click "📁 UPLOAD CSV" → Select your CSV file
```

### 2. **Enable Edit Mode**
```
Click "✏️ EDIT MODE: OFF" to toggle ON
All editable fields will show orange dashed outlines
```

### 3. **Customize Your Test Case**
- **Header**: Edit test case type, name, operator, route, status, reference, device
- **4 Analysis Sections**: Add performance summary, impacts, analysis, recommendations
- **Add Fields**: Use "+" buttons to add additional fields per section
- **Format Text**: Use formatting toolbar at bottom (appears when edit mode is ON)
  - Select text → Apply bold, italic, underline
  - Change font size or color from dropdowns
  - All formatting preserved when saving

### 4. **View KPIs**
```
Click "📊 KPIs" button to view signal quality charts
Toggle individual KPI visibility with checkboxes

Multi-KPI Comparison (ENHANCED):
1. Scroll to "🔬 MULTI-KPI COMPARISON" section
2. Select 2-8 KPIs (e.g., RSRP, SINR, DL Throughput)
3. Click "📊 COMPARE SELECTED KPIs"
4. View stacked synchronized charts with individual Y-axes
5. Hover over any chart to see:
   - Synchronized vertical crosshair across ALL charts
   - Fixed observation panel on the right showing:
     * Timestamp at crosshair position
     * All KPI values (color-coded)
     * Technology and PCI/PSC/BSIC
     * Event info (if present)
6. Clean, unobstructed chart view (no tooltip overlays)
7. Perfect for correlation analysis (e.g., signal vs throughput)

Download Charts (NEW):
1. Click any chart to open zoom modal (fullscreen view)
2. Click "⬇ DOWNLOAD" button in modal header
3. Select format: PNG or SVG
4. File downloads automatically with descriptive filename
5. Theme preserved (dark/light mode)
6. Perfect for presentations and reports

The fullscreen modal also includes the updated enterprise-style KPI summary cards and overview panels from the graph-improve UI work.
```

### 5. **Save Configuration**
```
Click "💾 SAVE" → Choose location and filename
Configuration saved as JSON file
```

### 6. **Load Configuration**
```
Click "📂 LOAD" → Select previously saved JSON file
All fields restored including empty ones
```

### 7. **Share with Client**
```
Click "🔗 SHARE" → Copy generated URL
Send URL to client for read-only view
Client sees dashboard with embedded data (no CSV upload needed)
```

---

## 📋 CSV Format Requirements

### Multi-RAT CSV Format (ECA kpi_export compatible):
```csv
#,time,latitude,longitude,Technology,rsrp,rsrq,sinr,pci,TxPower,nr_rsrp,nr_rsrq,nr_sinr,wcdma_rscp,wcdma_ecno,gsm_rxlev,gsm_rxqual,...
```

### LTE-Only CSV Format (Legacy - Backward Compatible):
```csv
#,time,latitude,longitude,rsrp,rsrq,sinr,pci,band,event,TxPower,cqi,mcs,bler,throughput_dl_mbps,throughput_ul_mbps
```

### Technology-Specific Columns:

**5G NR:**
- `nr_rsrp` - NR Reference Signal Received Power (dBm)
- `nr_rsrq` - NR Reference Signal Received Quality (dB)
- `nr_sinr` - NR Signal-to-Interference-plus-Noise Ratio (dB)
- `nr_pci` - NR Physical Cell ID
- `beam_id` - Beam identifier (optional)

**4G LTE:**
- `rsrp` - Reference Signal Received Power (dBm)
- `rsrq` - Reference Signal Received Quality (dB)
- `sinr` - Signal-to-Interference-plus-Noise Ratio (dB)
- `pci` - Physical Cell ID
- `earfcn` - E-UTRA Absolute Radio Frequency Channel Number
- `TxPower` or `txpower` - Transmit Power (dBm) - NEW!
- `cqi`, `mcs`, `bler` - Link quality indicators

**3G UMTS:**
- `wcdma_rscp` - Received Signal Code Power (dBm)
- `wcdma_ecno` - Ec/No ratio (dB)
- `wcdma_psc` - Primary Scrambling Code
- `uarfcn` - UTRA Absolute Radio Frequency Channel Number

**2G GSM:**
- `gsm_rxlev` or `rxlev` - Received Signal Level (dBm)
- `gsm_rxqual` or `rxqual` - Received Signal Quality (0-7)
- `gsm_bsic` - Base Station Identity Code
- `gsm_bcch_arfcn` or `bcch-arfcn` - BCCH ARFCN

### Technology Detection:
- Explicit: Use `Technology` column with values: NR, LTE, UMTS, GSM
- Auto-detect: System infers from presence of technology-specific columns
- Filter: Use dropdown to view specific technology data

### Example Rows:
```csv
1,2024-01-15T10:30:45,3.8480,11.5021,-85,-10,15,123,23,1800,handover
2,2024-01-15T10:30:50,3.8485,11.5025,-87,-11,14,124,22,1800,
3,2024-01-15T10:30:55,3.8490,11.5030,-90,-12,12,125,20,1800,attach
```
*Note: TxPower column (23, 22, 20 dBm) added after PCI*

### Event Types Supported:
| Event | Icon | Description |
|-------|------|-------------|
| `handover` | ↔ | LTE handover event |
| `attach` | ⚡ | Network attach |
| `detach` | 🔌 | Network detach |
| `rlf` | ⚠ | Radio Link Failure |
| `cell_reselection` | 📶 | Cell reselection |
| `csfb` | 📞 | Circuit Switch Fallback |

---

## 🎯 Use Cases

### **Any Telecom Test Case Type**
- Handover validation
- Coverage analysis
- Interference investigation
- Capacity testing
- Voice call continuity
- Data throughput validation
- RLF mitigation
- Cell reselection optimization
- **Multi-KPI correlation analysis** (NEW)
- **Signal quality vs throughput trends** (NEW)
- **Root cause identification** (NEW)

### **Workflow Example**
```
1. Upload drive test CSV
2. Edit title: "[Your Test Type] : [Your Test Name]"
3. Fill in 4 analysis sections with your findings
4. View KPI charts and comparison section for data validation
5. Analyze KPI relationships in 4 professional scatter plots
   - Use filtering toggle to exclude idle UE samples (recommended)
   - Compare filtered vs unfiltered to understand data quality
6. Save configuration for future reference
7. Share with client using 🔗 SHARE button
8. Present to client or team
```

---

## 🔗 Client View Sharing

### **How It Works**
1. **Engineer Mode**: Upload CSV, customize dashboard, click "🔗 SHARE"
2. **URL Generation**: Creates compressed URL with config + CSV data
3. **Client View**: Client opens URL → sees read-only dashboard with data

### **Features**
- ✅ **Compressed URLs**: Gzip compression (60-80% smaller)
- ✅ **URL-Safe Encoding**: Works in emails, chat, browsers
- ✅ **Read-Only Mode**: Client cannot edit or upload files
- ✅ **No Server Required**: All data embedded in URL
- ✅ **Automatic Loading**: Map and data render automatically

### **Share Workflow**
```
Engineer: Upload CSV → Customize → Click 🔗 SHARE → Copy URL
Client: Open URL → View dashboard (read-only)
```

---

## 📊 Signal Quality Thresholds (Industry Standard)

### LTE/NR Thresholds

#### RSRP (Reference Signal Received Power)
| Quality | Range | Color | Typical Use Case |
|---------|-------|-------|------------------|
| Excellent | ≥ -80 dBm | 🟢 Green | Dense urban areas |
| Good | -80 to -90 dBm | 🔵 Blue | Suburban coverage |
| Fair | -90 to -100 dBm | 🟡 Yellow | Cell edge, acceptable |
| Poor | < -100 dBm | 🔴 Red | Coverage holes |

#### RSRQ (Reference Signal Received Quality)
| Quality | Range | Color |
|---------|-------|-------|
| Excellent | ≥ -10 dB | 🟢 Green |
| Good | -10 to -15 dB | 🔵 Blue |
| Fair | -15 to -20 dB | 🟡 Yellow |
| Poor | < -20 dB | 🔴 Red |

#### SINR (Signal-to-Interference-plus-Noise Ratio)
| Quality | Range | Color |
|---------|-------|-------|
| Excellent | ≥ 20 dB | 🟢 Green |
| Good | 13 to 20 dB | 🔵 Blue |
| Fair | 0 to 13 dB | 🟡 Yellow |
| Poor | < 0 dB | 🔴 Red |

#### CQI (Channel Quality Indicator)
| Quality | Range | Color |
|---------|-------|-------|
| Excellent | ≥ 12 | 🟢 Green |
| Good | 9 to 11 | 🔵 Blue |
| Fair | 6 to 8 | 🟡 Yellow |
| Poor | < 6 | 🔴 Red |

#### MCS (Modulation and Coding Scheme)
| Quality | Range | Color |
|---------|-------|-------|
| Excellent | ≥ 20 | 🟢 Green |
| Good | 15 to 19 | 🔵 Blue |
| Fair | 10 to 14 | 🟡 Yellow |
| Poor | < 10 | 🔴 Red |

#### BLER (Block Error Rate)
| Quality | Range | Color |
|---------|-------|-------|
| Excellent | ≤ 2% | 🟢 Green |
| Good | 2 to 10% | 🔵 Blue |
| Fair | 10 to 30% | 🟡 Yellow |
| Poor | > 30% | 🔴 Red |

#### Throughput (DL/UL) - LTE/NR
| Quality | DL Range | UL Range | Color |
|---------|----------|----------|-------|
| Excellent | ≥ 50 Mbps | ≥ 20 Mbps | 🟢 Green |
| Good | 25-50 Mbps | 10-20 Mbps | 🔵 Blue |
| Fair | 10-25 Mbps | 5-10 Mbps | 🟡 Yellow |
| Poor | < 10 Mbps | < 5 Mbps | 🔴 Red |

---

### UMTS (3G) Thresholds

#### RSCP (Received Signal Code Power)
| Quality | Range | Color |
|---------|-------|-------|
| Excellent | ≥ -70 dBm | 🟢 Green |
| Good | -70 to -85 dBm | 🔵 Blue |
| Fair | -85 to -95 dBm | 🟡 Yellow |
| Poor | < -95 dBm | 🔴 Red |

#### Ec/No (Energy per Chip / Noise)
| Quality | Range | Color |
|---------|-------|-------|
| Excellent | ≥ -6 dB | 🟢 Green |
| Good | -6 to -10 dB | 🔵 Blue |
| Fair | -10 to -14 dB | 🟡 Yellow |
| Poor | < -14 dB | 🔴 Red |

#### Throughput (DL/UL) - UMTS/HSPA+
| Quality | DL Range | UL Range | Color |
|---------|----------|----------|-------|
| Excellent | ≥ 10 Mbps | ≥ 5 Mbps | 🟢 Green |
| Good | 5-10 Mbps | 2-5 Mbps | 🔵 Blue |
| Fair | 2-5 Mbps | 1-2 Mbps | 🟡 Yellow |
| Poor | < 2 Mbps | < 1 Mbps | 🔴 Red |

---

### GSM (2G) Thresholds

#### RxLev (Received Signal Level)
| Quality | Range | Color |
|---------|-------|-------|
| Excellent | ≥ -70 dBm | 🟢 Green |
| Good | -70 to -85 dBm | 🔵 Blue |
| Fair | -85 to -95 dBm | 🟡 Yellow |
| Poor | < -95 dBm | 🔴 Red |

#### RxQual (Received Signal Quality)
| Quality | Range (0-7 scale) | Color |
|---------|-------------------|-------|
| Excellent | 0-2 | 🟢 Green |
| Good | 3-4 | 🔵 Blue |
| Fair | 5-6 | 🟡 Yellow |
| Poor | 7 | 🔴 Red |

#### Throughput (DL/UL) - GSM/EDGE
| Quality | DL Range | UL Range | Color |
|---------|----------|----------|-------|
| Excellent | ≥ 0.2 Mbps | ≥ 0.1 Mbps | 🟢 Green |
| Good | 0.1-0.2 Mbps | 0.05-0.1 Mbps | 🔵 Blue |
| Fair | 0.05-0.1 Mbps | 0.02-0.05 Mbps | 🟡 Yellow |
| Poor | < 0.05 Mbps | < 0.02 Mbps | 🔴 Red |

---

**Note:** Quality indicators appear in KPI chart tooltips for instant performance assessment. Thresholds automatically adapt based on detected technology (NR/LTE/UMTS/GSM).

---

## 🔧 Configuration File Structure

```json
{
  "title": "[Test Case Type] : [Test Case Name]",
  "operator": "OPERATOR: [Operator Name]",
  "route": "ROUTE: [Start Location] > [End Location]",
  "status": "STATUS: [Test Status]",
  "reference": "REF: [Reference Standard]",
  "device": "TEST DEVICE: [Device Model]",
  "performance-content": "Your performance summary...",
  "impacts-content": "Your impacts analysis...",
  "analysis-content": "Your technical analysis...",
  "recommendations-content": "Your recommendations...",
  "footer-left": "© 2026 PKFOKAM48 - TELCO ACADEMY",
  "footer-right": "F2G SOLUTIONS: CONFIDENTIAL-INTERNAL USE ONLY"
}
```

---

## 💡 Pro Tips

### Creating Reusable Templates:
1. Set up your standard test format once
2. Save configuration as template
3. For each new test: Load template → Upload CSV → Edit specific values

### Reset to Default:
- Click **RESET** button to clear all customizations
- Returns dashboard to clean template state
- Clears localStorage cache

---

## 📱 Browser Compatibility

- ✅ **Chrome/Edge** (Recommended - includes "Save As" dialog)
- ✅ **Firefox** (Full functionality)
- ✅ **Safari** (Map rendering may vary slightly)

---

## 📊 Performance & Limitations

### **Recommended CSV File Sizes**
- **Optimal**: < 5,000 data points for smooth performance
- **Maximum**: < 50,000 data points (may cause slower rendering)
- **File Size**: < 10MB for sharing URLs to work reliably

### **Browser Storage Usage**
- **localStorage**: Auto-saves dashboard configuration (< 1MB)
- **Memory**: CSV data held in browser memory during session
- **No Server Storage**: All data remains on your device

### **Chart Interaction Features**
- **Click-to-Zoom**: Click any chart for fullscreen modal view
- **Technology-Aware Titles**: Modal titles adapt to detected technology
- **Keyboard Shortcuts**: ESC to close, standard zoom controls
- **Theme Support**: Charts adapt to light/dark KPI panel theme

---

## 🔐 Data Privacy & Security

- **All processing is client-side** (no data sent to servers)
- CSV files never leave your browser
- Configurations stored as local JSON files
- Safe for confidential test data

---

## 🆘 Troubleshooting

**Q: I don't see the template placeholders**
- Click the **RESET** button to clear cached data
- Or open in incognito/private window
- Or clear localStorage: F12 → Console → `localStorage.clear()` → Refresh

**Q: My saved config shows default text instead of empty fields**
- This was fixed in latest version
- Re-save your configuration to update format

**Q: Edit mode shows outline but text won't change**
- Make sure edit mode is ON (button should be green)
- Click directly on the text

**Q: Can't choose save location**
- Use Chrome or Edge for "Save As" dialog
- Other browsers use default download folder

**Q: Share URL too long or doesn't work**
- URLs are compressed with gzip (60-80% reduction)
- Use URL shortener if needed for very large datasets
- Ensure CSV file is reasonable size (<5000 points recommended)

**Q: Client view shows error loading configuration**
- Ensure full URL is copied (including ?mode=view&config=...)
- Try opening in different browser
- Check if URL was truncated in email/chat

**Q: Filtering doesn't seem to work (charts look identical)**
- Open browser console (F12) to see filtering statistics
- Toggle the "Include idle samples" checkbox and check console logs
- If you see "Idle samples removed: 3%", filtering is working (impact is small)
- Your data may have very few true idle samples (this is good!)
- Most throughput=0 samples with CQI>0 or MCS>0 are real network issues (kept by filtering)

**Q: How do I know if filtering is working?**
- Open browser console (F12)
- Toggle the checkbox ON/OFF
- Look for messages like:
  - `🟢 FILTERING ON: Removed 15 idle samples`
  - `🔵 FILTERING OFF: Showing all 565 samples`
- Console shows exact count of filtered samples and percentage

---

## 📖 Standards Compliance

- **3GPP TS 36.331** - LTE RRC Protocol Specification
- **3GPP TS 36.133** - Radio resource management requirements
- **ETSI TS 136.213** - Physical layer procedures

---

## 🔄 Version History

**v3.16 (Current - Timestamp Precision Enhancement)**
- ✅ Full microsecond precision preserved from ECA CSV files
- ✅ Two-tier timestamp display for readable axes and precise tooltips
- ✅ Technology-aware KPI rendering remains stable across LTE, NR, UMTS, and GSM

**v3.15 (Chart Export Feature)**
- ✅ Download KPI charts as PNG or SVG from the zoom modal
- ✅ Full multi-KPI export and theme-aware rendering
- ✅ Descriptive filenames and clean export UX

**v3.14 (Complete 5-Chart Correlation Analysis)**
- ✅ Added the missing DL Throughput vs RSRQ/Ec/No/RxQual scatter plot
- ✅ Moved scatter trendline controls into the zoom modal for a cleaner main dashboard
- ✅ Preserved the full correlation analysis suite across all supported RATs

**v3.13 (Polynomial Regression with Optional Raw Trend)**
- ✅ Kept the smoother polynomial trendline workflow for correlation visualizations
- ✅ Added optional overall trend toggles and configurable polynomial degree

**v3.12 (GSM Data Visualization Fixes)**
- ✅ Fixed GSM Y-axis scaling and flat-line visibility
- ✅ Added GSM BSIC compatibility mapping and chart stability improvements

**v3.11 (Customizable Chart Visibility)**
- ✅ Added individual hide/show controls and bulk chart management
- ✅ Kept chart count and technology-aware visibility behavior

**v3.10 (GPS Coordinates & Technology Indicators)**
- ✅ Added GPS metadata to tooltips and map popups
- ✅ Kept technology-specific KPI labeling for mixed-network data

**v3.9 (UI Cleanup)**
- ✅ Removed unused table-mode controls for a cleaner dashboard

**v3.8 (TxPower Integration + Technology-Aware Quality Indicators)**
- ✅ Added TxPower support and technology-aware thresholds
- ✅ Kept chart and CSV compatibility improvements across RATs

**v3.7 (Idle Sample Filtering + Observation Panel UX)**
- ✅ Added activity-based filtering and a cleaner observation panel workflow
- ✅ Kept the synchronized multi-KPI comparison behavior

**v3.6 (Chart Zoom Analytics Modal)**
- ✅ Preserved the fullscreen analytics modal and dashboard-like KPI summary cards
- ✅ Added the enterprise-style summary and status overlays while keeping chart logic intact

**v3.5 (Multi-RAT Support)**
- ✅ Multi-RAT support for 2G/3G/4G/5G networks
- ✅ Technology filter dropdown (All/NR/LTE/UMTS/GSM)
- ✅ Auto-detection of technology from CSV headers
- ✅ Technology-specific KPI labels (RSCP, Ec/No, RxLev, RxQual)
- ✅ Dynamic KPI tab visibility (hides unavailable metrics per RAT)
- ✅ Technology-aware chart titles and section headers
- ✅ Smart scatter plot handling (hides redundant charts for 3G/2G)
- ✅ Technology-specific modal titles in fullscreen view
- ✅ Map popups show technology-appropriate KPIs
- ✅ Fully backward compatible with existing LTE CSV files
- ✅ Added UL Throughput chart in KPI Comparison Analysis section

**v3.4 (Rich Text Formatting)**
- ✅ Added rich text formatting toolbar (appears in edit mode)
- ✅ Bold, Italic, Underline with keyboard shortcuts
- ✅ Font size dropdown (7 sizes: Tiny to XXL)
- ✅ Text color dropdown (9 colors with visual indicators)
- ✅ HTML formatting preservation in save/load/share (innerHTML)
- ✅ Compact toolbar design for mobile responsiveness
- ✅ All formatting persists across all operations

**v3.3 (Separate Stacked Charts)****
- ✅ Replaced dual Y-axis charts with separate stacked charts for optimal temporal analysis
- ✅ 7 independent time-series charts with optimized Y-axis scales
- ✅ Dynamic BLER scale based on actual data range (not fixed 0-100%)
- ✅ Improved X-axis readability: horizontal labels, 5 ticks max, 8px padding
- ✅ Reordered KPI charts: RSRP, RSRQ, SINR, Throughput DL, BLER, CQI, MCS
- ✅ 4 scatter plots for correlation analysis with percentile trend lines
- ✅ Removed scale mismatch issues for better visibility
- ✅ Each metric now uses full chart height for maximum clarity

**v3.2 (Enhanced KPI Comparison)**
- ✅ Professional KPI comparison section (6 dual-axis line charts)
- ✅ Time-based comparison showing KPI trends side-by-side
- ✅ Dual Y-axes with color-coded labels matching line colors
- ✅ Enhanced tooltips showing all KPI values at each time point
- ✅ Click-to-zoom functionality for detailed analysis
- ✅ Single-column layout for better visibility
- ✅ ECA-style professional visualization
- ✅ Fixed tooltip duplication issue

**v3.1 (Client View Sharing)**
- ✅ Client view sharing with compressed URLs
- ✅ URL-safe base64 encoding for share links
- ✅ Gzip compression (60-80% size reduction)
- ✅ Read-only mode with blue banner
- ✅ Automatic CSV data embedding in URLs
- ✅ Fixed pako decompression (ungzip instead of inflate)

**v3.0 (Universal Template)**
- ✅ Generic template for any test case type
- ✅ Guided placeholder text in all sections
- ✅ File System Access API for save location picker
- ✅ Map legend repositioned below upload button
- ✅ Fixed empty field preservation in configs
- ✅ RSRP visibility toggle in KPI charts

**v2.0**
- Full edit mode for all fields
- KPI visualization panel
- Save/load configurations

**v1.0**
- Basic CSV visualization
- Map-based drive test display

---

## 🎨 Professional NOC-Style Features

### **Compact KPI Stat Cards**
- **100px height** - Optimized for maximum chart space
- **Monospace typography** - Professional telemetry appearance
- **Icons & status dots** - Visual hierarchy and signal quality indicators
- **Mini sparklines** - 20-point trend visualization per card
- **Trend arrows** - Color-coded percentage change indicators

### **Interactive Elements**
- **Hover effects** - Cards lift with enhanced shadow
- **LIVE indicator** - Pulsing green dot shows real-time data
- **Dynamic status dots** - Color changes based on signal quality:
  - 🟢 Green: ≥ -80 dBm (Excellent)
  - 🔵 Blue: -80 to -90 dBm (Good)
  - 🟡 Yellow: -90 to -100 dBm (Fair)
  - 🔴 Red: < -100 dBm (Poor)

### **Smooth Animations**
- Value updates with scale pulse
- Trend arrows with bounce effect
- Status dots with glow animation
- All GPU-accelerated for 60fps performance

---

## 📚 Additional Documentation

- **USER-GUIDE.md** - Comprehensive user guide for all dashboard features
- **CHANGES_SUMMARY.md** - Technical documentation of recent changes and improvements

---

**Remember**: This is a universal template. Customize it for ANY telecom test case type! 🎯
