
function setupChart() {
    const ctx = document.getElementById('emgChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'EMG Value',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                data: [],
                fill: false,
                lineTension: 0,
                pointRadius: 0
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    ticks: {
                        callback: function(value) {
                            return new Date(value).toLocaleTimeString(); // Formatting the timestamp
                        }
                    }
                },
                y: {
                    beginAtZero: true
                }
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        let label = data.datasets[tooltipItem.datasetIndex].label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += tooltipItem.yLabel;
                        return label;
                    }
                }
            }
        }
    });
}


function updateChartData(chart, currentTime, emgValue, timeWindow) {

    if (!chart) {
        console.error('Chart is not initialized.');
        return;
    }
    // Add new data point
    chart.data.labels.push(currentTime);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push({ x: currentTime, y: emgValue });
    });

    // Remove old data points that are outside the 10-second window
    while (chart.data.labels.length > 0 && chart.data.labels[0] < currentTime - timeWindow) {
        chart.data.labels.shift();
        chart.data.datasets.forEach((dataset) => {
            dataset.data.shift();
        });
    }

    chart.update();
}

window.onload = setupChart;