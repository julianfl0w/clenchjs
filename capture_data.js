function log(text) {
    const logElement = document.getElementById('log');
    logElement.textContent += text + '\n';
}

var startTime = 0;
document.getElementById('getBatteryButton').addEventListener('click', function() {
    log('Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice({
        filters: [{
            services: ['0000180f-0000-1000-8000-00805f9b34fb', '00001815-0000-1000-8000-00805f9b34fb']
        }]
    })
    .then(device => {
        log('Connecting to GATT Server...');
        return device.gatt.connect();
    })
    .then(server => {
        // Now, retrieve both services in parallel
        return Promise.all([
            server.getPrimaryService('battery_service'),
            server.getPrimaryService('00001815-0000-1000-8000-00805f9b34fb')  // Automation IO Service using full UUID
        ]);
    })
    .then(services => {
        const [batteryService, automationIoService] = services;

        // Process the battery level characteristic
        log('Getting Battery Level Characteristic...');
        return Promise.all([
            batteryService.getCharacteristic('battery_level').then(characteristic => {
                log('Reading Battery Level...');
                return characteristic.readValue();
            }),
            automationIoService.getCharacteristic('00002a58-0000-1000-8000-00805f9b34fb')  // Analog Characteristic using full UUID
        ]);
    })
    .then(results => {
        const [batteryValue, analogCharacteristic] = results;

        let batteryLevel = batteryValue.getUint8(0);
        log('> Battery Level is ' + batteryLevel + '%');

        // Set up EMG value notifications
        log('Setting up EMG value notifications...');
        return analogCharacteristic.startNotifications().then(() => {
            analogCharacteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
            log('Notifications started for EMG values.');
        });
    })
    .catch(error => {
        log('Argh! ' + error);
    });
});

let emgData = [];
let chart = null;
const maxDataPoints = 1000;

document.getElementById('downloadCSV').addEventListener('click', downloadCSV);
document.getElementById('bluetoothButton').addEventListener('click', function() {
    startTime = new Date().getTime();
  if (navigator.bluetooth) {
    navigator.bluetooth.requestDevice({
        filters: [{
            services: ['0000180f-0000-1000-8000-00805f9b34fb', '00001815-0000-1000-8000-00805f9b34fb']
        }]
    })
    .then(device => device.gatt.connect())
    .then(server => server.getPrimaryService('00001815-0000-1000-8000-00805f9b34fb'))
    .then(service => service.getCharacteristic('00002a58-0000-1000-8000-00805f9b34fb'))
    .then(characteristic => {
        characteristic.startNotifications().then(() => {
            characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
            console.log('Notifications started');
        });
    })
    .catch(error => console.error('Connection failed', error));
  }
});

function formatTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60);
    let minutes = Math.floor((duration / (1000 * 60)) % 60);
    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return `${hours}:${minutes}:${seconds}`;
}



var lastTime = 0;
function updateEmgDisplay(emgValue, currentTime) {
    const displayElement = document.getElementById('emgValueDisplay');
    displayElement.textContent = `EMG Value: ${emgValue}`;
    const timeElement = document.getElementById('timeDisplay');
    timeElement.textContent = `Time: ${currentTime - lastTime}`;
    lastTime = currentTime;
    const runTimeElement = document.getElementById('runTime');
    runTimeElement.textContent = `Runtime: ${formatTime(currentTime - startTime)}`;
}


function handleCharacteristicValueChanged(event) {

    const value = event.target.value;
    const emgValue = value.getUint16(0, true); // true for little endian
    const currentTime = new Date().getTime(); // Get current time in milliseconds

    // Add new data point to the array
    emgData.push({ time: currentTime, value: emgValue });

    // Update chart
    updateEmgDisplay(emgValue, currentTime);
    //updateChartData(chart, currentTime, emgValue, 10000); // 10000 ms = 10 seconds
}

function downloadCSV() {
    let csvContent = "data:text/csv;charset=utf-8,Time,EMG Value\n" + emgData.map(e => `${e.time},${e.value}`).join("\n");
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "emg_data.csv");
    document.body.appendChild(link);
    link.click();
}
