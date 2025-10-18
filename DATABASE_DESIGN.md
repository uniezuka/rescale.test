# Database Design - AI Image Gallery

## 📊 Database Schema Overview

The database is designed to support a multi-tenant image gallery application with AI-powered analysis. It uses PostgreSQL with Row Level Security (RLS) to ensure data isolation between users.

## 🗄️ Core Tables

### 1. Images Table
Stores basic image information and file paths.

```sql
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_path TEXT NOT NULL,
    thumbnail_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints
ALTER TABLE images ADD CONSTRAINT check_file_size_positive CHECK (file_size > 0);
ALTER TABLE images ADD CONSTRAINT check_mime_type_valid CHECK (mime_type IN ('image/jpeg', 'image/png'));
ALTER TABLE images ADD CONSTRAINT check_dimensions_positive CHECK (width > 0 AND height > 0);

-- Add indexes
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_uploaded_at ON images(uploaded_at DESC);
CREATE INDEX idx_images_user_uploaded ON images(user_id, uploaded_at DESC);
```

### 2. Image Metadata Table
Stores AI-generated analysis results and processing status.

```sql
CREATE TABLE image_metadata (
    id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    description TEXT,
    tags TEXT[],
    colors VARCHAR(7)[],
    ai_processing_status VARCHAR(20) DEFAULT 'pending',
    ai_processed_at TIMESTAMP WITH TIME ZONE,
    ai_error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints
ALTER TABLE image_metadata ADD CONSTRAINT check_processing_status_valid 
    CHECK (ai_processing_status IN ('pending', 'processing', 'completed', 'failed'));

-- Add indexes
CREATE INDEX idx_image_metadata_user_id ON image_metadata(user_id);
CREATE INDEX idx_image_metadata_image_id ON image_metadata(image_id);
CREATE INDEX idx_image_metadata_tags ON image_metadata USING GIN(tags);
CREATE INDEX idx_image_metadata_colors ON image_metadata USING GIN(colors);
CREATE INDEX idx_image_metadata_status ON image_metadata(ai_processing_status);
CREATE INDEX idx_image_metadata_user_status ON image_metadata(user_id, ai_processing_status);
```

### 3. Search Index Table
Optimized table for full-text search capabilities.

```sql
CREATE TABLE search_index (
    id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    search_vector tsvector,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_search_index_user_id ON search_index(user_id);
CREATE INDEX idx_search_index_image_id ON search_index(image_id);
CREATE INDEX idx_search_vector ON search_index USING GIN(search_vector);
```

### 4. User Preferences Table
Stores user-specific settings and preferences.

```sql
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    items_per_page INTEGER DEFAULT 20,
    default_view VARCHAR(20) DEFAULT 'grid',
    theme VARCHAR(20) DEFAULT 'light',
    auto_process_images BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints
ALTER TABLE user_preferences ADD CONSTRAINT check_items_per_page_valid 
    CHECK (items_per_page BETWEEN 10 AND 100);
ALTER TABLE user_preferences ADD CONSTRAINT check_default_view_valid 
    CHECK (default_view IN ('grid', 'list'));
ALTER TABLE user_preferences ADD CONSTRAINT check_theme_valid 
    CHECK (theme IN ('light', 'dark', 'auto'));

-- Add index
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

## 🔒 Row Level Security (RLS)

### Enable RLS on All Tables
```sql
-- Enable RLS
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
```

### RLS Policies

#### Images Table Policies
```sql
-- Users can only see their own images
CREATE POLICY "Users can only see own images" ON images
    FOR ALL USING (auth.uid() = user_id);

-- Users can only insert their own images
CREATE POLICY "Users can only insert own images" ON images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own images
CREATE POLICY "Users can only update own images" ON images
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own images
CREATE POLICY "Users can only delete own images" ON images
    FOR DELETE USING (auth.uid() = user_id);
```

#### Image Metadata Table Policies
```sql
-- Users can only see their own metadata
CREATE POLICY "Users can only see own metadata" ON image_metadata
    FOR ALL USING (auth.uid() = user_id);

-- Users can only insert their own metadata
CREATE POLICY "Users can only insert own metadata" ON image_metadata
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own metadata
CREATE POLICY "Users can only update own metadata" ON image_metadata
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own metadata
CREATE POLICY "Users can only delete own metadata" ON image_metadata
    FOR DELETE USING (auth.uid() = user_id);
```

#### Search Index Table Policies
```sql
-- Users can only see their own search index
CREATE POLICY "Users can only see own search index" ON search_index
    FOR ALL USING (auth.uid() = user_id);

