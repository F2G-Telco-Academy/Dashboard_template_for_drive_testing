
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
                            <div style="margin:4px 0;"><b>Time:</b> ${getFullTimestamp(row)}</div>
                            <div style="margin:4px 0;"><b>Latitude:</b> ${p.lat.toFixed(6)}</div>
                            <div style="margin:4px 0;"><b>Longitude:</b> ${p.lon.toFixed(6)}</div>
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
                
                // Build KPI content based on technology
                const tech = row.technology || 'LTE';
                let kpiContent = '';
                
                if (tech === 'NR') {
                    kpiContent = `
                        <div style="margin:4px 0;"><b>NR-RSRP:</b> <span style="color:${p.color};font-weight:bold;">${row.nr_rsrp || '-'} dBm</span></div>
                        <div style="margin:4px 0;"><b>NR-RSRQ:</b> ${row.nr_rsrq || '-'} dB</div>
                        <div style="margin:4px 0;"><b>NR-SINR:</b> ${row.nr_sinr || '-'} dB</div>
                        <div style="margin:4px 0;"><b>NR-PCI:</b> ${row.nr_pci || '-'}</div>`;
                } else if (tech === 'LTE') {
                    kpiContent = `
                        <div style="margin:4px 0;"><b>RSRP:</b> <span style="color:${p.color};font-weight:bold;">${row.rsrp || '-'} dBm</span></div>
                        <div style="margin:4px 0;"><b>RSRQ:</b> ${row.rsrq || '-'} dB</div>
                        <div style="margin:4px 0;"><b>SINR:</b> ${row.sinr || '-'} dB</div>
                        <div style="margin:4px 0;"><b>PCI:</b> ${row.pci || '-'}</div>
                        <div style="margin:4px 0;"><b>Band:</b> ${row.band || '-'}</div>`;
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

                const popup = new maplibregl.Popup({ offset: 15 }).setHTML(`
                    <div style="font-family:'JetBrains Mono',monospace;font-size:11px;">
                        <div style="font-weight:800;color:${evt.color};margin-bottom:8px;border-bottom:2px solid ${evt.color};padding-bottom:4px;">${evt.icon} ${evt.label} (${tech})</div>
                        <div style="margin:4px 0;"><b>Time:</b> ${getFullTimestamp(row)}</div>
                        <div style="margin:4px 0;"><b>Latitude:</b> ${p.lat.toFixed(6)}</div>
                        <div style="margin:4px 0;"><b>Longitude:</b> ${p.lon.toFixed(6)}</div>
                        ${kpiContent}
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
        // TELECOM ZONE SYSTEM FOR MULTI-KPI INVESTIGATION
        // =====================================================
        
        /**
         * Telecom Zone Manager - Professional RF Investigation Zones
         * Synchronized zones spanning ALL KPI charts (like Nemo Analyze / TEMS)
         * Zones are timestamp-based, interactive, and resizable
         */
        const TelecomZoneManager = {
            // State
            zones: [],
            canvases: [],
            contexts: [],
            activeZone: null,
            interactionMode: null, // 'resize-left' | 'resize-right' | 'move' | null
            dragStartX: null,
            dragStartZone: null,
            
            /**
             * Initialize zone canvases for all charts
             */
            init() {
                console.log('🎯 Initializing Telecom Zone System...');
                this.cleanup();
                
                const chartContainer = document.getElementById('chartZoomContainer');
                if (!chartContainer) return;
                
                const chartWrappers = chartContainer.querySelectorAll('div[style*="position: relative"]');
                
                chartWrappers.forEach((wrapper, index) => {
                    const canvasWrapper = wrapper.querySelector('div[style*="position: relative"]');
                    if (!canvasWrapper) return;
                    
                    const chartCanvas = canvasWrapper.querySelector('canvas');
                    if (!chartCanvas) return;
                    
                    // Create zone canvas overlay (below annotation canvas)
                    const zoneCanvas = document.createElement('canvas');
                    zoneCanvas.className = 'zone-canvas';
                    zoneCanvas.dataset.chartIndex = index;
                    
                    zoneCanvas.width = chartCanvas.width;
                    zoneCanvas.height = chartCanvas.height;
                    zoneCanvas.style.width = chartCanvas.style.width;
                    zoneCanvas.style.height = chartCanvas.style.height;
                    
                    canvasWrapper.appendChild(zoneCanvas);
                    
                    this.canvases.push(zoneCanvas);
                    this.contexts.push(zoneCanvas.getContext('2d'));
                    
                    // Add event listeners for zone interaction
                    this.attachEventListeners(zoneCanvas, index);
                    
                    console.log(`✅ Zone canvas ${index} initialized`);
                });
                
                this.redrawAll();
            },
            
            /**
             * Attach event listeners for zone interaction
             */
            attachEventListeners(canvas, chartIndex) {
                canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e, chartIndex));
                canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e, chartIndex));
                canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e, chartIndex));
                canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, chartIndex));
            },
            
            /**
             * Convert data index to pixel X coordinate
             */
            indexToPixel(index, chartIndex) {
                if (!window.multiKpiCharts || !window.multiKpiCharts[chartIndex]) return null;
                const chart = window.multiKpiCharts[chartIndex];
                const xScale = chart.scales.x;
                return xScale.getPixelForValue(index);
            },
            
            /**
             * Convert pixel X coordinate to data index
             */
            pixelToIndex(x, chartIndex) {
                if (!window.multiKpiCharts || !window.multiKpiCharts[chartIndex]) return null;
                const chart = window.multiKpiCharts[chartIndex];
                const xScale = chart.scales.x;
                const index = Math.round(xScale.getValueForPixel(x));
                const labels = chart.data.labels;
                
                if (index < 0 || index >= labels.length) return null;
                
                return {
                    index: index,
                    timestamp: labels[index]
                };
            },
            
            /**
             * Add a new zone
             */
            addZone(startIndex, endIndex, color, label, zoneType = 'custom') {
                const zone = {
                    id: 'zone_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    startIndex: Math.min(startIndex, endIndex),
                    endIndex: Math.max(startIndex, endIndex),
                    color: color,
                    label: label || '',
                    zoneType: zoneType,
                    opacity: 0.15,
                    created: Date.now(),
                    isHovered: false
                };
                
                this.zones.push(zone);
                this.redrawAll();
                console.log(`✅ Added zone "${label}" from index ${zone.startIndex} to ${zone.endIndex}`);
                return zone;
            },
            
            /**
             * Detect zone interaction at mouse position
             */
            detectInteraction(mouseX, chartIndex) {
                const EDGE_THRESHOLD = 10; // pixels
                
                // Check zones in reverse order (newest first)
                for (let i = this.zones.length - 1; i >= 0; i--) {
                    const zone = this.zones[i];
                    const startX = this.indexToPixel(zone.startIndex, chartIndex);
                    const endX = this.indexToPixel(zone.endIndex, chartIndex);
                    
                    if (startX === null || endX === null) continue;
                    
                    // Check left edge
                    if (Math.abs(mouseX - startX) < EDGE_THRESHOLD) {
                        return { type: 'resize-left', zone: zone };
                    }
                    
                    // Check right edge
                    if (Math.abs(mouseX - endX) < EDGE_THRESHOLD) {
                        return { type: 'resize-right', zone: zone };
                    }
                    
                    // Check zone body
                    if (mouseX > startX + EDGE_THRESHOLD && mouseX < endX - EDGE_THRESHOLD) {
                        return { type: 'move', zone: zone };
                    }
                }
                
                return null;
            },
            
            /**
             * Mouse move handler
             */
            handleMouseMove(e, chartIndex) {
                const rect = this.canvases[chartIndex].getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                
                // Handle active drag/resize
                if (this.interactionMode && this.activeZone) {
                    const result = this.pixelToIndex(mouseX, chartIndex);
                    if (!result) return;
                    
                    if (this.interactionMode === 'resize-left') {
                        this.activeZone.startIndex = Math.max(0, Math.min(result.index, this.activeZone.endIndex - 1));
                    } else if (this.interactionMode === 'resize-right') {
                        const maxIndex = window.multiKpiCharts[chartIndex].data.labels.length - 1;
                        this.activeZone.endIndex = Math.min(maxIndex, Math.max(result.index, this.activeZone.startIndex + 1));
                    } else if (this.interactionMode === 'move') {
                        const deltaIndex = result.index - this.dragStartX;
                        const duration = this.dragStartZone.endIndex - this.dragStartZone.startIndex;
                        const maxIndex = window.multiKpiCharts[chartIndex].data.labels.length - 1;
                        
                        let newStart = this.dragStartZone.startIndex + deltaIndex;
                        let newEnd = newStart + duration;
                        
                        // Clamp to valid range
                        if (newStart < 0) {
                            newStart = 0;
                            newEnd = duration;
                        }
                        if (newEnd > maxIndex) {
                            newEnd = maxIndex;
                            newStart = maxEnd - duration;
                        }
                        
                        this.activeZone.startIndex = newStart;
                        this.activeZone.endIndex = newEnd;
                    }
                    
                    this.redrawAll();
                    return;
                }
                
                // Update hover state and cursor
                const interaction = this.detectInteraction(mouseX, chartIndex);
                
                // Clear all hover states
                this.zones.forEach(z => z.isHovered = false);
                
                if (interaction) {
                    interaction.zone.isHovered = true;
                    
                    switch(interaction.type) {
                        case 'resize-left':
                        case 'resize-right':
                            this.canvases[chartIndex].style.cursor = 'ew-resize';
                            break;
                        case 'move':
                            this.canvases[chartIndex].style.cursor = 'move';
                            break;
                    }
                    
                    this.redrawAll();
                } else {
                    this.canvases[chartIndex].style.cursor = '';
                    this.redrawAll();
                }
            },
            
            /**
             * Mouse down handler
             */
            handleMouseDown(e, chartIndex) {
                const rect = this.canvases[chartIndex].getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                
                const interaction = this.detectInteraction(mouseX, chartIndex);
                
                if (interaction) {
                    this.activeZone = interaction.zone;
                    this.interactionMode = interaction.type;
                    
                    const result = this.pixelToIndex(mouseX, chartIndex);
                    if (result) {
                        this.dragStartX = result.index;
                        this.dragStartZone = {
                            startIndex: interaction.zone.startIndex,
                            endIndex: interaction.zone.endIndex
                        };
                    }
                    
                    e.preventDefault();
                    e.stopPropagation();
                }
            },
            
            /**
             * Mouse up handler
             */
            handleMouseUp(e, chartIndex) {
                if (this.interactionMode) {
                    console.log(`✅ Zone "${this.activeZone.label}" updated: ${this.activeZone.startIndex} → ${this.activeZone.endIndex}`);
                }
                
                this.activeZone = null;
                this.interactionMode = null;
                this.dragStartX = null;
                this.dragStartZone = null;
            },
            
            /**
             * Mouse leave handler
             */
            handleMouseLeave(e, chartIndex) {
                this.handleMouseUp(e, chartIndex);
                this.canvases[chartIndex].style.cursor = '';
                this.zones.forEach(z => z.isHovered = false);
                this.redrawAll();
            },
            
            /**
             * Render zone on specific chart
             */
            renderZone(zone, chartIndex) {
                const ctx = this.contexts[chartIndex];
                const canvas = this.canvases[chartIndex];
                
                const startX = this.indexToPixel(zone.startIndex, chartIndex);
                const endX = this.indexToPixel(zone.endIndex, chartIndex);
                
                if (startX === null || endX === null) return;
                
                const width = endX - startX;
                const height = canvas.height;
                
                // Draw semi-transparent fill
                const alpha = Math.floor(zone.opacity * 255).toString(16).padStart(2, '0');
                ctx.fillStyle = zone.color + alpha;
                ctx.fillRect(startX, 0, width, height);
                
                // Draw border lines
                ctx.strokeStyle = zone.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(startX, 0);
                ctx.lineTo(startX, height);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(endX, 0);
                ctx.lineTo(endX, height);
                ctx.stroke();
                
                // Draw resize handles on hover
                if (zone.isHovered) {
                    this.drawResizeHandles(ctx, startX, endX, height, zone.color);
                }
                
                // Draw label at top (first chart only)
                if (chartIndex === 0 && zone.label) {
                    this.drawZoneLabel(ctx, zone.label, startX, endX, zone.color);
                }
            },
            
            /**
             * Draw resize handles
             */
            drawResizeHandles(ctx, startX, endX, height, color) {
                const handleWidth = 8;
                const handleHeight = 40;
                const handleY = (height - handleHeight) / 2;
                
                // Left handle
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.fillRect(startX - handleWidth/2, handleY, handleWidth, handleHeight);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.strokeRect(startX - handleWidth/2, handleY, handleWidth, handleHeight);
                
                // Right handle
                ctx.fillRect(endX - handleWidth/2, handleY, handleWidth, handleHeight);
                ctx.strokeRect(endX - handleWidth/2, handleY, handleWidth, handleHeight);
            },
            
            /**
             * Draw zone label
             */
            drawZoneLabel(ctx, label, startX, endX, color) {
                const centerX = (startX + endX) / 2;
                const textY = 15;
                
                ctx.font = 'bold 12px JetBrains Mono';
                const textMetrics = ctx.measureText(label);
                const textWidth = textMetrics.width;
                const textHeight = 12;
                
                // Background
                ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
                ctx.fillRect(
                    centerX - textWidth/2 - 4,
                    textY - textHeight + 2,
                    textWidth + 8,
                    textHeight + 4
                );
                
                // Border
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    centerX - textWidth/2 - 4,
                    textY - textHeight + 2,
                    textWidth + 8,
                    textHeight + 4
                );
                
                // Text
                ctx.fillStyle = color;
                ctx.textAlign = 'center';
                ctx.fillText(label, centerX, textY);
                ctx.textAlign = 'left';
            },
            
            /**
             * Redraw all zones on specific chart
             */
            redrawChart(chartIndex) {
                if (!this.contexts[chartIndex]) return;
                
                const ctx = this.contexts[chartIndex];
                const canvas = this.canvases[chartIndex];
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                this.zones.forEach(zone => {
                    this.renderZone(zone, chartIndex);
                });
            },
            
            /**
             * Redraw all zones on all charts
             */
            redrawAll() {
                this.canvases.forEach((canvas, index) => {
                    this.redrawChart(index);
                });
            },
            
            /**
             * Delete zone by ID
             */
            deleteZone(zoneId) {
                this.zones = this.zones.filter(z => z.id !== zoneId);
                this.redrawAll();
            },
            
            /**
             * Clear all zones
             */
            clearAll() {
                if (confirm('Clear all investigation zones?')) {
                    this.zones = [];
                    this.redrawAll();
                    console.log('🗑️ All zones cleared');
                }
            },
            
            /**
             * Cleanup
             */
            cleanup() {
                this.canvases.forEach(canvas => {
                    if (canvas.parentNode) {
                        canvas.parentNode.removeChild(canvas);
                    }
                });
                this.canvases = [];
                this.contexts = [];
                this.activeZone = null;
                this.interactionMode = null;
            }
        };
        
        // =====================================================
        // ANNOTATION SYSTEM FOR MULTI-KPI CHARTS
        // =====================================================
        
        /**
         * Annotation Manager - Technology-agnostic annotation system
         * Works dynamically with any number of KPI charts (2G/3G/4G/5G)
         */
        const AnnotationManager = {
            // State
            enabled: false,
            currentTool: 'pen',
            currentColor: '#ef4444',
            lineWidth: 2,
            annotations: [],
            history: [],
            historyIndex: -1,
            canvases: [],
            contexts: [],
            isDrawing: false,
            startPoint: null,
            currentPath: [],
            activeChartIndex: null,
            
            /**
             * Initialize annotation system for all KPI charts in modal
             * Called after multi-KPI charts are rendered
             */
            init() {
                console.log('🎨 Initializing Annotation System...');
                this.cleanup(); // Clean up any existing canvases
                
                // Find all chart wrappers in the zoom modal
                const chartContainer = document.getElementById('chartZoomContainer');
                if (!chartContainer) {
                    console.warn('⚠️ Chart container not found');
                    return;
                }
                
                // Get all dynamically created chart wrappers
                const chartWrappers = chartContainer.querySelectorAll('div[style*="position: relative"]');
                console.log(`📊 Found ${chartWrappers.length} chart wrappers`);
                
                chartWrappers.forEach((wrapper, index) => {
                    // Find the canvas wrapper inside
                    const canvasWrapper = wrapper.querySelector('div[style*="position: relative"]');
                    if (!canvasWrapper) return;
                    
                    const chartCanvas = canvasWrapper.querySelector('canvas');
                    if (!chartCanvas) return;
                    
                    // Create annotation canvas overlay
                    const annoCanvas = document.createElement('canvas');
                    annoCanvas.className = 'annotation-canvas';
                    annoCanvas.dataset.chartIndex = index;
                    
                    // Match chart canvas dimensions
                    const rect = chartCanvas.getBoundingClientRect();
                    annoCanvas.width = chartCanvas.width;
                    annoCanvas.height = chartCanvas.height;
                    annoCanvas.style.width = chartCanvas.style.width;
                    annoCanvas.style.height = chartCanvas.style.height;
                    
                    // Position overlay
                    canvasWrapper.style.position = 'relative';
                    canvasWrapper.appendChild(annoCanvas);
                    
                    // Store canvas and context
                    this.canvases.push(annoCanvas);
                    this.contexts.push(annoCanvas.getContext('2d'));
                    
                    // Add event listeners
                    this.attachEventListeners(annoCanvas, index);
                    
                    console.log(`✅ Annotation canvas ${index} initialized (${annoCanvas.width}x${annoCanvas.height})`);
                });
                
                // Restore annotations if any
                this.redrawAll();
                
                // Setup UI controls
                this.setupControls();
            },
            
            /**
             * Attach mouse event listeners to annotation canvas
             */
            attachEventListeners(canvas, chartIndex) {
                canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e, chartIndex));
                canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e, chartIndex));
                canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e, chartIndex));
                canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, chartIndex));
            },
            
            /**
             * Setup annotation control buttons
             */
            setupControls() {
                // Annotation mode toggle
                const modeBtn = document.getElementById('annotationModeBtn');
                const toolbar = document.getElementById('annotationToolbar');
                const modeText = document.getElementById('annotationModeText');
                
                if (modeBtn) {
                    modeBtn.onclick = () => {
                        this.enabled = !this.enabled;
                        
                        if (this.enabled) {
                            modeBtn.classList.add('active');
                            modeText.textContent = 'ANNOTATING';
                            toolbar.style.display = 'flex';
                            this.enableAnnotationMode();
                        } else {
                            modeBtn.classList.remove('active');
                            modeText.textContent = 'ANNOTATE';
                            toolbar.style.display = 'none';
                            this.disableAnnotationMode();
                        }
                    };
                }
                
                // Tool buttons
                document.querySelectorAll('.anno-tool-btn').forEach(btn => {
                    btn.onclick = () => {
                        this.currentTool = btn.dataset.tool;
                        document.querySelectorAll('.anno-tool-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        this.updateCursor();
                    };
                });
                
                // Color buttons
                document.querySelectorAll('.anno-color-btn').forEach(btn => {
                    btn.onclick = () => {
                        this.currentColor = btn.dataset.color;
                        document.querySelectorAll('.anno-color-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    };
                });
                
                // Set default active states
                document.querySelector('.anno-tool-btn[data-tool="pen"]')?.classList.add('active');
                document.querySelector('.anno-color-btn[data-color="#ef4444"]')?.classList.add('active');
                
                // Action buttons
                const undoBtn = document.getElementById('annoUndoBtn');
                const redoBtn = document.getElementById('annoRedoBtn');
                const clearBtn = document.getElementById('annoClearBtn');
                
                if (undoBtn) undoBtn.onclick = () => this.undo();
                if (redoBtn) redoBtn.onclick = () => this.redo();
                if (clearBtn) clearBtn.onclick = () => this.clearAll();
                
                // Keyboard shortcuts
                document.addEventListener('keydown', (e) => {
                    if (!this.enabled) return;
                    
                    if (e.ctrlKey || e.metaKey) {
                        if (e.key === 'z' && !e.shiftKey) {
                            e.preventDefault();
                            this.undo();
                        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
                            e.preventDefault();
                            this.redo();
                        }
                    }
                });
                
                this.updateUndoRedoButtons();
            },
            
            /**
             * Enable annotation mode - pause chart interactions
             */
            enableAnnotationMode() {
                this.canvases.forEach(canvas => {
                    canvas.classList.add('active');
                });
                this.updateCursor();
                
                // Pause chart hover interactions
                if (window.multiKpiCharts) {
                    window.multiKpiCharts.forEach(chart => {
                        chart.options.interaction.mode = null;
                    });
                }
                
                console.log('✏️ Annotation mode enabled');
            },
            
            /**
             * Disable annotation mode - resume chart interactions
             */
            disableAnnotationMode() {
                this.canvases.forEach(canvas => {
                    canvas.classList.remove('active');
                    canvas.style.cursor = '';
                });
                
                // Resume chart hover interactions
                if (window.multiKpiCharts) {
                    window.multiKpiCharts.forEach(chart => {
                        chart.options.interaction.mode = 'index';
                    });
                }
                
                console.log('✏️ Annotation mode disabled');
            },
            
            /**
             * Update cursor based on current tool
             */
            updateCursor() {
                const cursorClass = `anno-cursor-${this.currentTool}`;
                this.canvases.forEach(canvas => {
                    canvas.className = 'annotation-canvas active ' + cursorClass;
                });
            },
            
            /**
             * Mouse down handler
             */
            handleMouseDown(e, chartIndex) {
                if (!this.enabled) return;
                
                this.isDrawing = true;
                this.activeChartIndex = chartIndex;
                const rect = this.canvases[chartIndex].getBoundingClientRect();
                this.startPoint = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
                
                if (this.currentTool === 'pen') {
                    this.currentPath = [this.startPoint];
                } else if (this.currentTool === 'text') {
                    this.addTextAnnotation(this.startPoint, chartIndex);
                    this.isDrawing = false;
                } else if (this.currentTool === 'eraser') {
                    this.eraseAt(this.startPoint, chartIndex);
                }
            },
            
            /**
             * Mouse move handler
             */
            handleMouseMove(e, chartIndex) {
                if (!this.enabled || !this.isDrawing || this.activeChartIndex !== chartIndex) return;
                
                const rect = this.canvases[chartIndex].getBoundingClientRect();
                const currentPoint = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
                
                if (this.currentTool === 'pen') {
                    this.currentPath.push(currentPoint);
                    this.drawTempPath(chartIndex);
                } else if (this.currentTool === 'eraser') {
                    this.eraseAt(currentPoint, chartIndex);
                } else {
                    // For line, rect, arrow - show preview
                    this.drawTempShape(this.startPoint, currentPoint, chartIndex);
                }
            },
            
            /**
             * Mouse up handler
             */
            handleMouseUp(e, chartIndex) {
                if (!this.enabled || !this.isDrawing || this.activeChartIndex !== chartIndex) return;
                
                const rect = this.canvases[chartIndex].getBoundingClientRect();
                const endPoint = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
                
                // Save annotation
                if (this.currentTool === 'pen' && this.currentPath.length > 1) {
                    this.addAnnotation({
                        type: 'pen',
                        chartIndex,
                        color: this.currentColor,
                        lineWidth: this.lineWidth,
                        points: [...this.currentPath]
                    });
                } else if (this.currentTool === 'line') {
                    this.addAnnotation({
                        type: 'line',
                        chartIndex,
                        color: this.currentColor,
                        lineWidth: this.lineWidth,
                        start: this.startPoint,
                        end: endPoint
                    });
                } else if (this.currentTool === 'rect') {
                    // Rectangle tool now creates TELECOM ZONES spanning all charts
                    const startResult = TelecomZoneManager.pixelToIndex(this.startPoint.x, chartIndex);
                    const endResult = TelecomZoneManager.pixelToIndex(endPoint.x, chartIndex);
                    
                    if (startResult && endResult) {
                        // Prompt for zone label
                        const label = prompt('Enter zone label:', 'Cell Center');
                        if (label) {
                            TelecomZoneManager.addZone(
                                startResult.index,
                                endResult.index,
                                this.currentColor,
                                label,
                                'custom'
                            );
                        }
                    }
                } else if (this.currentTool === 'arrow') {
                    this.addAnnotation({
                        type: 'arrow',
                        chartIndex,
                        color: this.currentColor,
                        lineWidth: this.lineWidth,
                        start: this.startPoint,
                        end: endPoint
                    });
                }
                
                this.isDrawing = false;
                this.currentPath = [];
                this.activeChartIndex = null;
            },
            
            /**
             * Mouse leave handler
             */
            handleMouseLeave(e, chartIndex) {
                if (this.isDrawing && this.activeChartIndex === chartIndex) {
                    this.handleMouseUp(e, chartIndex);
                }
            },
            
            /**
             * Add text annotation
             */
            addTextAnnotation(point, chartIndex) {
                const text = prompt('Enter annotation text:', 'Cell Edge');
                if (!text) return;
                
                this.addAnnotation({
                    type: 'text',
                    chartIndex,
                    color: this.currentColor,
                    fontSize: 14,
                    point,
                    text
                });
            },
            
            /**
             * Erase annotations at point
             */
            eraseAt(point, chartIndex) {
                const eraseRadius = 15;
                let erased = false;
                
                this.annotations = this.annotations.filter(anno => {
                    if (anno.chartIndex !== chartIndex) return true;
                    
                    // Check if point is near annotation
                    if (anno.type === 'pen') {
                        const near = anno.points.some(p => 
                            Math.hypot(p.x - point.x, p.y - point.y) < eraseRadius
                        );
                        if (near) {
                            erased = true;
                            return false;
                        }
                    } else if (anno.type === 'text') {
                        const near = Math.hypot(anno.point.x - point.x, anno.point.y - point.y) < eraseRadius;
                        if (near) {
                            erased = true;
                            return false;
                        }
                    } else if (anno.start && anno.end) {
                        // Check if point is near line/rect/arrow
                        const near = this.isPointNearLine(point, anno.start, anno.end, eraseRadius);
                        if (near) {
                            erased = true;
                            return false;
                        }
                    }
                    
                    return true;
                });
                
                if (erased) {
                    this.redrawAll();
                    this.saveToHistory();
                }
            },
            
            /**
             * Check if point is near a line
             */
            isPointNearLine(point, start, end, threshold) {
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const length = Math.hypot(dx, dy);
                if (length === 0) return Math.hypot(point.x - start.x, point.y - start.y) < threshold;
                
                const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (length * length)));
                const projX = start.x + t * dx;
                const projY = start.y + t * dy;
                const dist = Math.hypot(point.x - projX, point.y - projY);
                
                return dist < threshold;
            },
            
            /**
             * Draw temporary path (for pen tool)
             */
            drawTempPath(chartIndex) {
                const ctx = this.contexts[chartIndex];
                this.clearCanvas(chartIndex);
                this.redrawChart(chartIndex);
                
                if (this.currentPath.length < 2) return;
                
                ctx.strokeStyle = this.currentColor;
                ctx.lineWidth = this.lineWidth;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                ctx.beginPath();
                ctx.moveTo(this.currentPath[0].x, this.currentPath[0].y);
                for (let i = 1; i < this.currentPath.length; i++) {
                    ctx.lineTo(this.currentPath[i].x, this.currentPath[i].y);
                }
                ctx.stroke();
            },
            
            /**
             * Draw temporary shape (for line, rect, arrow)
             */
            drawTempShape(start, end, chartIndex) {
                const ctx = this.contexts[chartIndex];
                this.clearCanvas(chartIndex);
                this.redrawChart(chartIndex);
                
                ctx.strokeStyle = this.currentColor;
                ctx.lineWidth = this.lineWidth;
                ctx.lineCap = 'round';
                
                if (this.currentTool === 'line') {
                    ctx.beginPath();
                    ctx.moveTo(start.x, start.y);
                    ctx.lineTo(end.x, end.y);
                    ctx.stroke();
                } else if (this.currentTool === 'rect') {
                    // Show zone preview spanning full height
                    const startX = Math.min(start.x, end.x);
                    const endX = Math.max(start.x, end.x);
                    const width = endX - startX;
                    
                    // Semi-transparent fill
                    ctx.fillStyle = this.currentColor + '26'; // 15% opacity
                    ctx.fillRect(startX, 0, width, ctx.canvas.height);
                    
                    // Border lines
                    ctx.strokeStyle = this.currentColor;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(startX, 0);
                    ctx.lineTo(startX, ctx.canvas.height);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(endX, 0);
                    ctx.lineTo(endX, ctx.canvas.height);
                    ctx.stroke();
                } else if (this.currentTool === 'arrow') {
                    this.drawArrow(ctx, start, end);
                }
            },
            
            /**
             * Draw arrow
             */
            drawArrow(ctx, start, end) {
                const headLength = 15;
                const angle = Math.atan2(end.y - start.y, end.x - start.x);
                
                // Draw line
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.stroke();
                
                // Draw arrowhead
                ctx.beginPath();
                ctx.moveTo(end.x, end.y);
                ctx.lineTo(
                    end.x - headLength * Math.cos(angle - Math.PI / 6),
                    end.y - headLength * Math.sin(angle - Math.PI / 6)
                );
                ctx.moveTo(end.x, end.y);
                ctx.lineTo(
                    end.x - headLength * Math.cos(angle + Math.PI / 6),
                    end.y - headLength * Math.sin(angle + Math.PI / 6)
                );
                ctx.stroke();
            },
            
            /**
             * Add annotation to collection
             */
            addAnnotation(annotation) {
                annotation.id = 'anno_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                annotation.timestamp = Date.now();
                this.annotations.push(annotation);
                this.redrawChart(annotation.chartIndex);
                this.saveToHistory();
                console.log(`✅ Added ${annotation.type} annotation to chart ${annotation.chartIndex}`);
            },
            
            /**
             * Clear specific canvas
             */
            clearCanvas(chartIndex) {
                const ctx = this.contexts[chartIndex];
                const canvas = this.canvases[chartIndex];
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            },
            
            /**
             * Redraw annotations for specific chart
             */
            redrawChart(chartIndex) {
                this.clearCanvas(chartIndex);
                const ctx = this.contexts[chartIndex];
                
                this.annotations
                    .filter(anno => anno.chartIndex === chartIndex)
                    .forEach(anno => {
                        ctx.strokeStyle = anno.color;
                        ctx.fillStyle = anno.color;
                        ctx.lineWidth = anno.lineWidth || this.lineWidth;
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        
                        if (anno.type === 'pen') {
                            if (anno.points.length < 2) return;
                            ctx.beginPath();
                            ctx.moveTo(anno.points[0].x, anno.points[0].y);
                            for (let i = 1; i < anno.points.length; i++) {
                                ctx.lineTo(anno.points[i].x, anno.points[i].y);
                            }
                            ctx.stroke();
                        } else if (anno.type === 'line') {
                            ctx.beginPath();
                            ctx.moveTo(anno.start.x, anno.start.y);
                            ctx.lineTo(anno.end.x, anno.end.y);
                            ctx.stroke();
                        } else if (anno.type === 'rect') {
                            ctx.strokeRect(
                                anno.start.x,
                                anno.start.y,
                                anno.end.x - anno.start.x,
                                anno.end.y - anno.start.y
                            );
                        } else if (anno.type === 'arrow') {
                            this.drawArrow(ctx, anno.start, anno.end);
                        } else if (anno.type === 'text') {
                            ctx.font = `bold ${anno.fontSize}px JetBrains Mono`;
                            ctx.fillText(anno.text, anno.point.x, anno.point.y);
                        }
                    });
            },
            
            /**
             * Redraw all charts
             */
            redrawAll() {
                this.canvases.forEach((canvas, index) => {
                    this.redrawChart(index);
                });
            },
            
            /**
             * Save current state to history
             */
            saveToHistory() {
                // Remove any redo history
                this.history = this.history.slice(0, this.historyIndex + 1);
                
                // Add current state
                this.history.push(JSON.parse(JSON.stringify(this.annotations)));
                this.historyIndex++;
                
                // Limit history size
                if (this.history.length > 50) {
                    this.history.shift();
                    this.historyIndex--;
                }
                
                this.updateUndoRedoButtons();
            },
            
            /**
             * Undo last action
             */
            undo() {
                if (this.historyIndex <= 0) return;
                
                this.historyIndex--;
                this.annotations = JSON.parse(JSON.stringify(this.history[this.historyIndex] || []));
                this.redrawAll();
                this.updateUndoRedoButtons();
                console.log('↶ Undo');
            },
            
            /**
             * Redo last undone action
             */
            redo() {
                if (this.historyIndex >= this.history.length - 1) return;
                
                this.historyIndex++;
                this.annotations = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
                this.redrawAll();
                this.updateUndoRedoButtons();
                console.log('↷ Redo');
            },
            
            /**
             * Clear all annotations
             */
            clearAll() {
                if (!confirm('Clear all annotations? This cannot be undone.')) return;
                
                this.annotations = [];
                this.redrawAll();
                this.saveToHistory();
                console.log('🧹 Cleared all annotations');
            },
            
            /**
             * Update undo/redo button states
             */
            updateUndoRedoButtons() {
                const undoBtn = document.getElementById('annoUndoBtn');
                const redoBtn = document.getElementById('annoRedoBtn');
                
                if (undoBtn) {
                    undoBtn.disabled = this.historyIndex <= 0;
                }
                if (redoBtn) {
                    redoBtn.disabled = this.historyIndex >= this.history.length - 1;
                }
            },
            
            /**
             * Export annotations with chart as PNG
             * Merges Chart.js canvas + annotation canvas
             */
            async exportAsPNG() {
                console.log('📸 Exporting annotated charts as PNG...');
                
                const chartContainer = document.getElementById('chartZoomContainer');
                if (!chartContainer) return;
                
                // Create a temporary canvas for stitching
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                
                // Calculate total height
                let totalHeight = 0;
                const chartWrappers = chartContainer.querySelectorAll('div[style*="position: relative"]');
                const maxWidth = chartWrappers[0]?.querySelector('canvas')?.width || 800;
                
                chartWrappers.forEach(wrapper => {
                    const canvas = wrapper.querySelector('canvas:not(.annotation-canvas)');
                    if (canvas) totalHeight += canvas.height + 10; // 10px gap
                });
                
                tempCanvas.width = maxWidth;
                tempCanvas.height = totalHeight;
                
                // Fill background
                tempCtx.fillStyle = kpiTheme === 'dark' ? '#374151' : '#ffffff';
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                
                // Draw each chart + annotations
                let yOffset = 0;
                chartWrappers.forEach((wrapper, index) => {
                    const chartCanvas = wrapper.querySelector('canvas:not(.annotation-canvas)');
                    const annoCanvas = wrapper.querySelector('.annotation-canvas');
                    
                    if (chartCanvas) {
                        // Draw chart
                        tempCtx.drawImage(chartCanvas, 0, yOffset);
                        
                        // Draw annotations
                        if (annoCanvas) {
                            tempCtx.drawImage(annoCanvas, 0, yOffset);
                        }
                        
                        yOffset += chartCanvas.height + 10;
                    }
                });
                
                // Download
                const link = document.createElement('a');
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                link.download = `multi-kpi-annotated_${timestamp}.png`;
                link.href = tempCanvas.toDataURL('image/png');
                link.click();
                
                console.log('✅ Annotated chart exported');
            },
            
            /**
             * Cleanup - remove all annotation canvases
             */
            cleanup() {
                this.canvases.forEach(canvas => {
                    canvas.remove();
                });
                this.canvases = [];
                this.contexts = [];
                this.annotations = [];
                this.history = [];
                this.historyIndex = -1;
                this.enabled = false;
                console.log('🧹 Annotation system cleaned up');
            }
        };

        // =====================================================
        // CHART ZOOM MODAL FUNCTIONALITY
        // =====================================================

        function openChartZoom(chartTitle, chartInstance) {
            const modal = document.getElementById('chartZoomModal');
            const title = document.getElementById('chartZoomTitle');
            const modalContent = modal.querySelector('div');
            const chartContainer = document.getElementById('chartZoomContainer');
            const scatterControls = document.getElementById('zoomScatterControls');
            
            // Detect if this is a scatter plot (correlation analysis chart)
            const isScatterPlot = chartTitle.includes('Throughput') || chartTitle.includes('MCS vs CQI');
            
            // Show/hide the scatter plot controls based on chart type
            if (scatterControls) {
                scatterControls.style.display = isScatterPlot ? 'flex' : 'none';
            }
            
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
            
            // Synchronize control values with current state AFTER modal is displayed (for scatter plots)
            if (isScatterPlot) {
                // Use setTimeout to ensure DOM is ready
                setTimeout(() => {
                    // Sync polynomial degree dropdown
                    const degreeSelector = document.getElementById('polynomialDegreeSelector');
                    if (degreeSelector) {
                        degreeSelector.value = polynomialDegree.toString();
                    }
                    
                    // Sync include idle samples checkbox
                    const idleSamplesCheckbox = document.getElementById('includeIdleSamples');
                    if (idleSamplesCheckbox) {
                        idleSamplesCheckbox.checked = document.getElementById('includeIdleSamples')?.checked || false;
                    }
                    
                    // Sync show overall trend checkbox
                    const rawTrendCheckbox = document.getElementById('showRawTrendlineZoom');
                    if (rawTrendCheckbox) {
                        rawTrendCheckbox.checked = window.showRawTrendlineState || false;
                    }
                }, 10);
            }
            
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

        // Download chart as PNG (high quality) - preserves theme (dark/light mode)
        function downloadChartPNG() {
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
                    // Multi-KPI: Stitch together all individual chart canvases + annotations
                    const charts = window.multiKpiCharts;
                    
                    if (!charts || charts.length === 0) {
                        alert('No charts available to download');
                        return;
                    }
                    
                    // Get background color based on theme
                    const bgColor = kpiTheme === 'dark' ? '#374151' : '#ffffff';
                    
                    // Calculate dimensions
                    const chartWidth = charts[0].canvas.width;
                    const chartHeight = charts[0].canvas.height;
                    const gap = 16; // Gap between charts (8px * 2 for scale)
                    const padding = 24; // Padding around all charts (12px * 2 for scale)
                    
                    const totalWidth = chartWidth + (padding * 2);
                    const totalHeight = (chartHeight * charts.length) + (gap * (charts.length - 1)) + (padding * 2);
                    
                    // Create final canvas
                    const finalCanvas = document.createElement('canvas');
                    finalCanvas.width = totalWidth;
                    finalCanvas.height = totalHeight;
                    const finalCtx = finalCanvas.getContext('2d');
                    
                    // Fill background
                    finalCtx.fillStyle = bgColor;
                    finalCtx.fillRect(0, 0, totalWidth, totalHeight);
                    
                    // Draw each chart canvas + zone canvas + annotation canvas onto the final canvas
                    let currentY = padding;
                    charts.forEach((chart, index) => {
                        const canvas = chart.canvas;
                        
                        // Draw chart (layer 1)
                        finalCtx.drawImage(canvas, padding, currentY, chartWidth, chartHeight);
                        
                        // Draw zones if they exist (layer 2)
                        if (TelecomZoneManager.canvases[index]) {
                            const zoneCanvas = TelecomZoneManager.canvases[index];
                            finalCtx.drawImage(zoneCanvas, padding, currentY, chartWidth, chartHeight);
                        }
                        
                        // Draw annotations if they exist (layer 3)
                        if (AnnotationManager.canvases[index]) {
                            const annoCanvas = AnnotationManager.canvases[index];
                            finalCtx.drawImage(annoCanvas, padding, currentY, chartWidth, chartHeight);
                        }
                        
                        currentY += chartHeight + gap;
                    });
                    
                    // Convert to PNG and download
                    const url = finalCanvas.toDataURL('image/png', 1.0);
                    
                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    console.log(`✅ Multi-KPI chart with zones and annotations downloaded as PNG (${kpiTheme} mode, ${charts.length} charts): ${filename}`);
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
                    // Multi-KPI: Stitch together all individual chart canvases + annotations
                    const charts = window.multiKpiCharts;
                    
                    if (!charts || charts.length === 0) {
                        alert('No charts available to download');
                        return;
                    }
                    
                    // Get background color based on theme
                    const bgColor = kpiTheme === 'dark' ? '#374151' : '#ffffff';
                    
                    // Calculate dimensions
                    const chartWidth = charts[0].canvas.width;
                    const chartHeight = charts[0].canvas.height;
                    const gap = 16; // Gap between charts (8px * 2 for scale)
                    const padding = 24; // Padding around all charts (12px * 2 for scale)
                    
                    const totalWidth = chartWidth + (padding * 2);
                    const totalHeight = (chartHeight * charts.length) + (gap * (charts.length - 1)) + (padding * 2);
                    
                    // Create final canvas
                    const finalCanvas = document.createElement('canvas');
                    finalCanvas.width = totalWidth;
                    finalCanvas.height = totalHeight;
                    const finalCtx = finalCanvas.getContext('2d');
                    
                    // Fill background
                    finalCtx.fillStyle = bgColor;
                    finalCtx.fillRect(0, 0, totalWidth, totalHeight);
                    
                    // Draw each chart canvas + annotation canvas onto the final canvas
                    let currentY = padding;
                    charts.forEach((chart, index) => {
                        const canvas = chart.canvas;
                        
                        // Draw chart
                        finalCtx.drawImage(canvas, padding, currentY, chartWidth, chartHeight);
                        
                        // Draw annotations if they exist
                        if (AnnotationManager.canvases[index]) {
                            const annoCanvas = AnnotationManager.canvases[index];
                            finalCtx.drawImage(annoCanvas, padding, currentY, chartWidth, chartHeight);
                        }
                        
                        currentY += chartHeight + gap;
                    });
                    
                    // Convert to PNG data URL
                    const imageData = finalCanvas.toDataURL('image/png', 1.0);
                    
                    // Create SVG with embedded PNG
                    const width = finalCanvas.width;
                    const height = finalCanvas.height;
                    
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
                    
                    console.log(`✅ Multi-KPI chart downloaded as SVG (${kpiTheme} mode, ${charts.length} charts): ${filename}`);
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
            
            // Clean up annotation and zone systems
            TelecomZoneManager.cleanup();
            AnnotationManager.cleanup();
            
            // Reset annotation UI
            const modeBtn = document.getElementById('annotationModeBtn');
            const toolbar = document.getElementById('annotationToolbar');
            const modeText = document.getElementById('annotationModeText');
            if (modeBtn) modeBtn.classList.remove('active');
            if (modeText) modeText.textContent = 'ANNOTATE';
            if (toolbar) toolbar.style.display = 'none';
            
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
                        else if (index === 11 && scatterTputRsrq) { 
                            chart = scatterTputRsrq; 
                            const rsrqLabel = tech === 'NR' ? 'NR-RSRQ' : tech === 'UMTS' ? 'Ec/No' : tech === 'GSM' ? 'RxQual' : 'RSRQ';
                            title = `Throughput vs ${rsrqLabel}`; 
                        }
                        else if (index === 12 && scatterMcsCqi) { chart = scatterMcsCqi; title = 'MCS vs CQI'; }
                        else if (index === 13 && scatterBlerTput) { chart = scatterBlerTput; title = 'Throughput vs BLER'; }
                        
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
                getShortTimestamp(d) || `Point ${i+1}`
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
            const fullTimestamp = getFullTimestamp(point);
            
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
            html += `<div style="font-size:13px; font-weight:700; font-family:'JetBrains Mono';">${fullTimestamp || 'N/A'}</div>`;
            html += `</div>`;
            
            // GPS Coordinates section
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
                const eventsAtIndex = eventTimeline.filter(e => e.index === index);
                
                if (eventsAtIndex.length > 0) {
                    eventsAtIndex.forEach(event => {
                        const icon = getEventIcon(event.type);
                        
                        // Distinguish between real CSV events and detected changes
                        const isRealEvent = event.type !== 'pci_change' && event.type !== 'tech_change' && event.type !== 'release';
                        
                        if (isRealEvent) {
                            // Real CSV event - Yellow background
                            html += `<div style="background:#fef3c7; color:#92400e; padding:8px; border-radius:4px; margin-top:8px; border-left:3px solid #f59e0b; font-size:11px;">`;
                            html += `<div style="font-weight:700; margin-bottom:2px;">${icon} Event: ${event.type.toUpperCase()}</div>`;
                            html += `<div style="font-size:10px;">${event.details}</div>`;
                            html += `</div>`;
                        } else {
                            // Detected change - Blue/Info background
                            html += `<div style="background:#dbeafe; color:#1e40af; padding:8px; border-radius:4px; margin-top:8px; border-left:3px solid #3b82f6; font-size:11px;">`;
                            html += `<div style="font-weight:700; margin-bottom:2px;">ℹ️ Info</div>`;
                            html += `<div style="font-size:10px;">${event.details}</div>`;
                            html += `</div>`;
                        }
                    });
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
            
            // Hide scatter plot controls for multi-KPI (only show DOWNLOAD and CLOSE buttons)
            const scatterControls = document.getElementById('zoomScatterControls');
            if (scatterControls) {
                scatterControls.style.display = 'none';
            }
            
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
                
                // Apply technology-aware ranges for specific KPIs
                // Use actual data range with padding for better visibility
                if (kpiName === 'rsrp') {
                    // RSRP / RSCP / RxLev - Technology-specific ranges
                    if (tech === 'NR' || tech === 'LTE') {
                        yMin = -110;
                        yMax = -50;
                    } else if (tech === 'UMTS') {
                        yMin = -120; // RSCP can go lower than RSRP
                        yMax = -25;  // RSCP can go higher than RSRP
                    } else if (tech === 'GSM') {
                        // RxLev: Use actual data range (0 to -99 dBm typical, but can vary)
                        if (validData.length > 0) {
                            const dataMin = Math.min(...validData);
                            const dataMax = Math.max(...validData);
                            yMin = Math.min(dataMin - 10, -110); // Extend below, cap at -110
                            yMax = Math.max(dataMax + 10, 5);     // Extend above, ensure room for peaks
                        } else {
                            yMin = -110;
                            yMax = 5;
                        }
                    } else {
                        yMin = -110;
                        yMax = -50;
                    }
                    console.log(`📊 RSRP/RSCP/RxLev Y-axis: ${yMin} to ${yMax} (Tech: ${tech})`);
                } else if (kpiName === 'rsrq') {
                    // RSRQ / Ec/No / RxQual - Technology-specific ranges
                    if (tech === 'NR' || tech === 'LTE') {
                        yMin = -20;
                        yMax = -3;
                    } else if (tech === 'UMTS') {
                        yMin = -24; // Ec/No can go lower in poor conditions
                        yMax = 5;   // Ec/No can go positive in excellent conditions
                    } else if (tech === 'GSM') {
                        // RxQual: Handle non-standard negative values and flat lines
                        if (validData.length > 0) {
                            const dataMin = Math.min(...validData);
                            const dataMax = Math.max(...validData);
                            const range = dataMax - dataMin;
                            
                            if (range < 1) {
                                // Flat line - create visible range around the value
                                const center = (dataMax + dataMin) / 2;
                                yMin = center - 5;
                                yMax = center + 5;
                            } else {
                                // Use actual range with padding
                                yMin = Math.floor(dataMin - 2);
                                yMax = Math.ceil(dataMax + 2);
                            }
                        } else {
                            yMin = 0;   // Standard RxQual range
                            yMax = 7;
                        }
                    } else {
                        yMin = -20;
                        yMax = -3;
                    }
                    console.log(`📊 RSRQ/Ec/No/RxQual Y-axis: ${yMin} to ${yMax} (Tech: ${tech})`);
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
                
                canvas.addEventListener('mouseleave', (e) => {
                    // Don't clear observation panel immediately - give time to move to download button
                    // Check if mouse is moving to modal header (download button area)
                    setTimeout(() => {
                        // Only clear if mouse is not hovering over any chart or modal header
                        const modal = document.getElementById('chartZoomModal');
                        const isMouseInModal = modal && modal.matches(':hover');
                        
                        if (!isMouseInModal || !syncState.isHovering) {
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
                        }
                    }, 300); // 300ms delay to allow mouse movement to download button
                });
                
                // Store chart instance
                window.multiKpiCharts.push(chart);
            });
            
            console.log('✅ Multi-KPI stacked charts rendered:', datasets.length, 'charts');
            
            // Initialize annotation and zone systems after charts are rendered
            setTimeout(() => {
                TelecomZoneManager.init();  // Initialize zones first (bottom layer)
                AnnotationManager.init();   // Initialize annotations second (top layer)
            }, 100); // Small delay to ensure DOM is fully updated
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
                
                // Update button state - Enable only for 2-6 KPIs
                countSpan.textContent = selectedKpis.length;
                compareBtn.disabled = selectedKpis.length < 2 || selectedKpis.length > 6;
                
                // Update button appearance
                if (selectedKpis.length < 2 || selectedKpis.length > 6) {
                    compareBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    compareBtn.classList.remove('hover:bg-blue-700');
                } else {
                    compareBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    compareBtn.classList.add('hover:bg-blue-700');
                }
                
                // Warn user visually when exceeding 6
                if (selectedKpis.length > 6) {
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
