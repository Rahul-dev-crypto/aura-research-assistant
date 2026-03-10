import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const { email, username } = await req.json();

        if (!email && !username) {
            return NextResponse.json(
                { error: 'Email or username is required' },
                { status: 400 }
            );
        }

        // Find the admin user by email or username
        const query: any = { role: 'admin' };
        if (email) {
            query.email = email.toLowerCase();
        } else if (username) {
            query.username = username.toLowerCase();
        }

        const admin = await User.findOne(query);

        if (!admin) {
            return NextResponse.json(
                { error: 'Admin user not found' },
                { status: 404 }
            );
        }

        // Set as super admin
        admin.isSuperAdmin = true;
        await admin.save();

        return NextResponse.json(
            { 
                message: 'User upgraded to Super Admin successfully',
                user: {
                    name: admin.name,
                    username: admin.username,
                    email: admin.email,
                    role: admin.role,
                    isSuperAdmin: admin.isSuperAdmin
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Make super admin error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to make super admin' },
            { status: 500 }
        );
    }
}

// GET method to automatically upgrade the default admin account
export async function GET() {
    try {
        await connectDB();

        // Find the admin user with username "admin"
        const admin = await User.findOne({ username: 'admin', role: 'admin' });

        if (!admin) {
            return NextResponse.json(
                { error: 'Default admin account not found' },
                { status: 404 }
            );
        }

        // Set as super admin
        admin.isSuperAdmin = true;
        await admin.save();

        return NextResponse.json(
            { 
                message: 'Default admin account upgraded to Super Admin successfully',
                user: {
                    name: admin.name,
                    username: admin.username,
                    email: admin.email,
                    role: admin.role,
                    isSuperAdmin: admin.isSuperAdmin
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Make super admin error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to make super admin' },
            { status: 500 }
        );
    }
}
