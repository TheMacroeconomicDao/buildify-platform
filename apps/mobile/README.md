# 📱 Buildify Mobile App

React Native application for Buildify marketplace platform (iOS & Android).

## 📋 Overview

Cross-platform mobile application providing full marketplace functionality:
- Order creation and management
- Real-time notifications
- Subscription management
- Wallet and payment system
- AI design generation
- In-app messaging
- Profile and portfolio management

## 🚀 Tech Stack

- **Framework**: React Native 0.75.3
- **State Management**: Redux + Redux Persist
- **Navigation**: React Navigation 6
- **API**: Axios + Custom API Client
- **Real-time**: Pusher.js + Laravel Echo
- **i18n**: i18next (7 languages)
- **Push**: Firebase Cloud Messaging
- **Maps**: React Native Maps
- **Payments**: Stripe Checkout (WebView)

## 📊 Statistics

- **Screens**: 47+
- **Components**: 60+
- **Custom Hooks**: 37+
- **Redux Slices**: 8+
- **Languages**: 7 (EN, RU, AR, ES, FR, DE, IT)

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Xcode (for iOS)
- Android Studio (for Android)

### Setup

```bash
# Navigate to mobile directory
cd apps/mobile

# Install dependencies
npm install

# iOS only
cd ios && pod install && cd ..

# Environment setup
cp env.local .env

# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## 🔧 Development

```bash
# Run tests
npm test

# Lint code
npm run lint

# TypeScript check
npm run tsc

# Build for production
npm run build        # Android
npm run build-ios    # iOS
```

## 📦 Build & Deploy

### iOS

```bash
# Build for TestFlight
npm run build-ios
# Upload via Xcode or fastlane
```

### Android

```bash
# Build release APK
npm run build
# Upload to Google Play Console
```

## 📚 Documentation

- [Mobile Architecture](../../docs/MOBILE_ANALYSIS.md)
- [Component Library](../../docs/mobile/COMPONENTS.md)
- [State Management](../../docs/mobile/STATE_MANAGEMENT.md)

## 📞 Support

For issues and questions, please open an issue in the main repository.
