# Admin User Setup Guide

## Security Notice
For security reasons, admin users cannot be created through the API. Admin accounts must be created manually through direct database access.

## Creating an Admin User

### Method 1: Direct Database Access
```sql
-- Connect to your PostgreSQL database
-- Replace with your own username and hashed password

INSERT INTO users (username, password, role) 
VALUES (
  'admin', 
  '$2b$12$YOUR_BCRYPT_HASHED_PASSWORD_HERE',
  'admin'
);
```

### Method 2: Node.js Script
Create a secure admin user using bcrypt:

```javascript
const bcrypt = require('bcrypt');

async function createAdmin() {
  const password = 'your-secure-password';
  const hashedPassword = await bcrypt.hash(password, 12);
  console.log('Hashed password:', hashedPassword);
  
  // Use this hashed password in your database INSERT
}

createAdmin();
```

## Required Environment Variables
- `SESSION_SECRET`: Strong random string (32+ characters)
- `DATABASE_URL`: PostgreSQL connection string

## Security Best Practices
1. Use strong, unique passwords for admin accounts
2. Limit admin account creation to secure, controlled processes
3. Regularly rotate admin passwords
4. Monitor admin account usage
5. Ensure HTTPS in production for secure session cookies

## Production Deployment
1. Create admin user via secure database access
2. Set strong SESSION_SECRET environment variable
3. Configure PostgreSQL database connection
4. Deploy with HTTPS enabled
5. Test authentication flow before going live