
        // =====================================================
        // CONFIGURATION STATE
        // =====================================================
        let editMode = false;
        let csvData = null;
        let parsedData = [];
        let rawParsedData = []; // Store unfiltered data
        let currentTechFilter = 'all'; // Current technology filter
        let detectedTechnology = null; // Auto-detected technology
        let kpiChart = null;
        let compCqiMcs = null;
        let compCqiOnly = null;
        let compMcsOnly = null;
        let compSinrTput = null;
        let compSinrOnly = null;
        let compRsrqRsrp = null;
        let compRsrpOnly = null;
        let compRsrqOnly = null;
        let compBlerTput = null;
        let compTputOnly = null;
        let compTputUlOnly = null;
        let compBlerOnly = null;
        let compTxPowerOnly = null; // TxPower chart instance
        let scatterTputSinr = null;
        let scatterTputRsrp = null;
        let scatterMcsCqi = null;
        let scatterBlerTput = null;
        let kpiHistogramChart = null;
        let zoomedChart = null; // Zoom modal chart instance
        let polynomialDegree = 2; // Default: Quadratic (degree 2)
        let showingKPIs = false;
        let currentChartType = 'line';
        let currentKpiType = 'rsrp';
        let currentViewMode = 'table';
        let currentMapStyle = 'light'; // Track current map style (light/dark)
        let kpiTheme = 'light'; // Track KPI panel theme (light/dark)
        let map = null; // Map instance
        let markers = []; // Store markers for cleanup
        let layerIds = []; // Track added layer ids for cleanup
        let mapReady = false; // Track if map is fully loaded
        let currentConfig = {
            title: "[Test Case Type] : [Test Case Name]",
            operator: "OPERATOR: [Operator Name]",
            route: "ROUTE: [Start Location] > [End Location]",
            status: "STATUS: [Test Status]",
            reference: "REF: [Reference Standard]",
            device: "TEST DEVICE: [Device Model]",
            "performance-title": "01 : PERFORMANCE SUMMARY",
            "performance-content": "Click on 'Edit Mode' to add performance summary.",
            "impacts-title": "02 : IMPACTS",
            "impacts-content": "Click on 'Edit Mode' to add impacts analysis.",
            "analysis-title": "03 : ANALYSIS",
            "analysis-content": "Click on 'Edit Mode' to add technical analysis.",
            "recommendations-title": "04 : RECOMMENDATIONS",
            "recommendations-content": "Click on 'Edit Mode' to add recommendations.",
            "footer-left": "© 2026 PKFOKAM48 - TELCO ACADEMY",
            "footer-right": "F2G SOLUTIONS: CONFIDENTIAL-INTERNAL USE ONLY"
        };

        // Client View Detection - Use hash instead of query params to avoid 400 errors
        let encodedConfig = null;
        let isClientView = false;
        
        // Check URL hash first (new format)
        if (window.location.hash) {
            const hash = window.location.hash.substring(1); // Remove #
            const hashParams = new URLSearchParams(hash);
            encodedConfig = hashParams.get('config');
            const modeParam = hashParams.get('mode');
            isClientView = !!(encodedConfig || modeParam === 'view');
        }
        
        // Fallback to query params (old format for backward compatibility)
        if (!isClientView) {
            const urlParams = new URLSearchParams(window.location.search);
            encodedConfig = urlParams.get('config');
            const modeParam = urlParams.get('mode');
            isClientView = !!(encodedConfig || modeParam === 'view');
        }

        // Store default config for reset functionality
        const defaultConfig = { ...currentConfig };

        // Reset to default configuration
        function resetToDefault() {
            if (confirm('Are you sure you want to reset all content to default? This will clear all your changes and cannot be undone.')) {
                // Clear localStorage
                localStorage.removeItem('dashboardConfig');

                // Reset to default config and clear all additional fields
                currentConfig = { ...defaultConfig };
                currentConfig.additionalFields = {
                    performance: [],
                    impacts: [],
                    analysis: [],
                    recommendations: []
                };

                // Remove all additional fields from the DOM
                document.querySelectorAll('#performanceContainer .border-t').forEach(el => el.remove());
                document.querySelectorAll('#impactsContainer .border-t').forEach(el => el.remove());
                document.querySelectorAll('#analysisContainer .border-t').forEach(el => el.remove());
                document.querySelectorAll('#recommendationsContainer .border-t').forEach(el => el.remove());

                // Reset all editable fields to default
                document.querySelectorAll('.editable-field').forEach(el => {
                    const field = el.dataset.field;
                    if (field && currentConfig.hasOwnProperty(field)) {
                        el.innerHTML = currentConfig[field];
                    }
                });

                // Turn off edit mode
                if (editMode) {
                    document.getElementById('editModeBtn').click();
                }

                // Clear map and CSV state
                try {
                    clearMap();
                    csvData = null;
                    parsedData = [];
                    rawParsedData = [];
                    detectedTechnology = null;
                    currentTechFilter = 'all';
                    const techFilterEl = document.getElementById('techFilter');
                    if (techFilterEl) techFilterEl.value = 'all';
                    const pc = document.getElementById('pointCount');
                    if (pc) pc.textContent = '0';
                    if (map && typeof map.setCenter === 'function') {
                        map.setCenter([11.5021, 3.8480]);
                        map.setZoom(12);
                    }
                } catch (e) {
                    console.warn('Error clearing map during reset:', e);
                }

                // Destroy ALL Chart.js instances
                try {
                    if (kpiChart) { kpiChart.destroy(); kpiChart = null; }
                    if (kpiHistogramChart) { kpiHistogramChart.destroy(); kpiHistogramChart = null; }
                    if (zoomedChart) { zoomedChart.destroy(); zoomedChart = null; }
                    if (compCqiMcs) { compCqiMcs.destroy(); compCqiMcs = null; }
                    if (compCqiOnly) { compCqiOnly.destroy(); compCqiOnly = null; }
                    if (compMcsOnly) { compMcsOnly.destroy(); compMcsOnly = null; }
                    if (compSinrTput) { compSinrTput.destroy(); compSinrTput = null; }
                    if (compSinrOnly) { compSinrOnly.destroy(); compSinrOnly = null; }
                    if (compRsrqRsrp) { compRsrqRsrp.destroy(); compRsrqRsrp = null; }
                    if (compRsrpOnly) { compRsrpOnly.destroy(); compRsrpOnly = null; }
                    if (compRsrqOnly) { compRsrqOnly.destroy(); compRsrqOnly = null; }
                    if (compBlerTput) { compBlerTput.destroy(); compBlerTput = null; }
                    if (compTputOnly) { compTputOnly.destroy(); compTputOnly = null; }
                    if (compTputUlOnly) { compTputUlOnly.destroy(); compTputUlOnly = null; }
                    if (compBlerOnly) { compBlerOnly.destroy(); compBlerOnly = null; }
                    if (compTxPowerOnly) { compTxPowerOnly.destroy(); compTxPowerOnly = null; }
                    if (scatterTputSinr) { scatterTputSinr.destroy(); scatterTputSinr = null; }
                    if (scatterTputRsrp) { scatterTputRsrp.destroy(); scatterTputRsrp = null; }
                    if (scatterMcsCqi) { scatterMcsCqi.destroy(); scatterMcsCqi = null; }
                    if (scatterBlerTput) { scatterBlerTput.destroy(); scatterBlerTput = null; }
                    if (window.multiKpiCharts && window.multiKpiCharts.length > 0) {
                        window.multiKpiCharts.forEach(c => c.destroy());
                        window.multiKpiCharts = [];
                    }

                    // Clear all canvas elements to remove any residual rendering
                    const canvasIds = [
                        'kpiChart', 'kpiHistogram', 'chartZoomCanvas',
                        'compRsrpOnly', 'compRsrqOnly', 'compSinrOnly', 
                        'compTputOnly', 'compTputUlOnly', 'compBlerOnly', 'compCqiOnly', 'compMcsOnly', 'compTxPowerOnly',
                        'scatterTputSinr', 'scatterTputRsrp', 'scatterMcsCqi', 'scatterBlerTput'
                    ];
                    canvasIds.forEach(id => {
                        const canvas = document.getElementById(id);
                        if (canvas) {
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                            }
                        }
                    });
                } catch (e) {
                    console.warn('Error destroying charts during reset:', e);
                }

                // Close zoom modal if open
                try {
                    const zoomModal = document.getElementById('chartZoomModal');
                    if (zoomModal) {
                        zoomModal.style.display = 'none';
                        const chartContainer = document.getElementById('chartZoomContainer');
                        if (chartContainer) {
                            chartContainer.innerHTML = '<canvas id="chartZoomCanvas"></canvas>';
                            chartContainer.style.cssText = 'flex:1; border:3px solid white; padding:20px; overflow:hidden; display:block;';
                        }
                    }
                } catch (e) {
                    console.warn('Error closing modal during reset:', e);
                }

                // Reset summary cards
                ['summaryCurrentValue', 'summaryMin', 'summaryAvg', 'summaryMax'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) { el.textContent = '-'; el.style.color = ''; }
                });
                const trendEl = document.getElementById('summaryCurrentTrend');
                if (trendEl) trendEl.textContent = '-';

                // Reset stat values
                ['statMin', 'statP10', 'statP50', 'statP90', 'statAvg', 'statMax'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) { el.textContent = '-'; el.style.color = ''; }
                });

                // Reset table values
                ['tableMin', 'tableMinQuality', 'tableP10', 'tableP10Quality',
                 'tableP50', 'tableP50Quality', 'tableP90', 'tableP90Quality',
                 'tableAvg', 'tableAvgQuality', 'tableMax', 'tableMaxQuality'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) { el.textContent = '-'; el.style.color = ''; }
                });

                // Reset signal quality counts
                ['qualExcellent', 'qualExcellentPct', 'qualGood', 'qualGoodPct',
                 'qualFair', 'qualFairPct', 'qualPoor', 'qualPoorPct'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = '0';
                });

                // Reset events list
                const eventsList = document.getElementById('eventsList');
                if (eventsList) eventsList.innerHTML = '<div class="text-gray-600">No events</div>';

                // Hide histogram
                const histContainer = document.getElementById('kpiHistogramContainer');
                if (histContainer) histContainer.style.display = 'none';

                // Reset multi-KPI checkboxes and state
                selectedKpis = [];
                document.querySelectorAll('.kpi-selector').forEach(cb => { cb.checked = false; });
                const compareBtn = document.getElementById('compareKpisBtn');
                const countSpan = document.getElementById('selectedKpiCount');
                if (compareBtn) compareBtn.disabled = true;
                if (countSpan) countSpan.textContent = '0';

                // Hide KPI panel, show dashboard panel
                const kpiPanel = document.getElementById('kpiPanel');
                const dashboardPanel = document.getElementById('dashboardPanel');
                const kpiToggleBtn = document.getElementById('kpisBtn');
                if (kpiPanel) { kpiPanel.classList.add('hidden'); kpiPanel.classList.remove('flex'); }
                if (dashboardPanel) dashboardPanel.classList.remove('hidden');
                if (kpiToggleBtn) {
                    kpiToggleBtn.classList.remove('bg-green-600');
                    kpiToggleBtn.classList.add('bg-purple-600');
                    kpiToggleBtn.innerHTML = '📊 <span class="hidden sm:inline">KPIs</span>';
                }

                // Reset KPI panel title
                const kpiTitle = document.getElementById('kpiPanelTitle');
                if (kpiTitle) kpiTitle.textContent = '📊 KPI VISUALIZATION';

                // Reset CSV file input
                const csvInput = document.getElementById('csvFile');
                if (csvInput) csvInput.value = '';

                // Reset KPI state variables
                currentKpiType = 'rsrp';
                currentChartType = 'line';
                showingKPIs = false;
                kpiTheme = 'light';

                // Apply light mode styling to KPI panel
                const kpiPanelForTheme = document.getElementById('kpiPanel');
                if (kpiPanelForTheme) {
                    kpiPanelForTheme.classList.remove('bg-gray-900');
                    kpiPanelForTheme.classList.add('bg-white');
                    
                    // Update all KPI panel elements to light mode
                    document.querySelectorAll('#kpiPanel .bg-gray-800').forEach(el => {
                        el.classList.remove('bg-gray-800');
                        el.classList.add('bg-gray-100');
                    });
                    document.querySelectorAll('#kpiPanel .bg-gray-900').forEach(el => {
                        el.classList.remove('bg-gray-900');
                        el.classList.add('bg-white');
                    });
                    document.querySelectorAll('#kpiPanel .text-white').forEach(el => {
                        el.classList.remove('text-white');
                        el.classList.add('text-gray-900');
                    });
                    document.querySelectorAll('#kpiPanel .text-gray-400').forEach(el => {
                        el.classList.remove('text-gray-400');
                        el.classList.add('text-gray-600');
                    });
                    
                    // Fix KPI tab and button borders for light mode
                    document.querySelectorAll('#kpiPanel .kpi-tab, #kpiPanel .chart-type-btn, #kpiPanel .view-mode-btn').forEach(el => {
                        el.classList.remove('border-white');
                        el.classList.add('border-gray-400');
                        // Switch inactive button background to light
                        if (!el.classList.contains('bg-blue-600')) {
                            el.classList.remove('bg-gray-700');
                            el.classList.add('bg-gray-200');
                        }
                    });
                    
                    // Fix theme toggle button for light mode
                    const themeToggleBtn = document.getElementById('kpiThemeToggle');
                    if (themeToggleBtn) {
                        themeToggleBtn.innerHTML = '☀️ Light';
                        themeToggleBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
                        themeToggleBtn.classList.add('bg-gray-200', 'hover:bg-gray-300');
                    }
                    
                    // Update multi-KPI checkbox hover states for light mode
                    document.querySelectorAll('.kpi-selector').forEach(checkbox => {
                        const label = checkbox.parentElement;
                        label.classList.remove('hover:bg-gray-700');
                        label.classList.add('hover:bg-gray-100');
                    });
                }

                // Reset KPI tabs to default (RSRP active)
                document.querySelectorAll('.kpi-tab').forEach(tab => {
                    tab.classList.remove('active', 'bg-blue-600');
                    tab.classList.add('bg-gray-700');
                    if (tab.dataset.kpi === 'rsrp') {
                        tab.classList.add('active', 'bg-blue-600');
                        tab.classList.remove('bg-gray-700');
                    }
                });

                // Reset chart type buttons to default (line active)
                document.querySelectorAll('.chart-type-btn').forEach(btn => {
                    btn.classList.remove('active', 'bg-blue-600');
                    btn.classList.add('bg-gray-700');
                    if (btn.dataset.type === 'line') {
                        btn.classList.add('active', 'bg-blue-600');
                        btn.classList.remove('bg-gray-700');
                    }
                });

                alert('Dashboard reset to default successfully!');
            }
        }

        // Load saved state from localStorage on page load
        function loadSavedState() {
            const saved = localStorage.getItem('dashboardConfig');
            if (saved) {
                try {
                    const savedConfig = JSON.parse(saved);
                    currentConfig = { ...currentConfig, ...savedConfig };
                    applyConfig();
                } catch (e) {
                    console.log('Error loading saved state:', e);
                }
            }
        }

        // Save state to localStorage
        function saveToLocalStorage() {
            localStorage.setItem('dashboardConfig', JSON.stringify(currentConfig));
        }

        // =====================================================
        // EDIT MODE TOGGLE
        // =====================================================
        
        document.getElementById('editModeBtn').addEventListener('click', function() {
            editMode = !editMode;
            const mobileText = editMode ? '✏️ <span class="hidden sm:inline">EDIT MODE: ON</span>' : '✏️ <span class="hidden sm:inline">EDIT MODE: OFF</span>';
            this.innerHTML = mobileText;
            this.classList.toggle('bg-yellow-400', !editMode);
            this.classList.toggle('bg-green-500', editMode);
            
            // Show/hide formatting toolbar
            document.getElementById('formatToolbar').style.display = editMode ? 'block' : 'none';
            
            // Enable/disable contenteditable
            document.querySelectorAll('.editable-field').forEach(el => {
                el.contentEditable = editMode;
                if (editMode) {
                    el.style.outline = '2px dashed #FF7900';
                    el.style.outlineOffset = '2px';
                    // Handle empty fields - add placeholder if empty
                    if (el.innerHTML.trim() === '' || el.textContent.trim() === '') {
                        el.innerHTML = 'Click to edit';
                        el.style.color = '#999';
                    }
                } else {
                    el.style.outline = 'none';
                    // Remove placeholder styling
                    if (el.innerHTML === 'Click to edit') {
                        el.innerHTML = '';
                    }
                    el.style.color = '';
                }
            });

            // Show/hide add buttons
            document.getElementById('addPerformanceBtn').classList.toggle('hidden', !editMode);
            document.getElementById('addImpactsBtn').classList.toggle('hidden', !editMode);
            document.getElementById('addAnalysisBtn').classList.toggle('hidden', !editMode);
            document.getElementById('addRecommendationsBtn').classList.toggle('hidden', !editMode);

            // Show/hide delete buttons for additional fields
            document.querySelectorAll('.field-delete-btn').forEach(btn => {
                btn.style.display = editMode ? 'block' : 'none';
            });

            // Save state when exiting edit mode
            if (!editMode) {
                saveCurrentState();
                saveToLocalStorage();
            }
        });

        // Handle focus events for editable fields
        document.addEventListener('focusin', function(e) {
            if (e.target.classList.contains('editable-field') && e.target.innerHTML === 'Click to edit') {
                e.target.innerHTML = '';
                e.target.style.color = '';
            }
        });

        document.addEventListener('focusout', function(e) {
            if (e.target.classList.contains('editable-field') && e.target.innerHTML.trim() === '' && editMode) {
                e.target.innerHTML = 'Click to edit';
                e.target.style.color = '#999';
            }
        });

        // =====================================================
        // SAVE/LOAD CONFIGURATION
        // =====================================================
        function saveCurrentState() {
            // Save editable fields (including empty ones)
            document.querySelectorAll('.editable-field').forEach(el => {
                const field = el.dataset.field;
                if (field) {
                    let content = el.innerHTML.trim();
                    // Don't save placeholder text, save as empty string
                    if (content === 'Click to edit') {
                        content = '';
                    }
                    currentConfig[field] = content;
                }
            });
            
            // Save additional fields for each section
            currentConfig.additionalFields = {
                performance: [],
                impacts: [],
                analysis: [],
                recommendations: []
            };
            
            // Save performance additional fields
            document.querySelectorAll('#performanceContainer .border-t').forEach(field => {
                const htmlContent = field.querySelector('.editable-field')?.innerHTML?.trim();
                if (htmlContent && htmlContent !== 'Click to edit') {
                    currentConfig.additionalFields.performance.push(htmlContent);
                }
            });
            
            // Save impacts additional fields
            document.querySelectorAll('#impactsContainer .border-t').forEach(field => {
                const htmlContent = field.querySelector('.editable-field')?.innerHTML?.trim();
                if (htmlContent && htmlContent !== 'Click to edit') {
                    currentConfig.additionalFields.impacts.push(htmlContent);
                }
            });
            
            // Save analysis additional fields
            document.querySelectorAll('#analysisContainer .border-t').forEach(field => {
                const htmlContent = field.querySelector('.editable-field')?.innerHTML?.trim();
                if (htmlContent && htmlContent !== 'Click to edit') {
                    currentConfig.additionalFields.analysis.push(htmlContent);
                }
            });
            
            // Save recommendations additional fields
            document.querySelectorAll('#recommendationsContainer .border-t').forEach(field => {
                const htmlContent = field.querySelector('.editable-field')?.innerHTML?.trim();
                if (htmlContent && htmlContent !== 'Click to edit') {
                    currentConfig.additionalFields.recommendations.push(htmlContent);
                }
            });
        }

        // =====================================================
        // ADD FIELD FUNCTIONALITY
        // =====================================================
        function addFieldToSection(sectionId, fieldName) {
            const container = document.getElementById(sectionId);
            const newField = document.createElement('div');
            newField.className = 'border-t border-gray-300 pt-2 mt-2 relative';
            newField.innerHTML = `
                <button class="field-delete-btn absolute top-0 right-0 text-red-600 text-xs font-bold hover:text-red-800" onclick="this.parentElement.remove()" style="display: ${editMode ? 'block' : 'none'}">✕</button>
                <div class="editable-field text-sm" contenteditable="${editMode}" style="${editMode ? 'outline: 2px dashed #FF7900; outline-offset: 2px;' : ''}">
                    New ${fieldName} field - click to edit
                </div>
            `;
            container.appendChild(newField);
        }
        
        function addFieldToSectionWithContent(sectionId, fieldName, content) {
            const container = document.getElementById(sectionId);
            const newField = document.createElement('div');
            newField.className = 'border-t border-gray-300 pt-2 mt-2 relative';
            newField.innerHTML = `
                <button class="field-delete-btn absolute top-0 right-0 text-red-600 text-xs font-bold hover:text-red-800" onclick="this.parentElement.remove()" style="display: ${editMode ? 'block' : 'none'}">✕</button>
                <div class="editable-field text-sm" contenteditable="${editMode}" style="${editMode ? 'outline: 2px dashed #FF7900; outline-offset: 2px;' : ''}">
                    ${content}
                </div>
            `;
            container.appendChild(newField);
        }

        document.getElementById('addPerformanceBtn').addEventListener('click', function() {
            addFieldToSection('performanceContainer', 'performance');
        });

        document.getElementById('addImpactsBtn').addEventListener('click', function() {
            addFieldToSection('impactsContainer', 'impacts');
        });

        document.getElementById('addAnalysisBtn').addEventListener('click', function() {
            addFieldToSection('analysisContainer', 'analysis');
        });

        document.getElementById('addRecommendationsBtn').addEventListener('click', function() {
            addFieldToSection('recommendationsContainer', 'recommendations');
        });

        document.getElementById('resetBtn').addEventListener('click', function() {
            resetToDefault();
        });

        // =====================================================
        // KPI VISUALIZATION
        // =====================================================
        
        function updateKPITabs() {
            const tech = detectedTechnology || 'LTE';
            console.log('updateKPITabs called with technology:', tech);
            
            // Define which tabs to show/hide per technology
            const tabVisibility = {
                'NR': ['rsrp', 'rsrq', 'sinr', 'cqi', 'mcs', 'bler', 'throughput_dl_mbps', 'throughput_ul_mbps'],
                'LTE': ['rsrp', 'rsrq', 'sinr', 'cqi', 'mcs', 'bler', 'throughput_dl_mbps', 'throughput_ul_mbps'],
                'UMTS': ['rsrp', 'rsrq', 'throughput_dl_mbps', 'throughput_ul_mbps'], // No SINR, CQI, MCS, BLER
                'GSM': ['rsrp', 'rsrq'] // Only RxLev and RxQual (mapped to rsrp/rsrq)
            };
            
            // Define tab labels per technology
            const tabLabels = {
                'NR': { rsrp: 'NR-RSRP', rsrq: 'NR-RSRQ', sinr: 'NR-SINR', cqi: 'CQI', mcs: 'MCS', bler: 'BLER', throughput_dl_mbps: 'DL Mbps', throughput_ul_mbps: 'UL Mbps' },
                'LTE': { rsrp: 'RSRP', rsrq: 'RSRQ', sinr: 'SINR', cqi: 'CQI', mcs: 'MCS', bler: 'BLER', throughput_dl_mbps: 'DL Mbps', throughput_ul_mbps: 'UL Mbps' },
                'UMTS': { rsrp: 'RSCP', rsrq: 'Ec/No', throughput_dl_mbps: 'DL Mbps', throughput_ul_mbps: 'UL Mbps' },
                'GSM': { rsrp: 'RxLev', rsrq: 'RxQual' }
            };
            
            const visibleTabs = tabVisibility[tech] || tabVisibility['LTE'];
            const labels = tabLabels[tech] || tabLabels['LTE'];
            
            const tabs = document.querySelectorAll('.kpi-tab');
            tabs.forEach(tab => {
                const kpiType = tab.dataset.kpi;
                if (visibleTabs.includes(kpiType)) {
                    tab.style.display = 'inline-block';
                    tab.style.visibility = 'visible';
                    // Update label - always apply the label for current technology
                    const newLabel = labels[kpiType] || kpiType.toUpperCase();
                    tab.textContent = newLabel;
                    console.log(`Tab ${kpiType}: visible, label = ${newLabel}`);
                } else {
                    tab.style.display = 'none';
                    tab.style.visibility = 'hidden';
                    console.log(`Tab ${kpiType}: hidden`);
                }
            });
        }
        
        // Update Multi-KPI Comparison checkbox labels based on technology
        function updateMultiKpiLabels() {
            const tech = detectedTechnology || 'LTE';
            console.log('updateMultiKpiLabels called with technology:', tech);
            
            // Define checkbox visibility per technology
            const checkboxVisibility = {
                'NR': ['rsrp', 'rsrq', 'sinr', 'cqi', 'mcs', 'bler', 'throughput_dl_mbps', 'throughput_ul_mbps', 'txpower'],
                'LTE': ['rsrp', 'rsrq', 'sinr', 'cqi', 'mcs', 'bler', 'throughput_dl_mbps', 'throughput_ul_mbps', 'txpower'],
                'UMTS': ['rsrp', 'rsrq', 'throughput_dl_mbps', 'throughput_ul_mbps', 'txpower'],
                'GSM': ['rsrp', 'rsrq', 'throughput_dl_mbps', 'throughput_ul_mbps', 'txpower']
            };
            
            // Define checkbox labels per technology
            const checkboxLabels = {
                'NR': { 
                    rsrp: 'NR-RSRP', 
                    rsrq: 'NR-RSRQ', 
                    sinr: 'NR-SINR', 
                    cqi: 'CQI', 
                    mcs: 'MCS', 
                    bler: 'BLER', 
                    throughput_dl_mbps: 'DL Throughput', 
                    throughput_ul_mbps: 'UL Throughput',
                    txpower: 'Tx Power'
                },
                'LTE': { 
                    rsrp: 'RSRP', 
                    rsrq: 'RSRQ', 
                    sinr: 'SINR', 
                    cqi: 'CQI', 
                    mcs: 'MCS', 
                    bler: 'BLER', 
                    throughput_dl_mbps: 'DL Throughput', 
                    throughput_ul_mbps: 'UL Throughput',
                    txpower: 'Tx Power'
                },
                'UMTS': { 
                    rsrp: 'RSCP', 
                    rsrq: 'Ec/No', 
                    throughput_dl_mbps: 'DL Throughput', 
                    throughput_ul_mbps: 'UL Throughput',
                    txpower: 'Tx Power'
                },
                'GSM': { 
                    rsrp: 'RxLev', 
                    rsrq: 'RxQual', 
                    throughput_dl_mbps: 'DL Throughput', 
                    throughput_ul_mbps: 'UL Throughput',
                    txpower: 'Tx Power'
                }
            };
            
            const visibleCheckboxes = checkboxVisibility[tech] || checkboxVisibility['LTE'];
            const labels = checkboxLabels[tech] || checkboxLabels['LTE'];
            
            // Update each checkbox label and visibility
            document.querySelectorAll('.kpi-selector').forEach(checkbox => {
                const kpiType = checkbox.dataset.kpi;
                const labelElement = checkbox.parentElement.querySelector('.kpi-label');
                const parentLabel = checkbox.parentElement;
                
                if (visibleCheckboxes.includes(kpiType)) {
                    parentLabel.style.display = 'flex';
                    const newLabel = labels[kpiType] || kpiType.toUpperCase();
                    if (labelElement) {
                        labelElement.textContent = newLabel;
                    }
                    console.log(`Multi-KPI checkbox ${kpiType}: visible, label = ${newLabel}`);
                } else {
                    parentLabel.style.display = 'none';
                    // Uncheck hidden checkboxes
                    checkbox.checked = false;
                    console.log(`Multi-KPI checkbox ${kpiType}: hidden`);
                }
            });
            
            // Trigger update of selected count if the function exists
            if (window.updateMultiKpiSelectedCount) {
                window.updateMultiKpiSelectedCount();
            }
        }
        
        document.getElementById('kpisBtn').addEventListener('click', function() {
            showingKPIs = !showingKPIs;
            const dashboardPanel = document.getElementById('dashboardPanel');
            const kpiPanel = document.getElementById('kpiPanel');
            
            if (showingKPIs) {
                dashboardPanel.classList.add('hidden');
                kpiPanel.classList.remove('hidden');
                kpiPanel.classList.add('flex');
                this.classList.remove('bg-purple-600');
                this.classList.add('bg-green-600');
                this.innerHTML = '📋 <span class="hidden sm:inline">DASHBOARD</span>';
                
                // Apply light mode if kpiTheme is 'light' (ensures proper styling after reset)
                if (kpiTheme === 'light') {
                    kpiPanel.classList.remove('bg-gray-900');
                    kpiPanel.classList.add('bg-white');
                    
                    // Update all KPI panel elements to light mode
                    document.querySelectorAll('#kpiPanel .bg-gray-800').forEach(el => {
                        el.classList.remove('bg-gray-800');
                        el.classList.add('bg-gray-100');
                    });
                    document.querySelectorAll('#kpiPanel .bg-gray-900').forEach(el => {
                        el.classList.remove('bg-gray-900');
                        el.classList.add('bg-white');
                    });
                    document.querySelectorAll('#kpiPanel .text-white').forEach(el => {
                        el.classList.remove('text-white');
                        el.classList.add('text-gray-900');
                    });
                    document.querySelectorAll('#kpiPanel .text-gray-400').forEach(el => {
                        el.classList.remove('text-gray-400');
                        el.classList.add('text-gray-600');
                    });
                    
                    // Fix KPI tab and button borders for light mode
                    document.querySelectorAll('#kpiPanel .kpi-tab, #kpiPanel .chart-type-btn, #kpiPanel .view-mode-btn').forEach(el => {
                        el.classList.remove('border-white');
                        el.classList.add('border-gray-400');
                        // Switch inactive button background to light
                        if (!el.classList.contains('bg-blue-600')) {
                            el.classList.remove('bg-gray-700');
                            el.classList.add('bg-gray-200');
                        }
                    });
                    
                    // Fix theme toggle button for light mode
                    const themeToggleBtn = document.getElementById('kpiThemeToggle');
                    if (themeToggleBtn) {
                        themeToggleBtn.innerHTML = '☀️ Light';
                        themeToggleBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
                        themeToggleBtn.classList.add('bg-gray-200', 'hover:bg-gray-300');
                    }
                    
                    // Update multi-KPI checkbox hover states for light mode
                    document.querySelectorAll('.kpi-selector').forEach(checkbox => {
                        const label = checkbox.parentElement;
                        label.classList.remove('hover:bg-gray-700');
                        label.classList.add('hover:bg-gray-100');
                    });
                }
                
                if (parsedData.length > 0) {
                    // Update KPI panel title based on technology
                    const tech = detectedTechnology || 'LTE';
                    const techNames = { 'NR': '5G NR', 'LTE': '4G LTE', 'UMTS': '3G UMTS', 'GSM': '2G GSM' };
                    const kpiTitle = document.getElementById('kpiPanelTitle');
                    if (kpiTitle) {
                        kpiTitle.textContent = `📊 ${techNames[tech] || tech} KPI VISUALIZATION`;
                    }
                    
                    updateKPITabs(); // Update tabs based on technology
                    updateMultiKpiLabels(); // Update multi-KPI checkbox labels based on technology
                    // Click the first visible tab to render its chart
                    const firstVisibleTab = document.querySelector('.kpi-tab[style*="display: inline-block"], .kpi-tab:not([style*="display: none"])');
                    if (firstVisibleTab) {
                        firstVisibleTab.click();
                    } else {
                        renderKPIChart('rsrp');
                    }
                    renderScatterPlots();
                    renderCorrelationScatters();
                }
            } else {
                dashboardPanel.classList.remove('hidden');
                kpiPanel.classList.add('hidden');
                kpiPanel.classList.remove('flex');
                this.classList.remove('bg-green-600');
                this.classList.add('bg-purple-600');
                this.innerHTML = '📊 <span class="hidden sm:inline">KPIs</span>';
            }
        });

        // KPI Tab switching
        document.querySelectorAll('.kpi-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                // Only process if tab is visible
                if (this.style.display === 'none') return;
                
                const inactiveBg = kpiTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200';
                document.querySelectorAll('.kpi-tab').forEach(t => {
                    t.classList.remove('active', 'bg-blue-600', 'bg-gray-700', 'bg-gray-200');
                    t.classList.add(inactiveBg);
                });
                this.classList.add('active', 'bg-blue-600');
                this.classList.remove('bg-gray-700', 'bg-gray-200');
                currentKpiType = this.dataset.kpi;
                renderKPIChart(currentKpiType);
            });
        });

        // Chart Type switching
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const inactiveBg = kpiTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200';
                document.querySelectorAll('.chart-type-btn').forEach(b => {
                    b.classList.remove('active', 'bg-blue-600', 'bg-gray-700', 'bg-gray-200');
                    b.classList.add(inactiveBg);
                });
                this.classList.add('active', 'bg-blue-600');
                this.classList.remove('bg-gray-700', 'bg-gray-200');
                currentChartType = this.dataset.type;
                renderKPIChart(currentKpiType);
            });
        });

        // View Mode switching
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const inactiveBg = kpiTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200';
                document.querySelectorAll('.view-mode-btn').forEach(b => {
                    b.classList.remove('active', 'bg-blue-600', 'bg-gray-700', 'bg-gray-200');
                    b.classList.add(inactiveBg);
                });
                this.classList.add('active', 'bg-blue-600');
                this.classList.remove('bg-gray-700', 'bg-gray-200');
                currentViewMode = this.dataset.mode;
                toggleViewMode();
            });
        });

        function toggleViewMode() {
            const gridView = document.getElementById('statsGridView');
            const tableView = document.getElementById('statsTableView');
            // Only table mode is available now
            gridView.classList.add('hidden');
            tableView.classList.remove('hidden');
        }

        function getColorForValue(value, kpiType) {
            if (kpiType === 'rsrp') {
                if (value >= -80) return '#22c55e';
                if (value >= -90) return '#3b82f6';
                if (value >= -100) return '#f59e0b';
                return '#ef4444';
            } else if (kpiType === 'rsrq') {
                if (value >= -10) return '#22c55e';
                if (value >= -15) return '#3b82f6';
                if (value >= -20) return '#f59e0b';
                return '#ef4444';
            } else if (kpiType === 'sinr') {
                if (value >= 20) return '#22c55e';
                if (value >= 13) return '#3b82f6';
                if (value >= 0) return '#f59e0b';
                return '#ef4444';
            }
            return '#9ca3af';
        }

        function getQualityLabel(value, kpiType) {
            if (kpiType === 'rsrp') {
                if (value >= -80) return '🟢 Excellent';
                if (value >= -90) return '🔵 Good';
                if (value >= -100) return '🟡 Fair';
                return '🔴 Poor';
            } else if (kpiType === 'rsrq') {
                if (value >= -10) return '🟢 Excellent';
                if (value >= -15) return '🔵 Good';
                if (value >= -20) return '🟡 Fair';
                return '🔴 Poor';
            } else if (kpiType === 'sinr') {
                if (value >= 20) return '🟢 Excellent';
                if (value >= 13) return '🔵 Good';
                if (value >= 0) return '🟡 Fair';
                return '🔴 Poor';
            }
            return '-';
        }

        function renderMultipleMetricsChart(labels) {
            const rsrpValues = parsedData.map(d => parseFloat(d.rsrp) || -100);
            const rsrqValues = parsedData.map(d => parseFloat(d.rsrq) || -10);
            const sinrValues = parsedData.map(d => parseFloat(d.sinr) || 0);

            const ctx = document.getElementById('kpiChart').getContext('2d');
            if (kpiChart) kpiChart.destroy();

            kpiChart = new Chart(ctx, {
                type: currentChartType === 'bar' ? 'bar' : 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'RSRP (dBm)',
                            data: rsrpValues,
                            borderColor: '#3b82f6',
                            backgroundColor: '#3b82f6',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.3,
                            yAxisID: 'y',
                            pointRadius: 1
                        },
                        {
                            label: 'RSRQ (dB)',
                            data: rsrqValues,
                            borderColor: '#10b981',
                            backgroundColor: '#10b981',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.3,
                            yAxisID: 'y1',
                            pointRadius: 1
                        },
                        {
                            label: 'SINR (dB)',
                            data: sinrValues,
                            borderColor: '#f59e0b',
                            backgroundColor: '#f59e0b',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.3,
                            yAxisID: 'y2',
                            pointRadius: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: { color: '#fff', font: { family: 'JetBrains Mono', size: 10 } }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            titleFont: { family: 'JetBrains Mono', size: 12 },
                            bodyFont: { family: 'JetBrains Mono', size: 11 },
                            padding: 12,
                            borderColor: '#fff',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        x: {
                            ticks: { color: '#9ca3af', font: { size: 8, family: 'JetBrains Mono' }, maxRotation: 45, minRotation: 45 },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        },
                        y: {
                            type: 'linear',
                            position: 'left',
                            title: { display: true, text: 'RSRP (dBm)', color: '#3b82f6', font: { family: 'JetBrains Mono' } },
                            ticks: { color: '#3b82f6', font: { family: 'JetBrains Mono' } },
                            grid: { color: 'rgba(59, 130, 246, 0.2)' }
                        },
                        y1: {
                            type: 'linear',
                            position: 'right',
                            title: { display: true, text: 'RSRQ (dB)', color: '#10b981', font: { family: 'JetBrains Mono' } },
                            ticks: { color: '#10b981', font: { family: 'JetBrains Mono' } },
                            grid: { drawOnChartArea: false }
                        },
                        y2: {
                            type: 'linear',
                            position: 'right',
                            title: { display: false },
                            ticks: { display: false },
                            grid: { drawOnChartArea: false }
                        }
                    }
                }
            });

            const min = Math.min(...rsrpValues);
            const max = Math.max(...rsrpValues);
            const avg = rsrpValues.reduce((a, b) => a + b, 0) / rsrpValues.length;
            const currentValue = rsrpValues[rsrpValues.length - 1];
            const prevValue = rsrpValues.length > 1 ? rsrpValues[rsrpValues.length - 2] : currentValue;
            const trend = currentValue > prevValue ? '↑' : currentValue < prevValue ? '↓' : '→';
            const trendColor = currentValue > prevValue ? '#22c55e' : currentValue < prevValue ? '#ef4444' : '#9ca3af';
            
            document.getElementById('summaryCurrentValue').textContent = currentValue.toFixed(2);
            document.getElementById('summaryCurrentValue').style.color = getColorForValue(currentValue, 'rsrp');
            document.getElementById('summaryCurrentTrend').innerHTML = `<span style="color:${trendColor}">${trend} ${Math.abs(currentValue - prevValue).toFixed(2)}</span> from previous`;
            document.getElementById('summaryMin').textContent = min.toFixed(2);
            document.getElementById('summaryMin').style.color = getColorForValue(min, 'rsrp');
            document.getElementById('summaryAvg').textContent = avg.toFixed(2);
            document.getElementById('summaryAvg').style.color = getColorForValue(avg, 'rsrp');
            document.getElementById('summaryMax').textContent = max.toFixed(2);
            document.getElementById('summaryMax').style.color = getColorForValue(max, 'rsrp');
        }

        function calculatePercentiles(values) {
            const sorted = [...values].sort((a, b) => a - b);
            return {
                p10: sorted[Math.floor(sorted.length * 0.1)],
                p50: sorted[Math.floor(sorted.length * 0.5)],
                p90: sorted[Math.floor(sorted.length * 0.9)]
            };
        }

        function renderKPIChart(kpiType) {
            if (parsedData.length === 0) return;

            const labels = parsedData.map((d, i) => d.time?.split('T')[1]?.slice(0, 8) || `Point ${i+1}`);
            
            if (kpiType === 'all') {
                renderMultipleMetricsChart(labels);
                return;
            }
            
            // Determine which KPI to extract based on technology
            let values = [];
            const dominantTech = detectedTechnology || 'LTE';
            
            // Get technology-specific label
            let kpiLabel = kpiType.toUpperCase();
            if (kpiType === 'rsrp') {
                if (dominantTech === 'NR') {
                    values = parsedData.map(d => parseFloat(d.nr_rsrp) || 0);
                    kpiLabel = 'NR-RSRP (dBm)';
                } else if (dominantTech === 'UMTS') {
                    values = parsedData.map(d => parseFloat(d.wcdma_rscp) || 0);
                    kpiLabel = 'RSCP (dBm)';
                } else if (dominantTech === 'GSM') {
                    values = parsedData.map(d => parseFloat(d.gsm_rxlev || d.rxlev) || 0);
                    kpiLabel = 'RxLev (dBm)';
                } else {
                    values = parsedData.map(d => parseFloat(d.rsrp) || 0);
                    kpiLabel = 'RSRP (dBm)';
                }
            } else if (kpiType === 'rsrq') {
                if (dominantTech === 'NR') {
                    values = parsedData.map(d => parseFloat(d.nr_rsrq) || 0);
                    kpiLabel = 'NR-RSRQ (dB)';
                } else if (dominantTech === 'UMTS') {
                    values = parsedData.map(d => parseFloat(d.wcdma_ecno) || 0);
                    kpiLabel = 'Ec/No (dB)';
                } else if (dominantTech === 'GSM') {
                    values = parsedData.map(d => parseFloat(d.gsm_rxqual || d.rxqual) || 0);
                    kpiLabel = 'RxQual';
                } else {
                    values = parsedData.map(d => parseFloat(d.rsrq) || 0);
                    kpiLabel = 'RSRQ (dB)';
                }
            } else if (kpiType === 'sinr') {
                if (dominantTech === 'NR') {
                    values = parsedData.map(d => parseFloat(d.nr_sinr) || 0);
                    kpiLabel = 'NR-SINR (dB)';
                } else {
                    values = parsedData.map(d => parseFloat(d.sinr) || 0);
                    kpiLabel = 'SINR (dB)';
                }
            } else {
                values = parsedData.map(d => parseFloat(d[kpiType]) || 0);
            }

            // Calculate statistics
            const min = Math.min(...values);
            const max = Math.max(...values);
            const avg = (values.reduce((a, b) => a + b, 0) / values.length);
            const percentiles = calculatePercentiles(values);

            // Color-code statistics
            document.getElementById('statMin').textContent = min.toFixed(2);
            document.getElementById('statMin').style.color = getColorForValue(min, kpiType);
            
            document.getElementById('statP10').textContent = percentiles.p10.toFixed(2);
            document.getElementById('statP10').style.color = getColorForValue(percentiles.p10, kpiType);
            
            document.getElementById('statP50').textContent = percentiles.p50.toFixed(2);
            document.getElementById('statP50').style.color = getColorForValue(percentiles.p50, kpiType);
            
            document.getElementById('statP90').textContent = percentiles.p90.toFixed(2);
            document.getElementById('statP90').style.color = getColorForValue(percentiles.p90, kpiType);
            
            document.getElementById('statAvg').textContent = avg.toFixed(2);
            document.getElementById('statAvg').style.color = getColorForValue(avg, kpiType);
            
            document.getElementById('statMax').textContent = max.toFixed(2);
            document.getElementById('statMax').style.color = getColorForValue(max, kpiType);

            // Update summary cards
            const currentValue = values[values.length - 1];
            const prevValue = values.length > 1 ? values[values.length - 2] : currentValue;
            const trend = currentValue > prevValue ? '↑' : currentValue < prevValue ? '↓' : '→';
            const trendColor = currentValue > prevValue ? '#22c55e' : currentValue < prevValue ? '#ef4444' : '#9ca3af';
            
            document.getElementById('summaryCurrentValue').textContent = currentValue.toFixed(2);
            document.getElementById('summaryCurrentValue').style.color = getColorForValue(currentValue, kpiType);
            document.getElementById('summaryCurrentTrend').innerHTML = `<span style="color:${trendColor}">${trend} ${Math.abs(currentValue - prevValue).toFixed(2)}</span> from previous`;
            
            document.getElementById('summaryMin').textContent = min.toFixed(2);
            document.getElementById('summaryMin').style.color = getColorForValue(min, kpiType);
            
            document.getElementById('summaryAvg').textContent = avg.toFixed(2);
            document.getElementById('summaryAvg').style.color = getColorForValue(avg, kpiType);
            
            document.getElementById('summaryMax').textContent = max.toFixed(2);
            document.getElementById('summaryMax').style.color = getColorForValue(max, kpiType);

            // Update table view
            document.getElementById('tableMin').textContent = min.toFixed(2);
            document.getElementById('tableMin').style.color = getColorForValue(min, kpiType);
            document.getElementById('tableMinQuality').textContent = getQualityLabel(min, kpiType);
            
            document.getElementById('tableP10').textContent = percentiles.p10.toFixed(2);
            document.getElementById('tableP10').style.color = getColorForValue(percentiles.p10, kpiType);
            document.getElementById('tableP10Quality').textContent = getQualityLabel(percentiles.p10, kpiType);
            
            document.getElementById('tableP50').textContent = percentiles.p50.toFixed(2);
            document.getElementById('tableP50').style.color = getColorForValue(percentiles.p50, kpiType);
            document.getElementById('tableP50Quality').textContent = getQualityLabel(percentiles.p50, kpiType);
            
            document.getElementById('tableP90').textContent = percentiles.p90.toFixed(2);
            document.getElementById('tableP90').style.color = getColorForValue(percentiles.p90, kpiType);
            document.getElementById('tableP90Quality').textContent = getQualityLabel(percentiles.p90, kpiType);
            
            document.getElementById('tableAvg').textContent = avg.toFixed(2);
            document.getElementById('tableAvg').style.color = getColorForValue(avg, kpiType);
            document.getElementById('tableAvgQuality').textContent = getQualityLabel(avg, kpiType);
            
            document.getElementById('tableMax').textContent = max.toFixed(2);
            document.getElementById('tableMax').style.color = getColorForValue(max, kpiType);
            document.getElementById('tableMaxQuality').textContent = getQualityLabel(max, kpiType);

            // Calculate signal quality distribution (for RSRP)
            if (kpiType === 'rsrp') {
                const excellent = values.filter(v => v >= -80).length;
                const good = values.filter(v => v >= -90 && v < -80).length;
                const fair = values.filter(v => v >= -100 && v < -90).length;
                const poor = values.filter(v => v < -100).length;
                const total = values.length;

                document.getElementById('qualExcellent').textContent = excellent;
                document.getElementById('qualExcellentPct').textContent = ((excellent/total)*100).toFixed(1);
                document.getElementById('qualGood').textContent = good;
                document.getElementById('qualGoodPct').textContent = ((good/total)*100).toFixed(1);
                document.getElementById('qualFair').textContent = fair;
                document.getElementById('qualFairPct').textContent = ((fair/total)*100).toFixed(1);
                document.getElementById('qualPoor').textContent = poor;
                document.getElementById('qualPoorPct').textContent = ((poor/total)*100).toFixed(1);
            }

            // Show histogram for all KPIs except 'all' and 'pci'
            if (kpiType !== 'all' && kpiType !== 'pci') {
                renderKPIHistogram(kpiType, values);
                document.getElementById('kpiHistogramContainer').style.display = 'block';
            } else {
                document.getElementById('kpiHistogramContainer').style.display = 'none';
            }

            // Update events list
            const events = parsedData.filter(d => d.event && d.event.trim() !== '');
            const eventsList = document.getElementById('eventsList');
            if (events.length > 0) {
                eventsList.innerHTML = events.map(e => 
                    `<div>${e.time?.split('T')[1]?.slice(0, 8) || '-'} ${e.event.toUpperCase()}</div>`
                ).join('');
            }

            // Chart colors based on KPI type
            const colors = {
                rsrp: { line: '#3b82f6', fill: 'transparent' },
                rsrq: { line: '#3b82f6', fill: 'transparent' },
                sinr: { line: '#3b82f6', fill: 'transparent' },
                pci: { line: '#3b82f6', fill: 'transparent' },
                cqi: { line: '#3b82f6', fill: 'transparent' },
                mcs: { line: '#3b82f6', fill: 'transparent' },
                bler: { line: '#3b82f6', fill: 'transparent' },
                throughput_dl_mbps: { line: '#3b82f6', fill: 'transparent' },
                throughput_ul_mbps: { line: '#3b82f6', fill: 'transparent' }
            };

            const ctx = document.getElementById('kpiChart').getContext('2d');
            
            if (kpiChart) {
                kpiChart.destroy();
            }

            kpiChart = new Chart(ctx, {
                type: currentChartType === 'bar' ? 'bar' : 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: kpiLabel,
                        data: values,
                        borderColor: colors[kpiType].line,
                        backgroundColor: currentChartType === 'bar' ? colors[kpiType].line : 'transparent',
                        borderWidth: 2,
                        fill: false,
                        tension: currentChartType === 'line' ? 0.3 : 0,
                        pointRadius: currentChartType === 'bar' ? 0 : 2,
                        pointHoverRadius: currentChartType === 'bar' ? 0 : 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: { color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { family: 'JetBrains Mono' } }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            titleFont: { family: 'JetBrains Mono', size: 12 },
                            bodyFont: { family: 'JetBrains Mono', size: 11 },
                            padding: 12,
                            borderColor: '#fff',
                            borderWidth: 1,
                            callbacks: {
                                title: function(context) {
                                    const idx = context[0].dataIndex;
                                    return 'Time: ' + context[0].label;
                                },
                                label: function(context) {
                                    return null;
                                },
                                afterLabel: function(context) {
                                    const idx = context.dataIndex;
                                    const point = parsedData[idx];
                                    if (!point) return [];
                                    
                                    const rsrp = parseFloat(point.rsrp) || 0;
                                    const rsrq = parseFloat(point.rsrq) || 0;
                                    const sinr = parseFloat(point.sinr) || 0;
                                    const pci = point.pci || '-';
                                    const cqi = point.cqi || '-';
                                    const mcs = point.mcs || '-';
                                    const bler = point.bler || '-';
                                    const dl = point.throughput_dl_mbps || '-';
                                    const ul = point.throughput_ul_mbps || '-';
                                    
                                    const quality = rsrp >= -80 ? '🟢 Excellent' : 
                                                   rsrp >= -90 ? '🔵 Good' : 
                                                   rsrp >= -100 ? '🟡 Fair' : '🔴 Poor';
                                    

                                    return [
                                        '━━━━━━━━━━━━━━━━━━━',
                                        'RSRP: ' + rsrp.toFixed(2) + ' dBm',
                                        'RSRQ: ' + rsrq.toFixed(2) + ' dB',
                                        'SINR: ' + sinr.toFixed(2) + ' dB',
                                        'PCI: ' + pci,
                                        'CQI: ' + cqi + ' | MCS: ' + mcs,
                                        'BLER: ' + bler + '%',
                                        'DL: ' + dl + ' Mbps | UL: ' + ul + ' Mbps',
                                        '━━━━━━━━━━━━━━━━━━━',
                                        'Quality: ' + quality
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: { 
                                color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563',
                                maxRotation: 45,
                                minRotation: 45,
                                font: { size: 9, family: 'JetBrains Mono' }
                            },
                            grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                        },
                        y: {
                            ticks: { 
                                color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563',
                                font: { family: 'JetBrains Mono' }
                            },
                            grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                        }
                    }
                }
            });
        }

