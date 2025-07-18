document.addEventListener("DOMContentLoaded", function () {
    const rawData = datasets["Daily BW Budget vs Spend Ratio Count (channel filter does not apply)"]; // Change to actual Mode query name
  
    const parsed = rawData.map(row => ({
      date: new Date(row.day),
      no_budget: Number(row.no_budget),
      overspend: Number(row.overspend),
      spend_90_pct: Number(row.spend_90_pct),
      spend_90_pct_less: Number(row.spend_90_pct_less),
      total: Number(row.total)
    }));
  
    const labels = parsed.map(d => d.date);
  
    const metricConfig = {
      no_budget: { label: "No Budget", color: "#43aa8b" },
      overspend: { label: "Overspend", color: "#577590" },
      spend_90_pct: { label: "90%–100%", color: "#f9c74f" },
      spend_90_pct_less: { label: "< 90%", color: "#90be6d" },
      total: { label: "Total", color: "#8e6c8a" }
    };
  
    // Initialize dataset array
    const chartDatasets = Object.entries(metricConfig).map(([key, meta]) => ({
      label: meta.label,
      data: parsed.map(d => d[key]),
      borderColor: meta.color,
      backgroundColor: meta.color,
      hidden: false,
      tension: 0.3
    }));
  
    // Get chart context
    const ctx = document.getElementById("budgetSpendChart").getContext("2d");
  
    // Create the chart
    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: chartDatasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false
          },
          legend: {
            display: false
          },
          zoom: {
            pan: { enabled: true, mode: "x" },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: "x"
            }
          }
        },
        scales: {
          x: {
            type: "time",
            time: { unit: "day" },
            title: { display: true, text: "Day" }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: "Measure Values" }
          }
        }
      }
    });
  
    // Inject metric toggles into the UI
    const togglesContainer = document.querySelector(".metric-toggles");
    chart.data.datasets.forEach((dataset, idx) => {
      const key = Object.keys(metricConfig)[idx];
      const color = metricConfig[key].color;
  
      const toggle = document.createElement("label");
      toggle.className = "metric-toggle active";
  
      toggle.innerHTML = `
        <input type="checkbox" class="metric-checkbox" checked data-index="${idx}">
        <span class="metric-label">
          <span class="metric-color" style="background-color: ${color}"></span>
          ${dataset.label}
        </span>
      `;
  
      togglesContainer.appendChild(toggle);
  
      toggle.querySelector("input").addEventListener("change", function (e) {
        const checked = e.target.checked;
        chart.data.datasets[idx].hidden = !checked;
        toggle.classList.toggle("active", checked);
        chart.update();
      });
    });
  
    // Zoom controls
    window.toggleZoom = function () {
      chart.options.plugins.zoom.zoom.wheel.enabled = !chart.options.plugins.zoom.zoom.wheel.enabled;
      chart.update();
    };
  
    window.resetZoom = function () {
      chart.resetZoom();
    };
  
    // Stub: Time range filter buttons
    window.switchTimeRange = function (range) {
      console.log(`Switching to range: ${range} (not yet implemented)`);
      // You can filter chart.data.datasets here if you pass in longer data
    };
  });
  