// TODO: customer switcher
// TODO: segment shapes by month?

const months = {
    '01': 'January',
    '02': 'February',
    '03': 'March',
    '04': 'April',
    '05': 'May',
    '06': 'June',
    '07': 'July',
    '08': 'August',
    '09': 'September',
    '10': 'October',
    '11': 'November',
    '12': 'December'
};

const month_nos = [
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    '07',
    '08',
    '09',
    '10',
    '11',
    '12'
]

function convertToPST(dateString) {
    // Create a date object from the input string
    const date = new Date(dateString);

    // This is terrible and wrong for DST.
    const offset = new Date(date.getTime() - 8 * (60 * 60 * 1000));
    return offset.toISOString().replace('.000', '');
}

function convertDataToLocalTime(data) {
    data.forEach((interval) => {
        interval.start = convertToLocalTime(interval.start);
    });
    return data;
}


function convertToLocalTime(utcStr) {
    // assume user is in PST
    return convertToPST(utcStr);
}

async function get_data() {
    const r = await fetch('./dhanur_data.json')
    const d = await r.json();

    return d;
}

function avg(arr) {
    let t = 0;
    for (const v of arr) {
        t += v;
    }
    return Math.round(t / arr.length);
}

function plotAllIntervals(data) {
    const trace = {
        x: [],
        y: [],
        type: 'scatter',
    }
    for (let interval of data) {
        trace.x.push(interval.start);
        trace.y.push(interval.net_electricity_consumption)
    }

    const traces = [trace];
    const selectorOptions = {};
    const layout = {
        xaxis: {
            rangeslider: selectorOptions,
        },
        yaxis: { autorange: true },
        shapes: [],
    };

    Plotly.newPlot('all-intervals', traces, layout);
}


function plotDailyIntervals(data) {
    const tracesByMonth = {};

    for (let interval of data) {
        const month = interval.start.split('-')[1];
        const trace = tracesByMonth[month] || {
            x: [],
            y: [],
            type: 'scatter',
            'mode': 'markers',
            name: months[month],
        };
        tracesByMonth[month] = trace;
        const time = interval.start.split('T')[1].slice(0, -4);
        trace.x.push(time);
        trace.y.push(interval.net_electricity_consumption)
    }

    const traces = [];

    for (const month of month_nos) {
        if (tracesByMonth[month]?.x.length) {
            traces.push(tracesByMonth[month]);
        }
    }

    const evShape = {
        type: 'rect',
        xref: 'x',
        yref: 'y',
        x0: '00:00',
        x1: '03:00',
        y0: 2100,
        y1: 3000,
        label: {
            text: 'Level 2 EV Charging',
            font: { size: 10, color: 'green' },
            textposition: 'top left',
        },
        fillcolor: '#d3d3d3',
        opacity: 0.4,
        line: {
            width: 0
        },
    };

    const shapes = [];

    const layout = {
        yaxis: {
            title: 'wH'
        },
        shapes,
    };

    const div = document.getElementById('daily-intervals');
    Plotly.newPlot('daily-intervals', traces, layout);
}

function plotAvgDailyIntervals(data) {
    const tracesByMonth = {};

    for (let interval of data) {
        const month = interval.start.split('-')[1];
        const trace = tracesByMonth[month] || {
            x: [],
            y: [],
            'type': 'scatter',
            mode: 'lines+markers',
            name: months[month],
        };
        tracesByMonth[month] = trace;
        const time = interval.start.split('T')[1].slice(0, -4);
        trace.x.push(time);
        trace.y.push(interval.net_electricity_consumption)
    }

    const traces = [];

    for (const month of month_nos) {
        if (tracesByMonth[month]?.x.length) {
            traces.push(tracesByMonth[month]);
        }
    }

    // Average things out to make it less messy.
    traces.forEach((trace) => {
        const dataPerInterval = {};
        for (let i = 0; i < trace.x.length; i++) {
            const x = trace.x[i];
            const y = trace.y[i];
            dataPerInterval[x] = dataPerInterval[x] || [];
            dataPerInterval[x].push(y);
        }

        trace.x = [];
        trace.y = [];
        for (const [interval, values] of Object.entries(dataPerInterval)) {
            trace.x.push(interval);
            trace.y.push(avg(values))
        }
    })

    const shapes = [];

    const layout = {
        yaxis: {
            title: 'wH'
        },
        shapes
    };

    Plotly.newPlot('average-daily-intervals', traces, layout);
}

function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

