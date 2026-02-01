
const GEMINI_EMBED_MODEL = 'gemini-embedding-001';
const GEMINI_GENERATE_MODEL = 'gemini-2.5-flash';

const GEMINI_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBED_MODEL}:embedContent`;
const GEMINI_GENERATE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_GENERATE_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

export async function generateText(prompt: string): Promise<string> {
    try {
        const res = await fetch(GEMINI_GENERATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        if (!res.ok) {
            console.error('Gemini Generate failed:', await res.text());
            return '';
        }

        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
        console.error('Gemini Generate Error:', e);
        return '';
    }
}

export async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
    const res = await fetch(`${GEMINI_EMBED_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: `models/${GEMINI_EMBED_MODEL}`,
            content: { parts: [{ text: text.slice(0, 8000) }] },
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Embed failed: ${res.status} ${err}`);
    }
    const data = await res.json();
    const values = data?.embedding?.values;
    if (!Array.isArray(values)) throw new Error('Invalid embed response');
    return values;
}

export async function getEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
    const results: number[][] = [];
    for (let i = 0; i < texts.length; i++) {
        const vec = await getEmbedding(texts[i], apiKey);
        results.push(vec);
    }
    return results;
}
