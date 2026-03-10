"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lamp, CloseCircle, TickCircle, Edit2 } from "iconsax-react";

interface Suggestion {
    id: string;
    type: 'grammar' | 'style' | 'clarity' | 'citation' | 'tone';
    original: string;
    suggestion: string;
    reason: string;
    position: { start: number; end: number };
}

interface AIWritingAssistantProps {
    text: string;
    onApplySuggestion: (original: string, replacement: string) => void;
    isActive: boolean;
}

export function AIWritingAssistant({ text, onApplySuggestion, isActive }: AIWritingAssistantProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

    // Analyze text for suggestions
    const analyzeText = async () => {
        if (!text || text.length < 50) return;
        
        setIsAnalyzing(true);
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: `Analyze this academic text and provide 3-5 specific improvement suggestions. For each suggestion, identify the exact text to replace and provide a better version.

Text: "${text.substring(0, 1000)}"

Return ONLY a JSON array with this structure:
[
  {
    "type": "grammar|style|clarity|citation|tone",
    "original": "exact text from the document",
    "suggestion": "improved version",
    "reason": "brief explanation"
  }
]`,
                    system: "You are an academic writing assistant. Provide specific, actionable suggestions. Return only valid JSON."
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const cleanJson = data.result.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanJson);
                
                // Add IDs and positions
                const withIds = parsed.map((s: any, idx: number) => ({
                    ...s,
                    id: `suggestion-${Date.now()}-${idx}`,
                    position: findTextPosition(text, s.original)
                })).filter((s: any) => s.position.start !== -1);
                
                setSuggestions(withIds);
            }
        } catch (err) {
            console.error('Failed to analyze text:', err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Find position of text in document
    const findTextPosition = (fullText: string, searchText: string) => {
        const start = fullText.indexOf(searchText);
        if (start === -1) return { start: -1, end: -1 };
        return { start, end: start + searchText.length };
    };

    // Auto-analyze when text changes (debounced)
    useEffect(() => {
        if (!isActive) return;
        
        const timer = setTimeout(() => {
            analyzeText();
        }, 3000); // Wait 3 seconds after user stops typing

        return () => clearTimeout(timer);
    }, [text, isActive]);

    const applySuggestion = (suggestion: Suggestion) => {
        onApplySuggestion(suggestion.original, suggestion.suggestion);
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
        setSelectedSuggestion(null);
    };

    const dismissSuggestion = (id: string) => {
        setSuggestions(prev => prev.filter(s => s.id !== id));
        setSelectedSuggestion(null);
    };

    const getTypeColor = (type: string) => {
        const colors = {
            grammar: 'text-red-400 bg-red-500/20 border-red-500/30',
            style: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
            clarity: 'text-green-400 bg-green-500/20 border-green-500/30',
            citation: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
            tone: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
        };
        return colors[type as keyof typeof colors] || colors.style;
    };

    const getTypeLabel = (type: string) => {
        const labels = {
            grammar: 'Grammar',
            style: 'Style',
            clarity: 'Clarity',
            citation: 'Citation',
            tone: 'Tone'
        };
        return labels[type as keyof typeof labels] || 'Suggestion';
    };

    if (!isActive) return null;

    return (
        <div className="fixed right-6 top-32 w-96 max-h-[calc(100vh-200px)] overflow-y-auto bg-[#1a1a1a] border border-white/20 rounded-2xl shadow-2xl z-40">
            {/* Header */}
            <div className="sticky top-0 bg-[#1a1a1a] border-b border-white/10 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Lamp size="24" className="text-purple-400" variant="Bold" />
                        <h3 className="text-lg font-bold text-white">Writing Assistant</h3>
                    </div>
                    {isAnalyzing && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="text-purple-400"
                        >
                            <Edit2 size="20" />
                        </motion.div>
                    )}
                </div>
                <p className="text-xs text-[#999999] mt-1">
                    {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} found
                </p>
            </div>

            {/* Suggestions List */}
            <div className="p-4 space-y-3">
                <AnimatePresence>
                    {suggestions.length === 0 && !isAnalyzing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-8"
                        >
                            <Lamp size="48" className="text-[#666666] mx-auto mb-3" />
                            <p className="text-[#999999] text-sm">
                                Keep writing... I'll analyze your text and provide suggestions.
                            </p>
                        </motion.div>
                    )}

                    {suggestions.map((suggestion) => (
                        <motion.div
                            key={suggestion.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className={`p-4 rounded-xl border ${getTypeColor(suggestion.type)} ${
                                selectedSuggestion === suggestion.id ? 'ring-2 ring-white/20' : ''
                            }`}
                        >
                            {/* Type Badge */}
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase">
                                    {getTypeLabel(suggestion.type)}
                                </span>
                                <button
                                    onClick={() => dismissSuggestion(suggestion.id)}
                                    className="text-[#999999] hover:text-white transition-colors"
                                >
                                    <CloseCircle size="16" />
                                </button>
                            </div>

                            {/* Original Text */}
                            <div className="mb-2">
                                <p className="text-xs text-[#999999] mb-1">Original:</p>
                                <p className="text-sm text-white/70 line-through">{suggestion.original}</p>
                            </div>

                            {/* Suggestion */}
                            <div className="mb-2">
                                <p className="text-xs text-[#999999] mb-1">Suggestion:</p>
                                <p className="text-sm text-white font-medium">{suggestion.suggestion}</p>
                            </div>

                            {/* Reason */}
                            <p className="text-xs text-[#999999] mb-3">{suggestion.reason}</p>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => applySuggestion(suggestion)}
                                    className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <TickCircle size="16" />
                                    Apply
                                </button>
                                <button
                                    onClick={() => dismissSuggestion(suggestion.id)}
                                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Footer */}
            {suggestions.length > 0 && (
                <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-white/10 p-4">
                    <button
                        onClick={() => setSuggestions([])}
                        className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Dismiss All
                    </button>
                </div>
            )}
        </div>
    );
}
