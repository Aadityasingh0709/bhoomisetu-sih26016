# BhoomiSetu - RBAC & Password Recovery Features

## Overview
This document outlines the new RBAC (Role-Based Access Control) and password recovery features added to BhoomiSetu.

---

## 🔐 Password Recovery Features

### New Endpoints

#### 1. **Forgot Password**
- **Route**: `POST /api/auth/forgot-password`
- **Body**: 
  ```json
  {
    "email": "user@landacquisition.gov.in"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Password reset token sent to email",
    "demo": {
      "resetToken": "token_hash_here",
      "resetUrl": "http://localhost:5173/reset-password/token_here",
      "expiresIn": "10 minutes"
    }
  }
  ```
- **Notes**: Token expires in 10 minutes for security

#### 2. **Reset Password**
- **Route**: `POST /api/auth/reset-password/:token`
- **Body**:
  ```json
  {
    "password": "NewPassword@2026",
    "passwordConfirm": "NewPassword@2026"
  }
  ```
- **Response**: Returns new JWT token and user info

#### 3. **Change Password**
- **Route**: `POST /api/auth/change-password`
- **Auth**: Required (Protected)
- **Body**:
  ```json
  {
    "currentPassword": "OldPassword@2026",
    "newPassword": "NewPassword@2026",
    "passwordConfirm": "NewPassword@2026"
  }
  ```

### Frontend Pages

#### ForgotPasswordPage
- **Route**: `/forgot-password`
- **Features**:
  - Email input validation
  - Success confirmation message
  - Demo token display (for testing)
  - Link back to login

#### ResetPasswordPage
- **Route**: `/reset-password/:token`
- **Features**:
  - Password strength requirements
  - Confirm password field with toggle visibility
  - Password criteria display
  - Automatic login after reset
  - Token expiration handling

---

## 👥 RBAC (Role-Based Access Control)

### Roles & Permissions

#### 1. **Administrator**
- Full system access
- Manage all users and departments
- System settings configuration
- Project creation/deletion
- Audit log access
- All other permissions

#### 2. **Senior Officer**
- View all projects and analytics
- Generate and export reports
- View bottleneck analysis
- Access GIS data
- Limited to read-only for most features

#### 3. **Department Officer** (Stage-Specific)
Different permissions based on assigned department:

**Survey Officer (Stage 1 - 15%)**
- Create and manage surveys
- Add land coordinates
- Upload drone data
- Manage land demarcations

**Legal Verification Officer (Stage 2 - 15%)**
- Verify titles and ownership
- Check disputes
- Manage NOCs
- Schedule hearings

**Compensation Officer (Stage 3 - 30%)**
- Calculate awards
- Verify bank details
- Process disbursements
- Manage beneficiaries

**Rehabilitation Officer (Stage 4 - 25%)**
- Allocate plots
- Manage schemes
- Track livelihood programs
- Schedule training

**Approvals Officer (Stage 5 - 5%)**
- Review clearances
- Publish gazette notifications
- Issue sanctions
- Generate certificates

**Possession Officer (Stage 6 - 10%)**
- Record takeovers
- Handover sites
- Mark completion
- Manage asset transfers

#### 4. **Project Manager**
- Create and manage projects
- Team management
- Progress tracking
- Project reporting

#### 5. **District Officer**
- View district-level projects
- Add notes and comments
- View district reports

---

## 🔑 Demo Accounts

Each role now has a **unique, strong password** for testing:

| Role | Email | Password | Department |
|------|-------|----------|------------|
| Administrator | `admin@landacquisition.gov.in` | `Admin@2026Secure!` | All Departments |
| Senior Officer | `senior@landacquisition.gov.in` | `Senior@2026Officer!` | National Oversight |
| Survey Officer | `survey@landacquisition.gov.in` | `Survey@2026Land!` | Survey |
| Legal Officer | `legal@landacquisition.gov.in` | `Legal@2026Verify!` | Legal Verification |
| Compensation Officer | `compensation@landacquisition.gov.in` | `Compensation@2026!` | Compensation |
| Rehabilitation Officer | `rehabilitation@landacquisition.gov.in` | `Rehab@2026Support!` | Rehabilitation |
| Approvals Officer | `approvals@landacquisition.gov.in` | `Approvals@2026!` | Approvals |
| Possession Officer | `possession@landacquisition.gov.in` | `Possession@2026!` | Possession |

---

## 🛠️ RBAC Configuration Files

### Backend Files

#### `/backend/config/rbac.js`
- **Contains**: 
  - `RBAC_PERMISSIONS` - Role-based permissions
  - `STAGE_PERMISSIONS` - Department-specific permissions
  - `ACTION_PERMISSIONS` - Action-based access control
  - Helper functions:
    - `hasPermission(role, permission)`
    - `canPerformAction(role, action)`
    - `getRolePermissions(role)`
    - `getStagePermissions(department)`

#### `/backend/middleware/auth.js` - Enhanced
- **New Middleware Functions**:
  - `requirePermission(permission)` - Single permission check
  - `requireAnyPermission(...permissions)` - At least one permission
  - `requireAllPermissions(...permissions)` - All permissions required
  - `requireDepartmentAccess()` - Department-level access
  - `requireOwnership()` - Resource ownership check

