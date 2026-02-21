
        // =====================================================
        // CONFIGURATION STATE
        // =====================================================
        let editMode = false;
        let csvData = null;
        let parsedData = [];
        let kpiChart = null;
        let compRsrpSinr = null;
        let compCqiMcs = null;
        let compRsrpTput = null;
        let compSinrTput = null;
        let compRsrqRsrp = null;
        let compBlerTput = null;
        let kpiHistogramChart = null;
        let showingKPIs = false;
        let currentChartType = 'line';
        let currentKpiType = 'rsrp';
        let currentViewMode = 'grid';
        let currentMapStyle = 'light'; // Track current map style (light/dark)
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
                        el.textContent = currentConfig[field];
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
            
            // Enable/disable contenteditable
            document.querySelectorAll('.editable-field').forEach(el => {
                el.contentEditable = editMode;
                if (editMode) {
                    el.style.outline = '2px dashed #FF7900';
                    el.style.outlineOffset = '2px';
                    // Handle empty fields - add placeholder if empty
                    if (el.textContent.trim() === '') {
                        el.textContent = 'Click to edit';
                        el.style.color = '#999';
                    }
                } else {
                    el.style.outline = 'none';
                    // Remove placeholder styling
                    if (el.textContent === 'Click to edit') {
                        el.textContent = '';
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
            if (e.target.classList.contains('editable-field') && e.target.textContent === 'Click to edit') {
                e.target.textContent = '';
                e.target.style.color = '';
            }
        });

        document.addEventListener('focusout', function(e) {
            if (e.target.classList.contains('editable-field') && e.target.textContent.trim() === '' && editMode) {
                e.target.textContent = 'Click to edit';
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
                    let content = el.textContent.trim();
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
                const textContent = field.querySelector('.editable-field')?.textContent?.trim();
                if (textContent && textContent !== 'Click to edit') {
                    currentConfig.additionalFields.performance.push(textContent);
                }
            });
            
            // Save impacts additional fields
            document.querySelectorAll('#impactsContainer .border-t').forEach(field => {
                const textContent = field.querySelector('.editable-field')?.textContent?.trim();
                if (textContent && textContent !== 'Click to edit') {
                    currentConfig.additionalFields.impacts.push(textContent);
                }
            });
            
            // Save analysis additional fields
            document.querySelectorAll('#analysisContainer .border-t').forEach(field => {
                const textContent = field.querySelector('.editable-field')?.textContent?.trim();
                if (textContent && textContent !== 'Click to edit') {
                    currentConfig.additionalFields.analysis.push(textContent);
                }
            });
            
            // Save recommendations additional fields
            document.querySelectorAll('#recommendationsContainer .border-t').forEach(field => {
                const textContent = field.querySelector('.editable-field')?.textContent?.trim();
                if (textContent && textContent !== 'Click to edit') {
                    currentConfig.additionalFields.recommendations.push(textContent);
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
                    renderKPIChart('rsrp');
                    renderScatterPlots();
                    renderKPIHistogram('rsrp', parsedData.map(d => parseFloat(d.rsrp) || -100));
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
                document.querySelectorAll('.kpi-tab').forEach(t => {
                    t.classList.remove('active', 'bg-blue-600');
                    t.classList.add('bg-gray-700');
                });
                this.classList.add('active', 'bg-blue-600');
                this.classList.remove('bg-gray-700');
                currentKpiType = this.dataset.kpi;
                renderKPIChart(currentKpiType);
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
            
            const values = parsedData.map(d => parseFloat(d[kpiType]) || 0);

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
                rsrp: { line: '#3b82f6', fill: 'rgba(59, 130, 246, 0.2)' },
                rsrq: { line: '#10b981', fill: 'rgba(16, 185, 129, 0.2)' },
                sinr: { line: '#f59e0b', fill: 'rgba(245, 158, 11, 0.2)' },
                pci: { line: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.2)' },
                cqi: { line: '#ec4899', fill: 'rgba(236, 72, 153, 0.2)' },
                mcs: { line: '#14b8a6', fill: 'rgba(20, 184, 166, 0.2)' },
                bler: { line: '#f97316', fill: 'rgba(249, 115, 22, 0.2)' },
                throughput_dl_mbps: { line: '#22c55e', fill: 'rgba(34, 197, 94, 0.2)' },
                throughput_ul_mbps: { line: '#a855f7', fill: 'rgba(168, 85, 247, 0.2)' }
            };

            const ctx = document.getElementById('kpiChart').getContext('2d');
            
            if (kpiChart) {
                kpiChart.destroy();
            }

            // Create gradient for area chart
            let gradient = null;
            if (currentChartType === 'area') {
                gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, colors[kpiType].line + '80');
                gradient.addColorStop(1, colors[kpiType].line + '10');
            }

            kpiChart = new Chart(ctx, {
                type: currentChartType === 'bar' ? 'bar' : 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: kpiType.toUpperCase(),
                        data: values,
                        borderColor: colors[kpiType].line,
                        backgroundColor: currentChartType === 'area' ? gradient : (currentChartType === 'bar' ? colors[kpiType].line : colors[kpiType].fill),
                        borderWidth: 2,
                        fill: currentChartType === 'area',
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
                            labels: { color: '#fff', font: { family: 'JetBrains Mono' } }
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
                                color: '#9ca3af',
                                maxRotation: 45,
                                minRotation: 45,
                                font: { size: 9, family: 'JetBrains Mono' }
                            },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        },
                        y: {
                            ticks: { 
                                color: '#9ca3af',
                                font: { family: 'JetBrains Mono' }
                            },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        }
                    }
                }
            });
        }

