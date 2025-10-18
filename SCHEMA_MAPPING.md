# Database Schema to Pydantic Model Mapping

This document ensures consistency between the database schema and FastAPI Pydantic models to prevent validation errors.

## Images Table Schema

### Database Fields (PostgreSQL/Supabase)

```sql
CREATE TABLE images (
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
    original_url TEXT NOT NULL
);
```

### Pydantic Model Mapping

#### ImageResponse (matches database schema exactly)

```python
class ImageResponse(BaseModel):
    id: UUID                           # -> id (UUID)
    user_id: UUID                      # -> user_id (UUID)
    filename: str                      # -> filename (TEXT)
    original_filename: str             # -> original_filename (TEXT)
    file_size: int                     # -> file_size (BIGINT)
    mime_type: str                     # -> mime_type (TEXT)
    width: int                         # -> width (INTEGER)
    height: int                        # -> height (INTEGER)
    uploaded_at: datetime              # -> uploaded_at (TIMESTAMP)
    updated_at: datetime               # -> updated_at (TIMESTAMP)
    processing_status: ProcessingStatus # -> processing_status (TEXT)
    ai_tags: Optional[List[str]]       # -> ai_tags (TEXT[])
    ai_description: Optional[str]     # -> ai_description (TEXT)
    dominant_colors: Optional[List[str]] # -> dominant_colors (TEXT[])
    thumbnail_url: Optional[str]       # -> thumbnail_url (TEXT)
    original_url: str                 # -> original_url (TEXT)
```

#### ImageCreate (for creating new records)

```python
class ImageCreate(BaseModel):
    filename: str                      # -> filename (TEXT)
    original_filename: str             # -> original_filename (TEXT)
    file_size: int                     # -> file_size (BIGINT)
    mime_type: str                     # -> mime_type (TEXT)
    width: int                         # -> width (INTEGER)
    height: int                        # -> height (INTEGER)
    original_url: str                  # -> original_url (TEXT)
    thumbnail_url: Optional[str]       # -> thumbnail_url (TEXT)
```

#### ImageUpdate (for updating existing records)

```python
class ImageUpdate(BaseModel):
    filename: Optional[str]            # -> filename (TEXT)
    original_filename: Optional[str]   # -> original_filename (TEXT)
    file_size: Optional[int]           # -> file_size (BIGINT)
    mime_type: Optional[str]            # -> mime_type (TEXT)
    width: Optional[int]               # -> width (INTEGER)
    height: Optional[int]              # -> height (INTEGER)
    ai_tags: Optional[List[str]]       # -> ai_tags (TEXT[])
    ai_description: Optional[str]     # -> ai_description (TEXT)
    dominant_colors: Optional[List[str]] # -> dominant_colors (TEXT[])
    processing_status: Optional[ProcessingStatus] # -> processing_status (TEXT)
    thumbnail_url: Optional[str]       # -> thumbnail_url (TEXT)
    original_url: Optional[str]        # -> original_url (TEXT)
```

## Field Type Mappings

| Database Type | Python Type | Pydantic Type | Notes |
|---------------|-------------|---------------|-------|
| UUID | uuid.UUID | UUID | Primary key, foreign keys |
| TEXT | str | str | Text fields |
| BIGINT | int | int | File size |
| INTEGER | int | int | Dimensions |
| TIMESTAMP WITH TIME ZONE | datetime | datetime | Timestamps |
| TEXT[] | List[str] | List[str] | Array fields |
| CHECK constraint | str | Enum | Processing status |

## Validation Rules

### File Size
- Minimum: 1 byte
- Maximum: 10MB (10 * 1024 * 1024 bytes)

### Image Dimensions
- Minimum: 10 pixels
- Maximum: 10,000 pixels

### MIME Types
- Allowed: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

### Processing Status
- Allowed values: `pending`, `processing`, `completed`, `failed`

## API Endpoint Field Usage

### Upload Endpoint (`POST /images/upload`)
```python
# Database insert fields
{
    'user_id': current_user.id,           # UUID
    'filename': storage_path,             # str (storage path)
    'original_filename': file.filename,   # str
    'file_size': len(file_data),          # int
    'mime_type': file.content_type,        # str
    'width': width,                       # int
    'height': height,                     # int
    'original_url': public_url,           # str
    'thumbnail_url': thumbnail_url,       # str
    'processing_status': ProcessingStatus.PENDING  # str
}
```

### Get Image Endpoint (`GET /images/{image_id}`)
- Returns: `ImageResponse` with all database fields
- Field mapping: Direct 1:1 mapping

### Delete Image Endpoint (`DELETE /images/{image_id}`)
- Uses: `filename` field for storage deletion
- Constructs thumbnail path from filename

### Download Image Endpoint (`GET /images/{image_id}/download`)
- Uses: `filename` field for storage access
- Returns: File stream with original filename

## Common Issues and Solutions

### Issue: UUID vs Integer Mismatch
**Problem**: API expects integer but database uses UUID
**Solution**: Use `UUID` type in all Pydantic models and API endpoints

### Issue: Field Name Mismatches
**Problem**: Database field names don't match model field names
**Solution**: Use exact database field names in Pydantic models

### Issue: Missing Required Fields
**Problem**: Database requires fields not present in models
**Solution**: Add all required database fields to Pydantic models

### Issue: Type Validation Errors
**Problem**: Data types don't match between database and models
**Solution**: Use schema validation utilities to ensure type consistency

## Schema Validation Utilities

Use the `schema_validation.py` utilities to validate data consistency:

```python
from app.utils.schema_validation import validate_database_response, validate_insert_request

# Validate database response
validated_data = validate_database_response(db_response)

# Validate insert request
validated_insert = validate_insert_request(request_data)
```

## Future Maintenance

1. **Always update both database schema and Pydantic models together**
2. **Use schema validation utilities in API endpoints**
3. **Run validation tests when making schema changes**
4. **Document any field name changes or type changes**
5. **Keep this mapping document updated with schema changes**
