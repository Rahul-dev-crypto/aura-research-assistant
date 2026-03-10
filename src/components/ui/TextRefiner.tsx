"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Magicpen, Copy, DocumentDownload, TickCircle, ArrowRotateLeft, DocumentUpload, CloseCircle } from "iconsax-react";

export function TextRefiner() {
    const [inputText, setInputText] = useState("");
    const [refinedText, setRefinedText] = useState("");
    const [isRefining, setIsRefining] = useState(false);
    const [selectedAction, setSelectedAction] = useState<string>("");
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const refineActions = [
        { id: "grammar", label: "Fix Grammar", prompt: "Fix all grammatical errors, spelling mistakes, and punctuation issues. Maintain the original meaning and style." },
        { id: "professional", label: "Make Professional", prompt: "Rewrite this text in a more professional and formal academic tone suitable for research papers." },
        { id: "concise", label: "Make Concise", prompt: "Make this text more concise and clear while preserving all key information and meaning." },
        { id: "expand", label: "Expand Details", prompt: "Expand this text with more details, examples, and explanations while maintaining academic rigor." },
        { id: "simplify", label: "Simplify", prompt: "Simplify this text to make it easier to understand while keeping the core message intact." },
        { id: "academic", label: "Academic Tone", prompt: "Rewrite this in a formal academic tone with appropriate scholarly language and structure." },
    ];

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file. Word documents are not supported yet.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB.');
            return;
        }

        setUploadedFile(file);
        setIsExtracting(true);

        try {
            const base64 = await fileToBase64(file);
            
            const systemPrompt = `You are a text extraction assistant. Extract ALL the text content from this PDF document. Return ONLY the extracted text without any explanations, formatting, or meta-commentary. Preserve paragraph breaks.`;

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: "Extract all text from this document.",
                    system: systemPrompt,
                    files: [{
                        data: base64,
                        mimeType: file.type
                    }]
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setInputText(data.result);
            } else {
                throw new Error(data.error || 'Failed to extract text');
            }
        } catch (err) {
            console.error('Extraction error:', err);
            alert('Failed to extract text from PDF. Please try again or paste text manually.');
            setUploadedFile(null);
        } finally {
            setIsExtracting(false);
        }
    };

    const removeFile = () => {
        setUploadedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRefine = async (action: typeof refineActions[0]) => {
        if (!inputText.trim()) {
            alert("Please enter some text or upload a file to refine.");
            return;
        }

        setSelectedAction(action.id);
        setIsRefining(true);

        try {
            const systemPrompt = `You are an expert academic editor and writing assistant. ${action.prompt}

IMPORTANT: Return ONLY the refined text without any explanations, introductions, or meta-commentary. Do not add phrases like "Here is the refined text:" or similar.`;

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: inputText,
                    system: systemPrompt
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setRefinedText(data.result);
            } else {
                throw new Error(data.error || 'Failed to refine text');
            }
        } catch (err) {
            console.error('Refine error:', err);
            alert('Failed to refine text. Please try again.');
        } finally {
            setIsRefining(false);
            setSelectedAction("");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const downloadAsText = (text: string, filename: string) => {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };

    const replaceOriginal = () => {
        setInputText(refinedText);
        setRefinedText("");
    };

    return (
        <section className="px-6 py-24 max-w-7xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4 text-white">
                    <span className="text-gradient-hero">AI Text</span> Refiner
                </h2>
                <p className="text-[#999999]">Improve your academic writing with AI-powered refinement tools.</p>
            </div>

            <div className="glass-card rounded-[32px] p-8 md:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Magicpen size="24" className="text-[#4FACFE]" variant="Bold" />
                                Original Text
                            </h3>
                            <span className="text-sm text-[#999999]">{inputText.length} characters</span>
                        </div>

                        {/* File Upload Section */}
                        <div className="mb-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            
                            {!uploadedFile ? (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isExtracting}
                                    className="w-full p-4 border-2 border-dashed border-white/20 hover:border-[#4FACFE]/50 rounded-2xl transition-colors flex items-center justify-center gap-3 text-[#999999] hover:text-white disabled:opacity-50"
                                >
                                    <DocumentUpload size="24" variant="Bold" />
                                    <span className="font-medium">Upload PDF to extract text</span>
                                </motion.button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <DocumentUpload size="24" className="text-[#4FACFE]" variant="Bold" />
                                        <div>
                                            <p className="text-white font-medium">{uploadedFile.name}</p>
                                            <p className="text-xs text-[#999999]">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={removeFile}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <CloseCircle size="24" className="text-[#999999]" />
                                    </motion.button>
                                </motion.div>
                            )}
                        </div>
                        
                        <div className="relative">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Paste or type your text here, or upload a PDF file above..."
                                className="w-full h-[400px] bg-white/5 border border-white/10 rounded-2xl p-6 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] resize-none text-[15px] leading-relaxed"
                                style={{ fontFamily: "'Times New Roman', serif" }}
                                disabled={isExtracting}
                            />
                            
                            {isExtracting && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-3">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                            <DocumentUpload size="48" className="text-[#4FACFE]" variant="Bold" />
                                        </motion.div>
                                        <p className="text-white font-medium">Extracting text from PDF...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            {refineActions.map((action) => (
                                <motion.button
                                    key={action.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleRefine(action)}
                                    disabled={isRefining || !inputText.trim() || isExtracting}
                                    className={`px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                                        selectedAction === action.id
                                            ? 'bg-gradient-to-r from-[#4FACFE] to-[#00F260] text-white'
                                            : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {selectedAction === action.id ? 'Refining...' : action.label}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <TickCircle size="24" className="text-[#00F260]" variant="Bold" />
                                Refined Text
                            </h3>
                            {refinedText && (
                                <span className="text-sm text-[#999999]">{refinedText.length} characters</span>
                            )}
                        </div>

                        <div className="relative">
                            <textarea
                                value={refinedText}
                                onChange={(e) => setRefinedText(e.target.value)}
                                placeholder="Refined text will appear here..."
                                className="w-full h-[400px] bg-white/5 border border-white/10 rounded-2xl p-6 text-white placeholder-[#666666] focus:outline-none focus:border-[#00F260] resize-none text-[15px] leading-relaxed"
                                style={{ fontFamily: "'Times New Roman', serif" }}
                                readOnly={!refinedText}
                            />
                            
                            {isRefining && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-3">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Magicpen size="48" className="text-[#4FACFE]" variant="Bold" />
                                        </motion.div>
                                        <p className="text-white font-medium">Refining your text...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons for Refined Text */}
                        {refinedText && (
                            <div className="flex flex-wrap gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => copyToClipboard(refinedText)}
                                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
                                >
                                    <Copy size="18" />
                                    Copy
                                </motion.button>
                                
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => downloadAsText(refinedText, 'refined_text.txt')}
                                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
                                >
                                    <DocumentDownload size="18" />
                                    Download
                                </motion.button>
                                
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={replaceOriginal}
                                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
                                >
                                    <ArrowRotateLeft size="18" />
                                    Replace Original
                                </motion.button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tips Section */}
                <div className="mt-8 p-6 bg-gradient-to-br from-[#4FACFE]/10 to-[#00F260]/10 rounded-2xl border border-[#4FACFE]/20">
                    <h4 className="text-lg font-bold text-white mb-3">💡 Tips for Best Results:</h4>
                    <ul className="space-y-2 text-[#CCCCCC] text-sm">
                        <li>• Upload a PDF file to automatically extract and refine its text</li>
                        <li>• Paste complete sentences or paragraphs for better context</li>
                        <li>• Use "Fix Grammar" for quick proofreading</li>
                        <li>• Try "Make Professional" for formal academic writing</li>
                        <li>• Use "Expand Details" when you need more depth</li>
                        <li>• You can edit the refined text before copying or downloading</li>
                        <li>• Use "Replace Original" to refine text multiple times</li>
                    </ul>
                </div>
            </div>
        </section>
    );
}
