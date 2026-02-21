import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// User Schema with authentication fields
interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  isActive: boolean;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: Array<{ token: string; expiresAt: Date }>;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  changedPasswordAfter(timestamp: number): boolean;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Never return password by default
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshTokens: [{
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true }
  }]
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function(): string {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Check if password changed after token issued
userSchema.methods.changedPasswordAfter = function(timestamp: number): boolean {
  if (this.passwordChangedAt) {
    return this.passwordChangedAt.getTime() / 1000 > timestamp;
  }
  return false;
};

// Index for auth queries
userSchema.index({ email: 1 });
userSchema.index({ 'refreshTokens.token': 1 });

const User = mongoose.model<IUser>('User', userSchema);

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auth_demo');
    console.log('✅ Connected to MongoDB\n');

    await User.deleteMany({});

    // ============================================
    // USER REGISTRATION
    // ============================================
    console.log('📝 USER REGISTRATION');
    console.log('─'.repeat(50));

    const user = new User({
      email: 'john@example.com',
      password: 'SecurePassword123!',
      name: 'John Doe'
    });
    await user.save();
    
    console.log(`Created user: ${user.email}`);
    console.log(`Password stored as hash: ${user.password?.substring(0, 20)}...`);

    // ============================================
    // USER LOGIN
    // ============================================
    console.log('\n🔐 USER LOGIN');
    console.log('─'.repeat(50));

    // Find user (must explicitly select password)
    const foundUser = await User.findOne({ email: 'john@example.com' }).select('+password');
    
    if (!foundUser) {
      console.log('User not found');
      return;
    }

    // Verify password
    const isValid = await foundUser.comparePassword('SecurePassword123!');
    console.log(`Password valid: ${isValid}`);

    const wrongPassword = await foundUser.comparePassword('wrongpassword');
    console.log(`Wrong password check: ${wrongPassword}`);

    // Generate JWT
    const token = foundUser.generateAuthToken();
    console.log(`\nJWT Token: ${token.substring(0, 50)}...`);

    // Decode token (for demo)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    console.log(`Token payload: { id: ${decoded.id}, email: ${decoded.email}, role: ${decoded.role} }`);

    // ============================================
    // REFRESH TOKENS
    // ============================================
    console.log('\n🔄 REFRESH TOKENS');
    console.log('─'.repeat(50));

    const refreshToken = jwt.sign(
      { id: foundUser._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    await User.updateOne(
      { _id: foundUser._id },
      { $push: { refreshTokens: { token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } } }
    );
    console.log('Refresh token stored');

    // Clean expired tokens
    await User.updateMany(
      {},
      { $pull: { refreshTokens: { expiresAt: { $lt: new Date() } } } }
    );
    console.log('Cleaned expired refresh tokens');

    // ============================================
    // PASSWORD CHANGE
    // ============================================
    console.log('\n🔑 PASSWORD CHANGE');
    console.log('─'.repeat(50));

    const userToUpdate = await User.findById(foundUser._id).select('+password');
    if (userToUpdate) {
      userToUpdate.password = 'NewSecurePassword456!';
      await userToUpdate.save();
      console.log('Password changed successfully');
      console.log(`passwordChangedAt: ${userToUpdate.passwordChangedAt}`);
    }

    // ============================================
    // SECURITY BEST PRACTICES
    // ============================================
    console.log('\n💡 AUTH SECURITY BEST PRACTICES:');
    console.log('─'.repeat(50));
    console.log('1. Never store plain-text passwords');
    console.log('2. Use bcrypt with cost factor >= 12');
    console.log('3. Use select: false for sensitive fields');
    console.log('4. Implement rate limiting on auth endpoints');
    console.log('5. Use HTTP-only cookies for tokens');
    console.log('6. Implement token refresh rotation');
    console.log('7. Track passwordChangedAt for token invalidation');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connection closed');
  }
}

main();
