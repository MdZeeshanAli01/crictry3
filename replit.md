# Celestial Cricket Scoring App - Replit Setup

## Project Overview
A professional-grade cricket scoring application built with React, TypeScript, and Firebase. Features comprehensive match management, real-time scoring, and advanced statistics tracking with a cosmic glassmorphic UI.

## Recent Changes (September 6, 2025)
- ✅ **Environment Setup**: Configured for Replit environment
- ✅ **Vite Configuration**: Updated to use host 0.0.0.0 and port 5000
- ✅ **Development Workflow**: Set up npm run dev workflow
- ✅ **Deployment Configuration**: Configured for autoscale deployment
- ✅ **Dependencies**: All npm packages installed successfully
- ✅ **Mobile Optimization**: Complete mobile-first responsive design implemented
- ✅ **Touch-Friendly UI**: All buttons optimized with minimum 44-48px touch targets
- ✅ **Scoring Interface**: Mobile-optimized scoring with proper layout order
- ✅ **Team Setup**: Mobile-responsive team and player management
- ✅ **Navigation**: Optimized app navigation with mobile-friendly progress indicators

## Project Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with glassmorphic design
- **UI Components**: Radix UI, Lucide React icons
- **Animations**: Framer Motion
- **Port**: 5000 (configured for Replit)

### Backend/Database
- **Database**: Firebase Firestore (with localStorage fallback)
- **Configuration**: Pre-configured Firebase project in src/config/firebase.ts
- **Service**: REST API approach for database operations

### Key Features
- Professional cricket scoring interface
- Team and player management
- Real-time match statistics
- Multiple match formats (T5, T10, T20, ODI)
- Cosmic glassmorphic UI design
- **Mobile-First Design**: Optimized for mobile-only usage with responsive layouts
- **Touch-Friendly Interface**: Large buttons and intuitive mobile navigation
- **Responsive Grids**: Adaptive layouts that work seamlessly on all screen sizes

## Development Commands
- `npm run dev` - Start development server (configured for port 5000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment
- **Type**: Autoscale (stateless frontend)
- **Build Command**: npm run build
- **Run Command**: npm run preview
- **Domain**: Available via REPLIT_DEV_DOMAIN

## File Structure
```
src/
├── components/          # React components
├── config/             # Firebase configuration
├── constants/          # Cricket game constants
├── hooks/              # Custom React hooks
├── lib/                # Utilities
├── pages/              # Main app pages
├── services/           # Database services
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

## User Preferences
- Modern, professional cricket scoring application
- Glassmorphic UI with cosmic theme
- Firebase integration for cloud storage
- **Mobile-Only Usage**: Application optimized specifically for mobile devices
- **Touch-First Interface**: Large buttons and mobile-friendly interactions
- **Responsive Design**: Mobile-first approach with progressive enhancement

## Notes
- Firebase configuration is already set up with working credentials
- Application includes sample data for quick testing
- Falls back to localStorage if Firebase is unavailable
- Fully functional professional cricket scoring system