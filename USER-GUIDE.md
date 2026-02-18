# TELECOM DRIVE TEST DASHBOARD - USER GUIDE

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
- Any telecom test case type (handover, coverage, interference, capacity, etc.)
- Client demonstrations
- Internal QA reviews
- Network optimization documentation
- Before/after comparison reports

### Key Capabilities

✅ **Universal Template** - Works for ANY telecom test case type
✅ **Editable Everything** - Customize all fields with guided placeholders
✅ **KPI Visualization** - Interactive charts with toggle controls
✅ **Template System** - Save and reuse test configurations
✅ **Smart Save** - Choose location and filename when saving
✅ **No Installation** - Works directly in browser

---

## 2. GETTING STARTED

### Step 1: Access the Dashboard

Open your browser and navigate to your dashboard URL.

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
- "Add" buttons appear for additional fields

**When INACTIVE:**
- Clean presentation view
- Fields are read-only
- Better for screenshots/exports

### 📊 KPI Visualization

**Location:** Click "📊 KPIs" button

**Features:**
- Real-time signal quality charts (RSRP, RSRQ, SINR, PCI)
- Toggle individual KPI visibility with checkboxes
- PCI changes tracking with handover detection
- Statistics and signal quality distribution
- Multi-KPI comparison charts

### 💾 Save Configuration

**Location:** Top-right "💾 SAVE" button

**What It Saves:**
- All header text (title, operator, route, status, device, reference)
- All 4 analysis sections content
- Additional fields you've added

**Chrome/Edge Users:**
- Native "Save As" dialog appears
- Choose location and filename

**Other Browsers:**
- Filename prompt appears
- Saves to default download folder

### 📂 Load Configuration

**Location:** Top-right "📂 LOAD" button

**Function:**
Restore previously saved dashboard configuration

**Workflow:**
1. Click "LOAD"
2. Select JSON file
3. All fields populate instantly (including empty ones)
4. Upload new CSV to apply config to different drive test data

### 🔄 Reset Dashboard

**Location:** Top-right "🔄 RESET" button

**Function:**
Clear all customizations and return to clean template state

**Use When:**
- Starting a completely new test case
- Template placeholders not showing
- Need to clear cached data

---

## 4. STEP-BY-STEP WORKFLOWS

### Workflow A: Creating Your First Test Report

**Scenario:** You've completed a drive test.

**Steps:**

1️⃣ **Upload CSV**
```
Click "📁 UPLOAD CSV" → Select your CSV file
```

2️⃣ **Enable Edit Mode**
```
Click "✏️ EDIT MODE: OFF" to activate editing
```

3️⃣ **Update Header**
```
Click on title → Type: "[Your Test Type] : [Your Test Name]"
Click on operator → Type: "OPERATOR: [Your Operator]"
Click on route → Type: "ROUTE: [Start] > [End]"
Click on status → Type: "STATUS: [Test Status]"
```

4️⃣ **Fill Analysis Sections**
```
Section 01 - Performance Summary: Add your KPI summary
Section 02 - Impacts: Describe network/user impacts
Section 03 - Analysis: Technical analysis details
Section 04 - Recommendations: Your recommendations
```

5️⃣ **View KPIs**
```
Click "📊 KPIs" button to view charts
Toggle checkboxes to show/hide specific KPIs
```

6️⃣ **Save & Export**
```
Turn OFF edit mode
Click "💾 SAVE" → Choose location and filename
```

---

### Workflow B: Creating Reusable Templates

**Scenario:** You perform the same test type regularly.

**Steps:**

1️⃣ **Create Template Dashboard**
```
Do NOT upload any CSV yet
Enable edit mode
```

2️⃣ **Configure Standard Layout**
```
Title: "[Your Standard Test Type] : [Test Name]"
Operator: "OPERATOR: [Your Operator]"
Status: "STATUS: [To Be Updated]"

Fill in standard text for your 4 sections
```

3️⃣ **Save Template**
```
Click "💾 SAVE"
Name: standard-test-template.json
Store in accessible location
```

4️⃣ **Using Template Each Time**
```
Load template → Upload CSV → Update specific values → Save as new config
```

---

### Workflow C: Before/After Optimization Comparison

**Scenario:** You optimized network and want to show improvement.

**Steps:**

1️⃣ **Create "Before" Report**
```
Upload before-optimization.csv
Edit title: "PRE-OPTIMIZATION BASELINE TEST"
Fill in analysis sections with "before" findings
Save config as "before-config.json"
```

2️⃣ **Create "After" Report**
```
Load "before-config.json" (reuses same template)
Change title: "POST-OPTIMIZATION VALIDATION TEST"
Upload after-optimization.csv
Update analysis sections with "after" findings
Save as "after-config.json"
```

