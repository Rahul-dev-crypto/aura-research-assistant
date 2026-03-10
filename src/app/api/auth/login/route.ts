import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const { emailOrUsername, password } = await req.json();

        // Validate required fields
        if (!emailOrUsername || !password) {
            return NextResponse.json(
                { error: 'Email/Username and password are required' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Find user by email or username
        const user = await User.findOne({
            $or: [
                { email: emailOrUsername.toLowerCase() },
                { username: emailOrUsername.toLowerCase() }
            ]
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check if user is suspended or banned
        if (user.status === 'suspended') {
            // Check if suspension has expired
            if (user.suspensionUntil && new Date() > new Date(user.suspensionUntil)) {
                // Auto-reactivate if suspension period is over
                user.status = 'active';
                user.suspensionUntil = undefined;
                user.suspensionReason = '';
                await user.save();
            } else {
                const daysLeft = user.suspensionUntil 
                    ? Math.ceil((new Date(user.suspensionUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
                const reason = user.suspensionReason || 'Violation of terms of service';
                return NextResponse.json(
                    { 
                        error: `Your account has been temporarily suspended. ${daysLeft > 0 ? `Suspension will be lifted in ${daysLeft} day(s).` : ''} Reason: ${reason}` 
                    },
                    { status: 403 }
                );
            }
        }

        if (user.status === 'banned') {
            const reason = user.suspensionReason || 'Violation of terms of service';
            return NextResponse.json(
                { error: `Your account has been permanently banned. Reason: ${reason}. Please contact support if you believe this is an error.` },
                { status: 403 }
            );
        }

        // Update login tracking
        user.lastLogin = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();

        // Return user data (excluding password)
        return NextResponse.json(
            {
                message: 'Login successful',
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
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to login' },
            { status: 500 }
        );
    }
}
