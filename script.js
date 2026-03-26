
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
        let scatterTputSinr = null;
        let scatterTputRsrp = null;
        let scatterMcsCqi = null;
        let scatterBlerTput = null;
        let kpiHistogramChart = null;
        let mentorChart1 = null;
        let mentorChart2 = null;
        let mentorChart3 = null;
        let showingKPIs = false;
        let currentChartType = 'line';
        let currentKpiType = 'rsrp';
        let currentViewMode = 'grid';
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

                // Also clear the map (markers, per-segment layers) and CSV state
                try {
                    clearMap();
                    csvData = null;
                    parsedData = [];
                    const pc = document.getElementById('pointCount');
                    if (pc) pc.textContent = '0';
                    // Reset map view to default center/zoom if map exists
                    if (map && typeof map.setCenter === 'function') {
                        map.setCenter([11.5021, 3.8480]);
                        map.setZoom(12);
                    }
                } catch (e) {
                    console.warn('Error clearing map during reset:', e);
                }

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
                
                if (parsedData.length > 0) {
                    // Update KPI panel title based on technology
                    const tech = detectedTechnology || 'LTE';
                    const techNames = { 'NR': '5G NR', 'LTE': '4G LTE', 'UMTS': '3G UMTS', 'GSM': '2G GSM' };
                    const kpiTitle = document.getElementById('kpiPanelTitle');
                    if (kpiTitle) {
                        kpiTitle.textContent = `📊 ${techNames[tech] || tech} KPI VISUALIZATION`;
                    }
                    
                    updateKPITabs(); // Update tabs based on technology
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
                
                document.querySelectorAll('.kpi-tab').forEach(t => {
                    t.classList.remove('active', 'bg-blue-600');
                    t.classList.add('bg-gray-700');
                });
                this.classList.add('active', 'bg-blue-600');
                this.classList.remove('bg-gray-700');
                currentKpiType = this.dataset.kpi;
                renderKPIChart(currentKpiType);
                // If zoom modal is open, update mentor charts to reflect new KPI selection
                try {
                    const modal = document.getElementById('chartZoomModal');
                    if (modal && modal.style.display === 'flex') renderMentorCharts(parsedData, currentKpiType);
                } catch (err) { console.warn('mentor charts update after KPI tab click failed', err); }
            });
        });

        // Chart Type switching
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.chart-type-btn').forEach(b => {
                    b.classList.remove('active', 'bg-blue-600');
                    b.classList.add('bg-gray-700');
                });
                this.classList.add('active', 'bg-blue-600');
                this.classList.remove('bg-gray-700');
                currentChartType = this.dataset.type;
                renderKPIChart(currentKpiType);
                // Update mentor charts when chart type changes and modal is open
                try {
                    const modal = document.getElementById('chartZoomModal');
                    if (modal && modal.style.display === 'flex') renderMentorCharts(parsedData, currentKpiType);
                } catch (err) { console.warn('mentor charts update after chart type change failed', err); }
            });
        });

        // View Mode switching
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.view-mode-btn').forEach(b => {
                    b.classList.remove('active', 'bg-blue-600');
                    b.classList.add('bg-gray-700');
                });
                this.classList.add('active', 'bg-blue-600');
                this.classList.remove('bg-gray-700');
                currentViewMode = this.dataset.mode;
                toggleViewMode();
            });
        });

        function toggleViewMode() {
            const gridView = document.getElementById('statsGridView');
            const tableView = document.getElementById('statsTableView');
            if (currentViewMode === 'grid') {
                gridView.classList.remove('hidden');
                tableView.classList.add('hidden');
            } else {
                gridView.classList.add('hidden');
                tableView.classList.remove('hidden');
            }
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

            let rsrpGradient = null, rsrqGradient = null, sinrGradient = null;
            if (currentChartType === 'area') {
                rsrpGradient = ctx.createLinearGradient(0, 0, 0, 300);
                rsrpGradient.addColorStop(0, '#3b82f680');
                rsrpGradient.addColorStop(1, '#3b82f610');
                rsrqGradient = ctx.createLinearGradient(0, 0, 0, 300);
                rsrqGradient.addColorStop(0, '#10b98180');
                rsrqGradient.addColorStop(1, '#10b98110');
                sinrGradient = ctx.createLinearGradient(0, 0, 0, 300);
                sinrGradient.addColorStop(0, '#f59e0b80');
                sinrGradient.addColorStop(1, '#f59e0b10');
            }

            kpiChart = new Chart(ctx, {
                type: currentChartType === 'bar' ? 'bar' : 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'RSRP (dBm)',
                            data: rsrpValues,
                            borderColor: '#3b82f6',
                            backgroundColor: currentChartType === 'area' ? rsrpGradient : '#3b82f6',
                            borderWidth: 2,
                            fill: currentChartType === 'area',
                            tension: 0.3,
                            yAxisID: 'y',
                            pointRadius: 1
                        },
                        {
                            label: 'RSRQ (dB)',
                            data: rsrqValues,
                            borderColor: '#10b981',
                            backgroundColor: currentChartType === 'area' ? rsrqGradient : '#10b981',
                            borderWidth: 2,
                            fill: currentChartType === 'area',
                            tension: 0.3,
                            yAxisID: 'y1',
                            pointRadius: 1
                        },
                        {
                            label: 'SINR (dB)',
                            data: sinrValues,
                            borderColor: '#f59e0b',
                            backgroundColor: currentChartType === 'area' ? sinrGradient : '#f59e0b',
                            borderWidth: 2,
                            fill: currentChartType === 'area',
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
                        tension: currentChartType === 'line' || currentChartType === 'area' ? 0.3 : 0,
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
                                color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563',
                                maxRotation: 45,
                                minRotation: 45,
                                font: { size: 9, family: 'JetBrains Mono' }
                            },
                            grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                        },
                        y: {
                            ticks: { 
                                color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563',
                                font: { family: 'JetBrains Mono' }
                            },
                            grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                        }
                    }
                }
            });
        }

