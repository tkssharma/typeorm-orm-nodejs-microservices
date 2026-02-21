# Section 38: Authentication Data Modeling

## Topics Covered

### 1. User Schema Design
- Essential user fields
- Profile vs authentication data
- Email verification fields
- Account status management

### 2. Password Hashing
- bcrypt for password hashing
- Salt rounds configuration
- Pre-save hooks for hashing
- Password comparison methods

### 3. Storing Tokens Securely
- Refresh token storage
- Token expiration handling
- Token invalidation patterns
- Hashing tokens before storage

### 4. Session vs Token-Based Auth (Data Perspective)
- Session storage in MongoDB
- JWT with MongoDB
- Token blacklisting
- Session cleanup strategies

### 5. MongoDB for Auth Systems
- User lookup optimization
- Login attempt tracking
- Password reset tokens
- OAuth provider data storage

## Code Examples

### User Schema with Auth
```javascript
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  refreshTokens: [{ token: String, expiresAt: Date }]
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
```

## Demo Project
```bash
cd section-38-auth-data-modeling/demo
cp .env.example .env
pnpm install
pnpm dev
```