-- Users can only insert their own search index
CREATE POLICY "Users can only insert own search index" ON search_index
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own search index
CREATE POLICY "Users can only update own search index" ON search_index
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own search index
CREATE POLICY "Users can only delete own search index" ON search_index
    FOR DELETE USING (auth.uid() = user_id);
```

#### User Preferences Table Policies
```sql
-- Users can only see their own preferences
CREATE POLICY "Users can only see own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Users can only insert their own preferences
CREATE POLICY "Users can only insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own preferences
CREATE POLICY "Users can only update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own preferences
CREATE POLICY "Users can only delete own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);
```

## 🔄 Database Functions

### 1. Update Search Index Function
Automatically updates the search index when metadata changes.

```sql
CREATE OR REPLACE FUNCTION update_search_index()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete existing search index entry
    DELETE FROM search_index WHERE image_id = NEW.image_id;
    
    -- Insert new search index entry if metadata is complete
    IF NEW.ai_processing_status = 'completed' AND NEW.description IS NOT NULL THEN
        INSERT INTO search_index (image_id, user_id, search_vector)
        VALUES (
            NEW.image_id,
            NEW.user_id,
            to_tsvector('english', COALESCE(NEW.description, '') || ' ' || 
                       array_to_string(NEW.tags, ' '))
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_search_index
    AFTER INSERT OR UPDATE ON image_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_search_index();
```

### 2. Update Timestamps Function
Automatically updates the updated_at timestamp.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER trigger_images_updated_at
    BEFORE UPDATE ON images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_image_metadata_updated_at
    BEFORE UPDATE ON image_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. Cleanup Orphaned Records Function
Cleans up orphaned records when images are deleted.

```sql
CREATE OR REPLACE FUNCTION cleanup_orphaned_records()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete associated metadata
    DELETE FROM image_metadata WHERE image_id = OLD.id;
    
    -- Delete associated search index
    DELETE FROM search_index WHERE image_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_cleanup_orphaned_records
    AFTER DELETE ON images
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_orphaned_records();
```

## 📊 Database Views

### 1. Image Gallery View
Combines images with their metadata for easy querying.

```sql
CREATE VIEW image_gallery AS
SELECT 
    i.id,
    i.user_id,
    i.filename,
    i.original_path,
    i.thumbnail_path,
    i.file_size,
    i.mime_type,
    i.width,
    i.height,
    i.uploaded_at,
    i.updated_at,
    im.description,
    im.tags,
    im.colors,
    im.ai_processing_status,
    im.ai_processed_at,
    im.ai_error_message
FROM images i
LEFT JOIN image_metadata im ON i.id = im.image_id;

-- Grant access to authenticated users
GRANT SELECT ON image_gallery TO authenticated;
```

### 2. Search Results View
Optimized view for search functionality.

```sql
CREATE VIEW search_results AS
SELECT 
    i.id,
    i.user_id,
    i.filename,
    i.thumbnail_path,
    i.uploaded_at,
    im.description,
    im.tags,
    im.colors,
    si.search_vector,
    ts_rank(si.search_vector, plainto_tsquery('english', $1)) as rank
FROM images i
JOIN image_metadata im ON i.id = im.image_id
JOIN search_index si ON i.id = si.image_id
WHERE im.ai_processing_status = 'completed';

-- Grant access to authenticated users
GRANT SELECT ON search_results TO authenticated;
```

## 🔍 Query Examples

### 1. Get User's Images with Pagination
```sql
SELECT * FROM image_gallery
WHERE user_id = $1
ORDER BY uploaded_at DESC
LIMIT $2 OFFSET $3;
```

### 2. Search Images by Text
```sql
SELECT * FROM search_results
WHERE user_id = $1
AND search_vector @@ plainto_tsquery('english', $2)
ORDER BY rank DESC
LIMIT $3 OFFSET $4;
```

### 3. Filter Images by Color
```sql
SELECT * FROM image_gallery
WHERE user_id = $1
AND colors @> ARRAY[$2]
ORDER BY uploaded_at DESC
LIMIT $3 OFFSET $4;
```

### 4. Find Similar Images
```sql
SELECT 
    i1.*,
    (
        SELECT COUNT(*)
        FROM unnest(i1.tags) AS tag1
        WHERE tag1 = ANY(i2.tags)
    ) as common_tags
FROM image_gallery i1
CROSS JOIN image_gallery i2
WHERE i1.user_id = $1
AND i2.id = $2
AND i1.id != i2.id
ORDER BY common_tags DESC
LIMIT $3;
```

### 5. Get Processing Status
```sql
SELECT 
    ai_processing_status,
    COUNT(*) as count
FROM image_metadata
WHERE user_id = $1
GROUP BY ai_processing_status;
```

## 📈 Performance Optimizations

### 1. Partial Indexes
```sql
-- Index only completed metadata
CREATE INDEX idx_image_metadata_completed 
ON image_metadata(user_id, uploaded_at DESC) 
WHERE ai_processing_status = 'completed';

-- Index only failed metadata for debugging
CREATE INDEX idx_image_metadata_failed 
ON image_metadata(user_id, ai_error_message) 
WHERE ai_processing_status = 'failed';
```

### 2. Materialized Views for Analytics
```sql
-- User statistics materialized view
CREATE MATERIALIZED VIEW user_stats AS
SELECT 
    user_id,
    COUNT(*) as total_images,
    COUNT(CASE WHEN ai_processing_status = 'completed' THEN 1 END) as processed_images,
    COUNT(CASE WHEN ai_processing_status = 'failed' THEN 1 END) as failed_images,
    SUM(file_size) as total_storage_used,
    MAX(uploaded_at) as last_upload
FROM images i
LEFT JOIN image_metadata im ON i.id = im.image_id
GROUP BY user_id;

-- Refresh materialized view
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW user_stats;
END;
$$ LANGUAGE plpgsql;
```

### 3. Connection Pooling
```sql
-- Configure connection pooling (Supabase handles this automatically)
-- But we can optimize queries for better performance
```

## 🧪 Database Testing

### 1. Test Data Setup
```sql
-- Insert test user
INSERT INTO auth.users (id, email, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com', NOW());

-- Insert test images
INSERT INTO images (user_id, filename, original_path, thumbnail_path, file_size, mime_type, width, height)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'test1.jpg', 'users/00000000-0000-0000-0000-000000000001/test1.jpg', 'users/00000000-0000-0000-0000-000000000001/thumbnails/test1.jpg', 1024000, 'image/jpeg', 1920, 1080),
    ('00000000-0000-0000-0000-000000000001', 'test2.png', 'users/00000000-0000-0000-0000-000000000001/test2.png', 'users/00000000-0000-0000-0000-000000000001/thumbnails/test2.png', 2048000, 'image/png', 2560, 1440);

-- Insert test metadata
INSERT INTO image_metadata (image_id, user_id, description, tags, colors, ai_processing_status)
VALUES 
    (1, '00000000-0000-0000-0000-000000000001', 'A beautiful sunset over the ocean', ARRAY['sunset', 'ocean', 'beach', 'nature', 'sky'], ARRAY['#FF6B35', '#F7931E', '#FFD23F'], 'completed'),
    (2, '00000000-0000-0000-0000-000000000001', 'A mountain landscape with trees', ARRAY['mountain', 'trees', 'landscape', 'nature', 'forest'], ARRAY['#2F4F4F', '#8FBC8F', '#F0E68C'], 'completed');
```

### 2. RLS Testing
```sql
-- Test RLS policies
-- This should only return the test user's images
SELECT * FROM images WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- This should return no results (different user)
SELECT * FROM images WHERE user_id = '00000000-0000-0000-0000-000000000002';
```

## 🔧 Maintenance Scripts

### 1. Cleanup Old Failed Processing
```sql
-- Delete metadata for images that failed processing more than 7 days ago
DELETE FROM image_metadata 
WHERE ai_processing_status = 'failed' 
AND ai_processed_at < NOW() - INTERVAL '7 days';
```

### 2. Vacuum and Analyze
```sql
-- Regular maintenance
VACUUM ANALYZE images;
VACUUM ANALYZE image_metadata;
VACUUM ANALYZE search_index;
```

### 3. Update Statistics
```sql
-- Update table statistics
ANALYZE images;
ANALYZE image_metadata;
ANALYZE search_index;
```

## 📋 Database Migration Script

```sql
-- Migration: 001_initial_schema.sql
-- Create all tables, indexes, policies, and functions

-- Migration: 002_add_user_preferences.sql
-- Add user preferences table

-- Migration: 003_add_search_optimizations.sql
-- Add search optimizations and materialized views

-- Migration: 004_add_cleanup_functions.sql
-- Add cleanup and maintenance functions
```

---

*This database design provides a robust foundation for the AI Image Gallery application with proper security, performance, and maintainability considerations.*
