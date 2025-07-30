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
        datasetName: 'Overall Performance Trends (by Month)',
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

    function findDatasetByQueryName(queryName) {
        console.log(`Overall Performance Trends: Searching ALL datasets by queryName (index-independent search)`);
        
        for (let key in datasets) {
            const dataset = datasets[key];
            if (dataset.queryName === queryName) {
                console.log(`Overall Performance Trends: ✓ FOUND "${queryName}" at index ${key} (would work at ANY index)`);
                return dataset;
            }
        }
        
        console.log(`Overall Performance Trends: ✗ No dataset found with queryName: "${queryName}"`);
        return null;
    }

    function loadDatasetContent() {
        let targetDataset = null;

        console.log('Overall Performance Trends: Looking for dataset with queryName:', CONFIG.datasetName);

        // First try to find by queryName (most reliable)
        targetDataset = findDatasetByQueryName(CONFIG.datasetName);
        
        // TEMPORARILY COMMENTED OUT: Fall back to index if queryName search fails
        // if (!targetDataset && datasets[CONFIG.fallbackIndex]) {
        //     console.log('Overall Performance Trends: ✓ Using fallback INDEX:', CONFIG.fallbackIndex);
        //     targetDataset = datasets[CONFIG.fallbackIndex];
        // }

        if (targetDataset) {
            rawData = targetDataset.content || targetDataset;
            console.log('Overall Performance Trends: Data loaded, rows:', rawData.length);
            console.log('Overall Performance Trends: ✓ SUCCESS - Working purely by queryName, no index fallback needed!');
        } else {
            console.error('Overall Performance Trends: Dataset not found - queryName search failed and fallback is disabled');
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

        // Add select/deselect all buttons
        const metricsHeader = document.querySelector('.overall-performance-trends-metrics-title');
        if (metricsHeader && !document.getElementById('overall-performance-trends-select-all-btn')) {
            const selectAllBtn = document.createElement('button');
            selectAllBtn.id = 'overall-performance-trends-select-all-btn';
            selectAllBtn.className = 'select-all-btn';
            selectAllBtn.textContent = 'Select All';
            selectAllBtn.onclick = selectAllMetrics;
            
            const deselectAllBtn = document.createElement('button');
            deselectAllBtn.id = 'overall-performance-trends-deselect-all-btn';
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

    window.OverallPerformanceTrendsChart = {
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
})();
