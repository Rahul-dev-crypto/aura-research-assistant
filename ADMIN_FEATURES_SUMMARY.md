# Admin Features Implementation Summary

## Overview
Comprehensive admin panel with full user management capabilities including viewing passwords, managing user status, deleting users, and viewing detailed activity reports.

## Features Implemented

### 1. View User Passwords
- **Route**: `/api/admin/view-password`
- **Method**: POST
- **Description**: Allows admins to view user passwords (encrypted and stored securely)
- **Security**: 
  - Requires admin authentication
  - Passwords are encrypted using AES-256-CBC
  - Only decrypted when admin requests to view
  - Google OAuth users show "Password not available"

### 2. Delete Users
- **Route**: `/api/admin/delete-user`
- **Method**: POST
- **Description**: Permanently delete users and all their associated data
- **Features**:
  - Deletes user account
  - Deletes all research items
  - Deletes all citations
  - Prevents deletion of admin accounts
  - Confirmation modal with warning

### 3. User Status Management
- **Route**: `/api/admin/toggle-status`
- **Method**: POST
- **Status Options**:
  - **Active**: Full access to all features
  - **Suspended**: Temporarily blocked from logging in
  - **Banned**: Permanently blocked from logging in
- **Features**:
  - Visual status modal with descriptions
  - Cannot change admin user status
  - Login route checks status and blocks suspended/banned users

### 4. View User Activity & Details
- **Route**: `/api/admin/user-activity`
- **Method**: GET
- **Information Displayed**:
  - Account details (name, email, username, phone, role, status)
  - Account type (Google OAuth or Email/Password)
  - Member since date
  - Login statistics (total logins, last login)
  - Research activity (total documents, citations)
  - Document breakdown by type
  - Recent research items (last 10)
  - Recent citations (last 5)
  - Last active date

### 5. Reset User Password
- **Route**: `/api/admin/reset-password`
- **Method**: POST
- **Features**:
  - Set new password for any user
  - Minimum 6 characters validation
  - Updates both hashed password and encrypted reference
  - Returns new password to admin

### 6. Edit User Information
- **Route**: `/api/admin/update-user`
- **Method**: POST
- **Editable Fields**:
  - Name
  - Email
  - Phone
  - Username
  - Role (user/admin)

## User Model Updates

### New Fields Added:
```typescript
status: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active',
}
lastLogin: {
    type: Date,
}
loginCount: {
    type: Number,
    default: 0,
}
```

## Security Features

### Password Encryption
- Passwords are hashed with bcrypt for authentication
- Plain passwords are encrypted with AES-256-CBC for admin viewing
- Encryption key stored in environment variable
- Each encrypted password has unique IV (Initialization Vector)

### Login Tracking
- Last login timestamp updated on each successful login
- Login count incremented automatically
- Status checked before allowing login

### Admin Authorization
- All admin routes verify admin role
- Admin users cannot be deleted
- Admin status cannot be changed

## UI Components

### Admin Dashboard Features:
1. **Search Bar**: Filter users by name, email, or username
2. **User Table**: Display all users with key information
3. **Action Buttons**:
   - 👁️ View Password
   - 🔒 Reset Password
   - ✏️ Edit User
   - 📊 View Activity
   - 👤 Change Status
   - 🗑️ Delete User

### Modals:
1. **View Password Modal**: Shows decrypted password with copy button
2. **Reset Password Modal**: Input new password
3. **Edit User Modal**: Form to update user details
4. **Activity Modal**: Comprehensive user details and statistics
5. **Status Modal**: Choose between Active/Suspended/Banned
6. **Delete Modal**: Confirmation with warning message

## API Routes Summary

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/users` | GET | Fetch all users |
| `/api/admin/view-password` | POST | View user password |
| `/api/admin/reset-password` | POST | Reset user password |
| `/api/admin/update-user` | POST | Update user information |
| `/api/admin/toggle-status` | POST | Change user status |
| `/api/admin/delete-user` | POST | Delete user and data |
| `/api/admin/user-activity` | GET | Get user activity details |

## Environment Variables Required

```env
ENCRYPTION_KEY=your-32-character-encryption-key
MONGODB_URI=your-mongodb-connection-string
```

## Testing Checklist

- [x] Admin can view user passwords
- [x] Admin can reset user passwords
- [x] Admin can edit user information
- [x] Admin can view detailed user activity
- [x] Admin can suspend users
- [x] Admin can ban users
- [x] Admin can activate users
- [x] Admin can delete users (except admins)
- [x] Suspended users cannot login
- [x] Banned users cannot login
- [x] Login tracking works correctly
- [x] Password encryption/decryption works
- [x] All modals display correctly
- [x] Search functionality works

## Notes

- All admin features are protected and require admin role
- User data is permanently deleted when user is deleted
- Password viewing is logged for security audit purposes
- Google OAuth users don't have viewable passwords
- The system prevents accidental admin account deletion or status changes
