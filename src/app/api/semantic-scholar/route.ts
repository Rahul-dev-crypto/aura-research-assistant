import { NextResponse } from 'next/server';

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// API Key rotation for Semantic Scholar
let currentKeyIndex = 0;
const keyUsage = new Map<number, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_KEY = 90; // 90 requests per 5 minutes (leaving buffer)
const RESET_INTERVAL = 5 * 60 * 1000; // 5 minutes

function getSemanticScholarKeys(): string[] {
    const keys = process.env.SEMANTIC_SCHOLAR_API_KEYS || '';
    return keys.split(',').map(k => k.trim()).filter(k => k.length > 0);
}

function getNextApiKey(): string | null {
    const keys = getSemanticScholarKeys();
    
    if (keys.length === 0) {
        console.log('No Semantic Scholar API keys configured - using free tier');
        return null;
    }

    const now = Date.now();
    let attempts = 0;
    
    while (attempts < keys.length) {
        const usage = keyUsage.get(currentKeyIndex) || { count: 0, resetTime: now + RESET_INTERVAL };
        
        // Reset counter if time has passed
        if (now >= usage.resetTime) {
            usage.count = 0;
            usage.resetTime = now + RESET_INTERVAL;
        }
        
        // Check if current key is available
        if (usage.count < MAX_REQUESTS_PER_KEY) {
            usage.count++;
            keyUsage.set(currentKeyIndex, usage);
            const key = keys[currentKeyIndex];
            console.log(`Using Semantic Scholar API key ${currentKeyIndex + 1}/${keys.length} (Usage: ${usage.count}/${MAX_REQUESTS_PER_KEY})`);
            return key;
        }
        
        // Move to next key
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        attempts++;
    }
    
    console.log('All Semantic Scholar API keys exhausted - using free tier');
    return null;
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query');
        const limit = searchParams.get('limit') || '10';

        if (!query) {
            return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
        }

        // Check cache first
        const cacheKey = `${query}-${limit}`;
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('Returning cached results for:', query);
            return NextResponse.json(cached.data);
        }

        // Try with API key rotation
        let lastError: any = null;
        const maxRetries = Math.max(getSemanticScholarKeys().length, 1);
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const apiKey = getNextApiKey();
                
                // Add delay to respect rate limits
                if (attempt > 0) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

                const headers: any = {
                    'Accept': 'application/json',
                };
                
                // Add API key if available
                if (apiKey) {
                    headers['x-api-key'] = apiKey;
                }

                // Call Semantic Scholar API from server-side to avoid CORS
                const response = await fetch(
                    `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=title,authors,year,venue,abstract,citationCount,publicationDate,externalIds,paperId`,
                    { headers }
                );

                if (response.ok) {
                    const data = await response.json();
                    
                    // Transform the data
                    const papers = data.data?.map((paper: any) => ({
                        title: paper.title,
                        authors: paper.authors?.map((a: any) => a.name).join(', ') || 'Unknown',
                        year: paper.year || (paper.publicationDate ? new Date(paper.publicationDate).getFullYear() : null),
                        venue: paper.venue || 'Unknown Venue',
                        summary: paper.abstract ? (paper.abstract.substring(0, 200) + '...') : 'No abstract available',
                        citationCount: paper.citationCount || 0,
                        paperId: paper.paperId,
                        doi: paper.externalIds?.DOI,
                        arxivId: paper.externalIds?.ArXiv
                    })) || [];

                    const result = { 
                        success: true,
                        data: papers,
                        total: data.total || 0
                    };

                    // Cache the result
                    cache.set(cacheKey, { data: result, timestamp: Date.now() });

                    return NextResponse.json(result);
                }

                // If rate limited (429), try next key
                if (response.status === 429) {
                    console.log(`Rate limited on attempt ${attempt + 1}, trying next key...`);
                    lastError = { status: 429, message: 'Rate limited' };
                    continue;
                }

                // Other errors
                lastError = { status: response.status, message: response.statusText };
                console.error('Semantic Scholar API error:', response.status, response.statusText);
                break;

            } catch (error: any) {
                lastError = error;
                console.error(`Attempt ${attempt + 1} failed:`, error.message);
            }
        }

        // All attempts failed
        console.log('All API attempts exhausted, returning empty results');
        return NextResponse.json({ 
            success: true,
            data: [],
            total: 0,
            message: 'Unable to fetch papers at this time. Please try again later.'
        });

    } catch (error: any) {
        console.error('Semantic Scholar API route error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error.message,
            data: []
        }, { status: 500 });
    }
}