### Usage in Routes

```javascript
// Example: Check single permission
router.post("/projects", 
  protect, 
  requirePermission("create_project"), 
  createProject
);

// Example: Check multiple permissions (any)
router.get("/reports",
  protect,
  requireAnyPermission("generate_reports", "export_reports"),
  getReports
);

// Example: Check department access
router.put("/departments/:departmentId",
  protect,
  requireDepartmentAccess,
  updateDepartment
);
```

---

## 🔄 User Model Updates

### New Fields in User Schema

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum),
  department: ObjectId (ref: Department),
  isActive: Boolean,
  passwordResetToken: String,        // NEW
  passwordResetExpires: Date,        // NEW
  lastPasswordChange: Date,          // NEW
}
```

### New Methods

- `matchPassword(entered)` - Compare plain text with hashed password
- `generatePasswordResetToken()` - Create secure reset token
- `matchResetToken(token)` - Verify reset token

---

## 📋 Implementation Guide

### 1. Using Password Recovery

**From Frontend:**
```javascript
import { forgotPasswordRequest, resetPasswordRequest } from "../../api/auth.js";

// Forgot password
await forgotPasswordRequest(email);

// Reset password
await resetPasswordRequest(token, newPassword, passwordConfirm);
```

### 2. Protecting Routes with RBAC

**In Backend Routes:**
```javascript
import { protect, restrictTo, requirePermission } from "../middleware/auth.js";

// Role-based
router.post("/admin/settings", protect, restrictTo("Administrator"), handler);

// Permission-based
router.post("/projects", protect, requirePermission("create_project"), handler);

// Department-based
router.put("/departments/:departmentId", protect, requireDepartmentAccess, handler);
```

**In Frontend (ProtectedRoute):**
```javascript
<Route 
  element={
    <ProtectedRoute roles={["Administrator", "ProjectManager"]} />
  }
>
  <Route path="/admin" element={<AdminPage />} />
</Route>
```

### 3. Accessing User Permissions in Controllers

```javascript
import { hasPermission, getRolePermissions } from "../config/rbac.js";

export const someController = asyncHandler(async (req, res) => {
  const userRole = req.user.role;
  
  // Check single permission
  if (hasPermission(userRole, "create_project")) {
    // Allow action
  }
  
  // Get all permissions
  const permissions = getRolePermissions(userRole);
  console.log(permissions);
});
```

---

## 🧪 Testing the Features

### Test Password Recovery Flow
1. Go to `/login`
2. Click "Forgot password?" link
3. Enter an email from demo accounts
4. Copy the reset token (shown in demo mode)
5. Use reset token in URL: `/reset-password/{token}`
6. Enter new password and confirm
7. Auto-login occurs after successful reset

### Test RBAC
1. Log in with different demo accounts
2. Check permissions in browser console: 
   ```javascript
   // Frontend - stored in auth store
   useAuthStore((s) => s.user).role
   ```
3. Backend will reject requests if user lacks permissions
4. Check network tab for `403 Forbidden` responses for unauthorized actions

---

## 📝 Database Seeding

To seed the database with demo accounts, update `/backend/seed.js`:

```javascript
// Use these passwords when creating demo users
const demoUsers = [
  {
    name: "System Administrator",
    email: "admin@landacquisition.gov.in",
    password: "Admin@2026Secure!",
    role: "Administrator"
  },
  // ... more users
];
```

---

## ⚠️ Security Notes

1. **Password Reset Token**: 
   - Expires in 10 minutes
   - Hashed before storage
   - One-time use only

2. **Password Requirements**:
   - Minimum 8 characters
   - Mix of uppercase and lowercase
   - Numbers and special characters recommended

3. **RBAC Enforcement**:
   - Checked on backend for all API calls
   - Frontend UI can conditionally hide elements
   - Never trust frontend permissions alone

4. **Future Enhancements**:
   - Implement actual email sending (Nodemailer/SendGrid)
   - Add password expiration policies
   - Implement 2FA for admin accounts
   - Add permission audit logging

---

## 📞 API Reference Summary

| Method | Endpoint | Auth | Body | Purpose |
|--------|----------|------|------|---------|
| POST | `/api/auth/login` | None | email, password | User login |
| POST | `/api/auth/forgot-password` | None | email | Request password reset |
| POST | `/api/auth/reset-password/:token` | None | password, passwordConfirm | Reset password with token |
| POST | `/api/auth/change-password` | Yes | currentPassword, newPassword, passwordConfirm | User changes own password |
| GET | `/api/auth/me` | Yes | None | Get current user info |

---

## 🎯 Next Steps

1. **Email Integration**: Replace demo token display with actual email sending
2. **Audit Logging**: Log all password changes and permission denials
3. **2FA Implementation**: Add two-factor authentication for sensitive roles
4. **Permission Caching**: Cache permissions to reduce database queries
5. **Analytics**: Track failed login attempts and permission denials

---

## 📞 Support

For questions or issues with RBAC features, refer to:
- `/backend/config/rbac.js` - Permission definitions
- `/backend/middleware/auth.js` - Authentication logic
- `/frontend/src/features/auth/` - Auth-related components

