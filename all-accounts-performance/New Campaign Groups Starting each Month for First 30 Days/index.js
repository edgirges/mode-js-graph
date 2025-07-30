// =============================================================================
// New Campaign Groups Starting each Month for First 30 Days
// =============================================================================

(function() {
    'use strict';

    console.log('=== Campaign Groups 30 Days Chart script loaded! ===');

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
        console.log('Campaign Groups 30 Days: Attempting initialization...');
        if (init()) {
            console.log('Campaign Groups 30 Days: Successfully initialized!');
            return;
        }
        console.log('Campaign Groups 30 Days: Init failed, retrying...');
        setTimeout(attemptInit, 500);
    }

    // =============================================================================
    // DATA LOADING
    // =============================================================================

    function loadData() {
        try {
            console.log('Campaign Groups 30 Days: Loading data from Mode Analytics');
            console.log('Campaign Groups 30 Days: Available datasets:', typeof datasets !== 'undefined' ? Object.keys(datasets) : 'datasets not defined');

            const extractedMetrics = CONFIG.getMetrics();
            console.log('Campaign Groups 30 Days: Extracted metrics:', extractedMetrics);

            if (extractedMetrics.length > 0) {
                const filteredMetrics = CONFIG.displayMetrics.filter(metric => extractedMetrics.includes(metric));
                console.log('Campaign Groups 30 Days: Filtered metrics:', filteredMetrics);

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
            console.log('Campaign Groups 30 Days: Found dataset by name:', CONFIG.datasetName);
        } else if (datasets[CONFIG.fallbackIndex]) {
            targetDataset = datasets[CONFIG.fallbackIndex];
            console.log('Campaign Groups 30 Days: Using fallback dataset at index', CONFIG.fallbackIndex);
        } else {
            console.log('Campaign Groups 30 Days: Neither dataset name nor fallback index found');
            console.log('Campaign Groups 30 Days: Looking for name:', CONFIG.datasetName);
            console.log('Campaign Groups 30 Days: Looking for index:', CONFIG.fallbackIndex);
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
            console.log('Campaign Groups 30 Days: No data to process. rawData length:', rawData.length, 'dynamicMetrics length:', dynamicMetrics.length);
            return;
        }

        // Extract and sort months
        const monthList = rawData.map(row => row.month).filter(Boolean);
        const uniqueMonths = [...new Set(monthList)].sort();

        console.log('Campaign Groups 30 Days: Found months:', uniqueMonths);

        // Set up processed data structure for Chart.js
        processedData = { labels: uniqueMonths };

        // Process each metric for each month
        dynamicMetrics.forEach(metric => {
            processedData[metric.id] = uniqueMonths.map(month => {
                const row = rawData.find(r => r.month === month);
                const value = row ? parseFloat(row[metric.id] || 0) : 0;
                return value;
            });
           
        });

        console.log('Campaign Groups 30 Days: Processed data for', uniqueMonths.length, 'months and', dynamicMetrics.length, 'metrics');
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

        console.log('updateChart: dynamicMetrics visibility:', dynamicMetrics.map(m => `${m.id}:${m.visible}`));
        const datasets = createDatasets();      
        console.log('updateChart: created datasets:', datasets.map(d => d.label));
        chart.data.labels = processedData.labels;
        chart.data.datasets = datasets;
        chart.update('active');
    }

    function createDatasets() {
        const visibleMetrics = dynamicMetrics.filter(metric => metric.visible);
        console.log('createDatasets: visible metrics:', visibleMetrics.map(m => m.id));
        
        return visibleMetrics.map(metric => {
            const data = processedData[metric.id] || [];
            console.log(`createDatasets: ${metric.id} has data length:`, data.length, 'sample:', data.slice(0,3));
            return {
            label: metric.name,
                data: data,
            backgroundColor: metric.color,
            borderColor: metric.color,
            borderWidth: 1,
            yAxisID: metric.yAxisID,
            order: metric.order
            };
        })
        .sort((a, b) => a.order - b.order);
    }

    // =============================================================================
    // UI CONTROLS
    // =============================================================================

    function createMetricToggles() {
        const container = document.querySelector('.campaign-groups-30-days-toggles');
        if (!container || !dynamicMetrics.length) return;

        container.innerHTML = '';
        console.log('Creating toggles for metrics:', dynamicMetrics.map(m => m.id));

        dynamicMetrics.forEach(metric => {
            const div = document.createElement('div');
            div.className = 'metric-toggle active';
            div.innerHTML = `
                <input type="checkbox" class="metric-checkbox" id="metric-${metric.id}" checked>
                <label for="metric-${metric.id}" class="metric-label">
                    <span class="metric-color" style="background-color: ${metric.color}"></span>
                    ${metric.name}
                </label>
            `;

            const checkbox = div.querySelector('.metric-checkbox');
            console.log(`Created checkbox for metric: ${metric.id}, element ID: metric-${metric.id}`);
            
            checkbox.addEventListener('change', (e) => {
                console.log(`Checkbox changed for metric: ${metric.id}, new checked state: ${e.target.checked}`);
                e.stopPropagation();
                toggleMetric(metric.id, e.target.checked);
            });

            div.addEventListener('click', (e) => {
                if (e.target === checkbox || e.target.tagName === 'INPUT') return;
                console.log(`Div clicked for metric: ${metric.id}, current checked: ${checkbox.checked}`);
                    e.preventDefault();
                e.stopPropagation();
                const newState = !checkbox.checked;
                checkbox.checked = newState;
                toggleMetric(metric.id, newState);
            });

            container.appendChild(div);
        });
    }

    function toggleMetric(metricId, checkedState) {
        const metric = dynamicMetrics.find(m => m.id === metricId);
        if (!metric) {
            console.log(`Metric not found: ${metricId}`);
            return;
        }
        
        const checkbox = document.getElementById(`metric-${metricId}`);
        if (!checkbox) {
            console.log(`Checkbox not found for ID: metric-${metricId}`);
            return;
        }
        
        const toggleDiv = checkbox.parentElement;
        
        console.log(`toggleMetric: ${metricId} - passed state: ${checkedState}, old visibility: ${metric.visible}`);
        metric.visible = checkedState;
        console.log(`toggleMetric: ${metricId} - new visibility: ${metric.visible}`);
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

})(); // End IIFE