# Telecom Drive Test Dashboard - Universal Template

A professional telecom network validation dashboard for creating **customizable test case presentations** with editable fields, KPI visualization, and client-ready exports.

## 🆕 KEY FEATURES

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
- Real-time signal quality charts (RSRP, RSRQ, SINR, CQI, MCS, BLER, Throughput)
- Multiple chart types: Line, Area, Bar
- **KPI Comparison Section** (7 separate time-series charts)
  - RSRP (dBm) - Independent optimized scale
  - RSRQ (dB) - Independent optimized scale
  - SINR (dB) - Independent optimized scale
  - Throughput DL (Mbps) - Independent optimized scale
  - BLER (%) - Dynamic scale based on actual data range
  - CQI - Independent optimized scale
  - MCS - Independent optimized scale
- **Correlation Analysis Section** (4 scatter plots)
  - Throughput vs SINR with percentile trend lines
  - Throughput vs RSRP with percentile trend lines
  - MCS vs CQI with percentile trend lines
  - Throughput vs BLER with percentile trend lines
- Each chart optimized for temporal pattern analysis
- Horizontal time labels with optimal spacing (5 ticks max)
- Interactive hover effects showing all values at each point
- Click-to-zoom functionality for detailed analysis
- Distribution histograms for all KPIs
- Statistics and signal quality distribution
- Grid/Table view modes

### 💾 **Save & Load Configurations**
- Save entire dashboard configuration as JSON file
- Choose save location and filename (Chrome/Edge)
- Load previously saved configs to reuse test templates
- Preserves empty fields correctly

### 🗺️ **Interactive Map**
- Drive test route visualization with color-coded signal quality
- Event markers: Handover, Attach, Detach, RLF, Cell Reselection, CSFB
- Legend positioned below upload button
- Dark/Light mode toggle
- Fullscreen support

---

## 🚀 Quick Start Guide

### 1. **Setup (First Time Only)**

**Clone Repository**
```bash
git clone https://github.com/F2G-Telco-Academy/Dashboard_template_for_drive_testing.git
cd Dashboard_template_for_drive_testing
```

**Configure API Key (for AI features)**
```bash
# 1. Copy environment template
cp .env.template .env.local

# 2. Get FREE Groq API key at: https://console.groq.com
# 3. Edit .env.local and add your key:
#    GROQ_API_KEY=gsk_your_actual_key_here

# 4. Open script.js (line ~2307) and replace:
#    const GROQ_API_KEY = 'YOUR_GROQ_API_KEY_HERE';
#    with your key from .env.local
```

**Launch App**
```bash
# Option A: VS Code Live Server (Recommended)
# - Install "Live Server" extension
# - Right-click index.html → "Open with Live Server"

# Option B: Python
python -m http.server 3000

# Option C: Node.js
npx http-server -p 3000
```

### 2. **Upload Your Drive Test CSV**
```
Click "📁 UPLOAD CSV" → Select your CSV file
```

### 3. **Use AI Auto-Analysis (Optional)**
```
Click "🤖 AI" button in top bar
Wait 10-20 seconds
AI generates content for all 4 sections:
- 01: Performance Summary
- 02: Impacts
- 03: Analysis
- 04: Recommendations
```

### 4. **Enable Edit Mode**
```
Click "✏️ EDIT MODE: OFF" to toggle ON
All editable fields will show orange dashed outlines
```

### 5. **Customize Your Test Case**
- **Header**: Edit test case type, name, operator, route, status, reference, device
- **4 Analysis Sections**: Add performance summary, impacts, analysis, recommendations
- **Add Fields**: Use "+" buttons to add additional fields per section
- **Format Text**: Use formatting toolbar at bottom (appears when edit mode is ON)
  - Select text → Apply bold, italic, underline
  - Change font size or color from dropdowns
  - All formatting preserved when saving

### 6. **View KPIs**
```
Click "📊 KPIs" button to view signal quality charts
Toggle individual KPI visibility with checkboxes
```

