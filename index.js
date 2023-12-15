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
        }
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

    function redrawInRange(start, end) {
        console.log('redrww');
        const filtered = data.filter((interval) => interval.start > start && interval.start < end);
        plotDailyIntervals(filtered);
        plotAvgDailyIntervals(filtered);
    }

    const debouncedRedrawInRange = debounce(redrawInRange, 300);

    document.getElementById('all-intervals').on('plotly_relayout', (evt) => {
        console.log(evt);
        // from range selector
        if (evt['xaxis.range[0]']) {
            const start = evt['xaxis.range[0]'];
            const end = evt['xaxis.range[1]'];

            redrawInRange(start, end);
            console.log(start, end);
        } else if (evt['xaxis.autorange']) {
            console.log('auto');

            // redraw subplots
            plotDailyIntervals(data);
            plotAvgDailyIntervals(data);

        } else if (evt['xaxis.range']) {
            const start = evt['xaxis.range'][0];
            const end = evt['xaxis.range'][1];
            debouncedRedrawInRange(start, end);


            console.log(start, end);
        }
    });
}


main();