async function main() {
    const data = await get_data();
    convertDataToLocalTime(data);

    data.sort((a, b) => new Date(a.start) - new Date(b.start));

    plotAllIntervals(data);
    plotDailyIntervals(data);
    plotAvgDailyIntervals(data);
    updateSidebar(data[0].start, data[data.length - 1].start);

    function updateSidebar(start, end) {
        const startNice = new Date(start);
        const endNice = new Date(end);

        if (startNice.getDate() === endNice.getDate()) {
            document.getElementById('viewing-range').innerText = `Viewing data from ${startNice.toDateString()} ${startNice.toLocaleTimeString()} - ${endNice.toLocaleTimeString()}.`

        } else {
            document.getElementById('viewing-range').innerText = `Viewing data from ${startNice.toDateString()} - ${endNice.toDateString()}.`

        }

    }

    function redrawInRange(start, end) {
        const filtered = data.filter((interval) => interval.start > start && interval.start < end);
        plotDailyIntervals(filtered);
        plotAvgDailyIntervals(filtered);
        updateSidebar(start, end);

        const yValues = filtered.map((x) => x.net_electricity_consumption);

        let yMin = Math.min(...yValues);
        yMin = Math.floor(yMin / 100) * 100;
        let yMax = Math.max(...yValues);
        yMax = Math.ceil(yMax / 100) * 100;
        return [yMin, yMax];
    }

    const debouncedRedrawInRange = debounce(redrawInRange, 300);

    document.getElementById('all-intervals').on('plotly_relayout', (evt) => {
        // from range selector
        if (evt['xaxis.range[0]']) {
            const start = evt['xaxis.range[0]'];
            const end = evt['xaxis.range[1]'];

            const yRange = redrawInRange(start, end);
            const update = {
                'yaxis.range': yRange,
                shapes: [],
            };
          
            Plotly.relayout('all-intervals', update);

        } else if (evt['xaxis.autorange']) {
            // redraw subplots
            plotDailyIntervals(data);
            plotAvgDailyIntervals(data);
            const update = {
                'yaxis': {},
                shapes: [],
            };

            Plotly.relayout('all-intervals', update);


        } else if (evt['xaxis.range']) {
            const start = evt['xaxis.range'][0];
            const end = evt['xaxis.range'][1];
            // from range selector, so debounce for perf
            debouncedRedrawInRange(start, end);
        }
    });

    window.addEventListener('hashchange', (evt) => {
        if (location.hash === '#l2-ev-charger') {
            const start = "2023-11-29 20:00";
            const end = "2023-12-12 23:45";
            const update = {
                'xaxis.range': [start, end],
                shapes: [{
                    type: 'rect',
                    xref: 'x',
                    yref: 'y',
                    x0: '2023-12-1 16:00',
                    x1: '2023-12-2 02:00',
                    y0: 2400,
                    y1: 2800,
                    fillcolor: 'rgba(44, 160, 101, 0.5)',
                    line: {
                        color: 'rgb(44, 160, 101)'
                    }
                }, {
                    type: 'rect',
                    xref: 'x',
                    yref: 'y',
                    x0: '2023-12-3 22:00',
                    x1: '2023-12-4 05:00',
                    y0: 2400,
                    y1: 2800,
                    fillcolor: 'rgba(44, 160, 101, 0.5)',
                    line: {
                        color: 'rgb(44, 160, 101)'
                    }                    
                }, {
                    type: 'rect',
                    xref: 'x',
                    yref: 'y',
                    x0: '2023-12-10 21:00',
                    x1: '2023-12-11 03:00',
                    y0: 2400,
                    y1: 2800,
                    fillcolor: 'rgba(44, 160, 101, 0.5)',
                    line: {
                        color: 'rgb(44, 160, 101)'
                    }
                }, {
                    type: 'line',
                    xref: 'paper',
                    yref: 'y',
                    x0: 0,
                    x1: 1,
                    y0: 2400,
                    y1: 2400,
                    line: {
                      color: 'rgb(50, 171, 96)',
                      width: 4,
                      dash: 'dashdot'
                    },
                    label: {
                        text: 'L2 EV Charging',
                        font: { size: 10, color: 'green' },
                        textposition: 'top center',
                      },
                  }]
            };

            Plotly.relayout('all-intervals', update);

            // zoom into range
        }
        if (location.hash === '#load-reduction') {
            const start = "2023-03-22 20:30";
            const dropoff = "2023-04-20 10:00"
            const end = "2023-05-04 11:30";
            const update = {
                'xaxis.range': [start, end],
                shapes: [{
                    type: 'rect',
                    xref: 'x',
                    yref: 'y',
                    x0: start,
                    x1: dropoff,
                    y0: 0,
                    y1: 600,
                    fillcolor: 'rgba(160, 44, 101, 0.1)',
                    line: {
                        color: 'rgb(160, 44, 101)'
                    },
                    // label: {
                    //     text: 'Higher Average Load ~400wH',
                    //     font: { size: 10, color: 'red' },
                    //     textposition: 'top center',
                    //     yanchor: 'top',
                    //   },                    
                }, {
                    type: 'rect',
                    xref: 'x',
                    yref: 'y',
                    x0: dropoff,
                    x1: end,
                    y0: 100,
                    y1: 350,
                    fillcolor: 'rgba(44, 160, 101, 0.1)',
                    line: {
                        color: 'rgb(44, 160, 101)'
                    },
                    // label: {
                    //     text: 'Lower Average Load ~200wH',
                    //     font: { size: 10, color: 'green' },
                    //     textposition: 'top center',
                    //     yanchor: 'top',
                    //   },                    
                }],
            };

            Plotly.relayout('all-intervals', update);

        }

    });
}


main();

