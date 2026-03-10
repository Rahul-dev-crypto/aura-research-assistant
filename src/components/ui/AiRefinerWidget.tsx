"use client";

import { useState } from "react";
import { Magicpen } from "iconsax-react";

export default function AiRefinerWidget({ content, onUpdate }: { content: string, onUpdate: (c: string) => void }) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRefine = async () => {
        if (!prompt.trim() || !content) return;
        setLoading(true);
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: `User instructions: ${prompt}`,
                    system: `You are an expert academic editor. Modify the following text according to the user's explicit instructions (like grammar fixes or rephrasing). Preserve markdown headers and lists.\n\nText:\n${content}`
                }),
            });

            const data = await res.json();
            if (res.ok && data.result) {
                onUpdate(data.result);
                setPrompt("");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-white/5 border border-white/10 p-2 items-center rounded-xl my-4 gap-2 text-[#e2e2e2]">
            <Magicpen className="text-purple-400" size={24} />
            <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Fix grammatical errors, Make it more professional..."
                className="flex-1 bg-transparent px-2 outline-none text-white text-sm"
            />
            <button
                onClick={handleRefine}
                disabled={loading || !prompt.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm transition-all"
            >
                {loading ? "Refining..." : "Refine"}
            </button>
        </div>
    );
}
