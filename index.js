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
    console.log('DOM Content Loaded');
    
    // Small delay to ensure DOM is fully rendered
    setTimeout(() => {
        console.log('Starting initialization...');
        initializeChart();
        createMetricToggles();
    }, 100);
});

// For Mode Analytics - polling mechanism to ensure initialization
let initAttempts = 0;
const maxAttempts = 10;

function attemptInitialization() {
    initAttempts++;
    console.log(`Initialization attempt ${initAttempts}/${maxAttempts}`);
    
    const canvas = document.getElementById('customChart');
    const togglesContainer = document.querySelector('.metric-toggles');
    
    if (canvas && togglesContainer && typeof Chart !== 'undefined') {
        console.log('All elements found, initializing...');
        if (!chart) {
            initializeChart();
        }
        
        // Debug metric toggles specifically
        console.log('Checking metric toggles...');
        console.log('togglesContainer.hasChildNodes():', togglesContainer.hasChildNodes());
        console.log('togglesContainer.children.length:', togglesContainer.children.length);
        
        if (!togglesContainer.hasChildNodes()) {
            console.log('Creating metric toggles...');
            createMetricToggles();
        } else {
            console.log('Metric toggles already exist, skipping creation');
        }
        return; // Success, stop polling
    }
    
    console.log('Missing elements:', {
        canvas: !!canvas,
        togglesContainer: !!togglesContainer,
        Chart: typeof Chart !== 'undefined'
    });
    
    if (initAttempts < maxAttempts) {
        setTimeout(attemptInitialization, 500);
    } else {
        console.error('Max initialization attempts reached');
    }
}

// Start polling after a short delay
setTimeout(attemptInitialization, 200);

// Separate polling mechanism specifically for metric toggles
let toggleAttempts = 0;
const maxToggleAttempts = 15;

function ensureMetricToggles() {
    toggleAttempts++;
    console.log(`Metric toggles attempt ${toggleAttempts}/${maxToggleAttempts}`);
    
    const togglesContainer = document.querySelector('.metric-toggles');
    
    if (togglesContainer) {
        console.log('Found toggles container, checking content...');
        if (togglesContainer.children.length === 0) {
            console.log('Toggles container is empty, creating toggles...');
            const success = createMetricToggles();
            
            if (success && togglesContainer.children.length > 0) {
                console.log('Metric toggles created successfully!');
                return; // Success
            } else {
                console.log('Failed to create metric toggles, will retry...');
            }
        } else {
            console.log('Toggles already exist:', togglesContainer.children.length, 'children');
            return; // Success
        }
    } else {
        console.log('Toggles container not found yet');
    }
    
    if (toggleAttempts < maxToggleAttempts) {
        setTimeout(ensureMetricToggles, 300);
    } else {
        console.error('Max toggle attempts reached - metric toggles failed to initialize');
        console.log('Final state: container exists:', !!togglesContainer, 'children:', togglesContainer ? togglesContainer.children.length : 'N/A');
    }
}

// Start metric toggles polling after chart initialization
setTimeout(ensureMetricToggles, 1000);

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
    return METRICS.map(metric => {
        const data = chartData[currentTimeRange][metric.id];
        
        return {
            label: metric.name,
            data: data || [],
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
        };
    });
}

