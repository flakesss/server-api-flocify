const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');

const app = express();
const port = 3000; // Anda bisa ganti port jika perlu

// --- Konfigurasi MQTT (Sesuai dengan kode ESP32 Anda) ---
const MQTT_BROKER_URL = 'mqtt://broker.hivemq.com';
const MQTT_TOPIC = 'flocify/sensor/node1';

// Variabel untuk menyimpan data sensor terakhir yang diterima
let latestSensorData = {
    message: 'Menunggu data pertama dari sensor...',
    timestamp: new Date().toISOString()
};

console.log(`Mencoba terhubung ke broker MQTT di ${MQTT_BROKER_URL}...`);

// Inisialisasi koneksi ke client MQTT
const client = mqtt.connect(MQTT_BROKER_URL);

client.on('connect', () => {
    console.log('✅ Berhasil terhubung ke broker MQTT!');
    // Subscribe ke topik setelah berhasil terhubung
    client.subscribe(MQTT_TOPIC, (err) => {
        if (!err) {
            console.log(`✅ Berhasil subscribe ke topik: "${MQTT_TOPIC}"`);
        } else {
            console.error('❌ Gagal subscribe ke topik:', err);
        }
    });
});

client.on('message', (topic, message) => {
    // message adalah Buffer, kita ubah ke string
    const messageString = message.toString();
    console.log(`📥 Pesan diterima dari topik "${topic}": ${messageString}`);

    // Coba parsing string JSON ke objek JavaScript
    try {
        const jsonData = JSON.parse(messageString);
        
        // Simpan pesan terbaru dalam format objek
        latestSensorData = {
            data: jsonData,
            timestamp: new Date().toISOString()
        };
        console.log('✅ Data JSON berhasil di-parse dan disimpan.');
    } catch (error) {
        console.error('❌ Gagal mem-parsing JSON:', error);
        // Jika gagal, simpan sebagai string mentah
        latestSensorData = {
            data: messageString,
            error: "Pesan yang diterima bukan format JSON yang valid.",
            timestamp: new Date().toISOString()
        };
    }
});

client.on('error', (err) => {
    console.error('❌ Koneksi MQTT error:', err);
});


// --- Konfigurasi API Server ---
app.use(cors()); // Mengizinkan akses dari domain lain (Penting untuk web)
app.use(express.json());

// Endpoint utama untuk mendapatkan data sensor terbaru
app.get('/api/sensor', (req, res) => {
    res.json(latestSensorData);
});

app.listen(port, () => {
    console.log(`🚀 Server API berjalan di http://localhost:${port}`);
    console.log(`👉 Akses data sensor terbaru melalui: GET http://localhost:${port}/api/sensor`);
});
