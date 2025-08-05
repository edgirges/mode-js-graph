// =============================================================================
// PMP vs Open Market Line Chart (Using Shared Library)
// =============================================================================

(function() {
    'use strict';

    // Access shared library
    const lib = window.ChartLibrary;

    // =============================================================================
    // CHART-SPECIFIC CONFIGURATION
    // =============================================================================

    const CONFIG = {
        chartTitle: 'PMP v Open Market Impressions',
        datasetName: 'PMP vs OpenMarket Imps and Spend (Obj filter does not apply)',
        fallbackIndex: 5,
        defaultTimeRange: '90D',
        displayMetrics: ['imps_banner_open_market', 'imps_banner_pmp', 'imps_open_market', 'imps_pmp', 'imps_total', 'imps_video_open_market', 'imps_video_pmp'],
        
        // UI selectors specific to this chart
        canvasId: 'pmpVOpenMarketLineChart',
        togglesSelector: '.pmp-v-open-market-line-toggles',
        metricsHeaderSelector: '.pmp-v-open-market-line-metrics-title',
        controlsSelector: '.pmp-v-open-market-line-controls',
        selectAllBtnId: 'pmp-line-select-all-btn',
        deselectAllBtnId: 'pmp-line-deselect-all-btn',
        
        // HTML Generator config
        htmlConfig: {
            containerClass: 'pmp-v-open-market-line-container.usesCustomDatePicker',
            headerClass: 'pmp-v-open-market-line-header',
            titleClass: 'pmp-v-open-market-line-title',
            chartTitle: 'PMP v Open Market Impressions (Lines)',
            controlsClass: 'pmp-v-open-market-line-controls',
            chartObject: 'PmpVOpenMarketLineChart',
            canvasClass: 'pmp-v-open-market-line-canvas',
            canvasId: 'pmpVOpenMarketLineChart',
            metricsClass: 'pmp-v-open-market-line-metrics',
            metricsHeaderClass: 'pmp-v-open-market-line-metrics-title',
            togglesClass: 'pmp-v-open-market-line-toggles',
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
                .pmp-v-open-market-line-container {
                    margin: 20px 0;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: white;
                }
                .pmp-v-open-market-line-header {
                    margin-bottom: 20px;
                }
                .pmp-v-open-market-line-controls .control-btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    margin: 0 5px 5px 0;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .pmp-v-open-market-line-controls .control-btn:hover {
                    background: #0056b3;
                }
                .pmp-v-open-market-line-controls .control-btn.active {
                    background: #28a745;
                }
                #pmpVOpenMarketLineChart {
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
        return columnName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    function createDynamicMetrics(availableMetrics) {
        // Filter metrics to only include those in displayMetrics and available in data
        const filteredMetrics = CONFIG.displayMetrics.filter(metric => availableMetrics.includes(metric));
        
        const colors = [
            '#007bff', '#28a745', '#dc3545', '#ffc107', 
            '#6f42c1', '#fd7e14', '#343a40'
        ];
        
        dynamicMetrics = filteredMetrics.map((metric, index) => ({
            id: metric,
            name: formatMetricName(metric),
            color: colors[index % colors.length],
            backgroundColor: 'transparent',
            visible: true,
            type: 'line',
            yAxisID: 'y',
            order: index + 1
        }));
    }

    // =============================================================================
    // CHART-SPECIFIC DATA PROCESSING
    // =============================================================================

    function processData() {
        if (!rawData || !rawData.length || !dynamicMetrics.length) {
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

        // Aggregation logic with count tracking for averaging
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
                    dailyData[normalizedDay][metric.id] = 0;
                    dailyData[normalizedDay][`${metric.id}_count`] = 0;
                });
            }
            
            dynamicMetrics.forEach(metric => {
                const value = parseFloat(row[metric.id] || 0);
                if (!isNaN(value)) {
                    dailyData[normalizedDay][metric.id] += value;
                    dailyData[normalizedDay][`${metric.id}_count`] += 1;
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
                const count = dailyData[day][`${metric.id}_count`];
                return count > 0 ? dailyData[day][metric.id] / count : 0;
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
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Impressions'
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
            return lib.filterDataByDateRange(processedData, currentDateRange.startDate, currentDateRange.endDate, 'PMP Open Market Line');
        } else {
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            
            const defaultStart = thirtyDaysAgo.toISOString().split('T')[0];
            const defaultEnd = today.toISOString().split('T')[0];
            
            return lib.filterDataByDateRange(processedData, defaultStart, defaultEnd, 'PMP Open Market Line');
        }
    }

    function createDatasets() {
        const filteredData = filterByDateRange();
        
        return dynamicMetrics
            .filter(metric => metric.visible)
            .map(metric => ({
                label: metric.name,
                data: filteredData[metric.id] || [],
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
                rawData = lib.loadDatasetContent(CONFIG, 'PMP Open Market Line');
                createMetricToggles();
                processData();
                setupDatePicker();
                updateChart();
            }
        } catch (error) {
            console.error('PMP Open Market Line: Error loading data:', error);
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
            modeDatePicker = lib.registerWithCustomDatePicker('PMP Open Market Line', onDateRangeChange, 30);
            
            const initialRange = modeDatePicker.getCurrentDateRange();
            if (initialRange.startDate && initialRange.endDate) {
                currentDateRange = initialRange;
            }
        } catch (error) {
            console.log('PMP Open Market Line: Custom date picker setup failed, using default 30-day range:', error.message);
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

    lib.createStandardExport('PmpVOpenMarketLineChart', {
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