# AI Image Gallery

A modern web application for managing and analyzing images using AI. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🔐 **Authentication** - Secure user authentication with Supabase Auth
- 🖼️ **Image Management** - Upload, view, and organize your images
- 🤖 **AI Analysis** - Automatic image analysis with Azure Computer Vision
- 🔍 **Smart Search** - Find images using natural language or visual similarity
- 🎨 **Color Filtering** - Filter images by dominant colors
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage)
- **AI Services**: Azure Computer Vision
- **Routing**: React Router v6
- **Code Quality**: ESLint, Prettier

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm (v8 or higher)
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd ai-image-gallery
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file:

```bash
cp env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com/)
2. Go to Settings > API to get your URL and anon key
3. Update your `.env.local` file with these values
4. Run the database setup script (see Database Setup section)

### 5. Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Database Setup

Run the following SQL commands in your Supabase SQL editor to set up the database schema:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create images table
CREATE TABLE images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create image_metadata table
CREATE TABLE image_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  tags TEXT[],
  description TEXT,
  dominant_colors TEXT[],
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tables
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_metadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own images" ON images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own images" ON images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images" ON images
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images" ON images
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view metadata for their own images" ON image_metadata
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM images 
      WHERE images.id = image_metadata.image_id 
      AND images.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert metadata for their own images" ON image_metadata
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM images 
      WHERE images.id = image_metadata.image_id 
      AND images.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update metadata for their own images" ON image_metadata
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM images 
      WHERE images.id = image_metadata.image_id 
      AND images.user_id = auth.uid()
    )
  );

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', false);

-- Create storage policies
CREATE POLICY "Users can upload their own images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API services (Supabase, etc.)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App.tsx             # Main application component
```

## Development

### Code Quality

This project uses ESLint and Prettier for code quality and formatting. Make sure to run these commands before committing:

```bash
npm run lint:fix
npm run format
```

### TypeScript

The project is fully typed with TypeScript. Make sure to add proper types for new components and functions.

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The project builds to static files in the `dist` directory, so it can be deployed to any static hosting service.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.