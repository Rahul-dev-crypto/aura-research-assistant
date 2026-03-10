import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { encryptPassword } from '@/lib/encryption';

export async function POST(req: NextRequest) {
    try {
        const { email, name, googleId } = await req.json();

        if (!email || !name) {
            return NextResponse.json(
                { error: 'Email and name are required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            // Check if user is suspended or banned
            if (existingUser.status === 'suspended') {
                // Check if suspension has expired
                if (existingUser.suspensionUntil && new Date() > new Date(existingUser.suspensionUntil)) {
                    // Auto-reactivate if suspension period is over
                    existingUser.status = 'active';
                    existingUser.suspensionUntil = undefined;
                    existingUser.suspensionReason = '';
                    await existingUser.save();
                } else {
                    const daysLeft = existingUser.suspensionUntil 
                        ? Math.ceil((new Date(existingUser.suspensionUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                    const reason = existingUser.suspensionReason || 'Violation of terms of service';
                    return NextResponse.json(
                        { 
                            error: `Your account has been temporarily suspended. ${daysLeft > 0 ? `Suspension will be lifted in ${daysLeft} day(s).` : ''} Reason: ${reason}` 
                        },
                        { status: 403 }
                    );
                }
            }

            if (existingUser.status === 'banned') {
                const reason = existingUser.suspensionReason || 'Violation of terms of service';
                return NextResponse.json(
                    { error: `Your account has been permanently banned. Reason: ${reason}. Please contact support if you believe this is an error.` },
                    { status: 403 }
                );
            }

            // Update login tracking
            existingUser.lastLogin = new Date();
            existingUser.loginCount = (existingUser.loginCount || 0) + 1;
            await existingUser.save();

            // User exists, log them in
            return NextResponse.json(
                {
                    message: 'Login successful',
                    user: {
                        id: existingUser._id,
                        name: existingUser.name,
                        username: existingUser.username,
                        email: existingUser.email,
                        phone: existingUser.phone,
                        role: existingUser.role || 'user',
                        isSuperAdmin: existingUser.isSuperAdmin || false,
                        profileImage: existingUser.profileImage || '',
                    }
                },
                { status: 200 }
            );
        } else {
            // New user, return flag to show additional info form
            // Generate username from email
            const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            let suggestedUsername = emailPrefix;
            
            // Check if username exists and make it unique
            let usernameExists = await User.findOne({ username: suggestedUsername });
            let counter = 1;
            while (usernameExists) {
                suggestedUsername = `${emailPrefix}${counter}`;
                usernameExists = await User.findOne({ username: suggestedUsername });
                counter++;
            }

            return NextResponse.json(
                {
                    isNewUser: true,
                    email,
                    name,
                    suggestedUsername,
                    googleId
                },
                { status: 200 }
            );
        }
    } catch (error: any) {
        console.error('Google auth error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to authenticate with Google' },
            { status: 500 }
        );
    }
}

// Complete Google registration for new users
export async function PUT(req: NextRequest) {
    try {
        const { email, name, username, phone, password, googleId } = await req.json();

        if (!email || !name || !username || !phone || !password) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if username or phone already exists
        const existingUsername = await User.findOne({ username: username.toLowerCase() });
        if (existingUsername) {
            return NextResponse.json(
                { error: 'Username already taken' },
                { status: 400 }
            );
        }

        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return NextResponse.json(
                { error: 'Phone number already registered' },
                { status: 400 }
            );
        }

        // Hash password for authentication
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Encrypt password for admin viewing
        const encryptedPassword = encryptPassword(password);

        // Create new user
        const newUser = await User.create({
            name,
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            phone,
            password: hashedPassword,
            adminPasswordReference: encryptedPassword,
            role: 'user',
            googleId: googleId || undefined,
        });

        return NextResponse.json(
            {
                message: 'Registration successful',
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    username: newUser.username,
                    email: newUser.email,
                    phone: newUser.phone,
                    role: newUser.role,
                    isSuperAdmin: newUser.isSuperAdmin || false,
                    profileImage: newUser.profileImage || '',
                }
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Google registration error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to complete registration' },
            { status: 500 }
        );
    }
}
