// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    // Access Mode dataset
    const data = datasets["name-of-query"]; // Replace with your actual query name if needed
  
    // Parse and transform data
    const parsed = data.map(row => ({
      date: new Date(row.day),
      no_budget: Number(row.no_budget),
      overspend: Number(row.overspend),
      spend_90_pct: Number(row.spend_90_pct),
      spend_90_pct_less: Number(row.spend_90_pct_less),
      total: Number(row.total),
    }));
  
    const labels = parsed.map(d => d.date);
  
    // Chart.js datasets
    const chartDatasets = [
      {
        label: 'no_budget',
        data: parsed.map(d => d.no_budget),
        borderColor: '#43aa8b',
        backgroundColor: '#43aa8b',
        tension: 0.3
      },
      {
        label: 'overspend',
        data: parsed.map(d => d.overspend),
        borderColor: '#577590',
        backgroundColor: '#577590',
        tension: 0.3
      },
      {
        label: 'spend_90_pct',
        data: parsed.map(d => d.spend_90_pct),
        borderColor: '#f9c74f',
        backgroundColor: '#f9c74f',
        tension: 0.3
      },
      {
        label: 'spend_90_pct_less',
        data: parsed.map(d => d.spend_90_pct_less),
        borderColor: '#90be6d',
        backgroundColor: '#90be6d',
        tension: 0.3
      },
      {
        label: 'total',
        data: parsed.map(d => d.total),
        borderColor: '#8e6c8a',
        backgroundColor: '#8e6c8a',
        tension: 0.3
      }
    ];
  
    // Create chart container
    const container = document.createElement('div');
    container.innerHTML = '<canvas id="dailySpendChart" height="100"></canvas>';
    document.body.appendChild(container);
  
    const ctx = document.getElementById('dailySpendChart').getContext('2d');
  
    // Build the chart
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: chartDatasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Daily BW Spend Categories',
            font: { size: 20 }
          },
          legend: {
            position: 'right'
          },
          zoom: {
            pan: { enabled: true, mode: 'x' },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: 'x'
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: { unit: 'day' },
            title: { display: true, text: 'Day' }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Measure Values' }
          }
        }
      }
    });
  });
  