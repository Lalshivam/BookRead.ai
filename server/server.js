const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { extractContextFromPDF } = require('./pdfUtils');
const axios = require('axios');
const fs = require('fs');

require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({ 
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'],
  credentials: true
}));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// API Routes (must come BEFORE static file serving)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'BookRead AI Server is running',
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.GEMINI_API_KEY
  });
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  console.log('File uploaded:', req.file.filename);
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// AI query endpoint
app.post('/api/query', async (req, res) => {
  const { text, prompt, filename, pageNumber } = req.body;

  if (!text || !prompt) {
    return res.status(400).json({ error: 'Missing text or prompt' });
  }

  try {
    console.log('\n--- AI Query Incoming ---');
    console.log('Prompt:', prompt);
    console.log('Selected text length:', text.length);

    // If filename and pageNumber provided, extract context
    let context = '';
    if (filename && pageNumber) {
      try {
        context = await extractContextFromPDF(filename, parseInt(pageNumber));
      } catch (contextError) {
        console.log('Context extraction failed, proceeding without context:', contextError.message);
      }
    }

    const fullPrompt = `${prompt}\n\nContext:\n${context}\n\nSelected Text:\n${text}`;

    console.log('Querying Gemini AI...');

    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
      {
        contents: [{ parts: [{ text: fullPrompt }] }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        timeout: 30000
      }
    );

    const geminiReply =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';

    console.log('Gemini response received successfully');
    res.json({ response: geminiReply });
  } catch (error) {
    console.error('Gemini API error:', error?.response?.data || error.message);
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ error: 'Request timeout - please try again' });
    }
    res.status(500).json({ error: 'Failed to query Gemini API' });
  }
});

// Serve static files from React build
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
console.log('Looking for client build at:', clientBuildPath);

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  console.log('✅ Client build directory found');
} else {
  console.log('⚠️ Client build not found. Run: cd client && npm run build');
}

// FIXED: Replace the problematic catch-all route with specific handling
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  
  // Serve index.html for all other routes (SPA routing)
  const indexPath = path.join(clientBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ 
      error: 'Client build not found',
      message: 'Please run: cd client && npm run build'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('🚀 BookRead AI Server Started Successfully!');
  console.log(`📊 Port: ${PORT}`);
  console.log(`🔑 API Key: ${process.env.GEMINI_API_KEY ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health`);
  console.log(`📁 Client Build: ${fs.existsSync(clientBuildPath) ? '✅ Found' : '❌ Missing'}`);
});

// const express = require('express');
// const cors = require('cors');
// const multer = require('multer');
// const path = require('path');
// const { extractContextFromPDF } = require('./pdfUtils');
// const axios = require('axios');
// const fs = require('fs');


// require('dotenv').config();

// const app = express();
// app.use(express.json());
// app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }));

// // Multer config
// const storage = multer.diskStorage({
//   destination: './uploads/',
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });

// app.post('/api/upload', upload.single('file'), (req, res) => {
//   if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
//   res.json({ filePath: `/uploads/${req.file.filename}` });
// });

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// app.post('/api/query', async (req, res) => {
//   const { text, prompt, filename, pageNumber } = req.body;

//   if (!text || !prompt || !filename || !pageNumber) {
//     return res.status(400).json({ error: 'Missing text, prompt, filename, or pageNumber' });
//   }

//   try {
//     console.log('\n--- AI Query Incoming ---');
//     console.log('Prompt:', prompt);
//     console.log('Page:', pageNumber);
//     console.log('File:', filename);

//     const context = await extractContextFromPDF(filename, parseInt(pageNumber));
//     const fullPrompt = `${prompt}\n\nContext:\n${context}\n\nSelected Text:\n${text}`;

//     console.log('Full prompt sent to Gemini:\n', fullPrompt);

//     const response = await axios.post(
//       'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
//       {
//         contents: [{ parts: [{ text: fullPrompt }] }],
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'x-goog-api-key': process.env.GEMINI_API_KEY,
//         },
//       }
//     );

//     const geminiReply =
//       response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';

//     res.json({ response: geminiReply });
//   } catch (error) {
//     console.error('Gemini API error:', error?.response?.data || error.message);
//     res.status(500).json({ error: 'Failed to query Gemini API' });
//   }
// });

// const PORT = 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

