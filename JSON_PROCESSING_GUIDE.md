# JSON Processing Feature

## Overview

The JCMS now automatically parses and stores JSON objects as MongoDB documents when JSON files are uploaded. This enables efficient querying and retrieval of structured data.

## How It Works

1. **Upload**: When a JSON file is uploaded via the file upload API
2. **Parse**: The system automatically detects JSON files and parses their content
3. **Store**: Each object in the JSON array is stored as a separate MongoDB document
4. **Retrieve**: Documents can be retrieved via dedicated API endpoints

## API Endpoints

### Upload JSON File
```
POST /api/files/upload
```
- Automatically processes JSON files and creates MongoDB documents
- Returns processing status in the response

### Get JSON Documents by File
```
GET /api/json-documents/file/:fileId
```
- Retrieves all documents created from a specific JSON file
- Returns array of parsed objects

### Get All JSON Documents
```
GET /api/json-documents/
```
- Retrieves all JSON documents for the authenticated user/tenant

## Database Schema

### JsonDocument Model
```javascript
{
  sourceFile: ObjectId,     // Reference to original File
  user: ObjectId,           // User who uploaded
  tenant: ObjectId,         // Tenant (for multi-tenancy)
  collection: ObjectId,     // Optional collection reference
  data: Mixed,              // The actual JSON object
  index: Number,            // Position in original array
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Components

### JsonDocumentViewer
- React component to display JSON documents from database
- Automatically formats common fields (name, bio, pic)
- Handles authentication and error states

### JsonUploadTest
- Test component for uploading and verifying JSON processing
- Includes sample JSON generator
- Shows processing results

## Usage Examples

### Sample JSON Structure
```json
[
  {
    "name": "John Doe",
    "age": 30,
    "email": "john@example.com",
    "bio": "Software developer",
    "pic": "https://example.com/photo.jpg"
  },
  {
    "name": "Jane Smith",
    "age": 25,
    "email": "jane@example.com",
    "bio": "UI/UX designer",
    "pic": "https://example.com/photo2.jpg"
  }
]
```

### Upload Response
```json
{
  "success": true,
  "files": [{
    "id": "file_id",
    "title": "users.json",
    "format": "json",
    "jsonProcessing": {
      "success": true,
      "documentsCreated": 2
    }
  }]
}
```

## Benefits

1. **Structured Storage**: JSON objects stored as proper MongoDB documents
2. **Efficient Queries**: Can query individual fields within documents
3. **Scalable**: Handles large JSON files by splitting into documents
4. **Automatic**: No manual processing required
5. **Integrated**: Works with existing collection and file management

## Testing

Run the test script to verify functionality:
```bash
cd backend
node test-json-processing.js
```

Or use the frontend test component at `/` in the testing application.