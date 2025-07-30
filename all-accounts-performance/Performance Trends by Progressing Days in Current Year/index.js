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
        const canvas = document.getElementById('performanceTrendsChart');
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
            console.log('Performance Trends: Loading data from Mode Analytics');
            
            const extractedMetrics = CONFIG.getMetrics();
            console.log('Performance Trends: Extracted metrics:', extractedMetrics);

            if (extractedMetrics.length > 0) {
                const filteredMetrics = CONFIG.displayMetrics.filter(metric => extractedMetrics.includes(metric));
                console.log('Performance Trends: Filtered metrics:', filteredMetrics);

                createDynamicMetrics(filteredMetrics);
                loadDatasetContent();
                createMetricToggles();
                processData();
                updateChart();
            } else {
                console.warn('Performance Trends: No metrics extracted from dataset');
            }
        } catch (error) {
            console.error('Performance Trends: Error loading data:', error);
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
        if (!rawData.length || !dynamicMetrics.length) {
            console.log('Performance Trends: No data to process. rawData length:', rawData.length, 'dynamicMetrics length:', dynamicMetrics.length);
            return;
        }

        const progressingDayColumn = findProgressingDayColumn();
        console.log('Performance Trends: Found progressing day column:', progressingDayColumn);
        
        if (!progressingDayColumn) {
            console.log('Performance Trends: Available columns:', rawData.length > 0 ? Object.keys(rawData[0]) : 'no data');
            return;
        }

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

        // Add select/deselect all buttons
        const metricsHeader = document.querySelector('.performance-trends-metrics-title');
        if (metricsHeader && !document.getElementById('performance-trends-select-all-btn')) {
            const selectAllBtn = document.createElement('button');
            selectAllBtn.id = 'performance-trends-select-all-btn';
            selectAllBtn.className = 'select-all-btn';
            selectAllBtn.textContent = 'Select All';
            selectAllBtn.onclick = selectAllMetrics;
            
            const deselectAllBtn = document.createElement('button');
            deselectAllBtn.id = 'performance-trends-deselect-all-btn';
            deselectAllBtn.className = 'deselect-all-btn';
            deselectAllBtn.textContent = 'Deselect All';
            deselectAllBtn.onclick = deselectAllMetrics;
            
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'metrics-buttons-container';
            buttonsContainer.style.marginBottom = '15px';
            buttonsContainer.appendChild(selectAllBtn);
            buttonsContainer.appendChild(deselectAllBtn);
            
            metricsHeader.parentNode.insertBefore(buttonsContainer, container);
        }

        dynamicMetrics.forEach(metric => {
            const div = document.createElement('div');
            div.className = `metric-toggle ${metric.visible ? 'active' : ''}`;
            div.innerHTML = `
                <input type="checkbox" class="metric-checkbox" id="metric-${metric.id}" ${metric.visible ? 'checked' : ''}>
                <label for="metric-${metric.id}" class="metric-label">
                    <span class="metric-color" style="background-color: ${metric.color}"></span>
                    ${metric.name}
                </label>
            `;

            const checkbox = div.querySelector('.metric-checkbox');
            
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                toggleMetric(metric.id, e.target.checked);
            });

            div.addEventListener('click', (e) => {
                if (e.target === checkbox || e.target.tagName === 'INPUT') return;
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
        if (!metric) return;
        
        const checkbox = document.getElementById(`metric-${metricId}`);
        if (!checkbox) return;
        
        const toggleDiv = checkbox.parentElement;
        
        // Use passed state if provided, otherwise use checkbox state
        metric.visible = checkedState !== undefined ? checkedState : checkbox.checked;
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
    // EXPORT
    // =============================================================================

    window.PerformanceTrendsChart = {
        loadData,
        switchTimeRange,
        toggleZoom,
        resetZoom,
        toggleMetric,
        selectAll: selectAllMetrics,
        deselectAll: deselectAllMetrics,
        getChart: () => chart,
        getMetrics: () => dynamicMetrics,
        getCurrentData: () => processedData
    };

    // Initialize - Multiple entry points for Mode Analytics reliability
    document.addEventListener('DOMContentLoaded', () => setTimeout(attemptInit, 100));
    setTimeout(attemptInit, 200); // Also try independently of DOM ready
} )();