// Custom JavaScript for Mode Analytics Interactive Chart with Multiple Metrics
// Supports 10 different metrics with toggleable visibility

// Global variables
let chart;
let chartData = {};
let currentTimeRange = '1D';
let isZoomEnabled = false;

// Define 10 different metrics with colors and characteristics
const METRICS = [
    {
        id: 'cpu_usage',
        name: 'CPU Usage (%)',
        color: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        baseValue: 45,
        variance: 20,
        visible: true
    },
    {
        id: 'memory_usage',
        name: 'Memory Usage (%)',
        color: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        baseValue: 65,
        variance: 15,
        visible: true
    },
    {
        id: 'disk_io',
        name: 'Disk I/O (MB/s)',
        color: '#ffc107',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        baseValue: 120,
        variance: 40,
        visible: true
    },
    {
        id: 'network_in',
        name: 'Network In (Mbps)',
        color: '#17a2b8',
        backgroundColor: 'rgba(23, 162, 184, 0.1)',
        baseValue: 85,
        variance: 25,
        visible: true
    },
    {
        id: 'network_out',
        name: 'Network Out (Mbps)',
        color: '#6f42c1',
        backgroundColor: 'rgba(111, 66, 193, 0.1)',
        baseValue: 55,
        variance: 20,
        visible: true
    },
    {
        id: 'response_time',
        name: 'Response Time (ms)',
        color: '#e83e8c',
        backgroundColor: 'rgba(232, 62, 140, 0.1)',
        baseValue: 250,
        variance: 100,
        visible: false
    },
    {
        id: 'error_rate',
        name: 'Error Rate (%)',
        color: '#dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        baseValue: 2.5,
        variance: 2,
        visible: false
    },
    {
        id: 'throughput',
        name: 'Throughput (req/s)',
        color: '#fd7e14',
        backgroundColor: 'rgba(253, 126, 20, 0.1)',
        baseValue: 1500,
        variance: 500,
        visible: false
    },
    {
        id: 'database_connections',
        name: 'DB Connections',
        color: '#20c997',
        backgroundColor: 'rgba(32, 201, 151, 0.1)',
        baseValue: 35,
        variance: 15,
        visible: false
    },
    {
        id: 'cache_hit_rate',
        name: 'Cache Hit Rate (%)',
        color: '#6c757d',
        backgroundColor: 'rgba(108, 117, 125, 0.1)',
        baseValue: 85,
        variance: 10,
        visible: false
    }
];

// Initialize the chart when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    createMetricToggles();
});

// Generate sample time series data for a specific metric
function generateTimeSeriesData(timeRange, metric) {
    const now = new Date();
    const dataPoints = [];
    let interval, count;
    
    switch(timeRange) {
        case '1D':
            interval = 5 * 60 * 1000; // 5 minutes
            count = 288; // 24 hours
            break;
        case '7D':
            interval = 30 * 60 * 1000; // 30 minutes
            count = 336; // 7 days
            break;
        case '30D':
            interval = 2 * 60 * 60 * 1000; // 2 hours
            count = 360; // 30 days
            break;
        case '90D':
            interval = 6 * 60 * 60 * 1000; // 6 hours
            count = 360; // 90 days
            break;
        default:
            interval = 5 * 60 * 1000;
            count = 288;
    }
    
    for (let i = count - 1; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - (i * interval));
        
        // Create different patterns for different metrics
        let baseValue = metric.baseValue;
        let seasonalPattern = 0;
        let trend = 0;
        
        // Add seasonal patterns (daily/weekly cycles)
        if (timeRange === '1D' || timeRange === '7D') {
            const hourOfDay = timestamp.getHours();
            seasonalPattern = Math.sin((hourOfDay - 6) * Math.PI / 12) * (metric.variance * 0.3);
        }
        
        // Add weekly pattern for longer time ranges
        if (timeRange === '30D' || timeRange === '90D') {
            const dayOfWeek = timestamp.getDay();
            seasonalPattern = Math.sin((dayOfWeek - 1) * Math.PI / 3) * (metric.variance * 0.2);
        }
        
        // Add slight trend
        trend = (count - i) * 0.001 * metric.variance;
        
        // Add random noise
        const noise = (Math.random() - 0.5) * metric.variance * 0.5;
        
        const value = Math.max(0, baseValue + seasonalPattern + trend + noise);
        
        dataPoints.push({
            x: timestamp,
            y: parseFloat(value.toFixed(2))
        });
    }
    
    return dataPoints;
}

