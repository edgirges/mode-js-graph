// =============================================================================
// New Campaign Groups Starting each Month for First 30 Days
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

        const dataArray = targetDataset.content || targetDataset;
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            //console.error('Dataset has no data');
            return [];
        }

        // Metric extraction
        const columns = Object.keys(dataArray[0]);
        const dateTimePattern = /^(date|day|time|created|updated|timestamp)$/i;
        const metrics = columns.filter(col => !dateTimePattern.test(col));

        return metrics;
    }
    
    // =============================================================================
    // CONFIGURATION
    // =============================================================================

    const CONFIG = {
        chartTitle: 'New Campaign Groups Starting each Month for First 30 Days',
        datasetName: 'New Campaign Groups Starting each Month for First 30 Days',
        fallbackIndex: 20,
        defaultTimeRange: '90D',
        displayMetrics: ['order_values_per_cg', 'order_values', 'visits', 'total_spend', 'impressions'],
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
        const canvas = document.getElementById('campaignGroups30DaysChart');
        const toggles = document.querySelector('.campaign-groups-30-days-toggles');

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
        if (typeof datasets === 'undefined') {
            loadData();
        } else {
            setTimeout(pollForData, 1000);
        }
    }

    function attemptInit() {
        if (init()) {
            return;
        }
        setTimeout(attemptInit, 500);
    }

    // =============================================================================
    // DATA LOADING
    // =============================================================================

    function loadData() {
        try {
            //console.log('New Campaign Groups Starting each Month for First 30 Days: Loading data from Mode Analytics');

            const extractedMetrics = CONFIG.getMetrics();
            //console.log('New Campaign Groups Starting each Month for First 30 Days: Extracted metrics:', extractedMetrics);

            if (extractedMetrics.length > 0) {
                const filteredMetrics = CONFIG.displayMetrics.filter(metric => extractedMetrics.includes(metric));
                //console.log('New Campaign Groups Starting each Month for First 30 Days: Filtered metrics:', filteredMetrics);

                createDynamicMetrics(filteredMetrics);
                loadDatasetContent();
                createMetricToggles();
                processData();
                updateChart();
            } else {
                console.warn('New Campaign Groups Starting each Month for First 30 Days: No metrics extracted from dataset');
            }
        } catch (error) {
            console.error('New Campaign Groups Starting each Month for First 30 Days: Error loading data:', error);
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
            'order_values_per_cg': '#007bff',
            'order_values': '#28a745',
            'visits': '#ffc107',
            'total_spend': '#dc3545',
            'impressions': '#6c757d'
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
        if (!rawData.length || !dynamicMetrics.length) {
            //console.log('New Campaign Groups Starting each Month for First 30 Days: No data to process. rawData length:', rawData.length, 'dynamicMetrics length:', dynamicMetrics.length);
            return;
        }

        const monthList = rawData.map(row => row.month);
        const uniqueMonths = [...new Set(monthList)];

        uniqueMonths.forEach(month => {
            processedData[month] = {};
        });

        dynamicMetrics.forEach(metric => {
            processedData[metric.id] = uniqueMonths.map(month => {
                const metricValue = rawData.find(row => row.month === month)?.[metric.id] || 0;
                return parseFloat(metricValue) || 0;
            });
        });
    }

    // =============================================================================
    // CHART MANAGEMENT
    // =============================================================================

    function createChart() {
        const canvas = document.getElementById('campaignGroups30DaysChart');
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
                        title: { display: true, text: 'Month' }
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
                    legend: {
                        display: false
                    },
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
        const container = document.querySelector('.campaign-groups-30-days-toggles');
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
        
        document.querySelectorAll('.campaign-groups-30-days-controls .control-btn')
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

        document.querySelectorAll('.campaign-groups-30-days-controls .control-btn')
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

    window.CampaignGroups30DaysChart = {
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
});