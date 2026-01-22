# Knowledge Base Chatbot

A full-stack Knowledge Base Management System with RAG (Retrieval-Augmented Generation) capabilities, featuring document upload, intelligent chunking, vector search with FAISS, and AI-powered querying.

## Use Case

**For Administrators:**
Manage your organization's knowledge base by uploading documents (PDFs, DOCX, text files), organizing them with tags, and building a searchable repository. Control user access and manage the document library.

**For Users:**
Query the knowledge base using natural language questions. Get AI-powered answers backed by relevant document excerpts without needing to search through files manually.

## Features

- **Document Management**: Upload and manage PDF, DOCX, TXT, and HTML documents
- **Vector Search**: FAISS-powered semantic search with HuggingFace embeddings
- **AI-Powered Chat**: Query your knowledge base with context-aware responses
- **User Authentication**: JWT-based auth with role-based access control
- **Modern UI**: React-based responsive interface with drag-and-drop uploads
- **Video Management**: Support for video content organization

## Tech Stack

**Backend:**
- Node.js + Express
- Prisma ORM with SQLite
- FAISS for vector search
- HuggingFace Transformers for embeddings
- OpenAI API for response generation
- JWT authentication

**Frontend:**
- React 19
- Zustand for state management
- Tailwind CSS for styling
- Axios for API calls

## Prerequisites

- Node.js 16+ and npm
- OpenAI API key (for AI responses)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/kb-chatbot.git
cd kb-chatbot
```

### 2. Install dependencies

```bash
npm run setup
```

This will install dependencies for both backend and frontend.

### 3. Configure environment variables

**Backend configuration:**

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and configure:

```env
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_secret_jwt_key_here_change_in_production
DATABASE_URL=file:./dev.db
```

**Required variables:**
- `OPENAI_API_KEY`: Get from https://platform.openai.com/api-keys
- `JWT_SECRET`: Any random string for securing authentication
- `DATABASE_URL`: SQLite database file path (default: `file:./dev.db`)

**Optional:**
- `OPENAI_BASE_URL`: Set only if using a proxy/LiteLLM (leave unset for direct OpenAI)

**Frontend configuration:**

```bash
cd client
cp .env.example .env
```

The default configuration should work, but you can modify the API URL if needed.

### 4. Initialize the database

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

This creates the database and seeds it with a default admin user:
- Email: `admin@example.com`
- Password: `admin123`

### 5. Start the application

From the root directory:

```bash
npm start
```

This will start both backend and frontend simultaneously using concurrently.

Alternatively, start them separately:

```bash
cd backend && npm run dev
cd client && npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

## Screenshots

### Login Page


### Admin Dashboard - Document Management


### User Interface - Query Chat


### Document Upload


## Configuration

### Backend Environment Variables

Create `backend/.env` from `backend/.env.example`:

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key for AI responses | Yes |
| `JWT_SECRET` | Secret key for JWT token signing | Yes |
| `DATABASE_URL` | SQLite database file path | Yes |
| `PORT` | Backend server port (default: 5001) | No |
| `FRONTEND_URL` | Frontend URL for CORS (default: http://localhost:3000) | No |
| `OPENAI_BASE_URL` | Custom OpenAI base URL if using proxy | No |

### Frontend Environment Variables

Create `client/.env` from `client/.env.example`:

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend API URL (default: http://localhost:5001) | No |

## Project Structure

```
kb-chatbot/
├── backend/              # Express backend
│   ├── prisma/          # Database schema and migrations
│   ├── src/
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/  # Auth and other middleware
│   │   ├── models/      # Data models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic (FAISS, OpenAI, etc.)
│   │   └── server.js    # Entry point
│   ├── data/            # FAISS index and document storage
│   ├── uploads/         # Uploaded documents
│   └── videos/          # Video files
├── client/              # React frontend
│   ├── public/
│   └── src/
│       ├── components/  # React components
│       ├── services/    # API client
│       └── store/       # State management
└── package.json         # Root package.json for setup commands
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user

### Knowledge Base
- `GET /kb/documents` - List all documents
- `GET /kb/documents/:id` - Get specific document
- `POST /kb/documents` - Upload new document
- `PUT /kb/documents/:id` - Update document
- `DELETE /kb/documents/:id` - Delete document
- `POST /kb/query` - Query the knowledge base
- `GET /kb/videos` - List available videos

### Users (Admin only)
- `GET /users` - List all users
- `POST /users` - Create new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## Usage

### Uploading Documents

1. Login with your credentials
2. Navigate to the Documents section
3. Click "Upload Document"
4. Drag and drop or select a file (PDF, DOCX, TXT, HTML)
5. Add a title and optional tags
6. Click "Upload"

The system will automatically:
- Extract text from the document
- Split it into chunks with overlap
- Generate embeddings using HuggingFace models
- Index the vectors in FAISS for fast retrieval

### Querying the Knowledge Base

1. Go to the Chat interface
2. Type your question
3. The system will:
   - Convert your query to a vector
   - Search FAISS for similar document chunks
   - Generate a context-aware response using OpenAI
4. View the response along with source documents

## Development

### Running in Development Mode

Backend with auto-reload:
```bash
cd backend
npm run dev
```

Frontend with hot-reload:
```bash
cd client
npm start
```

### Database Management

View database in Prisma Studio:
```bash
cd backend
npx prisma studio
```

Create a new migration:
```bash
cd backend
npx prisma migrate dev --name your_migration_name
```

Reset database:
```bash
cd backend
npx prisma migrate reset
```

## Deployment

### Backend Deployment

1. Set production environment variables
2. Build and run:

```bash
cd backend
npm install --production
npx prisma migrate deploy
npm start
```

### Frontend Deployment

1. Set production API URL in `.env`
2. Build:

```bash
cd client
npm run build
```

3. Serve the `build` folder using a static server or deploy to platforms like Vercel, Netlify, etc.

## Troubleshooting

### FAISS Index Issues

If you encounter FAISS index errors, rebuild the index:

```bash
cd backend
node scripts/rebuild-faiss.js
```

### Database Issues

Reset the database and reseed:

```bash
cd backend
npx prisma migrate reset
npx prisma db seed
```

### Port Already in Use

Change the port in `backend/.env`:

```env
PORT=5002
```

And update the frontend `.env`:

```env
REACT_APP_API_URL=http://localhost:5002
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

Note: This project uses various third-party libraries and dependencies, each with their own licenses. Please review the individual package licenses before use in production.

## Support

For issues and questions, please open an issue on GitHub.