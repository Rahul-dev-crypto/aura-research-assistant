import fs from 'fs';
import dotenv from 'dotenv';
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const apiKey = envConfig.GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API key found in .env.local");
    process.exit(1);
}

async function checkModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log("Available models:");
        data.models.forEach(m => console.log(m.name));
    } catch (e) {
        console.error("Failed to fetch models", e);
    }
}
checkModels();