// Generate data for all metrics and time ranges
function generateAllMetricsData() {
    const timeRanges = ['1D', '7D', '30D', '90D'];
    const data = {};
    
    timeRanges.forEach(timeRange => {
        data[timeRange] = {};
        METRICS.forEach(metric => {
            data[timeRange][metric.id] = generateTimeSeriesData(timeRange, metric);
        });
    });
    
    return data;
}

// Create datasets for Chart.js
function createChartDatasets() {
    return METRICS.map(metric => ({
        label: metric.name,
        data: chartData[currentTimeRange][metric.id],
        borderColor: metric.color,
        backgroundColor: metric.backgroundColor,
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: metric.color,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
        hidden: !metric.visible
    }));
}

// Initialize the chart
function initializeChart() {
    const ctx = document.getElementById('customChart').getContext('2d');
    
    // Register Chart.js plugins
    Chart.register(ChartZoom);
    Chart.register(ChartAnnotation);
    
    // Generate initial data
    chartData = generateAllMetricsData();
    
    // Chart configuration
    const config = {
        type: 'line',
        data: {
            datasets: createChartDatasets()
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false // We'll use custom toggles instead
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#007bff',
                    borderWidth: 1,
                    cornerRadius: 6,
                    displayColors: true,
                    callbacks: {
                        title: function(tooltipItems) {
                            return new Date(tooltipItems[0].parsed.x).toLocaleString();
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: 'ctrl'
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
                    type: 'time',
                    time: {
                        tooltipFormat: 'MMM DD, YYYY HH:mm',
                        displayFormats: {
                            minute: 'HH:mm',
                            hour: 'MMM DD HH:mm',
                            day: 'MMM DD',
                            month: 'MMM YYYY'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Time'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Value'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    };
    
    // Create the chart
    chart = new Chart(ctx, config);
    
    // Add resize listener for responsiveness
    window.addEventListener('resize', function() {
        chart.resize();
    });
}

// Create metric toggle controls
function createMetricToggles() {
    const togglesContainer = document.querySelector('.metric-toggles');
    
    METRICS.forEach(metric => {
        const toggleDiv = document.createElement('div');
        toggleDiv.className = `metric-toggle ${metric.visible ? 'active' : ''}`;
        toggleDiv.innerHTML = `
            <input type="checkbox" class="metric-checkbox" id="metric-${metric.id}" ${metric.visible ? 'checked' : ''}>
            <label for="metric-${metric.id}" class="metric-label">
                <span class="metric-color" style="background-color: ${metric.color}"></span>
                ${metric.name}
            </label>
        `;
        
        // Add click event listener
        toggleDiv.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                const checkbox = toggleDiv.querySelector('.metric-checkbox');
                checkbox.checked = !checkbox.checked;
            }
            toggleMetric(metric.id);
        });
        
        togglesContainer.appendChild(toggleDiv);
    });
}

// Toggle metric visibility
function toggleMetric(metricId) {
    const metric = METRICS.find(m => m.id === metricId);
    const toggleDiv = document.getElementById(`metric-${metricId}`).parentElement.parentElement;
    const checkbox = document.getElementById(`metric-${metricId}`);
    
    metric.visible = checkbox.checked;
    
    // Update visual state
    if (metric.visible) {
        toggleDiv.classList.add('active');
    } else {
        toggleDiv.classList.remove('active');
    }
    
    // Update chart
    const datasetIndex = METRICS.findIndex(m => m.id === metricId);
    if (datasetIndex !== -1) {
        chart.data.datasets[datasetIndex].hidden = !metric.visible;
        chart.update('none');
    }
}

// Switch time range
function switchTimeRange(timeRange) {
    currentTimeRange = timeRange;
    
    // Update active button
    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update chart data for all metrics
    METRICS.forEach((metric, index) => {
        chart.data.datasets[index].data = chartData[timeRange][metric.id];
    });
    
    chart.update('active');
    
    // Reset zoom when switching time ranges
    chart.resetZoom();
}

// Toggle zoom functionality
function toggleZoom() {
    isZoomEnabled = !isZoomEnabled;
    
    // Update button appearance
    const zoomBtn = event.target;
    if (isZoomEnabled) {
        zoomBtn.classList.add('active');
        zoomBtn.textContent = 'Zoom ON';
        
        // Enable zoom with mouse wheel
        chart.options.plugins.zoom.zoom.wheel.enabled = true;
        chart.options.plugins.zoom.zoom.pinch.enabled = true;
    } else {
        zoomBtn.classList.remove('active');
        zoomBtn.textContent = 'Zoom';
        
        // Disable zoom
        chart.options.plugins.zoom.zoom.wheel.enabled = false;
        chart.options.plugins.zoom.zoom.pinch.enabled = false;
    }
    
    chart.update('none');
}

// Reset zoom
function resetZoom() {
    chart.resetZoom();
    
    // Reset zoom button state
    const zoomBtn = document.querySelector('.control-btn:nth-child(5)');
    if (zoomBtn) {
        zoomBtn.classList.remove('active');
        zoomBtn.textContent = 'Zoom';
        isZoomEnabled = false;
        chart.options.plugins.zoom.zoom.wheel.enabled = false;
        chart.options.plugins.zoom.zoom.pinch.enabled = false;
        chart.update('none');
    }
}

// Utility function to update chart with new data (for Mode Analytics integration)
function updateChartData(newData, metricId) {
    if (chart && newData && metricId) {
        const metricIndex = METRICS.findIndex(m => m.id === metricId);
        if (metricIndex !== -1) {
            // Ensure data is in the correct format
            const formattedData = newData.map(point => ({
                x: new Date(point.x || point.timestamp || point.time),
                y: parseFloat(point.y || point.value)
            }));
            
            chart.data.datasets[metricIndex].data = formattedData;
            chart.update('active');
        }
    }
}

// Function to customize chart appearance (for Mode Analytics integration)
function customizeChart(options = {}) {
    if (!chart) return;
    
    const {
        title = 'Custom Interactive Chart',
        yAxisLabel = 'Value',
        xAxisLabel = 'Time'
    } = options;
    
    // Update chart title
    document.querySelector('.chart-title').textContent = title;
    
    // Update axis labels
    chart.options.scales.x.title.text = xAxisLabel;
    chart.options.scales.y.title.text = yAxisLabel;
    
    chart.update('none');
}

// Function to show/hide specific metrics programmatically
function showMetrics(metricIds) {
    METRICS.forEach(metric => {
        const shouldShow = metricIds.includes(metric.id);
        const checkbox = document.getElementById(`metric-${metric.id}`);
        const toggleDiv = checkbox.parentElement.parentElement;
        
        metric.visible = shouldShow;
        checkbox.checked = shouldShow;
        
        if (shouldShow) {
            toggleDiv.classList.add('active');
        } else {
            toggleDiv.classList.remove('active');
        }
        
        const datasetIndex = METRICS.findIndex(m => m.id === metric.id);
        if (datasetIndex !== -1) {
            chart.data.datasets[datasetIndex].hidden = !shouldShow;
        }
    });
    
    chart.update('none');
}

// Export functions for Mode Analytics usage
window.ModeChart = {
    updateData: updateChartData,
    customize: customizeChart,
    switchTimeRange: switchTimeRange,
    toggleZoom: toggleZoom,
    resetZoom: resetZoom,
    showMetrics: showMetrics,
    toggleMetric: toggleMetric,
    getChart: () => chart,
    getMetrics: () => METRICS
};

// Add some advanced interactions for Grafana-like experience
document.addEventListener('keydown', function(e) {
    if (!chart) return;
    
    // Ctrl+Z to reset zoom
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        resetZoom();
    }
    
    // Escape to reset zoom
    if (e.key === 'Escape') {
        resetZoom();
    }
});

// Add double-click to reset zoom
document.getElementById('customChart').addEventListener('dblclick', function() {
    resetZoom();
});

console.log('Custom Mode Analytics Chart with Multiple Metrics initialized successfully!');
console.log('Available functions:', Object.keys(window.ModeChart));
console.log('Available metrics:', METRICS.map(m => m.name)); 