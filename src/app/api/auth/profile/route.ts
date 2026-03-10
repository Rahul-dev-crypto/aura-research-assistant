import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { encryptPassword } from '@/lib/encryption';

export async function PUT(req: NextRequest) {
    try {
        const { userId, name, email, phone, currentPassword, newPassword, profileImage } = await req.json();

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

        // Check if email is being changed and if it's already taken
        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
            if (existingEmail) {
                return NextResponse.json(
                    { error: 'Email already in use' },
                    { status: 400 }
                );
            }
            user.email = email.toLowerCase();
        }

        // Check if phone is being changed and if it's already taken
        if (phone && phone !== user.phone) {
            const existingPhone = await User.findOne({ phone, _id: { $ne: userId } });
            if (existingPhone) {
                return NextResponse.json(
                    { error: 'Phone number already in use' },
                    { status: 400 }
                );
            }
            user.phone = phone;
        }

        // Update name if provided
        if (name) {
            user.name = name;
        }

        // Update profile image if provided
        if (profileImage !== undefined) {
            user.profileImage = profileImage;
        }

        // Change password if both current and new passwords are provided
        if (currentPassword && newPassword) {
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            
            if (!isPasswordValid) {
                return NextResponse.json(
                    { error: 'Current password is incorrect' },
                    { status: 400 }
                );
            }

            if (newPassword.length < 6) {
                return NextResponse.json(
                    { error: 'New password must be at least 6 characters' },
                    { status: 400 }
                );
            }

            user.password = await bcrypt.hash(newPassword, 10);
            user.adminPasswordReference = encryptPassword(newPassword);
        }

        await user.save();

        return NextResponse.json(
            {
                message: 'Profile updated successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    profileImage: user.profileImage,
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Profile update error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update profile' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await User.findById(userId).select('-password');

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                user: {
                    id: user._id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    profileImage: user.profileImage,
                    role: user.role,
                    isSuperAdmin: user.isSuperAdmin,
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Get profile error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get profile' },
            { status: 500 }
        );
    }
}
