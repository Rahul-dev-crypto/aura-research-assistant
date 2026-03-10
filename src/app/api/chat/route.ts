import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import apiKeyManager from '@/lib/apiKeyManager';

export async function POST(req: Request) {
    let currentApiKey: string | null = null;
    let lastError: any = null;
    const maxRetries = apiKeyManager.getKeyCount() * 2; // Try each key twice (full rotation)
    let successfulRotations = 0;

    // Parse request body once
    const { prompt, system, files = [] } = await req.json();

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // Get next available API key
            currentApiKey = apiKeyManager.getNextKey();

            if (!currentApiKey) {
                console.error("No API keys available");
                return NextResponse.json(
                    { error: "Missing GEMINI_API_KEYS in environment variables." },
                    { status: 500 }
                );
            }

            const genAI = new GoogleGenerativeAI(currentApiKey);
            
            // Use gemini-2.5-flash - the latest and best free model
            // Better reasoning, faster, and improved performance over 1.5
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
            });

            // Format parts: the text prompt and any attached files
            const parts: any[] = [];
            
            // Add system instruction as part of the prompt
            if (system) {
                parts.push({ text: system + "\n\n" + prompt });
            } else {
                parts.push({ text: prompt });
            }

            if (files && files.length > 0) {
                files.forEach((file: any) => {
                    parts.push({
                        inlineData: {
                            data: file.data,
                            mimeType: file.mimeType
                        }
                    });
                });
            }

            const keyInfo = apiKeyManager.getCurrentKeyInfo();
            console.log(`Generating content with Gemini 2.5 Flash (Key ${keyInfo.index}/${keyInfo.total}, Attempt ${attempt + 1})...`);
            
            const result = await model.generateContent({
                contents: [{ role: "user", parts }],
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 16384, // Increased for long grant proposals
                },
            });
            
            const responseText = result.response.text();
            console.log("✓ Content generated successfully");

            return NextResponse.json({ result: responseText });

        } catch (error: any) {
            lastError = error;
            const errorMsg = error?.message || 'Unknown error';
            console.log(`✗ Key ${apiKeyManager.getCurrentKeyInfo().index} failed: ${errorMsg.substring(0, 100)}...`);
            
            // Check if it's a rate limit, quota, or temporary error that should trigger rotation
            const shouldRotateKey = error?.message && (
                error.message.includes("quota") || 
                error.message.includes("RESOURCE_EXHAUSTED") ||
                error.message.includes("429") ||
                error.message.includes("rate limit") ||
                error.message.includes("503") ||
                error.message.includes("high demand") ||
                error.message.includes("Service Unavailable")
            );

            if (shouldRotateKey && currentApiKey) {
                // Mark this key as exhausted and try next one
                apiKeyManager.markKeyAsExhausted(currentApiKey);
                
                // Track successful rotations
                if (attempt > 0 && attempt % apiKeyManager.getKeyCount() === 0) {
                    successfulRotations++;
                    console.log(`→ Completed rotation cycle ${successfulRotations}, starting over from first key...`);
                }
                
                console.log(`→ Rotating to next key...`);
                
                // Always continue to next key (infinite rotation)
                continue;
            } else {
                // For non-retryable errors (like invalid API key), still try next key
                console.log(`→ Non-quota error, trying next key anyway...`);
                continue;
            }
        }
    }

    // Only show error if ALL keys failed after multiple rotations
    console.error("⚠ All API keys exhausted after multiple rotation cycles");
    
    // Provide helpful error message
    let errorMessage = "All API keys are currently unavailable. ";
    if (lastError?.message) {
        if (lastError.message.includes("quota") || lastError.message.includes("RESOURCE_EXHAUSTED")) {
            errorMessage += `All ${apiKeyManager.getKeyCount()} keys have exceeded their daily quota (20 requests/day per key). The quota will reset in 24 hours. Consider adding more API keys.`;
        } else if (lastError.message.includes("503") || lastError.message.includes("high demand")) {
            errorMessage += "The Gemini API is experiencing high demand. Please try again in a few moments.";
        } else {
            errorMessage += lastError.message;
        }
    }
    
    return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
    );
}
