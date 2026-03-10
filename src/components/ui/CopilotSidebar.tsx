"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageText, ArrowUp, CloseCircle, Cpu, Copy, Trash, Messages2, Add, DocumentText1, Gallery } from "iconsax-react";

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    fileName?: string;
}

export function CopilotSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hi! I\'m your Research Assistant. I can help you with:\n\n• Research methodology advice\n• Literature review tips\n• Grant writing guidance\n• Citation formatting\n• Paper structure suggestions\n\nWhat would you like help with?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/jpg',
            'image/webp'
        ];

        if (!validTypes.includes(file.type)) {
            alert('Please upload a PDF or image file (JPG, PNG, WEBP). Word documents are not supported yet.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB.');
            return;
        }

        setUploadedFile(file);
        setInput(`Please analyze this file: ${file.name}`);
    };

    const handleSend = async () => {
        if ((!input.trim() && !uploadedFile) || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: input.trim() || `Uploaded: ${uploadedFile?.name}`,
            timestamp: new Date(),
            fileName: uploadedFile?.name
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input.trim();
        const currentFile = uploadedFile;
        setInput("");
        setUploadedFile(null);
        setIsLoading(true);

        try {
            const systemPrompt = `You are an AI Research Assistant helping researchers with academic work. 

When analyzing uploaded files:
- For PDFs: Carefully read and extract the main content, identify the research topic, methodology, key findings, and conclusions. Provide a comprehensive summary.
- For images: Describe what you see in detail, extract any visible text, identify charts/graphs/diagrams, and explain their significance.

Always provide:
1. A clear summary of the content
2. Key insights or findings
3. Relevant suggestions for the researcher
4. Answer any specific questions about the file

Be thorough, accurate, and helpful. If you cannot read the file properly, explain what you can see and ask for clarification.`;

            let requestBody: any = {
                prompt: currentInput || "Please provide a detailed analysis of this file, including its main content, key points, and any insights relevant to research.",
                system: systemPrompt
            };

            if (currentFile) {
                const base64 = await fileToBase64(currentFile);
                requestBody.files = [{
                    data: base64,
                    mimeType: currentFile.type
                }];
            }

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            const data = await res.json();

            if (res.ok) {
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: data.result,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (err) {
            console.error('Assistant error:', err);
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Sorry, I encountered an error analyzing your request. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const copyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
        alert('Copied to clipboard!');
    };

    const clearChat = () => {
        setMessages([{
            role: 'assistant',
            content: 'Hi! I\'m your Research Assistant. I can help you with:\n\n• Research methodology advice\n• Literature review tips\n• Grant writing guidance\n• Citation formatting\n• Paper structure suggestions\n\nWhat would you like help with?',
            timestamp: new Date()
        }]);
    };

    const quickPrompts = [
        "How do I structure a literature review?",
        "Tips for writing a strong research proposal",
        "What makes a good research question?",
        "How to cite sources in APA format?"
    ];

    return (
        <>
            {/* Floating Toggle Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-8 right-8 z-50 w-20 h-20 bg-gradient-to-br from-[#4FACFE] via-[#00F260] to-[#4FACFE] rounded-full shadow-2xl hover:shadow-[#4FACFE]/50 transition-all flex items-center justify-center"
                        title="Open Research Assistant"
                    >
                        <motion.div
                            animate={{ 
                                rotate: [0, 10, -10, 10, 0],
                            }}
                            transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 3
                            }}
                            className="relative"
                        >
                            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z" stroke="white" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M7 8H17M7 13H13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </motion.div>
                        
                        {/* Pulse effect */}
                        <motion.div
                            className="absolute inset-0 rounded-full bg-gradient-to-br from-[#4FACFE] to-[#00F260]"
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.5, 0, 0.5]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Sidebar Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        />

                        {/* Sidebar */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full lg:w-[450px] bg-gradient-to-b from-[#0A0A0A] to-[#050505] border-l border-white/10 z-50 flex flex-col shadow-2xl"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 bg-gradient-to-br from-[#4FACFE]/10 via-[#00F260]/5 to-transparent">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <motion.div 
                                            className="relative p-3 bg-gradient-to-br from-[#4FACFE] to-[#00F260] rounded-2xl shadow-lg"
                                            animate={{ 
                                                boxShadow: [
                                                    "0 0 20px rgba(79, 172, 254, 0.3)",
                                                    "0 0 30px rgba(0, 242, 96, 0.4)",
                                                    "0 0 20px rgba(79, 172, 254, 0.3)"
                                                ]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z" stroke="white" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M7 8H17M7 13H13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <motion.div
                                                className="absolute -top-1 -right-1 w-3 h-3 bg-[#4FACFE] rounded-full border-2 border-[#0A0A0A]"
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            />
                                        </motion.div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                                Research Assistant
                                            </h2>
                                            <p className="text-sm text-[#999999] font-medium">AI-powered research help</p>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                    >
                                        <CloseCircle size="28" className="text-[#999999]" />
                                    </motion.button>
                                </div>
                                
                                {/* Clear Chat Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={clearChat}
                                    className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all flex items-center justify-center gap-2 text-sm text-[#CCCCCC] border border-white/5 hover:border-white/10 font-medium"
                                >
                                    <Trash size="18" />
                                    Clear Chat History
                                </motion.button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {messages.map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] ${
                                            msg.role === 'user' 
                                                ? 'bg-gradient-to-br from-[#4FACFE] to-[#00F260] text-white shadow-lg shadow-[#4FACFE]/20' 
                                                : 'bg-gradient-to-br from-white/10 to-white/5 text-white border border-white/10'
                                        } rounded-2xl p-4 relative group`}>
                                            {msg.role === 'assistant' && (
                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z" stroke="#4FACFE" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                                                        <path d="M7 8H17M7 13H13" stroke="#4FACFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                    <span className="text-xs font-bold text-[#4FACFE]">Research Assistant</span>
                                                </div>
                                            )}
                                            {msg.fileName && (
                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
                                                    <DocumentText1 size="16" className="text-white/70" />
                                                    <span className="text-xs text-white/70">{msg.fileName}</span>
                                                </div>
                                            )}
                                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-normal">{msg.content}</p>
                                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                                                <span className="text-xs opacity-60 font-medium">
                                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {msg.role === 'assistant' && (
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => copyMessage(msg.content)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 hover:bg-white/10 rounded-lg flex items-center gap-1"
                                                    >
                                                        <Copy size="14" />
                                                        <span className="text-xs font-medium">Copy</span>
                                                    </motion.button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex justify-start"
                                    >
                                        <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z" stroke="#4FACFE" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M7 8H17M7 13H13" stroke="#4FACFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                <span className="text-xs font-bold text-[#4FACFE]">Research Assistant is thinking...</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <motion.div
                                                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                                                    className="w-2.5 h-2.5 bg-gradient-to-br from-[#4FACFE] to-[#00F260] rounded-full"
                                                />
                                                <motion.div
                                                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                                                    className="w-2.5 h-2.5 bg-gradient-to-br from-[#4FACFE] to-[#00F260] rounded-full"
                                                />
                                                <motion.div
                                                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                                                    className="w-2.5 h-2.5 bg-gradient-to-br from-[#4FACFE] to-[#00F260] rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Quick Prompts */}
                            {messages.length === 1 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="px-6 pb-4"
                                >
                                    <p className="text-xs text-[#999999] mb-3 font-medium">💡 Quick questions:</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {quickPrompts.map((prompt, idx) => (
                                            <motion.button
                                                key={idx}
                                                whileHover={{ scale: 1.02, x: 4 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setInput(prompt)}
                                                className="text-xs px-4 py-3 bg-gradient-to-r from-white/5 to-white/10 hover:from-white/10 hover:to-white/15 rounded-xl transition-all text-left text-[#CCCCCC] border border-white/5 hover:border-[#4FACFE]/30"
                                            >
                                                {prompt}
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Input */}
                            <div className="p-6 border-t border-white/10 bg-gradient-to-t from-[#0A0A0A] to-transparent">
                                {/* File upload indicator */}
                                {uploadedFile && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-3 p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            {uploadedFile.type.startsWith('image/') ? (
                                                <Gallery size="20" className="text-[#4FACFE]" variant="Bold" />
                                            ) : (
                                                <DocumentText1 size="20" className="text-[#4FACFE]" variant="Bold" />
                                            )}
                                            <span className="text-sm text-white font-medium">{uploadedFile.name}</span>
                                            <span className="text-xs text-[#999999]">({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => {
                                                setUploadedFile(null);
                                                setInput("");
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <CloseCircle size="20" className="text-[#999999]" />
                                        </motion.button>
                                    </motion.div>
                                )}
                                
                                <div className="flex gap-3 items-end">
                                    {/* Hidden file input */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    
                                    {/* Upload button */}
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all flex items-center justify-center"
                                        title="Upload file (PDF or Image)"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </motion.button>
                                    
                                    <div className="flex-1 relative">
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Ask me anything about research..."
                                            rows={2}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] focus:bg-white/10 resize-none text-[15px] transition-all font-normal"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSend}
                                        disabled={(!input.trim() && !uploadedFile) || isLoading}
                                        className="p-4 bg-gradient-to-br from-[#4FACFE] to-[#00F260] text-white rounded-2xl hover:shadow-lg hover:shadow-[#4FACFE]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[56px]"
                                        title="Send message"
                                    >
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
