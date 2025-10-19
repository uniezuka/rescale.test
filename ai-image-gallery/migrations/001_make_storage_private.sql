-- Migration: Make storage buckets private for security
-- This migration updates existing storage buckets to be private

-- Update existing buckets to be private
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('images', 'thumbnails');

-- Drop existing storage policies (they will be recreated with authentication requirements)
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own thumbnails" ON storage.objects;

-- Recreate storage policies with authentication requirements
CREATE POLICY "Users can upload their own images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can view their own images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete their own images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can upload their own thumbnails" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'thumbnails' 
        AND auth.uid()::text = (storage.foldername(name))[1]
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can view their own thumbnails" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'thumbnails' 
        AND auth.uid()::text = (storage.foldername(name))[1]
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete their own thumbnails" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'thumbnails' 
        AND auth.uid()::text = (storage.foldername(name))[1]
        AND auth.role() = 'authenticated'
    );