3️⃣ **Present Side-by-Side**
```
Show both dashboards
Highlight improvements in KPI charts
Client sees clear visual evidence
```

---

## 5. ADVANCED TIPS

### Tip 1: Using Placeholder Text

**Default placeholders guide you:**
```
"Click on edit mode to add your performance summary here."
"Click on edit mode to add your impacts analysis here."
"Click on edit mode to add your technical analysis here."
"Click on edit mode to add your recommendations here."
```

**Replace with your actual content when editing.**

### Tip 2: Multi-Line Content

**You can add detailed multi-line content:**
```
PERFORMANCE SUMMARY:
- 12 handover events, 98.7% success rate
- Zero RLF occurrences
- Average RSRP: -85 dBm

KEY FINDINGS:
- Coverage excellent in urban areas
- Weak spots identified at 3 locations
```

### Tip 3: Empty Fields

**If you want a section empty:**
- Delete all text in edit mode
- Save configuration
- Empty fields will remain empty when loaded

### Tip 4: Organize Multiple Test Configs

**Naming Convention:**
```
[TEST-TYPE]-[LOCATION]-[DATE].json

Examples:
handover-route-a-20240202.json
coverage-downtown-20240202.json
interference-study-20240202.json
```

### Tip 5: KPI Chart Customization

**Toggle visibility:**
- Uncheck RSRP to hide RSRP line
- Uncheck RSRQ to hide RSRQ line
- Uncheck SINR to hide SINR line
- View only the KPIs relevant to your test

---

## 6. TROUBLESHOOTING

### Problem: CSV Upload Shows No Data

**Solutions:**
1. Verify CSV has header row: `#,time,latitude,longitude,rsrp,...`
2. Check file is UTF-8 encoded
3. Ensure comma-separated (not semicolon)
4. Try sample CSV file first

---

### Problem: Template Placeholders Not Showing

**Solutions:**
1. Click **RESET** button to clear cached data
2. Open in incognito/private window
3. Clear localStorage: F12 → Console → `localStorage.clear()` → Refresh

---

### Problem: Edit Mode Not Working

**Solutions:**
1. Refresh page and try again
2. Clear browser cache
3. Try Chrome browser (recommended)
4. Click directly on text, not container

---

### Problem: Can't Choose Save Location

**Solutions:**
1. Use Chrome or Edge for "Save As" dialog
2. Other browsers use default download folder
3. Check browser allows file system access

---

### Problem: Saved Config Shows Default Text

**Solutions:**
1. This was fixed in latest version
2. Re-save your configuration
3. Empty fields now preserve correctly

---

## 7. BEST PRACTICES

### For Individual Engineers

**Daily Workflow:**
1. Start with template load
2. Upload fresh CSV
3. Update test-specific fields
4. View KPI charts for validation
5. Save config + export

**Quality Checks:**
- Verify all header fields updated
- Review analysis sections for completeness
- Check KPI charts match expectations
- Save before closing browser

---

### For Team Leads

**Team Standardization:**
1. Create official templates for each test type
2. Store in shared drive
3. Mandate use of templates for consistency
4. Review reports weekly

**Template Library:**
```
Must-Have Templates:
✓ Handover validation
✓ Coverage analysis
✓ Interference investigation
✓ Capacity testing
✓ RLF troubleshooting
```

---

### For Client Presentations

**Preparation:**
1. Load client-specific template
2. Use professional language
3. Remove technical jargon
4. Prepare multiple test scenarios

**During Meeting:**
- Have 2-3 configs pre-loaded
- Upload fresh CSV on demand
- Show KPI charts interactively
- Save and share immediately

---

## KEYBOARD SHORTCUTS

| Action | Shortcut |
|--------|----------|
| Toggle Edit Mode | Click button |
| Save Config | Click 💾 SAVE |
| Upload CSV | Click 📁 UPLOAD |
| View KPIs | Click 📊 KPIs |

---

## QUICK REFERENCE CARD

**4-Step Workflow:**
1. Upload CSV
2. Enable Edit Mode
3. Customize Fields
4. Save Configuration

**Remember:**
- ✏️ Edit mode = Orange outlines
- 💾 Save often
- 📊 View KPIs for validation
- 📁 Name configs clearly
- 🔄 RESET clears cache

**Emergency Checklist:**
- [ ] CSV uploaded
- [ ] Title updated
- [ ] All 4 sections filled
- [ ] Edit mode OFF
- [ ] Config saved

---

**Document Version:** 3.0  
**Last Updated:** 2026  
**Organization:** PKFOKAM48 - TELCO ACADEMY  
**Classification:** F2G SOLUTIONS - CONFIDENTIAL-INTERNAL USE ONLY  

---

**END OF USER GUIDE**
