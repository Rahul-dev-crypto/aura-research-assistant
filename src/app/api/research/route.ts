import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import { ResearchItem } from '@/models/ResearchItem';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const role = searchParams.get('role');

        await connectMongo();
        
        // Admin can see all items, users only see their own
        let items;
        if (role === 'admin') {
            items = await ResearchItem.find({}).sort({ createdAt: -1 }).lean();
        } else if (userId) {
            items = await ResearchItem.find({ userId }).sort({ createdAt: -1 }).lean();
        } else {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        return NextResponse.json({ items });
    } catch (error: any) {
        console.error("Error fetching research items:", error);
        return NextResponse.json({ 
            error: "Failed to fetch research items.", 
            details: error.message 
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { userId, title, type, content, sourcePrompt } = await req.json();

        if (!userId || !title || !type || !content) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        await connectMongo();

        const newItem = new ResearchItem({
            userId,
            title,
            type,
            content,
            sourcePrompt
        });

        const savedItem = await newItem.save();
        return NextResponse.json({ success: true, item: savedItem });
    } catch (error: any) {
        console.error("Error saving research item:", error);
        return NextResponse.json({ error: "Failed to save research item." }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const userId = searchParams.get('userId');
        const role = searchParams.get('role');

        if (!id) {
            return NextResponse.json({ error: "Missing item ID." }, { status: 400 });
        }

        await connectMongo();
        
        // Admin can delete any item, users only their own
        let query: any = { _id: id };
        if (role !== 'admin') {
            query.userId = userId;
        }
        
        const deletedItem = await ResearchItem.findOneAndDelete(query);

        if (!deletedItem) {
            return NextResponse.json({ error: "Item not found or unauthorized." }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Item deleted successfully." });
    } catch (error: any) {
        console.error("Error deleting research item:", error);
        return NextResponse.json({ error: "Failed to delete research item." }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { id, userId, role, content } = await req.json();

        if (!id || !content) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        await connectMongo();
        
        // Admin can update any item, users only their own
        let query: any = { _id: id };
        if (role !== 'admin') {
            query.userId = userId;
        }
        
        const updatedItem = await ResearchItem.findOneAndUpdate(
            query,
            { content },
            { new: true }
        );

        if (!updatedItem) {
            return NextResponse.json({ error: "Item not found or unauthorized." }, { status: 404 });
        }

        return NextResponse.json({ success: true, item: updatedItem });
    } catch (error: any) {
        console.error("Error updating research item:", error);
        return NextResponse.json({ error: "Failed to update research item." }, { status: 500 });
    }
}
