import React, { useState, useRef } from 'react';
import { Upload, BookOpen, Sparkles, FileText, Send, X, Loader2, Star } from 'lucide-react';
import axios from 'axios';
import Toast from './components/Toast';
import { LoadingSpinner } from './components/Loading';

// Indian ornamental component
const IndianOrnament = ({ className = "" }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="text-saffron-600">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor">
        <path d="M20 2 L22 10 L30 8 L28 16 L36 18 L28 20 L30 28 L22 26 L20 34 L18 26 L10 28 L12 20 L4 18 L12 16 L10 8 L18 10 Z" />
        <circle cx="20" cy="20" r="6" fill="white" />
        <circle cx="20" cy="20" r="3" fill="currentColor" />
      </svg>
    </div>
  </div>
);

// Header component with Indian theme
const Header = () => (
  <header className="bg-gradient-to-r from-saffron-600 via-saffron-500 to-emerald-600 text-white py-6 px-4 shadow-lg">
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-full">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-elegant font-bold">BookRead AI</h1>
            <p className="text-saffron-100 font-hindi">पुस्तक पढ़ने का नया तरीका</p>
          </div>
        </div>
        <IndianOrnament />
      </div>
    </div>
  </header>
);

// File upload component
const FileUpload = ({ onFileUpload, isUploading }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      onFileUpload(file);
    } else {
      alert('कृपया केवल PDF फाइल अपलोड करें / Please upload only PDF files');
    }
    // Reset the input value to allow re-selecting the same file
    event.target.value = '';
  };

  return (
    <div className="glass rounded-xl p-8 border-2 border-dashed border-saffron-300 hover:border-saffron-500 transition-all duration-300">
      <div className="text-center">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-saffron-400 to-emerald-500 rounded-full flex items-center justify-center mb-4 float-animation">
          {isUploading ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : (
            <Upload className="w-10 h-10 text-white" />
          )}
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2 font-elegant">
          अपनी PDF अपलोड करें
        </h3>
        <p className="text-gray-600 mb-6">
          Upload your PDF to start reading with AI assistance
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-8 py-3 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-full hover:from-saffron-600 hover:to-saffron-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50"
        >
          {isUploading ? 'अपलोड हो रहा है...' : 'फाइल चुनें'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

// PDF Viewer with AI Chat
const PDFViewer = ({ pdfUrl, filename, onToast }) => {
  const [selectedText, setSelectedText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [aiQuery, setAiQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isQuerying, setIsQuerying] = useState(false);

  const handleTextSelection = () => {
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      console.log('=== TEXT SELECTION DEBUG ===');
      console.log('Selected text:', text);
      console.log('Selection length:', text.length);
      
      if (text && text.length > 0) {
        setSelectedText(text);
        onToast('info', `टेक्स्ट सेलेक्ट हुआ (${text.length} chars) / Text selected`);
        console.log('Text successfully selected:', text.substring(0, 50) + '...');
      } else {
        console.log('No text selected or empty selection');
      }
    }, 100); // Small delay to ensure selection is complete
  };

  const handleAIQuery = async () => {
    console.log('=== DEBUG: AI Query Debug Info ===');
    console.log('Selected Text:', selectedText);
    console.log('AI Query:', aiQuery);
    console.log('Filename:', filename);
    console.log('Current Page:', currentPage);
    
    if (!aiQuery.trim() || !selectedText) {
      console.log('Validation failed: Missing text or query');
      onToast('error', 'कृपया टेक्स्ट सेलेक्ट करें और प्रश्न लिखें / Please select text and enter a question');
      return;
    }

    setIsQuerying(true);
    try {
      console.log('Sending request to:', 'http://localhost:5000/api/query');
      const response = await axios.post('http://localhost:5000/api/query', {
        text: selectedText,
        prompt: aiQuery,
        filename: filename,
        pageNumber: currentPage
      });

      console.log('Response received:', response.data);

      const newChat = {
        id: Date.now(),
        query: aiQuery,
        selectedText: selectedText,
        response: response.data.response,
        timestamp: new Date().toLocaleString()
      };

      setChatHistory(prev => [newChat, ...prev]);
      setAiQuery('');
      setSelectedText('');
      onToast('success', 'AI उत्तर प्राप्त हुआ / AI response received');
    } catch (error) {
      console.error('AI Query error:', error);
      console.error('Error details:', error.response?.data || error.message);
      onToast('error', 'AI प्रश्न में त्रुटि / Error in AI query');
    }
    setIsQuerying(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* PDF Viewer */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 font-elegant">PDF Document</h3>
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-saffron-500" />
            <span className="text-sm text-gray-600">Page {currentPage}</span>
          </div>
        </div>
        <div 
          className="border-2 border-gray-300 rounded-lg h-96 overflow-auto bg-white"
          onMouseUp={handleTextSelection}
        >
          <iframe
            src={`http://localhost:5000${pdfUrl}`}
            className="w-full h-full"
            title="PDF Viewer"
          />
        </div>
        {selectedText && (
          <div className="mt-4 p-3 bg-saffron-50 border border-saffron-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Selected Text:</strong> {selectedText.substring(0, 100)}...
            </p>
            <button 
              onClick={() => setSelectedText('')}
              className="mt-2 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              Clear Selection
            </button>
          </div>
        )}
        
        {/* Manual text input option */}
        {!selectedText && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Alternative:</strong> If text selection doesn't work, paste text manually:
            </p>
            <textarea
              placeholder="Paste text from PDF here..."
              className="w-full p-2 text-sm border rounded"
              rows="2"
              onChange={(e) => {
                if (e.target.value.trim()) {
                  setSelectedText(e.target.value.trim());
                  onToast('info', 'Manual text added / मैन्युअल टेक्स्ट जोड़ा गया');
                }
              }}
            />
          </div>
        )}
      </div>

      {/* AI Chat Interface */}
      <div className="glass rounded-xl p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 font-elegant">AI Assistant</h3>
          <Sparkles className="w-6 h-6 text-emerald-500" />
        </div>

        {/* Query Input */}
        <div className="mb-4">
          <textarea
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="अपना प्रश्न यहाँ लिखें... / Ask your question here..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-saffron-500 focus:border-transparent"
            rows="3"
          />
          <button
            onClick={handleAIQuery}
            disabled={isQuerying || !selectedText || !aiQuery.trim()}
            className={`mt-2 px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
              isQuerying || !selectedText || !aiQuery.trim()
                ? 'bg-gray-400 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 cursor-pointer'
            } text-white`}
          >
            {isQuerying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{isQuerying ? 'प्रोसेसिंग...' : 'प्रश्न पूछें'}</span>
          </button>
          
          {/* Debug info for development */}
          <div className="mt-2 text-xs text-gray-500">
            <p>Selected: {selectedText ? '✅' : '❌'} | Query: {aiQuery.trim() ? '✅' : '❌'} | Processing: {isQuerying ? '⏳' : '✅'}</p>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-auto space-y-4">
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Select text and ask questions to start chatting with AI</p>
              <p className="text-sm font-hindi">टेक्स्ट सेलेक्ट करें और AI से बात करना शुरू करें</p>
            </div>
          ) : (
            chatHistory.map((chat) => (
              <div key={chat.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="mb-2">
                  <p className="font-medium text-gray-800">Q: {chat.query}</p>
                  <p className="text-xs text-gray-500">{chat.timestamp}</p>
                </div>
                <div className="bg-gradient-to-r from-saffron-50 to-emerald-50 p-3 rounded border-l-4 border-saffron-500">
                  <p className="text-gray-700">{chat.response}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadedFile({
        url: response.data.filePath,
        name: file.name,
      });
      
      showToast('success', 'फाइल सफलतापूर्वक अपलोड हुई! / File uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      showToast('error', 'फाइल अपलोड में त्रुटि / File upload error');
    }
    setIsUploading(false);
  };

  const resetApp = () => {
    setUploadedFile(null);
    showToast('info', 'नई फाइल के लिए तैयार / Ready for new file');
  };

  return (
    <div className="min-h-screen bg-mandala">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!uploadedFile ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-elegant font-bold text-gray-800 mb-4">
                Welcome to BookRead AI
              </h2>
              <p className="text-lg text-gray-600 font-hindi">
                आपके पढ़ने के अनुभव को बेहतर बनाने के लिए AI का उपयोग करें
              </p>
              <p className="text-gray-500 mt-2">
                Use AI to enhance your reading experience with intelligent assistance
              </p>
            </div>
            <FileUpload onFileUpload={handleFileUpload} isUploading={isUploading} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 font-elegant">
                Reading: {uploadedFile.name}
              </h2>
              <button
                onClick={resetApp}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
            <PDFViewer pdfUrl={uploadedFile.url} filename={uploadedFile.name} onToast={showToast} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <IndianOrnament className="text-saffron-400" />
            <p className="font-elegant">Made with ❤️ for better reading experience</p>
          </div>
          <p className="text-gray-400 text-sm font-hindi">
            ज्ञान की शक्ति से जीवन को बेहतर बनाएं
          </p>
        </div>
      </footer>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
