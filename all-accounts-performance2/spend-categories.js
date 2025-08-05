// =============================================================================
// Daily BW Spend Categories Chart (Using Shared Library)
// =============================================================================

(function() {
    'use strict';

    // Access shared library
    const lib = window.ChartLibrary;

    // =============================================================================
    // CHART-SPECIFIC CONFIGURATION
    // =============================================================================

    const CONFIG = {
        chartTitle: 'Daily BW Spend Categories',
        datasetName: 'Daily BW Budget vs Spend Ratio Count (channel filter does not apply)',
        fallbackIndex: 1,
        defaultTimeRange: '90D',
        displayMetrics: ['total', 'no_budget', 'overspend', 'spend_90_pct', 'spend_90_pct_less'],
        
        // UI selectors specific to this chart
        canvasId: 'spendCategoriesChart',
        togglesSelector: '.spend-categories-toggles',
        metricsHeaderSelector: '.spend-categories-metrics-title',
        controlsSelector: '.spend-categories-controls',
        selectAllBtnId: 'spend-categories-select-all-btn',
        deselectAllBtnId: 'spend-categories-deselect-all-btn',
        
        // HTML Generator config
        htmlConfig: {
            containerClass: 'spend-categories-container.usesCustomDatePicker',
            headerClass: 'spend-categories-header',
            titleClass: 'spend-categories-title',
            chartTitle: 'Daily BW Spend Categories',
            controlsClass: 'spend-categories-controls',
            chartObject: 'SpendCategoriesChart',
            canvasClass: 'spend-categories-canvas',
            canvasId: 'spendCategoriesChart',
            metricsClass: 'spend-categories-metrics',
            metricsHeaderClass: 'spend-categories-metrics-title',
            togglesClass: 'spend-categories-toggles',
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
                .spend-categories-container {
                    margin: 20px 0;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: white;
                }
                .spend-categories-header {
                    margin-bottom: 20px;
                }
                .spend-categories-controls .control-btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    margin: 0 5px 5px 0;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .spend-categories-controls .control-btn:hover {
                    background: #0056b3;
                }
                .spend-categories-controls .control-btn.active {
                    background: #28a745;
                }
                #spendCategoriesChart {
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
        const filteredMetrics = CONFIG.displayMetrics.filter(metric => 
            availableMetrics.includes(metric)
        );

        dynamicMetrics = filteredMetrics.map(metric => {
            let config;
            
            switch(metric) {
                case 'total':
                    config = {
                        id: 'total',
                        name: 'Total',
                        color: '#9f7aea',
                        backgroundColor: 'rgba(159, 122, 234, 0.1)',
                        visible: true,
                        type: 'line',
                        yAxisID: 'y',
                        order: 5
                    };
                    break;
                case 'no_budget':
                    config = {
                        id: 'no_budget',
                        name: 'No Budget',
                        color: '#48bb78',
                        backgroundColor: 'rgba(72, 187, 120, 0.1)',
                        visible: true,
                        type: 'line',
                        yAxisID: 'y',
                        order: 1
                    };
                    break;
                case 'overspend':
                    config = {
                        id: 'overspend',
                        name: 'Overspend',
                        color: '#4299e1',
                        backgroundColor: 'rgba(66, 153, 225, 0.1)',
                        visible: true,
                        type: 'line',
                        yAxisID: 'y',
                        order: 2
                    };
                    break;
                case 'spend_90_pct':
                    config = {
                        id: 'spend_90_pct',
                        name: 'Spend 90-100%',
                        color: '#ed8936',
                        backgroundColor: 'rgba(237, 137, 54, 0.1)',
                        visible: true,
                        type: 'line',
                        yAxisID: 'y',
                        order: 3
                    };
                    break;
                case 'spend_90_pct_less':
                    config = {
                        id: 'spend_90_pct_less',
                        name: 'Spend <90%',
                        color: '#38b2ac',
                        backgroundColor: 'rgba(56, 178, 172, 0.1)',
                        visible: true,
                        type: 'line',
                        yAxisID: 'y',
                        order: 4
                    };
                    break;
                default:
                    config = {
                        id: metric,
                        name: metric.replace(/_/g, ' '),
                        color: '#6B7280',
                        backgroundColor: 'rgba(107, 114, 128, 0.1)',
                        visible: true,
                        type: 'line',
                        yAxisID: 'y',
                        order: 6
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

        const dayColumn = lib.findDateColumn(rawData);
        if (!dayColumn) {
            return;
        }

        // Group data by day and aggregate across objective_id
        const dailyData = {};
        
        rawData.forEach(row => {
            const day = row[dayColumn];
            if (!day) return;

            // Normalize date format to YYYY-MM-DD
            const normalizedDay = lib.normalizeDate(day);

            if (!dailyData[normalizedDay]) {
                dailyData[normalizedDay] = {};
                dynamicMetrics.forEach(metric => {
                    dailyData[normalizedDay][metric.id] = 0;
                });
            }

            // Aggregate each metric
            dynamicMetrics.forEach(metric => {
                const value = parseInt(row[metric.id] || 0);
                dailyData[normalizedDay][metric.id] += value;
            });
        });

        // Convert to arrays sorted by date
        const sortedDays = Object.keys(dailyData).sort();
        
        processedData = {
            labels: sortedDays
        };

        dynamicMetrics.forEach(metric => {
            processedData[metric.id] = sortedDays.map(day => dailyData[day][metric.id] || 0);
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
                        title: {
                            display: true,
                            text: 'Count'
                        },
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
        if (currentDateRange.startDate && currentDateRange.endDate) {
            return lib.filterDataByDateRange(processedData, currentDateRange.startDate, currentDateRange.endDate, 'Spend Categories');
        } else {
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            
            const defaultStart = thirtyDaysAgo.toISOString().split('T')[0];
            const defaultEnd = today.toISOString().split('T')[0];
            
            return lib.filterDataByDateRange(processedData, defaultStart, defaultEnd, 'Spend Categories');
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
                rawData = lib.loadDatasetContent(CONFIG, 'Spend Categories');
                createMetricToggles();
                processData();
                setupDatePicker();
                updateChart();
            }
        } catch (error) {
            console.error('Spend Categories: Error loading data:', error);
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
            modeDatePicker = lib.registerWithCustomDatePicker('Spend Categories', onDateRangeChange, 30);
            
            const initialRange = modeDatePicker.getCurrentDateRange();
            if (initialRange.startDate && initialRange.endDate) {
                currentDateRange = initialRange;
            }
        } catch (error) {
            console.log('Spend Categories: Custom date picker setup failed, using default 30-day range:', error.message);
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

    lib.createStandardExport('SpendCategoriesChart', {
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