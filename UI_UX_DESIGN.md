# UI/UX Design - AI Image Gallery

## 🎨 Design System Overview

The AI Image Gallery follows a modern, clean design approach with focus on usability and visual appeal. The design system emphasizes:

- **Simplicity**: Clean, uncluttered interfaces
- **Accessibility**: WCAG 2.1 AA compliance
- **Responsiveness**: Mobile-first design approach
- **Performance**: Optimized for fast loading and smooth interactions
- **Consistency**: Unified design language across all components

## 🎯 Design Principles

1. **User-Centric**: Every design decision prioritizes user experience
2. **Progressive Disclosure**: Show information when needed, hide complexity
3. **Visual Hierarchy**: Clear information architecture and content prioritization
4. **Feedback**: Immediate visual feedback for all user actions
5. **Efficiency**: Minimize clicks and steps to complete tasks

## 🎨 Color Palette

### Primary Colors
```css
:root {
  /* Primary Brand Colors */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  --primary-900: #1e3a8a;
  
  /* Secondary Colors */
  --secondary-50: #f8fafc;
  --secondary-100: #f1f5f9;
  --secondary-500: #64748b;
  --secondary-600: #475569;
  --secondary-700: #334155;
  --secondary-900: #0f172a;
}
```

### Semantic Colors
```css
:root {
  /* Success */
  --success-50: #f0fdf4;
  --success-500: #22c55e;
  --success-600: #16a34a;
  
  /* Warning */
  --warning-50: #fffbeb;
  --warning-500: #f59e0b;
  --warning-600: #d97706;
  
  /* Error */
  --error-50: #fef2f2;
  --error-500: #ef4444;
  --error-600: #dc2626;
  
  /* Info */
  --info-50: #f0f9ff;
  --info-500: #06b6d4;
  --info-600: #0891b2;
}
```

### Neutral Colors
```css
:root {
  /* Grays */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
}
```

## 📱 Responsive Breakpoints

```css
:root {
  --breakpoint-sm: 640px;   /* Mobile */
  --breakpoint-md: 768px;   /* Tablet */
  --breakpoint-lg: 1024px;  /* Desktop */
  --breakpoint-xl: 1280px;  /* Large Desktop */
  --breakpoint-2xl: 1536px; /* Extra Large */
}
```

## 🧩 Component Library

### 1. Layout Components

#### App Layout
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

// Main application wrapper with header, sidebar, and content area
const AppLayout: React.FC<AppLayoutProps> = ({ children, showSidebar = false }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
```

#### Header Component
```typescript
interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              AI Image Gallery
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <SearchBar />
            <UserMenu user={user} onLogout={onLogout} />
          </div>
        </div>
      </div>
    </header>
  );
};
```

### 2. Authentication Components

#### Login Page
```typescript
const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              required
              placeholder="Enter your email"
            />
            <Input
              label="Password"
              type="password"
              required
              placeholder="Enter your password"
            />
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
          <div className="text-center">
            <Link to="/signup" className="text-primary-600 hover:text-primary-500">
              Don't have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
```

#### Signup Page
```typescript
const SignupPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              required
              placeholder="Enter your email"
            />
            <Input
              label="Password"
              type="password"
              required
              placeholder="Create a password"
            />
            <Input
              label="Confirm Password"
              type="password"
              required
              placeholder="Confirm your password"
            />
          </div>
          <Button type="submit" className="w-full">
            Create account
          </Button>
          <div className="text-center">
            <Link to="/login" className="text-primary-600 hover:text-primary-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
