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

async function get_data() {
    const r = await fetch('./dhanur_data.json')
    const d = await r.json()
    return d;
}

function avg(arr) {
    let t = 0;
    for (const v of arr) {
        t += v;
    }
    return Math.round(t / arr.length);
}

async function plotAllIntervals() {
    const data = await get_data();

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

    Plotly.newPlot('all-intervals', traces);
}


async function plotDailyIntervals() {
    const data = await get_data();
    
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
        traces.push(tracesByMonth[month]);
    }

    Plotly.newPlot('daily-intervals', traces);
}

async function plotAvgDailyIntervals() {
    const data = await get_data();
    
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
        traces.push(tracesByMonth[month]);
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

    var layout = {
        yaxis: {
          title: 'kwH'
        }
      };

    Plotly.newPlot('average-daily-intervals', traces, layout);
}


plotAllIntervals()
plotDailyIntervals();
plotAvgDailyIntervals();