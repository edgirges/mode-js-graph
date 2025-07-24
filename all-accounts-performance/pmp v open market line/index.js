// =============================================================================
// PMP vs Open Market Line Chart - Simplified
// =============================================================================

(function() {
    'use strict';

    // =============================================================================
    // DIRECT METRIC EXTRACTION FUNCTION (from working area chart)
    // =============================================================================
    function getMetricsFromDataset(datasetName, fallbackIndex = null) {
        if (typeof datasets === 'undefined') {
            console.warn('datasets object not available yet');
            return [];
        }

        // Try to get the dataset
        let targetDataset = null;
        if (datasets[datasetName]) {
            targetDataset = datasets[datasetName];
            console.log(`Found dataset by name: "${datasetName}"`);
        } else if (fallbackIndex !== null && datasets[fallbackIndex]) {
            targetDataset = datasets[fallbackIndex];
            console.log(`Using fallback dataset at index: ${fallbackIndex}`);
        }

        if (!targetDataset) {
            console.error('No dataset found');
            return [];
        }

        // Extract data array
        const dataArray = targetDataset.content || targetDataset;
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            console.error('Dataset has no data');
            return [];
        }

        // Get column names
        const columns = Object.keys(dataArray[0]);
        console.log('Available columns:', columns);

        // Filter out date/time columns to get metrics
        const dateTimePattern = /^(date|day|time|created|updated|timestamp)$/i;
        const metrics = columns.filter(col => !dateTimePattern.test(col));
        
        console.log('Extracted metrics:', metrics);
        return metrics;
    }

    // Configuration
    const CONFIG = {
        chartTitle: 'PMP v Open Market Impressions',
        datasetName: 'PMP vs OpenMarket Imps and Spend (Obj filter does not apply)',
        fallbackIndex: 5,
        defaultTimeRange: '90D',
        // Target metrics we want to display
        displayMetrics: ['imps_banner_open_market', 'imps_banner_pmp', 'imps_open_market', 'imps_pmp', 'imps_total', 'imps_video_open_market', 'imps_video_pmp'],
        colors: [
            '#007bff', '#28a745', '#dc3545', '#ffc107', 
            '#6f42c1', '#fd7e14', '#343a40'
        ]
    };

    // State
    let chart;
    let rawData = [];
    let processedData = {};
    let currentTimeRange = CONFIG.defaultTimeRange;
    let dynamicMetrics = []; // This is what the working area chart uses

    // =============================================================================
    // Initialization
    // =============================================================================

    function init() {
        const canvas = document.getElementById('pmpVOpenMarketLineChart');
        const toggles = document.querySelector('.pmp-v-open-market-line-toggles');
        
        if (!canvas || !toggles || typeof Chart === 'undefined') {
            setTimeout(init, 500);
            return;
        }

        createChart();
        
        if (typeof datasets !== 'undefined') {
            loadData();
        } else {
            pollForData();
        }
    }

    function pollForData() {
        if (typeof datasets !== 'undefined') {
            loadData();
        } else {
            setTimeout(pollForData, 1000);
        }
    }

    // =============================================================================
    // Data Loading & Processing
    // =============================================================================

    function loadData() {
        console.log('=== PMP vs Open Market Line: Loading data from Mode Analytics ===');
        
        try {
            if (typeof datasets !== 'undefined') {
                console.log('Found datasets object');
                console.log('Available datasets:', Object.keys(datasets));
                
                // Get metrics using direct extraction method (from working area chart)
                const extractedMetrics = getMetricsFromDataset(CONFIG.datasetName, CONFIG.fallbackIndex);
                
                if (extractedMetrics.length > 0) {
                    // Filter to only the metrics we want to display
                    const filteredMetrics = CONFIG.displayMetrics.filter(metric => extractedMetrics.includes(metric));
                    
                    // Create dynamic metrics with colors (from working area chart)
                    createDynamicMetrics(filteredMetrics);
                    
                    // Load the actual data
                    loadDatasetContent();
                    
                    // Create metric toggles
                    createMetricToggles();
                    
                    // Process and display the chart
                    processData();
                    updateChart();
                } else {
                    console.warn('No metrics extracted from dataset');
                }
            } else {
                console.warn('datasets object not available yet');
            }
        } catch (error) {
            console.error('Error loading Mode data:', error);
        }
    }

    function loadDatasetContent() {
        const dataset = datasets[CONFIG.datasetName] || datasets[CONFIG.fallbackIndex];
        if (dataset) {
            rawData = dataset.content || dataset || [];
            console.log('Mode data loaded:', rawData.length, 'rows');
            
            if (rawData.length > 0) {
                console.log('Sample data row:', rawData[0]);
            }
        }
    }

    function createDynamicMetrics(filteredMetrics) {
        console.log('=== Creating dynamic metrics from extraction ===');
        console.log('Filtered metrics to display:', filteredMetrics);
        
        dynamicMetrics = filteredMetrics.map((metric, index) => {
            return {
                id: metric,
                name: formatMetricName(metric),
                color: CONFIG.colors[index % CONFIG.colors.length],
                backgroundColor: 'transparent', // Lines don't need background
                visible: true,
                type: 'line',
                yAxisID: 'y',
                order: index + 1,
                dataKey: metric
            };
        });
        
        console.log('Created dynamic metrics:', dynamicMetrics);
    }

    function processData() {
        console.log('=== Processing PMP vs Open Market Line data ===');
        
        if (!rawData || rawData.length === 0) {
            console.warn('No data to process');
            return;
        }
        
        if (dynamicMetrics.length === 0) {
            console.warn('No metrics detected');
            return;
        }

        const dateCol = findDateColumn();
        if (!dateCol) {
            console.error('No date column found in data');
            return;
        }
        
        console.log(`Using date column: ${dateCol}`);

        // Group by day and sum values (from working area chart)
        const dailyData = {};
        
        rawData.forEach((row, index) => {
            const date = row[dateCol];
            if (!date) return;
            
            const dayKey = date.includes && date.includes(' ') ? date.split(' ')[0] : date;
            
            if (!dailyData[dayKey]) {
                dailyData[dayKey] = {};
                dynamicMetrics.forEach(metric => {
                    dailyData[dayKey][metric.id] = 0;
                    dailyData[dayKey][`${metric.id}_count`] = 0;
                });
            }
            
            // Sum up values for each metric
            dynamicMetrics.forEach(metric => {
                const value = parseFloat(row[metric.id] || 0);
                if (!isNaN(value)) {
                    dailyData[dayKey][metric.id] += value;
                    dailyData[dayKey][`${metric.id}_count`] += 1;
                }
            });
        });

        // Convert to arrays sorted by date and calculate averages
        const sortedDays = Object.keys(dailyData).sort();
        const filteredDays = filterByTimeRange(sortedDays);
        
        // Build processed data object
        processedData = {
            labels: filteredDays
        };
        
        // Add each metric's data
        dynamicMetrics.forEach(metric => {
            processedData[metric.id] = filteredDays.map(day => {
                const count = dailyData[day][`${metric.id}_count`];
                return count > 0 ? dailyData[day][metric.id] / count : 0;
            });
        });
        
        console.log('Data processed successfully. Metrics:', Object.keys(processedData).filter(k => k !== 'labels'));
        console.log('Date range:', filteredDays.length, 'days');
    }

    function findDateColumn() {
        const sampleRow = rawData[0];
        const columns = Object.keys(sampleRow);
        
        return columns.find(col => ['day', 'date'].includes(col)) || 
               columns.find(col => /date|day|time/i.test(col));
    }

    function filterByTimeRange(sortedDays) {
        if (currentTimeRange === 'ALL' || !sortedDays.length) return sortedDays;
        
        const daysMap = { '7D': 7, '30D': 30, '90D': 90 };
        const daysToShow = daysMap[currentTimeRange];
        if (!daysToShow) return sortedDays;
        
        const endDate = new Date(sortedDays[sortedDays.length - 1]);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - (daysToShow - 1));
        
        return sortedDays.filter(day => {
            const dayDate = new Date(day);
            return dayDate >= startDate && dayDate <= endDate;
        });
    }

    // =============================================================================
    // Chart Management
    // =============================================================================

    function createChart() {
        const canvas = document.getElementById('pmpVOpenMarketLineChart');
        const ctx = canvas.getContext('2d');
        
        // Register plugins
        if (typeof ChartZoom !== 'undefined') Chart.register(ChartZoom);
        
        chart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [] },
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
                    legend: { display: false },
                    zoom: {
                        zoom: {
                            wheel: { enabled: false },
                            pinch: { enabled: false },
                            mode: 'x',
                        },
                        pan: { enabled: true, mode: 'x' }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'day' },
                        title: { display: true, text: 'Date' }
                    },
                    y: {
                        position: 'left',
                        title: { display: true, text: 'Impressions' },
                        ticks: {
                            callback: value => value.toLocaleString()
                        }
                    }
                }
            }
        });
    }

    function updateChart() {
        if (!chart || !processedData.labels) return;

        const datasets = createDatasets();
        updateYAxisRange(datasets);
        
        chart.data.labels = processedData.labels;
        chart.data.datasets = datasets;
        chart.update('active');
    }

    function createDatasets() {
        const datasets = [];
        
        dynamicMetrics.forEach(metric => {
            if (!metric.visible) return;
            
            const metricData = processedData[metric.id] || [];
            
            const dataset = {
                label: metric.name,
                data: metricData,
                borderColor: metric.color,
                backgroundColor: metric.backgroundColor,
                borderWidth: 2,
                fill: false, // Line chart - no fill
                tension: 0.1,
                yAxisID: metric.yAxisID,
                order: metric.order || 0
            };
            
            datasets.push(dataset);
        });
        
        return datasets.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    function updateYAxisRange(datasets) {
        if (!datasets.length) return;

        // Calculate range from visible data
        const allValues = datasets.flatMap(d => d.data).filter(v => v != null);
        if (!allValues.length) return;

        const maxValue = Math.max(...allValues);
        const minValue = Math.min(...allValues);
        
        // Set reasonable range with padding
        const padding = (maxValue - minValue) * 0.1;
        const yMin = Math.max(0, minValue - padding);
        const yMax = maxValue + padding;
        
        chart.options.scales.y.min = yMin;
        chart.options.scales.y.max = yMax;
    }

    function formatMetricName(columnName) {
        // Convert column names to readable format
        return columnName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    // =============================================================================
    // UI Controls
    // =============================================================================

    function createMetricToggles() {
        const togglesContainer = document.querySelector('.pmp-v-open-market-line-toggles');
        if (!togglesContainer) {
            console.error('Toggles container not found! Looking for: .pmp-v-open-market-line-toggles');
            return;
        }
        
        togglesContainer.innerHTML = '';
        
        if (dynamicMetrics.length === 0) {
            togglesContainer.innerHTML = '<p>No metrics detected. Check data loading.</p>';
            return;
        }
        
        console.log('Creating metric toggles for', dynamicMetrics.length, 'metrics');
        
        dynamicMetrics.forEach(metric => {
            const toggleDiv = document.createElement('div');
            toggleDiv.className = `metric-toggle ${metric.visible ? 'active' : ''}`;
            toggleDiv.innerHTML = `
                <input type="checkbox" class="metric-checkbox" id="metric-${metric.id}" ${metric.visible ? 'checked' : ''}>
                <label for="metric-${metric.id}" class="metric-label">
                    <span class="metric-color" style="background-color: ${metric.color}"></span>
                    ${metric.name}
                </label>
            `;
            
            toggleDiv.addEventListener('click', function(e) {
                const checkbox = toggleDiv.querySelector('.metric-checkbox');
                if (e.target === checkbox) return;
                e.preventDefault();
                e.stopPropagation();
                checkbox.click();
            });
            
            const checkbox = toggleDiv.querySelector('.metric-checkbox');
            checkbox.addEventListener('change', function() {
                toggleMetric(metric.id);
            });
            
            togglesContainer.appendChild(toggleDiv);
        });
    }

    function toggleMetric(metricId) {
        const metric = dynamicMetrics.find(m => m.id === metricId);
        const toggleDiv = document.getElementById(`metric-${metricId}`).parentElement;
        const checkbox = document.getElementById(`metric-${metricId}`);
        
        metric.visible = checkbox.checked;
        
        if (metric.visible) {
            toggleDiv.classList.add('active');
        } else {
            toggleDiv.classList.remove('active');
        }
        
        updateChart();
        console.log(`Metric ${metricId} toggled:`, metric.visible);
    }

    function switchTimeRange(timeRange) {
        currentTimeRange = timeRange;
        
        // Update active button
        document.querySelectorAll('.pmp-v-open-market-line-controls .control-btn')
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
        const btn = event.target;
        const isEnabled = btn.classList.contains('active');
        
        btn.classList.toggle('active');
        btn.textContent = isEnabled ? 'Zoom' : 'Zoom ON';
        
        if (chart.options.plugins.zoom) {
            chart.options.plugins.zoom.zoom.wheel.enabled = !isEnabled;
            chart.options.plugins.zoom.zoom.pinch.enabled = !isEnabled;
        }
        
        chart.update('none');
    }

    function resetZoom() {
        if (chart && chart.resetZoom) {
            chart.resetZoom();
        }
        
        // Reset zoom button
        document.querySelectorAll('.pmp-v-open-market-line-controls .control-btn')
            .forEach(btn => {
                if (btn.textContent.includes('Zoom')) {
                    btn.classList.remove('active');
                    btn.textContent = 'Zoom';
                }
            });
        
        if (chart && chart.options.plugins.zoom) {
            chart.options.plugins.zoom.zoom.wheel.enabled = false;
            chart.options.plugins.zoom.zoom.pinch.enabled = false;
        }
        
        chart.update('none');
    }

    // =============================================================================
    // Export & Initialize
    // =============================================================================

    window.PmpVOpenMarketLineChart = {
        loadData: loadData,
        switchTimeRange,
        toggleZoom,
        resetZoom,
        toggleMetric,
        getChart: () => chart,
        getMetrics: () => dynamicMetrics,
        getCurrentData: () => processedData
    };

    // Start initialization
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));

    console.log('=== PMP vs Open Market Line Chart initialized successfully! ===');
    console.log('Available functions:', Object.keys(window.PmpVOpenMarketLineChart || {}));

})();