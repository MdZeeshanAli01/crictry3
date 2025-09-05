# 🏏 Celestial Cricket Scoring App

A **professional-grade cricket scoring application** built with modern web technologies, featuring comprehensive match management, real-time scoring, and advanced statistics tracking with a stunning cosmic glassmorphic UI.

![Cricket Scoring Interface](./Gemini_Generated_Image_5zzdss5zzdss5zzd.png)

## ✨ Features

### 🎯 **Professional Cricket Scoring**
- **Complete Runs Scoring**: 0-6 runs with boundary animations
- **Comprehensive Extras**: Wide+0-4, No Ball+0-6, Byes+1-4, Leg Byes+1-4
- **Advanced Wicket Handling**: All dismissal types (bowled, LBW, caught, run out, etc.)
- **Target Chase Logic**: Automatic target calculation and match completion detection
- **Undo Functionality**: Mistake correction with full state restoration

### 👥 **Team & Player Management**
- **Full Team Rosters**: Create teams with complete player databases
- **Playing XI Selection**: Choose 11 players from team rosters
- **Firebase Integration**: Cloud-based team and player storage
- **Quick Setup**: Sample data generation for fast testing

### 📊 **Professional Statistics**
- **Real-time Scorecards**: Live batting and bowling statistics
- **Match Summary**: Comprehensive match analysis and awards
- **Player Performance**: Individual statistics tracking (runs, balls, SR, economy)
- **Over-by-over Breakdown**: Detailed ball-by-ball commentary

### 🎮 **Advanced Match Features**
- **Bowler Selection**: Enforces no consecutive overs rule
- **Striker Management**: Mid-innings batsman changes
- **Retired Hurt**: Injury management with return capability
- **Innings Break**: Smooth transition between innings
- **Match Formats**: T5, T10, T20, ODI support

### 🎨 **Modern UI/UX**
- **Cosmic Glassmorphic Design**: Futuristic, immersive interface
- **Responsive Layout**: Works perfectly on desktop and mobile
- **Color-coded Controls**: Intuitive visual organization
- **Smooth Animations**: Enhanced user experience with Framer Motion

## 🚀 Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom glassmorphic design system
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Database**: Firebase Firestore
- **Build Tool**: Vite
- **Package Manager**: npm

## 📦 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account (for cloud features)

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/yourusername/celestial-cricket-scoring.git
cd celestial-cricket-scoring
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up Firebase** (optional but recommended):
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Copy your Firebase config and update `src/config/firebase.ts`
   - See `FIREBASE_SETUP.md` for detailed instructions

4. **Start the development server**:
```bash
npm run dev
```

5. **Open your browser** and navigate to [http://localhost:5173](http://localhost:5173)

## 🎯 Usage Guide

### 1. **Team Setup**
- Create teams using the team management interface
- Add players with names and roles
- Save teams to Firebase for future use
- Load existing teams from the cloud database

### 2. **Match Setup**
- Select two teams for the match
- Choose playing XI (11 players) from each team roster
- Set match format (T5, T10, T20, ODI) or custom overs
- Conduct toss and select batting/bowling decision

### 3. **Live Scoring**
- Use the professional scoring interface for real-time match tracking
- Score runs (0-6) with automatic strike rotation
- Handle all types of extras with comprehensive options
- Manage wickets with detailed dismissal types
- Switch bowlers with automatic over completion

### 4. **Advanced Features**
- Change striker mid-innings using the striker modal
- Handle retired hurt players with return capability
- View comprehensive match statistics in the scorecard modal
- Use undo functionality to correct scoring mistakes

## 📁 Project Structure

```
src/
├── components/
│   ├── ProfessionalScoringInterfaceV3.tsx  # Main scoring interface
│   ├── TeamSetup.tsx                       # Team management
│   ├── GlassCard.tsx                       # Reusable UI component
│   └── ui/                                 # UI components
├── types/
│   └── cricket.ts                          # TypeScript interfaces
├── config/
│   └── firebase.ts                         # Firebase configuration
├── services/
│   └── databaseService.ts                  # Database operations
└── styles/
    └── globals.css                         # Global styles
```

## 🔧 Development

### Build for Production
```bash
npm run build
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## 🌟 Key Components

### **ProfessionalScoringInterfaceV3**
The main scoring interface featuring:
- Real-time match scoring
- Professional batting and bowling scorecards
- Advanced modals for striker, bowler, and wicket management
- Comprehensive extras handling
- Target chase and match completion logic

### **TeamSetup**
Complete team management system:
- Team creation and editing
- Player roster management
- Playing XI selection
- Firebase integration for cloud storage

### **GlassCard**
Reusable glassmorphic UI component providing the signature cosmic design aesthetic throughout the application.

## 🎨 Design System

The application features a **cosmic glassmorphic design** with:
- **Glass morphism effects** with backdrop blur and transparency
- **Gradient backgrounds** with cosmic color schemes
- **Color-coded interfaces**: Green (batting), Purple (bowling), Red (wickets), Yellow/Orange/Blue (extras)
- **Responsive design** optimized for all screen sizes
- **Smooth animations** for enhanced user experience

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Professional Cricket Apps**: Inspired by Cricbuzz, Cricheroes, and other professional cricket scoring applications
- **Modern Web Technologies**: Built with the latest React, TypeScript, and Tailwind CSS
- **Cosmic Design**: Features a unique futuristic glassmorphic design theme
- **Firebase**: Powered by Google Firebase for reliable cloud storage

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for Firebase configuration help
2. Review the [FUNCTIONALITY_TEST_REPORT.md](FUNCTIONALITY_TEST_REPORT.md) for feature testing
3. Open an issue on GitHub with detailed information
- **Live Badge**: Animated shine effect for active matches
- **Score Display**: Tabular numbers with gradient text
- **Recent Balls**: Color-coded ball indicators with animations
- **Cosmic Atmosphere**: Stadium lighting effects and shadows

---

**Experience the future of cricket scoring with Celestial Cricket! 🏏✨**
