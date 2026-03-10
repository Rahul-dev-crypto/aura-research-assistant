import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { decryptPassword } from '@/lib/encryption';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const { userId, adminId } = await request.json();

        if (!userId || !adminId) {
            return NextResponse.json(
                { error: 'User ID and Admin ID are required' },
                { status: 400 }
            );
        }

        // Verify admin
        const admin = await User.findById(adminId);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized: Admin access required' },
                { status: 403 }
            );
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Decrypt and return the password
        const decryptedPassword = user.adminPasswordReference 
            ? decryptPassword(user.adminPasswordReference)
            : '';

        return NextResponse.json({
            success: true,
            password: decryptedPassword || 'Password not available (Google OAuth user)',
            isGoogleUser: !!user.googleId
        });

    } catch (error: any) {
        console.error('View password error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to retrieve password' },
            { status: 500 }
        );
    }
}
