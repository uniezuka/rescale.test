# AI Image Gallery - Developer Challenge

A modern web application that allows users to upload images, get automatic AI-generated tags and descriptions, and search through their images using text or find similar images.

## 🎯 Project Overview

This project demonstrates a full-stack web application built with React, Supabase, and Azure Computer Vision API. Users can upload images, get AI-powered analysis including tags, descriptions, and color extraction, and search through their collection using various methods.

## ✨ Key Features

### ✅ **Currently Implemented (Phase 1 & 2)**
- **🔐 Authentication**: Secure user authentication with Supabase Auth
- **📸 Image Upload**: Drag & drop upload with thumbnail generation
- **🖼️ Image Gallery**: Responsive grid layout with pagination and lazy loading
- **📱 Responsive Design**: Mobile-first design that works on all devices
- **🎨 Modern UI**: Clean, intuitive interface with comprehensive error handling
- **⚡ Performance**: Optimized image loading, compression, and caching

### 🚧 **Coming Soon (Phase 3-5)**
- **🤖 AI Analysis**: Automatic tag generation, descriptions, and color extraction
- **🔍 Smart Search**: Text search, color filtering, and similar image finding
- **⚡ Real-time Updates**: Live processing status and notifications
- **🌙 Dark Mode**: System preference detection and manual toggle

## 🛠️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Dropzone** for file uploads
- **Browser Image Compression** for optimization

### Backend
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security (RLS)
- **Supabase Storage** for image storage
- **FastAPI (Python)** for API endpoints (Phase 3)
- **Celery with Redis** for background processing (Phase 3)

### AI Services (Phase 3)
- **Azure Computer Vision API** for image analysis
- Automatic tag generation (5-10 tags per image)
- Description generation
- Color extraction (top 3 dominant colors)

### Development Tools
- **Frontend**: ESLint, Prettier, Jest, React Testing Library
- **Backend**: Black, isort, flake8, pytest (Phase 3)
- **Git** for version control

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Azure Computer Vision API key (for Phase 3)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-image-gallery
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your API keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_AZURE_CV_ENDPOINT=your_azure_endpoint
   VITE_AZURE_CV_KEY=your_azure_key
   ```

4. **Set up Supabase database**
   ```sql
   -- Run the SQL scripts from database-schema.sql
   -- This will create all necessary tables and RLS policies
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
ai-image-gallery/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ImageUpload.tsx  # Drag & drop upload component
│   │   ├── ImageGallery.tsx # Responsive image grid
│   │   ├── ImageModal.tsx   # Full-screen image viewer
│   │   ├── ImageCard.tsx    # Individual image display
│   │   ├── Button.tsx       # Reusable button component
│   │   ├── Input.tsx        # Form input component
│   │   ├── LoadingSpinner.tsx # Loading states
│   │   ├── Header.tsx       # Navigation header
│   │   ├── UserMenu.tsx     # User dropdown menu
│   │   ├── ProtectedRoute.tsx # Route guards
│   │   └── ToastContainer.tsx # Toast notifications
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts       # Authentication hook
│   │   ├── useImageGallery.ts # Image management hook
│   │   └── useErrorHandler.ts # Error handling hook
│   ├── services/            # API and external service integrations
│   │   ├── supabase.ts      # Supabase client configuration
│   │   └── imageService.ts  # Image upload and management
│   ├── types/               # TypeScript type definitions
│   │   ├── image.ts         # Image-related types
│   │   └── index.ts         # Common types
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx  # Authentication state
│   │   └── ToastContext.tsx # Toast notifications
│   ├── pages/               # Page components
│   │   ├── DashboardPage.tsx # Main dashboard
│   │   ├── LoginPage.tsx    # Login form
│   │   └── SignupPage.tsx   # Registration form
│   └── utils/               # Utility functions
├── database-schema.sql      # Database setup script
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- **images**: Stores image metadata and file paths
- **Storage buckets**: `images` and `thumbnails` for file storage
- **Row Level Security (RLS)**: Ensures data isolation between users
- **Triggers**: Automatic cleanup of orphaned files

All tables use Row Level Security (RLS) to ensure data isolation between users.

## 🎨 UI Components

### Core Components
- **ImageUpload**: Drag & drop upload area with progress tracking
- **ImageGallery**: Responsive grid layout for images
- **ImageCard**: Individual image display with metadata
- **ImageModal**: Detailed view with full metadata and download
- **Button**: Reusable button component with variants
- **Input**: Form input component with validation
- **LoadingSpinner**: Loading states throughout the app

### Layout Components
- **Header**: Navigation and user menu
- **ProtectedRoute**: Route guards for authentication
- **ToastContainer**: Toast notifications system

## 🔍 Current Features

### Image Management
- **Upload Interface**: Drag & drop with progress tracking and validation
- **File Validation**: Type and size validation (10MB limit, JPEG/PNG/GIF/WebP support)
- **Thumbnail Generation**: Automatic client-side generation and optimization
- **Image Gallery**: Responsive grid with lazy loading and pagination
- **Image Modal**: Full-screen viewer with metadata and download
- **Delete Functionality**: Image deletion with confirmation

### User Experience
- **Authentication**: Secure login/signup with Supabase Auth
- **Responsive Design**: Mobile-first approach that works on all devices
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Visual feedback for all async operations
- **Toast Notifications**: Success and error notifications

### Performance
- **Image Compression**: Client-side compression for optimal file sizes
- **Lazy Loading**: Images load as they come into view
- **Efficient Pagination**: Load more functionality for large collections
- **Optimized Queries**: Efficient database queries with proper indexing

