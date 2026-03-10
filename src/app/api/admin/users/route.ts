import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Get all users
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const users = await User.find({}).select('-password').sort({ createdAt: -1 });

        return NextResponse.json(
            {
                users: users.map(user => ({
                    id: user._id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status || 'active',
                    profileImage: user.profileImage,
                    createdAt: user.createdAt,
                    hasPassword: !!user.adminPasswordReference,
                }))
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get users error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

// Delete user
export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
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

        if (user.role === 'admin') {
            return NextResponse.json(
                { error: 'Cannot delete admin users' },
                { status: 403 }
            );
        }

        await User.findByIdAndDelete(userId);

        return NextResponse.json(
            { message: 'User deleted successfully' },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete user' },
            { status: 500 }
        );
    }
}
