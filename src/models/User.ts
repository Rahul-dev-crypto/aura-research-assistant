import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true,
    },
    username: {
        type: String,
        required: [true, 'Please provide a username'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'Username must be at least 3 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    isSuperAdmin: {
        type: Boolean,
        default: false,
    },
    profileImage: {
        type: String,
        default: '',
    },
    googleId: {
        type: String,
        sparse: true,
        unique: true,
    },
    adminPasswordReference: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'banned'],
        default: 'active',
    },
    suspensionReason: {
        type: String,
        default: '',
    },
    suspensionUntil: {
        type: Date,
    },
    lastLogin: {
        type: Date,
    },
    loginCount: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