// Initialize the chart
function initializeChart() {
    console.log('Starting chart initialization...');
    
    // Add loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'chart-loading';
    loadingDiv.innerHTML = 'Loading chart...';
    loadingDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; background: rgba(255,255,255,0.8); padding: 10px; border-radius: 4px;';
    
    const chartCanvas = document.querySelector('.chart-canvas');
    if (chartCanvas) {
        chartCanvas.style.position = 'relative';
        chartCanvas.appendChild(loadingDiv);
    }
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not available!');
        if (loadingDiv) loadingDiv.innerHTML = 'Error: Chart.js not available';
        return;
    }
    
    // Check if canvas element exists
    const canvas = document.getElementById('customChart');
    if (!canvas) {
        console.error('Canvas element not found!');
        if (loadingDiv) loadingDiv.innerHTML = 'Error: Canvas element not found';
        return;
    }
    
    // Destroy existing chart if it exists
    if (chart) {
        chart.destroy();
        chart = null;
    }
    
    const ctx = canvas.getContext('2d');
    console.log('Canvas context created:', ctx);
    
    // Register Chart.js plugins
    if (typeof ChartZoom !== 'undefined') {
        Chart.register(ChartZoom);
        console.log('ChartZoom registered');
    }
    if (typeof ChartAnnotation !== 'undefined') {
        Chart.register(ChartAnnotation);
        console.log('ChartAnnotation registered');
    }
    
    // Generate initial data
    console.log('Generating data...');
    chartData = generateAllMetricsData();
    console.log('Chart data generated, keys:', Object.keys(chartData));
    
    const datasets = createChartDatasets();
    console.log('Datasets created:', datasets.length, 'datasets');
    console.log('First dataset sample:', datasets[0]);
    
    // Chart configuration
    const config = {
        type: 'line',
        data: {
            datasets: datasets
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
                ...(typeof ChartZoom !== 'undefined' ? {
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
                } : {})
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        tooltipFormat: 'MMM dd, yyyy HH:mm',
                        displayFormats: {
                            minute: 'HH:mm',
                            hour: 'MMM dd HH:mm',
                            day: 'MMM dd',
                            month: 'MMM yyyy'
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
    console.log('Creating chart with config...');
    try {
        chart = new Chart(ctx, config);
        console.log('Chart created successfully:', chart);
        console.log('Chart datasets:', chart.data.datasets.length);
        
        // Force initial render
        chart.update('none');
        console.log('Chart updated/rendered');
        
        // Remove loading indicator
        const loadingDiv = document.getElementById('chart-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
        
    } catch (error) {
        console.error('Error creating chart:', error);
        const loadingDiv = document.getElementById('chart-loading');
        if (loadingDiv) {
            loadingDiv.innerHTML = 'Error creating chart: ' + error.message;
        }
        return;
    }
    
    // Add resize listener for responsiveness
    window.addEventListener('resize', function() {
        if (chart) {
            chart.resize();
        }
    });
}

// Create metric toggle controls
function createMetricToggles() {
    console.log('Creating metric toggles...');
    
    const togglesContainer = document.querySelector('.metric-toggles');
    if (!togglesContainer) {
        console.error('Metric toggles container not found!');
        return false;
    }
    
    console.log('Found toggles container:', togglesContainer);
    console.log('Container innerHTML before:', togglesContainer.innerHTML);
    console.log('Creating toggles for', METRICS.length, 'metrics');
    
    try {
        // Clear existing content
        togglesContainer.innerHTML = '';
        
        // Add select/deselect all buttons to the metrics header
        const metricsHeader = document.querySelector('.metric-controls-title');
        if (metricsHeader && !document.getElementById('deselect-all-btn')) {
            const selectAllBtn = document.createElement('button');
            selectAllBtn.id = 'select-all-btn';
            selectAllBtn.className = 'select-all-btn';
            selectAllBtn.textContent = 'Select All';
            selectAllBtn.onclick = selectAllMetrics;
            
            const deselectAllBtn = document.createElement('button');
            deselectAllBtn.id = 'deselect-all-btn';
            deselectAllBtn.className = 'deselect-all-btn';
            deselectAllBtn.textContent = 'Deselect All';
            deselectAllBtn.onclick = deselectAllMetrics;
            
            // Create a header container if it doesn't exist
            const headerContainer = document.createElement('div');
            headerContainer.className = 'metrics-header-container';
            
            // Create a buttons container
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'metrics-buttons-container';
            buttonsContainer.appendChild(selectAllBtn);
            buttonsContainer.appendChild(deselectAllBtn);
            
            // Move the title into the container
            const titleClone = metricsHeader.cloneNode(true);
            metricsHeader.parentNode.insertBefore(headerContainer, metricsHeader);
            headerContainer.appendChild(titleClone);
            headerContainer.appendChild(buttonsContainer);
            metricsHeader.remove();
        }
        
        METRICS.forEach((metric, index) => {
            console.log(`Creating toggle ${index + 1}/${METRICS.length} for: ${metric.name}`);
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
            console.log(`Toggle appended for ${metric.name}`);
        });
        
        console.log('Final togglesContainer children count:', togglesContainer.children.length);
        console.log('Container innerHTML after:', togglesContainer.innerHTML.substring(0, 200) + '...');
        console.log('Metric toggles created successfully');
        return true;
        
    } catch (error) {
        console.error('Error creating metric toggles:', error);
        return false;
    }
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

// Deselect all metrics
function deselectAllMetrics() {
    console.log('Deselecting all metrics...');
    
    // Update all metrics to not visible
    METRICS.forEach(metric => {
        metric.visible = false;
        
        // Update checkbox state
        const checkbox = document.getElementById(`metric-${metric.id}`);
        if (checkbox) {
            checkbox.checked = false;
        }
        
        // Update visual state
        const toggleDiv = checkbox ? checkbox.parentElement.parentElement : null;
        if (toggleDiv) {
            toggleDiv.classList.remove('active');
        }
        
        // Update chart dataset
        const datasetIndex = METRICS.findIndex(m => m.id === metric.id);
        if (datasetIndex !== -1 && chart) {
            chart.data.datasets[datasetIndex].hidden = true;
        }
    });
    
    // Update the chart display
    if (chart) {
        chart.update('none');
    }
    
    console.log('All metrics deselected');
}

// Select all metrics
function selectAllMetrics() {
    console.log('Selecting all metrics...');
    
    // Update all metrics to visible
    METRICS.forEach(metric => {
        metric.visible = true;
        
        // Update checkbox state
        const checkbox = document.getElementById(`metric-${metric.id}`);
        if (checkbox) {
            checkbox.checked = true;
        }
        
        // Update visual state
        const toggleDiv = checkbox ? checkbox.parentElement.parentElement : null;
        if (toggleDiv) {
            toggleDiv.classList.add('active');
        }
        
        // Update chart dataset
        const datasetIndex = METRICS.findIndex(m => m.id === metric.id);
        if (datasetIndex !== -1 && chart) {
            chart.data.datasets[datasetIndex].hidden = false;
        }
    });
    
    // Update the chart display
    if (chart) {
        chart.update('none');
    }
    
    console.log('All metrics selected');
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
    selectAll: selectAllMetrics,
    deselectAll: deselectAllMetrics,
    getChart: () => chart,
    getMetrics: () => METRICS,
    init: () => {
        console.log('Manual initialization called');
        initializeChart();
        createMetricToggles();
    },
    createToggles: () => {
        console.log('Manual toggle creation called');
        return createMetricToggles();
    },
    debug: () => {
        console.log('Debug info:');
        console.log('Chart exists:', !!chart);
        console.log('Canvas exists:', !!document.getElementById('customChart'));
        console.log('Toggles container exists:', !!document.querySelector('.metric-toggles'));
        console.log('Chart.js available:', typeof Chart !== 'undefined');
        console.log('METRICS length:', METRICS.length);
        if (chart) {
            console.log('Chart datasets:', chart.data.datasets.length);
        }
        const togglesContainer = document.querySelector('.metric-toggles');
        if (togglesContainer) {
            console.log('Toggles container children:', togglesContainer.children.length);
        }
    }
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