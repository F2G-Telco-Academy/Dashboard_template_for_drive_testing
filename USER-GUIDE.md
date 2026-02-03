# ORANGE CAMEROUN - RF OPTIMIZATION TEAM
## LTE Handover Dashboard - Complete User Guide

---

## 📋 TABLE OF CONTENTS

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Feature Overview](#feature-overview)
4. [Step-by-Step Workflows](#workflows)
5. [Advanced Tips](#advanced-tips)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## 1. INTRODUCTION

### What This Tool Does

This dashboard transforms raw drive test CSV data into **professional, customizable test case presentations** for:
- Client demonstrations
- Internal QA reviews
- Network optimization documentation
- Before/after comparison reports

### Key Capabilities

✅ **Editable Everything** - Customize every field except map and footer
✅ **Smart Auto-Population** - L3 messages extract automatically from CSV events
✅ **Template System** - Save and reuse test configurations
✅ **Export Ready** - One-click PNG export for presentations
✅ **No Installation** - Works directly in browser via Netlify

---

## 2. GETTING STARTED

### Step 1: Access the Dashboard

Open your browser and navigate to:
```
https://handoverdashboard.netlify.app/
```

### Step 2: Prepare Your CSV File

Ensure your drive test CSV has these columns:
```
#,time,latitude,longitude,rsrp,rsrq,sinr,pci,band,event
```

**Example CSV row:**
```csv
1,2024-02-02T10:30:00,3.8480,11.5021,-85,-10,15,301,1800,handover
```

### Step 3: Upload CSV

1. Click **"📁 UPLOAD CSV"** button (top-left of map)
2. Select your CSV file
3. Map automatically renders with color-coded signal quality
4. L3 messages auto-populate from events

### Step 4: Enable Edit Mode

Click **"✏️ EDIT MODE: OFF"** button (top-right)
- Button turns green: "EDIT MODE: ON"
- All editable fields show orange dashed outlines
- You can now click and modify any field

---

## 3. FEATURE OVERVIEW

### 🎯 Edit Mode Toggle

**Location:** Top-right corner  
**Function:** Enable/disable editing for all fields

**When ACTIVE:**
- Text fields become editable
- Orange outlines indicate editable areas
- "Add" and "Delete" buttons appear for KPIs/Parameters

**When INACTIVE:**
- Clean presentation view
- Fields are read-only
- Better for screenshots/exports

### 📊 KPI Management

**Location:** Section 01 - Performance Summary

**What You Can Do:**
- ✏️ Edit existing KPI labels and values
- ➕ Add new KPIs (click "+ ADD KPI")
- ❌ Delete KPIs (click "✕" on each card)
- ✓/✗ Toggle pass/fail status

**Example KPIs:**
- Handover Success Rate
- Call Drop Rate
- Average RSRP
- RLF Count
- Video Continuity %
- Data Throughput

### 📡 L3 Message Flow

**Location:** Section 02 - L3 Message Flow

**Auto-Population:**
When you upload a CSV with event data, messages automatically generate:
```
[10:30:30] HANDOVER | PCI: 302 | RSRP: -88 dBm
[10:31:00] RRC SETUP | PCI: 303 | RSRP: -92 dBm
```

**Manual Editing:**
- Click on any message to edit
- Add custom notes or clarifications
- Delete unwanted messages (click "✕")

### 🔧 Network Parameters

**Location:** Section 03 - Network Parameters

**Typical Parameters:**
- TTT (Time to Trigger)
- Hysteresis
- A3 Offset
- Cell Individual Offset
- Measurement gaps
- Filter coefficients

**Management:**
- Add custom parameters for your test scenario
- Edit values to reflect actual network config
- Delete irrelevant parameters

### ✅ Test Verdict

**Location:** Section 04 - Test Verdict

**Purpose:**
Write your analysis conclusion, recommendations, and approval status.

**Example Verdicts:**
```
✓ PASS - All handover events successful. Zero RLF occurrences. 
Network ready for commercial service.

✗ FAIL - 3 RLF events detected in coverage hole area (lat: 3.8590, lon: 11.5130). 
RECOMMENDATION: Install infill cell at identified location.
```

### 💾 Save Configuration

**Location:** Top-right "SAVE CONFIG" button

**What It Saves:**
- All header text (title, operator, route, status, device, reference)
- Complete KPI set with labels, values, pass/fail status
- Network parameters
- L3 messages (even manually edited ones)
- Test verdict

**Output:** JSON file named `test-case-config-[timestamp].json`

**Use Cases:**
1. Create template for standard test types
2. Save work-in-progress
3. Share config with team members
4. Archive historical test formats

### 📂 Load Configuration

**Location:** Top-right "LOAD CONFIG" button

**Function:**
Restore previously saved dashboard configuration

**Workflow:**
1. Click "LOAD CONFIG"
2. Select JSON file
3. All fields populate instantly
4. Upload new CSV to apply config to different drive test data

### 📸 Export to Image

**Location:** Top-right "EXPORT" button

**Best Practice:**
1. **Turn OFF edit mode first** (removes orange outlines)
2. Ensure map is properly zoomed
3. Click "EXPORT"
4. PNG file downloads automatically

**Output Quality:**
- High-resolution PNG (2x scale)
- Clean professional appearance
- Ready for PowerPoint/PDF inclusion

---

## 4. STEP-BY-STEP WORKFLOWS

### Workflow A: Creating Your First Test Report

**Scenario:** You've completed a handover validation drive test.

**Steps:**

1️⃣ **Upload CSV**
```
Click "📁 UPLOAD CSV" → Select drive-test-20240202.csv
```

2️⃣ **Enable Edit Mode**
```
Click "✏️ EDIT MODE: OFF" to activate editing
```

3️⃣ **Update Header**
```
Click on title → Type: "HANDOVER VALIDATION - EMANA ROUTE"
Click on route → Type: "ROUTE: TRADEX > NLONGKAK > CENTRE VILLE"
Click on device → Type: "TEST DEVICE: SAMSUNG S23 ULTRA"
```

4️⃣ **Review Auto-Populated L3 Messages**
```
Section 02 shows extracted events from CSV
Edit any messages if needed for clarity
```

5️⃣ **Customize KPIs**
```
Edit "HO Success Rate" value to match your data
Add new KPI: Click "+ ADD KPI" → Label: "Call Drop Rate" → Value: "0%"
```

6️⃣ **Update Network Parameters**
```
Verify TTT, Hysteresis values match network configuration
Add custom parameters if testing specific features
```

7️⃣ **Write Verdict**
```
Click on verdict text → Type your analysis and conclusion
Example: "All handover events successful. Network approved for deployment."
```

8️⃣ **Save & Export**
```
Turn OFF edit mode
Click "💾 SAVE CONFIG" to backup
Click "📸 EXPORT" to create presentation PNG
```

---

### Workflow B: Creating Reusable Templates

**Scenario:** You perform the same test type weekly and want standardized format.

**Steps:**

1️⃣ **Create Template Dashboard**
```
Do NOT upload any CSV yet
Enable edit mode
```

2️⃣ **Configure Standard Layout**
```
Title: "WEEKLY HANDOVER VALIDATION TEST"
Operator: "OPERATOR: ORANGE CAMEROUN"
Status: "STATUS: [TO BE UPDATED]"

KPIs:
- HO Success Rate: [TBD]
- Avg RSRP: [TBD]
- RLF Events: [TBD]

Parameters:
- TTT: 320ms
- Hysteresis: 3dB
(These are your standard values)

Verdict: "[To be completed after test analysis]"
```

3️⃣ **Save Template**
```
Click "💾 SAVE CONFIG"
Name: weekly-handover-template.json
Store in shared team folder
```

4️⃣ **Using Template Each Week**
```
Week 1: Load template → Upload CSV → Update [TBD] values → Save as "week1-handover.json" → Export
Week 2: Load template → Upload CSV → Update [TBD] values → Save as "week2-handover.json" → Export
Week 3: Repeat...
```

---

### Workflow C: Before/After Optimization Comparison

**Scenario:** You optimized TTT parameter and want to show improvement.

**Steps:**

1️⃣ **Create "Before" Report**
```
Upload before-optimization.csv
Edit title: "PRE-OPTIMIZATION BASELINE TEST"
Update KPIs with "before" values:
  - HO Success Rate: 94.2%
  - RLF Events: 5
  
Verdict: "Multiple RLF events detected. TTT optimization required."
Export as "before-optimization.png"
Save config as "before-config.json"
```

2️⃣ **Create "After" Report**
```
Load "before-config.json" (reuses same template)
Change title: "POST-OPTIMIZATION VALIDATION TEST"
Upload after-optimization.csv
Update KPIs with "after" values:
  - HO Success Rate: 99.1% ← Improved!
  - RLF Events: 0 ← Fixed!

Update parameters:
  - TTT: 480ms ← New optimized value

Verdict: "TTT optimization successful. 4.9% improvement in HO success. Zero RLF events."
Export as "after-optimization.png"
```

3️⃣ **Present Side-by-Side**
```
Insert both PNGs in PowerPoint
Add arrow showing improvement
Client sees clear visual evidence of optimization impact
```

---

### Workflow D: Client Presentation Live Demo

**Scenario:** Client meeting in 30 minutes, need to show fresh drive test results.

**Quick Prep:**

1️⃣ **Pre-load Template**
```
Load your standard client-presentation-template.json
Ensures consistent branding and format
```

2️⃣ **During Meeting**
```
Client: "Show us today's handover performance"
You: Upload today's CSV → Data populates instantly
You: Highlight key KPIs on screen
You: Scroll through L3 message timeline
```

3️⃣ **On-Demand Export**
```
Client: "Can we get a copy of this report?"
You: Click EXPORT → PNG downloads
You: Email report while still in meeting
Professional delivery, no delay
```

---

## 5. ADVANCED TIPS

### Tip 1: Color-Coding Pass/Fail Status

**KPI Status Field:** When editing, type exactly:
- `PASS` or `✓ PASS` → Green color
- `FAIL` or `✗ FAIL` → Red color

**Pro Tip:** Add emojis for visual impact:
```
✓ PASS ✅
✗ FAIL ❌
⚠ WARNING ⚠️
```

### Tip 2: Rich L3 Message Formatting

**Basic Format (Auto-Generated):**
```
[10:30:30] HANDOVER | PCI: 302 | RSRP: -88 dBm
```

**Enhanced Format (Manual Edit):**
```
[10:30:30] HANDOVER (INTER-FREQ) | 1800MHz→800MHz | SOURCE PCI: 301 → TARGET PCI: 302 | RSRP: -88 dBm | ✓ SUCCESS
```

### Tip 3: Multi-Line Verdicts

**Short Verdict:**
```
Test passed all acceptance criteria.
```

**Detailed Verdict:**
```
✓ PASS - Handover performance meets 3GPP standards.

KEY FINDINGS:
- 12 handover events, 98.7% success rate
- Zero RLF occurrences
- Average execution time: 45ms (target: <50ms)

RECOMMENDATIONS:
- Current TTT configuration (320ms) approved
- Monitor inter-frequency HO performance weekly
- Consider A3 offset adjustment for cell 305 (weak RSRP zone)

APPROVAL: Ready for commercial deployment.
```

### Tip 4: Custom KPI Categories

**Beyond Standard Metrics:**

**Capacity Testing:**
- Active Users: 450
- PRB Utilization: 68%
- Peak Throughput: 85 Mbps

**Coverage Analysis:**
- Area >-100dBm: 95%
- Coverage Holes: 2
- RSRP Std Dev: 8.2 dB

**Interference Study:**
- Avg SINR: 14 dB
- RSRQ Avg: -10.5 dB
- Interference Events: 3

### Tip 5: Organize Multiple Test Configs

**Naming Convention:**
```
[TEST-TYPE]-[LOCATION]-[DATE].json

Examples:
handover-tradex-route-20240202.json
coverage-nlongkak-20240202.json
rlf-investigation-emana-20240202.json
```

**Folder Structure:**
```
test-configs/
  ├── templates/
  │   ├── handover-template.json
  │   ├── coverage-template.json
  │   └── rlf-template.json
  ├── 2024-02/
  │   ├── week1/
  │   ├── week2/
  │   └── week3/
  └── client-reports/
      ├── orange-cmr-monthly.json
      └── quarterly-review.json
```

---

## 6. TROUBLESHOOTING

### Problem: CSV Upload Shows No Data

**Possible Causes:**
- Column headers don't match expected format
- Missing required columns (latitude, longitude, rsrp)
- CSV file encoding issue

**Solutions:**
1. Verify CSV has header row: `#,time,latitude,longitude,rsrp,...`
2. Check file is UTF-8 encoded
3. Open CSV in text editor - ensure comma-separated (not semicolon)
4. Try sample CSV file first to test functionality

---

### Problem: L3 Messages Not Auto-Populating

**Possible Causes:**
- CSV "event" column is empty
- Event names don't match recognized types
- CSV hasn't finished uploading

**Solutions:**
1. Check CSV has "event" column
2. Verify event names match: `handover`, `rrc_setup`, `rlf`, etc. (lowercase, underscores)
3. Wait 2-3 seconds after upload for processing
4. If still empty, manually add messages (they're editable)

**Valid Event Names:**
```
handover
rrc_setup
rrc_release
attach
detach
rlf
cell_reselection
service_request
```

---

### Problem: Edit Mode Not Working

**Symptoms:**
- Button says "ON" but fields won't edit
- Orange outlines show but text won't change

**Solutions:**
1. Refresh page and try again
2. Clear browser cache
3. Try different browser (Chrome recommended)
4. Make sure you're clicking directly on text, not container
5. Check JavaScript isn't blocked

---

### Problem: Export Creates Blank/Corrupted Image

**Possible Causes:**
- Edit mode still active (orange outlines interfere)
- Browser popup blocker
- Insufficient memory for large dashboard

**Solutions:**
1. **Always turn OFF edit mode before exporting**
2. Allow popups/downloads for the site
3. Close other browser tabs to free memory
4. Try Chrome browser (best export compatibility)
5. Zoom browser to 100% before export

---

### Problem: Saved Config Won't Load

**Possible Causes:**
- JSON file corrupted
- Config from incompatible version
- Browser file access restrictions

**Solutions:**
1. Open JSON in text editor - verify it's valid JSON format
2. Check file size isn't 0 bytes
3. Try loading a fresh sample config file first
4. Re-save current dashboard state as new config

---

## 7. BEST PRACTICES

### For Individual RF Engineers

**Daily Workflow:**
1. Start each test with template load
2. Upload fresh CSV
3. Update date-specific fields only
4. Quick review, quick export
5. Archive config + CSV together

**Quality Checks:**
- Always verify auto-populated L3 messages match CSV
- Double-check KPI calculations
- Review verdict for typos before export
- Save config before exporting (backup)

---

### For Team Leads

**Team Standardization:**
1. Create official templates for each test type
2. Store in shared drive
3. Mandate use of templates for consistency
4. Review exported reports weekly

**Config Library:**
```
Must-Have Templates:
✓ Weekly handover validation
✓ Coverage hole investigation
✓ RLF troubleshooting
✓ Pre/post optimization comparison
✓ Client presentation standard
```

---

### For Client Presentations

**Preparation:**
1. Load client-specific template (with logo/branding if customized)
2. Use professional language in verdicts
3. Remove technical jargon from KPI labels
4. Export at highest quality

**During Meeting:**
- Have 2-3 test configs pre-loaded
- Be ready to upload fresh CSV on demand
- Export reports while client reviews
- Immediate email delivery

---

### For Optimization Projects

**Before Optimization:**
- Capture comprehensive baseline
- Document all network parameters
- Save "before" config for comparison
- Include detailed L3 message flow

**After Optimization:**
- Use same template as "before" test
- Highlight improvements in verdict
- Side-by-side export comparison
- Document parameter changes

---

## KEYBOARD SHORTCUTS

| Action | Shortcut |
|--------|----------|
| Toggle Edit Mode | Alt + E |
| Export Dashboard | Alt + X |
| Save Config | Ctrl + S* |
| Upload CSV | Ctrl + O* |

*Shortcuts trigger browser's default file dialogs

---

## SUPPORT & FEEDBACK

**Technical Issues:**
Contact: RF Optimization Team Lead

**Feature Requests:**
Submit via: Team collaboration channel

**Training:**
New team members: Request dashboard walkthrough session

---

**Document Version:** 2.0  
**Last Updated:** February 2026  
**Author:** RF Optimization Team  
**Classification:** INTERNAL USE ONLY  

---

## QUICK REFERENCE CARD

**4-Step Workflow:**
1. Upload CSV
2. Enable Edit Mode
3. Customize Fields
4. Export Report

**Remember:**
- ✏️ Edit mode = Orange outlines
- 💾 Save often
- 📸 Turn OFF edit before export
- 📁 Name configs clearly

**Emergency Checklist:**
- [ ] CSV uploaded
- [ ] Title updated
- [ ] KPIs accurate
- [ ] Verdict written
- [ ] Edit mode OFF
- [ ] Export successful

---

**END OF USER GUIDE**
