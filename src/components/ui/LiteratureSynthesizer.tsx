"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchNormal, DocumentCopy, MagicStar, Save2, Paperclip, CloseSquare, DocumentText } from "iconsax-react";

export function LiteratureSynthesizer() {
    const [query, setQuery] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachedFile(e.target.files[0]);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    const base64Data = reader.result.split(',')[1];
                    resolve(base64Data);
                } else {
                    reject(new Error("Failed to read file"));
                }
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleSave = async () => {
        if (!result) return;
        try {
            const res = await fetch("/api/research", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: query,
                    type: "synthesis",
                    content: result,
                    sourcePrompt: query
                }),
            });
            if (res.ok) {
                setIsSaved(true);
            }
        } catch (err) {
            console.error("Failed to save", err);
        }
    };

    const handleSearch = async () => {
        if (!query && !attachedFile) return;
        setIsGenerating(true);
        setResult(null);
        setIsSaved(false);
        const fileToSend = attachedFile;
        setAttachedFile(null); // Clear attachment UI immediately
        try {
            const systemPrompt = "You are an expert academic research assistant. The user will give you a topic. Write a highly professional, 1-paragraph literature review synthesis on the topic. Include 2 or 3 realistic-sounding inline citations in APA format (e.g., Smith & Doe, 2023). If a file is attached, read it carefully and answer based on its contents.";

            let filesPayload: any[] = [];
            if (fileToSend) {
                const base64 = await fileToBase64(fileToSend);
                filesPayload.push({
                    inlineData: {
                        data: base64,
                        mimeType: fileToSend.type || "application/octet-stream"
                    }
                });
            }

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: query || "Please analyze the attached document.",
                    system: systemPrompt,
                    files: filesPayload
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setResult(data.result);
            } else {
                setResult("Error: " + (data.error || "Could not generate synthesis."));
            }
        } catch (err) {
            setResult("Error connecting to the AI service.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <section className="px-6 py-24 max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4 text-white">
                    Literature <span className="text-gradient-primary">Synthesizer</span>
                </h2>
                <p className="text-[#999999]">Upload a document OR enter a topic to generate a literature review.</p>
            </div>

            <div className="flex flex-col gap-6 w-full mb-8">
                {/* File Upload Section */}
                {!attachedFile && !query && (
                    <div className="glass-card rounded-2xl p-6 border-2 border-dashed border-white/20">
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".pdf,.txt,.js,.ts,.py,.csv,.md,.json"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full p-6 hover:bg-white/5 rounded-xl transition-colors flex flex-col items-center gap-3"
                        >
                            <div className="p-4 rounded-full bg-[#4FACFE]/20">
                                <Paperclip size="32" className="text-[#4FACFE]" variant="Bold" />
                            </div>
                            <div className="text-center">
                                <p className="text-white font-bold text-lg mb-1">Upload Document</p>
                                <p className="text-[#999999] text-sm">PDF, TXT, MD, JSON, or code files</p>
                            </div>
                        </button>
                        
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-[#0A0A0A] text-[#999999]">OR</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Attached File Display */}
                <AnimatePresence>
                    {attachedFile && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-4 bg-gradient-to-r from-[#4FACFE]/10 to-[#00F260]/10 border border-[#4FACFE]/30 rounded-2xl flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <DocumentText size="28" className="text-[#4FACFE]" variant="Bold" />
                                <div>
                                    <p className="text-white font-bold">{attachedFile.name}</p>
                                    <p className="text-xs text-[#999999]">Ready to analyze</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setAttachedFile(null)} 
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <CloseSquare size="24" className="text-[#999999]" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Search Input */}
                {!attachedFile && (
                    <div className="glass-card rounded-2xl p-2 flex items-center w-full border border-white/10">
                        <div className="pl-4 w-full flex items-center gap-4">
                            <SearchNormal size="24" className="text-[#4FACFE]" variant="Bold" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g. Recent advancements in solid-state batteries..."
                                className="w-full bg-transparent border-none outline-none text-white text-lg placeholder:text-[#666666] py-4"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                    </div>
                )}

                {/* Generate Button */}
                {(query || attachedFile) && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={handleSearch}
                        disabled={isGenerating}
                        className="w-full py-4 bg-gradient-to-r from-[#4FACFE] to-[#00F260] text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-[#4FACFE]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                    <MagicStar size="24" variant="Bold" />
                                </motion.div>
                                Synthesizing Literature...
                            </>
                        ) : (
                            <>
                                <MagicStar size="24" variant="Bold" />
                                Generate Literature Review
                            </>
                        )}
                    </motion.button>
                )}
            </div>

            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass border border-[#4FACFE]/30 p-8 rounded-[32px] relative glow-cyan"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-[#4FACFE]/20">
                                <MagicStar size="24" className="text-[#4FACFE]" variant="Bulk" />
                            </div>
                            <h3 className="text-xl font-bold text-white">AI Synthesis</h3>
                        </div>
                        <div className="flex gap-2">
                            {isSaved ? (
                                <span className="text-xs px-3 py-1.5 rounded-full border border-green-500/50 text-green-400 bg-green-500/10 flex items-center">
                                    Saved to Dashboard
                                </span>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                                >
                                    <Save2 size="14" /> Save
                                </button>
                            )}
                            <button className="text-[#999999] hover:text-white transition-colors">
                                <DocumentCopy size="24" />
                            </button>
                        </div>
                    </div>
                    <p className="text-[#e2e2e2] leading-relaxed text-lg" style={{ fontFamily: "'Times New Roman', serif" }}>
                        {result}
                    </p>
                </motion.div>
            )}
        </section>
    );
}
