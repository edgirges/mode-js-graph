// =============================================================================
// Performance Trends by Progressing Days Chart (Using Shared Library)
// =============================================================================

(function() {
    'use strict';

    // Access shared library
    const lib = window.ChartLibrary;

    // =============================================================================
    // CHART-SPECIFIC CONFIGURATION
    // =============================================================================

    const CONFIG = {
        chartTitle: 'Performance Trends by Progressing Days in Current Year',
        datasetName: 'Performance Trends by Progressing Days in Current Year (Last Touch, NO filter applies)',
        fallbackIndex: 19,
        defaultTimeRange: '90D',
        displayMetrics: ['impressions', 'total_spend'],
        
        // UI selectors specific to this chart
        canvasId: 'performanceTrendsChart',
        togglesSelector: '.performance-trends-toggles',
        metricsHeaderSelector: '.performance-trends-metrics-title',
        controlsSelector: '.performance-trends-controls',
        selectAllBtnId: 'performance-trends-select-all-btn',
        deselectAllBtnId: 'performance-trends-deselect-all-btn',
        
        // HTML Generator config
        htmlConfig: {
            containerClass: 'performance-trends-container.usesCustomDatePicker',
            headerClass: 'performance-trends-header',
            titleClass: 'performance-trends-title',
            chartTitle: 'Performance Trends by Progressing Days in Current Year',
            controlsClass: 'performance-trends-controls',
            chartObject: 'PerformanceTrendsChart',
            canvasClass: 'performance-trends-canvas',
            canvasId: 'performanceTrendsChart',
            metricsClass: 'performance-trends-metrics',
            metricsHeaderClass: 'performance-trends-metrics-title',
            togglesClass: 'performance-trends-toggles',
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
                .performance-trends-container {
                    margin: 20px 0;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: white;
                }
                .performance-trends-header {
                    margin-bottom: 20px;
                }
                .performance-trends-controls .control-btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    margin: 0 5px 5px 0;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .performance-trends-controls .control-btn:hover {
                    background: #0056b3;
                }
                .performance-trends-controls .control-btn.active {
                    background: #28a745;
                }
                #performanceTrendsChart {
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
        
        // Colors for the two metrics (impressions and total_spend)
        const colors = {
            'impressions': '#007bff',      // Blue for impressions
            'total_spend': '#28a745'       // Green for total_spend
        };

        dynamicMetrics = filteredMetrics.map((metric, index) => ({
            id: metric,
            name: formatMetricName(metric),
            color: colors[metric] || '#dc3545', // Fallback red for any other metrics
            backgroundColor: colors[metric] || '#dc3545',
            visible: true,
            type: 'bar',
            yAxisID: 'y',
            order: index + 1
        }));
    }

    // =============================================================================
    // CHART-SPECIFIC DATA PROCESSING
    // =============================================================================

    function findProgressingDayColumn() {
        if (!rawData.length) return null;
        const columns = Object.keys(rawData[0]);

        if (columns.includes('progressing_day')) return 'progressing_day';
        
        // Fallback to any column with 'progressing' in name
        return columns.find(col => /progressing/i.test(col));
    }

    function processData() {
        if (!rawData || !rawData.length || !dynamicMetrics.length) {
            processedData = { labels: [] };
            dynamicMetrics.forEach(metric => {
                processedData[metric.id] = [];
            });
            return;
        }

        const progressingDayColumn = findProgressingDayColumn();
        if (!progressingDayColumn) {
            return;
        }

        // Aggregation logic with count tracking for averaging
        const dailyData = {};

        rawData.forEach(row => {
            const progressingDay = row[progressingDayColumn];
            if (progressingDay === null || progressingDay === undefined) return;

            const dayKey = String(progressingDay);

            if (!dailyData[dayKey]) {
                dailyData[dayKey] = {};
                dynamicMetrics.forEach(metric => {
                    dailyData[dayKey][metric.id] = 0;
                    dailyData[dayKey][`${metric.id}_count`] = 0;
                });
            }

            dynamicMetrics.forEach(metric => {
                const value = parseFloat(row[metric.id] || 0);
                if (!isNaN(value)) {
                    dailyData[dayKey][metric.id] += value;
                    dailyData[dayKey][`${metric.id}_count`] += 1;
                }
            });
        });

        // Sort by progressing day number instead of date
        const sortedDays = Object.keys(dailyData).sort((a, b) => parseInt(a) - parseInt(b));
        
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
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Progressing Day'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        stacked: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Value'
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
        // Note: This chart uses progressing days, not calendar dates
        // For now, we'll apply date filtering to the processed data if needed
        // But the chart's primary filtering is by progressing day range
        if (currentDateRange.startDate && currentDateRange.endDate) {
            // For progressing days chart, we don't filter by calendar dates
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
                rawData = lib.loadDatasetContent(CONFIG, 'Performance Trends');
                createMetricToggles();
                processData();
                setupDatePicker();
                updateChart();
            }
        } catch (error) {
            console.error('Performance Trends: Error loading data:', error);
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
            modeDatePicker = lib.registerWithCustomDatePicker('Performance Trends', onDateRangeChange, 30);
            
            const initialRange = modeDatePicker.getCurrentDateRange();
            if (initialRange.startDate && initialRange.endDate) {
                currentDateRange = initialRange;
            }
        } catch (error) {
            console.log('Performance Trends: Custom date picker setup failed, using default 30-day range:', error.message);
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

    lib.createStandardExport('PerformanceTrendsChart', {
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