function renderScatterPlots() {
            if (parsedData.length === 0) return;

            const labels = parsedData.map((d, i) => d.time?.split('T')[1]?.slice(0, 8) || `${i+1}`);
            const tech = detectedTechnology || 'LTE';
            
            // Update section title with technology name
            const titleElement = document.getElementById('kpiComparisonTitle');
            if (titleElement) {
                titleElement.textContent = `📊 ${tech} KPI COMPARISON ANALYSIS (Time Series)`;
            }
            
            // Extract technology-specific KPIs
            let rsrpVals, rsrqVals, sinrVals;
            
            if (tech === 'NR') {
                rsrpVals = parsedData.map(d => parseFloat(d.nr_rsrp) || -100);
                rsrqVals = parsedData.map(d => parseFloat(d.nr_rsrq) || -10);
                sinrVals = parsedData.map(d => parseFloat(d.nr_sinr) || 0);
            } else if (tech === 'UMTS') {
                rsrpVals = parsedData.map(d => parseFloat(d.wcdma_rscp) || -100);
                rsrqVals = parsedData.map(d => parseFloat(d.wcdma_ecno) || -10);
                sinrVals = parsedData.map(d => 0); // UMTS has no SINR
            } else if (tech === 'GSM') {
                rsrpVals = parsedData.map(d => parseFloat(d.gsm_rxlev || d.rxlev) || -100);
                rsrqVals = parsedData.map(d => parseFloat(d.gsm_rxqual || d.rxqual) || 0);
                sinrVals = parsedData.map(d => 0); // GSM has no SINR
            } else {
                rsrpVals = parsedData.map(d => parseFloat(d.rsrp) || -100);
                rsrqVals = parsedData.map(d => parseFloat(d.rsrq) || -10);
                sinrVals = parsedData.map(d => parseFloat(d.sinr) || 0);
            }
            
            const cqiVals = parsedData.map(d => parseFloat(d.cqi) || 0);
            const mcsVals = parsedData.map(d => parseFloat(d.mcs) || 0);
            const blerVals = parsedData.map(d => parseFloat(d.bler) || 0);
            const tputDlVals = parsedData.map(d => parseFloat(d.throughput_dl_mbps) || 0);
            const tputUlVals = parsedData.map(d => parseFloat(d.throughput_ul_mbps) || 0);
            
            // TxPower extraction - handle case variations (TxPower, txpower, TXPOWER)
            const txPowerVals = parsedData.map(d => {
                const val = parseFloat(d.TxPower || d.txpower || d.TXPOWER || d.tx_power);
                return isNaN(val) ? null : val; // Use null for missing values to enable spanGaps
            });
            
            // Chart labels based on technology
            const rsrpLabel = tech === 'NR' ? 'NR-RSRP (dBm)' : tech === 'UMTS' ? 'RSCP (dBm)' : tech === 'GSM' ? 'RxLev (dBm)' : 'RSRP (dBm)';
            const rsrqLabel = tech === 'NR' ? 'NR-RSRQ (dB)' : tech === 'UMTS' ? 'Ec/No (dB)' : tech === 'GSM' ? 'RxQual' : 'RSRQ (dB)';
            const sinrLabel = tech === 'NR' ? 'NR-SINR (dB)' : 'SINR (dB)';
            
            // Update chart headers
            const rsrpHeader = document.getElementById('rsrpChartHeader');
            const rsrqHeader = document.getElementById('rsrqChartHeader');
            const sinrHeader = document.getElementById('sinrChartHeader');
            if (rsrpHeader) rsrpHeader.textContent = rsrpLabel;
            if (rsrqHeader) rsrqHeader.textContent = rsrqLabel;
            if (sinrHeader) sinrHeader.textContent = sinrLabel;

            // CQI (Separate Chart) - Hide for UMTS/GSM
            const cqiContainer = document.getElementById('compCqiOnly')?.parentElement;
            if (tech !== 'UMTS' && tech !== 'GSM') {
                if (cqiContainer) cqiContainer.style.display = 'block';
                if (compCqiOnly) compCqiOnly.destroy();
            const maxCqi = Math.max(...cqiVals);
            compCqiOnly = new Chart(document.getElementById('compCqiOnly'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'CQI', data: cqiVals, borderColor: '#3b82f6', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, fill: false, tension: 0.4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            titleFont: { family: 'JetBrains Mono', size: 11 },
                            bodyFont: { family: 'JetBrains Mono', size: 10 },
                            padding: 10,
                            borderColor: '#fff',
                            borderWidth: 1,
                            callbacks: {
                                title: function(context) { return 'Time: ' + context[0].label; },
                                label: function(context) {
                                    return 'CQI: ' + context.parsed.y.toFixed(0);
                                }
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { type: 'linear', title: { display: true, text: 'CQI', color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: 0, max: Math.ceil(maxCqi * 1.1) }
                    }
                }
            });
            } else {
                if (cqiContainer) cqiContainer.style.display = 'none';
            }

            // MCS (Separate Chart) - Hide for UMTS/GSM
            const mcsContainer = document.getElementById('compMcsOnly')?.parentElement;
            if (tech !== 'UMTS' && tech !== 'GSM') {
                if (mcsContainer) mcsContainer.style.display = 'block';
                if (compMcsOnly) compMcsOnly.destroy();
            const maxMcs = Math.max(...mcsVals);
            compMcsOnly = new Chart(document.getElementById('compMcsOnly'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'MCS', data: mcsVals, borderColor: '#3b82f6', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, fill: false, tension: 0.4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            titleFont: { family: 'JetBrains Mono', size: 11 },
                            bodyFont: { family: 'JetBrains Mono', size: 10 },
                            padding: 10,
                            borderColor: '#fff',
                            borderWidth: 1,
                            callbacks: {
                                title: function(context) { return 'Time: ' + context[0].label; },
                                label: function(context) {
                                    return 'MCS: ' + context.parsed.y.toFixed(0);
                                }
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { type: 'linear', title: { display: true, text: 'MCS', color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: 0, max: Math.ceil(maxMcs * 1.1) }
                    }
                }
            });
            } else {
                if (mcsContainer) mcsContainer.style.display = 'none';
            }

            // SINR (Separate Chart) - Only for LTE/NR
            const sinrContainer = document.getElementById('compSinrOnly')?.parentElement;
            if (tech !== 'UMTS' && tech !== 'GSM') {
                if (sinrContainer) sinrContainer.style.display = 'block';
                if (compSinrOnly) compSinrOnly.destroy();
                const minSinr = Math.min(...sinrVals);
                const maxSinr = Math.max(...sinrVals);
                compSinrOnly = new Chart(document.getElementById('compSinrOnly'), {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            { label: sinrLabel, data: sinrVals, borderColor: '#3b82f6', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, fill: false, tension: 0.4 }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: { 
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(0,0,0,0.9)',
                                titleFont: { family: 'JetBrains Mono', size: 11 },
                                bodyFont: { family: 'JetBrains Mono', size: 10 },
                                padding: 10,
                                borderColor: '#fff',
                                borderWidth: 1,
                                callbacks: {
                                    title: function(context) { return 'Time: ' + context[0].label; },
                                    label: function(context) {
                                        return sinrLabel + ': ' + context.parsed.y.toFixed(2);
                                    }
                                }
                            }
                        },
                        scales: {
                            x: { ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                            y: { type: 'linear', title: { display: true, text: sinrLabel, color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: Math.floor(minSinr - 2), max: Math.ceil(maxSinr + 2) }
                        }
                    }
                });
            } else {
                if (sinrContainer) sinrContainer.style.display = 'none';
            }

            // RSRP (Separate Chart)
            if (compRsrpOnly) compRsrpOnly.destroy();
            const minRsrp = Math.min(...rsrpVals);
            const maxRsrp = Math.max(...rsrpVals);
            compRsrpOnly = new Chart(document.getElementById('compRsrpOnly'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: rsrpLabel, data: rsrpVals, borderColor: '#3b82f6', backgroundColor: 'transparent', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { display: false },
                        title: { display: true, text: rsrpLabel, color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12, weight: 'bold', family: 'JetBrains Mono' } },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            titleFont: { family: 'JetBrains Mono', size: 11 },
                            bodyFont: { family: 'JetBrains Mono', size: 10 },
                            padding: 10,
                            borderColor: '#fff',
                            borderWidth: 1,
                            callbacks: {
                                title: function(context) { return 'Time: ' + context[0].label; },
                                label: function(context) {
                                    return rsrpLabel + ': ' + context.parsed.y.toFixed(2);
                                }
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { type: 'linear', title: { display: true, text: rsrpLabel, color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: Math.floor(minRsrp - 5), max: Math.ceil(maxRsrp + 5) }
                    }
                }
            });

            // RSRQ (Separate Chart)
            if (compRsrqOnly) compRsrqOnly.destroy();
            const minRsrq = Math.min(...rsrqVals);
            const maxRsrq = Math.max(...rsrqVals);
            compRsrqOnly = new Chart(document.getElementById('compRsrqOnly'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: rsrqLabel, data: rsrqVals, borderColor: '#3b82f6', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, fill: false, tension: 0.4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { display: false },
                        title: { display: true, text: rsrqLabel, color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12, weight: 'bold', family: 'JetBrains Mono' } },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            titleFont: { family: 'JetBrains Mono', size: 11 },
                            bodyFont: { family: 'JetBrains Mono', size: 10 },
                            padding: 10,
                            borderColor: '#fff',
                            borderWidth: 1,
                            callbacks: {
                                title: function(context) { return 'Time: ' + context[0].label; },
                                label: function(context) {
                                    return rsrqLabel + ': ' + context.parsed.y.toFixed(2);
                                }
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { type: 'linear', title: { display: true, text: rsrqLabel, color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: Math.floor(minRsrq - 2), max: Math.ceil(maxRsrq + 2) }
                    }
                }
            });

            // Throughput DL (Separate Chart)
            if (compTputOnly) compTputOnly.destroy();
            const maxTput = Math.max(...tputDlVals);
            compTputOnly = new Chart(document.getElementById('compTputOnly'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'DL Throughput (Mbps)', data: tputDlVals, borderColor: '#3b82f6', backgroundColor: 'transparent', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            titleFont: { family: 'JetBrains Mono', size: 11 },
                            bodyFont: { family: 'JetBrains Mono', size: 10 },
                            padding: 10,
                            borderColor: '#fff',
                            borderWidth: 1,
                            callbacks: {
                                title: function(context) { return 'Time: ' + context[0].label; },
                                label: function(context) {
                                    return 'DL Throughput: ' + context.parsed.y.toFixed(2) + ' Mbps';
                                }
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { type: 'linear', title: { display: true, text: 'Throughput (Mbps)', color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: 0, max: Math.ceil(maxTput * 1.1) }
                    }
                }
            });

            // Throughput UL (Separate Chart)
            if (compTputUlOnly) compTputUlOnly.destroy();
            const maxTputUl = Math.max(...tputUlVals);
            compTputUlOnly = new Chart(document.getElementById('compTputUlOnly'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'UL Throughput (Mbps)', data: tputUlVals, borderColor: '#3b82f6', backgroundColor: 'transparent', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            titleFont: { family: 'JetBrains Mono', size: 11 },
                            bodyFont: { family: 'JetBrains Mono', size: 10 },
                            padding: 10,
                            borderColor: '#fff',
                            borderWidth: 1,
                            callbacks: {
                                title: function(context) { return 'Time: ' + context[0].label; },
                                label: function(context) {
                                    return 'UL Throughput: ' + context.parsed.y.toFixed(2) + ' Mbps';
                                }
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { type: 'linear', title: { display: true, text: 'Throughput (Mbps)', color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: 0, max: Math.ceil(maxTputUl * 1.1) }
                    }
                }
            });

            // BLER (Separate Chart) - Hide for UMTS/GSM
            const blerContainer = document.getElementById('compBlerOnly')?.parentElement;
            if (tech !== 'UMTS' && tech !== 'GSM') {
                if (blerContainer) blerContainer.style.display = 'block';
                if (compBlerOnly) compBlerOnly.destroy();
                const maxBler = Math.max(...blerVals.filter(v => v > 0));
                const blerYMax = maxBler > 0 ? Math.ceil(maxBler * 1.2) : 10;
                compBlerOnly = new Chart(document.getElementById('compBlerOnly'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'BLER (%)', data: blerVals, borderColor: '#3b82f6', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, fill: false, tension: 0.4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            titleFont: { family: 'JetBrains Mono', size: 11 },
                            bodyFont: { family: 'JetBrains Mono', size: 10 },
                            padding: 10,
                            borderColor: '#fff',
                            borderWidth: 1,
                            callbacks: {
                                title: function(context) { return 'Time: ' + context[0].label; },
                                label: function(context) {
                                    return 'BLER: ' + context.parsed.y.toFixed(2) + ' %';
                                }
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { type: 'linear', title: { display: true, text: 'BLER (%)', color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: 0, max: blerYMax }
                    }
                }
            });
            } else {
                if (blerContainer) blerContainer.style.display = 'none';
            }

            // TxPower (Separate Chart) - Available for all technologies
            const txPowerContainer = document.getElementById('compTxPowerOnly')?.parentElement;
            if (txPowerContainer) {
                // Check if we have valid TxPower data
                const validTxPowerVals = txPowerVals.filter(v => v !== null && !isNaN(v));
                
                if (validTxPowerVals.length > 0) {
                    txPowerContainer.style.display = 'block';
                    if (compTxPowerOnly) compTxPowerOnly.destroy();
                    
                    const minTxPower = Math.min(...validTxPowerVals);
                    const maxTxPower = Math.max(...validTxPowerVals);
                    
                    compTxPowerOnly = new Chart(document.getElementById('compTxPowerOnly'), {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [
                                { 
                                    label: 'Tx Power (dBm)', 
                                    data: txPowerVals, 
                                    borderColor: '#3b82f6', // Blue color consistent with other KPIs
                                    backgroundColor: 'transparent', 
                                    borderWidth: 2, 
                                    pointRadius: 0, 
                                    fill: false, 
                                    tension: 0.4,
                                    spanGaps: true // Handle missing values gracefully
                                }
                            ]
                        },
                        options: {
                            responsive: true, 
                            maintainAspectRatio: false,
                            interaction: { mode: 'index', intersect: false },
                            plugins: { 
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: 'rgba(0,0,0,0.9)',
                                    titleFont: { family: 'JetBrains Mono', size: 11 },
                                    bodyFont: { family: 'JetBrains Mono', size: 10 },
                                    padding: 10,
                                    borderColor: '#fff',
                                    borderWidth: 1,
                                    callbacks: {
                                        title: function(context) { return 'Time: ' + context[0].label; },
                                        label: function(context) {
                                            if (context.parsed.y === null) return 'Tx Power: N/A';
                                            return 'Tx Power: ' + context.parsed.y.toFixed(2) + ' dBm';
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: { 
                                    ticks: { 
                                        color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', 
                                        font: { size: 9 }, 
                                        maxRotation: 0, 
                                        minRotation: 0, 
                                        autoSkip: true, 
                                        maxTicksLimit: 5, 
                                        padding: 8 
                                    }, 
                                    grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } 
                                },
                                y: { 
                                    type: 'linear', 
                                    title: { 
                                        display: true, 
                                        text: 'Tx Power (dBm)', 
                                        color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', 
                                        font: { size: 11, weight: 'bold' } 
                                    }, 
                                    ticks: { 
                                        color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', 
                                        font: { size: 10 } 
                                    }, 
                                    grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, 
                                    min: Math.floor(minTxPower - 2), 
                                    max: Math.ceil(maxTxPower + 2) 
                                }
                            }
                        }
                    });
                } else {
                    // No valid TxPower data, hide the container
                    txPowerContainer.style.display = 'none';
                }
            }
        }

        function calculatePercentile(arr, p) {
            const sorted = [...arr].sort((a, b) => a - b);
            const index = (p / 100) * (sorted.length - 1);
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            const weight = index % 1;
            return sorted[lower] * (1 - weight) + sorted[upper] * weight;
        }

        function calculateBinnedPercentiles(xVals, yVals, percentile) {
            const bins = {};
            xVals.forEach((x, i) => {
                const bin = Math.round(x);
                if (!bins[bin]) bins[bin] = [];
                bins[bin].push(yVals[i]);
            });
            return Object.keys(bins).sort((a, b) => a - b).map(bin => ({
                x: parseFloat(bin),
                y: calculatePercentile(bins[bin], percentile)
            }));
        }

        function calculateBinnedAverage(xVals, yVals) {
            const bins = {};
            xVals.forEach((x, i) => {
                const bin = Math.round(x);
                if (!bins[bin]) bins[bin] = [];
                bins[bin].push(yVals[i]);
            });
            return Object.keys(bins).sort((a, b) => a - b).map(bin => ({
                x: parseFloat(bin),
                y: bins[bin].reduce((a, b) => a + b, 0) / bins[bin].length
            }));
        }

        /**
         * FILTER ACTIVE DATA POINTS FOR CORRELATION ANALYSIS
         * Removes idle UE samples (throughput=0 with no active session) to show realistic network correlation
         * 
         * @param {Array} xVals - X-axis values (e.g., SINR, RSRP)
         * @param {Array} yVals - Y-axis values (throughput)
         * @param {Array} cqiVals - CQI values (optional, for activity detection)
         * @param {Array} mcsVals - MCS values (optional, for activity detection)
         * @param {Array} blerVals - BLER values (optional, for activity detection)
         * @param {boolean} includeIdle - If true, includes all samples; if false, filters idle samples
         * @returns {Object} - { dataPoints: [{x, y}], filteredX: [], filteredY: [] }
         */
        function filterActiveDataPoints(xVals, yVals, cqiVals, mcsVals, blerVals, includeIdle = false) {
            if (includeIdle) {
                // Return all data without filtering
                const dataPoints = xVals.map((x, i) => ({ x: x, y: yVals[i] }));
                console.log('🔵 FILTERING OFF: Showing all ' + xVals.length + ' samples (including idle UE states)');
                return {
                    dataPoints: dataPoints,
                    filteredX: xVals,
                    filteredY: yVals
                };
            }
            
            // Filter out idle samples (UE not in active data session)
            const dataPoints = [];
            const filteredX = [];
            const filteredY = [];
            let idleCount = 0;
            let zeroTputActiveCount = 0;
            
            for (let i = 0; i < xVals.length; i++) {
                const tput = yVals[i];
                const cqi = cqiVals ? cqiVals[i] : null;
                const mcs = mcsVals ? mcsVals[i] : null;
                const bler = blerVals ? blerVals[i] : null;
                
                // Determine if sample represents idle UE state
                // Idle indicators: throughput=0 AND (BLER=0 or 100) AND (CQI=0 or MCS=0)
                const isIdle = (
                    tput === 0 &&
                    (bler === 0 || bler === 100 || bler === null) &&
                    (cqi === 0 || cqi === null) &&
                    (mcs === 0 || mcs === null)
                );
                
                if (isIdle) {
                    idleCount++;
                } else if (tput === 0) {
                    // Throughput = 0 but NOT idle (active session with poor performance)
                    zeroTputActiveCount++;
                }
                
                // Include only active samples
                if (!isIdle) {
                    dataPoints.push({ x: xVals[i], y: tput });
                    filteredX.push(xVals[i]);
                    filteredY.push(tput);
                }
            }
            
            // Debug logging
            console.log('🟢 FILTERING ON: Active sessions only');
            console.log('   📊 Total samples: ' + xVals.length);
            console.log('   ✅ Active samples kept: ' + filteredX.length + ' (' + Math.round(filteredX.length/xVals.length*100) + '%)');
            console.log('   ❌ Idle samples removed: ' + idleCount + ' (' + Math.round(idleCount/xVals.length*100) + '%)');
            if (zeroTputActiveCount > 0) {
                console.log('   ⚠️  Zero-throughput ACTIVE samples: ' + zeroTputActiveCount + ' (kept - real network issues)');
            }
            
            return {
                dataPoints: dataPoints,
                filteredX: filteredX,
                filteredY: filteredY
            };
        }

        /**
         * EXTRACT EVENT TIMELINE FROM PARSED DATA
         * Identifies network events, PCI changes, and connection releases
         * @param {Array} data - Parsed CSV data
         * @returns {Array} - Array of event objects with time, type, and details
         */
        function extractEventTimeline(data) {
            if (!data || data.length === 0) return [];
            
            const events = [];
            
            data.forEach((point, index) => {
                // 1. EXPLICIT EVENTS FROM CSV (handover, attach, detach, rlf, etc.)
                if (point.event && point.event.trim() !== '') {
                    const eventType = point.event.toLowerCase().trim();
                    
                    // Get PCI based on technology
                    let pci = '-';
                    const tech = point.technology || 'LTE';
                    if (tech === 'NR') {
                        pci = point.nr_pci || '-';
                    } else if (tech === 'UMTS') {
                        pci = point.wcdma_psc || point.psc || '-';
                    } else if (tech === 'GSM') {
                        pci = point.gsm_bsic || point.bsic || '-';
                    } else {
                        pci = point.pci || '-';
                    }
                    
                    events.push({
                        time: point.time,
                        index: index,
                        type: eventType,
                        pci: pci,
                        technology: tech,
                        details: `${eventType.toUpperCase()} event`
                    });
                }
                
                // 2. PCI CHANGES (detect cell changes)
                if (index > 0) {
                    const tech = point.technology || 'LTE';
                    let prevPci, currPci;
                    
                    if (tech === 'NR') {
                        prevPci = data[index-1].nr_pci;
                        currPci = point.nr_pci;
                    } else if (tech === 'UMTS') {
                        prevPci = data[index-1].wcdma_psc || data[index-1].psc;
                        currPci = point.wcdma_psc || point.psc;
                    } else if (tech === 'GSM') {
                        prevPci = data[index-1].gsm_bsic || data[index-1].bsic;
                        currPci = point.gsm_bsic || point.bsic;
                    } else {
                        prevPci = data[index-1].pci;
                        currPci = point.pci;
                    }
                    
                    // Only add if both PCIs exist and are different
                    if (prevPci && currPci && prevPci !== '' && currPci !== '' && prevPci !== currPci) {
                        // Check if there's already an event at this index (avoid duplicates)
                        const existingEvent = events.find(e => e.index === index);
                        if (!existingEvent) {
                            events.push({
                                time: point.time,
                                index: index,
                                type: 'pci_change',
                                pci: currPci,
                                prevPci: prevPci,
                                technology: tech,
                                details: `Cell change: ${prevPci} → ${currPci}`
                            });
                        }
                    }
                }
                
                // 3. RELEASE/DROP DETECTION (throughput drops to 0 + signal degradation)
                if (index > 0) {
                    const prevTput = parseFloat(data[index-1].throughput_dl_mbps) || 0;
                    const currTput = parseFloat(point.throughput_dl_mbps) || 0;
                    
                    // Detect connection drop: throughput was >1 Mbps, now is 0
                    if (prevTput > 1 && currTput === 0) {
                        const tech = point.technology || 'LTE';
                        let pci = '-';
                        
                        if (tech === 'NR') {
                            pci = point.nr_pci || '-';
                        } else if (tech === 'UMTS') {
                            pci = point.wcdma_psc || point.psc || '-';
                        } else if (tech === 'GSM') {
                            pci = point.gsm_bsic || point.bsic || '-';
                        } else {
                            pci = point.pci || '-';
                        }
                        
                        // Check if there's already an event at this index
                        const existingEvent = events.find(e => e.index === index);
                        if (!existingEvent) {
                            events.push({
                                time: point.time,
                                index: index,
                                type: 'release',
                                pci: pci,
                                technology: tech,
                                details: 'Connection released/dropped'
                            });
                        }
                    }
                }
                
                // 4. TECHNOLOGY CHANGES (RAT change: LTE→UMTS, etc.)
                if (index > 0) {
                    const prevTech = data[index-1].technology;
                    const currTech = point.technology;
                    
                    if (prevTech && currTech && prevTech !== currTech) {
                        events.push({
                            time: point.time,
                            index: index,
                            type: 'tech_change',
                            technology: currTech,
                            prevTechnology: prevTech,
                            details: `RAT change: ${prevTech} → ${currTech}`
                        });
                    }
                }
            });
            
            // Sort events by index (chronological order)
            events.sort((a, b) => a.index - b.index);
            
            console.log(`✅ Extracted ${events.length} events from timeline`);
            return events;
        }

        /**
         * GET EVENT ICON FOR VISUAL REPRESENTATION
         * @param {String} type - Event type
         * @returns {String} - Emoji icon
         */
        function getEventIcon(type) {
            const icons = {
                'handover': '↔',
                'pci_change': '🔄',
                'release': '❌',
                'tech_change': '📡',
                'rlf': '⚠',
                'attach': '✅',
                'detach': '🔌',
                'drop': '📉'
            };
            return icons[type] || '📍';
        }

        /**
         * THROTTLE UTILITY FOR PERFORMANCE OPTIMIZATION
         * Limits function execution rate for mousemove events
         * @param {Function} func - Function to throttle
         * @param {Number} limit - Time limit in milliseconds
         * @returns {Function} - Throttled function
         */
        function throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }

        /**
         * GET EVENT COLOR FOR VISUAL REPRESENTATION
         * @param {String} type - Event type
         * @returns {String} - Color hex code
         */
        function getEventColor(type) {
            const colors = {
                'handover': '#f97316',      // Orange
                'pci_change': '#3b82f6',    // Blue
                'release': '#ef4444',       // Red
                'tech_change': '#8b5cf6',   // Purple
                'rlf': '#dc2626',           // Dark red
                'attach': '#10b981',        // Green
                'detach': '#6b7280',        // Gray
                'drop': '#ef4444'           // Red
            };
            return colors[type] || '#6b7280';
        }

        /**
         * CHART.JS PLUGIN: MULTI-KPI EVENT MARKERS
         * Draws vertical dashed lines with event icons at event timestamps
         */
        const multiKpiEventMarkerPlugin = {
            id: 'multiKpiEventMarkers',
            afterDatasetsDraw: (chart, args, options) => {
                const events = options.events || [];
                if (events.length === 0) return;
                
                const ctx = chart.ctx;
                const xAxis = chart.scales.x;
                const yAxis = chart.scales.y;
                
                if (!xAxis || !yAxis) return;
                
                ctx.save();
                
                events.forEach(event => {
                    // Get x position for this event's index
                    const x = xAxis.getPixelForValue(event.index);
                    
                    // Skip if outside visible range
                    if (x < xAxis.left || x > xAxis.right) return;
                    
                    // Draw vertical dashed line
                    ctx.beginPath();
                    ctx.moveTo(x, yAxis.top);
                    ctx.lineTo(x, yAxis.bottom);
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = getEventColor(event.type);
                    ctx.setLineDash([8, 4]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    
                    // Draw event icon at top
                    const icon = getEventIcon(event.type);
                    ctx.font = 'bold 16px Arial';
                    ctx.fillStyle = getEventColor(event.type);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    ctx.fillText(icon, x, yAxis.top - 5);
                });
                
                ctx.restore();
            }
        };

        /**
         * POLYNOMIAL REGRESSION IMPLEMENTATION
         * Computes polynomial coefficients using least squares method
         * @param {Array} xData - Array of x values
         * @param {Array} yData - Array of y values
         * @param {Number} degree - Polynomial degree (1=linear, 2=quadratic, 3=cubic, etc.)
         * @returns {Array} - Coefficients [a0, a1, a2, ..., an] where y = a0 + a1*x + a2*x^2 + ...
         */
        function polynomialRegression(xData, yData, degree) {
            // Filter out invalid data points
            const validPoints = [];
            for (let i = 0; i < xData.length; i++) {
                if (!isNaN(xData[i]) && !isNaN(yData[i]) && isFinite(xData[i]) && isFinite(yData[i])) {
                    validPoints.push({ x: xData[i], y: yData[i] });
                }
            }
            
            if (validPoints.length < degree + 1) {
                console.warn('Insufficient data points for polynomial degree', degree);
                return null;
            }
            
            const n = validPoints.length;
            const x = validPoints.map(p => p.x);
            const y = validPoints.map(p => p.y);
            
            // Build the Vandermonde matrix and solve using normal equations
            // X^T * X * coeffs = X^T * y
            
            const matrixSize = degree + 1;
            const matrix = Array(matrixSize).fill(0).map(() => Array(matrixSize).fill(0));
            const vector = Array(matrixSize).fill(0);
            
            // Construct the normal equation matrix
            for (let i = 0; i < matrixSize; i++) {
                for (let j = 0; j < matrixSize; j++) {
                    let sum = 0;
                    for (let k = 0; k < n; k++) {
                        sum += Math.pow(x[k], i + j);
                    }
                    matrix[i][j] = sum;
                }
                
                let sum = 0;
                for (let k = 0; k < n; k++) {
                    sum += y[k] * Math.pow(x[k], i);
                }
                vector[i] = sum;
            }
            
            // Solve using Gaussian elimination
            const coefficients = gaussianElimination(matrix, vector);
            return coefficients;
        }
        
        /**
         * Gaussian Elimination solver for linear systems
         * @param {Array} matrix - 2D array representing coefficient matrix
         * @param {Array} vector - 1D array representing constants
         * @returns {Array} - Solution vector
         */
        function gaussianElimination(matrix, vector) {
            const n = matrix.length;
            const augmented = matrix.map((row, i) => [...row, vector[i]]);
            
            // Forward elimination
            for (let i = 0; i < n; i++) {
                // Find pivot
                let maxRow = i;
                for (let k = i + 1; k < n; k++) {
                    if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                        maxRow = k;
                    }
                }
                
                // Swap rows
                [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
                
                // Check for singular matrix
                if (Math.abs(augmented[i][i]) < 1e-10) {
                    console.warn('Matrix is singular or nearly singular');
                    return null;
                }
                
                // Eliminate column
                for (let k = i + 1; k < n; k++) {
                    const factor = augmented[k][i] / augmented[i][i];
                    for (let j = i; j <= n; j++) {
                        augmented[k][j] -= factor * augmented[i][j];
                    }
                }
            }
            
            // Back substitution
            const solution = Array(n).fill(0);
            for (let i = n - 1; i >= 0; i--) {
                solution[i] = augmented[i][n];
                for (let j = i + 1; j < n; j++) {
                    solution[i] -= augmented[i][j] * solution[j];
                }
                solution[i] /= augmented[i][i];
            }
            
            return solution;
        }
        
        /**
         * Generate polynomial trendline data points
         * @param {Array} xData - Original x values (for range determination)
         * @param {Array} coefficients - Polynomial coefficients
         * @param {Number} numPoints - Number of points to generate (default: 100)
         * @returns {Array} - Array of {x, y} points for the trendline
         */
        function generatePolynomialTrendline(xData, coefficients, numPoints = 100) {
            if (!coefficients || coefficients.length === 0) return [];
            
            const validX = xData.filter(x => !isNaN(x) && isFinite(x));
            if (validX.length === 0) return [];
            
            const xMin = Math.min(...validX);
            const xMax = Math.max(...validX);
            const step = (xMax - xMin) / (numPoints - 1);
            
            const trendline = [];
            for (let i = 0; i < numPoints; i++) {
                const x = xMin + i * step;
                let y = 0;
                
                // Evaluate polynomial: y = a0 + a1*x + a2*x^2 + ... + an*x^n
                for (let j = 0; j < coefficients.length; j++) {
                    y += coefficients[j] * Math.pow(x, j);
                }
                
                trendline.push({ x, y });
            }
            
            return trendline;
        }

        function renderCorrelationScatters() {
            if (parsedData.length === 0) return;

            const tech = detectedTechnology || 'LTE';
            
            // Get user preference for including idle samples
            const includeIdle = document.getElementById('includeIdleSamples')?.checked || false;
            
            // Extract technology-specific KPIs
            let rsrpVals, sinrVals;
            
            if (tech === 'NR') {
                rsrpVals = parsedData.map(d => parseFloat(d.nr_rsrp) || -100);
                sinrVals = parsedData.map(d => parseFloat(d.nr_sinr) || 0);
            } else if (tech === 'UMTS') {
                rsrpVals = parsedData.map(d => parseFloat(d.wcdma_rscp) || -100);
                sinrVals = null; // UMTS has no SINR
            } else if (tech === 'GSM') {
                rsrpVals = parsedData.map(d => parseFloat(d.gsm_rxlev || d.rxlev) || -100);
                sinrVals = null; // GSM has no SINR
            } else {
                rsrpVals = parsedData.map(d => parseFloat(d.rsrp) || -100);
                sinrVals = parsedData.map(d => parseFloat(d.sinr) || 0);
            }
            
            const tputDlVals = parsedData.map(d => parseFloat(d.throughput_dl_mbps) || 0);
            const cqiVals = parsedData.map(d => parseFloat(d.cqi) || 0);
            const mcsVals = parsedData.map(d => parseFloat(d.mcs) || 0);
            const blerVals = parsedData.map(d => parseFloat(d.bler) || 0);
            
            const rsrpLabel = tech === 'NR' ? 'NR-RSRP (dBm)' : tech === 'UMTS' ? 'RSCP (dBm)' : tech === 'GSM' ? 'RxLev (dBm)' : 'RSRP (dBm)';
            const sinrLabel = tech === 'NR' ? 'NR-SINR (dB)' : 'SINR (dB)';

            // Throughput vs SINR (or RSRP for UMTS/GSM) - Hide for UMTS/GSM since it's redundant
            const scatterTputSinrContainer = document.getElementById('scatterTputSinr')?.parentElement;
            if (tech !== 'UMTS' && tech !== 'GSM') {
                if (scatterTputSinrContainer) scatterTputSinrContainer.style.display = 'block';
                const xAxisVals = sinrVals || rsrpVals;
                const xAxisLabel = sinrVals ? sinrLabel : rsrpLabel;
                
                // Apply filtering to remove idle samples
                const filtered = filterActiveDataPoints(xAxisVals, tputDlVals, cqiVals, mcsVals, blerVals, includeIdle);
                const tputXData = filtered.dataPoints;
                const filteredX = filtered.filteredX;
                const filteredY = filtered.filteredY;
                
                // Calculate statistics on filtered data
                const tputXP90 = calculateBinnedPercentiles(filteredX, filteredY, 90);
                const tputXP50 = calculateBinnedPercentiles(filteredX, filteredY, 50);
                const tputXAvg = calculateBinnedAverage(filteredX, filteredY);
                
                // Calculate polynomial trendline on filtered data
                const polyCoeffs = polynomialRegression(filteredX, filteredY, polynomialDegree);
                const polyTrendline = polyCoeffs ? generatePolynomialTrendline(filteredX, polyCoeffs, 100) : [];

                if (scatterTputSinr) scatterTputSinr.destroy();
                scatterTputSinr = new Chart(document.getElementById('scatterTputSinr'), {
                    type: 'scatter',
                    data: {
                        datasets: [
                            { label: 'Data Points', data: tputXData, backgroundColor: 'rgba(59,130,246,0.6)', pointRadius: 3, pointHoverRadius: 5 },
                            { label: '90th Percentile', data: tputXP90, type: 'line', borderColor: '#ef4444', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                            { label: 'Median (50th)', data: tputXP50, type: 'line', borderColor: '#fbbf24', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                            { label: 'Average', data: tputXAvg, type: 'line', borderColor: '#10b981', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                            { label: `Polynomial (Degree ${polynomialDegree})`, data: polyTrendline, type: 'line', borderColor: '#8b5cf6', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { display: true, position: 'top', labels: { color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { family: 'JetBrains Mono', size: 10 } } },
                            title: { display: true, text: `DL Throughput vs ${xAxisLabel.split(' ')[0]} ${includeIdle ? '(All Samples)' : '(Active Sessions Only)'}`, color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 14 } },
                            tooltip: { backgroundColor: 'rgba(0,0,0,0.9)', titleFont: { family: 'JetBrains Mono' }, bodyFont: { family: 'JetBrains Mono' } }
                        },
                        scales: {
                            x: { title: { display: true, text: xAxisLabel, color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12 } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563' }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                            y: { title: { display: true, text: 'DL Throughput (Mbps)', color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12 } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563' }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } }
                        }
                    }
                });
            } else {
                if (scatterTputSinrContainer) scatterTputSinrContainer.style.display = 'none';
            }

            // Throughput vs RSRP - Apply same filtering
            const filteredRsrp = filterActiveDataPoints(rsrpVals, tputDlVals, cqiVals, mcsVals, blerVals, includeIdle);
            const rsrpTputData = filteredRsrp.dataPoints;
            const rsrpFilteredX = filteredRsrp.filteredX;
            const rsrpFilteredY = filteredRsrp.filteredY;
            
            const rsrpTputP90 = calculateBinnedPercentiles(rsrpFilteredX, rsrpFilteredY, 90);
            const rsrpTputP50 = calculateBinnedPercentiles(rsrpFilteredX, rsrpFilteredY, 50);
            const rsrpTputAvg = calculateBinnedAverage(rsrpFilteredX, rsrpFilteredY);
            
            // Calculate polynomial trendline on filtered data
            const rsrpPolyCoeffs = polynomialRegression(rsrpFilteredX, rsrpFilteredY, polynomialDegree);
            const rsrpPolyTrendline = rsrpPolyCoeffs ? generatePolynomialTrendline(rsrpFilteredX, rsrpPolyCoeffs, 100) : [];

            if (scatterTputRsrp) scatterTputRsrp.destroy();
            scatterTputRsrp = new Chart(document.getElementById('scatterTputRsrp'), {
                type: 'scatter',
                data: {
                    datasets: [
                        { label: 'Data Points', data: rsrpTputData, backgroundColor: 'rgba(59,130,246,0.6)', pointRadius: 3, pointHoverRadius: 5 },
                        { label: '90th Percentile', data: rsrpTputP90, type: 'line', borderColor: '#ef4444', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                        { label: 'Median (50th)', data: rsrpTputP50, type: 'line', borderColor: '#fbbf24', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                        { label: 'Average', data: rsrpTputAvg, type: 'line', borderColor: '#10b981', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                        { label: `Polynomial (Degree ${polynomialDegree})`, data: rsrpPolyTrendline, type: 'line', borderColor: '#8b5cf6', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top', labels: { color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { family: 'JetBrains Mono', size: 10 } } },
                        title: { display: true, text: `DL Throughput vs ${rsrpLabel.split(' ')[0]} ${includeIdle ? '(All Samples)' : '(Active Sessions Only)'}`, color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 14 } },
                        tooltip: { backgroundColor: 'rgba(0,0,0,0.9)', titleFont: { family: 'JetBrains Mono' }, bodyFont: { family: 'JetBrains Mono' } }
                    },
                    scales: {
                        x: { title: { display: true, text: rsrpLabel, color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12 } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563' }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { title: { display: true, text: 'DL Throughput (Mbps)', color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12 } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563' }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } }
                    }
                }
            });

            // MCS vs CQI - Hide for UMTS/GSM
            const scatterMcsCqiContainer = document.getElementById('scatterMcsCqi')?.parentElement;
            if (tech !== 'UMTS' && tech !== 'GSM') {
                if (scatterMcsCqiContainer) scatterMcsCqiContainer.style.display = 'block';
                const cqiMcsData = cqiVals.map((cqi, i) => ({ x: cqi, y: mcsVals[i] }));
                const cqiMcsP90 = calculateBinnedPercentiles(cqiVals, mcsVals, 90);
                const cqiMcsP50 = calculateBinnedPercentiles(cqiVals, mcsVals, 50);
                const cqiMcsAvg = calculateBinnedAverage(cqiVals, mcsVals);
                
                // Calculate polynomial trendline
                const cqiPolyCoeffs = polynomialRegression(cqiVals, mcsVals, polynomialDegree);
                const cqiPolyTrendline = cqiPolyCoeffs ? generatePolynomialTrendline(cqiVals, cqiPolyCoeffs, 100) : [];

                if (scatterMcsCqi) scatterMcsCqi.destroy();
            scatterMcsCqi = new Chart(document.getElementById('scatterMcsCqi'), {
                type: 'scatter',
                data: {
                    datasets: [
                        { label: 'Data Points', data: cqiMcsData, backgroundColor: 'rgba(59,130,246,0.6)', pointRadius: 3, pointHoverRadius: 5 },
                        { label: '90th Percentile', data: cqiMcsP90, type: 'line', borderColor: '#ef4444', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                        { label: 'Median (50th)', data: cqiMcsP50, type: 'line', borderColor: '#fbbf24', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                        { label: 'Average', data: cqiMcsAvg, type: 'line', borderColor: '#10b981', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                        { label: `Polynomial (Degree ${polynomialDegree})`, data: cqiPolyTrendline, type: 'line', borderColor: '#8b5cf6', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top', labels: { color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { family: 'JetBrains Mono', size: 10 } } },
                        title: { display: true, text: 'MCS vs CQI', color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 14 } },
                        tooltip: { backgroundColor: 'rgba(0,0,0,0.9)', titleFont: { family: 'JetBrains Mono' }, bodyFont: { family: 'JetBrains Mono' } }
                    },
                    scales: {
                        x: { title: { display: true, text: 'CQI', color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12 } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563' }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { title: { display: true, text: 'MCS', color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12 } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563' }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } }
                    }
                }
            });
            } else {
                if (scatterMcsCqiContainer) scatterMcsCqiContainer.style.display = 'none';
            }

            // Throughput vs BLER - Hide for UMTS/GSM
            const scatterBlerTputContainer = document.getElementById('scatterBlerTput')?.parentElement;
            if (tech !== 'UMTS' && tech !== 'GSM') {
                if (scatterBlerTputContainer) scatterBlerTputContainer.style.display = 'block';
                const blerTputData = blerVals.map((bler, i) => ({ x: bler, y: tputDlVals[i] }));
                const blerTputP90 = calculateBinnedPercentiles(blerVals, tputDlVals, 90);
                const blerTputP50 = calculateBinnedPercentiles(blerVals, tputDlVals, 50);
                const blerTputAvg = calculateBinnedAverage(blerVals, tputDlVals);
                
                // Calculate polynomial trendline
                const blerPolyCoeffs = polynomialRegression(blerVals, tputDlVals, polynomialDegree);
                const blerPolyTrendline = blerPolyCoeffs ? generatePolynomialTrendline(blerVals, blerPolyCoeffs, 100) : [];

                if (scatterBlerTput) scatterBlerTput.destroy();
            scatterBlerTput = new Chart(document.getElementById('scatterBlerTput'), {
                type: 'scatter',
                data: {
                    datasets: [
                        { label: 'Data Points', data: blerTputData, backgroundColor: 'rgba(59,130,246,0.6)', pointRadius: 3, pointHoverRadius: 5 },
                        { label: '90th Percentile', data: blerTputP90, type: 'line', borderColor: '#ef4444', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                        { label: 'Median (50th)', data: blerTputP50, type: 'line', borderColor: '#fbbf24', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                        { label: 'Average', data: blerTputAvg, type: 'line', borderColor: '#10b981', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                        { label: `Polynomial (Degree ${polynomialDegree})`, data: blerPolyTrendline, type: 'line', borderColor: '#8b5cf6', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top', labels: { color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { family: 'JetBrains Mono', size: 10 } } },
                        title: { display: true, text: 'DL Throughput vs BLER', color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 14 } },
                        tooltip: { backgroundColor: 'rgba(0,0,0,0.9)', titleFont: { family: 'JetBrains Mono' }, bodyFont: { family: 'JetBrains Mono' } }
                    },
                    scales: {
                        x: { title: { display: true, text: 'BLER (%)', color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12 } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563' }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { title: { display: true, text: 'DL Throughput (Mbps)', color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12 } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563' }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } }
                    }
                }
            });
            } else {
                if (scatterBlerTputContainer) scatterBlerTputContainer.style.display = 'none';
            }
        }

        function renderKPIHistogram(kpiType, values) {
            if (values.length === 0) return;

            const tech = detectedTechnology || 'LTE';
            const kpiLabels = { 
                rsrp: tech === 'NR' ? 'NR-RSRP (dBm)' : tech === 'UMTS' ? 'RSCP (dBm)' : tech === 'GSM' ? 'RxLev (dBm)' : 'RSRP (dBm)', 
                rsrq: tech === 'NR' ? 'NR-RSRQ (dB)' : tech === 'UMTS' ? 'Ec/No (dB)' : tech === 'GSM' ? 'RxQual' : 'RSRQ (dB)', 
                sinr: tech === 'NR' ? 'NR-SINR (dB)' : 'SINR (dB)', 
                cqi: 'CQI', 
                mcs: 'MCS', 
                bler: 'BLER (%)', 
                throughput_dl_mbps: 'DL Throughput (Mbps)', 
                throughput_ul_mbps: 'UL Throughput (Mbps)' 
            };
            const kpiColors = { rsrp: '#3b82f6', rsrq: '#10b981', sinr: '#f59e0b', cqi: '#ec4899', mcs: '#14b8a6', bler: '#f97316', throughput_dl_mbps: '#22c55e', throughput_ul_mbps: '#a855f7' };
            
            document.getElementById('histogramTitle').textContent = `${kpiLabels[kpiType] || kpiType.toUpperCase()} Distribution Histogram`;

            const binSize = kpiType === 'rsrp' ? 5 : kpiType === 'rsrq' ? 2 : kpiType === 'sinr' ? 5 : kpiType === 'cqi' ? 1 : kpiType === 'mcs' ? 2 : kpiType === 'bler' ? 5 : 10;
            const bins = {};
            values.forEach(v => {
                const bin = Math.floor(v / binSize) * binSize;
                bins[bin] = (bins[bin] || 0) + 1;
            });

            const binData = Object.entries(bins).map(([bin, count]) => ({ bin: `${bin} to ${parseInt(bin) + binSize}`, binValue: parseInt(bin), count: count })).sort((a, b) => a.binValue - b.binValue);

            const ctx = document.getElementById('kpiHistogram').getContext('2d');
            if (kpiHistogramChart) kpiHistogramChart.destroy();

            const histColors = {
                rsrp: '#3b82f6',
                rsrq: '#3b82f6',
                sinr: '#3b82f6',
                cqi: '#3b82f6',
                mcs: '#3b82f6',
                bler: '#3b82f6',
                throughput_dl_mbps: '#3b82f6',
                throughput_ul_mbps: '#3b82f6'
            };

            kpiHistogramChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: binData.map(d => d.bin),
                    datasets: [{ label: 'Sample Count', data: binData.map(d => d.count), backgroundColor: histColors[kpiType] || (kpiTheme === 'dark' ? '#3b82f6' : '#1e40af'), borderColor: kpiTheme === 'dark' ? '#fff' : '#1f2937', borderWidth: 1 }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            titleFont: { family: 'JetBrains Mono' },
                            bodyFont: { family: 'JetBrains Mono' },
                            callbacks: { label: function(context) { const pct = ((context.parsed.y / values.length) * 100).toFixed(1); return ['Count: ' + context.parsed.y, 'Percentage: ' + pct + '%']; } }
                        }
                    },
                    scales: {
                        x: { ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 9, family: 'JetBrains Mono' }, maxRotation: 45, minRotation: 45 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }, title: { display: true, text: kpiLabels[kpiType] || kpiType.toUpperCase(), color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { family: 'JetBrains Mono' } } },
                        y: { ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { family: 'JetBrains Mono' } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }, title: { display: true, text: 'Count', color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { family: 'JetBrains Mono' } } }
                    }
                }
            });
        }

        document.getElementById('saveConfigBtn').addEventListener('click', async function() {
            saveCurrentState();
            saveToLocalStorage();
            
            const defaultName = `test-case-config-${new Date().toISOString().slice(0,10)}.json`;
            const dataStr = JSON.stringify(currentConfig, null, 2);
            
            // Try modern File System Access API first (Chrome/Edge)
            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: defaultName,
                        types: [{
                            description: 'JSON Files',
                            accept: { 'application/json': ['.json'] }
                        }]
                    });
                    const writable = await handle.createWritable();
                    await writable.write(dataStr);
                    await writable.close();
                    alert('Configuration saved!');
                    return;
                } catch (err) {
                    if (err.name !== 'AbortError') console.error(err);
                    return;
                }
            }
            
            // Fallback for other browsers
            const fileName = prompt('Enter filename for configuration:', defaultName.replace('.json', ''));
            if (fileName) {
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
                a.click();
                URL.revokeObjectURL(url);
                alert('Configuration saved!');
            }
        });

        document.getElementById('loadConfigBtn').addEventListener('click', function() {
            document.getElementById('loadConfigFile').click();
        });

        document.getElementById('loadConfigFile').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const config = JSON.parse(event.target.result);
                    currentConfig = config;
                    applyConfig();
                    alert('Configuration loaded successfully!');
                } catch (err) {
                    alert('Error loading configuration: ' + err.message);
                }
            };
            reader.readAsText(file);
        });

        function applyConfig() {
            // Apply all fields (including empty ones)
            document.querySelectorAll('.editable-field').forEach(el => {
                const field = el.dataset.field;
                if (field && currentConfig.hasOwnProperty(field)) {
                    el.innerHTML = currentConfig[field];
                }
            });
            
            // Clear existing additional fields first
            document.querySelectorAll('#performanceContainer .border-t').forEach(el => el.remove());
            document.querySelectorAll('#impactsContainer .border-t').forEach(el => el.remove());
            document.querySelectorAll('#analysisContainer .border-t').forEach(el => el.remove());
            document.querySelectorAll('#recommendationsContainer .border-t').forEach(el => el.remove());
            
            // Load additional fields if they exist
            if (currentConfig.additionalFields) {
                // Load performance additional fields
                if (currentConfig.additionalFields.performance) {
                    currentConfig.additionalFields.performance.forEach(text => {
                        addFieldToSectionWithContent('performanceContainer', 'performance', text);
                    });
                }
                
                // Load impacts additional fields
                if (currentConfig.additionalFields.impacts) {
                    currentConfig.additionalFields.impacts.forEach(text => {
                        addFieldToSectionWithContent('impactsContainer', 'impacts', text);
                    });
                }
                
                // Load analysis additional fields
                if (currentConfig.additionalFields.analysis) {
                    currentConfig.additionalFields.analysis.forEach(text => {
                        addFieldToSectionWithContent('analysisContainer', 'analysis', text);
                    });
                }
                
                // Load recommendations additional fields
                if (currentConfig.additionalFields.recommendations) {
                    currentConfig.additionalFields.recommendations.forEach(text => {
                        addFieldToSectionWithContent('recommendationsContainer', 'recommendations', text);
                    });
                }
            }
        }

        // =====================================================
        // MAP FUNCTIONALITY (FROM ORIGINAL)
        // =====================================================

        function getMapStyle() {
            // Return proper map styles based on current mode
            if (currentMapStyle === 'dark') {
                // Dark mode: use CartoDB dark basemap
                return {
                    version: 8,
                    sources: {
                        'osm': {
                            type: 'raster',
                            tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
                            tileSize: 256,
                            attribution: '© OpenStreetMap contributors, © CARTO'
                        }
                    },
                    layers: [{
                        id: 'osm-raster',
                        type: 'raster',
                        source: 'osm'
                    }],
                    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
                };
            } else {
                // Light mode: use OpenStreetMap tiles
                return {
                    version: 8,
                    sources: {
                        'osm': {
                            type: 'raster',
                            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
                            tileSize: 256,
                            attribution: '© OpenStreetMap contributors'
                        }
                    },
                    layers: [{
                        id: 'osm-raster',
                        type: 'raster',
                        source: 'osm'
                    }],
                    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
                };
            }
        }

        function initMap() {
            map = new maplibregl.Map({
                container: 'map',
                style: getMapStyle(),
                center: [11.5021, 3.8480],
                zoom: 12
            });

            // Add load event handler for stability
            map.on('load', function() {
                mapReady = true;
                console.log('Map loaded successfully and ready');
            });

            // Add error handling (suppress alert for tile load failures; they rarely block rendering)
            map.on('error', function(e) {
                console.error('Map error:', e);
            });

            // Add resize handling for stability
            window.addEventListener('resize', function() {
                if (map) {
                    setTimeout(function() {
                        map.resize();
                    }, 100);
                }
            });
        }

        function clearMap() {
            markers.forEach(m => m.remove());
            markers = [];
            layerIds.forEach(id => {
                if (map.getLayer(id)) map.removeLayer(id);
                if (map.getSource(id)) map.removeSource(id);
            });
            layerIds = [];
        }

        function parseCSV(csv) {
            const lines = csv.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace('#', 'number'));
            
            // Detect technology type from headers
            const hasNR = headers.includes('nr_rsrp') || headers.includes('nr_pci');
            const hasLTE = headers.includes('rsrp') || headers.includes('pci') || headers.includes('earfcn');
            const hasUMTS = headers.includes('wcdma_rscp') || headers.includes('wcdma_ecno') || headers.includes('wcdma_psc');
            const hasGSM = headers.includes('gsm_rxlev') || headers.includes('rxlev') || headers.includes('rxqual') || headers.includes('gsm_rxqual');
            const hasTechColumn = headers.includes('technology');
            
            return lines.slice(1).map(line => {
                const values = line.split(',');
                const obj = {};
                headers.forEach((h, i) => {
                    const val = values[i]?.trim();
                    
                    // Handle signal strength values
                    if (h === 'rsrp' || h === 'rsrq' || h === 'sinr' || 
                        h === 'wcdma_rscp' || h === 'wcdma_ecno' || 
                        h === 'gsm_rxlev' || h === 'gsm_rxqual' || h === 'rxlev' || h === 'rxqual' ||
                        h === 'nr_rsrp' || h === 'nr_rsrq' || h === 'nr_sinr') {
                        obj[h] = val && val !== '' ? val : '0';
                    } else {
                        obj[h] = val;
                    }
                });
                
                // Auto-detect technology if not specified
                if (!obj.technology || obj.technology === '') {
                    if (hasNR && obj.nr_rsrp && obj.nr_rsrp !== '' && obj.nr_rsrp !== '0') {
                        obj.technology = 'NR';
                    } else if (hasLTE && obj.rsrp && obj.rsrp !== '' && obj.rsrp !== '0') {
                        obj.technology = 'LTE';
                    } else if (hasUMTS && obj.wcdma_rscp && obj.wcdma_rscp !== '' && obj.wcdma_rscp !== '0') {
                        obj.technology = 'UMTS';
                    } else if (hasGSM && (obj.gsm_rxlev || obj.rxlev) && (obj.gsm_rxlev !== '0' || obj.rxlev !== '0')) {
                        obj.technology = 'GSM';
                    } else if (hasLTE) {
                        obj.technology = 'LTE'; // Default to LTE for backward compatibility
                    }
                } else {
                    // Normalize technology values from CSV
                    const techValue = obj.technology.toUpperCase();
                    if (techValue.includes('HSPA') || techValue.includes('WCDMA') || techValue.includes('UMTS')) {
                        obj.technology = 'UMTS';
                    } else if (techValue.includes('GSM') || techValue.includes('EDGE') || techValue.includes('GPRS')) {
                        obj.technology = 'GSM';
                    } else if (techValue.includes('LTE')) {
                        obj.technology = 'LTE';
                    } else if (techValue.includes('NR') || techValue === '5G') {
                        obj.technology = 'NR';
                    } else {
                        // Mark as Unknown if technology doesn't match any known type
                        obj.technology = 'Unknown';
                    }
                }
                
                return obj;
            });
        }

        function getColor(rsrp, row) {
            // Use ECA's Quality column if available
            if (row && row.quality) {
                const quality = row.quality.toLowerCase();
                if (quality === 'excellent') return '#22c55e'; // Green
                if (quality === 'good') return '#3b82f6'; // Blue
                if (quality === 'fair') return '#f59e0b'; // Yellow
                if (quality === 'poor') return '#ef4444'; // Red
            }
            
            // Fallback to RSRP-based coloring for LTE
            if (rsrp >= -80) return '#22c55e';
            if (rsrp >= -90) return '#3b82f6';
            if (rsrp >= -100) return '#f59e0b';
            if (rsrp >= -110) return '#f97316';
            return '#ef4444';
        }

        function renderMap(csvText) {
            clearMap();
            
            // Only parse CSV if csvText is provided (initial load)
            if (csvText) {
                const data = parseCSV(csvText);
                rawParsedData = data; // Store unfiltered data
            }
            
            // Apply technology filter from stored raw data
            parsedData = currentTechFilter === 'all' ? rawParsedData : rawParsedData.filter(row => row.technology === currentTechFilter);
            
            // Detect dominant technology from FILTERED data (not all data)
            const techCounts = {};
            parsedData.forEach(row => {
                if (row.technology) {
                    techCounts[row.technology] = (techCounts[row.technology] || 0) + 1;
                }
            });
            detectedTechnology = Object.keys(techCounts).sort((a, b) => techCounts[b] - techCounts[a])[0] || 'LTE';
            console.log('Detected technology from filtered data:', detectedTechnology, 'Filter:', currentTechFilter);
            
            const coords = [];

            parsedData.forEach((row, idx) => {
                const lat = parseFloat(row.latitude || row.lat);
                const lon = parseFloat(row.longitude || row.lon);
                const tech = row.technology || 'Unknown';
                
                // Skip points with Unknown technology
                if (!isNaN(lat) && !isNaN(lon) && tech !== 'Unknown') {
                    // Get signal strength based on technology
                    let signalValue = -100;
                    const tech = row.technology || 'LTE';
                    
                    if (tech === 'NR') {
                        signalValue = parseFloat(row.nr_rsrp) || -100;
                    } else if (tech === 'LTE') {
                        signalValue = parseFloat(row.rsrp) || -100;
                    } else if (tech === 'UMTS') {
                        signalValue = parseFloat(row.wcdma_rscp) || -100;
                    } else if (tech === 'GSM') {
                        signalValue = parseFloat(row.gsm_rxlev || row.rxlev) || -100;
                    }
                    
                    coords.push({ lat, lon, rsrp: signalValue, color: getColor(signalValue, row), row, idx });
                }
            });

            // Draw path
            for (let i = 0; i < coords.length - 1; i++) {
                const p1 = coords[i], p2 = coords[i + 1];
                const srcId = `seg-${i}`;
                map.addSource(srcId, {
                    type: 'geojson',
                    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [[p1.lon, p1.lat], [p2.lon, p2.lat]] } }
                });
                map.addLayer({ id: srcId, type: 'line', source: srcId, paint: { 'line-color': p1.color, 'line-width': 6, 'line-opacity': 0.9 } });
                layerIds.push(srcId);
            }

            const eventIcons = {
                'handover': { icon: '↔', color: '#f97316', label: 'Handover', circleIcon: true },
                'cell_reselection': { icon: '📶', color: '#8b5cf6', label: 'Cell Reselection' },
                'rlf': { icon: '⚠', color: '#ef4444', label: 'RLF', circleIcon: true },
                'attach': { icon: '⚡', color: '#3b82f6', label: 'Attach', circleIcon: true },
                'detach': { icon: '🔌', color: '#9ca3af', label: 'Detach', circleIcon: true },
                'csfb': { icon: '📞', color: '#a855f7', label: 'CSFB', circleIcon: true }
            };

            // Add markers
            coords.forEach((p, i) => {
                const row = p.row;
                const hasEvent = row.event && row.event.trim() !== '';

                if (!hasEvent) {
                    const el = document.createElement('div');
                    el.innerHTML = `<div style="width:10px;height:10px;border-radius:50%;background:${p.color};border:1px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;font-size:10px;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5));cursor:pointer;"></div>`;
                    
                    // Build popup content based on technology
                    const tech = row.technology || 'LTE';
                    let kpiContent = '';
                    
                    if (tech === 'NR') {
                        kpiContent = `
                            <div style="margin:4px 0;"><b>NR-RSRP:</b> <span style="color:${p.color};font-weight:bold;">${row.nr_rsrp || '-'} dBm</span></div>
                            <div style="margin:4px 0;"><b>NR-RSRQ:</b> ${row.nr_rsrq || '-'} dB</div>
                            <div style="margin:4px 0;"><b>NR-SINR:</b> ${row.nr_sinr || '-'} dB</div>
                            <div style="margin:4px 0;"><b>NR-PCI:</b> ${row.nr_pci || '-'}</div>
                            <div style="margin:4px 0;"><b>Beam ID:</b> ${row.beam_id || '-'}</div>`;
                    } else if (tech === 'LTE') {
                        kpiContent = `
                            <div style="margin:4px 0;"><b>RSRP:</b> <span style="color:${p.color};font-weight:bold;">${row.rsrp || '-'} dBm</span></div>
                            <div style="margin:4px 0;"><b>RSRQ:</b> ${row.rsrq || '-'} dB</div>
                            <div style="margin:4px 0;"><b>SINR:</b> ${row.sinr || '-'} dB</div>
                            <div style="margin:4px 0;"><b>PCI:</b> ${row.pci || '-'}</div>`;
                    } else if (tech === 'UMTS') {
                        kpiContent = `
                            <div style="margin:4px 0;"><b>RSCP:</b> <span style="color:${p.color};font-weight:bold;">${row.wcdma_rscp || '-'} dBm</span></div>
                            <div style="margin:4px 0;"><b>Ec/No:</b> ${row.wcdma_ecno || '-'} dB</div>
                            <div style="margin:4px 0;"><b>PSC:</b> ${row.wcdma_psc || '-'}</div>
                            <div style="margin:4px 0;"><b>UARFCN:</b> ${row.uarfcn || '-'}</div>`;
                    } else if (tech === 'GSM') {
                        kpiContent = `
                            <div style="margin:4px 0;"><b>RxLev:</b> <span style="color:${p.color};font-weight:bold;">${row.gsm_rxlev || row.rxlev || '-'} dBm</span></div>
                            <div style="margin:4px 0;"><b>RxQual:</b> ${row.gsm_rxqual || row.rxqual || '-'}</div>
                            <div style="margin:4px 0;"><b>BSIC:</b> ${row.gsm_bsic || '-'}</div>
                            <div style="margin:4px 0;"><b>ARFCN:</b> ${row.gsm_bcch_arfcn || row['bcch-arfcn'] || '-'}</div>`;
                    }
                    
                    const popup = new maplibregl.Popup({ offset: 10 }).setHTML(`
                        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;">
                            <div style="font-weight:800;color:${p.color};margin-bottom:8px;border-bottom:2px solid ${p.color};padding-bottom:4px;">📍 ${tech} Point #${row['#'] || row.number || i + 1}</div>
                            <div style="margin:4px 0;"><b>Time:</b> ${row.time?.split('T')[1]?.slice(0, 8) || '-'}</div>
                            ${kpiContent}
                            ${row.quality ? `<div style="margin:4px 0;"><b>Quality:</b> ${row.quality}</div>` : ''}
                        </div>
                    `);
                    markers.push(new maplibregl.Marker({ element: el }).setLngLat([p.lon, p.lat]).setPopup(popup).addTo(map));
                }
            });

            // Event markers
            coords.filter(p => p.row.event && p.row.event.trim() !== '').forEach((p, i) => {
                const row = p.row;
                const evtKey = row.event.toLowerCase().trim();
                const evt = eventIcons[evtKey] || { icon: '⚡', color: '#f97316', label: row.event };

                const el = document.createElement('div');
                if (evt.circleIcon) {
                    el.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:${evt.color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;font-size:14px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));cursor:pointer;">${evt.icon}</div>`;
                } else {
                    el.innerHTML = `<div style="font-size:22px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));cursor:pointer;">${evt.icon}</div>`;
                }
                
                // Build KPI content based on technology (excluding band for handovers to avoid duplicates)
                const tech = row.technology || 'LTE';
                const isHandover = row.event && row.event.toLowerCase().includes('handover');
                let kpiContent = '';
                
                if (tech === 'NR') {
                    kpiContent = `
                        <div style="margin:4px 0;"><b>NR-RSRP:</b> <span style="color:${p.color};font-weight:bold;">${row.nr_rsrp || '-'} dBm</span></div>
                        <div style="margin:4px 0;"><b>NR-RSRQ:</b> ${row.nr_rsrq || '-'} dB</div>
                        <div style="margin:4px 0;"><b>NR-SINR:</b> ${row.nr_sinr || '-'} dB</div>
                        ${!isHandover ? `<div style="margin:4px 0;"><b>NR-PCI:</b> ${row.nr_pci || '-'}</div>` : ''}`;
                } else if (tech === 'LTE') {
                    kpiContent = `
                        <div style="margin:4px 0;"><b>RSRP:</b> <span style="color:${p.color};font-weight:bold;">${row.rsrp || '-'} dBm</span></div>
                        <div style="margin:4px 0;"><b>RSRQ:</b> ${row.rsrq || '-'} dB</div>
                        <div style="margin:4px 0;"><b>SINR:</b> ${row.sinr || '-'} dB</div>
                        ${!isHandover ? `<div style="margin:4px 0;"><b>PCI:</b> ${row.pci || '-'}</div>` : ''}`;
                } else if (tech === 'UMTS') {
                    kpiContent = `
                        <div style="margin:4px 0;"><b>RSCP:</b> <span style="color:${p.color};font-weight:bold;">${row.wcdma_rscp || '-'} dBm</span></div>
                        <div style="margin:4px 0;"><b>Ec/No:</b> ${row.wcdma_ecno || '-'} dB</div>
                        <div style="margin:4px 0;"><b>PSC:</b> ${row.wcdma_psc || '-'}</div>`;
                } else if (tech === 'GSM') {
                    kpiContent = `
                        <div style="margin:4px 0;"><b>RxLev:</b> <span style="color:${p.color};font-weight:bold;">${row.gsm_rxlev || row.rxlev || '-'} dBm</span></div>
                        <div style="margin:4px 0;"><b>RxQual:</b> ${row.gsm_rxqual || row.rxqual || '-'}</div>
                        <div style="margin:4px 0;"><b>BSIC:</b> ${row.gsm_bsic || '-'}</div>`;
                }

                // Build popup content with handover frequency transition details
                let popupContent = `
                    <div style="font-family:'JetBrains Mono',monospace;font-size:11px;">
                        <div style="font-weight:800;color:${evt.color};margin-bottom:8px;border-bottom:2px solid ${evt.color};padding-bottom:4px;">${evt.icon} ${evt.label} (${tech})</div>
                        <div style="margin:4px 0;"><b>Time:</b> ${row.time?.split('T')[1]?.slice(0, 8) || '-'}</div>
                        ${kpiContent}`;
                
                // Add handover frequency transition details
                if (row.event && row.event.toLowerCase().includes('handover')) {
                    // PCI transition - check for source/target first, fallback to current PCI
                    if (row.source_pci && row.target_pci) {
                        popupContent += `<div style="margin:4px 0;"><b>PCI:</b> ${row.source_pci} → ${row.target_pci}</div>`;
                    } else if (row.pci || row.nr_pci) {
                        // Fallback to current PCI if no transition data
                        const currentPci = row.pci || row.nr_pci || '-';
                        popupContent += `<div style="margin:4px 0;"><b>PCI:</b> ${currentPci}</div>`;
                    }
                    
                    if (row.band || row.target_band) {
                        const sourceBand = row.source_band || row.band || 'N/A';
                        const targetBand = row.target_band || row.band || 'N/A';
                        popupContent += `<div style="margin:4px 0;"><b>Band:</b> ${sourceBand} → ${targetBand}</div>`;
                    }
                    
                    // Technology-aware frequency channel display
                    const tech = row.technology || 'LTE';
                    let freqLabel = 'EARFCN'; // Default to LTE
                    let sourceFreq = null, targetFreq = null, currentFreq = null;
                    
                    if (tech === 'NR') {
                        freqLabel = 'NR-ARFCN';
                        sourceFreq = row.source_nr_arfcn || row.source_arfcn;
                        targetFreq = row.target_nr_arfcn || row.target_arfcn;
                        currentFreq = row.nr_arfcn || row.arfcn;
                    } else if (tech === 'LTE') {
                        freqLabel = 'EARFCN';
                        sourceFreq = row.source_earfcn;
                        targetFreq = row.target_earfcn;
                        currentFreq = row.earfcn;
                    } else if (tech === 'UMTS') {
                        freqLabel = 'UARFCN';
                        sourceFreq = row.source_uarfcn;
                        targetFreq = row.target_uarfcn;
                        currentFreq = row.uarfcn;
                    } else if (tech === 'GSM') {
                        freqLabel = 'ARFCN';
                        sourceFreq = row.source_bcch_arfcn || row['source_bcch-arfcn'];
                        targetFreq = row.target_bcch_arfcn || row['target_bcch-arfcn'];
                        currentFreq = row.gsm_bcch_arfcn || row['bcch-arfcn'] || row.bcch_arfcn;
                    }
                    
                    // Show frequency transition or current frequency
                    if (sourceFreq && targetFreq && sourceFreq !== targetFreq) {
                        popupContent += `<div style="margin:4px 0;"><b>${freqLabel}:</b> ${sourceFreq} → ${targetFreq}</div>`;
                    } else if (currentFreq) {
                        popupContent += `<div style="margin:4px 0;"><b>${freqLabel}:</b> ${currentFreq}</div>`;
                    }
                    
                    if (row.source_technology && row.target_technology) {
                        popupContent += `<div style="margin:4px 0;"><b>Technology:</b> ${row.source_technology} → ${row.target_technology}</div>`;
                    }
                }
                
                popupContent += `</div>`;
                
                const popup = new maplibregl.Popup({ offset: 15 }).setHTML(popupContent);
                markers.push(new maplibregl.Marker({ element: el }).setLngLat([p.lon, p.lat]).setPopup(popup).addTo(map));
            });

            // Start/End markers
            if (coords.length > 0) {
                const startEl = document.createElement('div');
                startEl.innerHTML = '<div style="font-size:24px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">🟢</div>';
                markers.push(new maplibregl.Marker({ element: startEl }).setLngLat([coords[0].lon, coords[0].lat]).addTo(map));
                const endEl = document.createElement('div');
                endEl.innerHTML = '<div style="font-size:24px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">🏁</div>';
                markers.push(new maplibregl.Marker({ element: endEl }).setLngLat([coords[coords.length - 1].lon, coords[coords.length - 1].lat]).addTo(map));
            }

            document.getElementById('pointCount').textContent = coords.length;

            if (coords.length > 0) {
                const lngLats = coords.map(c => [c.lon, c.lat]);
                const bounds = lngLats.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(lngLats[0], lngLats[0]));
                map.fitBounds(bounds, { padding: 50 });
            }

            // Auto-populate L3 messages (removed - no longer needed)
        }

        // =====================================================
        // CSV VALIDATION & ERROR HANDLING
        // =====================================================
        
        function showUploadError(title, message, details = []) {
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:9999; display:flex; align-items:center; justify-content:center; font-family:"JetBrains Mono",monospace;';
            
            const detailsHTML = details.length > 0 ? `
                <div style="margin-top:15px; padding:15px; background:#fff3cd; border-left:4px solid #ffc107; border-radius:5px;">
                    <div style="font-weight:bold; color:#856404; margin-bottom:8px;">📋 Details:</div>
                    <ul style="margin:0; padding-left:20px; color:#856404; font-size:13px;">
                        ${details.map(d => `<li style="margin:5px 0;">${d}</li>`).join('')}
                    </ul>
                </div>
            ` : '';
            
            modal.innerHTML = `
                <div style="background:white; border-radius:12px; padding:30px; max-width:600px; width:90%; box-shadow:0 10px 40px rgba(0,0,0,0.3); animation:slideIn 0.3s ease;">
                    <div style="display:flex; align-items:center; margin-bottom:20px;">
                        <div style="font-size:48px; margin-right:15px;">⚠️</div>
                        <div>
                            <h2 style="margin:0; color:#dc2626; font-size:22px;">${title}</h2>
                            <p style="margin:5px 0 0 0; color:#666; font-size:14px;">CSV Upload Failed</p>
                        </div>
                    </div>
                    <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:20px;">
                        <p style="margin:0; color:#333; font-size:15px; line-height:1.6;">${message}</p>
                    </div>
                    ${detailsHTML}
                    <div style="margin-top:20px; padding-top:20px; border-top:1px solid #e5e7eb;">
                        <button onclick="this.closest('div[style*=fixed]').remove()" style="width:100%; padding:12px; background:#FF7900; color:white; border:none; border-radius:8px; font-size:16px; font-weight:bold; cursor:pointer; font-family:'JetBrains Mono',monospace; transition:background 0.2s;" onmouseover="this.style.background='#e66d00'" onmouseout="this.style.background='#FF7900'">
                            ✓ Got it, I'll fix my CSV file
                        </button>
                    </div>
                </div>
            `;
            
            // Add animation
            const style = document.createElement('style');
            style.textContent = '@keyframes slideIn { from { transform:translateY(-50px); opacity:0; } to { transform:translateY(0); opacity:1; } }';
            document.head.appendChild(style);
            
            document.body.appendChild(modal);
        }
        
        function validateCSV(csvText) {
            const lines = csvText.trim().split('\n');
            
            if (lines.length < 2) {
                showUploadError(
                    'Empty or Invalid CSV File',
                    'Your CSV file appears to be empty or contains only headers. Please ensure your file has data rows.',
                    ['Minimum requirement: 1 header row + at least 1 data row']
                );
                return false;
            }
            
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace('#', ''));
            const errors = [];
            const warnings = [];
            
            // Check for required GPS columns
            const hasLat = headers.some(h => h === 'lat' || h === 'latitude');
            const hasLon = headers.some(h => h === 'lon' || h === 'longitude');
            
            if (!hasLat || !hasLon) {
                errors.push('❌ <strong>Missing GPS Coordinates:</strong> Your CSV must have "Lat" and "Lon" columns (or "Latitude" and "Longitude")');
            }
            
            // Check for technology indicators
            const hasTechColumn = headers.includes('technology');
            const hasLTE = headers.includes('rsrp') || headers.includes('pci') || headers.includes('earfcn');
            const hasNR = headers.includes('nr_rsrp') || headers.includes('nr_pci');
            const hasUMTS = headers.includes('wcdma_rscp') || headers.includes('wcdma_ecno');
            const hasGSM = headers.includes('gsm_rxlev') || headers.includes('rxlev');
            
            if (!hasTechColumn && !hasLTE && !hasNR && !hasUMTS && !hasGSM) {
                warnings.push('⚠️ <strong>No Technology Detected:</strong> Add a "Technology" column or include KPI columns (RSRP, NR_RSRP, WCDMA_RSCP, or GSM_RxLev)');
            }
            
            // Check if data rows have valid coordinates
            let validCoordCount = 0;
            let totalRows = 0;
            const latIndex = headers.findIndex(h => h === 'lat' || h === 'latitude');
            const lonIndex = headers.findIndex(h => h === 'lon' || h === 'longitude');
            
            if (latIndex >= 0 && lonIndex >= 0) {
                for (let i = 1; i < Math.min(lines.length, 100); i++) { // Check first 100 rows
                    const values = lines[i].split(',');
                    const lat = parseFloat(values[latIndex]);
                    const lon = parseFloat(values[lonIndex]);
                    totalRows++;
                    if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
                        validCoordCount++;
                    }
                }
                
                if (validCoordCount === 0) {
                    errors.push('❌ <strong>No Valid GPS Data:</strong> All coordinate values are empty, zero, or invalid');
                } else if (validCoordCount < totalRows * 0.5) {
                    warnings.push(`⚠️ <strong>Sparse GPS Data:</strong> Only ${validCoordCount}/${totalRows} rows have valid coordinates`);
                }
            }
            
            // Show errors if any
            if (errors.length > 0) {
                showUploadError(
                    'CSV Validation Failed',
                    'Your CSV file is missing required columns or has invalid data. Please fix the issues below and try again:',
                    [...errors, ...warnings]
                );
                return false;
            }
            
            // Show warnings but allow upload
            if (warnings.length > 0) {
                console.warn('CSV Upload Warnings:', warnings);
            }
            
            return true;
        }
        
        document.getElementById('csvFile').addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;
            
            // Check file extension
            if (!file.name.toLowerCase().endsWith('.csv')) {
                showUploadError(
                    'Invalid File Type',
                    'Please upload a CSV file. The selected file does not have a .csv extension.',
                    [`Selected file: ${file.name}`, 'Expected: filename.csv']
                );
                this.value = ''; // Reset file input
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const csvText = event.target.result;
                
                // Validate CSV before processing
                if (!validateCSV(csvText)) {
                    e.target.value = ''; // Reset file input
                    return;
                }
                
                try {
                    csvData = csvText;
                    if (map.isStyleLoaded()) {
                        renderMap(csvData);
                    } else {
                        setTimeout(() => renderMap(csvData), 500);
                    }
                    
                    // Show success message
                    const successMsg = document.createElement('div');
                    successMsg.style.cssText = 'position:fixed; top:20px; right:20px; background:#22c55e; color:white; padding:15px 25px; border-radius:8px; font-family:"JetBrains Mono",monospace; font-weight:bold; z-index:9999; box-shadow:0 4px 12px rgba(0,0,0,0.2); animation:slideInRight 0.3s ease;';
                    successMsg.innerHTML = '✓ CSV uploaded successfully!';
                    document.body.appendChild(successMsg);
                    setTimeout(() => successMsg.remove(), 3000);
                    
                } catch (error) {
                    showUploadError(
                        'CSV Processing Error',
                        'An error occurred while processing your CSV file. The file may be corrupted or improperly formatted.',
                        [`Error: ${error.message}`, 'Try opening the file in Excel/Notepad to verify it\'s valid']
                    );
                    e.target.value = ''; // Reset file input
                }
            };
            
            reader.onerror = () => {
                showUploadError(
                    'File Read Error',
                    'Unable to read the selected file. Please check file permissions and try again.',
                    ['Make sure the file is not open in another program', 'Try copying the file to a different location']
                );
                e.target.value = ''; // Reset file input
            };
            
            reader.readAsText(file);
        });
        
        // Technology filter change handler
        document.getElementById('techFilter').addEventListener('change', function(e) {
            currentTechFilter = e.target.value;
            if (csvData && rawParsedData.length > 0) {
                renderMap(); // Call without csvText to re-filter existing data
            }
        });
        
        // Polynomial degree selector change handler
        document.getElementById('polynomialDegreeSelector').addEventListener('change', function(e) {
            polynomialDegree = parseInt(e.target.value, 10);
            console.log('Polynomial degree changed to:', polynomialDegree);
            
            // Warn user about high-degree polynomials
            if (polynomialDegree >= 6) {
                console.warn('⚠️ High-degree polynomial (degree ' + polynomialDegree + ') may overfit data and show oscillations. Consider using degree 2-3 for most telecom KPI analysis.');
            }
            
            // Re-render scatter plots with new polynomial degree
            if (parsedData.length > 0) {
                renderCorrelationScatters();
            }
        });

        // Include idle samples toggle handler
        document.getElementById('includeIdleSamples')?.addEventListener('change', function(e) {
            const includeIdle = e.target.checked;
            console.log('Include idle samples:', includeIdle ? 'ON (showing all data)' : 'OFF (filtering idle UE states)');
            
            // Re-render scatter plots with new filtering setting
            if (parsedData.length > 0) {
                renderCorrelationScatters();
            }
        });

        // =====================================================
        // CLIENT VIEW FUNCTIONALITY
        // =====================================================
        function setupClientView() {
            // Hide control buttons except KPIs button
            const controlButtons = document.getElementById('controlButtons');
            if (controlButtons) {
                // Hide individual buttons except KPIs
                const editBtn = document.getElementById('editModeBtn');
                const resetBtn = document.getElementById('resetBtn');
                const saveBtn = document.getElementById('saveConfigBtn');
                const loadBtn = document.getElementById('loadConfigBtn');
                const shareBtn = document.getElementById('shareClientBtn');
                
                if (editBtn) editBtn.style.display = 'none';
                if (resetBtn) resetBtn.style.display = 'none';
                if (saveBtn) saveBtn.style.display = 'none';
                if (loadBtn) loadBtn.style.display = 'none';
                if (shareBtn) shareBtn.style.display = 'none';
                // kpisBtn remains visible by default
            }

            // Disable CSV upload
            const csvUploadBtn = document.querySelector('button[onclick="document.getElementById(\'csvFile\').click()"]');
            if (csvUploadBtn) {
                csvUploadBtn.disabled = true;
                csvUploadBtn.style.opacity = '0.5';
                csvUploadBtn.style.cursor = 'not-allowed';
                csvUploadBtn.title = 'Upload disabled in client view';
            }

            // Lock all editable fields
            document.querySelectorAll('.editable-field').forEach(el => {
                el.contentEditable = 'false';
                el.style.outline = 'none';
                el.style.cursor = 'default';
            });

            // Hide add buttons (but not kpisBtn)
            document.querySelectorAll('[id$="Btn"]').forEach(btn => {
                if (btn.id.startsWith('add')) btn.style.display = 'none';
            });
            
            // Ensure kpisBtn is visible
            const kpisBtn = document.getElementById('kpisBtn');
            if (kpisBtn) kpisBtn.style.display = '';

            // Add client view banner
            const banner = document.createElement('div');
            banner.style.cssText = 'position:fixed; top:0; left:0; width:100%; background:#3b82f6; color:white; padding:10px; text-align:center; font-weight:bold; z-index:40; font-family:"JetBrains Mono",monospace; font-size:14px;';
            banner.textContent = '👁️ CLIENT VIEW MODE - Read Only';
            document.body.prepend(banner);

            // Adjust main container padding
            document.querySelector('.dashboard-container').style.paddingTop = '60px';
        }

        function loadConfigFromURL() {
            if (!encodedConfig) return;

            try {
                let decodedData;
                
                // Try decompression first (new format)
                try {
                    // URL-safe base64 decode
                    let base64 = encodedConfig.replace(/-/g, '+').replace(/_/g, '/');
                    while (base64.length % 4) {
                        base64 += '=';
                    }
                    const binaryString = atob(base64);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const decompressed = pako.ungzip(bytes, { to: 'string' });
                    decodedData = JSON.parse(decompressed);
                } catch (e) {
                    // Fallback to uncompressed format (old format)
                    const decoded = atob(encodedConfig);
                    decodedData = JSON.parse(decoded);
                }

                // Load config
                if (decodedData.config) {
                    currentConfig = decodedData.config;
                    applyConfig();
                }

                // Load CSV data
                if (decodedData.csvData) {
                    csvData = decodedData.csvData;
                    if (map && mapReady) {
                        renderMap(csvData);
                    } else {
                        map.once('load', () => {
                            renderMap(csvData);
                        });
                    }
                }
            } catch (error) {
                showError('Failed to load shared configuration: ' + error.message);
            }
        }

        function shareWithClient() {
            if (!csvData) {
                showError('Please upload a CSV file first before sharing.');
                return;
            }

            saveCurrentState();

            try {
                const shareData = {
                    config: currentConfig,
                    csvData: csvData
                };

                const jsonString = JSON.stringify(shareData);
                
                // Compress using pako
                const compressed = pako.gzip(jsonString, { level: 9 });
                const binaryString = Array.from(compressed).map(byte => String.fromCharCode(byte)).join('');
                const base64 = btoa(binaryString);
                
                // Make URL-safe
                const encoded = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

                // Use hash instead of query params to avoid 400 Bad Request on Netlify
                const shareUrl = `${window.location.origin}${window.location.pathname}#mode=view&config=${encoded}`;
                
                document.getElementById('shareUrl').value = shareUrl;
                document.getElementById('shareModal').style.display = 'flex';
            } catch (error) {
                showError('Failed to generate share URL: ' + error.message);
            }
        }

        function showError(message) {
            document.getElementById('errorMessage').textContent = message;
            document.getElementById('errorModal').style.display = 'flex';
        }

        // Share button event
        document.getElementById('shareClientBtn').addEventListener('click', shareWithClient);

        // Modal controls
        document.getElementById('copyUrlBtn').addEventListener('click', function() {
            const urlField = document.getElementById('shareUrl');
            urlField.select();
            document.execCommand('copy');
            document.getElementById('copyStatus').style.display = 'block';
            setTimeout(() => {
                document.getElementById('copyStatus').style.display = 'none';
            }, 2000);
        });

        document.getElementById('closeModalBtn').addEventListener('click', function() {
            document.getElementById('shareModal').style.display = 'none';
        });

        document.getElementById('closeErrorBtn').addEventListener('click', function() {
            document.getElementById('errorModal').style.display = 'none';
        });

