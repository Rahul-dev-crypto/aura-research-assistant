import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('query');
        const offset = searchParams.get('offset') || '0';
        const limit = searchParams.get('limit') || '10';

        if (!query) {
            return NextResponse.json(
                { error: 'Query parameter is required' },
                { status: 400 }
            );
        }

        // Fetch from Semantic Scholar API
        const semanticScholarUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&offset=${offset}&limit=${limit}&fields=title,abstract,year,authors,citationCount,url,openAccessPdf,venue,publicationDate`;
        
        const response = await fetch(semanticScholarUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Semantic Scholar API error:', response.status, errorText);
            
            if (response.status === 429) {
                return NextResponse.json(
                    { error: 'Rate limit exceeded. Please try again in a few moments.' },
                    { status: 429 }
                );
            }
            
            return NextResponse.json(
                { error: `API error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Papers API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch papers' },
            { status: 500 }
        );
    }
}
