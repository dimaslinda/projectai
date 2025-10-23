# ProjectAI - Intelligent Chat Application

![Laravel](https://img.shields.io/badge/Laravel-12.x-red.svg)
![React](https://img.shields.io/badge/React-19.x-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Inertia.js](https://img.shields.io/badge/Inertia.js-2.x-purple.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-teal.svg)

ProjectAI adalah aplikasi chat cerdas yang mengintegrasikan AI (Google Gemini) dengan sistem persona untuk berbagai divisi dan kebutuhan bisnis. Aplikasi ini dibangun dengan Laravel sebagai backend dan React dengan TypeScript sebagai frontend, menggunakan Inertia.js untuk seamless SPA experience.

## ✨ Fitur Utama

### 🤖 AI Chat System
- **Single AI Provider**: Seluruh sistem menggunakan Google Gemini
- **Persona-Based Chat**: AI yang disesuaikan dengan role dan divisi tertentu
- **Global AI Assistant**: AI umum untuk berbagai topik
- **Chat History**: Riwayat percakapan dengan context awareness
- **Real-time Responses**: Streaming response untuk pengalaman yang responsif
- **🎨 AI Image Generation**: Pembuatan gambar dengan Gemini 2.5 Flash Image
- **✏️ AI Image Editing**: Pengeditan gambar langsung dengan instruksi natural language

### 👥 Persona System
- **Engineer**: Spesialis teknik dan engineering
- **Drafter**: Ahli drafting dan dokumentasi teknis  
- **ESR**: Environmental & Safety Representative
- **Extensible**: Mudah menambah persona baru sesuai kebutuhan

### 🔐 Authentication & Authorization
- **Multi-Role System**: User, Admin, Superadmin
- **Secure Authentication**: Laravel Sanctum integration
- **Role-Based Access**: Akses fitur berdasarkan role pengguna

### 📱 Modern UI/UX
- **Responsive Design**: Optimal di desktop dan mobile
- **Dark/Light Mode**: Theme switching
- **Modern Components**: Radix UI + TailwindCSS
- **Smooth Animations**: Framer Motion integration
- **Accessible**: WCAG compliant components

### 🛠️ User Management
- **CRUD Operations**: Create, Read, Update, Delete users
- **Role Assignment**: Assign roles dan permissions
- **Profile Management**: User profile dan settings

## 🚀 Tech Stack

### Backend
- **Laravel 12.x** - PHP Framework
- **PHP 8.2+** - Programming Language
- **MySQL/PostgreSQL** - Database
- **Laravel Sanctum** - API Authentication
- **Inertia.js** - Server-side rendering

### Frontend
- **React 19.x** - UI Library
- **TypeScript 5.x** - Type Safety
- **Inertia.js 2.x** - SPA Framework
- **TailwindCSS 4.x** - Styling
- **Radix UI** - Accessible Components
- **Lucide React** - Icons
- **Vite 7.x** - Build Tool

### AI Integration
- **Google Gemini API** - Satu-satunya AI Provider
- **Gemini 2.5 Flash Image** - AI image generation dan editing
- **Custom AI Service** - Abstraction layer dengan multi-modal support

## 📋 Prerequisites

Pastikan sistem Anda memiliki:

- **PHP 8.2** atau lebih tinggi
- **Composer** - PHP dependency manager
- **Node.js 18+** dan **npm** - JavaScript runtime dan package manager
- **MySQL 8.0+** atau **PostgreSQL 13+** - Database
- **Git** - Version control

## 🛠️ Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-username/projectai.git
cd projectai
```

### 2. Install PHP Dependencies

```bash
composer install
```

### 3. Install JavaScript Dependencies

```bash
npm install
```

### 4. Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### 5. Database Setup

```bash
# Configure database in .env file
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=projectai
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Run migrations
php artisan migrate

# Seed database (optional)
php artisan db:seed
```

### 6. AI Configuration

Lihat **[AI Integration Guide](AI_INTEGRATION_GUIDE.md)** untuk konfigurasi lengkap AI dengan Gemini.

**Quick Setup:**
```bash
# Tambahkan ke .env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_IMAGE_MODEL=gemini-2.5-flash

# Optional: Fallback configuration
AI_FALLBACK_ENABLED=true

# Image Generation Settings
IMAGE_GENERATION_ENABLED=true
MAX_IMAGE_SIZE=2048
```

### 7. Build Assets

```bash
# Development
npm run dev

# Production
npm run build
```

### 8. Start Development Server

```bash
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Vite dev server (jika development)
npm run dev
```

Aplikasi akan tersedia di `http://localhost:8000`

## 🆕 Recent Updates (v1.1.0)

### ✨ New Features
- **🎨 AI Image Generation**: Fitur pembuatan gambar dengan Gemini 2.5 Flash Image
- **✏️ AI Image Editing**: Kemampuan edit gambar langsung dengan instruksi natural language
- **🔧 Enhanced AI Service**: Improved multi-modal AI capabilities
- **📊 Token Usage Tracking**: Monitoring penggunaan token AI untuk analytics

### 🐛 Bug Fixes
- **Fixed "This model only supports text output" error**: Perbaikan penggunaan model yang tepat untuk image editing
- **Improved error handling**: Better error messages dan graceful degradation
- **Test suite fixes**: Semua test files sekarang berjalan dengan benar

### 🚀 Performance Improvements
- **Optimized AI responses**: Faster response time untuk image generation
- **Better caching**: Improved caching strategy untuk AI responses
- **Enhanced UI/UX**: Smoother user experience untuk fitur image

## 📚 Documentation

### 📖 Panduan Lengkap
- **[AI Integration Guide](AI_INTEGRATION_GUIDE.md)** - Panduan lengkap integrasi AI (Gemini)
- **[API Documentation](#)** - REST API endpoints (coming soon)
- **[Deployment Guide](#)** - Production deployment (coming soon)

### 🔧 Development Guides
- **[Contributing Guidelines](#)** - Panduan kontribusi (coming soon)
- **[Code Style Guide](#)** - Standar coding (coming soon)
- **[Testing Guide](#)** - Unit dan feature testing (coming soon)

## 🎯 Available Scripts

### PHP/Laravel Scripts

```bash
# Start development server
php artisan serve

# Run migrations
php artisan migrate

# Seed database
php artisan db:seed

# Clear caches
php artisan cache:clear
php artisan config:clear
php artisan view:clear

# Run tests
php artisan test
```

### JavaScript/Node Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Build with SSR
npm run build:ssr

# Code formatting
npm run format
npm run format:check

# Linting
npm run lint

# Type checking
npm run types
```

## 🌟 Key Features Detail

### AI Chat System
- **Context-Aware**: AI memahami konteks percakapan sebelumnya
- **Persona-Specific**: Setiap persona memiliki keahlian dan gaya komunikasi yang berbeda
- **Multi-Modal Support**: Text, image generation, dan image editing dalam satu platform
- **Image Generation**: Buat gambar dari deskripsi text dengan Gemini 2.5 Flash Image
- **Image Editing**: Edit gambar existing dengan instruksi natural language
- **Fallback Mode**: Sistem tetap berfungsi meski tanpa API key
- **Error Handling**: Robust error handling dengan graceful degradation

### Persona System
Sistem persona memungkinkan AI untuk berperan sebagai:

- **👷 Engineer**: Analisis struktural, perhitungan teknis, spesifikasi material
- **📐 Drafter**: Gambar teknik, dokumentasi, standar drafting
- **🛡️ ESR**: Keselamatan kerja, regulasi lingkungan, risk assessment

### User Management
- **Role-based Access Control**: Superadmin, Admin, User
- **Profile Management**: Update profile, change password
- **User CRUD**: Complete user management system

## 🔒 Security Features

- **CSRF Protection**: Laravel built-in CSRF protection
- **XSS Prevention**: Input sanitization dan output escaping
- **SQL Injection Prevention**: Eloquent ORM protection
- **Rate Limiting**: API rate limiting
- **Secure Headers**: Security headers configuration

## 🚀 Performance Optimizations

- **Code Splitting**: Automatic code splitting dengan Vite
- **Lazy Loading**: Component lazy loading
- **Image Optimization**: SVG icons untuk performa optimal
- **Caching**: Laravel caching untuk database queries
- **Asset Optimization**: Minification dan compression

## 🧪 Testing

### Test Suite
- **Feature Tests**: Comprehensive testing untuk semua fitur utama
- **Unit Tests**: Testing untuk komponen individual
- **API Tests**: Testing untuk semua endpoint API
- **Image Processing Tests**: Testing untuk fitur AI image generation dan editing
- **Authentication Tests**: Testing untuk sistem auth dan authorization

### Running Tests

```bash
# Run all PHP tests
php artisan test

# Run with coverage
php artisan test --coverage

# Run specific test
php artisan test --filter=UserTest

# Run feature tests only
php artisan test tests/Feature/

# Run specific feature test
php tests/Feature/ImageEditingTest.php
```

### Recent Test Improvements
- ✅ **Fixed autoload paths**: Semua test files sekarang menggunakan path yang benar
- ✅ **Fixed bootstrap paths**: Laravel bootstrap loading diperbaiki untuk semua tests
- ✅ **CI/CD Ready**: Tests siap untuk GitHub Actions dan environment CI/CD

## 📦 Deployment

### Production Build

```bash
# Build assets
npm run build

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set production environment
APP_ENV=production
APP_DEBUG=false
```

### Environment Variables

Pastikan konfigurasi production di `.env`:

```bash
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Database production
DB_CONNECTION=mysql
DB_HOST=your_production_host
DB_DATABASE=your_production_db

# AI Configuration
AI_PROVIDER=gemini
GEMINI_API_KEY=your_production_gemini_key
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

Jika Anda mengalami masalah atau memiliki pertanyaan:

1. **Check Documentation**: Baca [AI Integration Guide](AI_INTEGRATION_GUIDE.md)
2. **Search Issues**: Cari di GitHub Issues
3. **Create Issue**: Buat issue baru dengan detail lengkap
4. **Contact**: Email ke support@yourcompany.com

## 🙏 Acknowledgments

- **Laravel Team** - Amazing PHP framework
- **React Team** - Powerful UI library  
- **Inertia.js** - Seamless SPA experience
- **TailwindCSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Google Gemini** - Advanced AI capabilities

---

**Made with ❤️ by Your Development Team**

> 💡 **Tip**: Mulai dengan membaca [AI Integration Guide](AI_INTEGRATION_GUIDE.md) untuk setup AI yang optimal!