import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
    try {
        const { userId, status, suspensionDays, suspensionReason } = await req.json();

        if (!userId || !status) {
            return NextResponse.json(
                { error: 'User ID and status are required' },
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
                { error: 'Cannot change admin status' },
                { status: 403 }
            );
        }

        user.status = status;
        
        // Handle suspension
        if (status === 'suspended' && suspensionDays) {
            const suspensionDate = new Date();
            suspensionDate.setDate(suspensionDate.getDate() + parseInt(suspensionDays));
            user.suspensionUntil = suspensionDate;
            user.suspensionReason = suspensionReason || 'Violation of terms of service';
        } else if (status === 'active') {
            // Clear suspension when activating
            user.suspensionUntil = undefined;
            user.suspensionReason = '';
        } else if (status === 'banned') {
            user.suspensionReason = suspensionReason || 'Permanently banned';
        }
        
        await user.save();

        return NextResponse.json(
            { 
                message: `User ${status} successfully`,
                suspensionUntil: user.suspensionUntil 
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Toggle status error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update user status' },
            { status: 500 }
        );
    }
}