### 7. **Save Configuration**
```
Click "💾 SAVE" → Choose location and filename
Configuration saved as JSON file
```

### 8. **Load Configuration**
```
Click "📂 LOAD" → Select previously saved JSON file
All fields restored including empty ones
```

### 9. **Share with Client**
```
Click "🔗 SHARE" → Copy generated URL
Send URL to client for read-only view
Client sees dashboard with embedded data (no CSV upload needed)
```

---

## 🤖 AI Auto-Analysis

### **Features**
- ✅ Auto-generates Performance Summary
- ✅ Auto-generates Impacts analysis
- ✅ Auto-generates Technical Analysis (2 paragraphs)
- ✅ Auto-generates Recommendations (bullet points)
- ✅ HTML-formatted with color-coded findings
- ✅ Uses Groq AI (free unlimited tier)

### **Setup**
1. Get free API key at https://console.groq.com
2. Copy `.env.template` to `.env.local`
3. Add your key to `.env.local`
4. Update `script.js` line ~2307 with your key
5. Click "🤖 AI" button to generate

### **Important**
- ⚠️ Never commit `.env.local` to GitHub (already in `.gitignore`)
- ⚠️ Each team member needs their own key
- ✅ Keep your key in `.env.local` for reference

---

## 📋 CSV Format Requirements

### Required Columns:
```csv
#,time,latitude,longitude,rsrp,rsrq,sinr,pci,band,event,cqi,mcs,bler,throughput_dl_mbps,throughput_ul_mbps
```

### Minimum Required (for basic functionality):
```csv
#,time,latitude,longitude,rsrp,rsrq,sinr,pci,band,event
```

### Optional Columns (for enhanced comparison charts):
- `cqi` - Channel Quality Indicator (0-15)
- `mcs` - Modulation and Coding Scheme (0-28)
- `bler` - Block Error Rate (%)
- `throughput_dl_mbps` - Downlink Throughput (Mbps)
- `throughput_ul_mbps` - Uplink Throughput (Mbps)

### Example Rows:
```csv
1,2024-01-15T10:30:45,3.8480,11.5021,-85,-10,15,123,1800,handover
2,2024-01-15T10:30:50,3.8485,11.5025,-87,-11,14,124,1800,
3,2024-01-15T10:30:55,3.8490,11.5030,-90,-12,12,125,1800,attach
```

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
- **Time-based KPI correlation analysis** (NEW)
- **Signal quality vs throughput trends** (NEW)

### **Workflow Example**
```
1. Upload drive test CSV
2. Edit title: "[Your Test Type] : [Your Test Name]"
3. Fill in 4 analysis sections with your findings
4. View KPI charts and comparison section for data validation
5. Analyze KPI relationships in 4 professional scatter plots
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

| Quality | RSRP Range | Color | Typical Use Case |
|---------|-----------|-------|------------------|
| Excellent | ≥ -80 dBm | 🟢 Green | Dense urban areas |
| Good | -80 to -90 dBm | 🔵 Blue | Suburban coverage |
| Fair | -90 to -100 dBm | 🟡 Yellow | Cell edge, acceptable |
| Poor | -100 to -110 dBm | 🟠 Orange | Coverage holes |
| Very Poor | < -110 dBm | 🔴 Red | Critical weak spots |

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

---

## 📖 Standards Compliance

- **3GPP TS 36.331** - LTE RRC Protocol Specification
- **3GPP TS 36.133** - Radio resource management requirements
- **ETSI TS 136.213** - Physical layer procedures

---

## 🔄 Version History

**v3.4 (Current - Rich Text Formatting)**
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

## 📚 Additional Documentation

- **USER-GUIDE.md** - Comprehensive user guide for all dashboard features
- **CHANGES_SUMMARY.md** - Technical documentation of recent changes and improvements

---

**Remember**: This is a universal template. Customize it for ANY telecom test case type! 🎯
