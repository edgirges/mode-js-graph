// =============================================================================
// REUSABLE CHART SYSTEM FOR MODE ANALYTICS - PMP vs Open Market Line
// =============================================================================
// Wrapped in IIFE to prevent global variable conflicts
// =============================================================================

(function() {
    'use strict';

    // =============================================================================
    // DIRECT METRIC EXTRACTION FUNCTION
    // =============================================================================
    function getMetricsFromDataset(datasetName, fallbackIndex = null) {
        console.log('=== DIRECT METRIC EXTRACTION ===');
        
        if (typeof datasets === 'undefined') {
            console.warn('datasets object not available yet');
            return [];
        }

        // Try to get the dataset
        let targetDataset = null;
        if (datasets[datasetName]) {
            targetDataset = datasets[datasetName];
            console.log(`Found dataset by name: "${datasetName}"`);
        } else if (fallbackIndex !== null && datasets[fallbackIndex]) {
            targetDataset = datasets[fallbackIndex];
            console.log(`Using fallback dataset at index: ${fallbackIndex}`);
        }

        if (!targetDataset) {
            console.error('No dataset found');
            return [];
        }

        // Extract data array
        const dataArray = targetDataset.content || targetDataset;
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            console.error('Dataset has no data');
            return [];
        }

        // Get column names
        const columns = Object.keys(dataArray[0]);
        console.log('Available columns:', columns);

        // Filter out date/time columns to get metrics
        const dateTimePattern = /^(date|day|time|created|updated|timestamp)$/i;
        const metrics = columns.filter(col => !dateTimePattern.test(col));
        
        console.log('Extracted metrics:', metrics);
        
        // Validation for expected metrics
        const expectedMetrics = ['imps_banner_open_market', 'imps_banner_pmp', 'imps_open_market', 'imps_pmp', 'imps_total', 'imps_video_open_market', 'imps_video_pmp'];
        const foundExpected = expectedMetrics.filter(metric => metrics.includes(metric));
        console.log('Expected metrics:', expectedMetrics);
        console.log('Found expected metrics:', foundExpected);
        
        return metrics;
    }

    // =============================================================================
    // CONFIGURATION SECTION - MODIFY THIS FOR DIFFERENT CHARTS/QUERIES
    // =============================================================================

    const CHART_CONFIG = {
        // Chart basic settings
        chartTitle: 'PMP v Open Market Impressions',
        chartType: 'line',
        defaultTimeRange: '90D',
        
        // Mode Analytics integration
        modeDatasetName: 'PMP vs OpenMarket Imps and Spend (Obj filter does not apply)', // Name of your SQL query in Mode
        fallbackDatasetIndex: 5, // Fallback to datasets[5] if specific dataset not found

        // Data Structure Definition - Describes your SQL output
        dataStructure: {
            dateColumn: 'day',                    // Primary date column name
            alternateDateColumns: ['day', 'date'], // Alternative date column names to try
            
            // DIRECT METRIC EXTRACTION - No pattern matching needed!
            getMetrics: function() {
                return getMetricsFromDataset(
                    CHART_CONFIG.modeDatasetName, 
                    CHART_CONFIG.fallbackDatasetIndex
                );
            },

            // METRIC FILTERING - Specify which metrics to display
            displayMetrics: ['imps_banner_open_market', 'imps_banner_pmp', 'imps_open_market', 'imps_pmp', 'imps_total', 'imps_video_open_market', 'imps_video_pmp'], // Only show these specific metrics
            
            // Cached metrics - will be populated dynamically
            metrics: [] // This will be populated dynamically
        },
        
        // Chart Styling
        styling: {
            height: 400,
            showLegend: false,
            gridColor: 'rgba(0, 0, 0, 0.1)',
            backgroundColor: '#ffffff'
        },
        
        // Y-Axis Configuration
        yAxes: {
            primary: {
                id: 'y',
                position: 'left',
                title: 'Impressions',
                min: 0,
                // max will be calculated dynamically based on data
                formatter: (value) => value.toLocaleString()
            }
        }
    };

    // =============================================================================
    // NAMESPACED GLOBAL VARIABLES
    // =============================================================================

    let chart;
    let rawData = [];
    let processedData = {};
    let currentTimeRange = CHART_CONFIG.defaultTimeRange;
    let isZoomEnabled = false;
    let dynamicMetrics = []; // Will be populated from data

    // =============================================================================
    // INITIALIZATION
    // =============================================================================

    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            initializeChart();
            
            // Try to load data from Mode Analytics if available
            if (typeof datasets !== 'undefined') {
                loadModeData();
            } else {
                pollForModeData();
            }
        }, 100);
    });

    // For Mode Analytics - polling mechanism to ensure initialization
    let initAttempts = 0;
    const maxAttempts = 10;

    function attemptInitialization() {
        initAttempts++;
        
        const canvas = document.getElementById('pmpVOpenMarketLineChart');
        const togglesContainer = document.querySelector('.pmp-v-open-market-line-toggles');
        
        if (canvas && togglesContainer && typeof Chart !== 'undefined') {
            if (!chart) {
                initializeChart();
            }
            
            // Try to load data from Mode Analytics
            if (typeof datasets !== 'undefined') {
                loadModeData();
            } else {
                pollForModeData();
            }
            return;
        }
        
        if (initAttempts < maxAttempts) {
            setTimeout(attemptInitialization, 500);
        }
    }

    // Start polling after a short delay
    setTimeout(attemptInitialization, 200);

    // =============================================================================
    // MODE ANALYTICS DATA LOADING
    // =============================================================================

    function loadModeData() {
        console.log('=== PMP vs Open Market Line: Loading data from Mode Analytics ===');
        
        try {
            if (typeof datasets !== 'undefined') {
                console.log('Found datasets object');
                console.log('Available datasets:', Object.keys(datasets));
                
                // Get metrics using our direct extraction method
                const extractedMetrics = CHART_CONFIG.dataStructure.getMetrics();
                
                if (extractedMetrics.length > 0) {
                    // Store the metrics in our config
                    CHART_CONFIG.dataStructure.metrics = extractedMetrics;
                    
                    // Create dynamic metrics with colors
                    createDynamicMetricsFromExtraction(extractedMetrics);
                    
                    // Load the actual data
                    loadDatasetContent();
                    
                    // Create metric toggles
                    createMetricToggles();
                    
                    // Process and display the chart
                    processData();
                    updateChart();
                } else {
                    console.warn('No metrics extracted from dataset');
                }
            } else {
                console.warn('No datasets object found in Mode Analytics');
            }
        } catch (error) {
            console.error('Error loading Mode data:', error);
        }
    }

    function loadDatasetContent() {
        const targetQueryName = CHART_CONFIG.modeDatasetName;
        let targetDataset = null;
        
        if (datasets[targetQueryName]) {
            targetDataset = datasets[targetQueryName];
        } else if (datasets[CHART_CONFIG.fallbackDatasetIndex]) {
            targetDataset = datasets[CHART_CONFIG.fallbackDatasetIndex];
        }
        
        if (targetDataset) {
            rawData = targetDataset.content || targetDataset || [];
            console.log('Mode data loaded:', rawData.length, 'rows');
            
            if (rawData.length > 0) {
                console.log('Sample data row:', rawData[0]);
            }
        }
    }

    function createDynamicMetricsFromExtraction(extractedMetrics) {
        console.log('=== Creating dynamic metrics from extraction ===');
        console.log('Extracted metrics:', extractedMetrics);
        
        // Filter metrics based on displayMetrics configuration
        const displayMetrics = CHART_CONFIG.dataStructure.displayMetrics;
        const filteredMetrics = displayMetrics && displayMetrics.length > 0 
            ? extractedMetrics.filter(metric => displayMetrics.includes(metric))
            : extractedMetrics;
            
        console.log('Display metrics filter:', displayMetrics);
        console.log('Filtered metrics to display:', filteredMetrics);
        
        // Create color palette
        const colors = [
            { color: '#007bff', backgroundColor: 'rgba(0, 123, 255, 0.3)' },
            { color: '#28a745', backgroundColor: 'rgba(40, 167, 69, 0.3)' },
            { color: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.3)' },
            { color: '#ffc107', backgroundColor: 'rgba(255, 193, 7, 0.3)' },
            { color: '#6f42c1', backgroundColor: 'rgba(111, 66, 193, 0.3)' },
            { color: '#fd7e14', backgroundColor: 'rgba(253, 126, 20, 0.3)' },
            { color: '#343a40', backgroundColor: 'rgba(52, 58, 64, 0.3)' }
        ];
        
        dynamicMetrics = filteredMetrics.map((metric, index) => {
            const colorSet = colors[index % colors.length];
            return {
                id: metric,
                name: formatMetricName(metric),
                color: colorSet.color,
                backgroundColor: 'transparent', // LINE CHART CHANGE: No background for lines
                visible: true,
                type: 'line',
                yAxisID: 'y',
                order: index + 1,
                dataKey: metric
            };
        });
        
        console.log('Created dynamic metrics:', dynamicMetrics);
        
        // Validation: Check if all requested metrics were found
        if (displayMetrics && displayMetrics.length > 0) {
            const foundRequestedMetrics = displayMetrics.filter(metric => extractedMetrics.includes(metric));
            const missingMetrics = displayMetrics.filter(metric => !extractedMetrics.includes(metric));
            
            console.log('Requested metrics found:', foundRequestedMetrics);
            if (missingMetrics.length > 0) {
                console.warn('Requested metrics NOT found in dataset:', missingMetrics);
            }
        }
    }

    function formatMetricName(columnName) {
        // Convert column names to readable format
        return columnName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    // Poll for Mode data if not immediately available
    function pollForModeData() {
        let pollAttempts = 0;
        const maxPollAttempts = 20;
        
        console.log('Polling for Mode datasets...');
        
        function checkForModeData() {
            pollAttempts++;
            
            if (typeof datasets !== 'undefined') {
                console.log('Datasets object found!');
                loadModeData();
                return;
            }
            
            if (pollAttempts < maxPollAttempts) {
                setTimeout(checkForModeData, 1000);
            }
        }
        
        checkForModeData();
    }

    // =============================================================================
    // DATA PROCESSING
    // =============================================================================

    function processData() {
        console.log('=== Processing PMP vs Open Market Line data ===');
        
        if (!rawData || rawData.length === 0) {
            console.warn('No data to process');
            return;
        }
        
        if (dynamicMetrics.length === 0) {
            console.warn('No metrics detected');
            return;
        }
        
        const dateColumn = findDateColumn();
        
        if (!dateColumn) {
            console.error('No date column found in data');
            return;
        }
        
        console.log(`Using date column: ${dateColumn}`);
        
        // Group data by day
        const dailyData = {};
        
        rawData.forEach((row, index) => {
            const date = row[dateColumn];
            if (!date) return;
            
            const dayKey = date.includes && date.includes(' ') ? date.split(' ')[0] : date;
            
            if (!dailyData[dayKey]) {
                dailyData[dayKey] = {};
                dynamicMetrics.forEach(metric => {
                    dailyData[dayKey][metric.id] = 0;
                    dailyData[dayKey][`${metric.id}_count`] = 0;
                });
            }
            
            // Sum up values for each metric
            dynamicMetrics.forEach(metric => {
                const value = parseFloat(row[metric.id] || 0);
                if (!isNaN(value)) {
                    dailyData[dayKey][metric.id] += value;
                    dailyData[dayKey][`${metric.id}_count`] += 1;
                }
            });
        });
        
        // Convert to arrays sorted by date and calculate averages
        const sortedDays = Object.keys(dailyData).sort();
        const filteredDays = filterDaysByTimeRange(sortedDays);
        
        // Build processed data object
        processedData = {
            labels: filteredDays
        };
        
        // Add each metric's data
        dynamicMetrics.forEach(metric => {
            processedData[metric.id] = filteredDays.map(day => {
                const count = dailyData[day][`${metric.id}_count`];
                return count > 0 ? dailyData[day][metric.id] / count : 0;
            });
        });
        
        console.log('Data processed successfully. Metrics:', Object.keys(processedData).filter(k => k !== 'labels'));
        console.log('Date range:', filteredDays.length, 'days');
    }

    function findDateColumn() {
        if (!rawData || rawData.length === 0) return null;
        
        const sampleRow = rawData[0];
        const columns = Object.keys(sampleRow);
        
        // Try the primary date column first
        if (columns.includes(CHART_CONFIG.dataStructure.dateColumn)) {
            return CHART_CONFIG.dataStructure.dateColumn;
        }
        
        // Try alternative date columns
        for (const altCol of CHART_CONFIG.dataStructure.alternateDateColumns) {
            if (columns.includes(altCol)) {
                return altCol;
            }
        }
        
        // Look for any column that might be a date
        const datePattern = /date|day|time/i;
        const dateColumn = columns.find(col => datePattern.test(col));
        
        return dateColumn || null;
    }

    function filterDaysByTimeRange(sortedDays) {
        if (currentTimeRange === 'ALL') {
            return sortedDays;
        }
        
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
            default:
                return sortedDays;
        }
        
        if (sortedDays.length === 0) return [];
        
        const mostRecentDate = new Date(sortedDays[sortedDays.length - 1]);
        const startDate = new Date(mostRecentDate);
        startDate.setDate(startDate.getDate() - (daysToShow - 1));
        
        return sortedDays.filter(day => {
            const dayDate = new Date(day);
            return dayDate >= startDate && dayDate <= mostRecentDate;
        });
    }

    // =============================================================================
    // CHART INITIALIZATION AND UPDATES
    // =============================================================================

    function initializeChart() {
        console.log('=== Initializing PMP vs Open Market Line chart ===');
        
        if (typeof Chart === 'undefined') {
            console.error('Chart.js not available!');
            return;
        }
        
        const canvas = document.getElementById('pmpVOpenMarketLineChart');
        if (!canvas) {
            console.error('Canvas not found! Looking for ID: pmpVOpenMarketLineChart');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Register Chart.js plugins
        if (typeof ChartZoom !== 'undefined') {
            Chart.register(ChartZoom);
        }
        if (typeof ChartAnnotation !== 'undefined') {
            Chart.register(ChartAnnotation);
        }
        
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: CHART_CONFIG.chartTitle
                    },
                    legend: {
                        display: false
                    },
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: false,
                            },
                            pinch: {
                                enabled: false
                            },
                            mode: 'x',
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        ...CHART_CONFIG.yAxes.primary,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
        
        console.log('Chart created successfully');
    }

    function updateChart() {
        if (!chart) {
            console.warn('Chart not initialized yet');
            return;
        }
        
        if (!processedData || !processedData.labels) {
            console.warn('No processed data available for chart update');
            return;
        }
        
        const datasets = createDatasets();
        
        chart.data.labels = processedData.labels;
        chart.data.datasets = datasets;
        
        chart.update('active');
        console.log('Chart updated with', datasets.length, 'visible metrics');
    }

    function createDatasets() {
        const datasets = [];
        
        dynamicMetrics.forEach(metric => {
            if (!metric.visible) return;
            
            const metricData = processedData[metric.id] || [];
            
            const dataset = {
                label: metric.name,
                data: metricData,
                borderColor: metric.color,
                backgroundColor: metric.backgroundColor,
                borderWidth: 2,
                fill: false, // LINE CHART CHANGE: No fill for lines
                tension: 0.1,
                yAxisID: metric.yAxisID,
                order: metric.order || 0
            };
            
            datasets.push(dataset);
        });
        
        return datasets.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    // =============================================================================
    // METRIC TOGGLES AND CONTROLS
    // =============================================================================

    function createMetricToggles() {
        const togglesContainer = document.querySelector('.pmp-v-open-market-line-toggles');
        if (!togglesContainer) {
            console.error('Toggles container not found! Looking for: .pmp-v-open-market-line-toggles');
            return;
        }
        
        togglesContainer.innerHTML = '';
        
        if (dynamicMetrics.length === 0) {
            togglesContainer.innerHTML = '<p>No metrics detected. Check data loading.</p>';
            return;
        }
        
        console.log('Creating metric toggles for', dynamicMetrics.length, 'metrics');
        
        dynamicMetrics.forEach(metric => {
            const toggleDiv = document.createElement('div');
            toggleDiv.className = `metric-toggle ${metric.visible ? 'active' : ''}`;
            toggleDiv.innerHTML = `
                <input type="checkbox" class="metric-checkbox" id="metric-${metric.id}" ${metric.visible ? 'checked' : ''}>
                <label for="metric-${metric.id}" class="metric-label">
                    <span class="metric-color" style="background-color: ${metric.color}"></span>
                    ${metric.name}
                </label>
            `;
            
            toggleDiv.addEventListener('click', function(e) {
                const checkbox = toggleDiv.querySelector('.metric-checkbox');
                if (e.target === checkbox) return;
                e.preventDefault();
                e.stopPropagation();
                checkbox.click();
            });
            
            const checkbox = toggleDiv.querySelector('.metric-checkbox');
            checkbox.addEventListener('change', function() {
                toggleMetric(metric.id);
            });
            
            togglesContainer.appendChild(toggleDiv);
        });
    }

    function toggleMetric(metricId) {
        const metric = dynamicMetrics.find(m => m.id === metricId);
        const toggleDiv = document.getElementById(`metric-${metricId}`).parentElement;
        const checkbox = document.getElementById(`metric-${metricId}`);
        
        metric.visible = checkbox.checked;
        
        if (metric.visible) {
            toggleDiv.classList.add('active');
        } else {
            toggleDiv.classList.remove('active');
        }
        
        updateChart();
        console.log(`Metric ${metricId} toggled:`, metric.visible);
    }

    // =============================================================================
    // CONTROL FUNCTIONS
    // =============================================================================

    function switchTimeRange(timeRange) {
        console.log('Switching time range to:', timeRange);
        currentTimeRange = timeRange;
        
        // Update active button - scope to this chart's container only
        const controlButtons = document.querySelectorAll('.pmp-v-open-market-line-controls .control-btn');
        controlButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.trim() === timeRange || 
                (timeRange === 'ALL' && btn.textContent.trim() === 'All')) {
                btn.classList.add('active');
            }
        });
        
        processData();
        updateChart();
    }

    function toggleZoom() {
        isZoomEnabled = !isZoomEnabled;
        
        const zoomBtn = event.target;
        if (isZoomEnabled) {
            zoomBtn.classList.add('active');
            zoomBtn.textContent = 'Zoom ON';
            
            if (chart.options.plugins.zoom) {
                chart.options.plugins.zoom.zoom.wheel.enabled = true;
                chart.options.plugins.zoom.zoom.pinch.enabled = true;
            }
        } else {
            zoomBtn.classList.remove('active');
            zoomBtn.textContent = 'Zoom';
            
            if (chart.options.plugins.zoom) {
                chart.options.plugins.zoom.zoom.wheel.enabled = false;
                chart.options.plugins.zoom.zoom.pinch.enabled = false;
            }
        }
        
        chart.update('none');
        console.log('Zoom toggled:', isZoomEnabled);
    }

    function resetZoom() {
        if (chart && chart.resetZoom) {
            chart.resetZoom();
        }
        
        // Reset zoom button state
        const controlButtons = document.querySelectorAll('.pmp-v-open-market-line-controls .control-btn');
        controlButtons.forEach(btn => {
            if (btn.textContent.includes('Zoom')) {
                btn.classList.remove('active');
                btn.textContent = 'Zoom';
                isZoomEnabled = false;
                
                if (chart && chart.options.plugins.zoom) {
                    chart.options.plugins.zoom.zoom.wheel.enabled = false;
                    chart.options.plugins.zoom.zoom.pinch.enabled = false;
                }
            }
        });
        
        if (chart) {
            chart.update('none');
        }
        
        console.log('Zoom reset');
    }

    // =============================================================================
    // EXPORT FOR MODE ANALYTICS
    // =============================================================================

    window.PmpVOpenMarketLineChart = {
        loadData: loadModeData,
        switchTimeRange: switchTimeRange,
        toggleZoom: toggleZoom,
        resetZoom: resetZoom,
        toggleMetric: toggleMetric,
        getChart: () => chart,
        getMetrics: () => dynamicMetrics,
        getCurrentData: () => processedData,
        getConfig: () => CHART_CONFIG,
        debug: {
            showDatasets: () => {
                if (typeof datasets !== 'undefined') {
                    console.log('=== ALL DATASETS DEBUG ===');
                    console.log('Available datasets:', Object.keys(datasets));
                    Object.keys(datasets).forEach((name, index) => {
                        console.log(`Dataset ${index} "${name}":`, datasets[name]);
                    });
                }
            },
            forceLoad: () => {
                console.log('=== FORCING DATA RELOAD ===');
                loadModeData();
            },
            showMetrics: () => {
                console.log('=== EXTRACTED METRICS ===');
                console.log('Direct extraction result:', CHART_CONFIG.dataStructure.getMetrics());
                console.log('Dynamic metrics created:', dynamicMetrics);
            }
        }
    };

    console.log('=== PMP vs Open Market Line Chart initialized successfully! ===');
    console.log('Available functions:', Object.keys(window.PmpVOpenMarketLineChart));
    console.log('Debug commands:');
    console.log('- PmpVOpenMarketLineChart.debug.showDatasets()');
    console.log('- PmpVOpenMarketLineChart.debug.showMetrics()');
    console.log('- PmpVOpenMarketLineChart.debug.forceLoad()');

})(); // End IIFE