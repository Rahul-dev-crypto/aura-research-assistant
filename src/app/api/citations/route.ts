import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import { Citation } from '@/models/Citation';

export async function GET() {
    try {
        await connectMongo();
        const citations = await Citation.find({}).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ citations });
    } catch (error: any) {
        console.error("Error fetching citations:", error);
        return NextResponse.json({ 
            error: "Failed to fetch citations.", 
            details: error.message 
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();

        if (!data.authors || !data.title || !data.year) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        await connectMongo();

        const newCitation = new Citation(data);
        const savedCitation = await newCitation.save();
        
        return NextResponse.json({ success: true, citation: savedCitation });
    } catch (error: any) {
        console.error("Error saving citation:", error);
        return NextResponse.json({ error: "Failed to save citation." }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { id, ...data } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "Missing citation ID." }, { status: 400 });
        }

        await connectMongo();
        const updatedCitation = await Citation.findByIdAndUpdate(
            id,
            data,
            { new: true }
        );

        if (!updatedCitation) {
            return NextResponse.json({ error: "Citation not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true, citation: updatedCitation });
    } catch (error: any) {
        console.error("Error updating citation:", error);
        return NextResponse.json({ error: "Failed to update citation." }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Missing citation ID." }, { status: 400 });
        }

        await connectMongo();
        const deletedCitation = await Citation.findByIdAndDelete(id);

        if (!deletedCitation) {
            return NextResponse.json({ error: "Citation not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Citation deleted successfully." });
    } catch (error: any) {
        console.error("Error deleting citation:", error);
        return NextResponse.json({ error: "Failed to delete citation." }, { status: 500 });
    }
}
