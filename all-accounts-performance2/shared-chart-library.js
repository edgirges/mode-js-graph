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
            selectAllBtn.onclick = () => selectAllMetrics(dynamicMetrics, config.updateChart);
            
            const deselectAllBtn = document.createElement('button');
            deselectAllBtn.id = config.deselectAllBtnId;
            deselectAllBtn.className = 'deselect-all-btn';
            deselectAllBtn.textContent = 'Deselect All';
            deselectAllBtn.onclick = () => deselectAllMetrics(dynamicMetrics, config.updateChart);
            
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
            
            div.innerHTML = `
                <input type="checkbox" class="metric-checkbox" id="metric-${metricId}" ${metric.visible ? 'checked' : ''}>
                <label for="metric-${metricId}" class="metric-label">
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
    function createStandardToggleMetric(dynamicMetrics, updateChartFunction, useIdReplacement = false) {
        return function toggleMetric(metricId, checkedState) {
            const metric = dynamicMetrics.find(m => m.id === metricId);
            if (!metric) return;
            
            const searchId = useIdReplacement ? metricId.replace(/\s+/g, '-') : metricId;
            const checkbox = document.getElementById(`metric-${searchId}`);
            if (!checkbox) return;
            
            const toggleDiv = checkbox.parentElement;
            
            metric.visible = checkedState !== undefined ? checkedState : checkbox.checked;
            toggleDiv.classList.toggle('active', metric.visible);
            updateChartFunction();
        };
    }

    function selectAllMetrics(dynamicMetrics, updateChartFunction) {
        dynamicMetrics.forEach(metric => {
            metric.visible = true;
            const searchId = metric.id.replace(/\s+/g, '-');
            let checkbox = document.getElementById(`metric-${metric.id}`) || 
                         document.getElementById(`metric-${searchId}`);
            
            if (checkbox) {
                const toggleDiv = checkbox.parentElement;
                checkbox.checked = true;
                toggleDiv.classList.add('active');
            }
        });
        
        updateChartFunction();
    }

    function deselectAllMetrics(dynamicMetrics, updateChartFunction) {
        dynamicMetrics.forEach(metric => {
            metric.visible = false;
            const searchId = metric.id.replace(/\s+/g, '-');
            let checkbox = document.getElementById(`metric-${metric.id}`) || 
                         document.getElementById(`metric-${searchId}`);
            
            if (checkbox) {
                const toggleDiv = checkbox.parentElement;
                checkbox.checked = false;
                toggleDiv.classList.remove('active');
            }
        });
        
        updateChartFunction();
    }

    // =============================================================================
    // TIME RANGE CONTROLS
    // =============================================================================

    /**
     * Standard time range switching function
     */
    function createStandardSwitchTimeRange(controlsSelector, updateCurrentTimeRange, processDataFunction, updateChartFunction) {
        return function switchTimeRange(timeRange) {
            updateCurrentTimeRange(timeRange);
            
            // Update button states
            document.querySelectorAll(`${controlsSelector} .control-btn`)
                .forEach(btn => {
                    btn.classList.remove('active');
                    const btnText = btn.textContent.trim();
                    if (btnText === timeRange || (timeRange === 'ALL' && btnText === 'All')) {
                        btn.classList.add('active');
                    }
                });

            processDataFunction();
            updateChartFunction();
        };
    }

    /**
     * Standard time range filtering function
     */
    function filterByTimeRange(processedData, dynamicMetrics, currentTimeRange) {
        if (!processedData.labels) return processedData;
        
        let daysToShow;
        
        switch (currentTimeRange) {
            case '7D':
                daysToShow = 7;
                break;
            case '30D':
                daysToShow = 30;
                break;
            case '90D':
                daysToShow = 90;
                break;
            case 'ALL':
            default:
                return processedData;
        }
        
        const startIndex = Math.max(0, processedData.labels.length - daysToShow);
        
        const filtered = {
            labels: processedData.labels.slice(startIndex)
        };

        dynamicMetrics.forEach(metric => {
            filtered[metric.id] = processedData[metric.id] ? processedData[metric.id].slice(startIndex) : [];
        });
        
        return filtered;
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
                    ${config.useModeDate ? 
                        `<!-- Date range controlled by Mode's built-in date picker above -->
                         <span style="color: #666; font-size: 12px; margin-right: 10px;">Use the date picker above to filter data</span>` :
                        `<button class="control-btn" onclick="${config.chartObject}.switchTimeRange('7D')">7D</button>
                         <button class="control-btn" onclick="${config.chartObject}.switchTimeRange('30D')">30D</button>
                         <button class="control-btn active" onclick="${config.chartObject}.switchTimeRange('90D')">90D</button>
                         <button class="control-btn" onclick="${config.chartObject}.switchTimeRange('ALL')">All</button>`
                    }
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
    // MODE DATE PICKER INTEGRATION
    // =============================================================================

    /**
     * Find and connect to Mode's built-in date picker
     */
    function findModeDatePicker(chartPrefix) {
        console.log(`${chartPrefix}: Skipping DOM search (not accessible due to iframe isolation)`);
        // We're in an iframe and cannot access parent window due to CORS
        // Return null to rely on URL params and window._MODE_PARAMS only
        return null;
    }

    /**
     * Set up Mode parameter integration (URL params + DOM fallback)
     */
    function setupModeDatePicker(chartPrefix, onDateRangeChange, defaultDays = 30) {
        console.log(`${chartPrefix}: Setting up Mode parameter integration...`);
        
        // Method 1: Check URL parameters (Mode passes params via query string)
        const urlParams = new URLSearchParams(window.location.search);
        const startFromUrl = urlParams.get('start_date') || urlParams.get('start');
        const endFromUrl = urlParams.get('end_date') || urlParams.get('end');
        
        console.log(`${chartPrefix}: URL params - start:`, startFromUrl, 'end:', endFromUrl);
        
        // Method 2: Check window._MODE_PARAMS (if set in HTML)
        const modeParams = window._MODE_PARAMS || {};
        const startFromWindow = modeParams.start_date || modeParams.start;
        const endFromWindow = modeParams.end_date || modeParams.end;
        
        console.log(`${chartPrefix}: Window params - start:`, startFromWindow, 'end:', endFromWindow);
        
        // Method 3: Try to find DOM elements (fallback)
        let domDatePicker = null;
        const datePicker = findModeDatePicker(chartPrefix);
        if (datePicker) {
            console.log(`${chartPrefix}: Found DOM date picker elements`);
            domDatePicker = setupDatePickerLogic(datePicker, chartPrefix, onDateRangeChange, defaultDays);
        }
        
        // Use the first available method
        const startDate = startFromUrl || startFromWindow;
        const endDate = endFromUrl || endFromWindow;
        
        if (startDate && endDate) {
            console.log(`${chartPrefix}: Using Mode parameters - start: ${startDate}, end: ${endDate}`);
            
            // Trigger initial date range
            onDateRangeChange({ startDate, endDate });
            
            // Return a simple interface for external API
            return {
                getCurrentDateRange: () => ({ startDate, endDate }),
                setDateRange: (newStart, newEnd) => {
                    console.log(`${chartPrefix}: Date range changed to ${newStart} - ${newEnd}`);
                    onDateRangeChange({ startDate: newStart, endDate: newEnd });
                }
            };
        } else if (domDatePicker) {
            console.log(`${chartPrefix}: Using DOM date picker`);
            return domDatePicker;
        } else {
            console.log(`${chartPrefix}: No Mode parameters found, using default date range`);
            return null;
        }
    }
    
    /**
     * Internal function to handle the actual date picker setup logic
     */
    function setupDatePickerLogic(datePicker, chartPrefix, onDateRangeChange, defaultDays) {

        console.log(`${chartPrefix}: Mode date picker setup successful!`);

        // Set default date range (last N days)
        const today = new Date();
        const defaultStartDate = new Date(today);
        defaultStartDate.setDate(today.getDate() - defaultDays);

        const formatDate = (date) => {
            return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        };

        // Set default values if inputs are empty
        if (!datePicker.startDateInput.value) {
            datePicker.startDateInput.value = formatDate(defaultStartDate);
            console.log(`${chartPrefix}: Set default start date to:`, formatDate(defaultStartDate));
        }
        
        if (!datePicker.endDateInput.value) {
            datePicker.endDateInput.value = formatDate(today);
            console.log(`${chartPrefix}: Set default end date to:`, formatDate(today));
        }

        // Function to get current date range
        const getCurrentDateRange = () => {
            const startDate = datePicker.startDateInput.value;
            const endDate = datePicker.endDateInput.value;
            console.log(`${chartPrefix}: Current date range: ${startDate} to ${endDate}`);
            return { startDate, endDate };
        };

        // Set up event listeners for date changes
        const handleDateChange = () => {
            console.log(`${chartPrefix}: Date picker values changed`);
            const dateRange = getCurrentDateRange();
            if (dateRange.startDate && dateRange.endDate) {
                onDateRangeChange(dateRange);
            }
        };

        datePicker.startDateInput.addEventListener('change', handleDateChange);
        datePicker.endDateInput.addEventListener('change', handleDateChange);

        // Also listen for any input events (in case Mode uses different events)
        datePicker.startDateInput.addEventListener('input', handleDateChange);
        datePicker.endDateInput.addEventListener('input', handleDateChange);

        console.log(`${chartPrefix}: Date picker event listeners attached`);

        // Return the picker interface
        return {
            getCurrentDateRange,
            setDateRange: (startDate, endDate) => {
                datePicker.startDateInput.value = startDate;
                datePicker.endDateInput.value = endDate;
                handleDateChange();
            }
        };
    }

    /**
     * Filter data by date range from Mode date picker
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
        
        // Time Range
        createStandardSwitchTimeRange,
        filterByTimeRange,
        
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
        
        // Mode Date Picker Integration
        setupModeDatePicker,
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