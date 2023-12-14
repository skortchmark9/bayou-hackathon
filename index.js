    async function get_data() {
    const r = await fetch('./dhanur_data.json')
    const d = await r.json()
    return d;
}

async function plotAllIntervals() {
    const data = await get_data();

    const trace = {
        x: [],
        y: [],
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
            name: month,
        };
        tracesByMonth[month] = trace;
        trace.x.push(interval.start.split('T')[1]);
        trace.y.push(interval.net_electricity_consumption)
    }

    const traces = [...Object.values(tracesByMonth)];

    Plotly.newPlot('daily-intervals', traces);
}


// var trace1 = {
//     x: [1, 2, 3, 4],
//     y: [10, 15, 13, 17],
//     mode: 'markers',
//     type: 'scatter'
//   };
  
//   var trace2 = {
//     x: [2, 3, 4, 5],
//     y: [16, 5, 11, 9],
//     mode: 'lines',
//     type: 'scatter'
//   };
  
//   var trace3 = {
//     x: [1, 2, 3, 4],
//     y: [12, 9, 15, 12],
//     mode: 'lines+markers',
//     type: 'scatter'
//   };
  
//   var data = [trace1, trace2, trace3];
  
//   Plotly.newPlot('myDiv', data);
  

  plotAllIntervals()
  plotDailyIntervals();