import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import apiKeyManager from '@/lib/apiKeyManager';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { topic, field, researchType } = body;
        if (!topic) return NextResponse.json({ error: 'Topic required' }, { status: 400 });
        const apiKey = apiKeyManager.getNextKey();
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = 'Generate 5 research questions about: ' + topic + '. Return JSON array with question, type, rationale, how, why, what, where, when, who fields.';
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const questions = JSON.parse(text);
        return NextResponse.json({ questions, topic, field: field || '', researchType: researchType || 'General' });
    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed to generate' }, { status: 500 });
    }
}