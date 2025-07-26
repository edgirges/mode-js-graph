// =============================================================================
// Overall Performance Trends (by Month)
// =============================================================================

(function() {
    'use strict';

    // =============================================================================
    // METRIC EXTRACTION
    // =============================================================================

    function getMetricsFromDataset(datasetName, fallbackIndex = null) {
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
        const dateTimePattern = /^(date|day|time|created|updated|timestamp|month)$/i;
        const metrics = columns.filter(col => !dateTimePattern.test(col));
        
        return metrics;
    }

    // =============================================================================
    // CONFIGURATION
    // =============================================================================

    const CONFIG = {
        chartTitle: 'Overall Performance Trends (by Month)',
        datasetName: 'BAR - Overall Performance Trends (by Month)',
        fallbackIndex: 22,
        defaultTimeRange: '90D',
        displayMetrics: ['TotalSpend', 'Visits', 'NewSiteVisitors', 'NewUsersReached'],
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
        const canvas = document.getElementById('overallPerformanceTrendsChart');
        const toggles = document.querySelector('.overall-performance-trends-toggles');

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

    function attemptInit() {
        if (init()) {
            return;
        }
        setTimeout(attemptInit, 500);
    }

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
                console.warn('Overall Performance Trends: No metrics extracted from dataset');
            }
        } catch (error) {
            console.error('Overall Performance Trends: Error loading data:', error);
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
            rawData = targetDataset.content || targetDataset;
        } else {
            console.error('Overall Performance Trends: Dataset not found');
            rawData = [];
        }
    }

    function createDynamicMetrics(availableMetrics) {
        dynamicMetrics = availableMetrics.map(metric => {
            let color, name;
            
            switch(metric) {
                case 'TotalSpend':
                    color = '#10B981'; // Green
                    name = 'Total Spend';
                    break;
                case 'Visits':
                    color = '#3B82F6'; // Blue
                    name = 'Visits';
                    break;
                case 'NewSiteVisitors':
                    color = '#F59E0B'; // Orange/Yellow
                    name = 'New Site Visitors';
                    break;
                case 'NewUsersReached':
                    color = '#06B6D4'; // Light blue/cyan
                    name = 'New Users Reached';
                    break;
                default:
                    color = '#6B7280'; // Gray
                    name = metric.replace(/_/g, ' ');
            }

            return {
                id: metric,
                name: name,
                color: color,
                visible: true,
                yAxisID: 'y',
                order: CONFIG.displayMetrics.indexOf(metric)
            };
        });
    }

    // =============================================================================
    // DATA PROCESSING
    // =============================================================================

    function findMonthColumn() {
        if (!rawData.length) return null;
        
        const columns = Object.keys(rawData[0]);
        return columns.find(col => /month/i.test(col)) || 
               columns.find(col => /date/i.test(col)) || 
               columns[0];
    }

    function processData() {
        if (!rawData || !rawData.length) {
            processedData = { labels: [], datasets: {} };
            return;
        }

        const monthColumn = findMonthColumn();
        if (!monthColumn) {
            console.error('Overall Performance Trends: No month column found');
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
        
        processedData = {
            labels: uniqueMonths,
            datasets: {}
        };

        dynamicMetrics.forEach(metric => {
            processedData.datasets[metric.id] = uniqueMonths.map(month => 
                groupedData[month][metric.id] || 0
            );
        });
    }

    function filterByTimeRange(range) {
        // For monthly data, we can implement basic filtering if needed
        // For now, return all data since it's already aggregated by month
        return processedData;
    }

    // =============================================================================
    // CHART CREATION
    // =============================================================================

    function createChart() {
        const canvas = document.getElementById('overallPerformanceTrendsChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
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
                    zoom: {
                        pan: {
                            enabled: false,
                            mode: 'x'
                        },
                        zoom: {
                            wheel: {
                                enabled: false
                            },
                            pinch: {
                                enabled: false
                            },
                            mode: 'x'
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        },
                        stacked: false // Important: not stacked for grouped bars
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Values'
                        },
                        stacked: false, // Important: not stacked for grouped bars
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    function createDatasets() {
        return dynamicMetrics
            .filter(metric => metric.visible)
            .map(metric => ({
                label: metric.name,
                data: processedData.datasets[metric.id] || [],
                backgroundColor: metric.color,
                borderColor: metric.color,
                borderWidth: 1
            }));
    }

    function updateChart() {
        if (!chart || !processedData.labels) return;

        const filteredData = filterByTimeRange(currentTimeRange);
        const datasets = createDatasets();

        chart.data.labels = filteredData.labels;
        chart.data.datasets = datasets;
        chart.update();
    }

    // =============================================================================
    // UI CONTROLS
    // =============================================================================

    function createMetricToggles() {
        const container = document.querySelector('.overall-performance-trends-toggles');
        if (!container || !dynamicMetrics.length) return;

        container.innerHTML = '';

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
        
        metric.visible = checkedState;
        toggleDiv.classList.toggle('active', metric.visible);
        updateChart();
    }

    function switchTimeRange(range) {
        currentTimeRange = range;
        updateChart();
        
        // Update button states
        document.querySelectorAll('.overall-performance-trends-controls .control-btn')
            .forEach(btn => btn.classList.remove('active'));
        
        event.target.classList.add('active');
    }

    function toggleZoom() {
        isZoomEnabled = !isZoomEnabled;
        chart.options.plugins.zoom.zoom.wheel.enabled = isZoomEnabled;
        chart.options.plugins.zoom.zoom.pinch.enabled = isZoomEnabled;
        chart.options.plugins.zoom.pan.enabled = isZoomEnabled;
        chart.update();
        
        document.querySelectorAll('.overall-performance-trends-controls .control-btn')
            .forEach(btn => btn.classList.remove('active'));
        
        event.target.classList.toggle('active', isZoomEnabled);
    }

    function resetZoom() {
        chart.resetZoom();
        
        document.querySelectorAll('.overall-performance-trends-controls .control-btn')
            .forEach(btn => btn.classList.remove('active'));
    }

    // =============================================================================
    // EXPORT
    // =============================================================================

    window.OverallPerformanceTrendsChart = {
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
})();
