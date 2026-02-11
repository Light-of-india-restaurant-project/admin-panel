# Nisbat Connect - Admin Panel

Super Admin Panel for managing users, verifying registrations, and monitoring the platform.

## Features

- 📊 **Dashboard** - Overview of user statistics and recent registrations
- 👥 **User Management** - View, search, and filter all users
- ✅ **User Verification** - Manually verify user emails
- 🚫 **Block/Unblock Users** - Block users with reason, unblock when needed
- 👁️ **User Details** - View complete user profile and match statistics
- 📝 **Audit Log** - Track all admin actions for accountability

## Setup

### 1. Run Database Migration

First, run the migration SQL on your database:

```bash
psql -U postgres -d nisbat_connect -f database/migration.sql
```

### 2. Create Admin User

```bash
cd admin-panel
node database/create-admin.js
```

This will create an admin user with:
- Email: `admin@nisbatconnect.com`
- Password: `Admin@123`

**⚠️ Change the password after first login!**

### 3. Add Admin JWT Secret to Backend

Add this to your `backend/.env`:

```
ADMIN_JWT_SECRET=your_super_secret_admin_key_here
```

### 4. Install Dependencies

```bash
cd admin-panel
npm install
```

### 5. Start the Admin Panel

Make sure the backend server is running on port 3002, then:

```bash
npm run dev
```

The admin panel will be available at: http://localhost:5174

## Usage

### Dashboard
- View total users, verified/unverified counts
- See blocked users count
- Track registrations (today, this week)
- View recent registrations

### User Management
- Search users by email or name
- Filter by status (All, Verified, Unverified, Blocked)
- Quick actions: View, Verify, Block/Unblock

### User Details
- Complete profile information
- Match statistics (requests sent/received, approved matches)
- Account info (registration date, last login)
- Actions: Verify, Block/Unblock, Delete

### Audit Log
- Track all admin actions
- See which admin performed what action
- View action details and timestamps

## API Endpoints

All admin endpoints are protected with JWT authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/me` | Get current admin |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | List users (paginated) |
| GET | `/api/admin/users/:id` | Get user details |
| POST | `/api/admin/users/:id/verify` | Verify user |
| POST | `/api/admin/users/:id/block` | Block user |
| POST | `/api/admin/users/:id/unblock` | Unblock user |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/audit-log` | Get audit log |
| GET | `/api/admin/recent-registrations` | Recent registrations |

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js (shared with main app)
- **Database**: PostgreSQL
- **Auth**: JWT
