# JackPass - Academic Question Bank Platform

A Next.js 15 application for searching, viewing, and solving past academic questions from Nigerian universities and institutions.

## 🚀 Features

- **Question Search**: Filter questions by institution, course, year, semester, and type
- **User Authentication**: Secure login/signup system with Firebase Auth
- **Question Management**: Upload, approve, and manage academic questions
- **Responsive Design**: Modern UI built with Tailwind CSS and shadcn/ui components
- **AI Integration**: Genkit AI for question processing and metadata extraction

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Firebase (Firestore, Auth, Storage)
- **AI**: Genkit AI with Google AI integration
- **State Management**: React Context API

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore, Auth, and Storage enabled
- Google AI API key (for Genkit features)

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory with your Firebase credentials:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id-here
FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key content here\n-----END PRIVATE KEY-----"

# Next.js Public Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id-here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id-here
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id-here

# Genkit AI Configuration
GOOGLE_AI_API_KEY=your-google-ai-api-key-here
```

### 3. Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:9002`

### 4. Build for Production
```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
│   └── ui/             # shadcn/ui components
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and configurations
├── ai/                  # AI/Genkit integration
└── types/               # TypeScript type definitions
```

## 🔍 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit AI with file watching

## 🚨 Important Notes

- **Firebase Admin**: Server-side Firebase Admin SDK is used for admin operations
- **Client Firebase**: Client-side Firebase SDK is used for user operations
- **Environment Variables**: All Firebase credentials must be properly configured
- **TypeScript**: Strict mode is enabled for better code quality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