function renderScatterPlots() {
            if (parsedData.length === 0) return;

            const labels = parsedData.map((d, i) => d.time?.split('T')[1]?.slice(0, 8) || `${i+1}`);
            const rsrpVals = parsedData.map(d => parseFloat(d.rsrp) || -100);
            const rsrqVals = parsedData.map(d => parseFloat(d.rsrq) || -10);
            const sinrVals = parsedData.map(d => parseFloat(d.sinr) || 0);
            const cqiVals = parsedData.map(d => parseFloat(d.cqi) || 0);
            const mcsVals = parsedData.map(d => parseFloat(d.mcs) || 0);
            const blerVals = parsedData.map(d => parseFloat(d.bler) || 0);
            const tputDlVals = parsedData.map(d => parseFloat(d.throughput_dl_mbps) || 0);

            // RSRP + SINR
            if (compRsrpSinr) compRsrpSinr.destroy();
            compRsrpSinr = new Chart(document.getElementById('compRsrpSinr'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'RSRP (dBm)', data: rsrpVals, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 2, yAxisID: 'y1', pointRadius: 0, fill: true },
                        { label: 'SINR (dB)', data: sinrVals, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 2, yAxisID: 'y2', pointRadius: 0, fill: true }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { display: true, position: 'top', labels: { color: '#fff', font: { family: 'JetBrains Mono', size: 11 }, usePointStyle: true } },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            titleFont: { family: 'JetBrains Mono', size: 12 },
                            bodyFont: { family: 'JetBrains Mono', size: 11 },
                            padding: 12,
                            borderColor: '#fff',
                            borderWidth: 1,
                            callbacks: {
                                title: function(context) { return context[0].label; },
                                beforeBody: function(context) {
                                    const idx = context[0].dataIndex;
                                    return [
                                        'RSRP: ' + rsrpVals[idx].toFixed(2) + ' dBm',
                                        'SINR: ' + sinrVals[idx].toFixed(2) + ' dB'
                                    ];
                                },
                                label: function() { return null; }
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: '#9ca3af', font: { size: 8 }, maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.1)' } },
                        y1: { type: 'linear', position: 'left', title: { display: true, text: 'RSRP (dBm)', color: '#3b82f6', font: { size: 10 } }, ticks: { color: '#3b82f6', font: { size: 9 } }, grid: { color: 'rgba(59,130,246,0.2)' } },
                        y2: { type: 'linear', position: 'right', title: { display: true, text: 'SINR (dB)', color: '#f59e0b', font: { size: 10 } }, ticks: { color: '#f59e0b', font: { size: 9 } }, grid: { drawOnChartArea: false } }
                    }
                }
            });

            // CQI + MCS
            if (compCqiMcs) compCqiMcs.destroy();
            compCqiMcs = new Chart(document.getElementById('compCqiMcs'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'CQI', data: cqiVals, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 2, yAxisID: 'y1', pointRadius: 0, fill: true },
                        { label: 'MCS', data: mcsVals, borderColor: '#ec4899', backgroundColor: 'rgba(236,72,153,0.1)', borderWidth: 2, yAxisID: 'y2', pointRadius: 0, fill: true }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { display: true, position: 'top', labels: { color: '#fff', font: { family: 'JetBrains Mono', size: 11 }, usePointStyle: true } },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            titleFont: { family: 'JetBrains Mono', size: 12 },
                            bodyFont: { family: 'JetBrains Mono', size: 11 },
                            padding: 12,
                            borderColor: '#fff',
                            borderWidth: 1,
                            callbacks: {
                                title: function(context) { return context[0].label; },
                                beforeBody: function(context) {
                                    const idx = context[0].dataIndex;
                                    return [
                                        'CQI: ' + cqiVals[idx].toFixed(0),
                                        'MCS: ' + mcsVals[idx].toFixed(0)
                                    ];
                                },
                                label: function() { return null; }
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: '#9ca3af', font: { size: 8 }, maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.1)' } },
                        y1: { type: 'linear', position: 'left', title: { display: true, text: 'CQI', color: '#10b981', font: { size: 10 } }, ticks: { color: '#10b981', font: { size: 9 } }, grid: { color: 'rgba(16,185,129,0.2)' } },
                        y2: { type: 'linear', position: 'right', title: { display: true, text: 'MCS', color: '#ec4899', font: { size: 10 } }, ticks: { color: '#ec4899', font: { size: 9 } }, grid: { drawOnChartArea: false } }
                    }
                }
            });

            // RSRP + Throughput DL
            if (compRsrpTput) compRsrpTput.destroy();
            compRsrpTput = new Chart(document.getElementById('compRsrpTput'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'RSRP (dBm)', data: rsrpVals, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 2, yAxisID: 'y1', pointRadius: 0, fill: true },
                        { label: 'DL Throughput (Mbps)', data: tputDlVals, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 2, yAxisID: 'y2', pointRadius: 0, fill: true }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { display: true, position: 'top', labels: { color: '#fff', font: { family: 'JetBrains Mono', size: 11 }, usePointStyle: true } },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            titleFont: { family: 'JetBrains Mono', size: 12 },
                            bodyFont: { family: 'JetBrains Mono', size: 11 },
                            padding: 12,
                            borderColor: '#fff',
                            borderWidth: 1,
                            callbacks: {
                                title: function(context) { return context[0].label; },
                                beforeBody: function(context) {
                                    const idx = context[0].dataIndex;
                                    return [
                                        'RSRP: ' + rsrpVals[idx].toFixed(2) + ' dBm',
                                        'DL Throughput: ' + tputDlVals[idx].toFixed(2) + ' Mbps'
                                    ];
                                },
                                label: function() { return null; }
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: '#9ca3af', font: { size: 8 }, maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.1)' } },
                        y1: { type: 'linear', position: 'left', title: { display: true, text: 'RSRP (dBm)', color: '#3b82f6', font: { size: 10 } }, ticks: { color: '#3b82f6', font: { size: 9 } }, grid: { color: 'rgba(59,130,246,0.2)' } },
                        y2: { type: 'linear', position: 'right', title: { display: true, text: 'DL Mbps', color: '#22c55e', font: { size: 10 } }, ticks: { color: '#22c55e', font: { size: 9 } }, grid: { drawOnChartArea: false } }
                    }
                }
            });

            // SINR + Throughput DL
            if (compSinrTput) compSinrTput.destroy();
            compSinrTput = new Chart(document.getElementById('compSinrTput'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'SINR (dB)', data: sinrVals, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 2, yAxisID: 'y1', pointRadius: 0, fill: true },
                        { label: 'DL Throughput (Mbps)', data: tputDlVals, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 2, yAxisID: 'y2', pointRadius: 0, fill: true }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { display: true, position: 'top', labels: { color: '#fff', font: { family: 'JetBrains Mono', size: 11 }, usePointStyle: true } },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            titleFont: { family: 'JetBrains Mono', size: 12 },
                            bodyFont: { family: 'JetBrains Mono', size: 11 },
                            padding: 12,
                            borderColor: '#fff',
                            borderWidth: 1,
                            callbacks: {
                                title: function(context) { return context[0].label; },
                                beforeBody: function(context) {
                                    const idx = context[0].dataIndex;
                                    return [
                                        'SINR: ' + sinrVals[idx].toFixed(2) + ' dB',
                                        'DL Throughput: ' + tputDlVals[idx].toFixed(2) + ' Mbps'
                                    ];
                                },
                                label: function() { return null; }
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: '#9ca3af', font: { size: 8 }, maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.1)' } },
                        y1: { type: 'linear', position: 'left', title: { display: true, text: 'SINR (dB)', color: '#f59e0b', font: { size: 10 } }, ticks: { color: '#f59e0b', font: { size: 9 } }, grid: { color: 'rgba(245,158,11,0.2)' } },
                        y2: { type: 'linear', position: 'right', title: { display: true, text: 'DL Mbps', color: '#22c55e', font: { size: 10 } }, ticks: { color: '#22c55e', font: { size: 9 } }, grid: { drawOnChartArea: false } }
                    }
                }
            });

            // RSRQ + RSRP
            if (compRsrqRsrp) compRsrqRsrp.destroy();
            compRsrqRsrp = new Chart(document.getElementById('compRsrqRsrp'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'RSRQ (dB)', data: rsrqVals, borderColor: '#14b8a6', backgroundColor: 'rgba(20,184,166,0.1)', borderWidth: 2, yAxisID: 'y1', pointRadius: 0, fill: true },
                        { label: 'RSRP (dBm)', data: rsrpVals, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 2, yAxisID: 'y2', pointRadius: 0, fill: true }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { display: true, position: 'top', labels: { color: '#fff', font: { family: 'JetBrains Mono', size: 11 }, usePointStyle: true } },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            titleFont: { family: 'JetBrains Mono', size: 12 },
                            bodyFont: { family: 'JetBrains Mono', size: 11 },
                            padding: 12,
                            borderColor: '#fff',
                            borderWidth: 1,
                            callbacks: {
                                title: function(context) { return context[0].label; },
                                beforeBody: function(context) {
                                    const idx = context[0].dataIndex;
                                    return [
                                        'RSRQ: ' + rsrqVals[idx].toFixed(2) + ' dB',
                                        'RSRP: ' + rsrpVals[idx].toFixed(2) + ' dBm'
                                    ];
                                },
                                label: function() { return null; }
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: '#9ca3af', font: { size: 8 }, maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.1)' } },
                        y1: { type: 'linear', position: 'left', title: { display: true, text: 'RSRQ (dB)', color: '#14b8a6', font: { size: 10 } }, ticks: { color: '#14b8a6', font: { size: 9 } }, grid: { color: 'rgba(20,184,166,0.2)' } },
                        y2: { type: 'linear', position: 'right', title: { display: true, text: 'RSRP (dBm)', color: '#3b82f6', font: { size: 10 } }, ticks: { color: '#3b82f6', font: { size: 9 } }, grid: { drawOnChartArea: false } }
                    }
                }
            });

            // BLER + Throughput DL
            if (compBlerTput) compBlerTput.destroy();
            compBlerTput = new Chart(document.getElementById('compBlerTput'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'DL Throughput (Mbps)', data: tputDlVals, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 2, yAxisID: 'y1', pointRadius: 0, fill: true },
                        { label: 'BLER (%)', data: blerVals, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 2, yAxisID: 'y2', pointRadius: 0, fill: true }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        legend: { display: true, position: 'top', labels: { color: '#fff', font: { family: 'JetBrains Mono', size: 11 }, usePointStyle: true } },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            titleFont: { family: 'JetBrains Mono', size: 12 },
                            bodyFont: { family: 'JetBrains Mono', size: 11 },
                            padding: 12,
                            borderColor: '#fff',
                            borderWidth: 1,
                            callbacks: {
                                title: function(context) { return context[0].label; },
                                beforeBody: function(context) {
                                    const idx = context[0].dataIndex;
                                    return [
                                        'DL Throughput: ' + tputDlVals[idx].toFixed(2) + ' Mbps',
                                        'BLER: ' + blerVals[idx].toFixed(2) + ' %'
                                    ];
                                },
                                label: function() { return null; }
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: '#9ca3af', font: { size: 8 }, maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.1)' } },
                        y1: { type: 'linear', position: 'left', title: { display: true, text: 'DL Mbps', color: '#22c55e', font: { size: 10 } }, ticks: { color: '#22c55e', font: { size: 9 } }, grid: { color: 'rgba(34,197,94,0.2)' } },
                        y2: { type: 'linear', position: 'right', title: { display: true, text: 'BLER (%)', color: '#ef4444', font: { size: 10 } }, ticks: { color: '#ef4444', font: { size: 9 } }, grid: { drawOnChartArea: false } }
                    }
                }
            });
        }

        function renderKPIHistogram(kpiType, values) {
            if (values.length === 0) return;

            const kpiLabels = { rsrp: 'RSRP (dBm)', rsrq: 'RSRQ (dB)', sinr: 'SINR (dB)', cqi: 'CQI', mcs: 'MCS', bler: 'BLER (%)', throughput_dl_mbps: 'DL Throughput (Mbps)', throughput_ul_mbps: 'UL Throughput (Mbps)' };
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

            kpiHistogramChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: binData.map(d => d.bin),
                    datasets: [{ label: 'Sample Count', data: binData.map(d => d.count), backgroundColor: kpiColors[kpiType] || '#3b82f6', borderColor: '#fff', borderWidth: 1 }]
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
                        x: { ticks: { color: '#9ca3af', font: { size: 9, family: 'JetBrains Mono' }, maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.1)' }, title: { display: true, text: kpiLabels[kpiType] || kpiType.toUpperCase(), color: '#fff', font: { family: 'JetBrains Mono' } } },
                        y: { ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono' } }, grid: { color: 'rgba(255,255,255,0.1)' }, title: { display: true, text: 'Count', color: '#fff', font: { family: 'JetBrains Mono' } } }
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
                    el.textContent = currentConfig[field];
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
            return lines.slice(1).map(line => {
                const values = line.split(',');
                const obj = {};
                headers.forEach((h, i) => {
                    const val = values[i]?.trim();
                    if (h === 'rsrp' || h === 'rsrq' || h === 'sinr') {
                        obj[h] = val && val !== '' ? val : '0';
                    } else {
                        obj[h] = val;
                    }
                });
                return obj;
            });
        }

        function getColor(rsrp) {
            if (rsrp >= -80) return '#22c55e';
            if (rsrp >= -90) return '#3b82f6';
            if (rsrp >= -100) return '#f59e0b';
            if (rsrp >= -110) return '#f97316';
            return '#ef4444';
        }

        function renderMap(csvText) {
            clearMap();
            const data = parseCSV(csvText);
            parsedData = data; // Store for KPI visualization
            const coords = [];

            data.forEach((row, idx) => {
                const lat = parseFloat(row.latitude);
                const lon = parseFloat(row.longitude);
                if (!isNaN(lat) && !isNaN(lon)) {
                    const rsrp = parseFloat(row.rsrp) || -100;
                    coords.push({ lat, lon, rsrp, color: getColor(rsrp), row, idx });
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
                    const popup = new maplibregl.Popup({ offset: 10 }).setHTML(`
                        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;">
                            <div style="font-weight:800;color:${p.color};margin-bottom:8px;border-bottom:2px solid ${p.color};padding-bottom:4px;">📍 Point #${row['#'] || i + 1}</div>
                            <div style="margin:4px 0;"><b>Time:</b> ${row.time?.split('T')[1]?.slice(0, 8) || '-'}</div>
                            <div style="margin:4px 0;"><b>RSRP:</b> <span style="color:${p.color};font-weight:bold;">${row.rsrp || '-'} dBm</span></div>
                            <div style="margin:4px 0;"><b>RSRQ:</b> ${row.rsrq || '-'} dB</div>
                            <div style="margin:4px 0;"><b>SINR:</b> ${row.sinr || '-'} dB</div>
                            <div style="margin:4px 0;"><b>PCI:</b> ${row.pci || '-'}</div>
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

                const popup = new maplibregl.Popup({ offset: 15 }).setHTML(`
                    <div style="font-family:'JetBrains Mono',monospace;font-size:11px;">
                        <div style="font-weight:800;color:${evt.color};margin-bottom:8px;border-bottom:2px solid ${evt.color};padding-bottom:4px;">${evt.icon} ${evt.label}</div>
                        <div style="margin:4px 0;"><b>Time:</b> ${row.time?.split('T')[1]?.slice(0, 8) || '-'}</div>
                        <div style="margin:4px 0;"><b>RSRP:</b> <span style="color:${p.color};font-weight:bold;">${row.rsrp || '-'} dBm</span></div>
                        <div style="margin:4px 0;"><b>RSRQ:</b> ${row.rsrq || '-'} dB</div>
                        <div style="margin:4px 0;"><b>SINR:</b> ${row.sinr || '-'} dB</div>
                        <div style="margin:4px 0;"><b>PCI:</b> ${row.pci || '-'}</div>
                        <div style="margin:4px 0;"><b>Band:</b> ${row.band || '-'}</div>
                    </div>
                `);
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
                
                document.getElementById('shareUrl').value = 'Generating short URL...';
                document.getElementById('shareModal').style.display = 'flex';

                // Shorten URL using TinyURL API
                fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(shareUrl)}`)
                    .then(response => response.text())
                    .then(shortUrl => {
                        document.getElementById('shareUrl').value = shortUrl;
                    })
                    .catch(error => {
                        console.error('URL shortening failed:', error);
                        document.getElementById('shareUrl').value = shareUrl;
                    });
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

        function openChartZoom(chartTitle, chartConfig) {
            const modal = document.getElementById('chartZoomModal');
            const canvas = document.getElementById('chartZoomCanvas');
            const title = document.getElementById('chartZoomTitle');
            
            title.textContent = chartTitle;
            modal.style.display = 'flex';
            
            // Destroy existing chart if any
            if (zoomedChart) {
                zoomedChart.destroy();
            }
            
            // Create new chart with provided config
            const ctx = canvas.getContext('2d');
            zoomedChart = new Chart(ctx, chartConfig);
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
            // Main KPI Chart
            const mainChartContainer = document.querySelector('#kpiPanel .border-4.border-white.bg-gray-800.p-4[style*="height: 300px"]');
            if (mainChartContainer && !mainChartContainer.classList.contains('chart-zoomable')) {
                mainChartContainer.classList.add('chart-zoomable');
                mainChartContainer.addEventListener('click', function() {
                    if (kpiChart) {
                        openChartZoom(`📊 ${currentKpiType.toUpperCase()} Chart`, kpiChart.config);
                    }
                });
            }

            // Histogram
            const histogramContainer = document.getElementById('kpiHistogramContainer');
            if (histogramContainer && !histogramContainer.classList.contains('chart-zoomable')) {
                histogramContainer.classList.add('chart-zoomable');
                histogramContainer.addEventListener('click', function() {
                    if (kpiHistogramChart) {
                        openChartZoom(`📊 ${currentKpiType.toUpperCase()} Distribution Histogram`, kpiHistogramChart.config);
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
                        if (index === 0 && compRsrpSinr) { chart = compRsrpSinr; title = 'RSRP + SINR'; }
                        else if (index === 1 && compCqiMcs) { chart = compCqiMcs; title = 'CQI + MCS'; }
                        else if (index === 2 && compRsrpTput) { chart = compRsrpTput; title = 'RSRP + Throughput DL'; }
                        else if (index === 3 && compSinrTput) { chart = compSinrTput; title = 'SINR + Throughput DL'; }
                        else if (index === 4 && compRsrqRsrp) { chart = compRsrqRsrp; title = 'RSRQ + RSRP'; }
                        else if (index === 5 && compBlerTput) { chart = compBlerTput; title = 'Throughput DL + BLER'; }
                        
                        if (chart) {
                            openChartZoom(`📊 ${title}`, chart.config);
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
    