// =====================================================
        // INITIALIZATION
        // =====================================================
        initMap();
        map.on('load', () => {
            mapReady = true;
            
            // Check if client view mode
            if (isClientView) {
                setupClientView();
                loadConfigFromURL();
            } else {
                if (csvData) renderMap(csvData);
            }
        });

        // Load saved state on page load
        document.addEventListener('DOMContentLoaded', function() {
            loadSavedState();
        });

        // Auto-save on input changes
        document.addEventListener('input', function(e) {
            if (e.target.classList.contains('editable-field')) {
                setTimeout(() => {
                    saveCurrentState();
                    saveToLocalStorage();
                }, 1000); // Debounce saves
            }
        });

        // Map control buttons
        document.getElementById('mapViewBtn').addEventListener('click', function() {
            // Toggle between light and dark map styles
            currentMapStyle = currentMapStyle === 'light' ? 'dark' : 'light';
            
            if (map && mapReady) {
                map.setStyle(getMapStyle());
                
                // Update button emoji
                this.innerHTML = currentMapStyle === 'dark' ? '🌙' : '☀️';
                
                console.log('Map style changed to:', currentMapStyle);

                // Re-render data after style change
                map.once('styledata', () => {
                    if (csvData) {
                        setTimeout(() => renderMap(csvData), 500);
                    }
                });
            } else {
                console.warn('Map not ready yet');
            }
        });

        document.getElementById('zoomInBtn').addEventListener('click', function() {
            map.zoomIn();
        });

        document.getElementById('zoomOutBtn').addEventListener('click', function() {
            map.zoomOut();
        });

        document.getElementById('fullscreenBtn').addEventListener('click', function() {
            const mapContainer = document.getElementById('map').parentElement;
            if (!document.fullscreenElement) {
                mapContainer.requestFullscreen().then(() => {
                    this.innerHTML = '⛶';
                }).catch(err => {
                    console.log('Fullscreen error:', err);
                });
            } else {
                document.exitFullscreen().then(() => {
                    this.innerHTML = '⛶';
                });
            }
        });

        // Listen for fullscreen changes
        document.addEventListener('fullscreenchange', function() {
            const btn = document.getElementById('fullscreenBtn');
            btn.innerHTML = '⛶';
            // Ensure map layout and style reflow in fullscreen/exit-fullscreen
            if (map) {
                try {
                    // Resize map to container changes
                    setTimeout(() => map.resize(), 60);
                    // Reapply current basemap style to force repaint (helps when switching modes in fullscreen)
                    if (typeof map.setStyle === 'function') {
                        map.setStyle(getMapStyle());
                        map.once('styledata', () => {
                            if (csvData) {
                                // Re-render overlays after style change
                                setTimeout(() => renderMap(csvData), 200);
                            }
                        });
                    }
                } catch (e) {
                    console.warn('Error during fullscreen style refresh:', e);
                }
            }
        });

        // Initialize saved state when page loads
        loadSavedState();

        // =====================================================
        // CHART ZOOM MODAL FUNCTIONALITY
        // =====================================================

        function openChartZoom(chartTitle, chartInstance) {
            const modal = document.getElementById('chartZoomModal');
            const title = document.getElementById('chartZoomTitle');
            const modalContent = modal.querySelector('div');
            const chartContainer = document.getElementById('chartZoomContainer');
            
            // Clean up multi-KPI charts if they exist
            if (window.multiKpiCharts && window.multiKpiCharts.length > 0) {
                window.multiKpiCharts.forEach(chart => chart.destroy());
                window.multiKpiCharts = [];
            }
            
            // Reset container to original single-chart structure
            chartContainer.innerHTML = '<canvas id="chartZoomCanvas"></canvas>';
            chartContainer.style.flex = '1';
            chartContainer.style.border = '3px solid white';
            chartContainer.style.padding = '20px';
            chartContainer.style.overflow = 'hidden';
            chartContainer.style.display = 'block'; // Reset from flex
            chartContainer.style.flexDirection = ''; // Clear flex direction
            chartContainer.style.gap = ''; // Clear gap
            chartContainer.style.overflowY = ''; // Clear overflow-y
            chartContainer.style.overflowX = ''; // Clear overflow-x
            
            // Now get the canvas (it exists after innerHTML reset)
            const canvas = document.getElementById('chartZoomCanvas');
            
            title.textContent = chartTitle;
            modal.style.display = 'flex';
            
            const textColor = kpiTheme === 'dark' ? '#fff' : '#1f2937';
            const gridColor = kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
            const tickColor = kpiTheme === 'dark' ? '#9ca3af' : '#4b5563';
            
            if (kpiTheme === 'light') {
                modal.style.background = 'rgba(255,255,255,0.95)';
                modalContent.style.background = '#f3f4f6';
                chartContainer.style.background = '#ffffff';
                title.style.color = '#1f2937';
            } else {
                modal.style.background = 'rgba(0,0,0,0.95)';
                modalContent.style.background = '#1f2937';
                chartContainer.style.background = '#374151';
                title.style.color = '#fff';
            }
            
            if (zoomedChart) zoomedChart.destroy();
            
            const ctx = canvas.getContext('2d');
            const cfg = chartInstance.config;
            
            // Clone data with updated labels from the original chart
            const clonedData = JSON.parse(JSON.stringify(cfg.data));
            
            zoomedChart = new Chart(ctx, {
                type: cfg.type,
                data: clonedData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: cfg.options.interaction,
                    plugins: {
                        legend: { display: true, position: 'top', labels: { color: textColor, font: { family: 'JetBrains Mono', size: 10 } } },
                        title: cfg.options.plugins?.title ? { display: true, text: cfg.options.plugins.title.text, color: textColor, font: { size: 14 } } : undefined,
                        tooltip: cfg.options.plugins?.tooltip
                    },
                    scales: {
                        x: cfg.options.scales?.x ? { ...cfg.options.scales.x, ticks: { ...cfg.options.scales.x.ticks, color: tickColor }, grid: { color: gridColor }, title: cfg.options.scales.x.title ? { display: true, text: cfg.options.scales.x.title.text, color: textColor, font: { size: 12 } } : undefined } : undefined,
                        y: cfg.options.scales?.y ? { ...cfg.options.scales.y, ticks: { ...cfg.options.scales.y.ticks, color: tickColor }, grid: { color: gridColor }, title: cfg.options.scales.y.title ? { display: true, text: cfg.options.scales.y.title.text, color: textColor, font: { size: 12 } } : undefined } : undefined
                    }
                }
            });
        }

        function closeChartZoom() {
            const modal = document.getElementById('chartZoomModal');
            modal.style.display = 'none';
            if (zoomedChart) {
                zoomedChart.destroy();
                zoomedChart = null;
            }
            // Clean up multi-KPI charts
            if (window.multiKpiCharts) {
                window.multiKpiCharts.forEach(chart => chart.destroy());
                window.multiKpiCharts = [];
            }
            // Hide observation panel and reset content
            const observationPanel = document.getElementById('observationPanel');
            const observationContent = document.getElementById('observationContent');
            if (observationPanel) {
                observationPanel.style.display = 'none';
            }
            if (observationContent) {
                observationContent.innerHTML = `<div style="text-align:center; padding:40px 20px; opacity:0.6; font-size:12px;">
                    Hover over the charts to view detailed observations
                </div>`;
            }
        }

        // Close button
        document.getElementById('closeChartZoomBtn').addEventListener('click', closeChartZoom);

        // Close on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.getElementById('chartZoomModal').style.display === 'flex') {
                closeChartZoom();
            }
        });

        // Close on background click
        document.getElementById('chartZoomModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeChartZoom();
            }
        });

        // Make chart containers clickable after KPI panel is shown
        function makeChartsZoomable() {
            // Main KPI Chart - updated selector for light mode
            const mainChartContainer = document.querySelector('#kpiPanel > div.border-4.border-black.bg-white.p-4');
            if (mainChartContainer && !mainChartContainer.classList.contains('chart-zoomable')) {
                mainChartContainer.classList.add('chart-zoomable');
                mainChartContainer.style.cursor = 'pointer';
                mainChartContainer.addEventListener('click', function() {
                    if (kpiChart) {
                        // Get technology-specific label for the modal title
                        const tech = detectedTechnology || 'LTE';
                        let chartTitle = currentKpiType.toUpperCase();
                        
                        if (currentKpiType === 'rsrp') {
                            chartTitle = tech === 'NR' ? 'NR-RSRP' : tech === 'UMTS' ? 'RSCP' : tech === 'GSM' ? 'RxLev' : 'RSRP';
                        } else if (currentKpiType === 'rsrq') {
                            chartTitle = tech === 'NR' ? 'NR-RSRQ' : tech === 'UMTS' ? 'Ec/No' : tech === 'GSM' ? 'RxQual' : 'RSRQ';
                        } else if (currentKpiType === 'sinr') {
                            chartTitle = tech === 'NR' ? 'NR-SINR' : 'SINR';
                        }
                        
                        openChartZoom(`📊 ${chartTitle} Chart`, kpiChart);
                    }
                });
            }

            // Histogram
            const histogramContainer = document.getElementById('kpiHistogramContainer');
            if (histogramContainer && !histogramContainer.classList.contains('chart-zoomable')) {
                histogramContainer.classList.add('chart-zoomable');
                histogramContainer.addEventListener('click', function() {
                    if (kpiHistogramChart) {
                        // Get technology-specific label for the modal title
                        const tech = detectedTechnology || 'LTE';
                        let chartTitle = currentKpiType.toUpperCase();
                        
                        if (currentKpiType === 'rsrp') {
                            chartTitle = tech === 'NR' ? 'NR-RSRP' : tech === 'UMTS' ? 'RSCP' : tech === 'GSM' ? 'RxLev' : 'RSRP';
                        } else if (currentKpiType === 'rsrq') {
                            chartTitle = tech === 'NR' ? 'NR-RSRQ' : tech === 'UMTS' ? 'Ec/No' : tech === 'GSM' ? 'RxQual' : 'RSRQ';
                        } else if (currentKpiType === 'sinr') {
                            chartTitle = tech === 'NR' ? 'NR-SINR' : 'SINR';
                        }
                        
                        openChartZoom(`📊 ${chartTitle} Distribution Histogram`, kpiHistogramChart);
                    }
                });
            }

            // Comparison charts
            const compContainers = document.querySelectorAll('#kpiPanel .grid.grid-cols-1 > div');
            compContainers.forEach((container, index) => {
                if (!container.classList.contains('chart-zoomable')) {
                    container.classList.add('chart-zoomable');
                    container.addEventListener('click', function() {
                        let chart = null;
                        let title = '';
                        
                        // Time-series charts - use technology-aware labels
                        const tech = detectedTechnology || 'LTE';
                        const rsrpLabel = tech === 'NR' ? 'NR-RSRP' : tech === 'UMTS' ? 'RSCP' : tech === 'GSM' ? 'RxLev' : 'RSRP';
                        const rsrqLabel = tech === 'NR' ? 'NR-RSRQ' : tech === 'UMTS' ? 'Ec/No' : tech === 'GSM' ? 'RxQual' : 'RSRQ';
                        const sinrLabel = tech === 'NR' ? 'NR-SINR' : 'SINR';
                        
                        if (index === 0 && compRsrpOnly) { chart = compRsrpOnly; title = rsrpLabel; }
                        else if (index === 1 && compRsrqOnly) { chart = compRsrqOnly; title = rsrqLabel; }
                        else if (index === 2 && compSinrOnly) { chart = compSinrOnly; title = sinrLabel; }
                        else if (index === 3 && compTputOnly) { chart = compTputOnly; title = 'Throughput DL'; }
                        else if (index === 4 && compTputUlOnly) { chart = compTputUlOnly; title = 'Throughput UL'; }
                        else if (index === 5 && compBlerOnly) { chart = compBlerOnly; title = 'BLER'; }
                        else if (index === 6 && compCqiOnly) { chart = compCqiOnly; title = 'CQI'; }
                        else if (index === 7 && compMcsOnly) { chart = compMcsOnly; title = 'MCS'; }
                        else if (index === 8 && compTxPowerOnly) { chart = compTxPowerOnly; title = 'Tx Power'; }
                        
                        // Scatter plots (indices shifted by 1 due to TxPower addition)
                        else if (index === 9 && scatterTputSinr) { 
                            chart = scatterTputSinr; 
                            const xLabel = tech === 'UMTS' || tech === 'GSM' ? (tech === 'UMTS' ? 'RSCP' : 'RxLev') : (tech === 'NR' ? 'NR-SINR' : 'SINR');
                            title = `Throughput vs ${xLabel}`; 
                        }
                        else if (index === 10 && scatterTputRsrp) { 
                            chart = scatterTputRsrp; 
                            const rsrpLabel = tech === 'NR' ? 'NR-RSRP' : tech === 'UMTS' ? 'RSCP' : tech === 'GSM' ? 'RxLev' : 'RSRP';
                            title = `Throughput vs ${rsrpLabel}`; 
                        }
                        else if (index === 11 && scatterMcsCqi) { chart = scatterMcsCqi; title = 'MCS vs CQI'; }
                        else if (index === 12 && scatterBlerTput) { chart = scatterBlerTput; title = 'Throughput vs BLER'; }
                        
                        if (chart) {
                            openChartZoom(`📊 ${title}`, chart);
                        }
                    });
                }
            });
        }

        // Call makeChartsZoomable when KPI panel is shown
        const originalKpisBtn = document.getElementById('kpisBtn');
        originalKpisBtn.addEventListener('click', function() {
            setTimeout(makeChartsZoomable, 100);
        });

        // KPI Theme Toggle
        document.getElementById('kpiThemeToggle').addEventListener('click', function() {
            kpiTheme = kpiTheme === 'dark' ? 'light' : 'dark';
            const panel = document.getElementById('kpiPanel');
            
            if (kpiTheme === 'light') {
                panel.classList.remove('bg-gray-900');
                panel.classList.add('bg-white');
                this.innerHTML = '☀️ Light';
                document.querySelectorAll('#kpiPanel .bg-gray-800').forEach(el => {
                    el.classList.remove('bg-gray-800');
                    el.classList.add('bg-gray-100');
                });
                document.querySelectorAll('#kpiPanel .bg-gray-900').forEach(el => {
                    el.classList.remove('bg-gray-900');
                    el.classList.add('bg-white');
                });
                document.querySelectorAll('#kpiPanel .bg-gray-50').forEach(el => {
                    el.classList.remove('bg-gray-50');
                    el.classList.add('bg-white');
                });
                document.querySelectorAll('#kpiPanel .text-white').forEach(el => {
                    el.classList.remove('text-white');
                    el.classList.add('text-gray-900');
                });
                document.querySelectorAll('#kpiPanel .text-gray-400').forEach(el => {
                    el.classList.remove('text-gray-400');
                    el.classList.add('text-gray-600');
                });
                // Fix KPI tab and button borders for light mode
                document.querySelectorAll('#kpiPanel .kpi-tab, #kpiPanel .chart-type-btn, #kpiPanel .view-mode-btn').forEach(el => {
                    el.classList.remove('border-white');
                    el.classList.add('border-gray-400');
                    // Switch inactive button background to light
                    if (!el.classList.contains('bg-blue-600')) {
                        el.classList.remove('bg-gray-700');
                        el.classList.add('bg-gray-200');
                    }
                });
                // Fix theme toggle button for light mode
                const toggleBtn = document.getElementById('kpiThemeToggle');
                toggleBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
                toggleBtn.classList.add('bg-gray-200', 'hover:bg-gray-300');                // Update multi-KPI checkbox hover states for light mode
                document.querySelectorAll('.kpi-selector').forEach(checkbox => {
                    const label = checkbox.parentElement;
                    label.classList.remove('hover:bg-gray-700');
                    label.classList.add('hover:bg-gray-100');
                });
                
                // Fix "Include idle samples" checkbox styling for light mode
                const idleSamplesContainer = document.getElementById('includeIdleSamples')?.parentElement?.parentElement;
                const idleSamplesLabel = document.getElementById('idleSamplesLabel');
                if (idleSamplesContainer) {
                    idleSamplesContainer.classList.remove('bg-yellow-900', 'border-yellow-600');
                    idleSamplesContainer.classList.add('bg-yellow-50', 'border-yellow-400');
                }
                if (idleSamplesLabel) {
                    idleSamplesLabel.style.color = '#92400e'; // Dark brown text for light mode (original)
                }
            } else {
                panel.classList.remove('bg-white');
                panel.classList.add('bg-gray-900');
                this.innerHTML = '🌙 Dark';
                document.querySelectorAll('#kpiPanel .bg-gray-100').forEach(el => {
                    el.classList.remove('bg-gray-100');
                    el.classList.add('bg-gray-800');
                });
                document.querySelectorAll('#kpiPanel .bg-white').forEach(el => {
                    if (!el.id || el.id !== 'kpiPanel') {
                        el.classList.remove('bg-white');
                        el.classList.add('bg-gray-900');
                    }
                });
                document.querySelectorAll('#kpiPanel .bg-gray-50').forEach(el => {
                    el.classList.remove('bg-gray-50');
                    el.classList.add('bg-gray-800');
                });
                document.querySelectorAll('#kpiPanel .text-gray-900').forEach(el => {
                    el.classList.remove('text-gray-900');
                    el.classList.add('text-white');
                });
                document.querySelectorAll('#kpiPanel .text-gray-600').forEach(el => {
                    el.classList.remove('text-gray-600');
                    el.classList.add('text-gray-400');
                });
                // Fix KPI tab and button borders for dark mode
                document.querySelectorAll('#kpiPanel .kpi-tab, #kpiPanel .chart-type-btn, #kpiPanel .view-mode-btn').forEach(el => {
                    el.classList.remove('border-gray-400');
                    el.classList.add('border-white');
                    // Switch inactive button background to dark
                    if (!el.classList.contains('bg-blue-600')) {
                        el.classList.remove('bg-gray-200');
                        el.classList.add('bg-gray-700');
                    }
                });
                // Fix theme toggle button for dark mode
                const toggleBtn = document.getElementById('kpiThemeToggle');
                toggleBtn.classList.remove('bg-gray-200', 'hover:bg-gray-300');
                toggleBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
                // Update multi-KPI checkbox hover states for dark mode
                document.querySelectorAll('.kpi-selector').forEach(checkbox => {
                    const label = checkbox.parentElement;
                    label.classList.remove('hover:bg-gray-100');
                    label.classList.add('hover:bg-gray-700');
                });
                
                // Fix "Include idle samples" checkbox styling for dark mode
                const idleSamplesContainer = document.getElementById('includeIdleSamples')?.parentElement?.parentElement;
                const idleSamplesLabel = document.getElementById('idleSamplesLabel');
                if (idleSamplesContainer) {
                    idleSamplesContainer.classList.remove('bg-yellow-50', 'border-yellow-400');
                    idleSamplesContainer.classList.add('bg-yellow-900', 'border-yellow-600');
                }
                if (idleSamplesLabel) {
                    idleSamplesLabel.style.color = '#fef3c7'; // Light yellow text for dark mode
                }
            }
            
            if (parsedData.length > 0) {
                renderKPIChart(currentKpiType);
                renderScatterPlots();
                renderCorrelationScatters();
                if (currentKpiType !== 'all' && currentKpiType !== 'pci') {
                    const values = parsedData.map(d => parseFloat(d[currentKpiType]) || 0);
                    renderKPIHistogram(currentKpiType, values);
                }
            }
        });
    

        // =====================================================
        // MULTI-KPI COMPARISON FEATURE
        // =====================================================
        
        // Global state for multi-KPI selection
        let selectedKpis = [];
        
        /**
         * Prepare multi-KPI dataset for comparison chart
         * @param {Array} selectedKpis - Array of KPI objects: [{kpi: 'rsrp', unit: 'dBm', axis: 'left'}, ...]
         * @returns {Object} - {labels, datasets, axisConfig}
    
         */
        function prepareMultiKpiData(selectedKpis) {
            if (parsedData.length === 0 || selectedKpis.length === 0) {
                return null;
            }
            
            // Extract shared time labels
            const labels = parsedData.map((d, i) => 
                d.time?.split('T')[1]?.slice(0, 8) || `Point ${i+1}`
            );
            
            // Technology detection
            const tech = detectedTechnology || 'LTE';
            
            // Use consistent blue color for all KPIs in multi-KPI comparison
            const kpiColor = '#3b82f6'; // Blue
            
            // Build datasets
            const datasets = selectedKpis.map((kpiObj, index) => {
                const { kpi, unit, axis } = kpiObj;
                
                let values = [];
                let label = kpi.toUpperCase();
                
                // Technology-specific field mapping (match single KPI behavior with || 0)
                if (kpi === 'rsrp') {
                    if (tech === 'NR') {
                        values = parsedData.map(d => parseFloat(d.nr_rsrp) || 0);
                        label = 'NR-RSRP';
                    } else if (tech === 'UMTS') {
                        values = parsedData.map(d => parseFloat(d.wcdma_rscp) || 0);
                        label = 'RSCP';
                    } else if (tech === 'GSM') {
                        values = parsedData.map(d => parseFloat(d.gsm_rxlev || d.rxlev) || 0);
                        label = 'RxLev';
                    } else {
                        values = parsedData.map(d => parseFloat(d.rsrp) || 0);
                        label = 'RSRP';
                    }
                } else if (kpi === 'rsrq') {
                    if (tech === 'NR') {
                        values = parsedData.map(d => parseFloat(d.nr_rsrq) || 0);
                        label = 'NR-RSRQ';
                    } else if (tech === 'UMTS') {
                        values = parsedData.map(d => parseFloat(d.wcdma_ecno) || 0);
                        label = 'Ec/No';
                    } else if (tech === 'GSM') {
                        values = parsedData.map(d => parseFloat(d.gsm_rxqual || d.rxqual) || 0);
                        label = 'RxQual';
                    } else {
                        values = parsedData.map(d => parseFloat(d.rsrq) || 0);
                        label = 'RSRQ';
                    }
                } else if (kpi === 'sinr') {
                    if (tech === 'NR') {
                        values = parsedData.map(d => parseFloat(d.nr_sinr) || 0);
                        label = 'NR-SINR';
                    } else {
                        values = parsedData.map(d => parseFloat(d.sinr) || 0);
                        label = 'SINR';
                    }
                } else if (kpi === 'txpower') {
                    // TxPower extraction - handle case variations
                    values = parsedData.map(d => {
                        const val = parseFloat(d.TxPower || d.txpower || d.TXPOWER || d.tx_power);
                        return isNaN(val) ? 0 : val; // Use 0 for consistency with other KPIs in multi-KPI mode
                    });
                    label = 'Tx Power';
                } else {
                    // Generic KPI extraction
                    values = parsedData.map(d => parseFloat(d[kpi]) || 0);
                }
                
                // Add unit to label
                const fullLabel = unit ? `${label} (${unit})` : label;
                
                return {
                    label: fullLabel,
                    data: values,
                    borderColor: kpiColor,
                    backgroundColor: 'transparent',
                    borderWidth: 2.5,
                    fill: false,
                    tension: 0.3,
                    pointRadius: 1.5,
                    pointHoverRadius: 6,
                    pointHoverBorderWidth: 2,
                    yAxisID: axis,
                    spanGaps: false // Match single KPI behavior - show all data points including zeros
                };
            });
            
            // Determine axis configuration
            const hasLeftAxis = selectedKpis.some(k => k.axis === 'left');
            const hasRightAxis = selectedKpis.some(k => k.axis === 'right');
            
            // Get units for axis labels
            const leftUnits = [...new Set(selectedKpis.filter(k => k.axis === 'left').map(k => k.unit).filter(u => u))];
            const rightUnits = [...new Set(selectedKpis.filter(k => k.axis === 'right').map(k => k.unit).filter(u => u))];
            
            const axisConfig = {
                hasLeft: hasLeftAxis,
                hasRight: hasRightAxis,
                leftLabel: leftUnits.length === 1 ? leftUnits[0] : leftUnits.length > 1 ? 'Mixed Units' : 'Value',
                rightLabel: rightUnits.length === 1 ? rightUnits[0] : rightUnits.length > 1 ? 'Mixed Units' : 'Value'
            };
            
            return { labels, datasets, axisConfig };
        }
        
        /**
         * Update the observation panel with data at the given index
         * @param {number} index - Data index
         * @param {Array} labels - Time labels
         * @param {Array} selectedKpis - Selected KPI objects
         * @param {Array} datasets - Chart datasets
         */
        function updateObservationPanel(index, labels, selectedKpis, datasets) {
            const panel = document.getElementById('observationPanel');
            const content = document.getElementById('observationContent');
            
            if (!panel || !content) return;
            
            // Show panel if hidden
            if (panel.style.display === 'none') {
                panel.style.display = 'block';
            }
            
            // Get data point
            const point = parsedData[index];
            const timestamp = labels[index];
            
            // Apply theme colors
            const textColor = kpiTheme === 'dark' ? '#fff' : '#1f2937';
            const mutedColor = kpiTheme === 'dark' ? '#9ca3af' : '#6b7280';
            const bgColor = kpiTheme === 'dark' ? '#374151' : '#f9fafb';
            const borderColor = kpiTheme === 'dark' ? '#4b5563' : '#e5e7eb';
            
            panel.style.color = textColor;
            panel.style.borderColor = kpiTheme === 'dark' ? '#fff' : '#000';
            
            // Build observation HTML
            let html = '';
            
            // Timestamp section
            html += `<div style="background:${bgColor}; padding:10px; border-radius:4px; margin-bottom:12px; border:1px solid ${borderColor};">`;
            html += `<div style="font-size:10px; color:${mutedColor}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Timestamp</div>`;
            html += `<div style="font-size:13px; font-weight:700; font-family:'JetBrains Mono';">${timestamp || 'N/A'}</div>`;
            html += `</div>`;
            
            // KPI Values section
            html += `<div style="margin-bottom:12px;">`;
            html += `<div style="font-size:10px; color:${mutedColor}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; font-weight:700;">KPI Values</div>`;
            
            datasets.forEach((dataset, idx) => {
                const value = dataset.data[index];
                const displayValue = (value !== null && value !== undefined && !isNaN(value)) 
                    ? value.toFixed(2) 
                    : 'N/A';
                
                html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:${bgColor}; border-left:3px solid ${dataset.borderColor}; margin-bottom:6px; border-radius:2px;">`;
                html += `<span style="font-size:11px; font-weight:600;">${dataset.label.split('(')[0].trim()}</span>`;
                html += `<span style="font-size:12px; font-weight:700; font-family:'JetBrains Mono';">${displayValue}</span>`;
                html += `</div>`;
            });
            
            html += `</div>`;
            
            // Metadata section (PCI, Technology, Events)
            if (point) {
                html += `<div style="border-top:1px solid ${borderColor}; padding-top:12px;">`;
                html += `<div style="font-size:10px; color:${mutedColor}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; font-weight:700;">Metadata</div>`;
                
                // Technology
                const tech = point.technology || detectedTechnology || 'LTE';
                html += `<div style="display:flex; justify-content:space-between; padding:6px 8px; background:${bgColor}; margin-bottom:4px; border-radius:2px; font-size:11px;">`;
                html += `<span style="color:${mutedColor};">Technology</span>`;
                html += `<span style="font-weight:600;">${tech}</span>`;
                html += `</div>`;
                
                // PCI/PSC/BSIC
                let pci = '';
                let pciLabel = 'PCI';
                if (tech === 'NR') {
                    pci = point.nr_pci || '-';
                    pciLabel = 'NR-PCI';
                } else if (tech === 'UMTS') {
                    pci = point.wcdma_psc || point.psc || '-';
                    pciLabel = 'PSC';
                } else if (tech === 'GSM') {
                    pci = point.gsm_bsic || point.bsic || '-';
                    pciLabel = 'BSIC';
                } else {
                    pci = point.pci || '-';
                }
                
                html += `<div style="display:flex; justify-content:space-between; padding:6px 8px; background:${bgColor}; margin-bottom:4px; border-radius:2px; font-size:11px;">`;
                html += `<span style="color:${mutedColor};">${pciLabel}</span>`;
                html += `<span style="font-weight:600; font-family:'JetBrains Mono';">${pci}</span>`;
                html += `</div>`;
                
                // Check for events at this index
                const eventTimeline = extractEventTimeline(parsedData);
                const event = eventTimeline.find(e => e.index === index);
                
                if (event) {
                    const icon = getEventIcon(event.type);
                    html += `<div style="background:#fef3c7; color:#92400e; padding:8px; border-radius:4px; margin-top:8px; border-left:3px solid #f59e0b; font-size:11px;">`;
                    html += `<div style="font-weight:700; margin-bottom:2px;">${icon} Event Detected</div>`;
                    html += `<div style="font-size:10px;">${event.details}</div>`;
                    html += `</div>`;
                }
                
                html += `</div>`;
            } else {
                // No data available
                html += `<div style="border-top:1px solid ${borderColor}; padding-top:12px; text-align:center; color:${mutedColor}; font-size:11px;">`;
                html += `No metadata available`;
                html += `</div>`;
            }
            
            content.innerHTML = html;
        }
        
        /**
         * Render multi-KPI comparison chart in zoom modal (STACKED CHARTS VERSION)
         * Each KPI gets its own chart with its own Y-axis, all sharing the same X-axis
         * @param {Array} selectedKpis - Array of selected KPI objects
         */
        function renderMultiKpiChart(selectedKpis) {
            const data = prepareMultiKpiData(selectedKpis);
            
            if (!data) {
                alert('⚠️ No data available for selected KPIs');
                return;
            }
            
            const { labels, datasets } = data;
            
            // Extract event timeline for event markers
            const eventTimeline = extractEventTimeline(parsedData);
            console.log(`📍 Rendering ${eventTimeline.length} event markers on multi-KPI charts`);
            
            // Open modal
            const modal = document.getElementById('chartZoomModal');
            const title = document.getElementById('chartZoomTitle');
            const modalContent = modal.querySelector('div');
            const chartContainer = document.getElementById('chartZoomContainer');
            
            // Set title
            const tech = detectedTechnology || 'LTE';
            const kpiNames = selectedKpis.map(k => {
                if (k.kpi === 'rsrp') {
                    return tech === 'NR' ? 'NR-RSRP' : tech === 'UMTS' ? 'RSCP' : tech === 'GSM' ? 'RxLev' : 'RSRP';
                } else if (k.kpi === 'rsrq') {
                    return tech === 'NR' ? 'NR-RSRQ' : tech === 'UMTS' ? 'Ec/No' : tech === 'GSM' ? 'RxQual' : 'RSRQ';
                } else if (k.kpi === 'sinr') {
                    return tech === 'NR' ? 'NR-SINR' : 'SINR';
                } else if (k.kpi === 'throughput_dl_mbps') {
                    return 'DL Tput';
                } else if (k.kpi === 'throughput_ul_mbps') {
                    return 'UL Tput';
                }
                return k.kpi.toUpperCase();
            }).join(' + ');
            
            title.textContent = `📊 Multi-KPI Analysis: ${kpiNames}`;
            
            // Show modal
            modal.style.display = 'flex';
            
            // Apply theme
            const textColor = kpiTheme === 'dark' ? '#fff' : '#1f2937';
            const gridColor = kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
            const tickColor = kpiTheme === 'dark' ? '#9ca3af' : '#4b5563';
            const bgColor = kpiTheme === 'dark' ? '#374151' : '#ffffff';
            
            if (kpiTheme === 'light') {
                modal.style.background = 'rgba(255,255,255,0.95)';
                modalContent.style.background = '#f3f4f6';
                title.style.color = '#1f2937';
            } else {
                modal.style.background = 'rgba(0,0,0,0.95)';
                modalContent.style.background = '#1f2937';
                title.style.color = '#fff';
            }
            
            // Clear existing content and create stacked charts container
            chartContainer.innerHTML = '';
            chartContainer.style.background = bgColor;
            chartContainer.style.overflowY = 'auto';
            chartContainer.style.overflowX = 'hidden';
            chartContainer.style.display = 'flex';
            chartContainer.style.flexDirection = 'column';
            chartContainer.style.gap = '8px'; // Reduced from 15px to 8px
            chartContainer.style.padding = '12px'; // Reduced from 20px to 12px
            
            // Destroy existing chart if any
            if (zoomedChart) {
                zoomedChart.destroy();
                zoomedChart = null;
            }
            
            // Store all chart instances for cleanup
            if (!window.multiKpiCharts) {
                window.multiKpiCharts = [];
            }
            // Destroy previous charts
            window.multiKpiCharts.forEach(chart => chart.destroy());
            window.multiKpiCharts = [];
            
            // Shared state for synchronized crosshair
            const syncState = {
                activeIndex: null,
                isHovering: false
            };
            
            // Custom plugin for vertical crosshair line
            const crosshairPlugin = {
                id: 'crosshair',
                afterDraw: (chart) => {
                    if (syncState.activeIndex !== null && syncState.isHovering) {
                        const ctx = chart.ctx;
                        const xAxis = chart.scales.x;
                        const yAxis = chart.scales.y;
                        
                        // Get x position for the active index
                        const x = xAxis.getPixelForValue(syncState.activeIndex);
                        
                        // Draw vertical line
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(x, yAxis.top);
                        ctx.lineTo(x, yAxis.bottom);
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = kpiTheme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)';
                        ctx.setLineDash([5, 5]);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            };
            
            // Calculate height per chart (improved dynamic calculation)
            const numCharts = datasets.length;
            const availableHeight = window.innerHeight * 0.88; // Use 88% of viewport
            const titleHeight = 30; // Title + margins
            const containerPadding = 24; // Top + bottom padding (12px each)
            const gapTotal = (numCharts - 1) * 8; // Gaps between charts
            const borderTotal = numCharts * 4; // 2px border top + bottom per chart
            const wrapperPaddingTotal = numCharts * 16; // 8px top + 8px bottom per chart
            
            // Calculate available height per chart
            const totalOverhead = containerPadding + gapTotal + borderTotal + wrapperPaddingTotal + (numCharts * titleHeight);
            const chartHeight = Math.max(120, Math.floor((availableHeight - totalOverhead) / numCharts));
            
            console.log(`📊 Multi-KPI Layout: ${numCharts} charts, ${chartHeight}px each, total overhead: ${totalOverhead}px`);
            
            // Create a separate chart for each KPI
            datasets.forEach((dataset, index) => {
                // Create container for this chart
                const chartWrapper = document.createElement('div');
                chartWrapper.style.background = bgColor;
                chartWrapper.style.border = `2px solid ${kpiTheme === 'dark' ? '#4b5563' : '#e5e7eb'}`;
                chartWrapper.style.borderRadius = '4px';
                chartWrapper.style.padding = '8px 15px 8px 60px'; // Reduced padding: 8px top/bottom, 60px left for Y-axis
                chartWrapper.style.minHeight = `${chartHeight + titleHeight}px`;
                chartWrapper.style.position = 'relative';
                chartWrapper.style.boxSizing = 'border-box';
                
                // Add KPI title
                const chartTitle = document.createElement('div');
                chartTitle.textContent = dataset.label;
                chartTitle.style.color = textColor;
                chartTitle.style.fontFamily = 'JetBrains Mono';
                chartTitle.style.fontSize = '11px'; // Reduced from 13px to 11px
                chartTitle.style.fontWeight = 'bold';
                chartTitle.style.marginBottom = '6px'; // Reduced from 10px to 6px
                chartTitle.style.paddingBottom = '4px'; // Reduced from 8px to 4px
                chartTitle.style.borderBottom = `1px solid ${kpiTheme === 'dark' ? '#4b5563' : '#e5e7eb'}`;
                chartWrapper.appendChild(chartTitle);
                
                // Create canvas wrapper with overflow control
                const canvasWrapper = document.createElement('div');
                canvasWrapper.style.position = 'relative';
                canvasWrapper.style.width = '100%';
                canvasWrapper.style.height = `${chartHeight}px`; // Use calculated height directly
                canvasWrapper.style.overflow = 'visible'; // Allow labels to show
                
                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvasWrapper.appendChild(canvas);
                chartWrapper.appendChild(canvasWrapper);
                
                chartContainer.appendChild(chartWrapper);
                
                // Calculate Y-axis range for this dataset
                const validData = dataset.data.filter(v => v !== null && v !== undefined && !isNaN(v) && isFinite(v));
                let yMin, yMax;
                const kpiName = selectedKpis[index].kpi;
                
                // Apply technology-aware fixed ranges for specific KPIs
                // This ensures consistency while respecting each technology's actual range
                if (kpiName === 'rsrp') {
                    // RSRP / RSCP / RxLev - Technology-specific ranges
                    if (tech === 'NR' || tech === 'LTE') {
                        yMin = -110;
                        yMax = -50;
                    } else if (tech === 'UMTS') {
                        yMin = -120; // RSCP can go lower than RSRP
                        yMax = -25;  // RSCP can go higher than RSRP
                    } else if (tech === 'GSM') {
                        yMin = -110;
                        yMax = -48;
                    } else {
                        yMin = -110;
                        yMax = -50;
                    }
                    console.log(`📊 RSRP/RSCP Y-axis: ${yMin} to ${yMax} (Tech: ${tech})`);
                } else if (kpiName === 'rsrq') {
                    // RSRQ / Ec/No / RxQual - Technology-specific ranges
                    if (tech === 'NR' || tech === 'LTE') {
                        yMin = -20;
                        yMax = -3;
                    } else if (tech === 'UMTS') {
                        yMin = -24; // Ec/No can go lower in poor conditions
                        yMax = 5;   // Ec/No can go positive in excellent conditions
                    } else if (tech === 'GSM') {
                        yMin = 0;   // RxQual is inverted (0=best, 7=worst)
                        yMax = 7;
                    } else {
                        yMin = -20;
                        yMax = -3;
                    }
                    console.log(`📊 RSRQ/Ec/No Y-axis: ${yMin} to ${yMax} (Tech: ${tech})`);
                } else if (kpiName === 'sinr') {
                    // SINR - Only for LTE/NR (3G/2G don't have SINR)
                    if (tech === 'NR' || tech === 'LTE') {
                        yMin = -5;
                        yMax = 31;
                    } else {
                        // Fallback to auto-scale if SINR somehow appears in 2G/3G
                        if (validData.length > 0) {
                            yMin = Math.min(...validData);
                            yMax = Math.max(...validData);
                        } else {
                            yMin = -5;
                            yMax = 31;
                        }
                    }
                } else if (kpiName === 'bler') {
                    // BLER: 0 to 120% (can exceed 100% in poor conditions)
                    yMin = 0;
                    yMax = 120;
                } else if (kpiName === 'cqi') {
                    // CQI: 0 to 15 (LTE/NR standard)
                    yMin = 0;
                    yMax = 15;
                } else if (kpiName === 'mcs') {
                    // MCS: 0 to 33 (covers both LTE 0-28 and 5G NR up to 33)
                    yMin = 0;
                    yMax = 33;
                } else if (kpiName === 'throughput_dl_mbps' || kpiName === 'throughput_ul_mbps') {
                    // Auto-scale for throughput (high variability: 0-500+ Mbps)
                    if (validData.length > 0) {
                        yMin = Math.min(...validData);
                        yMax = Math.max(...validData);
                        
                        // Add 10% padding for better visualization
                        const range = yMax - yMin;
                        const padding = range * 0.1;
                        yMin = Math.max(0, yMin - padding); // Don't go below 0
                        yMax = yMax + padding;
                    } else {
                        yMin = 0;
                        yMax = 100; // Default fallback
                    }
                } else {
                    // Default auto-scale for any other KPIs
                    if (validData.length > 0) {
                        yMin = Math.min(...validData);
                        yMax = Math.max(...validData);
                        
                        const range = yMax - yMin;
                        const padding = range * 0.1;
                        yMin = yMin - padding;
                        yMax = yMax + padding;
                    } else {
                        yMin = undefined;
                        yMax = undefined;
                    }
                }
                
                // Create chart
                const ctx = canvas.getContext('2d');
                const chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: dataset.label,
                            data: dataset.data,
                            borderColor: dataset.borderColor,
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.3,
                            pointRadius: 1,
                            pointHoverRadius: 5,
                            spanGaps: false // Match single KPI behavior
                        }]
                    },
                    plugins: [crosshairPlugin, multiKpiEventMarkerPlugin], // Register event marker plugin
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: {
                            padding: {
                                left: 20, // Reduced from 30 to 20
                                right: 15, // Reduced from 20 to 15
                                top: 22, // Reduced from 25 to 22 (still room for event icons)
                                bottom: 10 // Reduced from 15 to 10
                            }
                        },
                        interaction: {
                            mode: 'index',
                            intersect: false
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                enabled: false // Disable default tooltip overlay
                            },
                            multiKpiEventMarkers: {
                                events: eventTimeline // Pass event data to plugin
                            }
                        },
                        scales: {
                            x: {
                                display: index === datasets.length - 1,
                                ticks: { 
                                    color: tickColor, 
                                    font: { size: 8, family: 'JetBrains Mono' }, // Reduced from 9 to 8
                                    maxRotation: 45,
                                    minRotation: 45,
                                    autoSkip: true,
                                    maxTicksLimit: 10 // Reduced from 12 to 10
                                },
                                grid: { 
                                    color: gridColor,
                                    display: true,
                                    drawBorder: true
                                },
                                title: {
                                    display: index === datasets.length - 1,
                                    text: 'Time',
                                    color: textColor,
                                    font: { size: 10, family: 'JetBrains Mono', weight: 'bold' } // Reduced from 11 to 10
                                }
                            },
                            y: {
                                type: 'linear',
                                position: 'left',
                                min: yMin,
                                max: yMax,
                                ticks: { 
                                    color: tickColor,
                                    font: { family: 'JetBrains Mono', size: 8 }, // Reduced from 9 to 8
                                    autoSkip: true,
                                    maxTicksLimit: 6, // Reduced from 8 to 6
                                    padding: 8, // Reduced from 10 to 8
                                    align: 'end'
                                },
                                grid: { 
                                    color: gridColor,
                                    drawBorder: true,
                                    offset: false
                                },
                                offset: false,
                                beginAtZero: false
                            }
                        }
                    },
                    plugins: [crosshairPlugin]
                });
                
                // Add mouse event listeners for synchronization
                // Throttle mousemove for better performance with large datasets
                const throttledMouseMove = throttle((e) => {
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    // Get the data index at mouse position
                    const xAxis = chart.scales.x;
                    const xValue = xAxis.getValueForPixel(x);
                    
                    if (xValue !== undefined && xValue >= 0 && xValue < labels.length) {
                        syncState.activeIndex = Math.round(xValue);
                        syncState.isHovering = true;
                        
                        // Update observation panel
                        updateObservationPanel(syncState.activeIndex, labels, selectedKpis, datasets);
                        
                        // Update all charts (crosshair only, no tooltips)
                        window.multiKpiCharts.forEach(c => {
                            c.update('none'); // Update without animation
                        });
                    }
                }, 16); // ~60fps throttle
                
                canvas.addEventListener('mousemove', throttledMouseMove);
                
                canvas.addEventListener('mouseleave', () => {
                    syncState.isHovering = false;
                    syncState.activeIndex = null;
                    
                    // Clear all tooltips and crosshairs
                    window.multiKpiCharts.forEach(c => {
                        c.tooltip.setActiveElements([]);
                        c.update('none');
                    });
                    
                    // Reset observation panel to default state
                    const observationContent = document.getElementById('observationContent');
                    if (observationContent) {
                        const textColor = kpiTheme === 'dark' ? '#9ca3af' : '#6b7280';
                        observationContent.innerHTML = `<div style="text-align:center; padding:40px 20px; opacity:0.6; font-size:12px; color:${textColor};">
                            Hover over the charts to view detailed observations
                        </div>`;
                    }
                });
                
                // Store chart instance
                window.multiKpiCharts.push(chart);
            });
            
            console.log('✅ Multi-KPI stacked charts rendered:', datasets.length, 'charts');
        }
        
        /**
         * Initialize multi-KPI comparison feature
         */
        function initMultiKpiComparison() {
            const checkboxes = document.querySelectorAll('.kpi-selector');
            const compareBtn = document.getElementById('compareKpisBtn');
            const countSpan = document.getElementById('selectedKpiCount');
            
            if (!compareBtn || !countSpan) {
                console.warn('Multi-KPI comparison UI not found');
                return;
            }
            
            // Update selected KPIs array
            function updateSelectedKpis() {
                selectedKpis = [];
                checkboxes.forEach(checkbox => {
                    if (checkbox.checked && checkbox.parentElement.style.display !== 'none') {
                        selectedKpis.push({
                            kpi: checkbox.dataset.kpi,
                            unit: checkbox.dataset.unit,
                            axis: checkbox.dataset.axis
                        });
                    }
                });
                
                // Update button state
                countSpan.textContent = selectedKpis.length;
                compareBtn.disabled = selectedKpis.length < 2 || selectedKpis.length > 9;
                
                // Update button appearance
                if (selectedKpis.length < 2 || selectedKpis.length > 9) {
                    compareBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    compareBtn.classList.remove('hover:bg-blue-700');
                } else {
                    compareBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    compareBtn.classList.add('hover:bg-blue-700');
                }
                
                // Warn user visually when exceeding 9
                if (selectedKpis.length > 9) {
                    countSpan.style.color = '#ef4444'; // Red
                } else {
                    countSpan.style.color = '';
                }
            }
            
            // Expose globally so updateMultiKpiLabels can call it
            window.updateMultiKpiSelectedCount = updateSelectedKpis;
            
            // Update selected KPIs on checkbox change
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    updateSelectedKpis();
                });
            });
            
            // Compare button click handler
            compareBtn.addEventListener('click', function() {
                if (selectedKpis.length < 2) {
                    alert('⚠️ Please select at least 2 KPIs to compare');
                    return;
                }
                if (selectedKpis.length > 9) {
                    alert('⚠️ Maximum 9 KPIs allowed. Please deselect ' + (selectedKpis.length - 9) + ' KPI(s) to continue.');
                    return;
                }
                
                renderMultiKpiChart(selectedKpis);
            });
            
            // Initial update
            updateSelectedKpis();
            
            console.log('✅ Multi-KPI comparison initialized');
        }
        
        // Initialize on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initMultiKpiComparison);
        } else {
            initMultiKpiComparison();
        }
