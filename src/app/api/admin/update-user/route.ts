import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
    try {
        const { userId, name, email, phone, username, role, adminId } = await req.json();

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

        // Check if role is being changed
        if (role && role !== user.role) {
            // Verify that the admin making the change is an admin
            if (adminId) {
                const admin = await User.findById(adminId);
                if (!admin || admin.role !== 'admin') {
                    return NextResponse.json(
                        { error: 'Only administrators can change user roles' },
                        { status: 403 }
                    );
                }
            } else {
                return NextResponse.json(
                    { error: 'Admin authentication required to change roles' },
                    { status: 403 }
                );
            }
        }

        // Update fields if provided
        if (name) user.name = name;
        if (email) user.email = email.toLowerCase();
        if (phone) user.phone = phone;
        if (username) user.username = username.toLowerCase();
        if (role && ['user', 'admin'].includes(role)) user.role = role;

        await user.save();

        return NextResponse.json(
            { 
                message: 'User updated successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update user' },
            { status: 500 }
        );
    }
}
