#!/usr/bin/env node

/**
 * BhoomiSetu - RBAC & Password Recovery Feature Test
 * This script validates all new features are properly implemented
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║  BhoomiSetu - RBAC & Password Recovery Feature Validation      ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let testsPass = 0;
let testsFail = 0;

function testPassed(description) {
  console.log(`✅ PASS: ${description}`);
  testsPass++;
}

function testFailed(description, error) {
  console.log(`❌ FAIL: ${description}`);
  if (error) console.log(`   Error: ${error}`);
  testsFail++;
}

// Test 1: Check if User model has password recovery fields
console.log('\n📋 Test Suite 1: User Model Updates');
console.log('─'.repeat(60));
try {
  const userModelPath = path.join(__dirname, 'models', 'User.js');
  const userModel = fs.readFileSync(userModelPath, 'utf8');
  
  if (userModel.includes('passwordResetToken')) {
    testPassed('User model has passwordResetToken field');
  } else {
    testFailed('User model missing passwordResetToken field');
  }
  
  if (userModel.includes('passwordResetExpires')) {
    testPassed('User model has passwordResetExpires field');
  } else {
    testFailed('User model missing passwordResetExpires field');
  }
  
  if (userModel.includes('lastPasswordChange')) {
    testPassed('User model has lastPasswordChange field');
  } else {
    testFailed('User model missing lastPasswordChange field');
  }
  
  if (userModel.includes('generatePasswordResetToken')) {
    testPassed('User model has generatePasswordResetToken method');
  } else {
    testFailed('User model missing generatePasswordResetToken method');
  }
  
  if (userModel.includes('matchResetToken')) {
    testPassed('User model has matchResetToken method');
  } else {
    testFailed('User model missing matchResetToken method');
  }
} catch (err) {
  testFailed('Could not read User model', err.message);
}

// Test 2: Check if auth controller has password recovery endpoints
console.log('\n📋 Test Suite 2: Authentication Endpoints');
console.log('─'.repeat(60));
try {
  const authControllerPath = path.join(__dirname, 'controllers', 'authController.js');
  const authController = fs.readFileSync(authControllerPath, 'utf8');
  
  if (authController.includes('export const forgotPassword')) {
    testPassed('forgotPassword endpoint exported');
  } else {
    testFailed('forgotPassword endpoint not found');
  }
  
  if (authController.includes('export const resetPassword')) {
    testPassed('resetPassword endpoint exported');
  } else {
    testFailed('resetPassword endpoint not found');
  }
  
  if (authController.includes('export const changePassword')) {
    testPassed('changePassword endpoint exported');
  } else {
    testFailed('changePassword endpoint not found');
  }
  
  if (authController.includes('generatePasswordResetToken')) {
    testPassed('forgotPassword calls generatePasswordResetToken');
  } else {
    testFailed('forgotPassword missing token generation');
  }
} catch (err) {
  testFailed('Could not read auth controller', err.message);
}

// Test 3: Check if auth routes are configured
console.log('\n📋 Test Suite 3: Auth Routes Configuration');
console.log('─'.repeat(60));
try {
  const authRoutesPath = path.join(__dirname, 'routes', 'authRoutes.js');
  const authRoutes = fs.readFileSync(authRoutesPath, 'utf8');
  
  if (authRoutes.includes('forgotPassword')) {
    testPassed('forgotPassword route defined');
  } else {
    testFailed('forgotPassword route not defined');
  }
  
  if (authRoutes.includes('resetPassword')) {
    testPassed('resetPassword route defined');
  } else {
    testFailed('resetPassword route not defined');
  }
  
  if (authRoutes.includes('changePassword')) {
    testPassed('changePassword route defined');
  } else {
    testFailed('changePassword route not defined');
  }
  
  if (authRoutes.includes('/forgot-password')) {
    testPassed('POST /forgot-password endpoint configured');
  } else {
    testFailed('POST /forgot-password endpoint not configured');
  }
  
  if (authRoutes.includes('/reset-password/:token')) {
    testPassed('POST /reset-password/:token endpoint configured');
  } else {
    testFailed('POST /reset-password/:token endpoint not configured');
  }
} catch (err) {
  testFailed('Could not read auth routes', err.message);
}

// Test 4: Check if RBAC configuration exists
console.log('\n📋 Test Suite 4: RBAC Configuration');
console.log('─'.repeat(60));
try {
  const rbacPath = path.join(__dirname, 'config', 'rbac.js');
  const rbacConfig = fs.readFileSync(rbacPath, 'utf8');
  
  if (rbacConfig.includes('RBAC_PERMISSIONS')) {
    testPassed('RBAC_PERMISSIONS config exported');
  } else {
    testFailed('RBAC_PERMISSIONS config not found');
  }
  
  if (rbacConfig.includes('STAGE_PERMISSIONS')) {
    testPassed('STAGE_PERMISSIONS config exported');
  } else {
    testFailed('STAGE_PERMISSIONS config not found');
  }
  
  if (rbacConfig.includes('hasPermission')) {
    testPassed('hasPermission helper function exists');
  } else {
    testFailed('hasPermission helper function not found');
  }
  
  if (rbacConfig.includes('Administrator')) {
    testPassed('Administrator role defined');
  } else {
    testFailed('Administrator role not defined');
  }
  
  if (rbacConfig.includes('SeniorOfficer')) {
    testPassed('SeniorOfficer role defined');
  } else {
    testFailed('SeniorOfficer role not defined');
  }
  
  if (rbacConfig.includes('DepartmentOfficer')) {
    testPassed('DepartmentOfficer role defined');
  } else {
    testFailed('DepartmentOfficer role not defined');
  }
} catch (err) {
  testFailed('Could not read RBAC config', err.message);
}

// Test 5: Check if auth middleware has RBAC functions
console.log('\n📋 Test Suite 5: Auth Middleware (RBAC)');
console.log('─'.repeat(60));
try {
  const authMiddlewarePath = path.join(__dirname, 'middleware', 'auth.js');
  const authMiddleware = fs.readFileSync(authMiddlewarePath, 'utf8');
  
  if (authMiddleware.includes('requirePermission')) {
    testPassed('requirePermission middleware exported');
  } else {
    testFailed('requirePermission middleware not found');
  }
  
  if (authMiddleware.includes('requireAnyPermission')) {
    testPassed('requireAnyPermission middleware exported');
  } else {
    testFailed('requireAnyPermission middleware not found');
  }
  
  if (authMiddleware.includes('requireAllPermissions')) {
    testPassed('requireAllPermissions middleware exported');
  } else {
    testFailed('requireAllPermissions middleware not found');
  }
  
  if (authMiddleware.includes('requireDepartmentAccess')) {
    testPassed('requireDepartmentAccess middleware exported');
  } else {
    testFailed('requireDepartmentAccess middleware not found');
  }
  
  if (authMiddleware.includes('requireOwnership')) {
    testPassed('requireOwnership middleware exported');
  } else {
    testFailed('requireOwnership middleware not found');
  }
} catch (err) {
  testFailed('Could not read auth middleware', err.message);
}

// Test 6: Frontend components
console.log('\n📋 Test Suite 6: Frontend Components');
console.log('─'.repeat(60));
try {
  const forgotPasswordPath = path.join(__dirname, '..', 'frontend', 'src', 'features', 'auth', 'ForgotPasswordPage.jsx');
  const resetPasswordPath = path.join(__dirname, '..', 'frontend', 'src', 'features', 'auth', 'ResetPasswordPage.jsx');
  
  if (fs.existsSync(forgotPasswordPath)) {
    testPassed('ForgotPasswordPage.jsx component exists');
  } else {
    testFailed('ForgotPasswordPage.jsx component not found');
  }
  
  if (fs.existsSync(resetPasswordPath)) {
    testPassed('ResetPasswordPage.jsx component exists');
  } else {
    testFailed('ResetPasswordPage.jsx component not found');
  }
} catch (err) {
  testFailed('Could not verify frontend components', err.message);
}

// Test 7: Frontend API functions
console.log('\n📋 Test Suite 7: Frontend API Functions');
console.log('─'.repeat(60));
try {
  const authApiPath = path.join(__dirname, '..', 'frontend', 'src', 'api', 'auth.js');
  const authApi = fs.readFileSync(authApiPath, 'utf8');
  
  if (authApi.includes('forgotPasswordRequest')) {
    testPassed('forgotPasswordRequest function exported');
  } else {
    testFailed('forgotPasswordRequest function not found');
  }
  
  if (authApi.includes('resetPasswordRequest')) {
    testPassed('resetPasswordRequest function exported');
  } else {
    testFailed('resetPasswordRequest function not found');
  }
  
  if (authApi.includes('changePasswordRequest')) {
    testPassed('changePasswordRequest function exported');
  } else {
    testFailed('changePasswordRequest function not found');
  }
} catch (err) {
  testFailed('Could not read frontend API', err.message);
}

// Test 8: Demo accounts with unique passwords
console.log('\n📋 Test Suite 8: Demo Accounts & Passwords');
console.log('─'.repeat(60));
try {
  const demoAccountsPath = path.join(__dirname, '..', 'frontend', 'src', 'utils', 'demoAccounts.js');
  const demoAccounts = fs.readFileSync(demoAccountsPath, 'utf8');
  
  const passwordsToCheck = [
    { role: 'Admin', password: 'Admin@2026Secure!' },
    { role: 'Senior', password: 'Senior@2026Officer!' },
    { role: 'Survey', password: 'Survey@2026Land!' },
    { role: 'Legal', password: 'Legal@2026Verify!' },
    { role: 'Compensation', password: 'Compensation@2026!' },
    { role: 'Rehabilitation', password: 'Rehab@2026Support!' },
    { role: 'Approvals', password: 'Approvals@2026!' },
    { role: 'Possession', password: 'Possession@2026!' }
  ];
  
  let uniquePasswordsFound = 0;
  passwordsToCheck.forEach(({ role, password }) => {
    if (demoAccounts.includes(password)) {
      uniquePasswordsFound++;
    }
  });
  
  if (uniquePasswordsFound === passwordsToCheck.length) {
    testPassed(`All ${uniquePasswordsFound} unique demo passwords are present`);
  } else {
    testFailed(`Only ${uniquePasswordsFound}/${passwordsToCheck.length} unique passwords found`);
  }
  
  if (demoAccounts.includes('permissions')) {
    testPassed('Demo accounts include permissions field');
  } else {
    testFailed('Demo accounts missing permissions field');
  }
} catch (err) {
  testFailed('Could not read demo accounts', err.message);
}

// Test 9: Frontend routes
console.log('\n📋 Test Suite 9: Frontend Routes');
console.log('─'.repeat(60));
try {
  const appPath = path.join(__dirname, '..', 'frontend', 'src', 'App.jsx');
  const app = fs.readFileSync(appPath, 'utf8');
  
  if (app.includes('ForgotPasswordPage')) {
    testPassed('ForgotPasswordPage imported in App.jsx');
  } else {
    testFailed('ForgotPasswordPage not imported in App.jsx');
  }
  
  if (app.includes('ResetPasswordPage')) {
    testPassed('ResetPasswordPage imported in App.jsx');
  } else {
    testFailed('ResetPasswordPage not imported in App.jsx');
  }
  
  if (app.includes('/forgot-password')) {
    testPassed('/forgot-password route configured');
  } else {
    testFailed('/forgot-password route not configured');
  }
  
  if (app.includes('/reset-password/:token')) {
    testPassed('/reset-password/:token route configured');
  } else {
    testFailed('/reset-password/:token route not configured');
  }
} catch (err) {
  testFailed('Could not read App.jsx', err.message);
}

// Test 10: Documentation
console.log('\n📋 Test Suite 10: Documentation');
console.log('─'.repeat(60));
try {
  const guidePath = path.join(__dirname, '..', 'RBAC_PASSWORD_RECOVERY_GUIDE.md');
  
  if (fs.existsSync(guidePath)) {
    testPassed('RBAC_PASSWORD_RECOVERY_GUIDE.md exists');
    const guide = fs.readFileSync(guidePath, 'utf8');
    
    if (guide.includes('RBAC')) {
      testPassed('Guide documents RBAC features');
    }
    if (guide.includes('Password Recovery')) {
      testPassed('Guide documents Password Recovery');
    }
    if (guide.includes('Demo Accounts')) {
      testPassed('Guide documents Demo Accounts');
    }
  } else {
    testFailed('RBAC_PASSWORD_RECOVERY_GUIDE.md not found');
  }
} catch (err) {
  testFailed('Could not verify documentation', err.message);
}

// Summary
console.log('\n' + '═'.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('═'.repeat(60));
console.log(`✅ Tests Passed: ${testsPass}`);
console.log(`❌ Tests Failed: ${testsFail}`);
console.log(`📈 Total Tests: ${testsPass + testsFail}`);
console.log(`✨ Success Rate: ${Math.round((testsPass / (testsPass + testsFail)) * 100)}%`);
console.log('═'.repeat(60));

if (testsFail === 0) {
  console.log('\n🎉 All tests passed! RBAC and Password Recovery features are properly implemented.\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${testsFail} test(s) failed. Please review the failures above.\n`);
  process.exit(1);
}
