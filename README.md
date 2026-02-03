# LTE Handover Validation Dashboard - ENHANCED EDITABLE VERSION

A professional telecom network validation dashboard for creating **customizable test case presentations** with editable fields, custom KPIs, and client-ready exports.

## 🆕 NEW FEATURES (Enhanced Version)

### ✏️ **Full Edit Mode**
- Toggle edit mode to make ALL fields editable (except map and footer)
- Click on any text to modify: titles, routes, device info, KPIs, parameters, L3 messages, verdicts
- Visual indicators show which fields are editable (orange dashed outlines)

### 📊 **Custom KPIs & Pass/Fail Criteria**
- Add/remove KPI cards dynamically
- Edit labels, values, and pass/fail status
- Perfect for creating custom test reports per drive test scenario

### 📡 **Auto-Populating L3 Message Flow**
- L3 messages automatically populate from CSV event data
- Manual editing enabled - add custom notes or modify auto-generated entries
- Delete unwanted messages with one click

### 💾 **Save & Load Test Configurations**
- Save entire dashboard configuration as JSON file
- Load previously saved configs to reuse test templates
- Create library of standard test case formats

### 📸 **Export to Image**
- One-click export of entire dashboard as high-resolution PNG
- Perfect for client presentations and internal reports
- Clean export (control buttons hidden automatically)

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
- **Header**: Click on title, operator, route, status, reference, device to edit
- **KPIs**: Click "+" to add new KPIs, "✕" to delete, or click values to edit
- **L3 Messages**: Auto-populated from CSV, but fully editable
- **Network Parameters**: Add custom parameters relevant to your test
- **Test Verdict**: Write your conclusion

### 4. **Save Configuration**
```
Click "💾 SAVE CONFIG" to download JSON file
Name it meaningfully (e.g., "handover-test-template.json")
```

### 5. **Export Presentation**
```
Turn OFF edit mode first (clean appearance)
Click "📸 EXPORT" to download PNG image
Share with clients or include in reports
```

---

## 📋 CSV Format Requirements

### Required Columns:
```csv
#,time,latitude,longitude,rsrp,rsrq,sinr,pci,band,event
```

### Example Row:
```csv
1,2024-01-15T10:30:45,3.8480,11.5021,-85,-10,15,123,1800,handover
2,2024-01-15T10:30:50,3.8485,11.5025,-87,-11,14,124,1800,
3,2024-01-15T10:30:55,3.8490,11.5030,-90,-12,12,125,1800,rrc_setup
```

### Event Types Supported:
| Event | Icon | Description |
|-------|------|-------------|
| `handover` | ↔ | LTE handover event |
| `rrc_setup` | ▶ | RRC connection setup |
| `rrc_release` | ⏹ | RRC connection release |
| `attach` | ⚡ | Network attach |
| `detach` | 🔌 | Network detach |
| `rlf` | ⚠ | Radio Link Failure |
| `cell_reselection` | 📶 | Cell reselection |
| `service_request` | 📡 | Service request |

---

## 🎯 Use Cases

### **Scenario 1: Handover Validation Test**
```
1. Load handover-specific CSV
2. Edit title: "INTER-FREQUENCY HANDOVER VALIDATION"
3. Add KPIs: HO Success Rate, HO Latency, Drop Call Rate
4. Set pass criteria: >95%, <500ms, <0.5%
5. Save as "handover-test-template.json"
6. Export final report
```

### **Scenario 2: Coverage Hole Analysis**
```
1. Load drive test with poor RSRP zones
2. Edit title: "COVERAGE GAP INVESTIGATION - ROUTE XYZ"
3. Add KPIs: % Area <-110dBm, Peak RSRP, Min RSRP
4. Manually edit L3 messages to highlight RLF events
5. Write verdict with recommended cell site locations
6. Export for client presentation
```

### **Scenario 3: Before/After Optimization**
```
1. Load "before" CSV → Export as "before-optimization.png"
2. Click "📂 LOAD CONFIG" → Reload same test template
3. Upload "after" CSV
4. Update KPI values to show improvement
5. Update verdict: "30% improvement in HO success rate"
6. Export as "after-optimization.png"
7. Present side-by-side comparison to client
```

---

## 🛠️ Technical Details

### Default KPIs (Editable):
- **HO Success Rate**: Percentage of successful handovers
- **Video Continuity**: Service continuity during mobility
- **Avg RSRP**: Average signal strength across route
- **RLF Events**: Count of radio link failures

### Default Network Parameters (Editable):
- **TTT (Time to Trigger)**: Handover decision timing
- **Hysteresis**: Signal quality threshold buffer
- **A3 Offset**: Inter-frequency handover offset
- **Cell Individual Offset**: Per-cell handover bias

### L3 Message Auto-Population:
```javascript
// Automatically extracts events from CSV:
[10:30:45] HANDOVER | PCI: 123 | RSRP: -85 dBm
[10:31:02] RRC SETUP | PCI: 124 | RSRP: -87 dBm
[10:31:15] RLF | PCI: 125 | RSRP: -110 dBm
```

---

## 💡 Pro Tips

### Creating Reusable Templates:
1. Set up your standard test format once
2. Save configuration (without CSV loaded)
3. For each new test: Load config → Upload CSV → Edit specific values

### Client Presentations:
1. **Before meeting**: Prepare 3-5 test scenarios with saved configs
2. **During meeting**: Load relevant config, show live map, export on demand
3. **After meeting**: Email exported PNG reports

