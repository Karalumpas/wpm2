# PhotoPrism and MinIO Integration Documentation

## Overview

This implementation adds PhotoPrism (AI-powered photo management) and MinIO (S3-compatible object storage) integration to the WooCommerce Product Manager v2 application.

## Services Added

### MinIO Object Storage

- **Endpoint**: http://localhost:9000
- **Admin Console**: http://localhost:9001
- **Credentials**: minioadmin / minioadmin123
- **Bucket**: `wpm2-product-images`
- **Features**:
  - S3-compatible API
  - File upload and storage
  - Public read access for product images
  - Automatic bucket creation

### PhotoPrism Photo Management

- **Endpoint**: http://localhost:2342
- **Credentials**: admin / insecure
- **Features**:
  - AI-powered photo indexing
  - Face recognition
  - Smart search and organization
  - Metadata extraction
  - Album management

## Database Schema

### New Table: `media_files`

```sql
CREATE TABLE media_files (
    id UUID PRIMARY KEY,
    file_name TEXT NOT NULL,
    original_file_name TEXT NOT NULL,
    object_name TEXT NOT NULL UNIQUE,
    file_size NUMERIC(12,0) NOT NULL,
    mime_type TEXT NOT NULL,
    width NUMERIC(6,0),
    height NUMERIC(6,0),
    minio_url TEXT NOT NULL,
    photoprism_uid TEXT,
    product_id UUID REFERENCES products(id),
    user_id UUID REFERENCES users(id) NOT NULL,
    is_indexed BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    indexed_at TIMESTAMP
);
```

## API Endpoints

### File Upload

- **POST** `/api/uploads`
- **Form Data**: `file`, `productId` (optional), `isFeatured` (optional)
- **Response**: File metadata and URL

### Media Management

- **GET** `/api/media` - List media files
- **DELETE** `/api/media?id={fileId}` - Delete media file

### PhotoPrism Integration

- **GET** `/api/photos` - Search photos
- **POST** `/api/photos` - Control indexing
- **GET** `/api/photos/{uid}` - Get photo details
- **PUT** `/api/photos/{uid}` - Update photo metadata

### Albums

- **GET** `/api/albums` - List albums
- **POST** `/api/albums` - Create album

### Health Check

- **GET** `/api/health/services` - Check MinIO and PhotoPrism status

## New Pages

### Media Library (`/media`)

- File upload interface
- Media file browser
- File management (view, download, delete)
- Integration with MinIO storage

### Photo Management (`/photos`)

- PhotoPrism photo browser
- Search functionality
- Indexing controls
- Photo metadata viewing

## Environment Variables

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_USE_SSL=false

# PhotoPrism Configuration
PHOTOPRISM_URL=http://localhost:2342
PHOTOPRISM_USER=admin
PHOTOPRISM_PASSWORD=insecure
```

## Docker Services

### Updated docker-compose.yml

- Added MinIO service with admin console
- Added PhotoPrism service with PostgreSQL backend
- Configured volumes for persistent storage
- Health checks for service monitoring

## Usage

### Starting Services

```bash
# Start all services
npm run docker:up

# Start individual services
npm run docker:minio
npm run docker:photoprism
npm run docker:services  # MinIO + PhotoPrism only
```

### File Upload Workflow

1. User uploads file via `/media` page
2. File is stored in MinIO bucket
3. Metadata saved to `media_files` table
4. Optional: Associate with product
5. Optional: Mark as featured image

### Photo Management Workflow

1. Upload photos to PhotoPrism originals folder
2. Start indexing via `/photos` page
3. Browse and search indexed photos
4. Create albums for organization
5. Link photos to products if needed

## Integration Points

### Product Images

- Product featured images can be stored in MinIO
- Gallery images supported through media files
- Direct integration with existing product schema

### User Management

- Media files are user-specific
- Authentication required for uploads
- File ownership and permissions

### Search and Organization

- PhotoPrism AI-powered search
- Automatic tagging and categorization
- Face recognition for team photos
- Geographic information extraction

## Development Notes

### MinIO Client

- Uses official MinIO JavaScript SDK
- Automatic bucket initialization
- Public read policy for product images
- File naming conventions with timestamps

### PhotoPrism Client

- Custom API client with authentication
- Session management with token refresh
- Image URL generation for different sizes
- Indexing status monitoring

### Security

- File type validation (images only)
- File size limits (10MB max)
- User authentication required
- Sanitized file names

## Future Enhancements

1. **Image Processing**
   - Automatic thumbnail generation
   - Image optimization and compression
   - Multiple size variants

2. **Product Integration**
   - Drag-and-drop product image assignment
   - Bulk image operations
   - Image variant management

3. **Advanced PhotoPrism Features**
   - Custom face recognition for product teams
   - Automated product photo categorization
   - AI-powered image quality assessment

4. **Performance Optimization**
   - CDN integration
   - Image lazy loading
   - Background indexing

5. **Admin Features**
   - Storage usage monitoring
   - Batch file operations
   - Advanced search filters
