// =============================================================================
// RAW Visits and Conv (by Month) Chart (Using Shared Library)
// =============================================================================

(function() {
    'use strict';

    // Access shared library
    const lib = window.ChartLibrary;

    // =============================================================================
    // CHART-SPECIFIC CONFIGURATION
    // =============================================================================

    const CONFIG = {
        chartTitle: 'RAW Visits and Conv (by Month)',
        datasetName: 'RAW Visits and Conv (by Month)',
        fallbackIndex: 23,
        defaultTimeRange: '90D',
        displayMetrics: ['Raw Visits', 'Raw Order Values', 'Raw Conversions'],
        
        // UI selectors specific to this chart
        canvasId: 'rawVisitsConvChart',
        togglesSelector: '.raw-visits-conv-toggles',
        metricsHeaderSelector: '.raw-visits-conv-metrics-title',
        controlsSelector: '.raw-visits-conv-controls',
        selectAllBtnId: 'raw-visits-conv-select-all-btn',
        deselectAllBtnId: 'raw-visits-conv-deselect-all-btn',
        
        // HTML Generator config
        htmlConfig: {
            containerClass: 'raw-visits-conv-container.usesCustomDatePicker',
            headerClass: 'raw-visits-conv-header',
            titleClass: 'raw-visits-conv-title',
            chartTitle: 'RAW Visits and Conv (by Month)',
            controlsClass: 'raw-visits-conv-controls',
            chartObject: 'RawVisitsConvChart',
            canvasClass: 'raw-visits-conv-canvas',
            canvasId: 'rawVisitsConvChart',
            metricsClass: 'raw-visits-conv-metrics',
            metricsHeaderClass: 'raw-visits-conv-metrics-title',
            togglesClass: 'raw-visits-conv-toggles',
            useModeDate: true // Use custom date picker instead of time range buttons
        },
        
        getMetrics: function() {
            return lib.getMetricsFromDataset(CONFIG.datasetName, CONFIG.fallbackIndex);
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
                .raw-visits-conv-container {
                    margin: 20px 0;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: white;
                }
                .raw-visits-conv-header {
                    margin-bottom: 20px;
                }
                .raw-visits-conv-controls .control-btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    margin: 0 5px 5px 0;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .raw-visits-conv-controls .control-btn:hover {
                    background: #0056b3;
                }
                .raw-visits-conv-controls .control-btn.active {
                    background: #28a745;
                }
                #rawVisitsConvChart {
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

    function createDynamicMetrics(availableMetrics) {
        // Filter metrics to only include those in displayMetrics and available in data
        const filteredMetrics = CONFIG.displayMetrics.filter(metric => availableMetrics.includes(metric));
        
        dynamicMetrics = filteredMetrics.map((metric, index) => {
            let color, name;
            
            switch(metric) {
                case 'Raw Visits':
                    color = '#F59E0B'; // Orange/Yellow
                    name = 'Raw Visits';
                    break;
                case 'Raw Order Values':
                    color = '#3B82F6'; // Blue
                    name = 'Raw Order Values';
                    break;
                case 'Raw Conversions':
                    color = '#10B981'; // Teal/Green
                    name = 'Raw Conversions';
                    break;
                default:
                    color = '#6B7280'; // Gray
                    name = metric.replace(/_/g, ' ');
            }

            return {
                id: metric,
                name: name,
                color: color,
                backgroundColor: color,
                visible: true,
                type: 'bar',
                yAxisID: 'y',
                order: index + 1
            };
        });
    }

    // =============================================================================
    // CHART-SPECIFIC DATA PROCESSING
    // =============================================================================

    function findMonthColumn() {
        if (!rawData.length) return null;
        
        const columns = Object.keys(rawData[0]);
        return columns.find(col => /month/i.test(col)) || 
               columns.find(col => /date/i.test(col)) || 
               columns[0];
    }

    function processData() {
        if (!rawData || !rawData.length || !dynamicMetrics.length) {
            processedData = { labels: [] };
            dynamicMetrics.forEach(metric => {
                processedData[metric.id] = [];
            });
            return;
        }

        const monthColumn = findMonthColumn();
        if (!monthColumn) {
            console.error('RAW Visits and Conv: No month column found');
            return;
        }

        // Group by month and aggregate
        const groupedData = {};
        rawData.forEach(row => {
            const month = row[monthColumn];
            if (!month) return;

            if (!groupedData[month]) {
                groupedData[month] = {};
                dynamicMetrics.forEach(metric => {
                    groupedData[month][metric.id] = 0;
                });
            }

            dynamicMetrics.forEach(metric => {
                const value = parseFloat(row[metric.id]) || 0;
                groupedData[month][metric.id] += value;
            });
        });

        // Convert to arrays and sort by month
        const uniqueMonths = Object.keys(groupedData).sort();
        
        processedData = { labels: uniqueMonths };

        dynamicMetrics.forEach(metric => {
            processedData[metric.id] = uniqueMonths.map(month => 
                groupedData[month][metric.id] || 0
            );
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
            type: 'bar',
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
                    legend: {
                        display: false
                    },
                    tooltip: lib.getStandardTooltipConfig(),
                    zoom: lib.getStandardZoomConfig()
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        },
                        stacked: false, // Important: not stacked for grouped bars
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Values'
                        },
                        stacked: false, // Important: not stacked for grouped bars
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
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
        // Note: This chart uses months, not calendar dates
        // For now, we'll apply date filtering to the processed data if needed
        if (currentDateRange.startDate && currentDateRange.endDate) {
            // For monthly chart, we don't filter by calendar dates
            // Instead, we use the full processed data
            return processedData;
        } else {
            return processedData;
        }
    }

    function createDatasets() {
        const filteredData = filterByDateRange();
        
        return dynamicMetrics
            .filter(metric => metric.visible)
            .map(metric => ({
                label: metric.name,
                data: filteredData[metric.id] || [],
                backgroundColor: metric.backgroundColor,
                borderColor: metric.color,
                borderWidth: 1,
                type: metric.type,
                yAxisID: metric.yAxisID,
                order: metric.order,
                hidden: !metric.visible
            }))
            .sort((a, b) => a.order - b.order);
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
                rawData = lib.loadDatasetContent(CONFIG, 'RAW Visits and Conv');
                createMetricToggles();
                processData();
                setupDatePicker();
                updateChart();
            }
        } catch (error) {
            console.error('RAW Visits and Conv: Error loading data:', error);
        }
    }

    // =============================================================================
    // UI CONTROLS USING SHARED LIBRARY
    // =============================================================================

    let toggleMetric;

    function createMetricToggles() {
        const config = Object.assign({}, CONFIG, {
            updateChart: updateChart
        });
        
        toggleMetric = lib.createStandardToggleMetric(dynamicMetrics, updateChart, config);
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
            modeDatePicker = lib.registerWithCustomDatePicker('RAW Visits and Conv', onDateRangeChange, 30);
            
            const initialRange = modeDatePicker.getCurrentDateRange();
            if (initialRange.startDate && initialRange.endDate) {
                currentDateRange = initialRange;
            }
        } catch (error) {
            console.log('RAW Visits and Conv: Custom date picker setup failed, using default 30-day range:', error.message);
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

    lib.createStandardExport('RawVisitsConvChart', {
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