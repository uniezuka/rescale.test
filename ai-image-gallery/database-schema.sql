-- AI Image Gallery Database Schema
-- This file contains the SQL schema needed for Supabase setup

-- Create images table
CREATE TABLE IF NOT EXISTS images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    ai_tags TEXT[] DEFAULT '{}',
    ai_description TEXT,
    dominant_colors TEXT[] DEFAULT '{}',
    thumbnail_url TEXT,
    original_url TEXT NOT NULL,
    
    -- Indexes
    CONSTRAINT images_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_uploaded_at ON images(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_processing_status ON images(processing_status);
CREATE INDEX IF NOT EXISTS idx_images_ai_tags ON images USING GIN(ai_tags);
CREATE INDEX IF NOT EXISTS idx_images_dominant_colors ON images USING GIN(dominant_colors);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('images', 'images', true),
    ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Row Level Security (RLS) Policies
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own images
CREATE POLICY "Users can view their own images" ON images
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own images
CREATE POLICY "Users can insert their own images" ON images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own images
CREATE POLICY "Users can update their own images" ON images
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own images
CREATE POLICY "Users can delete their own images" ON images
    FOR DELETE USING (auth.uid() = user_id);

-- Storage policies for images bucket
CREATE POLICY "Users can upload their own images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for thumbnails bucket
CREATE POLICY "Users can upload their own thumbnails" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'thumbnails' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own thumbnails" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'thumbnails' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own thumbnails" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'thumbnails' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_images_updated_at 
    BEFORE UPDATE ON images 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up storage when image is deleted
CREATE OR REPLACE FUNCTION cleanup_image_storage()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete original image
    DELETE FROM storage.objects 
    WHERE bucket_id = 'images' 
    AND name = OLD.filename;
    
    -- Delete thumbnail
    DELETE FROM storage.objects 
    WHERE bucket_id = 'thumbnails' 
    AND name = replace(OLD.filename, regexp_replace(OLD.filename, '.*\.', ''), '_thumb.jpg');
    
    RETURN OLD;
END;
$$ language 'plpgsql';

-- Trigger to clean up storage on image deletion
CREATE TRIGGER cleanup_image_storage_trigger
    AFTER DELETE ON images
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_image_storage();

-- Create a view for image statistics
CREATE OR REPLACE VIEW user_image_stats AS
SELECT 
    user_id,
    COUNT(*) as total_images,
    SUM(file_size) as total_size,
    AVG(file_size) as avg_file_size,
    COUNT(CASE WHEN processing_status = 'completed' THEN 1 END) as processed_images,
    COUNT(CASE WHEN processing_status = 'pending' THEN 1 END) as pending_images,
    COUNT(CASE WHEN processing_status = 'processing' THEN 1 END) as processing_images,
    COUNT(CASE WHEN processing_status = 'failed' THEN 1 END) as failed_images
FROM images
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON user_image_stats TO authenticated;
