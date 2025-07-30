const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'],
  credentials: true
}));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/dist')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// API Routes
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File uploaded:', req.file.filename);
    res.json({ 
      filePath: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      originalname: req.file.originalname
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// AI Query endpoint
app.post('/api/query', async (req, res) => {
  try {
    const { text, prompt, filename, pageNumber = 1 } = req.body;

    if (!text || !prompt) {
      return res.status(400).json({ error: 'Text and prompt are required' });
    }

    // Create a comprehensive prompt for Gemini
    const fullPrompt = `
Context: The user is reading a PDF document${filename ? ` named "${filename}"` : ''} and has selected the following text for analysis:

Selected Text: "${text}"

User Question: ${prompt}

Please provide a detailed, helpful response that:
1. Directly addresses the user's question
2. References the selected text context
3. Provides clear explanations
4. Can respond in both English and Hindi if needed
5. Is educational and informative

Response:`;

    console.log('Full prompt sent to Gemini:\n', fullPrompt);

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
      }
    );

    const geminiReply =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';

    res.json({ response: geminiReply });
  } catch (error) {
    console.error('Gemini API error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to query Gemini API' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BookRead AI Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve React app for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
  }
  
  console.error('Server Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 BookRead AI Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
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

