# 🚀 Quick Start Guide

## Prerequisites
1. Install Node.js 16+ from https://nodejs.org/
2. Get an OpenAI API key from https://platform.openai.com/

## Setup Steps

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Configure Environment

Create `backend/.env`:
```env
OPENAI_API_KEY=your-api-key-here
PORT=3001
```

### 3. Start the Application

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### 4. Access the Application

Open http://localhost:3000 in your browser

## First Steps

1. **Upload a Document**: Go to Upload tab → Add title → Select file → Upload
2. **Query Knowledge Base**: Go to Query tab → Ask a question → Get AI response
3. **View Documents**: Go to Documents tab → See all uploaded files

## Supported File Types

- PDF documents
- Microsoft Word (.docx)
- Plain text (.txt)
- HTML files

## Need Help?

Check the full README.md for detailed documentation and troubleshooting.