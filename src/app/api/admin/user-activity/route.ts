import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { ResearchItem } from '@/models/ResearchItem';
import { Citation } from '@/models/Citation';

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

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get all research items for this user
        const items = await ResearchItem.find({ userId }).sort({ createdAt: -1 });
        
        // Get all citations for this user
        const citations = await Citation.find({ userId }).sort({ createdAt: -1 });

        // Calculate statistics
        const stats = {
            user: {
                name: user.name,
                email: user.email,
                username: user.username,
                phone: user.phone,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
                loginCount: user.loginCount || 0,
                isGoogleUser: !!user.googleId,
            },
            totalDocuments: items.length,
            totalCitations: citations.length,
            byType: {} as Record<string, number>,
            recentActivity: items.slice(0, 10).map(item => ({
                id: item._id,
                title: item.title,
                type: item.type,
                createdAt: item.createdAt,
            })),
            recentCitations: citations.slice(0, 5).map(citation => ({
                id: citation._id,
                title: citation.title,
                authors: citation.authors,
                year: citation.year,
                createdAt: citation.createdAt,
            })),
            lastActive: items.length > 0 ? items[0].createdAt : null,
        };

        // Count by type
        items.forEach(item => {
            stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
        });

        return NextResponse.json(stats, { status: 200 });
    } catch (error: any) {
        console.error('Get user activity error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch user activity' },
            { status: 500 }
        );
    }
}