function renderMentorCharts(data, kpiType) {
            if (!data || data.length === 0) return;
            const tech = detectedTechnology || currentTechFilter || (data[0] && data[0].technology) || 'LTE';

            // ── CHART 1: Signal Quality Distribution (vertical bar) ──────────
            let sigVals;
            if (tech === 'NR')        sigVals = data.map(d => parseFloat(d.nr_rsrp) || 0);
            else if (tech === 'UMTS') sigVals = data.map(d => parseFloat(d.wcdma_rscp) || 0);
            else if (tech === 'GSM')  sigVals = data.map(d => parseFloat(d.gsm_rxlev || d.rxlev) || 0);
            else                      sigVals = data.map(d => parseFloat(d.rsrp) || 0);

            const qCounts = { Excellent: 0, Good: 0, Fair: 0, Poor: 0 };
            sigVals.forEach(v => {
                // Technology-specific thresholds
                if (tech === 'GSM') {
                    if (v >= -70)       qCounts.Excellent++;
                    else if (v >= -85)  qCounts.Good++;
                    else if (v >= -95)  qCounts.Fair++;
                    else                qCounts.Poor++;
                } else if (tech === 'UMTS') {
                    if (v >= -85)       qCounts.Excellent++;
                    else if (v >= -95)  qCounts.Good++;
                    else if (v >= -105) qCounts.Fair++;
                    else                qCounts.Poor++;
                } else { // LTE/NR
                    if (v >= -80)       qCounts.Excellent++;
                    else if (v >= -90)  qCounts.Good++;
                    else if (v >= -100) qCounts.Fair++;
                    else                qCounts.Poor++;
                }
            });

            if (mentorChart1) mentorChart1.destroy();
            mentorChart1 = new Chart(document.getElementById('mentorChart1'), {
                type: 'bar',
                data: {
                    labels: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'],
                    datasets: [{
                        data: [qCounts.Excellent, qCounts.Good, qCounts.Fair, qCounts.Poor],
                        backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
                        borderWidth: 0,
                        borderRadius: 2
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { callbacks: {
                        label: ctx => `${ctx.parsed.y} samples (${((ctx.parsed.y/sigVals.length)*100).toFixed(1)}%)`
                    }}},
                    scales: {
                        x: { ticks: { color: '#6b7280', font: { size: 9, family: 'JetBrains Mono' } }, grid: { display: false } },
                        y: { ticks: { color: '#6b7280', font: { size: 9 } }, grid: { color: 'rgba(0,0,0,0.06)' } }
                    }
                }
            });

            // ── CHART 2: Will be replaced by renderMentorChart2WithClickedChart ──────────
            // This is just a placeholder - the actual chart is rendered separately
            
            // ── CHART 3: Signal strength by Band (grouped histogram) ─────────
            const sigLabel = tech === 'NR' ? 'NR-RSRP' : tech === 'UMTS' ? 'RSCP' : tech === 'GSM' ? 'RxLev' : 'RSRP';
            document.getElementById('mentorChart3Title').textContent = `${sigLabel}_LOAD`;

            // Group avg signal per band
            const bandMap = {};
            data.forEach(d => {
                // Support both CSV formats: 'BCCH-ARFCN' (hyphen) and 'gsm_bcch_arfcn' (underscore)
                const band = d.band || d.earfcn || d.uarfcn || d.gsm_bcch_arfcn || d['bcch-arfcn'] || 'N/A';
                const key = `B${band}`;
                if (!bandMap[key]) bandMap[key] = [];
                const sv = tech === 'NR' ? parseFloat(d.nr_rsrp) :
                           tech === 'UMTS' ? parseFloat(d.wcdma_rscp) :
                           tech === 'GSM'  ? parseFloat(d.gsm_rxlev || d.rxlev) :
                                            parseFloat(d.rsrp);
                if (!isNaN(sv) && sv !== 0) bandMap[key].push(sv);
            });

            const bandEntries = Object.entries(bandMap)
                .filter(([, v]) => v.length > 0)
                .sort((a, b) => b[1].length - a[1].length)
                .slice(0, 8);

            const bandLabels = bandEntries.map(([k]) => k);
            const bandAvg    = bandEntries.map(([, v]) => parseFloat((v.reduce((a,b)=>a+b,0)/v.length).toFixed(1)));
            const bandCounts = bandEntries.map(([, v]) => v.length);

            // Color bars by avg signal quality (technology-specific thresholds)
            const bandColors = bandAvg.map(v => {
                if (tech === 'GSM') {
                    return v >= -70 ? '#22c55e' : v >= -85 ? '#f59e0b' : '#ef4444';
                } else if (tech === 'UMTS') {
                    return v >= -85 ? '#22c55e' : v >= -95 ? '#f59e0b' : '#ef4444';
                } else { // LTE/NR
                    return v >= -80 ? '#22c55e' : v >= -90 ? '#f59e0b' : '#ef4444';
                }
            });

            // Update health badge (technology-specific thresholds)
            let goodPct;
            if (tech === 'GSM') {
                goodPct = sigVals.filter(v => v >= -85).length / (sigVals.length || 1);
            } else if (tech === 'UMTS') {
                goodPct = sigVals.filter(v => v >= -95).length / (sigVals.length || 1);
            } else { // LTE/NR
                goodPct = sigVals.filter(v => v >= -90).length / (sigVals.length || 1);
            }
            
            const badge = document.getElementById('mentorChart3Badge');
            if (goodPct >= 0.8)      { badge.textContent = 'HEALTHY';  badge.style.background = '#22c55e'; }
            else if (goodPct >= 0.5) { badge.textContent = 'WARNING';  badge.style.background = '#f59e0b'; }
            else                     { badge.textContent = 'CRITICAL'; badge.style.background = '#ef4444'; }

            if (mentorChart3) mentorChart3.destroy();
            mentorChart3 = new Chart(document.getElementById('mentorChart3'), {
                type: 'bar',
                data: {
                    labels: bandLabels,
                    datasets: [
                        {
                            label: `Avg ${sigLabel} (dBm)`,
                            data: bandAvg,
                            backgroundColor: bandColors,
                            borderWidth: 0, borderRadius: 2, yAxisID: 'y'
                        },
                        {
                            label: 'Samples',
                            data: bandCounts,
                            backgroundColor: 'rgba(156,163,175,0.4)',
                            borderWidth: 0, borderRadius: 2, yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top', labels: { color: '#6b7280', font: { size: 9, family: 'JetBrains Mono' }, boxWidth: 10 } },
                        tooltip: { backgroundColor: 'rgba(0,0,0,0.85)', bodyFont: { family: 'JetBrains Mono', size: 10 } }
                    },
                    scales: {
                        x: { ticks: { color: '#6b7280', font: { size: 9 } }, grid: { display: false } },
                        y:  { position: 'left',  ticks: { color: '#6b7280', font: { size: 9 } }, grid: { color: 'rgba(0,0,0,0.06)' } },
                        y1: { position: 'right', ticks: { color: '#9ca3af', font: { size: 8 } }, grid: { drawOnChartArea: false } }
                    }
                }
            });

            // ── PANEL 4: Active Events ranked list ───────────────────────────
            const eventCounts = {};
            data.forEach(d => {
                if (d.event && d.event.trim()) {
                    const key = d.event.trim().toUpperCase();
                    eventCounts[key] = (eventCounts[key] || 0) + 1;
                }
            });

            const eventColors = {
                HANDOVER: '#f97316', ATTACH: '#3b82f6', DETACH: '#9ca3af',
                RLF: '#ef4444', CELL_RESELECTION: '#8b5cf6', CSFB: '#a855f7',
                'VOICE CALL': '#10b981'
            };

            const sortedEvents = Object.entries(eventCounts).sort((a, b) => b[1] - a[1]);
            const maxCount = sortedEvents[0]?.[1] || 1;
            const listEl = document.getElementById('mentorEventsList');

            if (sortedEvents.length === 0) {
                listEl.innerHTML = '<div style="font-size:11px; color:#9ca3af; padding:8px 0;">No events detected</div>';
            } else {
                listEl.innerHTML = sortedEvents.map(([name, count], i) => {
                    const color = eventColors[name] || '#6b7280';
                    const barPct = Math.round((count / maxCount) * 100);
                    return `
                        <div style="display:flex; flex-direction:column; gap:3px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:10px; font-weight:600; color:#374151; font-family:'JetBrains Mono',monospace;">[0${i}] ${name}</span>
                                <span style="font-size:11px; font-weight:700; color:#1f2937;">${count.toLocaleString()}</span>
                            </div>
                            <div style="height:4px; background:#f3f4f6; border-radius:2px; overflow:hidden;">
                                <div style="height:100%; width:${barPct}%; background:${color}; border-radius:2px;"></div>
                            </div>
                        </div>`;
                }).join('');
            }
        }

        // New function to render mentorChart2 with the clicked chart
        function renderMentorChartsWithClickedChart(data, kpiType, clickedChartInstance) {
            // First render all other mentor charts (1, 3, 4)
            renderMentorCharts(data, kpiType);
            
            // Now render mentorChart2 as a clone of the clicked chart
            if (mentorChart2) mentorChart2.destroy();
            
            const ctx = document.getElementById('mentorChart2');
            const cfg = clickedChartInstance.config;
            const clonedData = JSON.parse(JSON.stringify(cfg.data));
            
            // Update title and subtitle based on clicked chart
            const titleEl = document.getElementById('mentorChart2Title');
            const subtitleEl = document.getElementById('mentorChart2Subtitle');
            
            if (titleEl && subtitleEl) {
                // Extract meaningful title from chart
                const chartTitle = cfg.options?.plugins?.title?.text || cfg.data.datasets[0]?.label || 'KPI';
                titleEl.textContent = chartTitle.split('(')[0].trim();
                
                // Set subtitle based on chart type
                if (cfg.type === 'scatter') {
                    subtitleEl.textContent = 'CORRELATION';
                } else {
                    subtitleEl.textContent = 'TIME_SERIES';
                }
            }
            
            // Clone the chart with proper type preservation
            mentorChart2 = new Chart(ctx, {
                type: cfg.type, // Preserve original type (scatter, line, bar, etc.)
                data: clonedData,
                options: {
                    responsive: true, 
                    maintainAspectRatio: false,
                    interaction: cfg.options?.interaction || { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { 
                            display: clonedData.datasets.length > 1, 
                            position: 'top', 
                            labels: { color: '#6b7280', font: { size: 9 } } 
                        }, 
                        tooltip: cfg.options?.plugins?.tooltip || {
                            backgroundColor: 'rgba(0,0,0,0.85)', 
                            bodyFont: { family: 'JetBrains Mono', size: 10 } 
                        }
                    },
                    scales: cfg.type === 'scatter' ? {
                        // For scatter plots, preserve x and y axes
                        x: { 
                            type: 'linear',
                            ticks: { color: '#9ca3af', font: { size: 8 } }, 
                            grid: { color: 'rgba(0,0,0,0.06)' },
                            title: cfg.options?.scales?.x?.title || undefined
                        },
                        y: { 
                            type: 'linear',
                            ticks: { color: '#9ca3af', font: { size: 9 } }, 
                            grid: { color: 'rgba(0,0,0,0.06)' },
                            title: cfg.options?.scales?.y?.title || undefined
                        }
                    } : {
                        // For time-series charts
                        x: { 
                            ticks: { color: '#9ca3af', font: { size: 8 }, maxTicksLimit: 6, maxRotation: 0 }, 
                            grid: { color: 'rgba(0,0,0,0.06)' } 
                        },
                        y: { 
                            ticks: { color: '#9ca3af', font: { size: 9 } }, 
                            grid: { color: 'rgba(0,0,0,0.06)' } 
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
                        x: { ticks: { color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { type: 'linear', title: { display: true, text: 'CQI', color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: 0, max: Math.ceil(maxCqi * 1.1) }
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
                        x: { ticks: { color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { type: 'linear', title: { display: true, text: 'MCS', color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: 0, max: Math.ceil(maxMcs * 1.1) }
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
                            x: { ticks: { color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                            y: { type: 'linear', title: { display: true, text: sinrLabel, color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: Math.floor(minSinr - 2), max: Math.ceil(maxSinr + 2) }
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
                        x: { ticks: { color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { type: 'linear', title: { display: true, text: rsrpLabel, color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: Math.floor(minRsrp - 5), max: Math.ceil(maxRsrp + 5) }
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
                        x: { ticks: { color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { type: 'linear', title: { display: true, text: rsrqLabel, color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: Math.floor(minRsrq - 2), max: Math.ceil(maxRsrq + 2) }
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
                        x: { ticks: { color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { type: 'linear', title: { display: true, text: 'Throughput (Mbps)', color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: 0, max: Math.ceil(maxTput * 1.1) }
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
                        x: { ticks: { color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { type: 'linear', title: { display: true, text: 'Throughput (Mbps)', color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: 0, max: Math.ceil(maxTput * 1.1) }
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
                        x: { ticks: { color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { type: 'linear', title: { display: true, text: 'BLER (%)', color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#ffffff' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: 0, max: blerYMax }
                    }
                }
            });
            } else {
                if (blerContainer) blerContainer.style.display = 'none';
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

        function renderCorrelationScatters() {
            if (parsedData.length === 0) return;

            const tech = detectedTechnology || 'LTE';
            
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
                const tputXData = xAxisVals.map((x, i) => ({ x: x, y: tputDlVals[i] }));
                const tputXP90 = calculateBinnedPercentiles(xAxisVals, tputDlVals, 90);
                const tputXP50 = calculateBinnedPercentiles(xAxisVals, tputDlVals, 50);
                const tputXAvg = calculateBinnedAverage(xAxisVals, tputDlVals);

                if (scatterTputSinr) scatterTputSinr.destroy();
                scatterTputSinr = new Chart(document.getElementById('scatterTputSinr'), {
                    type: 'scatter',
                    data: {
                        datasets: [
                            { label: 'Data Points', data: tputXData, backgroundColor: 'rgba(59,130,246,0.6)', pointRadius: 3, pointHoverRadius: 5 },
                            { label: '90th Percentile', data: tputXP90, type: 'line', borderColor: '#ef4444', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                            { label: 'Median (50th)', data: tputXP50, type: 'line', borderColor: '#fbbf24', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                            { label: 'Average', data: tputXAvg, type: 'line', borderColor: '#10b981', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { display: true, position: 'top', labels: { color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { family: 'JetBrains Mono', size: 10 } } },
                            title: { display: true, text: 'Throughput vs ' + xAxisLabel.split(' ')[0], color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 14 } },
                            tooltip: { backgroundColor: 'rgba(0,0,0,0.9)', titleFont: { family: 'JetBrains Mono' }, bodyFont: { family: 'JetBrains Mono' } }
                        },
                        scales: {
                            x: { title: { display: true, text: xAxisLabel, color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12 } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563' }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                            y: { title: { display: true, text: 'Throughput (Mbps)', color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12 } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563' }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } }
                        }
                    }
                });
            } else {
                if (scatterTputSinrContainer) scatterTputSinrContainer.style.display = 'none';
            }

            // Throughput vs RSRP
            const rsrpTputData = rsrpVals.map((rsrp, i) => ({ x: rsrp, y: tputDlVals[i] }));
            const rsrpTputP90 = calculateBinnedPercentiles(rsrpVals, tputDlVals, 90);
            const rsrpTputP50 = calculateBinnedPercentiles(rsrpVals, tputDlVals, 50);
            const rsrpTputAvg = calculateBinnedAverage(rsrpVals, tputDlVals);

            if (scatterTputRsrp) scatterTputRsrp.destroy();
            scatterTputRsrp = new Chart(document.getElementById('scatterTputRsrp'), {
                type: 'scatter',
                data: {
                    datasets: [
                        { label: 'Data Points', data: rsrpTputData, backgroundColor: 'rgba(59,130,246,0.6)', pointRadius: 3, pointHoverRadius: 5 },
                        { label: '90th Percentile', data: rsrpTputP90, type: 'line', borderColor: '#ef4444', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                        { label: 'Median (50th)', data: rsrpTputP50, type: 'line', borderColor: '#fbbf24', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                        { label: 'Average', data: rsrpTputAvg, type: 'line', borderColor: '#10b981', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top', labels: { color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { family: 'JetBrains Mono', size: 10 } } },
                        title: { display: true, text: 'Throughput vs ' + rsrpLabel.split(' ')[0], color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 14 } },
                        tooltip: { backgroundColor: 'rgba(0,0,0,0.9)', titleFont: { family: 'JetBrains Mono' }, bodyFont: { family: 'JetBrains Mono' } }
                    },
                    scales: {
                        x: { title: { display: true, text: rsrpLabel, color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12 } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563' }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { title: { display: true, text: 'Throughput (Mbps)', color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12 } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563' }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } }
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

                if (scatterMcsCqi) scatterMcsCqi.destroy();
            scatterMcsCqi = new Chart(document.getElementById('scatterMcsCqi'), {
                type: 'scatter',
                data: {
                    datasets: [
                        { label: 'Data Points', data: cqiMcsData, backgroundColor: 'rgba(59,130,246,0.6)', pointRadius: 3, pointHoverRadius: 5 },
                        { label: '90th Percentile', data: cqiMcsP90, type: 'line', borderColor: '#ef4444', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                        { label: 'Median (50th)', data: cqiMcsP50, type: 'line', borderColor: '#fbbf24', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                        { label: 'Average', data: cqiMcsAvg, type: 'line', borderColor: '#10b981', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 }
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

                if (scatterBlerTput) scatterBlerTput.destroy();
            scatterBlerTput = new Chart(document.getElementById('scatterBlerTput'), {
                type: 'scatter',
                data: {
                    datasets: [
                        { label: 'Data Points', data: blerTputData, backgroundColor: 'rgba(59,130,246,0.6)', pointRadius: 3, pointHoverRadius: 5 },
                        { label: '90th Percentile', data: blerTputP90, type: 'line', borderColor: '#ef4444', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                        { label: 'Median (50th)', data: blerTputP50, type: 'line', borderColor: '#fbbf24', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 },
                        { label: 'Average', data: blerTputAvg, type: 'line', borderColor: '#10b981', borderWidth: 3, pointRadius: 0, fill: false, tension: 0.4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top', labels: { color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { family: 'JetBrains Mono', size: 10 } } },
                        title: { display: true, text: 'Throughput vs BLER', color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 14 } },
                        tooltip: { backgroundColor: 'rgba(0,0,0,0.9)', titleFont: { family: 'JetBrains Mono' }, bodyFont: { family: 'JetBrains Mono' } }
                    },
                    scales: {
                        x: { title: { display: true, text: 'BLER (%)', color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12 } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563' }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { title: { display: true, text: 'Throughput (Mbps)', color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12 } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563' }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } }
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
                        // Fallback: auto-detect from signal columns for unrecognized values (e.g. 'Unknown')
                        if (hasNR && obj.nr_rsrp && obj.nr_rsrp !== '' && obj.nr_rsrp !== '0') {
                            obj.technology = 'NR';
                        } else if (hasUMTS && obj.wcdma_rscp && obj.wcdma_rscp !== '' && obj.wcdma_rscp !== '0') {
                            obj.technology = 'UMTS';
                        } else if (hasGSM && (obj.gsm_rxlev || obj.rxlev) && (obj.gsm_rxlev !== '0' || obj.rxlev !== '0')) {
                            obj.technology = 'GSM';
                        } else if (hasLTE && obj.rsrp && obj.rsrp !== '' && obj.rsrp !== '0') {
                            obj.technology = 'LTE';
                        } else {
                            obj.technology = 'Unknown';
                        }
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
                'cell reselection': { icon: '📶', color: '#8b5cf6', label: 'Cell Reselection' },
                'rlf': { icon: '⚠', color: '#ef4444', label: 'RLF', circleIcon: true },
                'attach': { icon: '⚡', color: '#3b82f6', label: 'Attach', circleIcon: true },
                'detach': { icon: '🔌', color: '#9ca3af', label: 'Detach', circleIcon: true },
                'csfb': { icon: '📞', color: '#a855f7', label: 'CSFB', circleIcon: true },
                'voice call': { icon: '☎️', color: '#10b981', label: 'Voice Call', circleIcon: true }
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

            // If zoom modal is open, update mentor charts with the newly filtered data
            try {
                const modal = document.getElementById('chartZoomModal');
                if (modal && modal.style.display === 'flex') renderMentorCharts(parsedData, currentKpiType);
            } catch (err) { console.warn('mentor charts update after renderMap failed', err); }

            // Auto-populate L3 messages (removed - no longer needed)
        }

        document.getElementById('csvFile').addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                csvData = event.target.result;
                if (map.isStyleLoaded()) {
                    renderMap(csvData);
                } else {
                    setTimeout(() => renderMap(csvData), 500);
                }
            };
            reader.readAsText(file);
        });
        
        // Technology filter change handler
        document.getElementById('techFilter').addEventListener('change', function(e) {
            currentTechFilter = e.target.value;
            if (csvData && rawParsedData.length > 0) {
                renderMap(); // Call without csvText to re-filter existing data
                // If zoom modal is open, re-render mentor charts with new filtered data
                setTimeout(() => {
                    try {
                        const modal = document.getElementById('chartZoomModal');
                        if (modal && modal.style.display === 'flex') renderMentorCharts(parsedData, currentKpiType);
                    } catch (err) { console.warn('mentor charts update after tech change failed', err); }
                }, 250);
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
        let zoomedChart = null;

        function openChartZoom(chartTitle, chartInstance) {
            const modal = document.getElementById('chartZoomModal');
            const canvas = document.getElementById('chartZoomCanvas');
            const title = document.getElementById('chartZoomTitle');
            
            // Apply enterprise theme to modal
            const modalContent = document.getElementById('chartZoomModalContent');
            
            // Add enterprise modal class
            modal.classList.add('enterprise-modal');
            
            if (kpiTheme === 'dark') {
                modal.classList.add('dark');
                modalContent.style.background = 'var(--card-bg-dark)';
            } else {
                modal.classList.remove('dark');
                modalContent.style.background = 'var(--card-bg-light)';
            }
            
            // Destroy previous chart if exists
            if (zoomedChart) {
                zoomedChart.destroy();
                zoomedChart = null;
            }
            
            title.textContent = chartTitle;
            modal.style.display = 'flex';
            
            // Show mentor overview grid
            const mentorGrid = document.getElementById('mentorOverviewGrid');
            if (mentorGrid) mentorGrid.style.display = 'grid';
            
            // Force canvas reset
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            
            // Extract values - handle both regular arrays and scatter plot {x,y} objects
            const data = chartInstance.data.datasets[0].data;
            let values;
            
            // Check if this is a scatter plot (data contains {x, y} objects)
            const isScatterPlot = data.length > 0 && typeof data[0] === 'object' && data[0].hasOwnProperty('x');
            
            if (isScatterPlot) {
                // For scatter plots, extract y values for statistics
                values = data.map(d => d.y).filter(v => v !== null && v !== undefined && !isNaN(v));
            } else {
                // For regular charts, use values directly
                values = data.filter(v => v !== null && v !== undefined && !isNaN(v));
            }
            
            if (values.length > 0) {
                // Update modal statistics with mentor-style design
                updateMentorModalStatistics(values, currentKpiType);

                // Render mentor charts - mentorChart2 will show the clicked chart
                try { renderMentorChartsWithClickedChart(parsedData, currentKpiType, chartInstance); } catch (e) { console.warn('renderMentorCharts error:', e); }
                
                const min = Math.min(...values);
                const max = Math.max(...values);
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                const current = values[values.length - 1];
                
                // Percentiles
                const sorted = [...values].sort((a, b) => a - b);
                const p10 = sorted[Math.floor(sorted.length * 0.1)];
                const p50 = sorted[Math.floor(sorted.length * 0.5)];
                const p90 = sorted[Math.floor(sorted.length * 0.9)];
                
                // Update percentiles
                document.getElementById('modalP10').textContent = p10.toFixed(1);
                document.getElementById('modalP50').textContent = p50.toFixed(1);
                document.getElementById('modalP90').textContent = p90.toFixed(1);
                
                // Status badge
                let status = 'UNKNOWN';
                let statusClass = 'poor';
                if (chartTitle.includes('RSRP') || chartTitle.includes('RSCP') || chartTitle.includes('RxLev')) {
                    if (current >= -80) { status = 'EXCELLENT'; statusClass = 'excellent'; }
                    else if (current >= -90) { status = 'GOOD'; statusClass = 'good'; }
                    else if (current >= -100) { status = 'FAIR'; statusClass = 'fair'; }
                    else { status = 'POOR'; statusClass = 'poor'; }
                } else if (chartTitle.includes('RSRQ') || chartTitle.includes('Ec/No') || chartTitle.includes('RxQual')) {
                    if (current >= -10) { status = 'EXCELLENT'; statusClass = 'excellent'; }
                    else if (current >= -15) { status = 'GOOD'; statusClass = 'good'; }
                    else if (current >= -20) { status = 'FAIR'; statusClass = 'fair'; }
                    else { status = 'POOR'; statusClass = 'poor'; }
                } else if (chartTitle.includes('SINR')) {
                    if (current >= 20) { status = 'EXCELLENT'; statusClass = 'excellent'; }
                    else if (current >= 13) { status = 'GOOD'; statusClass = 'good'; }
                    else if (current >= 0) { status = 'FAIR'; statusClass = 'fair'; }
                    else { status = 'POOR'; statusClass = 'poor'; }
                }
                
                const statusBadge = document.getElementById('modalStatusBadge');
                statusBadge.textContent = status;
                statusBadge.className = `status-badge ${statusClass}`;
                
                // Quality distribution for signal charts
                const isSignalChart = chartTitle.includes('RSRP') || chartTitle.includes('RSCP') || chartTitle.includes('RxLev') || chartTitle.includes('RSRQ') || chartTitle.includes('Ec/No') || chartTitle.includes('RxQual') || chartTitle.includes('SINR');
                
                const qualityCard = document.getElementById('modalQualityCard');
                if (isSignalChart) {
                    qualityCard.style.display = 'block';
                    
                    let excellent = 0, good = 0, fair = 0, poor = 0;
                    
                    if (chartTitle.includes('RSRP') || chartTitle.includes('RSCP') || chartTitle.includes('RxLev')) {
                        values.forEach(v => {
                            if (v >= -80) excellent++;
                            else if (v >= -90) good++;
                            else if (v >= -100) fair++;
                            else poor++;
                        });
                    } else if (chartTitle.includes('RSRQ') || chartTitle.includes('Ec/No') || chartTitle.includes('RxQual')) {
                        values.forEach(v => {
                            if (v >= -10) excellent++;
                            else if (v >= -15) good++;
                            else if (v >= -20) fair++;
                            else poor++;
                        });
                    } else if (chartTitle.includes('SINR')) {
                        values.forEach(v => {
                            if (v >= 20) excellent++;
                            else if (v >= 13) good++;
                            else if (v >= 0) fair++;
                            else poor++;
                        });
                    }
                    
                    const total = values.length;
                    const exPct = (excellent / total * 100).toFixed(0);
                    const gdPct = (good / total * 100).toFixed(0);
                    const frPct = (fair / total * 100).toFixed(0);
                    const prPct = (poor / total * 100).toFixed(0);
                    const goodOrBetter = ((excellent + good) / total * 100).toFixed(0);
                    
                    document.getElementById('qualityExcellent').style.width = exPct + '%';
                    document.getElementById('qualityExcellent').textContent = exPct > 8 ? exPct + '%' : '';
                    document.getElementById('qualityGood').style.width = gdPct + '%';
                    document.getElementById('qualityGood').textContent = gdPct > 8 ? gdPct + '%' : '';
                    document.getElementById('qualityFair').style.width = frPct + '%';
                    document.getElementById('qualityFair').textContent = frPct > 8 ? frPct + '%' : '';
                    document.getElementById('qualityPoor').style.width = prPct + '%';
                    document.getElementById('qualityPoor').textContent = prPct > 8 ? prPct + '%' : '';
                    document.getElementById('qualityText').textContent = `${goodOrBetter}% Good or Better`;
                } else {
                    qualityCard.style.display = 'none';
                }
                
                // Update network status based on technology
                const tech = detectedTechnology || 'LTE';
                let networkStatus = 'OPERATIONAL';
                let networkStatusColor = '#10b981';
                
                if (tech === 'GSM') {
                    networkStatus = '2G GSM Network Active';
                    document.getElementById('signalAlert').textContent = 'RxLev below -100 dBm';
                } else if (tech === 'UMTS') {
                    networkStatus = '3G UMTS Network Active';
                    document.getElementById('signalAlert').textContent = 'RSCP below -100 dBm';
                } else if (tech === 'NR') {
                    networkStatus = '5G NR Network Active';
                    document.getElementById('signalAlert').textContent = 'NR-RSRP below -100 dBm';
                } else {
                    networkStatus = '4G LTE Network Active';
                    document.getElementById('signalAlert').textContent = 'RSRP below -100 dBm';
                }
                
                if (current < -110) {
                    networkStatus = 'DEGRADED - Poor Coverage';
                    networkStatusColor = '#ef4444';
                } else if (current < -100) {
                    networkStatus = 'WARNING - Weak Signal';
                    networkStatusColor = '#f59e0b';
                }
                
                document.getElementById('networkStatus').textContent = networkStatus;
                document.getElementById('networkStatus').style.color = networkStatusColor;
            }
            
            // Create enterprise-styled chart
            const ctx = canvas.getContext('2d');
            const cfg = chartInstance.config;
            const clonedData = JSON.parse(JSON.stringify(cfg.data));
            
            zoomedChart = new Chart(ctx, {
                type: cfg.type,
                data: clonedData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: cfg.options.interaction,
                    plugins: {
                        legend: { 
                            display: true, 
                            position: 'top', 
                            labels: { 
                                color: kpiTheme === 'dark' ? 'var(--text-primary-dark)' : 'var(--text-primary-light)', 
                                font: { family: 'Inter, system-ui, sans-serif', size: 11 } 
                            } 
                        },
                        title: cfg.options.plugins?.title ? { 
                            display: true, 
                            text: cfg.options.plugins.title.text, 
                            color: kpiTheme === 'dark' ? 'var(--text-primary-dark)' : 'var(--text-primary-light)', 
                            font: { family: 'Inter, system-ui, sans-serif', size: 14, weight: '600' } 
                        } : undefined,
                        tooltip: cfg.options.plugins?.tooltip
                    },
                    scales: {
                        x: cfg.options.scales?.x ? { 
                            ...cfg.options.scales.x, 
                            ticks: { 
                                ...cfg.options.scales.x.ticks, 
                                color: kpiTheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary-light)',
                                font: { family: 'Inter, system-ui, sans-serif', size: 10 }
                            }, 
                            grid: { color: kpiTheme === 'dark' ? 'var(--border-dark)' : 'var(--border-light)' },
                            title: cfg.options.scales.x.title ? { 
                                display: true, 
                                text: cfg.options.scales.x.title.text, 
                                color: kpiTheme === 'dark' ? 'var(--text-primary-dark)' : 'var(--text-primary-light)', 
                                font: { family: 'Inter, system-ui, sans-serif', size: 12, weight: '500' } 
                            } : undefined 
                        } : undefined,
                        y: cfg.options.scales?.y ? { 
                            ...cfg.options.scales.y, 
                            ticks: { 
                                ...cfg.options.scales.y.ticks, 
                                color: kpiTheme === 'dark' ? 'var(--text-secondary-dark)' : 'var(--text-secondary-light)',
                                font: { family: 'Inter, system-ui, sans-serif', size: 10 }
                            }, 
                            grid: { color: kpiTheme === 'dark' ? 'var(--border-dark)' : 'var(--border-light)' },
                            title: cfg.options.scales.y.title ? { 
                                display: true, 
                                text: cfg.options.scales.y.title.text, 
                                color: kpiTheme === 'dark' ? 'var(--text-primary-dark)' : 'var(--text-primary-light)', 
                                font: { family: 'Inter, system-ui, sans-serif', size: 12, weight: '500' } 
                            } : undefined 
                        } : undefined
                    }
                }
            });
            
            // Force chart resize after creation
            setTimeout(() => {
                if (zoomedChart) {
                    zoomedChart.resize();
                    zoomedChart.update('none');
                }
            }, 150);
        }

        function closeChartZoom() {
            const modal = document.getElementById('chartZoomModal');
            modal.style.display = 'none';
            if (zoomedChart) {
                zoomedChart.destroy();
                zoomedChart = null;
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

            // Comparison charts and scatter plots
            const compContainers = document.querySelectorAll('#kpiPanel .grid.grid-cols-1 > div');
            compContainers.forEach((container, index) => {
                if (!container.classList.contains('chart-zoomable')) {
                    container.classList.add('chart-zoomable');
                    container.addEventListener('click', function() {
                        let chart = null;
                        let title = '';
                        
                        // Find which canvas is inside this container
                        const canvas = container.querySelector('canvas');
                        if (!canvas) return;
                        
                        const canvasId = canvas.id;
                        
                        // Time-series charts - use technology-aware labels
                        const tech = detectedTechnology || 'LTE';
                        const rsrpLabel = tech === 'NR' ? 'NR-RSRP' : tech === 'UMTS' ? 'RSCP' : tech === 'GSM' ? 'RxLev' : 'RSRP';
                        const rsrqLabel = tech === 'NR' ? 'NR-RSRQ' : tech === 'UMTS' ? 'Ec/No' : tech === 'GSM' ? 'RxQual' : 'RSRQ';
                        const sinrLabel = tech === 'NR' ? 'NR-SINR' : 'SINR';
                        
                        // Match by canvas ID instead of index
                        if (canvasId === 'compRsrpOnly' && compRsrpOnly) { 
                            chart = compRsrpOnly; title = rsrpLabel; currentKpiType = 'rsrp'; 
                        }
                        else if (canvasId === 'compRsrqOnly' && compRsrqOnly) { 
                            chart = compRsrqOnly; title = rsrqLabel; currentKpiType = 'rsrq'; 
                        }
                        else if (canvasId === 'compSinrOnly' && compSinrOnly) { 
                            chart = compSinrOnly; title = sinrLabel; currentKpiType = 'sinr'; 
                        }
                        else if (canvasId === 'compTputOnly' && compTputOnly) { 
                            chart = compTputOnly; title = 'Throughput DL'; currentKpiType = 'throughput_dl_mbps'; 
                        }
                        else if (canvasId === 'compTputUlOnly' && compTputUlOnly) { 
                            chart = compTputUlOnly; title = 'Throughput UL'; currentKpiType = 'throughput_ul_mbps'; 
                        }
                        else if (canvasId === 'compBlerOnly' && compBlerOnly) { 
                            chart = compBlerOnly; title = 'BLER'; currentKpiType = 'bler'; 
                        }
                        else if (canvasId === 'compCqiOnly' && compCqiOnly) { 
                            chart = compCqiOnly; title = 'CQI'; currentKpiType = 'cqi'; 
                        }
                        else if (canvasId === 'compMcsOnly' && compMcsOnly) { 
                            chart = compMcsOnly; title = 'MCS'; currentKpiType = 'mcs'; 
                        }
                        
                        // Scatter plots
                        else if (canvasId === 'scatterTputSinr' && scatterTputSinr) { 
                            chart = scatterTputSinr; 
                            const xLabel = tech === 'UMTS' || tech === 'GSM' ? (tech === 'UMTS' ? 'RSCP' : 'RxLev') : (tech === 'NR' ? 'NR-SINR' : 'SINR');
                            title = `Throughput vs ${xLabel}`; 
                            currentKpiType = tech === 'UMTS' ? 'wcdma_rscp' : (tech === 'GSM' ? 'gsm_rxlev' : 'sinr');
                        }
                        else if (canvasId === 'scatterTputRsrp' && scatterTputRsrp) { 
                            chart = scatterTputRsrp; 
                            title = `Throughput vs ${rsrpLabel}`; 
                            currentKpiType = 'rsrp';
                        }
                        else if (canvasId === 'scatterMcsCqi' && scatterMcsCqi) { 
                            chart = scatterMcsCqi; 
                            title = 'MCS vs CQI'; 
                            currentKpiType = 'cqi'; 
                        }
                        else if (canvasId === 'scatterBlerTput' && scatterBlerTput) { 
                            chart = scatterBlerTput; 
                            title = 'Throughput vs BLER'; 
                            currentKpiType = 'bler'; 
                        }
                        
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
            }
            
            if (parsedData.length > 0) {
                renderKPIChart(currentKpiType);
                renderScatterPlots();
                renderCorrelationScatters();
                if (currentKpiType !== 'all' && currentKpiType !== 'pci') {
                    const values = parsedData.map(d => parseFloat(d[currentKpiType]) || 0);
                    renderKPIHistogram(currentKpiType, values);
                }
                // Re-render mentor charts if modal is open
                try {
                    const modal = document.getElementById('chartZoomModal');
                    if (modal && modal.style.display === 'flex') renderMentorCharts(parsedData, currentKpiType);
                } catch (err) { console.warn('mentor charts update after theme change failed', err); }
            }
        });
    

// =====================================================
// MENTOR-STYLE SPARKLINE RENDERING FOR KPI CARDS
// =====================================================
function renderMentorSparkline(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Set proper canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = 60;
    canvas.height = 24;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get last 20 data points for sparkline
    const sparkData = data.slice(-20);
    if (sparkData.length < 2) return;
    
    // Calculate min/max for scaling
    const min = Math.min(...sparkData);
    const max = Math.max(...sparkData);
    const range = max - min || 1;
    
    // Calculate points with minimal padding
    const padding = 2;
    const chartHeight = height - (padding * 2);
    const chartWidth = width - (padding * 2);
    
    const points = sparkData.map((value, index) => ({
        x: padding + (index / (sparkData.length - 1)) * chartWidth,
        y: padding + chartHeight - ((value - min) / range) * chartHeight
    }));
    
    // Draw mentor-style line (clean, thin, colored)
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Add small end point
    const lastPoint = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 1.5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

// Update modal statistics with mentor-style individual trend percentages
function updateMentorModalStatistics(values, kpiType) {
    if (!values || values.length === 0) return;
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const current = values[values.length - 1];
    
    // Update DOM elements with proper formatting
    document.getElementById('modalCurrent').textContent = current.toFixed(1);
    document.getElementById('modalMin').textContent = min.toFixed(1);
    document.getElementById('modalAvg').textContent = avg.toFixed(1);
    document.getElementById('modalMax').textContent = max.toFixed(1);
    
    // Calculate temporal trends for all cards
    const segmentSize = Math.max(1, Math.floor(values.length * 0.1));
    const recentSegment = values.slice(-segmentSize);
    const previousSegment = values.slice(-segmentSize * 2, -segmentSize);
    
    if (previousSegment.length === 0) {
        // Not enough data for trends, set all to neutral
        updateTrendBadge('modalTrendBadge', 'trendArrow', 'trendPct', 0, null, true);
        updateTrendBadge('modalMinBadge', 'minArrow', 'minPct', 0, null, true);
        updateTrendBadge('modalAvgBadge', 'avgArrow', 'avgPct', 0, null, true);
        updateTrendBadge('modalMaxBadge', 'maxArrow', 'maxPct', 0, null, true);
    } else {
        // Determine if this is a signal metric (RSRP/RSCP/RxLev/RSRQ/etc.)
        const isSignalMetric = kpiType === 'rsrp' || kpiType.includes('rsrp') || 
                               kpiType.includes('rscp') || kpiType.includes('rxlev') ||
                               kpiType.includes('rsrq') || kpiType.includes('ecno') ||
                               kpiType.includes('rxqual') || kpiType.includes('sinr');
        
        // CURRENT trend: recent average vs previous average
        const recentAvg = recentSegment.reduce((a, b) => a + b, 0) / recentSegment.length;
        const previousAvg = previousSegment.reduce((a, b) => a + b, 0) / previousSegment.length;
        const currentAbsChange = recentAvg - previousAvg;
        const currentTrendPercent = previousAvg !== 0 ? (currentAbsChange / Math.abs(previousAvg) * 100) : 0;
        
        // MIN trend: recent minimum vs previous minimum
        const recentMin = Math.min(...recentSegment);
        const previousMin = Math.min(...previousSegment);
        const minAbsChange = recentMin - previousMin;
        const minTrendPercent = previousMin !== 0 ? (minAbsChange / Math.abs(previousMin) * 100) : 0;
        
        // AVG trend: recent average vs previous average (same as current but for clarity)
        const avgAbsChange = currentAbsChange;
        const avgTrendPercent = currentTrendPercent;
        
        // MAX trend: recent maximum vs previous maximum
        const recentMax = Math.max(...recentSegment);
        const previousMax = Math.max(...previousSegment);
        const maxAbsChange = recentMax - previousMax;
        const maxTrendPercent = previousMax !== 0 ? (maxAbsChange / Math.abs(previousMax) * 100) : 0;
        
        // Update all trend badges with absolute changes and signal metric flag
        updateTrendBadge('modalTrendBadge', 'trendArrow', 'trendPct', currentTrendPercent, currentAbsChange, isSignalMetric);
        updateTrendBadge('modalMinBadge', 'minArrow', 'minPct', minTrendPercent, minAbsChange, isSignalMetric);
        updateTrendBadge('modalAvgBadge', 'avgArrow', 'avgPct', avgTrendPercent, avgAbsChange, isSignalMetric);
        updateTrendBadge('modalMaxBadge', 'maxArrow', 'maxPct', maxTrendPercent, maxAbsChange, isSignalMetric);
    }
    
    // Generate rolling statistics for sparklines
    const windowSize = 20;
    const currentSparkline = values.slice(-20); // Last 20 actual values
    
    // Rolling minimum sparkline
    const minSparkline = [];
    for (let i = 0; i < values.length; i++) {
        const window = values.slice(Math.max(0, i - windowSize + 1), i + 1);
        minSparkline.push(Math.min(...window));
    }
    
    // Rolling average sparkline
    const avgSparkline = [];
    for (let i = 0; i < values.length; i++) {
        const window = values.slice(Math.max(0, i - windowSize + 1), i + 1);
        const windowAvg = window.reduce((a, b) => a + b, 0) / window.length;
        avgSparkline.push(windowAvg);
    }
    
    // Rolling maximum sparkline
    const maxSparkline = [];
    for (let i = 0; i < values.length; i++) {
        const window = values.slice(Math.max(0, i - windowSize + 1), i + 1);
        maxSparkline.push(Math.max(...window));
    }
    
    // Define sparkline colors based on card type
    const sparklineColors = {
        current: '#3b82f6',
        min: '#ef4444', 
        avg: '#6b7280',
        max: '#10b981'
    };
    
    // Render mentor-style sparklines with proper data
    renderMentorSparkline('sparklineCurrent', currentSparkline, sparklineColors.current);
    renderMentorSparkline('sparklineMin', minSparkline.slice(-20), sparklineColors.min);
    renderMentorSparkline('sparklineAvg', avgSparkline.slice(-20), sparklineColors.avg);
    renderMentorSparkline('sparklineMax', maxSparkline.slice(-20), sparklineColors.max);
    
    // Update status dots with technology-specific thresholds
    const tech = detectedTechnology || 'LTE';
    if (kpiType === 'rsrp' || kpiType.includes('rsrp') || kpiType.includes('rscp') || kpiType.includes('rxlev')) {
        updateMentorStatusDot('statusDotCurrent', current, tech);
        updateMentorStatusDot('statusDotMin', min, tech);
        updateMentorStatusDot('statusDotAvg', avg, tech);
        updateMentorStatusDot('statusDotMax', max, tech);
    }
}

// Universal function to update trend badges with proper arrows, colors, and quality indicators
function updateTrendBadge(badgeId, arrowId, pctId, percentage, absoluteChange = null, isSignalMetric = false) {
    const badge = document.getElementById(badgeId);
    const arrow = document.getElementById(arrowId);
    const pct = document.getElementById(pctId);
    
    if (!badge || !arrow || !pct) return;
    
    // Remove existing classes
    badge.classList.remove('positive', 'negative', 'neutral');
    
    // Determine quality indicator text for signal metrics
    let qualityText = '';
    if (isSignalMetric && Math.abs(percentage) > 0.5) {
        // For signal metrics (RSRP/RSCP/RxLev), positive change = better signal
        qualityText = percentage > 0 ? ' BETTER' : ' WORSE';
    }
    
    // Set arrow and class based on percentage value
    if (Math.abs(percentage) > 0.5) {
        if (percentage > 0) {
            badge.classList.add('positive');
            arrow.textContent = '↗';
        } else {
            badge.classList.add('negative');
            arrow.textContent = '↘';
        }
    } else {
        badge.classList.add('neutral');
        arrow.textContent = '▬';
        qualityText = ' STABLE';
    }
    
    // Format percentage and absolute change
    let displayText = Math.abs(percentage).toFixed(1) + '%';
    
    // Add absolute change if provided
    if (absoluteChange !== null) {
        const absValue = Math.abs(absoluteChange).toFixed(1);
        const sign = absoluteChange >= 0 ? '+' : '-';
        displayText += ` (${sign}${absValue} dBm)`;
    }
    
    // Add quality indicator
    displayText += qualityText;
    
    pct.textContent = displayText;
}

// Update mentor-style status dot with proper classes and technology-specific thresholds
function updateMentorStatusDot(dotId, value, tech = 'LTE') {
    const dot = document.getElementById(dotId);
    if (!dot) return;
    
    // Remove existing status classes
    dot.classList.remove('excellent', 'good', 'fair', 'poor', 'critical', 'neutral');
    
    // Apply technology-specific thresholds
    if (tech === 'GSM') {
        if (value >= -70) {
            dot.classList.add('excellent');
        } else if (value >= -85) {
            dot.classList.add('good');
        } else if (value >= -95) {
            dot.classList.add('fair');
        } else if (value >= -105) {
            dot.classList.add('poor');
        } else {
            dot.classList.add('critical');
        }
    } else if (tech === 'UMTS') {
        if (value >= -85) {
            dot.classList.add('excellent');
        } else if (value >= -95) {
            dot.classList.add('good');
        } else if (value >= -105) {
            dot.classList.add('fair');
        } else if (value >= -115) {
            dot.classList.add('poor');
        } else {
            dot.classList.add('critical');
        }
    } else { // LTE/NR
        if (value >= -80) {
            dot.classList.add('excellent');
        } else if (value >= -90) {
            dot.classList.add('good');
        } else if (value >= -100) {
            dot.classList.add('fair');
        } else if (value >= -110) {
            dot.classList.add('poor');
        } else {
            dot.classList.add('critical');
        }
    }
}

// Enhanced updateModalStatistics to use mentor-style design
const originalUpdateModalStatistics = updateMentorModalStatistics;
updateModalStatistics = function(values, kpiType) {
    originalUpdateModalStatistics(values, kpiType);
    
    if (!values || values.length === 0) return;
    
    // Add animation classes for smooth updates
    const modalCurrent = document.getElementById('modalCurrent');
    if (modalCurrent) {
        modalCurrent.classList.add('kpi-value-updated');
        setTimeout(() => modalCurrent.classList.remove('kpi-value-updated'), 300);
    }
    
    const trendArrowEl = document.getElementById('trendArrow');
    if (trendArrowEl) {
        trendArrowEl.classList.add('trend-arrow-animated');
        setTimeout(() => trendArrowEl.classList.remove('trend-arrow-animated'), 500);
    }
};
