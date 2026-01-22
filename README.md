# DocVault AI - Internal Knowledge Base System

Transform your company's SOPs, policies, manuals, and internal documentation into an intelligent, searchable knowledge base. Built with RAG technology to provide instant, accurate answers from your organization's documents.

## Perfect For

**Internal Documentation & SOPs:**
Centralize your company's Standard Operating Procedures, HR policies, compliance documents, training materials, and process manuals. Enable employees to get instant answers without digging through folders.

**Employee Self-Service:**
Employees can query policies, procedures, and guidelines using natural language. Get accurate answers with source references, reducing support tickets and time spent searching.

**Onboarding & Training:**
New hires can quickly find answers about company policies, procedures, and guidelines. Reduce onboarding time and improve knowledge retention.

**Compliance & Audit:**
Maintain version-controlled documentation with clear audit trails. Ensure employees always access the most current policies and procedures.

## Features

- **SOP & Policy Management**: Upload company SOPs, policies, manuals in PDF, DOCX, TXT, HTML
- **Semantic Search**: Find information even with different wording using FAISS vector search
- **Natural Language Q&A**: Ask questions in plain English, get accurate answers with sources
- **Role-Based Access**: Admin manages documents, employees query safely
- **Drag & Drop Upload**: Easy document management with modern interface
- **Source Citations**: Every answer includes relevant document excerpts for verification
- **Video & Media Support**: Organize training videos and multimedia content

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
<img width="1895" height="916" alt="image" src="https://github.com/user-attachments/assets/89e27ebf-0449-482c-9a44-4dabf68808f3" />

## Admin Side:

### Admin Dashboard - Document Management
<img width="1321" height="857" alt="image" src="https://github.com/user-attachments/assets/05e23c49-2c8a-41a9-b3ed-2f0fff88c53b" />

### Document Upload
<img width="1292" height="721" alt="image" src="https://github.com/user-attachments/assets/50ee44ec-7c7a-46cd-b60b-e902c7cc0a82" />

### Videos Upload - To be referenced with similar queries 
<img width="1268" height="845" alt="image" src="https://github.com/user-attachments/assets/e8d9736f-d3c5-4aa5-a317-0b039a27eb7d" />

### User Management
<img width="1256" height="739" alt="image" src="https://github.com/user-attachments/assets/b4865f22-a717-4a84-af05-9ea4041f78b1" />


## User Side
### User Interface - Query Chat
<img width="1269" height="805" alt="image" src="https://github.com/user-attachments/assets/d336085c-22bf-4682-8a0e-9f12855b6ca9" />




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