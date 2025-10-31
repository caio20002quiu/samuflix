const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configurar diretório de uploads
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configurar multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_DIR, file.fieldname === 'video' ? 'videos' : 'thumb');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  }
});

// Servir arquivos estáticos
app.use('/uploads', express.static(UPLOAD_DIR));

// ---- Models ----
const Video = mongoose.model('Video', new mongoose.Schema({
  id: String,
  title: String,
  thumbUrl: String,
  mediaUrl: String,
  publishedAt: Number
}, { timestamps: true }));

const Favorite = mongoose.model('Favorite', new mongoose.Schema({
  userId: String,
  videoId: String,
  title: String,
  thumbUrl: String,
  mediaUrl: String,
  publishedAt: Number
}, { timestamps: true }));

const Message = mongoose.model('Message', new mongoose.Schema({
  userId: String,
  text: String,
  createdAt: Number
}, { timestamps: true }));

// ---- Routes ----
app.get('/health', (_req, res) => res.json({ ok: true }));

// Videos
app.get('/videos', async (_req, res) => {
  try {
    const items = await Video.find().sort({ publishedAt: -1 }).lean();
    res.json(items);
  } catch (error) {
    console.error('Erro ao buscar vídeos:', error);
    res.status(500).json({ error: 'Erro ao buscar vídeos' });
  }
});

app.post('/videos', async (req, res) => {
  try {
    await Video.create(req.body);
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erro ao criar vídeo:', error);
    res.status(500).json({ error: 'Erro ao criar vídeo' });
  }
});

// Upload de vídeo
app.post('/videos/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    const fileUrl = `/uploads/videos/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  } catch (error) {
    console.error('Erro ao fazer upload do vídeo:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do vídeo' });
  }
});

// Upload de thumbnail
app.post('/videos/upload-thumb', upload.single('thumb'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    const fileUrl = `/uploads/thumb/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  } catch (error) {
    console.error('Erro ao fazer upload da thumbnail:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da thumbnail' });
  }
});

// Favorites
app.get('/favorites/:userId', async (req, res) => {
  try {
    const items = await Favorite.find({ userId: req.params.userId }).sort({ publishedAt: -1 }).lean();
    res.json(items);
  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    res.status(500).json({ error: 'Erro ao buscar favoritos' });
  }
});
app.post('/favorites', async (req, res) => {
  try {
    await Favorite.create(req.body);
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erro ao criar favorito:', error);
    res.status(500).json({ error: 'Erro ao criar favorito' });
  }
});
app.delete('/favorites/:userId/:videoId', async (req, res) => {
  try {
    await Favorite.deleteMany({ userId: req.params.userId, videoId: req.params.videoId });
    res.status(204).end();
  } catch (error) {
    console.error('Erro ao remover favorito:', error);
    res.status(500).json({ error: 'Erro ao remover favorito' });
  }
});

// Messages
app.get('/messages/:userId', async (req, res) => {
  try {
    const items = await Message.find({ userId: req.params.userId }).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});
app.post('/messages', async (req, res) => {
  try {
    await Message.create(req.body);
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erro ao criar mensagem:', error);
    res.status(500).json({ error: 'Erro ao criar mensagem' });
  }
});

async function start() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI não definido no .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  // Parse seguro da porta, removendo espaços e caracteres extras
  const portRaw = process.env.PORT || '4000';
  const port = parseInt(portRaw.toString().trim().replace(/[^0-9]/g, ''), 10) || 4000;
  app.listen(port, () => console.log('API ligada na porta', port));
}

start();


