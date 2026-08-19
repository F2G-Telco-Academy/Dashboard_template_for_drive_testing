
        // =====================================================
        // TIMESTAMP UTILITY FUNCTIONS
        // =====================================================
        
        /**
         * Extract full timestamp with microseconds from data point
         * Preserves microsecond precision from ECA CSV files
         * @param {Object} dataPoint - Parsed CSV row with time field
         * @returns {string} - Full timestamp (HH:MM:SS.microseconds)
         */
        function getFullTimestamp(dataPoint) {
            if (!dataPoint || !dataPoint.time) return '-';
            
            // Handle ISO format: YYYY-MM-DDTHH:MM:SS.microseconds
            if (dataPoint.time.includes('T')) {
                return dataPoint.time.split('T')[1] || dataPoint.time;
            }
            
            // Handle direct time format: HH:MM:SS.microseconds
            return dataPoint.time;
        }

        /**
         * Extract shortened timestamp for axis labels (HH:MM:SS only)
         * Used for x-axis readability while preserving full precision in tooltips
         * @param {Object} dataPoint - Parsed CSV row with time field
         * @returns {string} - Shortened timestamp (HH:MM:SS)
         */
        function getShortTimestamp(dataPoint) {
            const fullTime = getFullTimestamp(dataPoint);
            // Keep only HH:MM:SS for axis readability
            return fullTime.slice(0, 8);
        }

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
        let scatterTputRsrq = null;
        let scatterMcsCqi = null;
        let scatterBlerTput = null;
        let kpiHistogramChart = null;
        let zoomedChart = null; // Zoom modal chart instance
        let polynomialDegree = 2; // Default: Quadratic (degree 2)
        let mentorChart1 = null;
        let mentorChart2 = null;
        let mentorChart3 = null;
        let showingKPIs = false;
        let currentChartType = 'line';
        let currentKpiType = 'rsrp';
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

        // =====================================================
        // CHART VISIBILITY STATE
        // =====================================================
        let chartVisibility = {
            'rsrp': true,
            'rsrq': true,
            'sinr': true,
            'dl-throughput': true,
            'ul-throughput': true,
            'bler': true,
            'cqi': true,
            'mcs': true,
            'txpower': true,
            'scatter-tput-sinr': true,
            'scatter-tput-rsrp': true,
            'scatter-tput-rsrq': true,
            'scatter-mcs-cqi': true,
            'scatter-bler-tput': true
        };

        // Load chart visibility from localStorage
        function loadChartVisibility() {
            const saved = localStorage.getItem('chartVisibility');
            if (saved) {
                try {
                    chartVisibility = JSON.parse(saved);
                    console.log('Loaded chart visibility from localStorage:', chartVisibility);
                } catch (e) {
                    console.error('Failed to load chart visibility:', e);
                }
            }
        }

        // Save chart visibility to localStorage
        function saveChartVisibility() {
            localStorage.setItem('chartVisibility', JSON.stringify(chartVisibility));
        }

        // Apply chart visibility to DOM
        function applyChartVisibility() {
            console.log('Applying chart visibility:', chartVisibility);
            
            // Always ensure sections and histogram are visible
            const kpiComparisonSection = document.getElementById('kpiComparisonSection');
            const correlationSection = document.getElementById('correlationSection');
            const histogramContainer = document.getElementById('kpiHistogramContainer');
            
            if (kpiComparisonSection) {
                kpiComparisonSection.style.display = '';
                kpiComparisonSection.classList.remove('hidden');
            }
            if (correlationSection) {
                correlationSection.style.display = '';
                correlationSection.classList.remove('hidden');
            }
            // Histogram visibility is controlled by renderKPIChart function, not by user
            // Just ensure it's not affected by our visibility system
            
            Object.keys(chartVisibility).forEach(chartId => {
                const isVisible = chartVisibility[chartId];
                const chartElement = document.getElementById(`chart-${chartId}`);
                
                console.log(`Chart ${chartId}: visible=${isVisible}, element found=${!!chartElement}`);
                
                if (chartElement) {
                    if (isVisible) {
                        chartElement.style.display = '';
                        chartElement.classList.remove('hidden');
                    } else {
                        chartElement.style.display = 'none';
                        chartElement.classList.add('hidden');
                    }
                }

                // Update toggle button text
                const toggleBtn = document.querySelector(`.chart-toggle-btn[data-chart-id="${chartId}"]`);
                if (toggleBtn) {
                    toggleBtn.innerHTML = '✕';
                    toggleBtn.title = isVisible ? 'Hide this chart' : 'Show this chart';
                }

                // Update checkbox in customize panel
                const checkbox = document.querySelector(`.chart-visibility-checkbox[data-chart-id="${chartId}"]`);
                if (checkbox) {
                    checkbox.checked = isVisible;
                }
            });

            updateChartCount();
        }

        // Update chart count display
        function updateChartCount() {
            // Only count enabled (non-disabled) checkboxes
            const checkboxes = document.querySelectorAll('.chart-visibility-checkbox:not([disabled])');
            const total = checkboxes.length;
            const visible = Array.from(checkboxes).filter(cb => cb.checked).length;
            
            const visibleCountEl = document.getElementById('visibleChartCount');
            const totalCountEl = document.getElementById('totalChartCount');
            
            if (visibleCountEl) visibleCountEl.textContent = visible;
            if (totalCountEl) totalCountEl.textContent = total;
        }

        // Toggle individual chart visibility
        function toggleChartVisibility(chartId) {
            chartVisibility[chartId] = !chartVisibility[chartId];
            saveChartVisibility();
            applyChartVisibility();
            
            // Re-render correlation scatter plots if toggling a scatter plot chart
            if (chartId.startsWith('scatter-') && parsedData.length > 0) {
                renderCorrelationScatters();
            }
        }

        // Initialize chart visibility controls
        function initializeChartVisibilityControls() {
            // Apply initial visibility
            applyChartVisibility();

            // Customize Charts button
            const customizeBtn = document.getElementById('customizeChartsBtn');
            const customizePanel = document.getElementById('customizePanel');
            const closePanelBtn = document.getElementById('closePanelBtn');
            const applyChartsBtn = document.getElementById('applyChartsBtn');
            const selectAllBtn = document.getElementById('selectAllChartsBtn');
            const deselectAllBtn = document.getElementById('deselectAllChartsBtn');
            const resetChartsBtn = document.getElementById('resetChartsBtn');

            // Open customize panel
            if (customizeBtn) {
                customizeBtn.addEventListener('click', () => {
                    customizePanel.classList.remove('hidden');
                    
                    // Apply current theme to customize panel
                    applyThemeToCustomizePanel();
                    
                    // Update panel labels based on current technology
                    updateCustomizePanelForTechnology();
                    // Sync checkboxes with current state
                    document.querySelectorAll('.chart-visibility-checkbox').forEach(checkbox => {
                        const chartId = checkbox.dataset.chartId;
                        checkbox.checked = chartVisibility[chartId] !== false;
                    });
                    updateChartCount();
                });
            }

            // Close panel
            if (closePanelBtn) {
                closePanelBtn.addEventListener('click', () => {
                    customizePanel.classList.add('hidden');
                });
            }

            // Close panel when clicking outside
            if (customizePanel) {
                customizePanel.addEventListener('click', (e) => {
                    if (e.target === customizePanel) {
                        customizePanel.classList.add('hidden');
                    }
                });
            }

            // Apply changes
            if (applyChartsBtn) {
                applyChartsBtn.addEventListener('click', () => {
                    // Update visibility from checkboxes
                    document.querySelectorAll('.chart-visibility-checkbox').forEach(checkbox => {
                        const chartId = checkbox.dataset.chartId;
                        chartVisibility[chartId] = checkbox.checked;
                    });
                    saveChartVisibility();
                    applyChartVisibility();
                    
                    // Re-render correlation scatter plots to reflect visibility changes
                    if (parsedData.length > 0) {
                        renderCorrelationScatters();
                    }
                    
                    customizePanel.classList.add('hidden');
                });
            }

            // Select all
            if (selectAllBtn) {
                selectAllBtn.addEventListener('click', () => {
                    document.querySelectorAll('.chart-visibility-checkbox').forEach(checkbox => {
                        // Only check if not disabled
                        if (!checkbox.disabled) {
                            checkbox.checked = true;
                        }
                    });
                    updateChartCount();
                });
            }

            // Deselect all
            if (deselectAllBtn) {
                deselectAllBtn.addEventListener('click', () => {
                    document.querySelectorAll('.chart-visibility-checkbox').forEach(checkbox => {
                        checkbox.checked = false;
                    });
                    updateChartCount();
                });
            }

            // Reset to default
            if (resetChartsBtn) {
                resetChartsBtn.addEventListener('click', () => {
                    document.querySelectorAll('.chart-visibility-checkbox').forEach(checkbox => {
                        // Only check if not disabled
                        if (!checkbox.disabled) {
                            checkbox.checked = true;
                        }
                    });
                    updateChartCount();
                });
            }

            // Update count when checkboxes change
            document.querySelectorAll('.chart-visibility-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', updateChartCount);
            });

            // Individual chart toggle buttons
            document.querySelectorAll('.chart-toggle-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const chartId = btn.dataset.chartId;
                    toggleChartVisibility(chartId);
                });
            });
        }

        // Update customize panel labels based on detected technology
        function updateCustomizePanelForTechnology() {
            const tech = detectedTechnology || 'LTE';
            
            // Get all checkbox labels
            const checkboxes = document.querySelectorAll('.chart-visibility-checkbox');
            
            checkboxes.forEach(checkbox => {
                const chartId = checkbox.dataset.chartId;
                const label = checkbox.parentElement.querySelector('.text-sm.font-mono');
                
                if (!label) return;
                
                // Update labels and disable unavailable charts based on technology
                switch(chartId) {
                    case 'rsrp':
                        if (tech === 'UMTS') {
                            label.textContent = 'RSCP (dBm)';
                        } else if (tech === 'GSM') {
                            label.textContent = 'RxLev (dBm)';
                        } else if (tech === 'NR') {
                            label.textContent = 'NR-RSRP (dBm)';
                        } else {
                            label.textContent = 'RSRP (dBm)';
                        }
                        checkbox.disabled = false;
                        checkbox.parentElement.style.opacity = '1';
                        break;
                        
                    case 'rsrq':
                        if (tech === 'UMTS') {
                            label.textContent = 'Ec/No (dB)';
                        } else if (tech === 'GSM') {
                            label.textContent = 'RxQual';
                        } else if (tech === 'NR') {
                            label.textContent = 'NR-RSRQ (dB)';
                        } else {
                            label.textContent = 'RSRQ (dB)';
                        }
                        checkbox.disabled = false;
                        checkbox.parentElement.style.opacity = '1';
                        break;
                        
                    case 'sinr':
                        if (tech === 'UMTS' || tech === 'GSM') {
                            label.textContent = 'SINR (dB) - Not available for ' + tech;
                            checkbox.disabled = true;
                            checkbox.checked = false;
                            checkbox.parentElement.style.opacity = '0.5';
                        } else if (tech === 'NR') {
                            label.textContent = 'NR-SINR (dB)';
                            checkbox.disabled = false;
                            checkbox.parentElement.style.opacity = '1';
                        } else {
                            label.textContent = 'SINR (dB)';
                            checkbox.disabled = false;
                            checkbox.parentElement.style.opacity = '1';
                        }
                        break;
                        
                    case 'bler':
                        if (tech === 'UMTS' || tech === 'GSM') {
                            label.textContent = 'BLER (%) - Not available for ' + tech;
                            checkbox.disabled = true;
                            checkbox.checked = false;
                            checkbox.parentElement.style.opacity = '0.5';
                        } else {
                            label.textContent = 'BLER (%)';
                            checkbox.disabled = false;
                            checkbox.parentElement.style.opacity = '1';
                        }
                        break;
                        
                    case 'cqi':
                        if (tech === 'UMTS' || tech === 'GSM') {
                            label.textContent = 'CQI - Not available for ' + tech;
                            checkbox.disabled = true;
                            checkbox.checked = false;
                            checkbox.parentElement.style.opacity = '0.5';
                        } else {
                            label.textContent = 'CQI';
                            checkbox.disabled = false;
                            checkbox.parentElement.style.opacity = '1';
                        }
                        break;
                        
                    case 'mcs':
                        if (tech === 'UMTS' || tech === 'GSM') {
                            label.textContent = 'MCS - Not available for ' + tech;
                            checkbox.disabled = true;
                            checkbox.checked = false;
                            checkbox.parentElement.style.opacity = '0.5';
                        } else {
                            label.textContent = 'MCS';
                            checkbox.disabled = false;
                            checkbox.parentElement.style.opacity = '1';
                        }
                        break;
                        
                    case 'scatter-mcs-cqi':
                        if (tech === 'UMTS' || tech === 'GSM') {
                            label.textContent = 'MCS vs CQI - Not available for ' + tech;
                            checkbox.disabled = true;
                            checkbox.checked = false;
                            checkbox.parentElement.style.opacity = '0.5';
                        } else {
                            label.textContent = 'MCS vs CQI';
                            checkbox.disabled = false;
                            checkbox.parentElement.style.opacity = '1';
                        }
                        break;
                        
                    case 'scatter-bler-tput':
                        if (tech === 'UMTS' || tech === 'GSM') {
                            label.textContent = 'DL Throughput vs BLER - Not available for ' + tech;
                            checkbox.disabled = true;
                            checkbox.checked = false;
                            checkbox.parentElement.style.opacity = '0.5';
                        } else {
                            label.textContent = 'DL Throughput vs BLER';
                            checkbox.disabled = false;
                            checkbox.parentElement.style.opacity = '1';
                        }
                        break;
                        
                    case 'scatter-tput-sinr':
                        if (tech === 'UMTS' || tech === 'GSM') {
                            label.textContent = 'DL Throughput vs SINR - Not available for ' + tech;
                            checkbox.disabled = true;
                            checkbox.checked = false;
                            checkbox.parentElement.style.opacity = '0.5';
                        } else if (tech === 'NR') {
                            label.textContent = 'DL Throughput vs NR-SINR';
                            checkbox.disabled = false;
                            checkbox.parentElement.style.opacity = '1';
                        } else {
                            label.textContent = 'DL Throughput vs SINR';
                            checkbox.disabled = false;
                            checkbox.parentElement.style.opacity = '1';
                        }
                        break;
                        
                    case 'scatter-tput-rsrp':
                        if (tech === 'UMTS') {
                            label.textContent = 'DL Throughput vs RSCP';
                        } else if (tech === 'GSM') {
                            label.textContent = 'DL Throughput vs RxLev';
                        } else if (tech === 'NR') {
                            label.textContent = 'DL Throughput vs NR-RSRP';
                        } else {
                            label.textContent = 'DL Throughput vs RSRP';
                        }
                        checkbox.disabled = false;
                        checkbox.parentElement.style.opacity = '1';
                        break;
                        
                    case 'scatter-tput-rsrq':
                        if (tech === 'UMTS') {
                            label.textContent = 'DL Throughput vs Ec/No';
                        } else if (tech === 'GSM') {
                            label.textContent = 'DL Throughput vs RxQual';
                        } else if (tech === 'NR') {
                            label.textContent = 'DL Throughput vs NR-RSRQ';
                        } else {
                            label.textContent = 'DL Throughput vs RSRQ';
                        }
                        checkbox.disabled = false;
                        checkbox.parentElement.style.opacity = '1';
                        break;
                }
            });
        }

        // Apply current theme to customize panel
        function applyThemeToCustomizePanel() {
            const panel = document.querySelector('#customizePanel > div');
            const header = panel?.querySelector('.bg-gray-900');
            const content = panel?.querySelector('.p-6');
            const footer = panel?.querySelector('.bg-gray-100');
            const infoBox = panel?.querySelector('.bg-blue-50');
            const infoBoxText = infoBox?.querySelectorAll('span');
            const sectionHeaders = panel?.querySelectorAll('.text-gray-900.mb-3');
            const checkboxLabels = panel?.querySelectorAll('label');
            
            if (kpiTheme === 'dark') {
                // Dark mode
                if (panel) {
                    panel.classList.remove('bg-white');
                    panel.classList.add('bg-gray-800');
                }
                if (header) {
                    // Header stays dark (already bg-gray-900)
                }
                if (content) {
                    content.classList.remove('bg-white');
                    content.classList.add('bg-gray-800');
                }
                if (footer) {
                    footer.classList.remove('bg-gray-100');
                    footer.classList.add('bg-gray-700');
                }
                if (infoBox) {
                    infoBox.classList.remove('bg-blue-50', 'border-blue-300', 'text-sm');
                    infoBox.classList.add('bg-blue-900', 'border-blue-600', 'text-sm', 'text-white');
                }
                // Make info box text white in dark mode
                infoBoxText?.forEach(span => {
                    span.classList.add('text-white');
                });
                sectionHeaders?.forEach(h => {
                    h.classList.remove('text-gray-900', 'border-gray-300');
                    h.classList.add('text-white', 'border-gray-600');
                });
                checkboxLabels?.forEach(label => {
                    label.classList.remove('hover:bg-gray-50', 'border-gray-200');
                    label.classList.add('hover:bg-gray-700', 'border-gray-600');
                    const span = label.querySelector('span');
                    if (span) {
                        span.classList.remove('text-gray-900');
                        span.classList.add('text-gray-200');
                    }
                });
            } else {
                // Light mode
                if (panel) {
                    panel.classList.remove('bg-gray-800');
                    panel.classList.add('bg-white');
                }
                if (content) {
                    content.classList.remove('bg-gray-800');
                    content.classList.add('bg-white');
                }
                if (footer) {
                    footer.classList.remove('bg-gray-700');
                    footer.classList.add('bg-gray-100');
                }
                if (infoBox) {
                    infoBox.classList.remove('bg-blue-900', 'border-blue-600', 'text-white');
                    infoBox.classList.add('bg-blue-50', 'border-blue-300');
                }
                // Remove white text class in light mode
                infoBoxText?.forEach(span => {
                    span.classList.remove('text-white');
                });
                sectionHeaders?.forEach(h => {
                    h.classList.remove('text-white', 'border-gray-600');
                    h.classList.add('text-gray-900', 'border-gray-300');
                });
                checkboxLabels?.forEach(label => {
                    label.classList.remove('hover:bg-gray-700', 'border-gray-600');
                    label.classList.add('hover:bg-gray-50', 'border-gray-200');
                    const span = label.querySelector('span');
                    if (span) {
                        span.classList.remove('text-gray-200');
                        span.classList.add('text-gray-900');
                    }
                });
            }
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
                    if (scatterTputRsrq) { scatterTputRsrq.destroy(); scatterTputRsrq = null; }
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
                        'scatterTputSinr', 'scatterTputRsrp', 'scatterTputRsrq', 'scatterMcsCqi', 'scatterBlerTput'
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
                    document.querySelectorAll('#kpiPanel .kpi-tab, #kpiPanel .chart-type-btn').forEach(el => {
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
                    document.querySelectorAll('#kpiPanel .kpi-tab, #kpiPanel .chart-type-btn').forEach(el => {
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
                const inactiveBg = kpiTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200';
                document.querySelectorAll('.chart-type-btn').forEach(b => {
                    b.classList.remove('active', 'bg-blue-600', 'bg-gray-700', 'bg-gray-200');
                    b.classList.add(inactiveBg);
                });
                this.classList.add('active', 'bg-blue-600');
                this.classList.remove('bg-gray-700', 'bg-gray-200');
                currentChartType = this.dataset.type;
                renderKPIChart(currentKpiType);
                // Update mentor charts when chart type changes and modal is open
                try {
                    const modal = document.getElementById('chartZoomModal');
                    if (modal && modal.style.display === 'flex') renderMentorCharts(parsedData, currentKpiType);
                } catch (err) { console.warn('mentor charts update after chart type change failed', err); }
            });
        });

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

            const labels = parsedData.map((d, i) => getShortTimestamp(d) || `Point ${i+1}`);
            
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
                    `<div>${getFullTimestamp(e)} ${e.event.toUpperCase()}</div>`
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

            // Helper function to get quality indicator for KPIs (technology-aware)
            function getKpiQuality(kpiType, value, technology) {
                const val = parseFloat(value);
                if (isNaN(val)) return null;
                
                const tech = technology || dominantTech || 'LTE';
                
                switch(kpiType) {
                    case 'rsrp':
                        // Technology-specific thresholds for RSRP/RSCP/RxLev
                        if (tech === 'UMTS') {
                            // RSCP thresholds (UMTS)
                            if (val >= -70) return { text: 'Excellent', emoji: '🟢' };
                            if (val >= -85) return { text: 'Good', emoji: '🔵' };
                            if (val >= -95) return { text: 'Fair', emoji: '🟡' };
                            return { text: 'Poor', emoji: '🔴' };
                        } else if (tech === 'GSM') {
                            // RxLev thresholds (GSM)
                            if (val >= -70) return { text: 'Excellent', emoji: '🟢' };
                            if (val >= -85) return { text: 'Good', emoji: '🔵' };
                            if (val >= -95) return { text: 'Fair', emoji: '🟡' };
                            return { text: 'Poor', emoji: '🔴' };
                        } else {
                            // RSRP thresholds (LTE/NR)
                            if (val >= -80) return { text: 'Excellent', emoji: '🟢' };
                            if (val >= -90) return { text: 'Good', emoji: '🔵' };
                            if (val >= -100) return { text: 'Fair', emoji: '🟡' };
                            return { text: 'Poor', emoji: '🔴' };
                        }
                    
                    case 'rsrq':
                        // Technology-specific thresholds for RSRQ/Ec/No/RxQual
                        if (tech === 'UMTS') {
                            // Ec/No thresholds (UMTS)
                            if (val >= -6) return { text: 'Excellent', emoji: '🟢' };
                            if (val >= -10) return { text: 'Good', emoji: '🔵' };
                            if (val >= -14) return { text: 'Fair', emoji: '🟡' };
                            return { text: 'Poor', emoji: '🔴' };
                        } else if (tech === 'GSM') {
                            // RxQual thresholds (GSM) - 0-7 scale, lower is better
                            if (val <= 2) return { text: 'Excellent', emoji: '🟢' };
                            if (val <= 4) return { text: 'Good', emoji: '🔵' };
                            if (val <= 6) return { text: 'Fair', emoji: '🟡' };
                            return { text: 'Poor', emoji: '🔴' };
                        } else {
                            // RSRQ thresholds (LTE/NR)
                            if (val >= -10) return { text: 'Excellent', emoji: '🟢' };
                            if (val >= -15) return { text: 'Good', emoji: '🔵' };
                            if (val >= -20) return { text: 'Fair', emoji: '🟡' };
                            return { text: 'Poor', emoji: '🔴' };
                        }
                    
                    case 'sinr':
                        // SINR only applies to LTE/NR
                        if (val >= 20) return { text: 'Excellent', emoji: '🟢' };
                        if (val >= 13) return { text: 'Good', emoji: '🔵' };
                        if (val >= 0) return { text: 'Fair', emoji: '🟡' };
                        return { text: 'Poor', emoji: '🔴' };
                    
                    case 'cqi':
                        if (val >= 12) return { text: 'Excellent', emoji: '🟢' };
                        if (val >= 9) return { text: 'Good', emoji: '🔵' };
                        if (val >= 6) return { text: 'Fair', emoji: '🟡' };
                        return { text: 'Poor', emoji: '🔴' };
                    
                    case 'mcs':
                        if (val >= 20) return { text: 'Excellent', emoji: '🟢' };
                        if (val >= 15) return { text: 'Good', emoji: '🔵' };
                        if (val >= 10) return { text: 'Fair', emoji: '🟡' };
                        return { text: 'Poor', emoji: '🔴' };
                    
                    case 'bler':
                        if (val <= 2) return { text: 'Excellent', emoji: '🟢' };
                        if (val <= 10) return { text: 'Good', emoji: '🔵' };
                        if (val <= 30) return { text: 'Fair', emoji: '🟡' };
                        return { text: 'Poor', emoji: '🔴' };
                    
                    case 'throughput_dl_mbps':
                        // Technology-specific throughput thresholds
                        if (tech === 'UMTS') {
                            // UMTS/HSPA+ throughput (lower expectations)
                            if (val >= 10) return { text: 'Excellent', emoji: '🟢' };
                            if (val >= 5) return { text: 'Good', emoji: '🔵' };
                            if (val >= 2) return { text: 'Fair', emoji: '🟡' };
                            return { text: 'Poor', emoji: '🔴' };
                        } else if (tech === 'GSM') {
                            // GSM/EDGE throughput (very low expectations)
                            if (val >= 0.2) return { text: 'Excellent', emoji: '🟢' };
                            if (val >= 0.1) return { text: 'Good', emoji: '🔵' };
                            if (val >= 0.05) return { text: 'Fair', emoji: '🟡' };
                            return { text: 'Poor', emoji: '🔴' };
                        } else {
                            // LTE/NR throughput
                            if (val >= 50) return { text: 'Excellent', emoji: '🟢' };
                            if (val >= 25) return { text: 'Good', emoji: '🔵' };
                            if (val >= 10) return { text: 'Fair', emoji: '🟡' };
                            return { text: 'Poor', emoji: '🔴' };
                        }
                    
                    case 'throughput_ul_mbps':
                        // Technology-specific throughput thresholds
                        if (tech === 'UMTS') {
                            // UMTS/HSPA+ uplink throughput
                            if (val >= 5) return { text: 'Excellent', emoji: '🟢' };
                            if (val >= 2) return { text: 'Good', emoji: '🔵' };
                            if (val >= 1) return { text: 'Fair', emoji: '🟡' };
                            return { text: 'Poor', emoji: '🔴' };
                        } else if (tech === 'GSM') {
                            // GSM/EDGE uplink throughput
                            if (val >= 0.1) return { text: 'Excellent', emoji: '🟢' };
                            if (val >= 0.05) return { text: 'Good', emoji: '🔵' };
                            if (val >= 0.02) return { text: 'Fair', emoji: '🟡' };
                            return { text: 'Poor', emoji: '🔴' };
                        } else {
                            // LTE/NR uplink throughput
                            if (val >= 20) return { text: 'Excellent', emoji: '🟢' };
                            if (val >= 10) return { text: 'Good', emoji: '🔵' };
                            if (val >= 5) return { text: 'Fair', emoji: '🟡' };
                            return { text: 'Poor', emoji: '🔴' };
                        }
                    
                    default:
                        return null;
                }
            }

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
                                    const point = parsedData[idx];
                                    const fullTime = getFullTimestamp(point);
                                    const tech = point?.technology || detectedTechnology || 'LTE';
                                    return 'Time: ' + fullTime + ' [' + tech + ']';
                                },
                                label: function(context) {
                                    return null;
                                },
                                afterLabel: function(context) {
                                    const idx = context.dataIndex;
                                    const point = parsedData[idx];
                                    if (!point) return [];
                                    
                                    // Get technology for this specific point
                                    const tech = point.technology || detectedTechnology || 'LTE';
                                    
                                    // Context-aware tooltip: Show only the current KPI being viewed
                                    const lines = ['━━━━━━━━━━━━━━━━━━━'];
                                    
                                    // Add Latitude and Longitude
                                    const lat = parseFloat(point.latitude || point.lat);
                                    const lon = parseFloat(point.longitude || point.lon);
                                    if (!isNaN(lat) && !isNaN(lon)) {
                                        lines.push('Latitude: ' + lat.toFixed(6));
                                        lines.push('Longitude: ' + lon.toFixed(6));
                                        lines.push('━━━━━━━━━━━━━━━━━━━');
                                    }
                                    
                                    if (kpiType === 'rsrp') {
                                        let rsrpValue, rsrpLabel, cellIdLabel, cellId;
                                        
                                        if (tech === 'NR') {
                                            rsrpValue = parseFloat(point.nr_rsrp) || 0;
                                            rsrpLabel = 'NR-RSRP';
                                            cellIdLabel = 'NR-PCI';
                                            cellId = point.nr_pci || '-';
                                        } else if (tech === 'UMTS') {
                                            rsrpValue = parseFloat(point.wcdma_rscp) || 0;
                                            rsrpLabel = 'RSCP';
                                            cellIdLabel = 'PSC';
                                            cellId = point.wcdma_psc || point.psc || '-';
                                        } else if (tech === 'GSM') {
                                            rsrpValue = parseFloat(point.gsm_rxlev || point.rxlev) || 0;
                                            rsrpLabel = 'RxLev';
                                            cellIdLabel = 'BSIC';
                                            cellId = point.gsm_bsic || point.bsic || '-';
                                        } else {
                                            rsrpValue = parseFloat(point.rsrp) || 0;
                                            rsrpLabel = 'RSRP';
                                            cellIdLabel = 'PCI';
                                            cellId = point.pci || '-';
                                        }
                                        
                                        const quality = getKpiQuality('rsrp', rsrpValue, tech);
                                        lines.push(rsrpLabel + ': ' + rsrpValue.toFixed(2) + ' dBm');
                                        if (quality) lines.push('Quality: ' + quality.emoji + ' ' + quality.text);
                                        lines.push(cellIdLabel + ': ' + cellId);
                                    } else if (kpiType === 'rsrq') {
                                        let rsrqValue, rsrqLabel, cellIdLabel, cellId;
                                        
                                        if (tech === 'NR') {
                                            rsrqValue = parseFloat(point.nr_rsrq) || 0;
                                            rsrqLabel = 'NR-RSRQ';
                                            cellIdLabel = 'NR-PCI';
                                            cellId = point.nr_pci || '-';
                                        } else if (tech === 'UMTS') {
                                            rsrqValue = parseFloat(point.wcdma_ecno) || 0;
                                            rsrqLabel = 'Ec/No';
                                            cellIdLabel = 'PSC';
                                            cellId = point.wcdma_psc || point.psc || '-';
                                        } else if (tech === 'GSM') {
                                            rsrqValue = parseFloat(point.gsm_rxqual || point.rxqual) || 0;
                                            rsrqLabel = 'RxQual';
                                            cellIdLabel = 'BSIC';
                                            cellId = point.gsm_bsic || point.bsic || '-';
                                        } else {
                                            rsrqValue = parseFloat(point.rsrq) || 0;
                                            rsrqLabel = 'RSRQ';
                                            cellIdLabel = 'PCI';
                                            cellId = point.pci || '-';
                                        }
                                        
                                        const quality = getKpiQuality('rsrq', rsrqValue, tech);
                                        lines.push(rsrqLabel + ': ' + rsrqValue.toFixed(2) + (tech === 'GSM' ? '' : ' dB'));
                                        if (quality) lines.push('Quality: ' + quality.emoji + ' ' + quality.text);
                                        lines.push(cellIdLabel + ': ' + cellId);
                                    } else if (kpiType === 'sinr') {
                                        let sinrValue, sinrLabel, cellIdLabel, cellId;
                                        
                                        if (tech === 'NR') {
                                            sinrValue = parseFloat(point.nr_sinr) || 0;
                                            sinrLabel = 'NR-SINR';
                                            cellIdLabel = 'NR-PCI';
                                            cellId = point.nr_pci || '-';
                                        } else {
                                            sinrValue = parseFloat(point.sinr) || 0;
                                            sinrLabel = 'SINR';
                                            cellIdLabel = 'PCI';
                                            cellId = point.pci || '-';
                                        }
                                        
                                        const quality = getKpiQuality('sinr', sinrValue, tech);
                                        lines.push(sinrLabel + ': ' + sinrValue.toFixed(2) + ' dB');
                                        if (quality) lines.push('Quality: ' + quality.emoji + ' ' + quality.text);
                                        lines.push(cellIdLabel + ': ' + cellId);
                                    } else if (kpiType === 'cqi') {
                                        const cqi = parseFloat(point.cqi) || 0;
                                        const quality = getKpiQuality('cqi', cqi, tech);
                                        lines.push('CQI: ' + cqi);
                                        if (quality) lines.push('Quality: ' + quality.emoji + ' ' + quality.text);
                                        const cellId = tech === 'NR' ? (point.nr_pci || '-') : (point.pci || '-');
                                        const cellIdLabel = tech === 'NR' ? 'NR-PCI' : 'PCI';
                                        lines.push(cellIdLabel + ': ' + cellId);
                                    } else if (kpiType === 'mcs') {
                                        const mcs = parseFloat(point.mcs) || 0;
                                        const quality = getKpiQuality('mcs', mcs, tech);
                                        lines.push('MCS: ' + mcs);
                                        if (quality) lines.push('Quality: ' + quality.emoji + ' ' + quality.text);
                                        const cellId = tech === 'NR' ? (point.nr_pci || '-') : (point.pci || '-');
                                        const cellIdLabel = tech === 'NR' ? 'NR-PCI' : 'PCI';
                                        lines.push(cellIdLabel + ': ' + cellId);
                                    } else if (kpiType === 'bler') {
                                        const bler = parseFloat(point.bler) || 0;
                                        const quality = getKpiQuality('bler', bler, tech);
                                        lines.push('BLER: ' + bler + '%');
                                        if (quality) lines.push('Quality: ' + quality.emoji + ' ' + quality.text);
                                        const cellId = tech === 'NR' ? (point.nr_pci || '-') : (point.pci || '-');
                                        const cellIdLabel = tech === 'NR' ? 'NR-PCI' : 'PCI';
                                        lines.push(cellIdLabel + ': ' + cellId);
                                    } else if (kpiType === 'throughput_dl_mbps') {
                                        const dl = parseFloat(point.throughput_dl_mbps) || 0;
                                        const quality = getKpiQuality('throughput_dl_mbps', dl, tech);
                                        lines.push('DL Throughput: ' + dl + ' Mbps');
                                        if (quality) lines.push('Quality: ' + quality.emoji + ' ' + quality.text);
                                        
                                        let cellId, cellIdLabel;
                                        if (tech === 'NR') {
                                            cellId = point.nr_pci || '-';
                                            cellIdLabel = 'NR-PCI';
                                        } else if (tech === 'UMTS') {
                                            cellId = point.wcdma_psc || point.psc || '-';
                                            cellIdLabel = 'PSC';
                                        } else if (tech === 'GSM') {
                                            cellId = point.gsm_bsic || point.bsic || '-';
                                            cellIdLabel = 'BSIC';
                                        } else {
                                            cellId = point.pci || '-';
                                            cellIdLabel = 'PCI';
                                        }
                                        lines.push(cellIdLabel + ': ' + cellId);
                                    } else if (kpiType === 'throughput_ul_mbps') {
                                        const ul = parseFloat(point.throughput_ul_mbps) || 0;
                                        const quality = getKpiQuality('throughput_ul_mbps', ul, tech);
                                        lines.push('UL Throughput: ' + ul + ' Mbps');
                                        if (quality) lines.push('Quality: ' + quality.emoji + ' ' + quality.text);
                                        
                                        let cellId, cellIdLabel;
                                        if (tech === 'NR') {
                                            cellId = point.nr_pci || '-';
                                            cellIdLabel = 'NR-PCI';
                                        } else if (tech === 'UMTS') {
                                            cellId = point.wcdma_psc || point.psc || '-';
                                            cellIdLabel = 'PSC';
                                        } else if (tech === 'GSM') {
                                            cellId = point.gsm_bsic || point.bsic || '-';
                                            cellIdLabel = 'BSIC';
                                        } else {
                                            cellId = point.pci || '-';
                                            cellIdLabel = 'PCI';
                                        }
                                        lines.push(cellIdLabel + ': ' + cellId);
                                    } else {
                                        // Fallback: show the current KPI value
                                        const value = parseFloat(point[kpiType]) || 0;
                                        lines.push(kpiLabel + ': ' + value.toFixed(2));
                                    }
                                    
                                    lines.push('━━━━━━━━━━━━━━━━━━━');
                                    return lines;
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
                    interaction: cfg.options?.interaction || { mode: 'point', intersect: true },
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

            const labels = parsedData.map((d, i) => getShortTimestamp(d) || `${i+1}`);
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
                                title: function(context) { 
                                    const idx = context[0].dataIndex;
                                    const point = parsedData[idx];
                                    return 'Time: ' + getFullTimestamp(point); 
                                },
                                label: function(context) {
                                    return 'CQI: ' + context.parsed.y.toFixed(0);
                                },
                                afterLabel: function(context) {
                                    const idx = context.dataIndex;
                                    const point = parsedData[idx];
                                    if (!point) return [];
                                    const lat = parseFloat(point.latitude || point.lat);
                                    const lon = parseFloat(point.longitude || point.lon);
                                    if (isNaN(lat) || isNaN(lon)) return [];
                                    return ['Lat: ' + lat.toFixed(6), 'Lon: ' + lon.toFixed(6)];
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
                                title: function(context) { 
                                    const idx = context[0].dataIndex;
                                    const point = parsedData[idx];
                                    return 'Time: ' + getFullTimestamp(point); 
                                },
                                label: function(context) {
                                    return 'MCS: ' + context.parsed.y.toFixed(0);
                                },
                                afterLabel: function(context) {
                                    const idx = context.dataIndex;
                                    const point = parsedData[idx];
                                    if (!point) return [];
                                    const lat = parseFloat(point.latitude || point.lat);
                                    const lon = parseFloat(point.longitude || point.lon);
                                    if (isNaN(lat) || isNaN(lon)) return [];
                                    return ['Lat: ' + lat.toFixed(6), 'Lon: ' + lon.toFixed(6)];
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
                                    title: function(context) { 
                                        const idx = context[0].dataIndex;
                                        const point = parsedData[idx];
                                        return 'Time: ' + getFullTimestamp(point); 
                                    },
                                    label: function(context) {
                                        return sinrLabel + ': ' + context.parsed.y.toFixed(2);
                                    },
                                    afterLabel: function(context) {
                                        const idx = context.dataIndex;
                                        const point = parsedData[idx];
                                        if (!point) return [];
                                        const lat = parseFloat(point.latitude || point.lat);
                                        const lon = parseFloat(point.longitude || point.lon);
                                        if (isNaN(lat) || isNaN(lon)) return [];
                                        return ['Lat: ' + lat.toFixed(6), 'Lon: ' + lon.toFixed(6)];
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
            
            // Smart Y-axis scaling for GSM RxLev (0 to -99 range)
            let rsrpYMin, rsrpYMax;
            if (tech === 'GSM') {
                // RxLev: ensure we show the full range including 0 at top
                rsrpYMax = Math.max(maxRsrp + 5, 5); // Always show at least up to 5
                rsrpYMin = Math.min(minRsrp - 5, -110); // Extend below minimum
            } else {
                // Standard scaling for LTE/UMTS/NR
                rsrpYMin = Math.floor(minRsrp - 5);
                rsrpYMax = Math.ceil(maxRsrp + 5);
            }
            
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
                                title: function(context) { 
                                    const idx = context[0].dataIndex;
                                    const point = parsedData[idx];
                                    return 'Time: ' + getFullTimestamp(point); 
                                },
                                label: function(context) {
                                    return rsrpLabel + ': ' + context.parsed.y.toFixed(2);
                                },
                                afterLabel: function(context) {
                                    const idx = context.dataIndex;
                                    const point = parsedData[idx];
                                    if (!point) return [];
                                    const lat = parseFloat(point.latitude || point.lat);
                                    const lon = parseFloat(point.longitude || point.lon);
                                    if (isNaN(lat) || isNaN(lon)) return [];
                                    return ['Lat: ' + lat.toFixed(6), 'Lon: ' + lon.toFixed(6)];
                                }
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { type: 'linear', title: { display: true, text: rsrpLabel, color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: rsrpYMin, max: rsrpYMax }
                    }
                }
            });

            // RSRQ (Separate Chart)
            if (compRsrqOnly) compRsrqOnly.destroy();
            const minRsrq = Math.min(...rsrqVals);
            const maxRsrq = Math.max(...rsrqVals);
            
            // Smart Y-axis scaling for GSM RxQual (handles negative values and flat lines)
            let rsrqYMin, rsrqYMax;
            if (tech === 'GSM') {
                // RxQual: handle non-standard negative values and flat lines
                const range = maxRsrq - minRsrq;
                if (range < 1) {
                    // Flat line or very small range - create visible range around the value
                    const center = (maxRsrq + minRsrq) / 2;
                    rsrqYMin = center - 5;
                    rsrqYMax = center + 5;
                } else {
                    rsrqYMin = Math.floor(minRsrq - 2);
                    rsrqYMax = Math.ceil(maxRsrq + 2);
                }
            } else {
                // Standard scaling for LTE/UMTS/NR
                rsrqYMin = Math.floor(minRsrq - 2);
                rsrqYMax = Math.ceil(maxRsrq + 2);
            }
            
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
                                title: function(context) { 
                                    const idx = context[0].dataIndex;
                                    const point = parsedData[idx];
                                    return 'Time: ' + getFullTimestamp(point); 
                                },
                                label: function(context) {
                                    return rsrqLabel + ': ' + context.parsed.y.toFixed(2);
                                },
                                afterLabel: function(context) {
                                    const idx = context.dataIndex;
                                    const point = parsedData[idx];
                                    if (!point) return [];
                                    const lat = parseFloat(point.latitude || point.lat);
                                    const lon = parseFloat(point.longitude || point.lon);
                                    if (isNaN(lat) || isNaN(lon)) return [];
                                    return ['Lat: ' + lat.toFixed(6), 'Lon: ' + lon.toFixed(6)];
                                }
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 5, padding: 8 }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { type: 'linear', title: { display: true, text: rsrqLabel, color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 11, weight: 'bold' } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 10 } }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }, min: rsrqYMin, max: rsrqYMax }
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
                                title: function(context) { 
                                    const idx = context[0].dataIndex;
                                    const point = parsedData[idx];
                                    return 'Time: ' + getFullTimestamp(point); 
                                },
                                label: function(context) {
                                    return 'DL Throughput: ' + context.parsed.y.toFixed(2) + ' Mbps';
                                },
                                afterLabel: function(context) {
                                    const idx = context.dataIndex;
                                    const point = parsedData[idx];
                                    if (!point) return [];
                                    const lat = parseFloat(point.latitude || point.lat);
                                    const lon = parseFloat(point.longitude || point.lon);
                                    if (isNaN(lat) || isNaN(lon)) return [];
                                    return ['Lat: ' + lat.toFixed(6), 'Lon: ' + lon.toFixed(6)];
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
                                title: function(context) { 
                                    const idx = context[0].dataIndex;
                                    const point = parsedData[idx];
                                    return 'Time: ' + getFullTimestamp(point); 
                                },
                                label: function(context) {
                                    return 'UL Throughput: ' + context.parsed.y.toFixed(2) + ' Mbps';
                                },
                                afterLabel: function(context) {
                                    const idx = context.dataIndex;
                                    const point = parsedData[idx];
                                    if (!point) return [];
                                    const lat = parseFloat(point.latitude || point.lat);
                                    const lon = parseFloat(point.longitude || point.lon);
                                    if (isNaN(lat) || isNaN(lon)) return [];
                                    return ['Lat: ' + lat.toFixed(6), 'Lon: ' + lon.toFixed(6)];
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
                                title: function(context) { 
                                    const idx = context[0].dataIndex;
                                    const point = parsedData[idx];
                                    return 'Time: ' + getFullTimestamp(point); 
                                },
                                label: function(context) {
                                    return 'BLER: ' + context.parsed.y.toFixed(2) + ' %';
                                },
                                afterLabel: function(context) {
                                    const idx = context.dataIndex;
                                    const point = parsedData[idx];
                                    if (!point) return [];
                                    const lat = parseFloat(point.latitude || point.lat);
                                    const lon = parseFloat(point.longitude || point.lon);
                                    if (isNaN(lat) || isNaN(lon)) return [];
                                    return ['Lat: ' + lat.toFixed(6), 'Lon: ' + lon.toFixed(6)];
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
                                        title: function(context) { 
                                            const idx = context[0].dataIndex;
                                            const point = parsedData[idx];
                                            return 'Time: ' + getFullTimestamp(point); 
                                        },
                                        label: function(context) {
                                            if (context.parsed.y === null) return 'Tx Power: N/A';
                                            return 'Tx Power: ' + context.parsed.y.toFixed(2) + ' dBm';
                                        },
                                        afterLabel: function(context) {
                                            const idx = context.dataIndex;
                                            const point = parsedData[idx];
                                            if (!point) return [];
                                            const lat = parseFloat(point.latitude || point.lat);
                                            const lon = parseFloat(point.longitude || point.lon);
                                            if (isNaN(lat) || isNaN(lon)) return [];
                                            return ['Lat: ' + lat.toFixed(6), 'Lon: ' + lon.toFixed(6)];
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
                
                // 3. TECHNOLOGY CHANGES (RAT change: LTE→UMTS, etc.)
                if (index > 0) {
                    const prevTech = data[index-1].technology;
                    const currTech = point.technology;
                    
                    // Only show RAT changes if both technologies are valid (not Unknown)
                    if (prevTech && currTech && 
                        prevTech !== currTech && 
                        prevTech !== 'Unknown' && 
                        currTech !== 'Unknown') {
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

        /**
         * Compute polynomial regression for statistical line (binned data)
         * Takes binned data points (from percentile/average calculations) and fits a polynomial
         * @param {Array} binnedData - Array of {x, y} points from binned calculations
         * @param {Number} degree - Polynomial degree
         * @returns {Array} - Polynomial trendline as array of {x, y} points
         */
        function computeStatisticalPolynomial(binnedData, degree) {
            if (!binnedData || binnedData.length < degree + 1) {
                console.warn('Insufficient binned data points for polynomial degree', degree);
                return [];
            }
            
            // Extract x and y arrays from binned data
            const xVals = binnedData.map(point => point.x);
            const yVals = binnedData.map(point => point.y);
            
            // Compute polynomial coefficients
            const coeffs = polynomialRegression(xVals, yVals, degree);
            
            // Generate smooth polynomial curve
            if (coeffs) {
                return generatePolynomialTrendline(xVals, coeffs, 100);
            }
            
            return [];
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
            const isSinrChartVisible = chartVisibility['scatter-tput-sinr'] !== false;
            
            if (tech !== 'UMTS' && tech !== 'GSM' && isSinrChartVisible) {
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
                
                // Calculate polynomial trendlines for statistical lines
                const p90Poly = computeStatisticalPolynomial(tputXP90, polynomialDegree);
                const p50Poly = computeStatisticalPolynomial(tputXP50, polynomialDegree);
                const avgPoly = computeStatisticalPolynomial(tputXAvg, polynomialDegree);
                
                // Optional: Calculate raw data polynomial (if toggle enabled in zoom modal)
                const showRaw = window.showRawTrendlineState ?? (document.getElementById('showRawTrendlineZoom')?.checked || false);
                const rawPolyCoeffs = showRaw ? polynomialRegression(filteredX, filteredY, polynomialDegree) : null;
                const rawPoly = rawPolyCoeffs ? generatePolynomialTrendline(filteredX, rawPolyCoeffs, 100) : [];

                // Build datasets array
                const datasets = [
                    { label: 'Data Points', data: tputXData, backgroundColor: 'rgba(59,130,246,0.6)', pointRadius: 3, pointHoverRadius: 5 },
                    { label: `90th Percentile (Deg ${polynomialDegree})`, data: p90Poly, type: 'line', borderColor: '#ef4444', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 },
                    { label: `Median (Deg ${polynomialDegree})`, data: p50Poly, type: 'line', borderColor: '#fbbf24', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 },
                    { label: `Average (Deg ${polynomialDegree})`, data: avgPoly, type: 'line', borderColor: '#10b981', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 }
                ];
                
                // Add raw polynomial if enabled
                if (showRaw && rawPoly.length > 0) {
                    datasets.push({
                        label: `Overall Trend (Deg ${polynomialDegree})`,
                        data: rawPoly,
                        type: 'line',
                        borderColor: '#a78bfa',
                        borderWidth: 2,
                        borderDash: [4, 4],
                        pointRadius: 0,
                        fill: false,
                        tension: 0
                    });
                }

                if (scatterTputSinr) scatterTputSinr.destroy();
                scatterTputSinr = new Chart(document.getElementById('scatterTputSinr'), {
                    type: 'scatter',
                    data: { datasets: datasets },
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
            const isRsrpChartVisible = chartVisibility['scatter-tput-rsrp'] !== false;
            const rsrpContainer = document.getElementById('scatterTputRsrp')?.parentElement;
            
            if (isRsrpChartVisible) {
                if (rsrpContainer) rsrpContainer.style.display = 'block';
                
            const filteredRsrp = filterActiveDataPoints(rsrpVals, tputDlVals, cqiVals, mcsVals, blerVals, includeIdle);
            const rsrpTputData = filteredRsrp.dataPoints;
            const rsrpFilteredX = filteredRsrp.filteredX;
            const rsrpFilteredY = filteredRsrp.filteredY;
            
            const rsrpTputP90 = calculateBinnedPercentiles(rsrpFilteredX, rsrpFilteredY, 90);
            const rsrpTputP50 = calculateBinnedPercentiles(rsrpFilteredX, rsrpFilteredY, 50);
            const rsrpTputAvg = calculateBinnedAverage(rsrpFilteredX, rsrpFilteredY);
            
            // Calculate polynomial trendlines for statistical lines
            const rsrpP90Poly = computeStatisticalPolynomial(rsrpTputP90, polynomialDegree);
            const rsrpP50Poly = computeStatisticalPolynomial(rsrpTputP50, polynomialDegree);
            const rsrpAvgPoly = computeStatisticalPolynomial(rsrpTputAvg, polynomialDegree);
            
            // Optional: Calculate raw data polynomial (if toggle enabled in zoom modal)
            const showRaw = window.showRawTrendlineState ?? (document.getElementById('showRawTrendlineZoom')?.checked || false);
            const rsrpRawPolyCoeffs = showRaw ? polynomialRegression(rsrpFilteredX, rsrpFilteredY, polynomialDegree) : null;
            const rsrpRawPoly = rsrpRawPolyCoeffs ? generatePolynomialTrendline(rsrpFilteredX, rsrpRawPolyCoeffs, 100) : [];

            // Build datasets array
            const rsrpDatasets = [
                { label: 'Data Points', data: rsrpTputData, backgroundColor: 'rgba(59,130,246,0.6)', pointRadius: 3, pointHoverRadius: 5 },
                { label: `90th Percentile (Deg ${polynomialDegree})`, data: rsrpP90Poly, type: 'line', borderColor: '#ef4444', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 },
                { label: `Median (Deg ${polynomialDegree})`, data: rsrpP50Poly, type: 'line', borderColor: '#fbbf24', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 },
                { label: `Average (Deg ${polynomialDegree})`, data: rsrpAvgPoly, type: 'line', borderColor: '#10b981', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 }
            ];
            
            // Add raw polynomial if enabled
            if (showRaw && rsrpRawPoly.length > 0) {
                rsrpDatasets.push({
                    label: `Overall Trend (Deg ${polynomialDegree})`,
                    data: rsrpRawPoly,
                    type: 'line',
                    borderColor: '#a78bfa',
                    borderWidth: 2,
                    borderDash: [4, 4],
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                });
            }

            if (scatterTputRsrp) scatterTputRsrp.destroy();
            scatterTputRsrp = new Chart(document.getElementById('scatterTputRsrp'), {
                type: 'scatter',
                data: { datasets: rsrpDatasets },
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
            } else {
                // Hide RSRP chart if not visible
                if (rsrpContainer) rsrpContainer.style.display = 'none';
            }

            // Throughput vs RSRQ/Ec/No/RxQual - Extract technology-specific quality KPIs
            const isRsrqChartVisible = chartVisibility['scatter-tput-rsrq'] !== false;
            const rsrqContainer = document.getElementById('scatterTputRsrq')?.parentElement;
            
            if (isRsrqChartVisible) {
                if (rsrqContainer) rsrqContainer.style.display = 'block';
                
            let rsrqVals;
            let rsrqLabel;
            
            if (tech === 'NR') {
                rsrqVals = parsedData.map(d => parseFloat(d.nr_rsrq) || -20);
                rsrqLabel = 'NR-RSRQ (dB)';
            } else if (tech === 'UMTS') {
                rsrqVals = parsedData.map(d => parseFloat(d.wcdma_ecno || d.ecno) || -20);
                rsrqLabel = 'Ec/No (dB)';
            } else if (tech === 'GSM') {
                rsrqVals = parsedData.map(d => parseFloat(d.gsm_rxqual || d.rxqual) || -20);
                rsrqLabel = 'RxQual';
            } else {
                rsrqVals = parsedData.map(d => parseFloat(d.rsrq) || -20);
                rsrqLabel = 'RSRQ (dB)';
            }
            
            // Apply filtering to remove idle samples
            const filteredRsrq = filterActiveDataPoints(rsrqVals, tputDlVals, cqiVals, mcsVals, blerVals, includeIdle);
            const rsrqTputData = filteredRsrq.dataPoints;
            const rsrqFilteredX = filteredRsrq.filteredX;
            const rsrqFilteredY = filteredRsrq.filteredY;
            
            const rsrqTputP90 = calculateBinnedPercentiles(rsrqFilteredX, rsrqFilteredY, 90);
            const rsrqTputP50 = calculateBinnedPercentiles(rsrqFilteredX, rsrqFilteredY, 50);
            const rsrqTputAvg = calculateBinnedAverage(rsrqFilteredX, rsrqFilteredY);
            
            // Calculate polynomial trendlines for statistical lines
            const rsrqP90Poly = computeStatisticalPolynomial(rsrqTputP90, polynomialDegree);
            const rsrqP50Poly = computeStatisticalPolynomial(rsrqTputP50, polynomialDegree);
            const rsrqAvgPoly = computeStatisticalPolynomial(rsrqTputAvg, polynomialDegree);
            
            // Optional: Calculate raw data polynomial (if toggle enabled in zoom modal)
            const showRawRsrq = window.showRawTrendlineState ?? (document.getElementById('showRawTrendlineZoom')?.checked || false);
            const rsrqRawPolyCoeffs = showRawRsrq ? polynomialRegression(rsrqFilteredX, rsrqFilteredY, polynomialDegree) : null;
            const rsrqRawPoly = rsrqRawPolyCoeffs ? generatePolynomialTrendline(rsrqFilteredX, rsrqRawPolyCoeffs, 100) : [];

            // Build datasets array
            const rsrqDatasets = [
                { label: 'Data Points', data: rsrqTputData, backgroundColor: 'rgba(59,130,246,0.6)', pointRadius: 3, pointHoverRadius: 5 },
                { label: `90th Percentile (Deg ${polynomialDegree})`, data: rsrqP90Poly, type: 'line', borderColor: '#ef4444', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 },
                { label: `Median (Deg ${polynomialDegree})`, data: rsrqP50Poly, type: 'line', borderColor: '#fbbf24', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 },
                { label: `Average (Deg ${polynomialDegree})`, data: rsrqAvgPoly, type: 'line', borderColor: '#10b981', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 }
            ];
            
            // Add raw polynomial if enabled
            if (showRawRsrq && rsrqRawPoly.length > 0) {
                rsrqDatasets.push({
                    label: `Overall Trend (Deg ${polynomialDegree})`,
                    data: rsrqRawPoly,
                    type: 'line',
                    borderColor: '#a78bfa',
                    borderWidth: 2,
                    borderDash: [4, 4],
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                });
            }

            if (scatterTputRsrq) scatterTputRsrq.destroy();
            scatterTputRsrq = new Chart(document.getElementById('scatterTputRsrq'), {
                type: 'scatter',
                data: { datasets: rsrqDatasets },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top', labels: { color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { family: 'JetBrains Mono', size: 10 } } },
                        title: { display: true, text: `DL Throughput vs ${rsrqLabel.split(' ')[0]} ${includeIdle ? '(All Samples)' : '(Active Sessions Only)'}`, color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 14 } },
                        tooltip: { backgroundColor: 'rgba(0,0,0,0.9)', titleFont: { family: 'JetBrains Mono' }, bodyFont: { family: 'JetBrains Mono' } }
                    },
                    scales: {
                        x: { title: { display: true, text: rsrqLabel, color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12 } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563' }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } },
                        y: { title: { display: true, text: 'DL Throughput (Mbps)', color: kpiTheme === 'dark' ? '#fff' : '#1f2937', font: { size: 12 } }, ticks: { color: kpiTheme === 'dark' ? '#9ca3af' : '#4b5563' }, grid: { color: kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' } }
                    }
                }
            });
            } else {
                // Hide RSRQ chart if not visible
                if (rsrqContainer) rsrqContainer.style.display = 'none';
            }

            // MCS vs CQI - Hide for UMTS/GSM
            const scatterMcsCqiContainer = document.getElementById('scatterMcsCqi')?.parentElement;
            const isMcsCqiChartVisible = chartVisibility['scatter-mcs-cqi'] !== false;
            
            if (tech !== 'UMTS' && tech !== 'GSM' && isMcsCqiChartVisible) {
                if (scatterMcsCqiContainer) scatterMcsCqiContainer.style.display = 'block';
                const cqiMcsData = cqiVals.map((cqi, i) => ({ x: cqi, y: mcsVals[i] }));
                const cqiMcsP90 = calculateBinnedPercentiles(cqiVals, mcsVals, 90);
                const cqiMcsP50 = calculateBinnedPercentiles(cqiVals, mcsVals, 50);
                const cqiMcsAvg = calculateBinnedAverage(cqiVals, mcsVals);
                
                // Calculate polynomial trendlines for statistical lines
                const cqiP90Poly = computeStatisticalPolynomial(cqiMcsP90, polynomialDegree);
                const cqiP50Poly = computeStatisticalPolynomial(cqiMcsP50, polynomialDegree);
                const cqiAvgPoly = computeStatisticalPolynomial(cqiMcsAvg, polynomialDegree);
                
                // Optional: Calculate raw data polynomial (if toggle enabled in zoom modal)
                const showRaw = window.showRawTrendlineState ?? (document.getElementById('showRawTrendlineZoom')?.checked || false);
                const cqiRawPolyCoeffs = showRaw ? polynomialRegression(cqiVals, mcsVals, polynomialDegree) : null;
                const cqiRawPoly = cqiRawPolyCoeffs ? generatePolynomialTrendline(cqiVals, cqiRawPolyCoeffs, 100) : [];

                // Build datasets array
                const cqiDatasets = [
                    { label: 'Data Points', data: cqiMcsData, backgroundColor: 'rgba(59,130,246,0.6)', pointRadius: 3, pointHoverRadius: 5 },
                    { label: `90th Percentile (Deg ${polynomialDegree})`, data: cqiP90Poly, type: 'line', borderColor: '#ef4444', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 },
                    { label: `Median (Deg ${polynomialDegree})`, data: cqiP50Poly, type: 'line', borderColor: '#fbbf24', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 },
                    { label: `Average (Deg ${polynomialDegree})`, data: cqiAvgPoly, type: 'line', borderColor: '#10b981', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 }
                ];
                
                // Add raw polynomial if enabled
                if (showRaw && cqiRawPoly.length > 0) {
                    cqiDatasets.push({
                        label: `Overall Trend (Deg ${polynomialDegree})`,
                        data: cqiRawPoly,
                        type: 'line',
                        borderColor: '#a78bfa',
                        borderWidth: 2,
                        borderDash: [4, 4],
                        pointRadius: 0,
                        fill: false,
                        tension: 0
                    });
                }

                if (scatterMcsCqi) scatterMcsCqi.destroy();
            scatterMcsCqi = new Chart(document.getElementById('scatterMcsCqi'), {
                type: 'scatter',
                data: { datasets: cqiDatasets },
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
            const isBlerChartVisible = chartVisibility['scatter-bler-tput'] !== false;
            
            if (tech !== 'UMTS' && tech !== 'GSM' && isBlerChartVisible) {
                if (scatterBlerTputContainer) scatterBlerTputContainer.style.display = 'block';
                const blerTputData = blerVals.map((bler, i) => ({ x: bler, y: tputDlVals[i] }));
                const blerTputP90 = calculateBinnedPercentiles(blerVals, tputDlVals, 90);
                const blerTputP50 = calculateBinnedPercentiles(blerVals, tputDlVals, 50);
                const blerTputAvg = calculateBinnedAverage(blerVals, tputDlVals);
                
                // Calculate polynomial trendlines for statistical lines
                const blerP90Poly = computeStatisticalPolynomial(blerTputP90, polynomialDegree);
                const blerP50Poly = computeStatisticalPolynomial(blerTputP50, polynomialDegree);
                const blerAvgPoly = computeStatisticalPolynomial(blerTputAvg, polynomialDegree);
                
                // Optional: Calculate raw data polynomial (if toggle enabled in zoom modal)
                const showRaw = window.showRawTrendlineState ?? (document.getElementById('showRawTrendlineZoom')?.checked || false);
                const blerRawPolyCoeffs = showRaw ? polynomialRegression(blerVals, tputDlVals, polynomialDegree) : null;
                const blerRawPoly = blerRawPolyCoeffs ? generatePolynomialTrendline(blerVals, blerRawPolyCoeffs, 100) : [];

                // Build datasets array
                const blerDatasets = [
                    { label: 'Data Points', data: blerTputData, backgroundColor: 'rgba(59,130,246,0.6)', pointRadius: 3, pointHoverRadius: 5 },
                    { label: `90th Percentile (Deg ${polynomialDegree})`, data: blerP90Poly, type: 'line', borderColor: '#ef4444', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 },
                    { label: `Median (Deg ${polynomialDegree})`, data: blerP50Poly, type: 'line', borderColor: '#fbbf24', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 },
                    { label: `Average (Deg ${polynomialDegree})`, data: blerAvgPoly, type: 'line', borderColor: '#10b981', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: false, tension: 0 }
                ];
                
                // Add raw polynomial if enabled
                if (showRaw && blerRawPoly.length > 0) {
                    blerDatasets.push({
                        label: `Overall Trend (Deg ${polynomialDegree})`,
                        data: blerRawPoly,
                        type: 'line',
                        borderColor: '#a78bfa',
                        borderWidth: 2,
                        borderDash: [4, 4],
                        pointRadius: 0,
                        fill: false,
                        tension: 0
                    });
                }

                if (scatterBlerTput) scatterBlerTput.destroy();
            scatterBlerTput = new Chart(document.getElementById('scatterBlerTput'), {
                type: 'scatter',
                data: { datasets: blerDatasets },
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
                
                // Map BTS column to gsm_bsic for compatibility
                if (obj.bts && !obj.gsm_bsic && !obj.bsic) {
                    obj.gsm_bsic = obj.bts;
                }
                
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

            // Group coordinates by location to handle overlapping points
            const locationGroups = {};
            coords.forEach((p, i) => {
                const row = p.row;
                const hasEvent = row.event && row.event.trim() !== '';

                if (!hasEvent) {
                    const el = document.createElement('div');
                    el.innerHTML = `<div style="width:10px;height:10px;border-radius:50%;background:${p.color};border:1px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;font-size:10px;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5));cursor:pointer;"></div>`;
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
                            <div style="margin:4px 0;"><b>Time:</b> ${getFullTimestamp(row)}</div>
                            <div style="margin:4px 0;"><b>Latitude:</b> ${p.lat.toFixed(6)}</div>
                            <div style="margin:4px 0;"><b>Longitude:</b> ${p.lon.toFixed(6)}</div>
                            ${kpiContent}
                            ${row.quality ? `<div style="margin:4px 0;"><b>Quality:</b> ${row.quality}</div>` : ''}
                        </div>
                    `);
                    markers.push(new maplibregl.Marker({ element: el }).setLngLat([p.lon, p.lat]).setPopup(popup).addTo(map));
                } else {
                    const key = `${p.lat.toFixed(6)},${p.lon.toFixed(6)}`;
                    if (!locationGroups[key]) {
                        locationGroups[key] = { all: [], noEvent: [], withEvent: [] };
                    }
                    locationGroups[key].all.push({ ...p, originalIndex: i });
                    locationGroups[key].withEvent.push({ ...p, originalIndex: i });
                }
            });

            // Add markers with count badges for grouped locations (non-event points)
            Object.values(locationGroups).forEach(groupData => {
                const group = groupData.noEvent;
                if (group.length === 0) return; // Skip if no non-event points
                
                const p = group[0]; // Use first point for location
                const row = p.row;
                const totalCount = groupData.all.length; // Total count including events
                const count = group.length; // Count without events

                const el = document.createElement('div');
                
                // If multiple points at same location, show count badge (use total count)
                if (totalCount > 1) {
                    el.innerHTML = `
                        <div style="position:relative;display:inline-block;">
                            <div style="width:14px;height:14px;border-radius:50%;background:${p.color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.6);filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5));cursor:pointer;"></div>
                            <div style="position:absolute;top:-8px;right:-8px;background:#ef4444;color:white;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.5);">${totalCount}</div>
                        </div>`;
                } else {
                    el.innerHTML = `<div style="width:10px;height:10px;border-radius:50%;background:${p.color};border:1px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;font-size:10px;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5));cursor:pointer;"></div>`;
                }
                
                // Build popup content based on technology
                const tech = row.technology || 'LTE';
                
                // For single point, show standard popup
                if (count === 1 && totalCount === 1) {
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
                                <div style="font-weight:800;color:${p.color};margin-bottom:8px;border-bottom:2px solid ${p.color};padding-bottom:4px;">📍 ${tech} Point #${row['#'] || row.number || p.originalIndex + 1}</div>
                                <div style="margin:4px 0;"><b>Time:</b> ${row.time?.split('T')[1]?.slice(0, 8) || '-'}</div>
                                ${kpiContent}
                                ${row.quality ? `<div style="margin:4px 0;"><b>Quality:</b> ${row.quality}</div>` : ''}
                            </div>
                        `);
                        markers.push(new maplibregl.Marker({ element: el }).setLngLat([p.lon, p.lat]).setPopup(popup).addTo(map));
                    } else {
                        // For multiple points, show enhanced popup with sample table and timeline controls
                        // Use ALL samples at this location (including events)
                        const allSamples = groupData.all;
                        const eventCount = groupData.withEvent.length;
                        
                        // Debug logging
                        console.log(`Location ${p.lat.toFixed(6)},${p.lon.toFixed(6)}:`, {
                            totalCount,
                            allSamplesLength: allSamples.length,
                            eventCount,
                            noEventCount: groupData.noEvent.length
                        });
                        
                        const timeRange = `${allSamples[0].row.time?.split('T')[1]?.slice(0, 8) || '-'} to ${allSamples[totalCount-1].row.time?.split('T')[1]?.slice(0, 8) || '-'}`;
                        
                        // Build sample table rows for ALL samples
                        let tableRows = '';
                        console.log(`Building table with ${allSamples.length} samples:`, allSamples.map(s => ({
                            time: s.row.time,
                            hasEvent: !!(s.row.event && s.row.event.trim() !== ''),
                            event: s.row.event
                        })));
                        
                        allSamples.forEach((sample, idx) => {
                            const sRow = sample.row;
                            const sColor = sample.color;
                            const time = sRow.time?.split('T')[1]?.slice(0, 8) || '-';
                            const hasEvent = sRow.event && sRow.event.trim() !== '';
                            
                            let kpiValues = '';
                            if (tech === 'NR') {
                                kpiValues = `<td>${sRow.nr_rsrp || '-'}</td><td>${sRow.nr_rsrq || '-'}</td><td>${sRow.nr_sinr || '-'}</td><td>${sRow.nr_pci || '-'}</td>`;
                            } else if (tech === 'LTE') {
                                kpiValues = `<td>${sRow.rsrp || '-'}</td><td>${sRow.rsrq || '-'}</td><td>${sRow.sinr || '-'}</td><td>${sRow.pci || '-'}</td>`;
                            } else if (tech === 'UMTS') {
                                kpiValues = `<td>${sRow.wcdma_rscp || '-'}</td><td>${sRow.wcdma_ecno || '-'}</td><td>-</td><td>${sRow.wcdma_psc || '-'}</td>`;
                            } else if (tech === 'GSM') {
                                kpiValues = `<td>${sRow.gsm_rxlev || sRow.rxlev || '-'}</td><td>${sRow.gsm_rxqual || sRow.rxqual || '-'}</td><td>-</td><td>${sRow.gsm_bsic || '-'}</td>`;
                            }
                            
                            // Add event indicator if present
                            const eventBadge = hasEvent ? `<span style="background:#f97316;color:white;padding:1px 4px;border-radius:3px;font-size:8px;margin-left:4px;">${sRow.event}</span>` : '';
                            
                            tableRows += `
                                <tr style="background:${idx % 2 === 0 ? '#f9fafb' : '#fff'};border-left:3px solid ${sColor};" data-sample-idx="${idx}">
                                    <td style="padding:4px 6px;font-size:10px;white-space:nowrap;">${time}${eventBadge}</td>
                                    ${kpiValues}
                                </tr>`;
                        });
                        
                        // Determine column headers based on technology
                        let headers = '';
                        if (tech === 'NR') {
                            headers = '<th>NR-RSRP</th><th>NR-RSRQ</th><th>NR-SINR</th><th>PCI</th>';
                        } else if (tech === 'LTE') {
                            headers = '<th>RSRP</th><th>RSRQ</th><th>SINR</th><th>PCI</th>';
                        } else if (tech === 'UMTS') {
                            headers = '<th>RSCP</th><th>Ec/No</th><th>-</th><th>PSC</th>';
                        } else if (tech === 'GSM') {
                            headers = '<th>RxLev</th><th>RxQual</th><th>-</th><th>BSIC</th>';
                        }
                        
                        // Event info message
                        const eventInfo = eventCount > 0 ? `<br/><small style="color:#f97316;">⚡ Includes ${eventCount} event sample${eventCount > 1 ? 's' : ''}</small>` : '';
                        
                        const popupContent = `
                            <div style="font-family:'JetBrains Mono',monospace;font-size:11px;max-width:450px;">
                                <div style="font-weight:800;color:#1f2937;margin-bottom:8px;border-bottom:2px solid #3b82f6;padding-bottom:4px;display:flex;justify-content:space-between;align-items:center;">
                                    <span>📍 ${tech} - ${totalCount} Samples</span>
                                    <button id="playTimelineBtn" style="background:#3b82f6;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:10px;font-weight:bold;">▶ Play</button>
                                </div>
                                <div style="margin:8px 0;padding:8px;background:#fef3c7;border-left:3px solid #f59e0b;font-size:10px;">
                                    <b>⚠️ ${totalCount} samples at same location</b><br/>
                                    <small>Time range: ${timeRange}${eventInfo}</small>
                                </div>
                                
                                <!-- Timeline Playback Controls -->
                                <div id="timelineControls" style="display:none;margin:8px 0;padding:8px;background:#dbeafe;border-left:3px solid #3b82f6;border-radius:4px;">
                                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                                        <div style="font-size:10px;font-weight:bold;">Timeline Playback</div>
                                        <div style="display:flex;gap:4px;">
                                            <button id="prevSampleBtn" style="background:#6b7280;color:white;border:none;padding:2px 6px;border-radius:3px;cursor:pointer;font-size:10px;">◀</button>
                                            <button id="pauseTimelineBtn" style="background:#ef4444;color:white;border:none;padding:2px 8px;border-radius:3px;cursor:pointer;font-size:10px;">⏸</button>
                                            <button id="nextSampleBtn" style="background:#6b7280;color:white;border:none;padding:2px 6px;border-radius:3px;cursor:pointer;font-size:10px;">▶</button>
                                        </div>
                                    </div>
                                    <div style="font-size:10px;color:#1f2937;margin-bottom:4px;">
                                        Sample <span id="currentSampleNum">1</span> of ${totalCount} - <span id="currentSampleTime">${allSamples[0].row.time?.split('T')[1]?.slice(0, 8) || '-'}</span>
                                    </div>
                                    <input type="range" id="timelineSlider" min="0" max="${totalCount - 1}" value="0" style="width:100%;cursor:pointer;" />
                                </div>
                                
                                <div style="max-height:250px;overflow-y:scroll;margin-top:8px;border:1px solid #e5e7eb;border-radius:4px;box-shadow:inset 0 2px 4px rgba(0,0,0,0.06);">
                                    <table style="width:100%;border-collapse:collapse;font-size:10px;">
                                        <thead style="position:sticky;top:0;background:#1f2937;color:white;z-index:1;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                                            <tr>
                                                <th style="padding:6px;text-align:left;font-weight:600;">Time</th>
                                                ${headers}
                                            </tr>
                                        </thead>
                                        <tbody id="sampleTableBody">
                                            ${tableRows}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div style="margin-top:8px;padding:6px;background:#f3f4f6;border-radius:4px;font-size:9px;color:#6b7280;">
                                    💡 Click Play to animate through samples or use the table to compare KPIs
                                </div>
                            </div>
                        `;
                        
                        const popup = new maplibregl.Popup({ 
                            offset: 10,
                            maxWidth: '500px',
                            className: 'timeline-popup'
                        }).setHTML(popupContent);
                        
                        // Add timeline playback functionality
                        popup.on('open', () => {
                            let currentSampleIndex = 0;
                            let playInterval = null;
                            const timelineControls = document.getElementById('timelineControls');
                            const playBtn = document.getElementById('playTimelineBtn');
                            const pauseBtn = document.getElementById('pauseTimelineBtn');
                            const prevBtn = document.getElementById('prevSampleBtn');
                            const nextBtn = document.getElementById('nextSampleBtn');
                            const slider = document.getElementById('timelineSlider');
                            const tableBody = document.getElementById('sampleTableBody');
                            
                            function highlightSample(index) {
                                currentSampleIndex = index;
                                // Update UI
                                document.getElementById('currentSampleNum').textContent = index + 1;
                                document.getElementById('currentSampleTime').textContent = allSamples[index].row.time?.split('T')[1]?.slice(0, 8) || '-';
                                slider.value = index;
                                
                                // Highlight row in table
                                const rows = tableBody.querySelectorAll('tr');
                                rows.forEach((row, idx) => {
                                    if (idx === index) {
                                        row.style.background = '#dbeafe';
                                        row.style.fontWeight = 'bold';
                                        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                    } else {
                                        row.style.background = idx % 2 === 0 ? '#f9fafb' : '#fff';
                                        row.style.fontWeight = 'normal';
                                    }
                                });
                            }
                            
                            function playTimeline() {
                                timelineControls.style.display = 'block';
                                playBtn.style.display = 'none';
                                highlightSample(0);
                                
                                playInterval = setInterval(() => {
                                    if (currentSampleIndex < totalCount - 1) {
                                        highlightSample(currentSampleIndex + 1);
                                    } else {
                                        clearInterval(playInterval);
                                        playBtn.style.display = 'inline-block';
                                        playBtn.textContent = '🔄 Replay';
                                    }
                                }, 800); // 800ms per sample
                            }
                            
                            function pauseTimeline() {
                                if (playInterval) {
                                    clearInterval(playInterval);
                                    playInterval = null;
                                    playBtn.style.display = 'inline-block';
                                    playBtn.textContent = '▶ Resume';
                                }
                            }
                            
                            playBtn.addEventListener('click', playTimeline);
                            pauseBtn.addEventListener('click', pauseTimeline);
                            prevBtn.addEventListener('click', () => {
                                if (currentSampleIndex > 0) highlightSample(currentSampleIndex - 1);
                            });
                            nextBtn.addEventListener('click', () => {
                                if (currentSampleIndex < totalCount - 1) highlightSample(currentSampleIndex + 1);
                            });
                            slider.addEventListener('input', (e) => {
                                pauseTimeline();
                                highlightSample(parseInt(e.target.value));
                            });
                            
                            // Click on table row to jump to that sample
                            tableBody.querySelectorAll('tr').forEach((row, idx) => {
                                row.style.cursor = 'pointer';
                                row.addEventListener('click', () => {
                                    pauseTimeline();
                                    highlightSample(idx);
                                });
                            });
                        });
                        
                        markers.push(new maplibregl.Marker({ element: el }).setLngLat([p.lon, p.lat]).setPopup(popup).addTo(map));
                    }
            });

            // Event markers - only create separate markers for events NOT in location groups
            const groupedEventLocations = new Set();
            Object.entries(locationGroups).forEach(([key, groupData]) => {
                if (groupData.withEvent.length > 0 && groupData.all.length > 1) {
                    // This location has events AND multiple samples, so events are included in the group popup
                    groupData.withEvent.forEach(evt => {
                        groupedEventLocations.add(`${evt.lat.toFixed(6)},${evt.lon.toFixed(6)},${evt.originalIndex}`);
                    });
                }
            });
            
            coords.filter(p => p.row.event && p.row.event.trim() !== '').forEach((p, i) => {
                // Skip if this event is part of a multi-sample location group
                const eventKey = `${p.lat.toFixed(6)},${p.lon.toFixed(6)},${p.originalIndex}`;
                if (groupedEventLocations.has(eventKey)) {
                    console.log(`Skipping separate event marker for ${eventKey} - already in group popup`);
                    return;
                }
                
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
                        <div style="margin:4px 0;"><b>Time:</b> ${getFullTimestamp(row)}</div>
                        <div style="margin:4px 0;"><b>Latitude:</b> ${p.lat.toFixed(6)}</div>
                        <div style="margin:4px 0;"><b>Longitude:</b> ${p.lon.toFixed(6)}</div>
                        ${kpiContent}
                    </div>
                `;
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
                // If zoom modal is open, re-render mentor charts with new filtered data
                setTimeout(() => {
                    try {
                        const modal = document.getElementById('chartZoomModal');
                        if (modal && modal.style.display === 'flex') renderMentorCharts(parsedData, currentKpiType);
                    } catch (err) { console.warn('mentor charts update after tech change failed', err); }
                }, 250);
            }
        });
        
        // Polynomial degree selector change handler
        document.getElementById('polynomialDegreeSelector').addEventListener('change', function(e) {
            polynomialDegree = parseInt(e.target.value, 10);
            
            // Warn user about high-degree polynomials
            if (polynomialDegree >= 6) {
                console.warn('⚠️ High-degree polynomial (degree ' + polynomialDegree + ') may overfit data and show oscillations. Consider using degree 2-3 for most telecom KPI analysis.');
            }
            
            // Re-render scatter plots with new polynomial degree
            if (parsedData.length > 0) {
                renderCorrelationScatters();
            }
            
            // If zoom modal is open, update the zoomed chart immediately
            const modal = document.getElementById('chartZoomModal');
            if (modal && modal.style.display === 'flex' && zoomedChart) {
                // Save the current legend state (which datasets are hidden)
                const legendState = {};
                if (zoomedChart.data && zoomedChart.data.datasets) {
                    zoomedChart.data.datasets.forEach((dataset, index) => {
                        legendState[index] = zoomedChart.isDatasetVisible(index);
                    });
                }
                
                const chartTitle = document.getElementById('chartZoomTitle')?.textContent || '';
                
                // Find the corresponding main chart instance
                // For 2G/3G: RxLev and RSCP are shown in scatterTputRsrp (not scatterTputSinr which is hidden)
                // For 4G/5G: SINR is shown in scatterTputSinr, RSRP in scatterTputRsrp
                let mainChartInstance = null;
                if (chartTitle.includes('RxLev') || chartTitle.includes('RSCP') || chartTitle.includes('RSRP')) {
                    // RxLev (2G), RSCP (3G), and RSRP (4G/5G) all use scatterTputRsrp
                    mainChartInstance = scatterTputRsrp;
                } else if (chartTitle.includes('BLER')) {
                    mainChartInstance = scatterBlerTput;
                } else if (chartTitle.includes('MCS') || chartTitle.includes('CQI')) {
                    mainChartInstance = scatterMcsCqi;
                } else if (chartTitle.includes('RxQual') || chartTitle.includes('Ec/No') || chartTitle.includes('RSRQ')) {
                    // RxQual (2G), Ec/No (3G), and RSRQ (4G/5G) all use scatterTputRsrq
                    mainChartInstance = scatterTputRsrq;
                } else if (chartTitle.includes('SINR')) {
                    // SINR (4G/5G only) uses scatterTputSinr
                    mainChartInstance = scatterTputSinr;
                }
                
                // Wait for main charts to update, then re-open zoom with updated data
                setTimeout(() => {
                    if (mainChartInstance) {
                        openChartZoom(chartTitle, mainChartInstance);
                        
                        // Restore the legend state after chart is created
                        setTimeout(() => {
                            if (zoomedChart && zoomedChart.data && zoomedChart.data.datasets) {
                                zoomedChart.data.datasets.forEach((dataset, index) => {
                                    if (legendState[index] === false) {
                                        zoomedChart.setDatasetVisibility(index, false);
                                    }
                                });
                                zoomedChart.update();
                            }
                        }, 50);
                    }
                }, 100);
            }
        });

        // Include idle samples toggle handler
        document.getElementById('includeIdleSamples')?.addEventListener('change', function(e) {
            const includeIdle = e.target.checked;
            
            // Re-render scatter plots with new filtering setting
            if (parsedData.length > 0) {
                renderCorrelationScatters();
            }
            
            // If zoom modal is open, update the zoomed chart immediately
            const modal = document.getElementById('chartZoomModal');
            if (modal && modal.style.display === 'flex' && zoomedChart) {
                // Save the current legend state (which datasets are hidden)
                const legendState = {};
                if (zoomedChart.data && zoomedChart.data.datasets) {
                    zoomedChart.data.datasets.forEach((dataset, index) => {
                        legendState[index] = zoomedChart.isDatasetVisible(index);
                    });
                }
                
                const chartTitle = document.getElementById('chartZoomTitle')?.textContent || '';
                
                // Find the corresponding main chart instance
                // For 2G/3G: RxLev and RSCP are shown in scatterTputRsrp (not scatterTputSinr which is hidden)
                // For 4G/5G: SINR is shown in scatterTputSinr, RSRP in scatterTputRsrp
                let mainChartInstance = null;
                if (chartTitle.includes('RxLev') || chartTitle.includes('RSCP') || chartTitle.includes('RSRP')) {
                    // RxLev (2G), RSCP (3G), and RSRP (4G/5G) all use scatterTputRsrp
                    mainChartInstance = scatterTputRsrp;
                } else if (chartTitle.includes('BLER')) {
                    mainChartInstance = scatterBlerTput;
                } else if (chartTitle.includes('MCS') || chartTitle.includes('CQI')) {
                    mainChartInstance = scatterMcsCqi;
                } else if (chartTitle.includes('RxQual') || chartTitle.includes('Ec/No') || chartTitle.includes('RSRQ')) {
                    // RxQual (2G), Ec/No (3G), and RSRQ (4G/5G) all use scatterTputRsrq
                    mainChartInstance = scatterTputRsrq;
                } else if (chartTitle.includes('SINR')) {
                    // SINR (4G/5G only) uses scatterTputSinr
                    mainChartInstance = scatterTputSinr;
                }
                
                // Wait for main charts to update, then re-open zoom with updated data
                setTimeout(() => {
                    if (mainChartInstance) {
                        openChartZoom(chartTitle, mainChartInstance);
                        
                        // Restore the legend state after chart is created
                        setTimeout(() => {
                            if (zoomedChart && zoomedChart.data && zoomedChart.data.datasets) {
                                zoomedChart.data.datasets.forEach((dataset, index) => {
                                    if (legendState[index] === false) {
                                        zoomedChart.setDatasetVisibility(index, false);
                                    }
                                });
                                zoomedChart.update();
                            }
                        }, 50);
                    }
                }, 100);
            }
        });

        // Show raw trendline toggle handler (zoom modal version)
        let isUpdatingZoom = false; // Prevent recursive triggers
        
        document.getElementById('showRawTrendlineZoom')?.addEventListener('change', function(e) {
            if (isUpdatingZoom) {
                return; // Prevent recursive calls
            }
            
            const showRaw = e.target.checked;
            
            // Store the state globally so renderCorrelationScatters can use it
            window.showRawTrendlineState = showRaw;
            
            // Re-render the main charts first with the new state
            if (parsedData.length > 0) {
                renderCorrelationScatters();
            }
            
            // If zoom modal is open, update the zoomed chart immediately
            const modal = document.getElementById('chartZoomModal');
            if (modal && modal.style.display === 'flex' && zoomedChart) {
                // Save the current legend state (which datasets are hidden)
                const legendState = {};
                if (zoomedChart.data && zoomedChart.data.datasets) {
                    zoomedChart.data.datasets.forEach((dataset, index) => {
                        legendState[index] = zoomedChart.isDatasetVisible(index);
                    });
                }
                
                // Get the current chart title to determine which scatter plot is open
                const chartTitle = document.getElementById('chartZoomTitle')?.textContent || '';
                
                // Find the corresponding main chart instance
                // For 2G/3G: RxLev and RSCP are shown in scatterTputRsrp (not scatterTputSinr which is hidden)
                // For 4G/5G: SINR is shown in scatterTputSinr, RSRP in scatterTputRsrp
                let mainChartInstance = null;
                if (chartTitle.includes('RxLev') || chartTitle.includes('RSCP') || chartTitle.includes('RSRP')) {
                    // RxLev (2G), RSCP (3G), and RSRP (4G/5G) all use scatterTputRsrp
                    mainChartInstance = scatterTputRsrp;
                } else if (chartTitle.includes('BLER')) {
                    mainChartInstance = scatterBlerTput;
                } else if (chartTitle.includes('MCS') || chartTitle.includes('CQI')) {
                    mainChartInstance = scatterMcsCqi;
                } else if (chartTitle.includes('RxQual') || chartTitle.includes('Ec/No') || chartTitle.includes('RSRQ')) {
                    // RxQual (2G), Ec/No (3G), and RSRQ (4G/5G) all use scatterTputRsrq
                    mainChartInstance = scatterTputRsrq;
                } else if (chartTitle.includes('SINR')) {
                    // SINR (4G/5G only) uses scatterTputSinr
                    mainChartInstance = scatterTputSinr;
                }
                
                // Wait for main charts to update, then re-open zoom with updated data
                setTimeout(() => {
                    if (mainChartInstance) {
                        isUpdatingZoom = true; // Set flag before updating
                        openChartZoom(chartTitle, mainChartInstance);
                        // Ensure checkbox state is preserved after re-opening
                        const zoomCheckbox = document.getElementById('showRawTrendlineZoom');
                        if (zoomCheckbox) {
                            zoomCheckbox.checked = showRaw;
                        }
                        
                        // Restore the legend state after chart is created
                        setTimeout(() => {
                            if (zoomedChart && zoomedChart.data && zoomedChart.data.datasets) {
                                zoomedChart.data.datasets.forEach((dataset, index) => {
                                    if (legendState[index] === false) {
                                        zoomedChart.setDatasetVisibility(index, false);
                                    }
                                });
                                zoomedChart.update();
                            }
                        }, 50);
                        
                        isUpdatingZoom = false; // Clear flag after updating
                    }
                }, 150);
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
            // Initialize the global state for raw trendline (default: OFF)
            window.showRawTrendlineState = false;
            
            loadSavedState();
            loadChartVisibility();
            initializeChartVisibilityControls();
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

        function updateModalTheme() {
            const modal = document.getElementById('chartZoomModal');
            const modalContent = document.getElementById('chartZoomModalContent');
            
            if (!modal || !modalContent) return;
            
            if (kpiTheme === 'dark') {
                modal.classList.add('dark');
                modalContent.style.background = 'var(--card-bg-dark)';
                
                // Apply dark mode to mentor grid panels
                const mentorPanels = document.querySelectorAll('.mentor-grid-panel');
                mentorPanels.forEach(panel => {
                    panel.style.background = '#1a1f2e';
                    panel.style.borderColor = '#2d3748';
                    
                    // Update text colors in panels
                    const textElements = panel.querySelectorAll('div[style*="color"]');
                    textElements.forEach(el => {
                        if (el.style.color === 'rgb(55, 65, 81)' || el.style.color === '#374151') {
                            el.style.color = '#9ca3af';
                        }
                        if (el.style.color === 'rgb(107, 114, 128)' || el.style.color === '#6b7280') {
                            el.style.color = '#9ca3af';
                        }
                    });
                });
                
                // Apply dark mode to mentor grid background
                const mentorGrid = document.getElementById('mentorOverviewGrid');
                if (mentorGrid) {
                    mentorGrid.style.background = '#0f172a';
                    mentorGrid.style.borderBottomColor = '#2d3748';
                }
                
                // Apply dark mode to main content area
                const mainContentDivs = document.querySelectorAll('#chartZoomModalContent > div');
                mainContentDivs.forEach(div => {
                    if (div.style.background && div.style.background.includes('#f8f9fa')) {
                        div.style.background = '#0f172a';
                    }
                });
            } else {
                modal.classList.remove('dark');
                modalContent.style.background = 'var(--card-bg-light)';
                
                // Reset mentor grid panels to light mode
                const mentorPanels = document.querySelectorAll('.mentor-grid-panel');
                mentorPanels.forEach(panel => {
                    panel.style.background = '#fff';
                    panel.style.borderColor = '#d1d5db';
                    
                    // Reset text colors
                    const textElements = panel.querySelectorAll('div[style*="color"]');
                    textElements.forEach(el => {
                        if (el.style.color === 'rgb(156, 163, 175)' || el.style.color === '#9ca3af') {
                            // Restore original colors
                            const originalStyle = el.getAttribute('style');
                            if (originalStyle && originalStyle.includes('374151')) {
                                el.style.color = '#374151';
                            } else if (originalStyle && originalStyle.includes('6b7280')) {
                                el.style.color = '#6b7280';
                            }
                        }
                    });
                });
                
                // Reset mentor grid background
                const mentorGrid = document.getElementById('mentorOverviewGrid');
                if (mentorGrid) {
                    mentorGrid.style.background = '#f1f3f5';
                    mentorGrid.style.borderBottomColor = '#d1d5db';
                }
                
                // Reset main content area
                const mainContentDivs = document.querySelectorAll('#chartZoomModalContent > div');
                mainContentDivs.forEach(div => {
                    if (div.style.background && div.style.background.includes('#0f172a')) {
                        div.style.background = '#f8f9fa';
                    }
                });
            }
        }

        function openChartZoom(chartTitle, chartInstance) {
            const modal = document.getElementById('chartZoomModal');
            const title = document.getElementById('chartZoomTitle');
            const chartContainer = document.getElementById('chartZoomContainer');
            const scatterControls = document.getElementById('zoomScatterControls');
            const mentorGrid = document.getElementById('mentorOverviewGrid');
            const modalContent = document.getElementById('chartZoomModalContent') || modal.querySelector('div');

            modal.classList.add('enterprise-modal');
            updateModalTheme();

            if (window.multiKpiCharts && window.multiKpiCharts.length > 0) {
                window.multiKpiCharts.forEach(chart => chart.destroy());
                window.multiKpiCharts = [];
            }

            if (zoomedChart) {
                zoomedChart.destroy();
                zoomedChart = null;
            }

            const isScatterPlot = chartTitle.includes('Throughput vs') || chartTitle.includes('MCS vs CQI');
            if (scatterControls) {
                scatterControls.style.display = isScatterPlot ? 'flex' : 'none';
            }

            if (chartContainer) {
                chartContainer.innerHTML = '<canvas id="chartZoomCanvas"></canvas>';
                chartContainer.style.flex = '1';
                chartContainer.style.border = '3px solid white';
                chartContainer.style.padding = '20px';
                chartContainer.style.overflow = 'hidden';
                chartContainer.style.display = 'block';
                chartContainer.style.flexDirection = '';
                chartContainer.style.gap = '';
                chartContainer.style.overflowY = '';
                chartContainer.style.overflowX = '';
            }

            const canvas = document.getElementById('chartZoomCanvas');
            title.textContent = chartTitle;
            modal.style.display = 'flex';

            if (mentorGrid) mentorGrid.style.display = 'grid';

            if (isScatterPlot) {
                setTimeout(() => {
                    const degreeSelector = document.getElementById('polynomialDegreeSelector');
                    if (degreeSelector) {
                        degreeSelector.value = polynomialDegree.toString();
                    }
                    const idleSamplesCheckbox = document.getElementById('includeIdleSamples');
                    if (idleSamplesCheckbox) {
                        idleSamplesCheckbox.checked = document.getElementById('includeIdleSamples')?.checked || false;
                    }
                    const rawTrendCheckbox = document.getElementById('showRawTrendlineZoom');
                    if (rawTrendCheckbox) {
                        rawTrendCheckbox.checked = window.showRawTrendlineState || false;
                    }
                }, 10);
            }

            const textColor = kpiTheme === 'dark' ? '#fff' : '#1f2937';
            const gridColor = kpiTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
            const tickColor = kpiTheme === 'dark' ? '#9ca3af' : '#4b5563';

            if (canvas) {
                canvas.width = canvas.offsetWidth || 800;
                canvas.height = canvas.offsetHeight || 500;
            }
            
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
                
                // Status badge - Enhanced to handle all metric types
                let status = 'UNKNOWN';
                let statusClass = 'poor';
                
                // Signal metrics (RSRP, RSCP, RxLev, RSRQ, Ec/No, RxQual, SINR)
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
                // CQI metric (0-15 scale)
                else if (chartTitle.includes('CQI')) {
                    if (current >= 12) { status = 'EXCELLENT'; statusClass = 'excellent'; }
                    else if (current >= 9) { status = 'GOOD'; statusClass = 'good'; }
                    else if (current >= 6) { status = 'FAIR'; statusClass = 'fair'; }
                    else { status = 'POOR'; statusClass = 'poor'; }
                }
                // MCS metric (0-28 for LTE, 0-31 for NR)
                else if (chartTitle.includes('MCS')) {
                    if (current >= 20) { status = 'EXCELLENT'; statusClass = 'excellent'; }
                    else if (current >= 15) { status = 'GOOD'; statusClass = 'good'; }
                    else if (current >= 10) { status = 'FAIR'; statusClass = 'fair'; }
                    else { status = 'POOR'; statusClass = 'poor'; }
                }
                // BLER metric (percentage, lower is better)
                else if (chartTitle.includes('BLER')) {
                    if (current <= 2) { status = 'EXCELLENT'; statusClass = 'excellent'; }
                    else if (current <= 5) { status = 'GOOD'; statusClass = 'good'; }
                    else if (current <= 10) { status = 'FAIR'; statusClass = 'fair'; }
                    else { status = 'POOR'; statusClass = 'poor'; }
                }
                // Throughput metrics (Mbps, higher is better)
                else if (chartTitle.includes('Throughput') || chartTitle.includes('Mbps')) {
                    if (current >= 50) { status = 'EXCELLENT'; statusClass = 'excellent'; }
                    else if (current >= 20) { status = 'GOOD'; statusClass = 'good'; }
                    else if (current >= 5) { status = 'FAIR'; statusClass = 'fair'; }
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
                    document.getElementById('qualityExcellent').textContent = exPct > 2 ? exPct + '%' : '';
                    document.getElementById('qualityGood').style.width = gdPct + '%';
                    document.getElementById('qualityGood').textContent = gdPct > 2 ? gdPct + '%' : '';
                    document.getElementById('qualityFair').style.width = frPct + '%';
                    document.getElementById('qualityFair').textContent = frPct > 2 ? frPct + '%' : '';
                    document.getElementById('qualityPoor').style.width = prPct + '%';
                    document.getElementById('qualityPoor').textContent = prPct > 2 ? prPct + '%' : '';
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
                } else if (tech === 'UMTS') {
                    networkStatus = '3G UMTS Network Active';
                } else if (tech === 'NR') {
                    networkStatus = '5G NR Network Active';
                } else {
                    networkStatus = '4G LTE Network Active';
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
                
                // Calculate real Coverage percentage (samples with good signal / total)
                let coverageThreshold = -100; // Default for LTE/NR
                if (tech === 'GSM') coverageThreshold = -95;
                else if (tech === 'UMTS') coverageThreshold = -105;
                
                const samplesWithCoverage = values.filter(v => v >= coverageThreshold).length;
                const coveragePct = ((samplesWithCoverage / values.length) * 100).toFixed(1);
                const coverageEl = document.getElementById('networkCoverage');
                coverageEl.textContent = `${coveragePct}% ${coveragePct >= 95 ? '✓' : '⚠'}`;
                coverageEl.style.color = coveragePct >= 95 ? '#10b981' : coveragePct >= 85 ? '#f59e0b' : '#ef4444';
                
                // Calculate real Handover success rate from parsedData events
                const handoverEvents = parsedData.filter(d => d.event && d.event.toLowerCase().includes('handover'));
                const totalHandovers = handoverEvents.length;
                let handoverSuccessPct = 100; // Default if no handovers
                
                if (totalHandovers > 0) {
                    // Assume handovers are successful unless followed by RLF within next few samples
                    // For simplicity, we'll use a high success rate based on absence of RLF
                    const rlfEvents = parsedData.filter(d => d.event && d.event.toLowerCase().includes('rlf')).length;
                    handoverSuccessPct = Math.max(0, ((totalHandovers - rlfEvents) / totalHandovers) * 100).toFixed(1);
                }
                
                const handoverEl = document.getElementById('networkHandovers');
                if (totalHandovers === 0) {
                    handoverEl.textContent = 'N/A (no handovers)';
                    handoverEl.style.color = '#6b7280';
                } else {
                    handoverEl.textContent = `${handoverSuccessPct}% ${handoverSuccessPct >= 98 ? '✓' : '⚠'}`;
                    handoverEl.style.color = handoverSuccessPct >= 98 ? '#10b981' : handoverSuccessPct >= 95 ? '#f59e0b' : '#ef4444';
                }
                
                // Calculate real Error rate (RLF + failures / total samples)
                const rlfCount = parsedData.filter(d => d.event && d.event.toLowerCase().includes('rlf')).length;
                const detachCount = parsedData.filter(d => d.event && d.event.toLowerCase().includes('detach')).length;
                const totalErrors = rlfCount + detachCount;
                const errorPct = ((totalErrors / parsedData.length) * 100).toFixed(2);
                
                const errorEl = document.getElementById('networkErrors');
                errorEl.textContent = `${errorPct}% ${errorPct <= 0.5 ? '✓' : '✗'}`;
                errorEl.style.color = errorPct <= 0.5 ? '#10b981' : errorPct <= 2 ? '#f59e0b' : '#ef4444';
                
                // Dynamic Alerts - only show relevant alerts
                const alertsContainer = document.getElementById('alertsContainer');
                alertsContainer.innerHTML = ''; // Clear existing alerts
                
                // Alert 1: Signal Degradation (only if samples below threshold exist)
                let signalThreshold = -100; // Default for LTE/NR
                let signalMetricName = 'RSRP';
                if (tech === 'GSM') {
                    signalThreshold = -100;
                    signalMetricName = 'RxLev';
                } else if (tech === 'UMTS') {
                    signalThreshold = -105;
                    signalMetricName = 'RSCP';
                } else if (tech === 'NR') {
                    signalMetricName = 'NR-RSRP';
                }
                
                const poorSignalSamples = values.filter(v => v < signalThreshold).length;
                const poorSignalPct = ((poorSignalSamples / values.length) * 100).toFixed(1);
                
                if (poorSignalSamples > 0 && isSignalChart) {
                    const alertType = poorSignalPct > 20 ? 'error' : 'warning';
                    alertsContainer.innerHTML += `
                        <div class="alert-item ${alertType}">
                            <svg class="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                            <div class="alert-content">
                                <div class="alert-title">Signal Degradation</div>
                                <div class="alert-description">${poorSignalSamples} samples (${poorSignalPct}%) with ${signalMetricName} below ${signalThreshold} dBm</div>
                            </div>
                        </div>
                    `;
                }
                
                // Alert 2: High Error Rate (only if errors exist)
                if (totalErrors > 0) {
                    const errorAlertType = errorPct > 2 ? 'error' : 'warning';
                    alertsContainer.innerHTML += `
                        <div class="alert-item ${errorAlertType}">
                            <svg class="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div class="alert-content">
                                <div class="alert-title">Network Errors Detected</div>
                                <div class="alert-description">${totalErrors} errors (${rlfCount} RLF, ${detachCount} Detach) - ${errorPct}% error rate</div>
                            </div>
                        </div>
                    `;
                }
                
                // Alert 3: Poor Coverage (only if coverage is low)
                if (parseFloat(coveragePct) < 90) {
                    alertsContainer.innerHTML += `
                        <div class="alert-item warning">
                            <svg class="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                            <div class="alert-content">
                                <div class="alert-title">Low Coverage</div>
                                <div class="alert-description">Only ${coveragePct}% of samples have acceptable signal strength</div>
                            </div>
                        </div>
                    `;
                }
                
                // Show "All Clear" message if no alerts
                if (alertsContainer.innerHTML === '') {
                    alertsContainer.innerHTML = `
                        <div style="text-align:center; padding:16px; color:#10b981;">
                            <svg style="width:24px; height:24px; margin:0 auto 8px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div style="font-weight:600; font-size:12px;">All Systems Normal</div>
                            <div style="font-size:10px; color:#6b7280; margin-top:4px;">No alerts detected</div>
                        </div>
                    `;
                }
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

        // Download chart as PNG (high quality) - preserves theme (dark/light mode)
        async function downloadChartPNG() {
            // Check if we have multi-KPI charts or single chart
            const hasMultiKpi = window.multiKpiCharts && window.multiKpiCharts.length > 0;
            
            if (!hasMultiKpi && !zoomedChart) {
                console.warn('No chart available to download');
                return;
            }
            
            try {
                // Get chart title for filename
                const chartTitle = document.getElementById('chartZoomTitle')?.textContent || 'Chart';
                
                // Clean filename: remove emojis, special chars, replace spaces with underscores
                const cleanTitle = chartTitle
                    .replace(/[📊📈📉🔬⚡🔌⚠📶📞↔]/g, '') // Remove emojis
                    .replace(/[^a-z0-9\s]/gi, '') // Remove special chars
                    .trim()
                    .replace(/\s+/g, '_'); // Replace spaces with underscores
                
                // Add date and time
                const now = new Date();
                const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
                const timeStr = now.toTimeString().slice(0, 5).replace(':', '-'); // HH-MM
                
                const filename = `${cleanTitle}_${dateStr}_${timeStr}.png`;
                
                if (hasMultiKpi) {
                    const container = document.getElementById('chartZoomContainer');
                    if (!container) {
                        alert('No chart container available to download');
                        return;
                    }
                    
                    const bgColor = kpiTheme === 'dark' ? '#374151' : '#ffffff';
                    const originalStyles = {
                        height: container.style.height,
                        maxHeight: container.style.maxHeight,
                        overflowY: container.style.overflowY,
                        overflowX: container.style.overflowX,
                        width: container.style.width,
                        position: container.style.position
                    };
                    const fullHeight = container.scrollHeight;
                    const fullWidth = container.scrollWidth;
                    container.style.height = `${fullHeight}px`;
                    container.style.maxHeight = 'none';
                    container.style.overflowY = 'visible';
                    container.style.overflowX = 'visible';
                    container.style.width = `${fullWidth}px`;
                    container.style.position = 'relative';

                    let finalCanvas;
                    try {
                        finalCanvas = await html2canvas(container, {
                            backgroundColor: bgColor,
                            scale: window.devicePixelRatio || 1,
                            useCORS: true,
                            allowTaint: true
                        });
                    } finally {
                        container.style.height = originalStyles.height;
                        container.style.maxHeight = originalStyles.maxHeight;
                        container.style.overflowY = originalStyles.overflowY;
                        container.style.overflowX = originalStyles.overflowX;
                        container.style.width = originalStyles.width;
                        container.style.position = originalStyles.position;
                    }
                    
                    const url = finalCanvas.toDataURL('image/png', 1.0);
                    
                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    console.log(`✅ Multi-KPI chart downloaded as PNG (${kpiTheme} mode): ${filename}`);
                } else {
                    // Single chart: Use existing method
                    const originalCanvas = zoomedChart.canvas;
                    
                    // Create a new canvas with background color (preserves theme)
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = originalCanvas.width;
                    tempCanvas.height = originalCanvas.height;
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    // Fill background based on current theme
                    const bgColor = kpiTheme === 'dark' ? '#374151' : '#ffffff';
                    tempCtx.fillStyle = bgColor;
                    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                    
                    // Draw the chart on top of the background
                    tempCtx.drawImage(originalCanvas, 0, 0);
                    
                    // Get high-resolution image
                    const url = tempCanvas.toDataURL('image/png', 1.0);
                    
                    // Create temporary link and trigger download
                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    console.log(`✅ Chart downloaded as PNG (${kpiTheme} mode): ${filename}`);
                }
            } catch (error) {
                console.error('❌ Error downloading chart as PNG:', error);
                alert('Failed to download chart. Please try again.');
            }
        }

        // Download chart as SVG (vector format) - preserves theme (dark/light mode)
        async function downloadChartSVG() {
            // Check if we have multi-KPI charts or single chart
            const hasMultiKpi = window.multiKpiCharts && window.multiKpiCharts.length > 0;
            
            if (!hasMultiKpi && !zoomedChart) {
                console.warn('No chart available to download');
                return;
            }
            
            try {
                // Get chart title for filename
                const chartTitle = document.getElementById('chartZoomTitle')?.textContent || 'Chart';
                
                // Clean filename
                const cleanTitle = chartTitle
                    .replace(/[📊📈📉🔬⚡🔌⚠📶📞↔]/g, '')
                    .replace(/[^a-z0-9\s]/gi, '')
                    .trim()
                    .replace(/\s+/g, '_');
                
                // Add date and time
                const now = new Date();
                const dateStr = now.toISOString().slice(0, 10);
                const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
                
                const filename = `${cleanTitle}_${dateStr}_${timeStr}.svg`;
                
                if (hasMultiKpi) {
                    const container = document.getElementById('chartZoomContainer');
                    if (!container) {
                        alert('No chart container available to download');
                        return;
                    }
                    
                    const bgColor = kpiTheme === 'dark' ? '#374151' : '#ffffff';
                    const originalStyles = {
                        height: container.style.height,
                        maxHeight: container.style.maxHeight,
                        overflowY: container.style.overflowY,
                        overflowX: container.style.overflowX,
                        width: container.style.width,
                        position: container.style.position
                    };
                    const fullHeight = container.scrollHeight;
                    const fullWidth = container.scrollWidth;
                    container.style.height = `${fullHeight}px`;
                    container.style.maxHeight = 'none';
                    container.style.overflowY = 'visible';
                    container.style.overflowX = 'visible';
                    container.style.width = `${fullWidth}px`;
                    container.style.position = 'relative';

                    let finalCanvas;
                    try {
                        finalCanvas = await html2canvas(container, {
                            backgroundColor: bgColor,
                            scale: window.devicePixelRatio || 1,
                            useCORS: true,
                            allowTaint: true
                        });
                    } finally {
                        container.style.height = originalStyles.height;
                        container.style.maxHeight = originalStyles.maxHeight;
                        container.style.overflowY = originalStyles.overflowY;
                        container.style.overflowX = originalStyles.overflowX;
                        container.style.width = originalStyles.width;
                        container.style.position = originalStyles.position;
                    }
                    
                    const imageData = finalCanvas.toDataURL('image/png', 1.0);
                    const width = finalCanvas.width;
                    const height = finalCanvas.height;
                    
                    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <title>${chartTitle}</title>
    <rect width="${width}" height="${height}" fill="${bgColor}"/>
    <image width="${width}" height="${height}" xlink:href="${imageData}"/>
</svg>`;
                    
                    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    
                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    URL.revokeObjectURL(url);
                    
                    console.log(`✅ Multi-KPI chart downloaded as SVG (${kpiTheme} mode): ${filename}`);
                } else {
                    // Single chart: Use existing method
                    const originalCanvas = zoomedChart.canvas;
                    
                    // Create a new canvas with background color (preserves theme)
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = originalCanvas.width;
                    tempCanvas.height = originalCanvas.height;
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    // Fill background based on current theme
                    const bgColor = kpiTheme === 'dark' ? '#374151' : '#ffffff';
                    tempCtx.fillStyle = bgColor;
                    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                    
                    // Draw the chart on top of the background
                    tempCtx.drawImage(originalCanvas, 0, 0);
                    
                    // Convert to PNG data URL
                    const imageData = tempCanvas.toDataURL('image/png');
                    
                    // Create SVG with embedded PNG and background
                    const width = tempCanvas.width;
                    const height = tempCanvas.height;
                    
                    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <title>${chartTitle}</title>
    <rect width="${width}" height="${height}" fill="${bgColor}"/>
    <image width="${width}" height="${height}" xlink:href="${imageData}"/>
</svg>`;
                    
                    // Create blob and download
                    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    
                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // Clean up
                    URL.revokeObjectURL(url);
                    
                    console.log(`✅ Chart downloaded as SVG (${kpiTheme} mode): ${filename}`);
                }
            } catch (error) {
                console.error('❌ Error downloading chart as SVG:', error);
                alert('Failed to download chart as SVG. Please try again.');
            }
        }

        // Toggle download dropdown
        function toggleDownloadDropdown() {
            const dropdown = document.getElementById('downloadDropdown');
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            const downloadBtn = document.getElementById('downloadChartBtn');
            const dropdown = document.getElementById('downloadDropdown');
            
            if (dropdown && !downloadBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        function closeChartZoom() {
            const modal = document.getElementById('chartZoomModal');
            modal.style.display = 'none';
            
            // Hide download dropdown
            const dropdown = document.getElementById('downloadDropdown');
            if (dropdown) {
                dropdown.style.display = 'none';
            }
            
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

        // Download button - toggle dropdown
        document.getElementById('downloadChartBtn').addEventListener('click', function(e) {
            e.stopPropagation();
            toggleDownloadDropdown();
        });

        // Download format options
        document.querySelectorAll('.download-option').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const format = this.getAttribute('data-format');
                
                // Hide dropdown
                document.getElementById('downloadDropdown').style.display = 'none';
                
                // Download in selected format
                if (format === 'png') {
                    downloadChartPNG();
                } else if (format === 'svg') {
                    downloadChartSVG();
                }
            });
        });

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

                        if (canvasId === 'compRsrpOnly' && compRsrpOnly) { chart = compRsrpOnly; title = rsrpLabel; currentKpiType = 'rsrp'; }
                        else if (canvasId === 'compRsrqOnly' && compRsrqOnly) { chart = compRsrqOnly; title = rsrqLabel; currentKpiType = 'rsrq'; }
                        else if (canvasId === 'compSinrOnly' && compSinrOnly) { chart = compSinrOnly; title = sinrLabel; currentKpiType = 'sinr'; }
                        else if (canvasId === 'compTputOnly' && compTputOnly) { chart = compTputOnly; title = 'Throughput DL'; currentKpiType = 'throughput_dl_mbps'; }
                        else if (canvasId === 'compTputUlOnly' && compTputUlOnly) { chart = compTputUlOnly; title = 'Throughput UL'; currentKpiType = 'throughput_ul_mbps'; }
                        else if (canvasId === 'compBlerOnly' && compBlerOnly) { chart = compBlerOnly; title = 'BLER'; currentKpiType = 'bler'; }
                        else if (canvasId === 'compCqiOnly' && compCqiOnly) { chart = compCqiOnly; title = 'CQI'; currentKpiType = 'cqi'; }
                        else if (canvasId === 'compMcsOnly' && compMcsOnly) { chart = compMcsOnly; title = 'MCS'; currentKpiType = 'mcs'; }
                        else if (canvasId === 'compTxPowerOnly' && compTxPowerOnly) { chart = compTxPowerOnly; title = 'Tx Power'; currentKpiType = 'txpower'; }
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
                        else if (canvasId === 'scatterTputRsrq' && scatterTputRsrq) {
                            chart = scatterTputRsrq;
                            const rsrqDisplay = tech === 'NR' ? 'NR-RSRQ' : tech === 'UMTS' ? 'Ec/No' : tech === 'GSM' ? 'RxQual' : 'RSRQ';
                            title = `Throughput vs ${rsrqDisplay}`;
                            currentKpiType = 'rsrq';
                        }
                        else if (canvasId === 'scatterMcsCqi' && scatterMcsCqi) { chart = scatterMcsCqi; title = 'MCS vs CQI'; currentKpiType = 'cqi'; }
                        else if (canvasId === 'scatterBlerTput' && scatterBlerTput) { chart = scatterBlerTput; title = 'Throughput vs BLER'; currentKpiType = 'bler'; }
                        
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
                document.querySelectorAll('#kpiPanel .kpi-tab, #kpiPanel .chart-type-btn, #kpiPanel #customizeChartsBtn').forEach(el => {
                    el.classList.remove('border-white');
                    el.classList.add('border-gray-400');
                    // Switch inactive button background to light
                    if (!el.classList.contains('bg-blue-600')) {
                        el.classList.remove('bg-gray-700', 'text-white');
                        el.classList.add('bg-gray-200', 'text-gray-900');
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
                document.querySelectorAll('#kpiPanel .kpi-tab, #kpiPanel .chart-type-btn, #kpiPanel #customizeChartsBtn').forEach(el => {
                    el.classList.remove('border-gray-400');
                    el.classList.add('border-white');
                    // Switch inactive button background to dark
                    if (!el.classList.contains('bg-blue-600')) {
                        el.classList.remove('bg-gray-200', 'text-gray-900');
                        el.classList.add('bg-gray-700', 'text-white');
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
                // Re-render mentor charts if modal is open
                try {
                    const modal = document.getElementById('chartZoomModal');
                    if (modal && modal.style.display === 'flex') {
                        renderMentorCharts(parsedData, currentKpiType);
                        
                        // Update modal theme dynamically
                        updateModalTheme();
                    }
                } catch (err) { console.warn('mentor charts update after theme change failed', err); }
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
            
            const labels = parsedData.map((d, i) => getShortTimestamp(d) || `Point ${i+1}`);
            const tech = detectedTechnology || 'LTE';
            const kpiColor = '#3b82f6';
            
            const datasets = selectedKpis.map((kpiObj) => {
                const { kpi, unit, axis } = kpiObj;
                let values = [];
                let label = kpi.toUpperCase();
                
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
                    values = parsedData.map(d => {
                        const val = parseFloat(d.TxPower || d.txpower || d.TXPOWER || d.tx_power);
                        return isNaN(val) ? 0 : val;
                    });
                    label = 'Tx Power';
                } else {
                    values = parsedData.map(d => parseFloat(d[kpi]) || 0);
                }
                
                return {
                    label: unit ? `${label} (${unit})` : label,
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
                    spanGaps: false
                };
            });
            
            const hasLeftAxis = selectedKpis.some(k => k.axis === 'left');
            const hasRightAxis = selectedKpis.some(k => k.axis === 'right');
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
        
        function updateObservationPanel(index, labels, selectedKpis, datasets) {
            const panel = document.getElementById('observationPanel');
            const content = document.getElementById('observationContent');
            if (!panel || !content) return;
            if (panel.style.display === 'none') panel.style.display = 'block';
            
            const point = parsedData[index];
            const fullTimestamp = getFullTimestamp(point);
            const textColor = kpiTheme === 'dark' ? '#fff' : '#1f2937';
            const mutedColor = kpiTheme === 'dark' ? '#9ca3af' : '#6b7280';
            const bgColor = kpiTheme === 'dark' ? '#374151' : '#f9fafb';
            const borderColor = kpiTheme === 'dark' ? '#4b5563' : '#e5e7eb';
            
            panel.style.color = textColor;
            panel.style.borderColor = kpiTheme === 'dark' ? '#fff' : '#000';
            
            let html = '';
            html += `<div style="background:${bgColor}; padding:10px; border-radius:4px; margin-bottom:12px; border:1px solid ${borderColor};">`;
            html += `<div style="font-size:10px; color:${mutedColor}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Timestamp</div>`;
            html += `<div style="font-size:13px; font-weight:700; font-family:'JetBrains Mono';">${fullTimestamp || 'N/A'}</div>`;
            html += `</div>`;
            
            if (point) {
                const lat = parseFloat(point.latitude || point.lat);
                const lon = parseFloat(point.longitude || point.lon);
                if (!isNaN(lat) && !isNaN(lon)) {
                    html += `<div style="background:${bgColor}; padding:10px; border-radius:4px; margin-bottom:12px; border:1px solid ${borderColor};">`;
                    html += `<div style="font-size:10px; color:${mutedColor}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">GPS Coordinates</div>`;
                    html += `<div style="font-size:11px; font-family:'JetBrains Mono'; margin-bottom:2px;"><span style="color:${mutedColor};">Lat:</span> <span style="font-weight:700;">${lat.toFixed(6)}</span></div>`;
                    html += `<div style="font-size:11px; font-family:'JetBrains Mono';"><span style="color:${mutedColor};">Lon:</span> <span style="font-weight:700;">${lon.toFixed(6)}</span></div>`;
                    html += `</div>`;
                }
            }
            
            html += `<div style="margin-bottom:12px;">`;
            html += `<div style="font-size:10px; color:${mutedColor}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; font-weight:700;">KPI Values</div>`;
            datasets.forEach((dataset) => {
                const value = dataset.data[index];
                const displayValue = (value !== null && value !== undefined && !isNaN(value)) ? value.toFixed(2) : 'N/A';
                html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:${bgColor}; border-left:3px solid ${dataset.borderColor}; margin-bottom:6px; border-radius:2px;">`;
                html += `<span style="font-size:11px; font-weight:600;">${dataset.label.split('(')[0].trim()}</span>`;
                html += `<span style="font-size:12px; font-weight:700; font-family:'JetBrains Mono';">${displayValue}</span>`;
                html += `</div>`;
            });
            html += `</div>`;
            
            if (point) {
                html += `<div style="border-top:1px solid ${borderColor}; padding-top:12px;">`;
                html += `<div style="font-size:10px; color:${mutedColor}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; font-weight:700;">Metadata</div>`;
                const tech = point.technology || detectedTechnology || 'LTE';
                html += `<div style="display:flex; justify-content:space-between; padding:6px 8px; background:${bgColor}; margin-bottom:4px; border-radius:2px; font-size:11px;">`;
                html += `<span style="color:${mutedColor};">Technology</span>`;
                html += `<span style="font-weight:600;">${tech}</span>`;
                html += `</div>`;
                
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
                const eventTimeline = extractEventTimeline(parsedData);
                const eventsAtIndex = eventTimeline.filter(e => e.index === index);
                
                if (eventsAtIndex.length > 0) {
                    eventsAtIndex.forEach(event => {
                        const icon = getEventIcon(event.type);
                        const isRealEvent = event.type !== 'pci_change' && event.type !== 'tech_change' && event.type !== 'release';
                        if (isRealEvent) {
                            html += `<div style="background:#fef3c7; color:#92400e; padding:8px; border-radius:4px; margin-top:8px; border-left:3px solid #f59e0b; font-size:11px;">`;
                            html += `<div style="font-weight:700; margin-bottom:2px;">${icon} Event: ${event.type.toUpperCase()}</div>`;
                            html += `<div style="font-size:10px;">${event.details}</div>`;
                            html += `</div>`;
                        } else {
                            html += `<div style="background:#dbeafe; color:#1e40af; padding:8px; border-radius:4px; margin-top:8px; border-left:3px solid #3b82f6; font-size:11px;">`;
                            html += `<div style="font-weight:700; margin-bottom:2px;">ℹ️ Info</div>`;
                            html += `<div style="font-size:10px;">${event.details}</div>`;
                            html += `</div>`;
                        }
                    });
                }
                html += `</div>`;
            }
            content.innerHTML = html;
        }
        
        function renderMultiKpiChart(selectedKpis) {
            const data = prepareMultiKpiData(selectedKpis);
            if (!data) {
                alert('⚠️ No data available for selected KPIs');
                return;
            }
            
            const { labels, datasets } = data;
            const eventTimeline = extractEventTimeline(parsedData);
            const modal = document.getElementById('chartZoomModal');
            const title = document.getElementById('chartZoomTitle');
            const modalContent = modal.querySelector('div');
            const chartContainer = document.getElementById('chartZoomContainer');
            
            const tech = detectedTechnology || 'LTE';
            const kpiNames = selectedKpis.map(k => {
                if (k.kpi === 'rsrp') return tech === 'NR' ? 'NR-RSRP' : tech === 'UMTS' ? 'RSCP' : tech === 'GSM' ? 'RxLev' : 'RSRP';
                if (k.kpi === 'rsrq') return tech === 'NR' ? 'NR-RSRQ' : tech === 'UMTS' ? 'Ec/No' : tech === 'GSM' ? 'RxQual' : 'RSRQ';
                if (k.kpi === 'sinr') return tech === 'NR' ? 'NR-SINR' : 'SINR';
                if (k.kpi === 'throughput_dl_mbps') return 'DL Tput';
                if (k.kpi === 'throughput_ul_mbps') return 'UL Tput';
                return k.kpi.toUpperCase();
            }).join(' + ');
            
            title.textContent = `📊 Multi-KPI Analysis: ${kpiNames}`;
            const scatterControls = document.getElementById('zoomScatterControls');
            if (scatterControls) scatterControls.style.display = 'none';
            modal.style.display = 'flex';
            
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
            
            chartContainer.innerHTML = '';
            chartContainer.style.background = bgColor;
            chartContainer.style.overflowY = 'auto';
            chartContainer.style.overflowX = 'hidden';
            chartContainer.style.display = 'flex';
            chartContainer.style.flexDirection = 'column';
            chartContainer.style.gap = '8px';
            chartContainer.style.padding = '12px';
            if (zoomedChart) { zoomedChart.destroy(); zoomedChart = null; }
            if (!window.multiKpiCharts) window.multiKpiCharts = [];
            window.multiKpiCharts.forEach(chart => chart.destroy());
            window.multiKpiCharts = [];
            
            const syncState = { activeIndex: null, isHovering: false };
            const crosshairPlugin = {
                id: 'crosshair',
                afterDraw: (chart) => {
                    if (syncState.activeIndex !== null && syncState.isHovering) {
                        const ctx = chart.ctx;
                        const xAxis = chart.scales.x;
                        const yAxis = chart.scales.y;
                        const x = xAxis.getPixelForValue(syncState.activeIndex);
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(x, yAxis.top);
                        ctx.lineTo(x, yAxis.bottom);
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = kpiTheme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)';
                        ctx.setLineDash([5, 5]);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            };
            
            const numCharts = datasets.length;
            const availableHeight = window.innerHeight * 0.88;
            const titleHeight = 30;
            const containerPadding = 24;
            const gapTotal = (numCharts - 1) * 8;
            const borderTotal = numCharts * 4;
            const wrapperPaddingTotal = numCharts * 16;
            const totalOverhead = containerPadding + gapTotal + borderTotal + wrapperPaddingTotal + (numCharts * titleHeight);
            const chartHeight = Math.max(120, Math.floor((availableHeight - totalOverhead) / numCharts));
            
            datasets.forEach((dataset, index) => {
                const chartWrapper = document.createElement('div');
                chartWrapper.style.background = bgColor;
                chartWrapper.style.border = `2px solid ${kpiTheme === 'dark' ? '#4b5563' : '#e5e7eb'}`;
                chartWrapper.style.borderRadius = '4px';
                chartWrapper.style.padding = '8px 15px 8px 60px';
                chartWrapper.style.minHeight = `${chartHeight + titleHeight}px`;
                chartWrapper.style.position = 'relative';
                chartWrapper.style.boxSizing = 'border-box';
                
                const chartTitle = document.createElement('div');
                chartTitle.textContent = dataset.label;
                chartTitle.style.color = textColor;
                chartTitle.style.fontFamily = 'JetBrains Mono';
                chartTitle.style.fontSize = '11px';
                chartTitle.style.fontWeight = 'bold';
                chartTitle.style.marginBottom = '6px';
                chartTitle.style.paddingBottom = '4px';
                chartTitle.style.borderBottom = `1px solid ${kpiTheme === 'dark' ? '#4b5563' : '#e5e7eb'}`;
                chartWrapper.appendChild(chartTitle);
                
                const canvasWrapper = document.createElement('div');
                canvasWrapper.style.position = 'relative';
                canvasWrapper.style.width = '100%';
                canvasWrapper.style.height = `${chartHeight}px`;
                canvasWrapper.style.overflow = 'visible';
                const canvas = document.createElement('canvas');
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvasWrapper.appendChild(canvas);
                chartWrapper.appendChild(canvasWrapper);
                chartContainer.appendChild(chartWrapper);
                
                const validData = dataset.data.filter(v => v !== null && v !== undefined && !isNaN(v) && isFinite(v));
                let yMin, yMax;
                const kpiName = selectedKpis[index].kpi;
                
                if (kpiName === 'rsrp') {
                    if (tech === 'NR' || tech === 'LTE') { yMin = -110; yMax = -50; }
                    else if (tech === 'UMTS') { yMin = -120; yMax = -25; }
                    else if (tech === 'GSM') {
                        if (validData.length > 0) {
                            const dataMin = Math.min(...validData);
                            const dataMax = Math.max(...validData);
                            yMin = Math.min(dataMin - 10, -110);
                            yMax = Math.max(dataMax + 10, 5);
                        } else { yMin = -110; yMax = 5; }
                    } else { yMin = -110; yMax = -50; }
                } else if (kpiName === 'rsrq') {
                    if (tech === 'NR' || tech === 'LTE') { yMin = -20; yMax = -3; }
                    else if (tech === 'UMTS') { yMin = -24; yMax = 5; }
                    else if (tech === 'GSM') {
                        if (validData.length > 0) {
                            const dataMin = Math.min(...validData);
                            const dataMax = Math.max(...validData);
                            const range = dataMax - dataMin;
                            if (range < 1) {
                                const center = (dataMax + dataMin) / 2;
                                yMin = center - 5;
                                yMax = center + 5;
                            } else {
                                yMin = Math.floor(dataMin - 2);
                                yMax = Math.ceil(dataMax + 2);
                            }
                        } else { yMin = 0; yMax = 7; }
                    } else { yMin = -20; yMax = -3; }
                } else if (kpiName === 'sinr') {
                    if (tech === 'NR' || tech === 'LTE') { yMin = -5; yMax = 31; }
                    else if (validData.length > 0) { yMin = Math.min(...validData); yMax = Math.max(...validData); }
                    else { yMin = -5; yMax = 31; }
                } else if (kpiName === 'bler') { yMin = 0; yMax = 120; }
                else if (kpiName === 'cqi') { yMin = 0; yMax = 15; }
                else if (kpiName === 'mcs') { yMin = 0; yMax = 33; }
                else if (kpiName === 'throughput_dl_mbps' || kpiName === 'throughput_ul_mbps') {
                    if (validData.length > 0) {
                        yMin = Math.min(...validData);
                        yMax = Math.max(...validData);
                        const range = yMax - yMin;
                        const padding = range * 0.1;
                        yMin = Math.max(0, yMin - padding);
                        yMax = yMax + padding;
                    } else { yMin = 0; yMax = 100; }
                } else if (validData.length > 0) {
                    yMin = Math.min(...validData);
                    yMax = Math.max(...validData);
                    const range = yMax - yMin;
                    const padding = range * 0.1;
                    yMin = yMin - padding;
                    yMax = yMax + padding;
                }
                
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
                            spanGaps: false
                        }]
                    },
                    plugins: [crosshairPlugin, multiKpiEventMarkerPlugin],
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: { padding: { left: 20, right: 15, top: 22, bottom: 10 } },
                        interaction: { mode: 'index', intersect: false },
                        plugins: { legend: { display: false }, tooltip: { enabled: false }, multiKpiEventMarkers: { events: eventTimeline } },
                        scales: {
                            x: { display: index === datasets.length - 1, ticks: { color: tickColor, font: { size: 8, family: 'JetBrains Mono' }, maxRotation: 45, minRotation: 45, autoSkip: true, maxTicksLimit: 10 }, grid: { color: gridColor, display: true, drawBorder: true }, title: { display: index === datasets.length - 1, text: 'Time', color: textColor, font: { size: 10, family: 'JetBrains Mono', weight: 'bold' } } },
                            y: { type: 'linear', position: 'left', min: yMin, max: yMax, ticks: { color: tickColor, font: { family: 'JetBrains Mono', size: 8 }, autoSkip: true, maxTicksLimit: 6, padding: 8, align: 'end' }, grid: { color: gridColor, drawBorder: true, offset: false }, offset: false, beginAtZero: false }
                        }
                    },
                    plugins: [crosshairPlugin]
                });
                
                const throttledMouseMove = throttle((e) => {
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const xAxis = chart.scales.x;
                    const xValue = xAxis.getValueForPixel(x);
                    if (xValue !== undefined && xValue >= 0 && xValue < labels.length) {
                        syncState.activeIndex = Math.round(xValue);
                        syncState.isHovering = true;
                        updateObservationPanel(syncState.activeIndex, labels, selectedKpis, datasets);
                        window.multiKpiCharts.forEach(c => c.update('none'));
                    }
                }, 16);
                canvas.addEventListener('mousemove', throttledMouseMove);
                canvas.addEventListener('mouseleave', () => {
                    setTimeout(() => {
                        const modal = document.getElementById('chartZoomModal');
                        const isMouseInModal = modal && modal.matches(':hover');
                        if (!isMouseInModal || !syncState.isHovering) {
                            syncState.isHovering = false;
                            syncState.activeIndex = null;
                            window.multiKpiCharts.forEach(c => {
                                c.tooltip.setActiveElements([]);
                                c.update('none');
                            });
                            const observationContent = document.getElementById('observationContent');
                            if (observationContent) {
                                const textColor = kpiTheme === 'dark' ? '#9ca3af' : '#6b7280';
                                observationContent.innerHTML = `<div style="text-align:center; padding:40px 20px; opacity:0.6; font-size:12px; color:${textColor};">Hover over the charts to view detailed observations</div>`;
                            }
                        }
                    }, 300);
                });
                window.multiKpiCharts.push(chart);
            });
        }
        
        function initMultiKpiComparison() {
            const checkboxes = document.querySelectorAll('.kpi-selector');
            const compareBtn = document.getElementById('compareKpisBtn');
            const countSpan = document.getElementById('selectedKpiCount');
            if (!compareBtn || !countSpan) {
                console.warn('Multi-KPI comparison UI not found');
                return;
            }
            
            function updateSelectedKpis() {
                selectedKpis = [];
                checkboxes.forEach(checkbox => {
                    if (checkbox.checked && checkbox.parentElement.style.display !== 'none') {
                        selectedKpis.push({ kpi: checkbox.dataset.kpi, unit: checkbox.dataset.unit, axis: checkbox.dataset.axis });
                    }
                });
                countSpan.textContent = selectedKpis.length;
                compareBtn.disabled = selectedKpis.length < 2 || selectedKpis.length > 6;
                if (selectedKpis.length < 2 || selectedKpis.length > 6) {
                    compareBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    compareBtn.classList.remove('hover:bg-blue-700');
                } else {
                    compareBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    compareBtn.classList.add('hover:bg-blue-700');
                }
                countSpan.style.color = selectedKpis.length > 6 ? '#ef4444' : '';
            }
            
            window.updateMultiKpiSelectedCount = updateSelectedKpis;
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', updateSelectedKpis);
            });
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
            updateSelectedKpis();
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initMultiKpiComparison);
        } else {
            initMultiKpiComparison();
        }

        // =====================================================
        // MENTOR-STYLE SPARKLINE RENDERING FOR KPI CARDS
        // =====================================================
        function renderMentorSparkline(canvasId, data, color) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
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
