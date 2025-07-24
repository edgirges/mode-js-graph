// =============================================================================
// Performance Trends by Progressing Days in Current Year
// =============================================================================

(function() {
    'use strict';

    // =============================================================================
    // METRIC EXTRACTION
    // =============================================================================

    function getMetricsFromDataset(datasetName, fallbackIndex = null) {
        if (typeof datasets === 'undefined') {
            //console.warn('datasets object not available yet');
            return [];
        }
        
        // Dataset discovery logic - preserve exactly as working area chart
        let targetDataset = null;
        if (datasets[datasetName]) {
            targetDataset = datasets[datasetName];
        } else if (fallbackIndex !== null && datasets[fallbackIndex]) {
            targetDataset = datasets[fallbackIndex];
        }   

        if (!targetDataset) {
            //console.error('No dataset found');
            return [];
        }

        // Data validation - preserve exactly as working area chart
        const dataArray = targetDataset.content || targetDataset;
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            //console.error('Dataset has no data');
            return [];
        }

        // Metric extraction - preserve exactly as working area chart
        const columns = Object.keys(dataArray[0]);
        const dateTimePattern = /^(date|day|time|created|updated|timestamp)$/i;
        const metrics = columns.filter(col => !dateTimePattern.test(col));

        return metrics;
    }

    // =============================================================================
    // CONFIGURATION
    // =============================================================================

    const CONFIG = {
        chartTitle: 'Performance Trends by Progressing Days in Current Year',
        datasetName: 'Performance Trends by Progressing Days in Current Year (Last Touch, NO filter applies)',
        fallbackIndex: 19,
        defaultTimeRange: '90D',
        displayMetrics: ['impressions', 'total_spend'],
        getMetrics: function() {
            return getMetricsFromDataset(CONFIG.datasetName, CONFIG.fallbackIndex);
        }
    };

    // State
    let chart;
    let rawData = [];
    let processedData = {};
    let currentTimeRange = CONFIG.defaultTimeRange;
    let isZoomEnabled = false;
    let dynamicMetrics = [];    

    // =============================================================================
    // INITIALIZATION
    // =============================================================================

    function init() {
        const canvas = document.querySelector('.performanceTrendsChart');
        const toggles = document.querySelector('.performance-trends-toggles');

        if (!canvas || !toggles || typeof Chart === 'undefined') {
            return false; // Signal that we need to retry
        }

        if (!chart) {
            createChart();
        }

        if (typeof datasets !== 'undefined') {
            loadData();
            return true; // Successfully initialized
        } else {
            pollForData();
            return true; // Chart created, polling for data
        }
    }

    function pollForData() {
        if (typeof datasets !== 'undefined') {
            loadData();
        } else {
            setTimeout(pollForData, 1000);
        }
    }
    
    // Robust initialization for Mode Analytics
    function attemptInit() {
        if (init()) {
            return; // Successfully initialized
        }
        setTimeout(attemptInit, 500); // Retry if not ready
    }

    // =============================================================================
    // DATA LOADING
    // =============================================================================

    function loadData() {
        try {
            const extractedMetrics = CONFIG.getMetrics();

            if (extractedMetrics.length > 0) {
                const filteredMetrics = CONFIG.displayMetrics.filter(metric => extractedMetrics.includes(metric));

                createDynamicMetrics(filteredMetrics);
                loadDatasetContent();
                createMetricToggles();
                processData();
                updateChart();
            } else {
                console.warn('No metrics extracted from dataset');
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    function loadDatasetContent() {
        let targetDataset = null;

        if (datasets[CONFIG.datasetName]) {
            targetDataset = datasets[CONFIG.datasetName];
        } else if (datasets[CONFIG.fallbackIndex]) {
            targetDataset = datasets[CONFIG.fallbackIndex];
        }

        if (targetDataset) {
            rawData = targetDataset.content || targetDataset || [];
        }
    }

    function createDynamicMetrics(filteredMetrics) {
        // Colors for the two metrics (impressions and total_spend)
        const colors = {
            'impressions': '#007bff',      // Blue for impressions
            'total_spend': '#28a745'       // Green for total_spend
        };

        dynamicMetrics = filteredMetrics.map((metric, index) => ({
            id: metric,
            name: formatMetricName(metric),
            color: colors[metric] || '#dc3545', // Fallback red for any other metrics
            visible: true,
            yAxisID: 'y',
            order: index + 1
        }));
    }

    function formatMetricName(columnName) {
        return columnName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // =============================================================================
    // DATA PROCESSING
    // =============================================================================

    function processData() {
        if (!rawData.length || !dynamicMetrics.length) return;

        const progressingDayColumn = findProgressingDayColumn();
        if (!progressingDayColumn) return;

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
        const filteredDays = filterByTimeRange(sortedDays);

        processedData = { labels: filteredDays };

        dynamicMetrics.forEach(metric => {
            processedData[metric.id] = filteredDays.map(day => {
                const count = dailyData[day][`${metric.id}_count`];
                return count > 0 ? dailyData[day][metric.id] / count : 0;
            });
        });
    }

    function findProgressingDayColumn() {
        if (!rawData.length) return null;
        const columns = Object.keys(rawData[0]);

        if (columns.includes('progressing_day')) return 'progressing_day';
        
        // Fallback to any column with 'progressing' in name
        return columns.find(col => /progressing/i.test(col));
    }

    function filterByTimeRange(sortedDays) {
        if (currentTimeRange === 'ALL' || !sortedDays.length) return sortedDays;

        // For progressing days, filter by day range instead of calendar dates
        const daysMap = { '7D': 7, '30D': 30, '90D': 90 };
        const maxDaysToShow = daysMap[currentTimeRange];
        if (!maxDaysToShow) return sortedDays;

        // Get the last N progressing days
        return sortedDays.slice(-maxDaysToShow);
    }

    // =============================================================================
    // CHART MANAGEMENT
    // =============================================================================

    function createChart() {
        const canvas = document.getElementById('performanceTrendsChart');
        const ctx = canvas.getContext('2d');

        if (typeof ChartZoom !== 'undefined') Chart.register(ChartZoom);

        chart = new Chart(ctx, {
            type: 'bar',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        stacked: true,
                        title: { display: true, text: 'Progressing Day' }
                    },
                    y: {
                        stacked: true,
                        position: 'left',
                        title: { display: true, text: 'Value' },
                        ticks: {
                            callback: value => value.toLocaleString()
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: CONFIG.chartTitle
                    },
                    legend: { display: false },
                    zoom: {
                        zoom: {
                            wheel: { enabled: false },
                            pinch: { enabled: false },
                            mode: 'x',
                        },
                        pan: { enabled: true, mode: 'x' }
                    }
                }
            }
        });
    }

    function updateChart() {
        if (!chart || !processedData.labels) return;

        const datasets = createDatasets();
        chart.data.labels = processedData.labels;
        chart.data.datasets = datasets;
        chart.update('active');
    }

    function createDatasets() {
        return dynamicMetrics.filter(metric => metric.visible).map(metric => ({
            label: metric.name,
            data: processedData[metric.id] || [],
            backgroundColor: metric.color,
            borderColor: metric.color,
            borderWidth: 1,
            yAxisID: metric.yAxisID,
            order: metric.order
        }))
        .sort((a, b) => a.order - b.order);
    }

    // =============================================================================
    // UI CONTROLS
    // =============================================================================

    function createMetricToggles() {
        const container = document.querySelector('.performance-trends-toggles');
        if (!container || !dynamicMetrics.length) return;

        container.innerHTML = '';

        dynamicMetrics.forEach(metric => {
            const div = document.createElement('div');
            div.className = 'metric-toggle active';
            div.innerHTML = `
                <input type="checkbox" id="metric-${metric.id}" checked>
                <label for="metric-${metric.id}" class="metric-label">
                    <span class="metric-color" style="background-color: ${metric.color}"></span>
                    ${metric.name}
                </label>
            `;

            const checkbox = div.querySelector('input');
            checkbox.addEventListener('change', () => toggleMetric(metric.id));

            div.addEventListener('click', (e) => {  
                if (e.target !== checkbox) {
                    e.preventDefault();
                    checkbox.click();
                }
            });

            container.appendChild(div);
        });
    }

    function toggleMetric(metricId) {
        const metric = dynamicMetrics.find(m => m.id === metricId);
        const toggleDiv = document.getElementById(`metric-${metricId}`).parentElement;
        const checkbox = document.getElementById(`metric-${metricId}`);

        metric.visible = checkbox.checked;
        toggleDiv.classList.toggle('active', metric.visible);
        updateChart();
    }

    function switchTimeRange(timeRange) {
        currentTimeRange = timeRange;

        document.querySelectorAll('.performance-trends-controls .control-btn')
            .forEach(btn => {
                btn.classList.remove('active');
                const btnText = btn.textContent.trim();
                if (btnText === timeRange || (timeRange === 'ALL' && btnText === 'All')) {
                    btn.classList.add('active');
                }
            });

        processData();
        updateChart();
    }

    function toggleZoom() {
        isZoomEnabled = !isZoomEnabled;

        const btn = event.target;
        btn.classList.toggle('active', isZoomEnabled);
        btn.textContent = isZoomEnabled ? 'Zoom ON' : 'Zoom';

        if (chart.options.plugins.zoom) {
            chart.options.plugins.zoom.zoom.wheel.enabled = isZoomEnabled;
            chart.options.plugins.zoom.zoom.pinch.enabled = isZoomEnabled;
        }

        chart.update('none');
    }

    function resetZoom() {
        if (chart && chart.resetZoom) {
            chart.resetZoom();
        }

        document.querySelectorAll('.performance-trends-controls .control-btn')
            .forEach(btn => {
                if (btn.textContent.includes('Zoom')) {
                    btn.classList.remove('active');
                    btn.textContent = 'Zoom';
                    isZoomEnabled = false;
                }
            });
            
        if (chart && chart.options.plugins.zoom) {
            chart.options.plugins.zoom.zoom.wheel.enabled = false;
            chart.options.plugins.zoom.zoom.pinch.enabled = false;
        }

        chart.update('none');
    }

    // =============================================================================
    // EXPORT
    // =============================================================================

    window.PerformanceTrendsChart = {
        loadData,
        switchTimeRange,
        toggleZoom,
        resetZoom,
        toggleMetric,
        getChart: () => chart,
        getMetrics: () => dynamicMetrics,
        getCurrentData: () => processedData
    };

    // Initialize - Multiple entry points for Mode Analytics reliability
    document.addEventListener('DOMContentLoaded', () => setTimeout(attemptInit, 100));
    setTimeout(attemptInit, 200); // Also try independently of DOM ready
} )();