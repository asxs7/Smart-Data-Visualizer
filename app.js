let charts = {
    line: null,
    bar: null,
    pie: null,
    scatter: null
};

const colors = {
    primary: '#DC6D18',
    background: '#FFF4E4',
    tableHighlight: '#F8E0C9',
    text: '#2B1A12',
    border: '#B1AA81',
    chartColors: [
        '#DC6D18', // primary
        '#B1AA81', // border
        '#F8E0C9', // table highlight
        '#2B1A12', // text
        '#FFB067', // lighter primary
        '#8C5A1C', // darker primary
    ]
};

function handleFile() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a CSV file first!');
        return;
    }

    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                const cleanData = results.data.filter(row => 
                    Object.values(row).some(value => value !== "" && value !== null)
                );
                if (cleanData.length > 0) {
                    analyzeAndVisualize(cleanData);
                    displayData(cleanData);
                } else {
                    alert('No valid data found in the CSV file!');
                }
            }
        },
        error: function(error) {
            alert('Error reading the CSV file: ' + error.message);
        }
    });
}

function analyzeAndVisualize(data) {
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });

    const columns = Object.keys(data[0]);
    const analysis = analyzeColumns(data, columns);
    
    console.log('Data Analysis:', analysis);

    createTimeSeriesChart(data, analysis);
    createNumericChart(data, analysis);
    createCategoryChart(data, analysis);
    createCorrelationChart(data, analysis);
}

function analyzeColumns(data, columns) {
    const analysis = {
        numericColumns: [],
        categoricalColumns: [],
        timeColumns: [],
        booleanColumns: []
    };

    columns.forEach(column => {
        const values = data.map(row => row[column]);
        
        if (isTimeColumn(values)) {
            analysis.timeColumns.push(column);
        }
        else if (isNumericColumn(values)) {
            analysis.numericColumns.push(column);
        }
        else if (isBooleanColumn(values)) {
            analysis.booleanColumns.push(column);
        }
        else {
            analysis.categoricalColumns.push(column);
        }
    });

    return analysis;
}

function isTimeColumn(values) {
    return values.some(value => 
        value && typeof value === 'string' && 
        !isNaN(Date.parse(value)) && 
        value.includes('-')
    );
}

function isNumericColumn(values) {
    return values.every(value => 
        value === null || value === '' || 
        (typeof value === 'number' && !isNaN(value))
    );
}

function isBooleanColumn(values) {
    const booleanValues = ['true', 'false', '0', '1', 'yes', 'no'];
    return values.every(value => 
        value === null || value === '' ||
        booleanValues.includes(String(value).toLowerCase())
    );
}

function createTimeSeriesChart(data, analysis) {
    const timeColumn = analysis.timeColumns[0];
    const numericColumn = analysis.numericColumns[0];

    if (!timeColumn || !numericColumn) return;

    const ctx = document.getElementById('lineChart').getContext('2d');
    const sortedData = [...data].sort((a, b) => new Date(a[timeColumn]) - new Date(b[timeColumn]));

    charts.line = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedData.map(row => new Date(row[timeColumn]).toLocaleDateString()),
            datasets: [{
                label: numericColumn,
                data: sortedData.map(row => row[numericColumn]),
                borderColor: colors.primary,
                backgroundColor: colors.primary + '20',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${numericColumn} Over Time`
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createNumericChart(data, analysis) {
    const numericColumn = analysis.numericColumns[0];
    if (!numericColumn) return;

    const ctx = document.getElementById('barChart').getContext('2d');
    const values = data.map(row => row[numericColumn]);
    
    let labels;
    if (analysis.categoricalColumns.length > 0) {
        labels = data.map(row => row[analysis.categoricalColumns[0]]);
    } else if (analysis.timeColumns.length > 0) {
        labels = data.map(row => new Date(row[analysis.timeColumns[0]]).toLocaleDateString());
    } else {
        labels = values;
    }

    charts.bar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: numericColumn,
                data: values,
                backgroundColor: colors.chartColors.map(color => color + '80'),
                borderColor: colors.chartColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Distribution of ${numericColumn}`
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

function createCategoryChart(data, analysis) {
    const categoryColumn = analysis.categoricalColumns[0];
    if (!categoryColumn) return;

    const ctx = document.getElementById('pieChart').getContext('2d');
    const categoryCounts = {};
    
    data.forEach(row => {
        const value = row[categoryColumn];
        categoryCounts[value] = (categoryCounts[value] || 0) + 1;
    });

    charts.pie = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(categoryCounts),
            datasets: [{
                data: Object.values(categoryCounts),
                backgroundColor: colors.chartColors,
                borderColor: colors.white,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Distribution of ${categoryColumn}`
                }
            }
        }
    });
}

function createCorrelationChart(data, analysis) {
    const [xColumn, yColumn] = analysis.numericColumns;
    if (!xColumn || !yColumn) return;

    const ctx = document.getElementById('scatterChart').getContext('2d');
    const validData = data.filter(row => 
        row[xColumn] !== null && row[yColumn] !== null
    );

    charts.scatter = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: `${xColumn} vs ${yColumn}`,
                data: validData.map(row => ({
                    x: row[xColumn],
                    y: row[yColumn]
                })),
                backgroundColor: colors.primary + '80',
                borderColor: colors.primary
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Correlation: ${xColumn} vs ${yColumn}`
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: xColumn
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yColumn
                    }
                }
            }
        }
    });
}

function displayData(data) {
    const table = document.getElementById('dataTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    thead.innerHTML = '';
    tbody.innerHTML = '';

    const headerRow = document.createElement('tr');
    
    const snoHeader = document.createElement('th');
    snoHeader.textContent = 'S.No.';
    headerRow.appendChild(snoHeader);
    
    Object.keys(data[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        
        const snoCell = document.createElement('td');
        snoCell.textContent = (index + 1).toString();
        snoCell.style.fontWeight = '500';
        snoCell.style.color = colors.primary;
        tr.appendChild(snoCell);
        
        Object.values(row).forEach(value => {
            const td = document.createElement('td');
            if (value instanceof Date) {
                td.textContent = value.toLocaleString();
            } else {
                td.textContent = value !== null ? value : '';
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('csvFile');
    fileInput.addEventListener('change', function(e) {
        const fileName = e.target.files[0]?.name;
        if (fileName) {
            console.log('File selected:', fileName);
        }
    });
});