## 🔌 API Endpoints

### Image Management
- `POST /api/images/upload` - Upload single image
- `POST /api/images/upload-multiple` - Upload multiple images
- `GET /api/images` - Get user's images with pagination
- `GET /api/images/{id}` - Get specific image
- `DELETE /api/images/{id}` - Delete image

### Search & Filter
- `GET /api/images/search` - Search images by text
- `GET /api/images/filter/color` - Filter by color
- `GET /api/images/{id}/similar` - Find similar images

### AI Processing
- `POST /api/images/{id}/process-ai` - Trigger AI processing
- `GET /api/images/processing-status` - Get processing status

## 🎨 UI Components

### Core Components
- **ImageGrid**: Responsive grid layout for images
- **ImageCard**: Individual image display with metadata
- **ImageModal**: Detailed view with full metadata
- **UploadZone**: Drag & drop upload area
- **SearchBar**: Text search with real-time results
- **ColorFilter**: Color-based filtering

### Layout Components
- **AppLayout**: Main application wrapper
- **Header**: Navigation and user menu
- **Sidebar**: Optional sidebar navigation

## 🔍 Search Features

### Text Search
- Search by tags and descriptions
- Real-time search results
- Search highlighting
- Search history

### Color Filtering
- Filter by dominant colors
- Color palette display
- Color similarity matching

### Similar Images
- Tag-based similarity
- Color-based similarity
- Combined similarity scoring
- "Find Similar" functionality

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Supabase)
1. Create Supabase project
2. Run database migrations
3. Start FastAPI Backend
4. Configure storage buckets

### Environment Variables
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Azure Computer Vision
AZURE_VISION_ENDPOINT=your_azure_endpoint
AZURE_VISION_KEY=your_azure_key

# Production
NODE_ENV=production
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:coverage
```

## 📊 Performance

### Optimization Features
- Image lazy loading
- Thumbnail generation
- Search debouncing
- Caching strategies
- Code splitting
- Bundle optimization

### Performance Metrics
- Page load time: < 3 seconds
- Search response time: < 1 second
- Image upload: Progress indicators
- Mobile performance: Optimized for mobile devices

## 🔒 Security

### Security Features
- Row Level Security (RLS)
- JWT token authentication
- File type validation
- File size limits
- XSS protection
- CSRF protection

### Data Protection
- User data isolation
- Encrypted data transmission
- Secure API key storage
- Input validation and sanitization

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-friendly interface
- Mobile-optimized upload
- Swipe gestures for image navigation
- Mobile-specific UI adaptations

## 🌙 Dark Mode

- System preference detection
- Manual toggle
- Consistent theming
- Smooth transitions
- Accessibility compliant

## ♿ Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast support
- Focus management
- ARIA labels and roles

## 📈 Analytics

### User Analytics
- Image upload tracking
- Search query analytics
- Feature usage metrics
- Performance monitoring

### Business Metrics
- User engagement
- Feature adoption
- Error rates
- Performance metrics

## 🔧 Development

### Code Quality
- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- Husky pre-commit hooks
- Conventional commits

### Git Workflow
- Feature branches
- Pull request reviews
- Automated testing
- Continuous integration

## 📚 Documentation

### Technical Documentation
- [Project Plan](PROJECT_PLAN.md)
- [Technical Architecture](TECHNICAL_ARCHITECTURE.md)
- [Database Design](DATABASE_DESIGN.md)
- [API Design](API_DESIGN.md)
- [UI/UX Design](UI_UX_DESIGN.md)
- [Implementation Phases](IMPLEMENTATION_PHASES.md)
- [AI Service Comparison](AI_SERVICE_COMPARISON.md)

### User Documentation
- User guide
- FAQ
- Troubleshooting
- Video tutorials

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Supabase for backend services
- Azure Computer Vision for AI analysis
- React and Vite for frontend framework
- Tailwind CSS for styling
- All open-source contributors

## 📞 Support

For support, please:
1. Check the [FAQ](docs/FAQ.md)
2. Search existing issues
3. Create a new issue
4. Contact the development team

## 📈 Current Status

### ✅ **Phase 1 Complete** - Foundation & Setup
- Project setup and authentication system
- Basic UI components and routing
- Database schema and Supabase integration
- Testing and documentation

### ✅ **Phase 2 Complete** - Core Image Management
- Image upload system with drag & drop
- Thumbnail generation and compression
- Responsive image gallery with pagination
- Image modal viewer with metadata
- Performance optimization and testing

### 🚧 **Phase 3 In Progress** - AI Integration
- Azure Computer Vision setup
- Background processing system
- AI analysis implementation
- Real-time status updates

### 📋 **Phase 4 Planned** - Search & Filter Features
- Text search functionality
- Color filtering
- Similar image search
- Advanced search features

### 📋 **Phase 5 Planned** - Polish & Deployment
- UI/UX polish
- Performance optimization
- Comprehensive testing
- Production deployment

## 🎯 Future Enhancements

- [ ] Batch image processing
- [ ] Advanced image editing
- [ ] Social sharing features
- [ ] Image collections/albums
- [ ] Advanced analytics dashboard
- [ ] API rate limiting
- [ ] Image compression options
- [ ] Bulk operations
- [ ] Image versioning
- [ ] Advanced search filters

---

*Built with ❤️ using React, Supabase, and Azure Computer Vision*

**Current Status**: Phase 1 & 2 Complete ✅ | Phase 3 In Progress 🚧 | Ready for AI Integration
