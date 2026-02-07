
const fs = require('fs');
const key = process.env.GEMINI_API_KEY;

async function listModels() {
    if (!key) {
        console.error('No Gemini API ID found');
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    console.log('Fetching models...');

    try {
        const res = await fetch(url);
        const data = await res.json();

        fs.writeFileSync('models_log.txt', JSON.stringify(data, null, 2));
        console.log('Wrote processed models to models_log.txt');

    } catch (error) {
        console.error('Network error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        fs.writeFileSync('models_log.txt', 'Error: ' + errorMessage);
    }
}

listModels();
