import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { encryptPassword } from '@/lib/encryption';

export async function POST(req: NextRequest) {
    try {
        const { userId, newPassword } = await req.json();

        if (!userId || !newPassword) {
            return NextResponse.json(
                { error: 'User ID and new password are required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Hash password for authentication
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Encrypt password for admin viewing
        const encryptedPassword = encryptPassword(newPassword);

        user.password = hashedPassword;
        user.adminPasswordReference = encryptedPassword;
        await user.save();

        return NextResponse.json(
            { 
                message: 'Password reset successfully',
                newPassword: newPassword // Return the plain password to admin
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to reset password' },
            { status: 500 }
        );
    }
}
