import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { ResearchItem } from '@/models/ResearchItem';
import { Citation } from '@/models/Citation';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Prevent deleting admin users
        if (user.role === 'admin') {
            return NextResponse.json(
                { error: 'Cannot delete admin users' },
                { status: 403 }
            );
        }

        // Delete user's research items and citations
        await ResearchItem.deleteMany({ userId: userId });
        await Citation.deleteMany({ userId: userId });

        // Delete the user
        await User.findByIdAndDelete(userId);

        return NextResponse.json({
            success: true,
            message: 'User and associated data deleted successfully'
        });

    } catch (error: any) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete user' },
            { status: 500 }
        );
    }
}
