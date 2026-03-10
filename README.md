# 🔬 Aura Research Assistant

An AI-powered research assistant platform built with Next.js, featuring comprehensive research tools, citation management, and admin dashboard.

## ✨ Features

### 🎯 Research Tools
- **AI Research Assistant** - Powered by Google Gemini AI
- **Paper Analysis** - Analyze and summarize research papers
- **Literature Synthesis** - Combine insights from multiple sources
- **Research Question Generator** - AI-generated research questions
- **Abstract Generator** - Create professional abstracts
- **Citation Manager** - Organize citations in multiple formats (APA, MLA, Chicago, Harvard, IEEE, Vancouver)
- **AI Writing Assistant** - Academic writing support
- **Text Refiner** - Polish and improve your writing
- **Grant Wizard** - Grant proposal assistance

### 📚 Academic Integration
- **Semantic Scholar API** - Search millions of academic papers
- **Multiple Export Formats** - PDF, DOCX, LaTeX, BibTeX, RIS, EndNote
- **Citation Formats** - Support for all major citation styles

### 👥 User Management
- **Authentication** - Email/password and Google OAuth
- **User Profiles** - Customizable profiles with image upload
- **Admin Dashboard** - Complete user management system

### 🔐 Admin Features
- View all users and their details
- User activity tracking
- Password management
- Role management (User/Admin)
- User suspension and banning
- Account deletion
- Login history and statistics

## 🚀 Tech Stack

- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB Atlas
- **Authentication**: NextAuth.js + Google OAuth
- **AI**: Google Gemini API
- **Deployment**: Vercel
- **UI Components**: Framer Motion, React Quill, Iconsax React

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- Google Cloud Console project (for OAuth)
- Google AI Studio API keys

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rahul-dev-crypto/aura-research-assistant.git
   cd aura-research-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # MongoDB
   MONGODB_URI=your_mongodb_connection_string
   
   # Google Gemini AI (comma-separated for rotation)
   GEMINI_API_KEYS=key1,key2,key3
   
   # Google OAuth
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Semantic Scholar (optional)
   SEMANTIC_SCHOLAR_API_KEYS=your_keys
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000`

## 🔧 Configuration

### MongoDB Setup
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Add it to `.env.local`

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins and redirect URIs
6. Add credentials to `.env.local`

### Google Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Generate API keys
3. Add multiple keys for higher rate limits

## 📝 Usage

### Creating Admin Account
Visit `/api/auth/create-admin` to create the first admin account.

Default credentials:
- Username: `admin`
- Password: `admin123`

**⚠️ Change the password immediately after first login!**

### User Registration
Users can register with:
- Email and password
- Google OAuth

### Admin Dashboard
Access at `/admin` (admin login required)

Features:
- View all users
- Manage user accounts
- Track user activity
- Suspend/ban users
- Change user roles

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. **Import to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy

3. **Configure OAuth**
   - Update Google OAuth redirect URIs with your Vercel URL
   - Add: `https://your-app.vercel.app/api/auth/google`

## 📊 Project Structure

```
aura-research-assistant/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── admin/             # Admin dashboard
│   │   ├── dashboard/         # User dashboard
│   │   └── ...
│   ├── components/            # React components
│   │   ├── layout/           # Layout components
│   │   └── ui/               # UI components
│   ├── lib/                   # Utility functions
│   └── models/                # Database models
├── public/                    # Static assets
├── .env.local                 # Environment variables (not in repo)
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript configuration
```

## 🔐 Security

- Passwords are hashed using bcrypt
- Environment variables are never committed
- Admin passwords are encrypted for viewing
- Suspended/banned users cannot login
- HTTPS enforced in production

## 📄 License

This project is private and proprietary.

## 👨‍💻 Author

**Rahul De**
- GitHub: [@Rahul-dev-crypto](https://github.com/Rahul-dev-crypto)

## 🙏 Acknowledgments

- Google Gemini AI for research assistance
- Semantic Scholar for academic paper search
- MongoDB Atlas for database hosting
- Vercel for deployment platform

---

**Built with ❤️ for researchers and academics**
