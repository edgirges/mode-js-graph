// =============================================================================
// REUSABLE CHART SYSTEM FOR MODE ANALYTICS - NON PAID VISIT STATS
// =============================================================================
// Wrapped in IIFE to prevent global variable conflicts
// =============================================================================

(function() {
    'use strict';
    
    // =============================================================================
    // CONFIGURATION SECTION - MODIFY THIS FOR DIFFERENT CHARTS/QUERIES
    // =============================================================================

    const CHART_CONFIG = {
        // Chart basic settings
        chartTitle: 'Non Paid Visit Stats',
        chartType: 'line',
        defaultTimeRange: '90D',
        
        // Mode Analytics integration
        modeDatasetName: 'Non Paid Visit STATs', // Name of your SQL query in Mode
        fallbackDatasetIndex: 2, // Fallback to datasets[2] if specific dataset not found
        
        // Data Structure Definition - Describes your SQL output
        dataStructure: {
            dateColumn: 'date',                    // Primary date column name
            alternateDateColumns: ['day', 'date'], // Alternative date column names to try
            
            // For dynamic metric detection, we'll look for percentage columns
            metricDetection: {
                enabled: true,
                includePatterns: ['_pct$', 'percentage', 'percent'], // Regex patterns for metric columns
                excludePatterns: ['^id$', '^date', '^day', '^time'], // Patterns to exclude
                expectedMetrics: ['nonpaid_visits_pct', 'psa_visits_pct'], // Expected metrics for validation
            }
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
                title: 'Percentage',
                min: 0,
                max: 0.05, // 5% as specified by user
                formatter: (value) => (value * 100).toFixed(2) + '%'
            }
        }
    };

    // =============================================================================
    // NAMESPACED GLOBAL VARIABLES (to avoid conflicts with other charts)
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
            }
        }, 100);
    });

    // For Mode Analytics - polling mechanism to ensure initialization
    let initAttempts = 0;
    const maxAttempts = 10;

    function attemptInitialization() {
        initAttempts++;
        
        const canvas = document.getElementById('nonPaidVisitStatsChart');
        const togglesContainer = document.querySelector('.non-paid-visit-stats-toggles');
        
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
        console.log('Loading data from Mode Analytics...');
        
        try {
            if (typeof datasets !== 'undefined') {
                console.log('Found datasets object');
                console.log('Available datasets:', Object.keys(datasets));
                
                // Target the specific Non Paid Visit Stats query dataset
                const targetQueryName = CHART_CONFIG.modeDatasetName;
                let targetDataset = null;
                let datasetName = null;
                
                console.log('Looking for specific query:', targetQueryName);
                
                if (datasets[targetQueryName]) {
                    console.log('Found target query dataset:', targetQueryName);
                    targetDataset = datasets[targetQueryName];
                    datasetName = targetQueryName;
                } else {
                    console.warn('Target query not found, available queries:', Object.keys(datasets));
                    // Fallback to specified index
                    if (datasets[CHART_CONFIG.fallbackDatasetIndex]) {
                        console.log(`Fallback: Using datasets[${CHART_CONFIG.fallbackDatasetIndex}]`);
                        targetDataset = datasets[CHART_CONFIG.fallbackDatasetIndex];
                        datasetName = `datasets[${CHART_CONFIG.fallbackDatasetIndex}] (fallback)`;
                    } else {
                        console.error(`No datasets available at index ${CHART_CONFIG.fallbackDatasetIndex}`);
                    }
                }
                
                if (targetDataset) {
                    console.log(`Using dataset: ${datasetName}`);
                    
                    // Extract data from the dataset
                    rawData = targetDataset.content || targetDataset || [];
                    console.log('Mode data loaded:', rawData.length, 'rows');
                    
                    if (rawData.length > 0) {
                        console.log('Dataset columns:', Object.keys(rawData[0] || {}));
                        console.log('First few rows:', rawData.slice(0, 3));
                        
                        // Dynamically detect metrics from the data
                        detectMetricsFromData();
                        
                        // Create metric toggles now that we have dynamic metrics
                        createMetricToggles();
                        
                        processData();
                        updateChart();
                    } else {
                        console.warn('Dataset is empty');
                    }
                } else {
                    console.warn('No suitable dataset found');
                }
            } else {
                console.warn('No datasets object found in Mode Analytics');
            }
        } catch (error) {
            console.error('Error loading Mode data:', error);
        }
    }

    // Poll for Mode data if not immediately available
    function pollForModeData() {
        let pollAttempts = 0;
        const maxPollAttempts = 20;
        
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
    // DYNAMIC METRIC DETECTION
    // =============================================================================

    function detectMetricsFromData() {
        if (!rawData || rawData.length === 0) {
            console.warn('No data available for metric detection');
            return;
        }

        const sampleRow = rawData[0];
        const columns = Object.keys(sampleRow);
        const detection = CHART_CONFIG.dataStructure.metricDetection;
        
        console.log('Detecting metrics from columns:', columns);
        
        // Find columns that match our patterns for metrics
        const candidateMetrics = columns.filter(col => {
            // Check if column matches include patterns
            const matchesInclude = detection.includePatterns.some(pattern => 
                new RegExp(pattern, 'i').test(col)
            );
            
            // Check if column matches exclude patterns
            const matchesExclude = detection.excludePatterns.some(pattern => 
                new RegExp(pattern, 'i').test(col)
            );
            
            return matchesInclude && !matchesExclude;
        });
        
        console.log('Candidate metric columns:', candidateMetrics);
        
        // Create dynamic metrics with colors
        const colors = [
            { color: '#007bff', backgroundColor: 'rgba(0, 123, 255, 0.1)' },
            { color: '#28a745', backgroundColor: 'rgba(40, 167, 69, 0.1)' },
            { color: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.1)' },
            { color: '#ffc107', backgroundColor: 'rgba(255, 193, 7, 0.1)' },
            { color: '#6f42c1', backgroundColor: 'rgba(111, 66, 193, 0.1)' },
            { color: '#fd7e14', backgroundColor: 'rgba(253, 126, 20, 0.1)' },
            { color: '#20c997', backgroundColor: 'rgba(32, 201, 151, 0.1)' },
            { color: '#6610f2', backgroundColor: 'rgba(102, 16, 242, 0.1)' }
        ];
        
        dynamicMetrics = candidateMetrics.map((col, index) => {
            const colorSet = colors[index % colors.length];
            return {
                id: col,
                name: formatMetricName(col),
                color: colorSet.color,
                backgroundColor: colorSet.backgroundColor,
                visible: true,
                type: 'line',
                yAxisID: 'y',
                order: index + 1,
                dataKey: col
            };
        });
        
        console.log('Dynamically created metrics:', dynamicMetrics);
        
        // Validate that we have the expected metrics
        if (detection.expectedMetrics) {
            const foundExpected = detection.expectedMetrics.filter(expected => 
                candidateMetrics.includes(expected)
            );
            console.log(`Found ${foundExpected.length}/${detection.expectedMetrics.length} expected metrics:`, foundExpected);
        }
    }
    
    function formatMetricName(columnName) {
        // Convert column names to readable format
        return columnName
            .replace(/_/g, ' ')
            .replace(/pct/g, '%')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    // =============================================================================
    // DATA PROCESSING
    // =============================================================================

    function processData() {
        console.log('Processing data...');
        
        if (!rawData || rawData.length === 0) {
            console.warn('No data to process');
            return;
        }
        
        if (dynamicMetrics.length === 0) {
            console.warn('No metrics detected');
            return;
        }
        
        // Group data by day and calculate values for each metric
        const dailyData = {};
        const dateColumn = findDateColumn();
        
        if (!dateColumn) {
            console.error('No date column found in data');
            return;
        }
        
        console.log(`Using date column: ${dateColumn}`);
        
        rawData.forEach((row, index) => {
            const date = row[dateColumn];
            if (!date) return;
            
            // Extract just the date part if it's a full datetime
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
        
        // Filter by time range
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
                return sortedDays;
        }
        
        // Take the last N days of available data
        const startIndex = Math.max(0, sortedDays.length - daysToShow);
        return sortedDays.slice(startIndex);
    }

    // =============================================================================
    // CHART INITIALIZATION AND UPDATES
    // =============================================================================

    function initializeChart() {
        console.log('Initializing chart...');
        
        if (typeof Chart === 'undefined') {
            console.error('Chart.js not available!');
            return;
        }
        
        const canvas = document.getElementById('nonPaidVisitStatsChart');
        if (!canvas) {
            console.error('Canvas not found!');
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
                    y: CHART_CONFIG.yAxes.primary
                }
            }
        });
        
        console.log('Chart created successfully');
    }

    function updateChart() {
        if (!chart) return;
        
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
                type: metric.type,
                yAxisID: metric.yAxisID,
                order: metric.order || 0,
                fill: false,
                tension: 0.1
            };
            
            datasets.push(dataset);
        });
        
        return datasets.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    // =============================================================================
    // METRIC TOGGLES AND CONTROLS
    // =============================================================================

    function createMetricToggles() {
        const togglesContainer = document.querySelector('.non-paid-visit-stats-toggles');
        if (!togglesContainer) return;
        
        togglesContainer.innerHTML = '';
        
        if (dynamicMetrics.length === 0) {
            togglesContainer.innerHTML = '<p>No metrics detected. Check data loading.</p>';
            return;
        }
        
        // Create select all / deselect all buttons
        const metricsHeader = document.querySelector('.non-paid-visit-stats-metrics-title');
        if (metricsHeader && !document.querySelector('.select-all-container')) {
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'select-all-container';
            
            const selectAllBtn = document.createElement('button');
            selectAllBtn.textContent = 'Select All';
            selectAllBtn.className = 'select-all-btn';
            selectAllBtn.addEventListener('click', selectAllMetrics);
            
            const deselectAllBtn = document.createElement('button');
            deselectAllBtn.textContent = 'Deselect All';
            deselectAllBtn.className = 'deselect-all-btn';
            deselectAllBtn.addEventListener('click', deselectAllMetrics);
            
            buttonsContainer.appendChild(selectAllBtn);
            buttonsContainer.appendChild(deselectAllBtn);
            
            metricsHeader.parentNode.insertBefore(buttonsContainer, togglesContainer);
        }
        
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
        
        console.log('Created metric toggles for', dynamicMetrics.length, 'metrics');
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
    }

    function selectAllMetrics() {
        dynamicMetrics.forEach(metric => {
            metric.visible = true;
            const checkbox = document.getElementById(`metric-${metric.id}`);
            const toggleDiv = checkbox.parentElement;
            
            checkbox.checked = true;
            toggleDiv.classList.add('active');
        });
        
        updateChart();
    }

    function deselectAllMetrics() {
        dynamicMetrics.forEach(metric => {
            metric.visible = false;
            const checkbox = document.getElementById(`metric-${metric.id}`);
            const toggleDiv = checkbox.parentElement;
            
            checkbox.checked = false;
            toggleDiv.classList.remove('active');
        });
        
        updateChart();
    }

    // =============================================================================
    // CONTROL FUNCTIONS
    // =============================================================================

    function switchTimeRange(timeRange) {
        currentTimeRange = timeRange;
        
        // Update active button - scope to this chart's container only
        const controlButtons = document.querySelectorAll('.non-paid-visit-stats-controls .control-btn');
        controlButtons.forEach(btn => {
            btn.classList.remove('active');
            // Add active class to the button that matches the timeRange
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
    }

    function resetZoom() {
        if (chart && chart.resetZoom) {
            chart.resetZoom();
        }
        
        // Reset zoom button state
        const controlButtons = document.querySelectorAll('.non-paid-visit-stats-controls .control-btn');
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
    }

    // =============================================================================
    // EXPORT FOR MODE ANALYTICS
    // =============================================================================

    window.NonPaidVisitStatsChart = {
        loadData: loadModeData,
        switchTimeRange: switchTimeRange,
        toggleZoom: toggleZoom,
        resetZoom: resetZoom,
        toggleMetric: toggleMetric,
        selectAll: selectAllMetrics,
        deselectAll: deselectAllMetrics,
        getChart: () => chart,
        getMetrics: () => dynamicMetrics,
        getCurrentData: () => processedData,
        detectMetrics: detectMetricsFromData,
        debug: {
            showDatasets: () => {
                if (typeof datasets !== 'undefined') {
                    console.log('Available datasets:', Object.keys(datasets));
                    Object.keys(datasets).forEach((name, index) => {
                        console.log(`Dataset ${index} "${name}":`, datasets[name]);
                    });
                }
            },
            forceLoad: () => {
                console.log('=== FORCING DATA RELOAD ===');
                loadModeData();
            }
        }
    };

    console.log('Non Paid Visit Stats Chart initialized successfully!');

})(); // End IIFE
