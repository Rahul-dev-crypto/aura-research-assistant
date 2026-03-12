import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import apiKeyManager from '@/lib/apiKeyManager';

export async function POST(req: NextRequest) {
    let lastError: any = null;
    const maxRetries = apiKeyManager.getKeyCount() * 2;

    const body = await req.json();
    const { fileName, fileData, mimeType } = body;
    
    if (!fileName || !fileData) {
        return NextResponse.json({ error: 'File name and data required' }, { status: 400 });
    }
    
    console.log(`🔍 Analyzing: ${fileName}`);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const currentApiKey = apiKeyManager.getNextKey();
            
            if (!currentApiKey) {
                return NextResponse.json({ error: "No API keys available" }, { status: 500 });
            }

            const genAI = new GoogleGenerativeAI(currentApiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const keyInfo = apiKeyManager.getCurrentKeyInfo();
            console.log(`Analyzing with Gemini (Key ${keyInfo.index}/${keyInfo.total}, Attempt ${attempt + 1})...`);

            const prompt = `Analyze this research paper PDF and extract SPECIFIC information.

CRITICAL: 
1. Read the paper carefully
2. Extract ACTUAL data, numbers, methods, findings from THIS paper
3. Return ONLY valid JSON (no markdown, no code blocks)
4. Be SPECIFIC - use real findings from the paper

JSON structure:
{
  "title": "exact title from paper",
  "abstract": "3-4 sentences with SPECIFIC contribution",
  "methodology": "4-5 sentences with EXACT methods, tools, datasets used",
  "results": "4-5 sentences with ACTUAL numbers, percentages, data",
  "conclusions": "3-4 sentences with specific conclusions",
  "keyFindings": ["finding 1 with data", "finding 2 with data", "finding 3 with data", "finding 4 with data"],
  "researchGaps": ["gap 1", "gap 2", "gap 3"],
  "summary": "4-5 sentences about unique contribution"
}`;

            const imagePart = { inlineData: { data: fileData, mimeType: mimeType || 'application/pdf' } };
            
            const result = await model.generateContent([prompt, imagePart]);
            const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const analysis = JSON.parse(text);
            
            console.log('✓ Analysis completed');
            
            return NextResponse.json({
                analysis,
                referencePapers: [],
                pdfLinks: [],
                referencesUsed: 0,
                message: 'Analysis completed'
            }, { status: 200 });
            
        } catch (error: any) {
            lastError = error;
            
            const shouldRotateKey = error?.message && (
                error.message.includes("quota") || 
                error.message.includes("RESOURCE_EXHAUSTED") ||
                error.message.includes("429") ||
                error.message.includes("rate limit")
            );

            if (shouldRotateKey) {
                console.log(`→ Rate limit hit, rotating to next key...`);
                continue;
            } else {
                console.log(`→ Error, trying next key anyway...`);
                continue;
            }
        }
    }

    console.error("⚠ All API keys exhausted");
    return NextResponse.json(
        { error: "All API keys are currently unavailable. Please try again later." },
        { status: 429 }
    );
}
