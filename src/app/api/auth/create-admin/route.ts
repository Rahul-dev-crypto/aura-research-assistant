import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST() {
    try {
        await connectDB();

        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        
        if (existingAdmin) {
            return NextResponse.json(
                { message: 'Admin account already exists' },
                { status: 200 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin@123', 10);

        // Create admin user
        const admin = await User.create({
            name: 'Administrator',
            username: 'admin',
            email: 'admin@aura.com',
            phone: '0000000000',
            password: hashedPassword,
            role: 'admin',
            isSuperAdmin: true, // First admin is always super admin
        });

        return NextResponse.json(
            {
                message: 'Admin account created successfully',
                admin: {
                    username: admin.username,
                    email: admin.email,
                    role: admin.role,
                }
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Create admin error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create admin account' },
            { status: 500 }
        );
    }
}
