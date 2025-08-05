// =============================================================================
// Shared Chart Library for Mode Analytics Dashboard
// =============================================================================
// This library contains all common functionality shared across individual charts
// Individual chart files will import and extend this base functionality

window.ChartLibrary = (function() {
    'use strict';
    
    console.log('🔗 Shared Chart Library loaded successfully!');

    // =============================================================================
    // SHARED UTILITIES
    // =============================================================================

    /**
     * Extract metrics from a Mode Analytics dataset
     */
    function getMetricsFromDataset(datasetName, fallbackIndex = null) {
        if (typeof datasets === 'undefined') {
            return [];
        }

        let targetDataset = null;
        if (datasets[datasetName]) {
            targetDataset = datasets[datasetName];
        } else if (fallbackIndex !== null && datasets[fallbackIndex]) {
            targetDataset = datasets[fallbackIndex];
        }
        
        if (!targetDataset) {
            return [];
        }

        const dataArray = targetDataset.content || targetDataset;
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return [];
        }

        const columns = Object.keys(dataArray[0]);
        const dateTimePattern = /^(date|day|time|created|updated|timestamp|objective_id)$/i;
        const metrics = columns.filter(col => !dateTimePattern.test(col));
        
        return metrics;
    }

    /**
     * Find dataset by queryName - index-independent and reliable
     */
    function findDatasetByQueryName(queryName, chartPrefix = 'Chart') {
        console.log(`${chartPrefix}: Searching ALL datasets by queryName (index-independent search)`);
        
        for (let key in datasets) {
            const dataset = datasets[key];
            if (dataset.queryName === queryName) {
                console.log(`${chartPrefix}: ✓ FOUND "${queryName}" at index ${key} (would work at ANY index)`);
                return dataset;
            }
        }
        
        console.log(`${chartPrefix}: ✗ No dataset found with queryName: "${queryName}"`);
        return null;
    }

    /**
     * Load dataset content using reliable queryName method
     */
    function loadDatasetContent(config, chartPrefix) {
        let targetDataset = null;

        console.log(`${chartPrefix}: Looking for dataset with queryName:`, config.datasetName);

        // First try to find by queryName (most reliable)
        targetDataset = findDatasetByQueryName(config.datasetName, chartPrefix);
        
        // Fall back to index if queryName search fails
        if (!targetDataset && datasets[config.fallbackIndex]) {
            console.log(`${chartPrefix}: ✓ Using fallback INDEX:`, config.fallbackIndex);
            targetDataset = datasets[config.fallbackIndex];
        }

        if (targetDataset) {
            const data = targetDataset.content || targetDataset || [];
            console.log(`${chartPrefix}: Data loaded, rows:`, data.length);
            return data;
        } else {
            console.error(`${chartPrefix}: Dataset not found`);
            return [];
        }
    }

    // =============================================================================
    // INITIALIZATION PATTERNS
    // =============================================================================

    /**
     * Standard initialization function used across all charts
     */
    function createStandardInit(canvasId, togglesSelector, chartCreator, dataLoader) {
        return function init() {
            const canvas = document.getElementById(canvasId);
            const toggles = document.querySelector(togglesSelector);

            if (!canvas || !toggles || typeof Chart === 'undefined') {
                return false; // Signal that we need to retry
            }

            if (!window.chartInstance) {
                chartCreator();
            }

            if (typeof datasets !== 'undefined') {
                dataLoader();
                return true; // Successfully initialized
            } else {    
                pollForData(dataLoader);
                return true; // Chart created, polling for data
            }
        };
    }

    function pollForData(dataLoader) {
        if (typeof datasets !== 'undefined') {
            dataLoader();
        } else {
            setTimeout(() => pollForData(dataLoader), 1000);
        }
    }

    function createStandardAttemptInit(initFunction) {
        return function attemptInit() {
            if (initFunction()) {
                return;
            }
            setTimeout(attemptInit, 500);
        };
    }

    // =============================================================================
    // UI CONTROLS - METRIC TOGGLES
    // =============================================================================

    /**
     * Create metric toggle UI with select/deselect all buttons
     */
    function createStandardMetricToggles(config, dynamicMetrics, toggleMetricFunction) {
        const container = document.querySelector(config.togglesSelector);
        if (!container || !dynamicMetrics.length) return;

        container.innerHTML = '';

        // Add select/deselect all buttons
        const metricsHeader = document.querySelector(config.metricsHeaderSelector);
        if (metricsHeader && !document.getElementById(config.selectAllBtnId)) {
            const selectAllBtn = document.createElement('button');
            selectAllBtn.id = config.selectAllBtnId;
            selectAllBtn.className = 'select-all-btn';
            selectAllBtn.textContent = 'Select All';
            selectAllBtn.onclick = () => selectAllMetrics(dynamicMetrics, config.updateChart, config);
            
            const deselectAllBtn = document.createElement('button');
            deselectAllBtn.id = config.deselectAllBtnId;
            deselectAllBtn.className = 'deselect-all-btn';
            deselectAllBtn.textContent = 'Deselect All';
            deselectAllBtn.onclick = () => deselectAllMetrics(dynamicMetrics, config.updateChart, config);
            
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'metrics-buttons-container';
            buttonsContainer.style.marginBottom = '15px';
            buttonsContainer.appendChild(selectAllBtn);
            buttonsContainer.appendChild(deselectAllBtn);
            
            metricsHeader.parentNode.insertBefore(buttonsContainer, container);
        }

        dynamicMetrics.forEach(metric => {
            const div = document.createElement('div');
            div.className = `metric-toggle ${metric.visible ? 'active' : ''}`;
            
            // Handle special ID formatting for charts that use it (like RAW Visits)
            const metricId = config.useIdReplacement ? 
                metric.id.replace(/\s+/g, '-') : metric.id;
            
            // Create chart-specific checkbox ID to avoid conflicts
            const chartObject = config.chartObject || (config.htmlConfig && config.htmlConfig.chartObject);
            const chartPrefix = chartObject ? chartObject.toLowerCase().replace(/chart$/, '') : 'chart';
            const checkboxId = `${chartPrefix}-metric-${metricId}`;
            

            
            div.innerHTML = `
                <input type="checkbox" class="metric-checkbox" id="${checkboxId}" ${metric.visible ? 'checked' : ''}>
                <label for="${checkboxId}" class="metric-label">
                    <span class="metric-color" style="background-color: ${metric.color}"></span>
                    ${metric.name}
                </label>
            `;

            const checkbox = div.querySelector('.metric-checkbox');
            
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                toggleMetricFunction(metric.id, e.target.checked);
            });

            div.addEventListener('click', (e) => {
                if (e.target === checkbox || e.target.tagName === 'INPUT') return;
                e.preventDefault();
                e.stopPropagation();
                const newState = !checkbox.checked;
                checkbox.checked = newState;
                toggleMetricFunction(metric.id, newState);
            });

            container.appendChild(div);
        });
    }

    /**
     * Standard toggle metric function
     */
    function createStandardToggleMetric(dynamicMetrics, updateChartFunction, config = null) {
        return function toggleMetric(metricId, checkedState) {
            const metric = dynamicMetrics.find(m => m.id === metricId);
            if (!metric) return;
            
            const useIdReplacement = config && config.useIdReplacement;
            const searchId = useIdReplacement ? metricId.replace(/\s+/g, '-') : metricId;
            
            // Create chart-specific checkbox ID to match creation
            const chartObject = config && (config.chartObject || (config.htmlConfig && config.htmlConfig.chartObject));
            const chartPrefix = chartObject ? chartObject.toLowerCase().replace(/chart$/, '') : 'chart';
            const checkboxId = `${chartPrefix}-metric-${searchId}`;
            
            const checkbox = document.getElementById(checkboxId);
            if (!checkbox) return;
            
            const toggleDiv = checkbox.parentElement;
            
            metric.visible = checkedState !== undefined ? checkedState : checkbox.checked;
            toggleDiv.classList.toggle('active', metric.visible);
            updateChartFunction();
        };
    }

    function selectAllMetrics(dynamicMetrics, updateChartFunction, config = null) {
        dynamicMetrics.forEach(metric => {
            metric.visible = true;
            
            // Use the same ID logic as when creating toggles
            const metricId = (config && config.useIdReplacement) ? 
                metric.id.replace(/\s+/g, '-') : metric.id;
            
            // Create chart-specific checkbox ID to match creation
            const chartObject = config && (config.chartObject || (config.htmlConfig && config.htmlConfig.chartObject));
            const chartPrefix = chartObject ? chartObject.toLowerCase().replace(/chart$/, '') : 'chart';
            const checkboxId = `${chartPrefix}-metric-${metricId}`;
            
            const checkbox = document.getElementById(checkboxId);
            
            if (checkbox) {
                checkbox.checked = true;
                checkbox.parentElement.classList.add('active');
            }
        });
        
        updateChartFunction();
    }

    function deselectAllMetrics(dynamicMetrics, updateChartFunction, config = null) {
        dynamicMetrics.forEach(metric => {
            metric.visible = false;
            
            // Use the same ID logic as when creating toggles
            const metricId = (config && config.useIdReplacement) ? 
                metric.id.replace(/\s+/g, '-') : metric.id;
            
            // Create chart-specific checkbox ID to match creation
            const chartObject = config && (config.chartObject || (config.htmlConfig && config.htmlConfig.chartObject));
            const chartPrefix = chartObject ? chartObject.toLowerCase().replace(/chart$/, '') : 'chart';
            const checkboxId = `${chartPrefix}-metric-${metricId}`;
            
            const checkbox = document.getElementById(checkboxId);
            
            if (checkbox) {
                checkbox.checked = false;
                checkbox.parentElement.classList.remove('active');
            }
        });
        
        updateChartFunction();
    }



    // =============================================================================
    // ZOOM CONTROLS
    // =============================================================================

    /**
     * Standard zoom toggle function
     */
    function createStandardToggleZoom(chart, isZoomEnabledRef) {
        return function toggleZoom() {
            isZoomEnabledRef.value = !isZoomEnabledRef.value;

            const btn = event.target;
            btn.classList.toggle('active', isZoomEnabledRef.value);
            btn.textContent = isZoomEnabledRef.value ? 'Zoom ON' : 'Zoom';

            if (chart.options.plugins.zoom) {
                chart.options.plugins.zoom.zoom.wheel.enabled = isZoomEnabledRef.value;
                chart.options.plugins.zoom.zoom.pinch.enabled = isZoomEnabledRef.value;
            }
            
            chart.update('none');
        };
    }

    /**
     * Standard zoom reset function
     */
    function createStandardResetZoom(chart, controlsSelector, isZoomEnabledRef) {
        return function resetZoom() {
            if (chart && chart.resetZoom) {
                chart.resetZoom();
            }

            document.querySelectorAll(`${controlsSelector} .control-btn`)
                .forEach(btn => {
                    if (btn.textContent.includes('Zoom')) {
                        btn.classList.remove('active');
                        btn.textContent = 'Zoom';
                        isZoomEnabledRef.value = false;
                        
                        if (chart.options.plugins.zoom) {
                            chart.options.plugins.zoom.zoom.wheel.enabled = false;
                            chart.options.plugins.zoom.zoom.pinch.enabled = false;
                        }
                    }
                }); 

            if (chart) {
                chart.update('none');
            }
        };
    }

    // =============================================================================
    // CHART CONFIGURATION HELPERS
    // =============================================================================

    /**
     * Standard Chart.js plugin registration
     */
    function registerStandardPlugins() {
        if (typeof ChartZoom !== 'undefined') {
            Chart.register(ChartZoom);
        }
        if (typeof ChartAnnotation !== 'undefined') {
            Chart.register(ChartAnnotation);
        }
    }

    /**
     * Standard tooltip configuration
     */
    function getStandardTooltipConfig() {
        return {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#007bff',
            borderWidth: 1,
            cornerRadius: 6,
            displayColors: true,
            callbacks: {
                title: function(tooltipItems) {
                    return new Date(tooltipItems[0].label).toLocaleDateString();
                },
                label: function(context) {
                    const value = context.parsed.y;
                    return `${context.dataset.label}: ${value.toLocaleString()}`;
                }
            }
        };
    }

    /**
     * Standard time scale configuration
     */
    function getStandardTimeScale(title = 'Date') {
        return {
            type: 'time',
            time: {
                unit: 'day',
                tooltipFormat: 'MMM dd, yyyy',
                displayFormats: {
                    day: 'MMM dd'
                }
            },
            adapters: {
                date: {}
            },
            title: {
                display: true,
                text: title
            },
            grid: {
                color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
                maxRotation: 45,
                minRotation: 45
            }
        };
    }

    /**
     * Standard zoom configuration
     */
    function getStandardZoomConfig() {
        return {
            zoom: {
                wheel: { enabled: false },
                pinch: { enabled: false },
                mode: 'x',
            },
            pan: { enabled: true, mode: 'x' }
        };
    }

    // =============================================================================
    // HTML GENERATOR
    // =============================================================================

    /**
     * Generate chart content HTML structure (everything INSIDE the container)
     */
    function generateChartContentHTML(config) {
        console.log(`Generating chart content for: ${config.chartTitle}`);
        
        const contentHTML = `
            <div class="chart-header ${config.headerClass}">
                <h2 class="chart-title ${config.titleClass}">${config.chartTitle}</h2>
                <div class="chart-controls ${config.controlsClass}">
                    <!-- Date range controlled by custom date picker above -->
                    <button class="control-btn" onclick="${config.chartObject}.toggleZoom()">Zoom</button>
                    <button class="control-btn" onclick="${config.chartObject}.resetZoom()">Reset</button>
                </div>
            </div>
            <div class="chart-canvas ${config.canvasClass}">
                <canvas id="${config.canvasId}"></canvas>
            </div>
            <div class="metric-controls ${config.metricsClass}">
                <h3 class="metric-controls-title ${config.metricsHeaderClass}">Metrics</h3>
                <div class="metric-toggles ${config.togglesClass}">
                    <!-- Metric toggles will be dynamically generated -->
                </div>
            </div>
        `;
        
        console.log(`Chart content HTML generated for ${config.chartTitle}`);
        return contentHTML;
    }

    /**
     * Generate full chart HTML structure (including container) - for standalone use
     */
    function generateChartHTML(config) {
        console.log(`Generating full chart HTML for: ${config.chartTitle}`);
        
        const containerHTML = `
            <div class="chart-container ${config.containerClass}">
                ${generateChartContentHTML(config)}
            </div>
        `;
        
        console.log(`Full chart HTML generated for ${config.chartTitle}`);
        return containerHTML;
    }

    /**
     * Inject chart content into an existing container div
     */
    function injectChartContent(config) {
        console.log(`Looking for existing container: .${config.containerClass}`);
        
        // Look for the existing container div
        const containerElement = document.querySelector(`.${config.containerClass}`);
        
        if (containerElement) {
            console.log(`Found existing container, injecting content...`);
            const contentHTML = generateChartContentHTML(config);
            containerElement.innerHTML = contentHTML;
            console.log(`Chart content injected into .${config.containerClass}`);
            return true;
        } else {
            console.warn(`Container .${config.containerClass} not found`);
            return false;
        }
    }

    /**
     * Inject full chart HTML into a target container (fallback for standalone use)
     */
    function injectChartHTML(config, targetSelector = 'body') {
        const html = generateChartHTML(config);
        const targetElement = document.querySelector(targetSelector);
        
        if (targetElement) {
            if (config.replaceContent) {
                targetElement.innerHTML = html;
            } else {
                targetElement.insertAdjacentHTML('beforeend', html);
            }
            console.log(`Full chart HTML injected into ${targetSelector}`);
            return true;
        } else {
            console.error(`Target element ${targetSelector} not found for chart injection`);
            return false;
        }
    }

    /**
     * Smart injection - tries existing container first, then falls back to full injection
     */
    function injectChartSmart(config, fallbackTarget = 'body') {
        console.log(`Smart injection for ${config.chartTitle}...`);
        
        // First try to inject into existing container
        if (injectChartContent(config)) {
            console.log(`✅ Used existing container for ${config.chartTitle}`);
            return true;
        }
        
        // Fallback to full injection
        console.log(`⚠️ No existing container found, using fallback injection...`);
        return injectChartHTML(config, fallbackTarget);
    }

    // =============================================================================
    // EXPORT HELPERS
    // =============================================================================

    /**
     * Create standard export object for charts
     */
    function createStandardExport(chartName, functions) {
        const standardFunctions = {
            getChart: () => functions.getChart(),
            getMetrics: () => functions.getMetrics(),
            getCurrentData: () => functions.getCurrentData()
        };

        window[chartName] = Object.assign(standardFunctions, functions);
        return window[chartName];
    }

    /**
     * Standard initialization entry points for Mode Analytics
     */
    function setupStandardInitialization(attemptInitFunction) {
        document.addEventListener('DOMContentLoaded', () => setTimeout(attemptInitFunction, 100));
        setTimeout(attemptInitFunction, 200);
    }

    // =============================================================================
    // DATE PROCESSING HELPERS
    // =============================================================================

    /**
     * Find date column in data
     */
    function findDateColumn(rawData) {
        if (!rawData.length) return null;
        
        const columns = Object.keys(rawData[0]);
        return columns.find(col => /day/i.test(col)) || 
               columns.find(col => /date/i.test(col)) || 
               columns.find(col => /time/i.test(col)) ||
               columns[0];
    }

    /**
     * Normalize date format for consistent processing
     */
    function normalizeDate(dateValue) {
        if (dateValue instanceof Date) {
            return dateValue.toISOString().split('T')[0];
        }
        return String(dateValue).split('T')[0];
    }

    // =============================================================================
    // CUSTOM DATE PICKER INTEGRATION
    // =============================================================================

    /**
     * Global Custom Date Picker Manager
     */
    let globalDatePickerManager = {
        registeredCharts: new Map(),
        currentDateRange: { startDate: null, endDate: null },
        initialized: false
    };

    /**
     * Register a chart to use the custom date picker
     */
    function registerWithCustomDatePicker(chartId, onDateRangeChange, defaultDays = 30) {
        console.log(`${chartId}: Registering with custom date picker`);
        
        // Store the chart's callback function
        globalDatePickerManager.registeredCharts.set(chartId, {
            onDateRangeChange: onDateRangeChange,
            defaultDays: defaultDays
        });
        
        // Initialize the date picker if not already done
        if (!globalDatePickerManager.initialized) {
            initializeCustomDatePicker();
        }
        
        // If we already have a date range set, apply it to this chart
        if (globalDatePickerManager.currentDateRange.startDate && globalDatePickerManager.currentDateRange.endDate) {
            console.log(`${chartId}: Applying existing date range:`, globalDatePickerManager.currentDateRange);
            onDateRangeChange(globalDatePickerManager.currentDateRange);
        }
        
        return {
            getCurrentDateRange: () => globalDatePickerManager.currentDateRange,
            setDateRange: (startDate, endDate) => {
                updateGlobalDateRange(startDate, endDate);
            }
        };
    }

    /**
     * Initialize the custom date picker UI and event handlers
     */
    function initializeCustomDatePicker() {
        if (globalDatePickerManager.initialized) return;
        
        console.log('🗓️ Initializing custom date picker...');
        
        // Wait for DOM to be ready
        const initPicker = () => {
            const startInput = document.getElementById('custom-start-date');
            const endInput = document.getElementById('custom-end-date');
            const applyButton = document.getElementById('apply-date-range');
            const resetButton = document.getElementById('reset-date-range');
            
            if (!startInput || !endInput || !applyButton || !resetButton) {
                console.log('Custom date picker elements not found, retrying...');
                setTimeout(initPicker, 100);
                return;
            }
            
            console.log('✅ Custom date picker elements found, setting up...');
            
            // Set default values (last 30 days)
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            
            const formatDate = (date) => date.toISOString().split('T')[0];
            
            startInput.value = formatDate(thirtyDaysAgo);
            endInput.value = formatDate(today);
            
            // Set initial global date range
            globalDatePickerManager.currentDateRange = {
                startDate: formatDate(thirtyDaysAgo),
                endDate: formatDate(today)
            };
            
            // Apply button click handler
            applyButton.addEventListener('click', () => {
                const startDate = startInput.value;
                const endDate = endInput.value;
                
                if (startDate && endDate) {
                    if (new Date(startDate) <= new Date(endDate)) {
                        updateGlobalDateRange(startDate, endDate);
                    } else {
                        alert('Start date must be before or equal to end date');
                    }
                } else {
                    alert('Please select both start and end dates');
                }
            });
            
            // Reset button click handler
            resetButton.addEventListener('click', () => {
                const today = new Date();
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(today.getDate() - 30);
                
                startInput.value = formatDate(thirtyDaysAgo);
                endInput.value = formatDate(today);
                
                updateGlobalDateRange(formatDate(thirtyDaysAgo), formatDate(today));
            });
            
            // Auto-apply on input change (optional - can be removed if too aggressive)
            const autoApply = () => {
                const startDate = startInput.value;
                const endDate = endInput.value;
                
                if (startDate && endDate && new Date(startDate) <= new Date(endDate)) {
                    // Small delay to prevent rapid updates while user is typing
                    clearTimeout(autoApply.timer);
                    autoApply.timer = setTimeout(() => {
                        updateGlobalDateRange(startDate, endDate);
                    }, 500);
                }
            };
            
            startInput.addEventListener('change', autoApply);
            endInput.addEventListener('change', autoApply);
            
            globalDatePickerManager.initialized = true;
            console.log('✅ Custom date picker initialized with default 30-day range');
        };
        
        // Start initialization
        initPicker();
    }

    /**
     * Update the global date range and notify all registered charts
     */
    function updateGlobalDateRange(startDate, endDate) {
        console.log(`📅 Updating global date range: ${startDate} to ${endDate}`);
        
        globalDatePickerManager.currentDateRange = { startDate, endDate };
        
        // Notify all registered charts
        globalDatePickerManager.registeredCharts.forEach((chartData, chartId) => {
            console.log(`📊 Updating ${chartId} with new date range`);
            try {
                chartData.onDateRangeChange({ startDate, endDate });
            } catch (error) {
                console.error(`Error updating ${chartId}:`, error);
            }
        });
        
        // Update the UI inputs to match (in case this was called programmatically)
        const startInput = document.getElementById('custom-start-date');
        const endInput = document.getElementById('custom-end-date');
        
        if (startInput && endInput) {
            startInput.value = startDate;
            endInput.value = endDate;
        }
    }





    // =============================================================================
    // DATE FILTERING FOR CHARTS
    // =============================================================================

    /**
     * Filter data by date range for custom date picker
     */
    function filterDataByDateRange(processedData, startDate, endDate, chartPrefix) {
        if (!processedData.labels || !startDate || !endDate) {
            console.log(`${chartPrefix}: No date filtering - using all data`);
            return processedData;
        }

        console.log(`${chartPrefix}: Filtering data from ${startDate} to ${endDate}`);

        const start = new Date(startDate);
        const end = new Date(endDate);

        const filteredIndices = [];
        processedData.labels.forEach((label, index) => {
            const labelDate = new Date(label);
            if (labelDate >= start && labelDate <= end) {
                filteredIndices.push(index);
            }
        });

        console.log(`${chartPrefix}: Found ${filteredIndices.length} data points in date range (out of ${processedData.labels.length} total)`);

        if (filteredIndices.length === 0) {
            console.warn(`${chartPrefix}: No data points found in selected date range`);
            return { labels: [] };
        }

        // Create filtered data object
        const filtered = {
            labels: filteredIndices.map(i => processedData.labels[i])
        };

        // Filter all data arrays
        Object.keys(processedData).forEach(key => {
            if (key !== 'labels' && Array.isArray(processedData[key])) {
                filtered[key] = filteredIndices.map(i => processedData[key][i]);
            }
        });

        console.log(`${chartPrefix}: Filtered data:`, {
            labels: filtered.labels.length,
            dateRange: `${filtered.labels[0]} to ${filtered.labels[filtered.labels.length - 1]}`
        });

        return filtered;
    }

    // =============================================================================
    // PUBLIC API
    // =============================================================================

    return {
        // Core utilities
        getMetricsFromDataset,
        findDatasetByQueryName,
        loadDatasetContent,
        
        // Initialization
        createStandardInit,
        createStandardAttemptInit,
        setupStandardInitialization,
        
        // UI Controls
        createStandardMetricToggles,
        createStandardToggleMetric,
        selectAllMetrics,
        deselectAllMetrics,
        

        
        // Zoom
        createStandardToggleZoom,
        createStandardResetZoom,
        
        // Chart Configuration
        registerStandardPlugins,
        getStandardTooltipConfig,
        getStandardTimeScale,
        getStandardZoomConfig,
        
        // Export
        createStandardExport,
        
        // Date Processing
        findDateColumn,
        normalizeDate,
        
        // Custom Date Picker Integration
        registerWithCustomDatePicker,
        filterDataByDateRange,
        

        
        // HTML Generator
        generateChartHTML,
        generateChartContentHTML,
        injectChartHTML,
        injectChartContent,
        injectChartSmart,
        
        // Utility
        pollForData
    };

})(); 