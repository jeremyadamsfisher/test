"use strict";

// global variables
let chart;

// initial distribution parameters
let a = 2,
    b = 2,
    n = 10,
    k = 5,
    rope_min = 0.45,
    rope_max = 0.55;
const domain = [...Array(49).keys()].map(x => (x+1)/50);

function updateDists() {
    if (n < k) {
        showError("Can't have more successes than trials. (That's not logical!)");
        return;
    } 
    const B = (math.gamma(a) * math.gamma(b)) / math.gamma(a * b);
    const K = math.combinations(n, k);
    [// beta distribution
    {i: 0,
     pdf: theta => (theta**(a-1) * (1-theta)**(b-1)) / B},
    // binomial distribution
    {i: 1,
     pdf: theta =>  K * (theta**k)* ((1-theta)**(n-k))},
    // posterior distribution
    {i: 2,
     pdf: theta => K / B * (theta**(k+a-1)) * ((1-theta)**(n-k+b-1))},
    ].forEach(dist => {
        chart.data.datasets[dist.i].data = domain.map(
            theta => ({x: theta, y: dist.pdf(theta)})
        );
    });
    chart.update();
}

function trial(isSuccess) {
    n++;
    if (isSuccess) { k++; } 

    [{elemID: "nTrialField",   newVal: n},
     {elemID: "nSuccessField", newVal: k}
    ].forEach(x => document.getElementById(x.elemID).value = x.newVal);

    updateEstimatorFields();
    updateDists();
}

function updateEstimatorFields() {
    const mleEstimate = k / n,
          mapEstimate = (k + a - 1) / ((k + a - 1) + (n - k + b - 1));
    [{elemID: "mleEstimateForm", newVal: `MLE: ${mleEstimate.toPrecision(3)}`},
     {elemID: "mapEstimateForm", newVal: `MAP: ${mapEstimate.toPrecision(3)}`},
    ].forEach(x => document.getElementById(x.elemID).value = x.newVal);

    const reporter = document.getElementById("ropeReporter");
    if (rope_min <= mapEstimate && mapEstimate <= rope_max) {
        reporter.innerHTML = "Accourding to the MAP estimate, this coin is <b><font color='green'>FAIR</font></b>";
    } else {
        reporter.innerHTML = "Accourding to the MAP estimate, this coin is <b><font color='red'>BIASED</font></b>";
    }
}

function init() {
    // initialize the chart
    const ctx = document.getElementById('chartJSCanvas').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'β (prior) distribution',
                data: [],
                fill: false,
                backgroundColor: "#9D44B5",
                borderColor: "#9D44B5",
                pointRadius: 0,
            }, {
                label: 'binomial distribution',
                data: [],
                fill: false,
                backgroundColor: "#BADEFC",
                borderColor: "#BADEFC",
                pointRadius: 0,
            }, {
                label: 'posterior distribution',
                data: [],
                fill: false,
                backgroundColor: "#525252",
                borderColor: "#525252",
                pointRadius: 0,
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom'
                }],
                yAxes: [{
                    display: false,
                }]
            }
        }
    });
    // add event listeners
    [{name: 'alphaField',    sideEffect: val => a=val, def: a, thing: "alpha"},
     {name: 'betaField',     sideEffect: val => b=val, def: b, thing: "beta"},
     {name: 'nTrialField',   sideEffect: val => n=val, def: n, thing: "number of trials"},
     {name: 'nSuccessField', sideEffect: val => k=val, def: k, thing: "number of successes"},
     {name: 'minRopeField',  sideEffect: val => rope_min = val, def: rope_min, thing: "minimal practical equivalency"},
     {name: 'maxRopeField',  sideEffect: val => rope_max = val, def: rope_max, thing: "max practical equivalency"},
    ].forEach(
        interfaceElem => {
            const elem = document.getElementById(interfaceElem.name);
            elem.defaultValue = interfaceElem.def;
            elem.value = interfaceElem.def;
            elem.addEventListener('input', e => {
                const newVal = parseFloat(e.target.value);
                if (Number.isFinite(newVal)) {
                    interfaceElem.sideEffect(newVal);
                    setTimeout(updateDists, 500);
                    updateEstimatorFields();   
                } else {
                    showError(`could not parse ${interfaceElem.thing} field`);
                }
           });
        }
    );
    updateEstimatorFields();
    updateDists();
};

function showError(msg) {
    const alertBox = document.getElementById("alertBox");
    alertBox.style.display = "block";
    alertBox.innerHTML = "<b>Error!</b> " + msg;
    alertBox.classList.add("animated", "bounceInDown");
    setTimeout(() => {
        alertBox.classList.remove("bounceInDown");
        alertBox.classList.add("bounceOutUp");
    }, 5000);
    setTimeout(() => {
        alertBox.style.display = "none";
        alertBox.classList.remove("animated", "bounceOutUp");
    }, 6000);
}