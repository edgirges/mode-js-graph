// =============================================================================
// Non Paid Visit Stats Chart (Using Shared Library)
// =============================================================================

(function() {
    'use strict';

    // Access shared library
    const lib = window.ChartLibrary;

    // =============================================================================
    // CHART-SPECIFIC CONFIGURATION
    // =============================================================================

    const CONFIG = {
        chartTitle: 'Non Paid Visits Stats',
        datasetName: 'Non Paid Visits STATs',
        fallbackIndex: 2,
        defaultTimeRange: '90D',
        expectedMetrics: ['nonpaid_visits_pct', 'psa_visits_pct'],
        
        // UI selectors specific to this chart
        canvasId: 'nonPaidVisitStatsChart',
        togglesSelector: '.non-paid-visit-stats-toggles',
        metricsHeaderSelector: '.non-paid-visit-stats-metrics-title',
        controlsSelector: '.non-paid-visit-stats-controls',
        selectAllBtnId: 'non-paid-visit-stats-select-all-btn',
        deselectAllBtnId: 'non-paid-visit-stats-deselect-all-btn',
        
        // HTML Generator config
        htmlConfig: {
            containerClass: 'non-paid-visit-stats-container.usesCustomDatePicker',
            headerClass: 'non-paid-visit-stats-header',
            titleClass: 'non-paid-visit-stats-title',
            chartTitle: 'Non Paid Visits Stats',
            controlsClass: 'non-paid-visit-stats-controls',
            chartObject: 'NonPaidVisitStatsChart',
            canvasClass: 'non-paid-visit-stats-canvas',
            canvasId: 'nonPaidVisitStatsChart',
            metricsClass: 'non-paid-visit-stats-metrics',
            metricsHeaderClass: 'non-paid-visit-stats-metrics-title',
            togglesClass: 'non-paid-visit-stats-toggles',
            useModeDate: true // Use custom date picker instead of time range buttons
        },
        
        getMetrics: function() {
            return getPercentageMetricsFromDataset(CONFIG.datasetName, CONFIG.fallbackIndex);
        }
    };

    // State
    let chart;
    let rawData = [];
    let processedData = {};
    let currentDateRange = { startDate: null, endDate: null };
    let isZoomEnabled = { value: false };
    let dynamicMetrics = [];
    let modeDatePicker = null;

    // =============================================================================
    // CHART-SPECIFIC METRIC EXTRACTION
    // =============================================================================

    function getPercentageMetricsFromDataset(datasetName, fallbackIndex = null) {
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
        // Filter for percentage/metric columns, excluding date and ID columns
        const dateTimePattern = /^(date|day|time|created|updated|timestamp|id)$/i;
        const metrics = columns.filter(col => {
            if (dateTimePattern.test(col)) return false;
            // Include columns that end with _pct or contain percentage/percent
            return /_pct$/i.test(col) || /percentage|percent/i.test(col);
        });
        
        return metrics;
    }

    // =============================================================================
    // HTML GENERATION
    // =============================================================================

    function generateHTML() {
        const existingContainer = document.querySelector(`.${CONFIG.htmlConfig.containerClass}`);
        
        if (existingContainer) {
            const hasContent = existingContainer.querySelector(`#${CONFIG.canvasId}`);
            if (hasContent) {
                return true;
            }
        }
        
        const success = lib.injectChartSmart(CONFIG.htmlConfig, 'body');
        
        if (success) {
            const style = document.createElement('style');
            style.textContent = `
                .non-paid-visit-stats-container {
                    margin: 20px 0;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: white;
                }
                .non-paid-visit-stats-header {
                    margin-bottom: 20px;
                }
                .non-paid-visit-stats-controls .control-btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    margin: 0 5px 5px 0;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .non-paid-visit-stats-controls .control-btn:hover {
                    background: #0056b3;
                }
                .non-paid-visit-stats-controls .control-btn.active {
                    background: #28a745;
                }
                #nonPaidVisitStatsChart {
                    max-height: 500px;
                }
            `;
            document.head.appendChild(style);
            return true;
        }
        return false;
    }

    // =============================================================================
    // CHART-SPECIFIC METRIC DEFINITIONS
    // =============================================================================

    function formatMetricName(columnName) {
        return columnName
            .replace(/_/g, ' ')
            .replace(/pct/g, '%')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    function createDynamicMetrics(availableMetrics) {
        // Create metrics for all discovered percentage columns
        dynamicMetrics = availableMetrics.map((metric, index) => {
            let config;
            
            switch(metric) {
                case 'nonpaid_visits_pct':
                    config = {
                        id: 'nonpaid_visits_pct',
                        name: 'Non-Paid Visits %',
                        color: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        visible: true,
                        type: 'line',
                        yAxisID: 'y',
                        order: 1
                    };
                    break;
                case 'psa_visits_pct':
                    config = {
                        id: 'psa_visits_pct',
                        name: 'PSA Visits %',
                        color: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        visible: true,
                        type: 'line',
                        yAxisID: 'y',
                        order: 2
                    };
                    break;
                default:
                    // Use alternating colors for any additional metrics
                    const colors = [
                        { color: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.1)' },
                        { color: '#ffc107', backgroundColor: 'rgba(255, 193, 7, 0.1)' },
                        { color: '#6f42c1', backgroundColor: 'rgba(111, 66, 193, 0.1)' },
                        { color: '#fd7e14', backgroundColor: 'rgba(253, 126, 20, 0.1)' },
                        { color: '#20c997', backgroundColor: 'rgba(32, 201, 151, 0.1)' }
                    ];
                    const colorSet = colors[index % colors.length];
                    
                    config = {
                        id: metric,
                        name: formatMetricName(metric),
                        color: colorSet.color,
                        backgroundColor: colorSet.backgroundColor,
                        visible: true,
                        type: 'line',
                        yAxisID: 'y',
                        order: index + 3
                    };
            }
            
            return config;
        });
    }

    // =============================================================================
    // CHART-SPECIFIC DATA PROCESSING
    // =============================================================================

    function processData() {
        if (!rawData || !rawData.length) {
            processedData = { labels: [] };
            dynamicMetrics.forEach(metric => {
                processedData[metric.id] = [];
            });
            return;
        }

        const dateColumn = lib.findDateColumn(rawData);
        if (!dateColumn) {
            return;
        }

        // Group data by day and average the percentage values
        const dailyData = {};
        
        rawData.forEach(row => {
            const date = row[dateColumn];
            if (!date) return;

            // Extract just the date part if it's a full datetime
            const dayKey = date.includes && date.includes(' ') ? date.split(' ')[0] : date;
            
            // Normalize date format to YYYY-MM-DD
            const normalizedDay = lib.normalizeDate(dayKey);

            if (!dailyData[normalizedDay]) {
                dailyData[normalizedDay] = {};
                dynamicMetrics.forEach(metric => {
                    dailyData[normalizedDay][metric.id] = [];
                });
            }

            // Collect values for averaging
            dynamicMetrics.forEach(metric => {
                const value = parseFloat(row[metric.id] || 0);
                if (!isNaN(value)) {
                    dailyData[normalizedDay][metric.id].push(value);
                }
            });
        });

        // Convert to arrays sorted by date and calculate averages
        const sortedDays = Object.keys(dailyData).sort();
        
        processedData = {
            labels: sortedDays
        };

        dynamicMetrics.forEach(metric => {
            processedData[metric.id] = sortedDays.map(day => {
                const values = dailyData[day][metric.id];
                return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            });
        });
    }

    // =============================================================================
    // CHART-SPECIFIC CHART.JS CONFIGURATION
    // =============================================================================

    function createChart() {
        const canvas = document.getElementById(CONFIG.canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Register plugins using shared library
        lib.registerStandardPlugins();

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
                        text: CONFIG.chartTitle
                    },
                    legend: {
                        display: false
                    },
                    tooltip: lib.getStandardTooltipConfig(),
                    zoom: lib.getStandardZoomConfig()
                },
                scales: {
                    x: Object.assign(lib.getStandardTimeScale('Date'), {
                        adapters: {
                            date: {}
                        }
                    }),
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 0,
                        title: {
                            display: true,
                            text: 'Decimal Value'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(2);
                            }
                        }
                    }
                },
                animation: {
                    duration: 750,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    // =============================================================================
    // CHART-SPECIFIC DATASET CREATION
    // =============================================================================

    function filterByDateRange() {
        if (currentDateRange.startDate && currentDateRange.endDate) {
            return lib.filterDataByDateRange(processedData, currentDateRange.startDate, currentDateRange.endDate, 'Non Paid Visit Stats');
        } else {
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            
            const defaultStart = thirtyDaysAgo.toISOString().split('T')[0];
            const defaultEnd = today.toISOString().split('T')[0];
            
            return lib.filterDataByDateRange(processedData, defaultStart, defaultEnd, 'Non Paid Visit Stats');
        }
    }

    function createDatasets() {
        const filteredData = filterByDateRange();
        
        return dynamicMetrics.map(metric => {
            const data = filteredData[metric.id] || [];
            
            return {
                label: metric.name,
                data: data,
                borderColor: metric.color,
                backgroundColor: metric.backgroundColor,
                borderWidth: 2,
                type: metric.type,
                yAxisID: metric.yAxisID,
                order: metric.order,
                hidden: !metric.visible,
                fill: false,
                tension: 0.1,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: metric.color,
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2
            };
        });
    }

    function updateChart() {
        if (!chart || !processedData.labels) return;

        const datasets = createDatasets();
        const filteredData = filterByDateRange();

        chart.data.labels = filteredData.labels;
        chart.data.datasets = datasets;
        
        chart.update('active');
    }

    // =============================================================================
    // DATA LOADING USING SHARED LIBRARY
    // =============================================================================

    function loadData() {
        try {
            const extractedMetrics = CONFIG.getMetrics();

            if (extractedMetrics.length > 0) {
                createDynamicMetrics(extractedMetrics);
                rawData = lib.loadDatasetContent(CONFIG, 'Non Paid Visit Stats');
                createMetricToggles();
                processData();
                setupDatePicker();
                updateChart();
            }
        } catch (error) {
            console.error('Non Paid Visit Stats: Error loading data:', error);
        }
    }

    // =============================================================================
    // UI CONTROLS USING SHARED LIBRARY
    // =============================================================================

    let toggleMetric;

    function createMetricToggles() {
        toggleMetric = lib.createStandardToggleMetric(dynamicMetrics, updateChart);
        
        const config = Object.assign({}, CONFIG, {
            updateChart: updateChart
        });
        lib.createStandardMetricToggles(config, dynamicMetrics, toggleMetric);
    }

    // =============================================================================
    // CUSTOM DATE PICKER INTEGRATION
    // =============================================================================

    function onDateRangeChange(dateRange) {
        currentDateRange = dateRange;
        updateChart();
    }

    function setupDatePicker() {
        try {
            modeDatePicker = lib.registerWithCustomDatePicker('Non Paid Visit Stats', onDateRangeChange, 30);
            
            const initialRange = modeDatePicker.getCurrentDateRange();
            if (initialRange.startDate && initialRange.endDate) {
                currentDateRange = initialRange;
            }
        } catch (error) {
            console.log('Non Paid Visit Stats: Custom date picker setup failed, using default 30-day range:', error.message);
        }
    }
    
    function toggleZoom() {
        isZoomEnabled.value = !isZoomEnabled.value;

        const btn = event.target;
        btn.classList.toggle('active', isZoomEnabled.value);
        btn.textContent = isZoomEnabled.value ? 'Zoom ON' : 'Zoom';

        if (chart && chart.options.plugins.zoom) {
            chart.options.plugins.zoom.zoom.wheel.enabled = isZoomEnabled.value;
            chart.options.plugins.zoom.zoom.pinch.enabled = isZoomEnabled.value;
        }
        
        if (chart) {
            chart.update('none');
        }
    }

    function resetZoom() {
        if (chart && chart.resetZoom) {
            chart.resetZoom();
        }

        document.querySelectorAll(`${CONFIG.controlsSelector} .control-btn`)
            .forEach(btn => {
                if (btn.textContent.includes('Zoom')) {
                    btn.classList.remove('active');
                    btn.textContent = 'Zoom';
                    isZoomEnabled.value = false;
                    
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

    function customInit() {
        if (!generateHTML()) {
            return false;
        }
        
        setTimeout(() => {
            const canvas = document.getElementById(CONFIG.canvasId);
            const toggles = document.querySelector(CONFIG.togglesSelector);
            
            if (!canvas || !toggles) {
                return;
            }
            
            if (typeof Chart !== 'undefined') {
                createChart();
                
                if (typeof datasets !== 'undefined') {
                    loadData();
                } else {
                    lib.pollForData(loadData);
                }
            }
        }, 50);
        
        return true;
    }

    const attemptInit = lib.createStandardAttemptInit(customInit);

    // =============================================================================
    // EXPORT USING SHARED LIBRARY
    // =============================================================================

    lib.createStandardExport('NonPaidVisitStatsChart', {
        loadData,
        setDateRange: (startDate, endDate) => {
            if (modeDatePicker) {
                modeDatePicker.setDateRange(startDate, endDate);
            } else {
                currentDateRange = { startDate, endDate };
                updateChart();
            }
        },
        getCurrentDateRange: () => currentDateRange,
        toggleZoom,
        resetZoom,
        toggleMetric,
        selectAll: () => lib.selectAllMetrics(dynamicMetrics, updateChart),
        deselectAll: () => lib.deselectAllMetrics(dynamicMetrics, updateChart),
        getChart: () => chart,
        getMetrics: () => dynamicMetrics,
        getCurrentData: () => processedData
    });

    // =============================================================================
    // INITIALIZATION USING SHARED LIBRARY
    // =============================================================================

    setTimeout(() => {
        lib.setupStandardInitialization(attemptInit);
    }, 100);

})(); 