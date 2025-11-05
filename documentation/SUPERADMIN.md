# SuperAdmin Management

## Overview
JCMS enforces a **single superadmin rule** - only one superadmin account can exist in the system at any time. This superadmin is managed through environment variables and cannot be created, modified, or deleted through the API.

## Configuration

### Environment Variables (.env)
```bash
# SuperAdmin Credentials (SYSTEM MANAGED - Only one superadmin allowed)
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_EMAIL=admin@system.com  
SUPER_ADMIN_PASSWORD=admin123
```

### Security Features

1. **Single SuperAdmin Enforcement**: Only one superadmin can exist
2. **API Protection**: SuperAdmin role cannot be assigned via API
3. **System Protection**: The system superadmin cannot be modified/deleted
4. **Environment-Based**: Credentials are managed through .env file
5. **Automatic Cleanup**: Seeding removes duplicate superadmins if found

## Commands

### Check SuperAdmin Status
```bash
npm run check-superadmin
```
This command will:
- Show current superadmin count
- Display superadmin credentials
- Compare with .env configuration
- Provide recommendations

### Create/Update SuperAdmin
```bash
npm run seed
```
This will:
- Create superadmin if none exists
- Update existing superadmin to match .env
- Remove duplicate superadmins if found
- Ensure only one superadmin exists

## API Behavior

### Protected Operations
- ❌ Cannot create users with `superadmin` role
- ❌ Cannot update users to `superadmin` role  
- ❌ Cannot modify the system superadmin account
- ❌ Cannot delete the system superadmin account

### Error Messages
```json
{
  "success": false,
  "message": "Superadmin role cannot be assigned. Only one superadmin exists and is managed by the system."
}
```

```json
{
  "success": false,
  "message": "The system superadmin cannot be modified or deleted. This account is protected."
}
```

## Troubleshooting

### Multiple SuperAdmins Found
If you see this error, run:
```bash
npm run seed
```
This will automatically clean up duplicates.

### SuperAdmin Not Found
If no superadmin exists, run:
```bash
npm run seed
```
This will create the superadmin from .env credentials.

### Credentials Don't Match
If the superadmin exists but credentials don't match .env:
```bash
npm run seed
```
This will update the superadmin to match .env.

## Best Practices

1. **Keep .env Secure**: Never commit .env to version control
2. **Strong Password**: Use a strong password for SUPER_ADMIN_PASSWORD
3. **Regular Checks**: Periodically run `npm run check-superadmin`
4. **Backup Credentials**: Keep superadmin credentials in a secure location
5. **Environment Specific**: Use different credentials per environment

## Migration from Multiple SuperAdmins

If your system currently has multiple superadmins:

1. **Backup Data**: Export important data first
2. **Update .env**: Set desired superadmin credentials
3. **Run Cleanup**: Execute `npm run seed`
4. **Verify**: Run `npm run check-superadmin`

The system will automatically:
- Keep the superadmin that matches .env credentials
- Remove all other superadmin accounts
- Update the remaining superadmin if needed