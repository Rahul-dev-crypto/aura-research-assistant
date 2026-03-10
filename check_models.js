const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const keyMatch = envContent.match(/GEMINI_API_KEY=(.*)/);
if (!keyMatch) {
    console.error("No key found");
    process.exit(1);
}
const apiKey = keyMatch[1].trim();

async function run() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) {
            console.error(data.error);
        } else {
            console.log("Found models:");
            data.models.forEach(m => console.log(m.name));
        }
    } catch (e) {
        console.error(e);
    }
}
run();
