# Telecom Drive Test Dashboard - Universal Template

A professional telecom network validation dashboard for creating **customizable test case presentations** with editable fields, KPI visualization, and client-ready exports.

## 🆕 KEY FEATURES

### ✏️ **Full Edit Mode**
- Toggle edit mode to make ALL fields editable
- Click on any text to modify: titles, routes, device info, analysis sections
- Visual indicators show which fields are editable (orange dashed outlines)
- Guided placeholder text in all sections

### 📊 **KPI Visualization**
- Real-time signal quality charts (RSRP, RSRQ, SINR, PCI)
- Toggle visibility of individual KPI lines
- PCI changes tracking with handover detection
- Multi-KPI comparison charts
- Statistics and signal quality distribution

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

### 4. **View KPIs**
```
Click "📊 KPIs" button to view signal quality charts
Toggle individual KPI visibility with checkboxes
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

---

## 📋 CSV Format Requirements

### Required Columns:
```csv
#,time,latitude,longitude,rsrp,rsrq,sinr,pci,band,event
```

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

### **Workflow Example**
```
1. Upload drive test CSV
2. Edit title: "[Your Test Type] : [Your Test Name]"
3. Fill in 4 analysis sections with your findings
4. View KPI charts for data validation
5. Save configuration for future reference
6. Present to client or team
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

---

## 📖 Standards Compliance

- **3GPP TS 36.331** - LTE RRC Protocol Specification
- **3GPP TS 36.133** - Radio resource management requirements
- **ETSI TS 136.213** - Physical layer procedures

---

## 🔄 Version History

**v3.0 (Current - Universal Template)**
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

**Remember**: This is a universal template. Customize it for ANY telecom test case type! 🎯