```

### 3. Gallery Components

#### Gallery Page
```typescript
const GalleryPage: React.FC = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search and Filter Controls */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search images by tags or description..."
          />
          <ColorFilter
            selectedColor={selectedColor}
            onColorSelect={setSelectedColor}
          />
        </div>
      </div>

      {/* Upload Zone */}
      <UploadZone
        onUpload={handleUpload}
        className="mb-8"
      />

      {/* Image Grid */}
      {loading ? (
        <ImageGridSkeleton />
      ) : (
        <ImageGrid
          images={images}
          onImageClick={handleImageClick}
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
```

#### Image Grid
```typescript
interface ImageGridProps {
  images: Image[];
  onImageClick: (image: Image) => void;
  loading?: boolean;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, onImageClick, loading = false }) => {
  if (loading) {
    return <ImageGridSkeleton />;
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
        <p className="text-gray-500">Upload some images to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          onClick={() => onImageClick(image)}
        />
      ))}
    </div>
  );
};
```

#### Image Card
```typescript
interface ImageCardProps {
  image: Image;
  onClick: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(image.metadata?.ai_processing_status);

  return (
    <div
      className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Image */}
      <div className="aspect-square relative overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <img
          src={image.thumbnail_path}
          alt={image.filename}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Processing Status Overlay */}
        {processingStatus === 'processing' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-sm font-medium">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2" />
              Processing...
            </div>
          </div>
        )}
        
        {processingStatus === 'failed' && (
          <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-sm font-medium text-center">
              <svg className="mx-auto h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Processing Failed
            </div>
          </div>
        )}
      </div>

      {/* Image Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 truncate">
          {image.filename}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {formatFileSize(image.file_size)} • {formatDate(image.uploaded_at)}
        </p>
        
        {/* Tags Preview */}
        {image.metadata?.tags && image.metadata.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {image.metadata.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
              >
                {tag}
              </span>
            ))}
            {image.metadata.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{image.metadata.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
```

### 4. Upload Components

#### Upload Zone
```typescript
interface UploadZoneProps {
  onUpload: (files: File[]) => void;
  className?: string;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onUpload, className = '' }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    setUploading(true);
    onUpload(acceptedFiles);
    setUploading(false);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
        isDragActive || isDragOver
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${className}`}
      onDragEnter={() => setIsDragOver(true)}
      onDragLeave={() => setIsDragOver(false)}
    >
      <input {...getInputProps()} />
      <div className="space-y-4">
        <div className="text-gray-400">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {isDragActive ? 'Drop images here' : 'Upload images'}
          </h3>
          <p className="text-gray-500">
            Drag and drop images here, or click to select files
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Supports JPEG and PNG files up to 10MB
          </p>
        </div>
        {uploading && (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
            <span className="text-sm text-gray-600">Uploading...</span>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 5. Search Components

#### Search Bar
```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange, 
  placeholder = "Search images...",
  className = ""
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
          isFocused ? 'border-primary-500' : 'border-gray-300'
        }`}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
```

#### Color Filter
```typescript
interface ColorFilterProps {
  selectedColor: string | null;
  onColorSelect: (color: string | null) => void;
  availableColors?: string[];
}

const ColorFilter: React.FC<ColorFilterProps> = ({ 
  selectedColor, 
  onColorSelect,
  availableColors = []
}) => {
  const commonColors = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FFA500', '#800080', '#008000', '#FFC0CB', '#A52A2A', '#808080'
  ];

  const colors = availableColors.length > 0 ? availableColors : commonColors;

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">Filter by color:</span>
      <div className="flex space-x-2">
        <button
          onClick={() => onColorSelect(null)}
          className={`w-8 h-8 rounded-full border-2 ${
            selectedColor === null
              ? 'border-gray-900 ring-2 ring-primary-500'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          style={{ backgroundColor: '#f3f4f6' }}
          title="All colors"
        />
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onColorSelect(color)}
            className={`w-8 h-8 rounded-full border-2 ${
              selectedColor === color
                ? 'border-gray-900 ring-2 ring-primary-500'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
};
```

### 6. Modal Components

#### Image Modal
```typescript
interface ImageModalProps {
  image: Image | null;
  isOpen: boolean;
  onClose: () => void;
  onFindSimilar: (image: Image) => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ 
  image, 
  isOpen, 
  onClose, 
  onFindSimilar 
}) => {
  if (!image || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {image.filename}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image */}
              <div className="space-y-4">
                <img
                  src={image.original_path}
                  alt={image.filename}
                  className="w-full h-auto rounded-lg shadow-sm"
                />
                
                {/* Actions */}
                <div className="flex space-x-3">
                  <Button
                    onClick={() => onFindSimilar(image)}
                    variant="outline"
                    className="flex-1"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Find Similar
                  </Button>
                  <Button
                    onClick={() => window.open(image.original_path, '_blank')}
                    variant="outline"
                    className="flex-1"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </Button>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-6">
                {/* Description */}
                {image.metadata?.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600">
                      {image.metadata.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {image.metadata?.tags && image.metadata.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {image.metadata.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colors */}
                {image.metadata?.colors && image.metadata.colors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Dominant Colors</h4>
                    <div className="flex space-x-2">
                      {image.metadata.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-8 h-8 rounded-full border border-gray-300"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Image Details */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Details</h4>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Size</dt>
                      <dd className="text-gray-900">{formatFileSize(image.file_size)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Dimensions</dt>
                      <dd className="text-gray-900">{image.width} × {image.height}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Format</dt>
                      <dd className="text-gray-900">{image.mime_type}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Uploaded</dt>
                      <dd className="text-gray-900">{formatDate(image.uploaded_at)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 7. Loading Components

#### Image Grid Skeleton
```typescript
const ImageGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {Array.from({ length: 20 }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="aspect-square bg-gray-200 animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
            <div className="flex space-x-1">
              <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16" />
              <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### Loading Spinner
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${sizeClasses[size]} ${className}`} />
  );
};
```

## 📱 Mobile Responsiveness

### Mobile Navigation
```typescript
const MobileNavigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-500 hover:text-gray-600"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
          <div className="px-4 py-2 space-y-2">
            <SearchBar className="w-full" />
            <ColorFilter />
          </div>
        </div>
      )}
    </div>
  );
};
```

### Mobile Image Grid
```typescript
// Responsive grid classes
const gridClasses = `
  grid grid-cols-2 
  sm:grid-cols-3 
  md:grid-cols-4 
  lg:grid-cols-5 
  xl:grid-cols-6
  gap-3 sm:gap-4 md:gap-6
`;
```

## 🎨 Dark Mode Support

### Dark Mode Toggle
```typescript
const DarkModeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-md text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
    >
      {isDark ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
};
```

### Dark Mode CSS Variables
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
}

.dark {
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --border-color: #374151;
}
```

## ♿ Accessibility Features

### ARIA Labels and Roles
```typescript
// Accessible button with proper ARIA attributes
<button
  onClick={handleClick}
  aria-label="Upload images"
  role="button"
  tabIndex={0}
  className="..."
>
  Upload Images
</button>

// Accessible image with alt text
<img
  src={image.thumbnail_path}
  alt={`Thumbnail of ${image.filename}`}
  role="img"
  className="..."
/>

// Accessible modal with proper focus management
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  className="..."
>
  <h2 id="modal-title" className="sr-only">
    Image Details
  </h2>
  {/* Modal content */}
</div>
```

### Keyboard Navigation
```typescript
// Keyboard navigation for image grid
const handleKeyDown = (event: KeyboardEvent, image: Image) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onImageClick(image);
  }
};

// Focus management for modals
useEffect(() => {
  if (isOpen) {
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0] as HTMLElement;
    firstElement?.focus();
  }
}, [isOpen]);
```

## 🎯 User Experience Guidelines

### Loading States
- Show skeleton screens for initial loading
- Display progress indicators for uploads
- Use spinners for processing states
- Provide clear feedback for all actions

### Error Handling
- Display user-friendly error messages
- Provide retry options where appropriate
- Show validation errors inline
- Handle network failures gracefully

### Performance
- Lazy load images below the fold
- Use progressive image loading
- Implement virtual scrolling for large lists
- Optimize bundle size with code splitting

---

*This UI/UX design provides a comprehensive foundation for building a modern, accessible, and user-friendly AI Image Gallery application.*
