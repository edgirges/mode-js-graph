// Custom JavaScript for Mode Analytics Interactive Chart
// Mimics Grafana-style interactivity and responsiveness

// Global variables
let chart;
let chartData = {};
let currentTimeRange = '1D';
let isZoomEnabled = false;

// Initialize the chart when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
});

// Generate sample time series data
function generateTimeSeriesData(timeRange) {
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
        const baseValue = 100 + Math.sin(i * 0.1) * 20;
        const noise = (Math.random() - 0.5) * 10;
        const value = Math.max(0, baseValue + noise);
        
        dataPoints.push({
            x: timestamp,
            y: parseFloat(value.toFixed(2))
        });
    }
    
    return dataPoints;
}

// Initialize the chart
function initializeChart() {
    const ctx = document.getElementById('customChart').getContext('2d');
    
    // Register Chart.js plugins
    Chart.register(ChartZoom);
    Chart.register(ChartAnnotation);
    
    // Generate initial data
    chartData = {
        '1D': generateTimeSeriesData('1D'),
        '7D': generateTimeSeriesData('7D'),
        '30D': generateTimeSeriesData('30D'),
        '90D': generateTimeSeriesData('90D')
    };
    
    // Chart configuration
    const config = {
        type: 'line',
        data: {
            datasets: [{
                label: 'Metric Value',
                data: chartData[currentTimeRange],
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#007bff',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2
            }]
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
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#007bff',
                    borderWidth: 1,
                    cornerRadius: 6,
                    displayColors: false,
                    callbacks: {
                        title: function(tooltipItems) {
                            return new Date(tooltipItems[0].parsed.x).toLocaleString();
                        },
                        label: function(context) {
                            return `Value: ${context.parsed.y.toFixed(2)}`;
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

// Switch time range
function switchTimeRange(timeRange) {
    currentTimeRange = timeRange;
    
    // Update active button
    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update chart data
    chart.data.datasets[0].data = chartData[timeRange];
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
function updateChartData(newData) {
    if (chart && newData) {
        // Ensure data is in the correct format
        const formattedData = newData.map(point => ({
            x: new Date(point.x || point.timestamp || point.time),
            y: parseFloat(point.y || point.value)
        }));
        
        chart.data.datasets[0].data = formattedData;
        chart.update('active');
    }
}

// Function to customize chart appearance (for Mode Analytics integration)
function customizeChart(options = {}) {
    if (!chart) return;
    
    const {
        title = 'Custom Interactive Chart',
        color = '#007bff',
        backgroundColor = 'rgba(0, 123, 255, 0.1)',
        yAxisLabel = 'Value',
        xAxisLabel = 'Time'
    } = options;
    
    // Update chart title
    document.querySelector('.chart-title').textContent = title;
    
    // Update chart colors
    chart.data.datasets[0].borderColor = color;
    chart.data.datasets[0].backgroundColor = backgroundColor;
    chart.data.datasets[0].pointHoverBackgroundColor = color;
    
    // Update axis labels
    chart.options.scales.x.title.text = xAxisLabel;
    chart.options.scales.y.title.text = yAxisLabel;
    
    chart.update('none');
}

// Export functions for Mode Analytics usage
window.ModeChart = {
    updateData: updateChartData,
    customize: customizeChart,
    switchTimeRange: switchTimeRange,
    toggleZoom: toggleZoom,
    resetZoom: resetZoom,
    getChart: () => chart
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

console.log('Custom Mode Analytics Chart initialized successfully!');
console.log('Available functions:', Object.keys(window.ModeChart)); 