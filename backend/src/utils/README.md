# JCMS Utilities

This folder contains utility scripts and development tools for JCMS.

## Files

### Development Tools
- **`test-realtime-client.html`** - Real-time WebSocket test client
  - Monitor live image upload/update/delete events
  - Test tenant-based WebSocket rooms
  - View clickable image links and event statistics
  - Usage: Open in browser and connect to `http://localhost:5000`

### Database Utilities
- **`seed_image.js`** - Database seeding utility for test images
- **`safeDeleteFile.js`** - Safe file deletion utility with error handling

## Usage

### Real-time Testing
1. Start the JCMS server: `npm run start`
2. Open `test-realtime-client.html` in your browser
3. Enter a tenant ID and join the room
4. Perform image operations via API to see live events

### Database Seeding
```bash
node src/utils/seed_image.js
```

## Notes
- Test files are excluded from git via `.gitignore`
- These utilities are for development and testing only
- Do not use in production environments