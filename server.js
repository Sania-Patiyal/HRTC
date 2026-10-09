const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const mm = require('music-metadata');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const MUSIC_DIR = path.join(__dirname, 'music');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Ensure music directory exists
if (!fs.existsSync(MUSIC_DIR)) {
  fs.mkdirSync(MUSIC_DIR, { recursive: true });
}

// Allowed audio/video file extensions
const ALLOWED_EXTS = ['.mp3', '.mp4', '.m4a', '.wav', '.ogg', '.aac', '.flac', '.webm', '.mkv'];

// Multer storage setup for song uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, MUSIC_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio and media files are allowed!'));
    }
  }
});

// Middleware
app.use(express.static(PUBLIC_DIR));
app.use('/music', express.static(MUSIC_DIR));
app.use(express.json());

// Track online active users ("सवारी")
let activeUsers = 0;

wss.on('connection', (ws) => {
  activeUsers++;
  broadcastUserCount();

  ws.on('close', () => {
    activeUsers = Math.max(0, activeUsers - 1);
    broadcastUserCount();
  });

  ws.on('error', () => {
    // handle socket error silently
  });
});

function broadcastUserCount() {
  const payload = JSON.stringify({ type: 'USER_COUNT', count: activeUsers });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Fallback helper to format track title & artist from filename
function parseFilenameMetadata(filename) {
  const nameWithoutExt = path.parse(filename).name;
  let title = nameWithoutExt;
  let artist = '90s Hindi Classic';

  if (nameWithoutExt.includes(' - ')) {
    const parts = nameWithoutExt.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  } else if (nameWithoutExt.includes('-')) {
    const parts = nameWithoutExt.split('-');
    artist = parts[0].trim();
    title = parts.slice(1).join('-').trim();
  }

  return { title, artist };
}

// API endpoint to get list of local songs with extracted embedded ID3 metadata & cover photo
app.get('/api/songs', async (req, res) => {
  try {
    const files = fs.readdirSync(MUSIC_DIR);
    
    const mediaFiles = files.filter(file => 
      ALLOWED_EXTS.includes(path.extname(file).toLowerCase())
    );

    const songsPromises = mediaFiles.map(async (file, idx) => {
      const filePath = path.join(MUSIC_DIR, file);
      const fallbackMeta = parseFilenameMetadata(file);

      let title = fallbackMeta.title;
      let artist = fallbackMeta.artist;
      let hasCover = false;

      try {
        const metadata = await mm.parseFile(filePath, { duration: true });
        if (metadata.common.title) {
          title = metadata.common.title;
        }
        if (metadata.common.artist) {
          artist = metadata.common.artist;
        }
        if (metadata.common.picture && metadata.common.picture.length > 0) {
          hasCover = true;
        }
      } catch (err) {
        // metadata extraction error fallback
      }

      return {
        id: `local-${idx}-${file}`,
        title: title,
        artist: artist,
        url: `/music/${encodeURIComponent(file)}`,
        coverUrl: hasCover ? `/api/cover/${encodeURIComponent(file)}` : null,
        filename: file,
        isLocal: true
      };
    });

    const songs = await Promise.all(songsPromises);
    res.json({ songs, activeUsers });
  } catch (err) {
    console.error('Error reading music folder:', err);
    res.status(500).json({ error: 'Failed to read music directory', songs: [] });
  }
});

// Endpoint to serve extracted embedded album art cover photo
app.get('/api/cover/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(MUSIC_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }

    const metadata = await mm.parseFile(filePath);
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0];
      res.set('Content-Type', picture.format || 'image/jpeg');
      return res.send(picture.data);
    } else {
      return res.status(404).send('No embedded artwork found');
    }
  } catch (err) {
    return res.status(500).send('Error extracting artwork');
  }
});

// API endpoint to upload audio/video files
app.post('/api/upload', upload.array('songs', 20), (req, res) => {
  res.json({ message: 'Files uploaded successfully!', files: req.files ? req.files.map(f => f.filename) : [] });
});

// Fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`================================================`);
  console.log(`🚌 HRTC Bus Driver Radio Server running on: http://localhost:${PORT}`);
  console.log(`🎵 Place your downloaded MP3 / MP4 files in: ${MUSIC_DIR}`);
  console.log(`================================================`);
});
