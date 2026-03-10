import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { encryptPassword } from '@/lib/encryption';

export async function POST(req: NextRequest) {
    try {
        const { name, username, email, phone, password } = await req.json();

        // Validate required fields
        if (!name || !username || !email || !phone || !password) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Validate password length
        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Validate username length
        if (username.length < 3) {
            return NextResponse.json(
                { error: 'Username must be at least 3 characters' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() },
                { phone }
            ]
        });

        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return NextResponse.json(
                    { error: 'Email already registered' },
                    { status: 400 }
                );
            }
            if (existingUser.username === username.toLowerCase()) {
                return NextResponse.json(
                    { error: 'Username already taken' },
                    { status: 400 }
                );
            }
            if (existingUser.phone === phone) {
                return NextResponse.json(
                    { error: 'Phone number already registered' },
                    { status: 400 }
                );
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = await User.create({
            name,
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            phone,
            password: hashedPassword,
            adminPasswordReference: encryptPassword(password),
        });

        return NextResponse.json(
            {
                message: 'Account created successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    role: user.role || 'user',
                    isSuperAdmin: user.isSuperAdmin || false,
                    profileImage: user.profileImage || '',
                }
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create account' },
            { status: 500 }
        );
    }
}