### Quality Assurance Workflow:
1. **Field engineer**: Uploads CSV, fills basic info
2. **RF engineer**: Loads CSV + config, analyzes data, updates verdict
3. **Team lead**: Reviews, edits final verdict, exports for client

---

## 🔧 Configuration File Structure

```json
{
  "title": "MOBILITY VALIDATION : LTE Handover Report.",
  "operator": "OPERATOR: ORANGE CAMEROUN",
  "route": "ROUTE: TRADEX EMANA > NLONGKAK",
  "status": "STATUS: SUCCESS",
  "kpis": [
    {
      "label": "HO Success Rate",
      "value": "98.5%",
      "status": "pass"
    }
  ],
  "params": [
    {
      "label": "TTT (Time to Trigger)",
      "value": "320ms"
    }
  ],
  "l3Messages": [
    "[10:30:45] HANDOVER | PCI: 123 | RSRP: -85 dBm"
  ],
  "verdict": "Test passed all acceptance criteria."
}
```

---

## 📊 Signal Quality Thresholds (Industry Standard)

| Quality | RSRP Range | Color | Typical Use Case |
|---------|-----------|-------|------------------|
| Excellent | ≥ -80 dBm | 🟢 Green | Dense urban areas |
| Good | -80 to -90 dBm | 🔵 Blue | Suburban coverage |
| Fair | -90 to -100 dBm | 🟡 Yellow | Cell edge, acceptable |
| Poor | -100 to -110 dBm | 🟠 Orange | Coverage holes, HO zones |
| Very Poor | < -110 dBm | 🔴 Red | Critical weak spots |

---

## 🎨 Design Philosophy

**Neo-Brutalist Technical Aesthetic:**
- Heavy black borders for authority and structure
- Orange Cameroun brand integration (subtle grid overlay)
- Monospace font (JetBrains Mono) for technical credibility
- CRT scanline effect for retro-tech character
- Bold shadows and high contrast for presentation clarity

---

## 🚫 Non-Editable Sections (By Design)

1. **Map Area**: Visualization should remain objective data representation
2. **Footer**: Copyright and confidentiality notice are corporate standard
3. **Legend**: Signal quality standards are industry-defined

---

## 📱 Browser Compatibility

- ✅ **Chrome/Edge** (Recommended for export feature)
- ✅ **Firefox** (Full functionality)
- ✅ **Safari** (Map rendering may vary slightly)

---

## 🔐 Data Privacy & Security

- **All processing is client-side** (no data sent to servers)
- CSV files never leave your browser
- Configurations stored as local JSON files
- Safe for confidential Orange Cameroun test data

---

## 📖 Standards Compliance

- **3GPP TS 36.331** - LTE RRC Protocol Specification
- **3GPP TS 36.133** - Requirements for support of radio resource management
- **ETSI TS 136.213** - Physical layer procedures

---

## 🤝 Workflow Integration

### For Individual RF Engineers:
```
Drive Test → Upload CSV → Auto-populate → Edit custom fields → Export → Email
```

### For RF Optimization Teams:
```
Standardize Templates → Share JSON configs → Consistent reporting → Quality metrics tracking
```

### For Client Presentations:
```
Load template → Upload latest data → Live demo on projector → Export on-demand → Professional deliverables
```

---

## 🆘 Troubleshooting

**Q: My CSV doesn't auto-populate L3 messages**
- Check that your CSV has an "event" column
- Event names must match: handover, rrc_setup, rlf, etc.
- Empty event fields are ignored (by design)

**Q: Edit mode shows outline but text won't change**
- Make sure edit mode is actually ON (button should be green)
- Click directly on the text, not the container
- Some browsers may need page refresh after CSV upload

**Q: Export creates blank image**
- Turn OFF edit mode before exporting (outlines affect rendering)
- Allow popup/download permission for the site
- Try Chrome if using other browsers

**Q: My saved config won't load**
- Ensure JSON file is from this dashboard version
- Check file isn't corrupted (should be valid JSON)
- Try creating a fresh config and saving again

---

## 📧 Orange Cameroun RF Optimization Team

**Version**: 2.0 (Enhanced Editable)  
**Last Updated**: February 2026  
**Maintained By**: RF Optimization Team  
**Classification**: CONFIDENTIAL - INTERNAL USE ONLY  

---

## 🎓 Training Resources

**For new team members:**
1. Watch drive test workflow demo (ask team lead)
2. Practice with sample CSV files
3. Create your first test template
4. Review exported reports with senior engineer

**Standard templates available:**
- Handover validation test
- Coverage hole investigation
- RLF mitigation verification
- Inter-frequency mobility test
- Voice call continuity test

---

## 🔄 Version History

**v2.0 (Current)**
- ✅ Full edit mode for all fields
- ✅ Custom KPI management
- ✅ Auto-populating L3 messages
- ✅ Save/load configurations
- ✅ Export to PNG image

**v1.0 (Original)**
- Basic CSV visualization
- Static dashboard layout
- Map-based drive test display

---

## 📞 Support

For issues or feature requests:
- Contact RF Optimization Team Lead
- Submit feedback via team channel
- Check internal wiki for updates

---

**Remember**: This tool is designed for flexibility. Every test case is unique - customize freely to meet your specific validation requirements! 🎯
