// =============================================================================
// PMP vs Open Market Line Chart - Simplified
// =============================================================================

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        chartTitle: 'PMP v Open Market Impressions',
        datasetName: 'PMP vs OpenMarket Imps and Spend (Obj filter does not apply)',
        fallbackIndex: 5,
        defaultTimeRange: '90D',
        metrics: ['imps_banner_open_market', 'imps_banner_pmp', 'imps_open_market', 'imps_pmp', 'imps_total', 'imps_video_open_market', 'imps_video_pmp'],
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
    let availableMetrics = [];

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
        // Get dataset
        const dataset = datasets[CONFIG.datasetName] || datasets[CONFIG.fallbackIndex];
        if (!dataset) {
            console.error('Dataset not found');
            return;
        }

        rawData = dataset.content || dataset;
        if (!rawData.length) return;

        // Extract available metrics
        const columns = Object.keys(rawData[0]);
        availableMetrics = CONFIG.metrics.filter(metric => columns.includes(metric));
        
        createMetricToggles();
        processData();
        updateChart();
    }

    function processData() {
        if (!rawData.length) return;

        const dateCol = findDateColumn();
        if (!dateCol) return;

        // Group by day and sum values
        const dailyData = {};
        
        rawData.forEach(row => {
            const date = row[dateCol];
            if (!date) return;
            
            const day = date.includes(' ') ? date.split(' ')[0] : date;
            
            if (!dailyData[day]) {
                dailyData[day] = {};
                availableMetrics.forEach(metric => {
                    dailyData[day][metric] = 0;
                    dailyData[day][`${metric}_count`] = 0;
                });
            }
            
            availableMetrics.forEach(metric => {
                const value = parseFloat(row[metric] || 0);
                if (!isNaN(value)) {
                    dailyData[day][metric] += value;
                    dailyData[day][`${metric}_count`] += 1;
                }
            });
        });

        // Convert to time series
        const sortedDays = Object.keys(dailyData).sort();
        const filteredDays = filterByTimeRange(sortedDays);
        
        processedData = { labels: filteredDays };
        
        availableMetrics.forEach(metric => {
            processedData[metric] = filteredDays.map(day => {
                const count = dailyData[day][`${metric}_count`];
                return count > 0 ? dailyData[day][metric] / count : 0;
            });
        });
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
        return availableMetrics
            .map((metric, index) => {
                const toggle = document.getElementById(`metric-${metric}`);
                if (!toggle || !toggle.checked) return null;
                
                return {
                    label: formatMetricName(metric),
                    data: processedData[metric] || [],
                    borderColor: CONFIG.colors[index % CONFIG.colors.length],
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                };
            })
            .filter(Boolean);
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

    function formatMetricName(metric) {
        return metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // =============================================================================
    // UI Controls
    // =============================================================================

    function createMetricToggles() {
        const container = document.querySelector('.pmp-v-open-market-line-toggles');
        if (!container) return;
        
        container.innerHTML = '';
        
        availableMetrics.forEach((metric, index) => {
            const div = document.createElement('div');
            div.className = 'metric-toggle active';
            div.innerHTML = `
                <input type="checkbox" id="metric-${metric}" checked>
                <label for="metric-${metric}" class="metric-label">
                    <span class="metric-color" style="background-color: ${CONFIG.colors[index % CONFIG.colors.length]}"></span>
                    ${formatMetricName(metric)}
                </label>
            `;
            
            const checkbox = div.querySelector('input');
            checkbox.addEventListener('change', () => {
                div.classList.toggle('active', checkbox.checked);
                updateChart();
            });
            
            div.addEventListener('click', (e) => {
                if (e.target !== checkbox) {
                    e.preventDefault();
                    checkbox.click();
                }
            });
            
            container.appendChild(div);
        });
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
        switchTimeRange,
        toggleZoom,
        resetZoom,
        getChart: () => chart,
        getCurrentData: () => processedData
    };

    // Start initialization
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));

})();