"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { MessageQuestion, Copy, Save2, ArrowRotateRight, DocumentUpload, CloseCircle } from "iconsax-react";

interface GeneratedQuestion {
    question: string;
    type: string;
    rationale: string;
    how?: string;
    why?: string;
    what?: string;
    where?: string;
    when?: string;
    who?: string;
}

export function ResearchQuestionGenerator() {
    const [topic, setTopic] = useState("");
    const [field, setField] = useState("");
    const [description, setDescription] = useState("");
    const [researchType, setResearchType] = useState("exploratory");
    const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const researchTypes = [
        { value: "exploratory", label: "Exploratory", description: "Discover new insights" },
        { value: "descriptive", label: "Descriptive", description: "Describe phenomena" },
        { value: "explanatory", label: "Explanatory", description: "Explain relationships" },
        { value: "evaluative", label: "Evaluative", description: "Assess effectiveness" },
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
            alert('Please upload a PDF file.');
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
            
            const systemPrompt = `You are a research topic extraction assistant. Analyze this PDF and extract:
1. The main research topic or subject
2. The field of study
3. A brief description of the research context (2-3 sentences)

Return ONLY a JSON object with this structure:
{
  "topic": "<main topic>",
  "field": "<field of study>",
  "description": "<brief description>"
}`;

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: "Extract the research topic, field, and description from this document.",
                    system: systemPrompt,
                    files: [{
                        data: base64,
                        mimeType: file.type
                    }]
                }),
            });

            const data = await res.json();

            if (res.ok) {
                const cleanJsonStr = data.result
                    .replace(/```json/g, '')
                    .replace(/```/g, '')
                    .trim();
                
                const extracted = JSON.parse(cleanJsonStr);
                setTopic(extracted.topic || "");
                setField(extracted.field || "");
                setDescription(extracted.description || "");
            } else {
                throw new Error(data.error || 'Failed to extract information');
            }
        } catch (err) {
            console.error('Extraction error:', err);
            alert('Failed to extract information from PDF. Please fill in the fields manually.');
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

    const handleGenerate = async () => {
        if (!topic.trim()) {
            alert("Please enter a research topic.");
            return;
        }

        setIsGenerating(true);

        try {
            const systemPrompt = `You are an expert research methodology advisor. Generate 5 high-quality research questions based on the given topic and research type.

For each question, provide a COMPREHENSIVE analysis with detailed answers to multiple aspects:

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "<the research question>",
    "type": "<question type: What/How/Why/Where/When/Who>",
    "rationale": "<2-3 sentences explaining why this is an important research question>",
    "how": "<3-4 sentences explaining HOW to approach answering this question - methodology, data collection, analysis methods>",
    "why": "<3-4 sentences explaining WHY this question matters - significance, implications, contribution to field>",
    "what": "<3-4 sentences explaining WHAT you're investigating - key concepts, variables, phenomena being studied>",
    "where": "<2-3 sentences explaining WHERE this research applies - context, settings, populations, geographical scope>",
    "when": "<2-3 sentences explaining WHEN aspects - timeframe, temporal considerations, historical context if relevant>",
    "who": "<2-3 sentences explaining WHO is involved - target population, stakeholders, researchers, affected parties>"
  }
]

Make each answer detailed, specific, and actionable. Provide concrete guidance that a researcher can follow.`;

            const userPrompt = `Research Topic: ${topic}
${field ? `Field of Study: ${field}` : ''}
${description ? `Context: ${description}` : ''}
Research Type: ${researchType}

Generate 5 diverse, high-quality research questions that are appropriate for this ${researchType} research.${description ? ' Consider the provided context when formulating questions.' : ''}`;

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: userPrompt,
                    system: systemPrompt
                }),
            });

            const data = await res.json();

            if (res.ok) {
                const cleanJsonStr = data.result
                    .replace(/```json/g, '')
                    .replace(/```/g, '')
                    .trim();
                
                const parsedQuestions = JSON.parse(cleanJsonStr);
                setQuestions(parsedQuestions);
            } else {
                throw new Error(data.error || 'Failed to generate questions');
            }
        } catch (err) {
            console.error('Generation error:', err);
            alert('Failed to generate research questions. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyQuestion = (q: GeneratedQuestion, index: number) => {
        const text = `QUESTION ${index + 1}: ${q.type}
${q.question}

RATIONALE:
${q.rationale}

${q.how ? `HOW TO APPROACH:\n${q.how}\n\n` : ''}${q.why ? `WHY IT MATTERS:\n${q.why}\n\n` : ''}${q.what ? `WHAT TO INVESTIGATE:\n${q.what}\n\n` : ''}${q.where ? `WHERE IT APPLIES:\n${q.where}\n\n` : ''}${q.when ? `WHEN CONSIDERATIONS:\n${q.when}\n\n` : ''}${q.who ? `WHO IS INVOLVED:\n${q.who}` : ''}`;
        
        navigator.clipboard.writeText(text);
        alert('Question with full analysis copied to clipboard!');
    };

    const downloadQuestions = () => {
        if (questions.length === 0) return;

        const content = `RESEARCH QUESTIONS - COMPREHENSIVE ANALYSIS
${'='.repeat(80)}

Topic: ${topic}
${field ? `Field: ${field}` : ''}
Research Type: ${researchType}
${description ? `\nContext: ${description}` : ''}

${'='.repeat(80)}

${questions.map((q, i) => `
QUESTION ${i + 1}: ${q.type}
${'-'.repeat(80)}
${q.question}

RATIONALE:
${q.rationale}

${q.how ? `HOW TO APPROACH:\n${q.how}\n` : ''}
${q.why ? `WHY IT MATTERS:\n${q.why}\n` : ''}
${q.what ? `WHAT TO INVESTIGATE:\n${q.what}\n` : ''}
${q.where ? `WHERE IT APPLIES:\n${q.where}\n` : ''}
${q.when ? `WHEN CONSIDERATIONS:\n${q.when}\n` : ''}
${q.who ? `WHO IS INVOLVED:\n${q.who}\n` : ''}
`).join('\n')}

Generated by Research Assistant
`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `research_questions_${topic.replace(/[^a-z0-9]/gi, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const saveAllQuestions = async () => {
        if (questions.length === 0) return;

        const content = `<div style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000;">
<h1 style="font-size: 18pt; font-weight: bold; margin-bottom: 16px;">Research Questions: ${topic}</h1>
${field ? `<p style="margin-bottom: 12px;"><strong>Field:</strong> ${field}</p>` : ''}
<p style="margin-bottom: 24px;"><strong>Research Type:</strong> ${researchType}</p>

${questions.map((q, i) => `
<h2 style="font-size: 14pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">Question ${i + 1}: ${q.type}</h2>
<p style="text-align: justify; margin-bottom: 12px; font-size: 13pt; font-weight: bold;">${q.question}</p>
<p style="text-align: justify; margin-bottom: 12px;"><strong>Rationale:</strong> ${q.rationale}</p>
${q.how ? `<p style="text-align: justify; margin-bottom: 12px;"><strong>HOW to Approach:</strong> ${q.how}</p>` : ''}
${q.why ? `<p style="text-align: justify; margin-bottom: 12px;"><strong>WHY It Matters:</strong> ${q.why}</p>` : ''}
${q.what ? `<p style="text-align: justify; margin-bottom: 12px;"><strong>WHAT to Investigate:</strong> ${q.what}</p>` : ''}
${q.where ? `<p style="text-align: justify; margin-bottom: 12px;"><strong>WHERE It Applies:</strong> ${q.where}</p>` : ''}
${q.when ? `<p style="text-align: justify; margin-bottom: 12px;"><strong>WHEN Considerations:</strong> ${q.when}</p>` : ''}
${q.who ? `<p style="text-align: justify; margin-bottom: 12px;"><strong>WHO Is Involved:</strong> ${q.who}</p>` : ''}
`).join('')}
</div>`;

        try {
            const res = await fetch("/api/research", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: `Research Questions: ${topic}`,
                    type: "synthesis",
                    content: content,
                    sourcePrompt: `Generated research questions for: ${topic}`
                }),
            });

            if (res.ok) {
                alert('Research questions saved to Dashboard!');
            } else {
                throw new Error('Failed to save');
            }
        } catch (err) {
            console.error("Save error:", err);
            alert('Failed to save research questions.');
        }
    };

    return (
        <section className="px-6 py-24 max-w-6xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4 text-white">
                    <span className="text-gradient-hero">Research Question</span> Generator
                </h2>
                <p className="text-[#999999]">Generate focused, researchable questions for your study.</p>
            </div>

            <div className="glass-card rounded-[32px] p-8 md:p-12">
                {/* PDF Upload Section */}
                <div className="mb-8">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    
                    {!uploadedFile ? (
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isExtracting}
                            className="w-full p-6 border-2 border-dashed border-white/20 hover:border-[#4FACFE]/50 rounded-2xl transition-colors flex items-center justify-center gap-3 text-[#999999] hover:text-white disabled:opacity-50"
                        >
                            <DocumentUpload size="28" variant="Bold" />
                            <div className="text-left">
                                <p className="font-bold text-white">Upload PDF (Optional)</p>
                                <p className="text-sm">Auto-extract topic, field, and description from your document</p>
                            </div>
                        </motion.button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-gradient-to-r from-[#4FACFE]/10 to-[#00F260]/10 border border-[#4FACFE]/30 rounded-2xl flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <DocumentUpload size="28" className="text-[#4FACFE]" variant="Bold" />
                                <div>
                                    <p className="text-white font-bold">{uploadedFile.name}</p>
                                    <p className="text-xs text-[#999999]">{(uploadedFile.size / 1024).toFixed(1)} KB • Information extracted</p>
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

                {/* Input Section */}
                <div className="space-y-6 mb-8">
                    <div>
                        <label className="block text-white font-medium mb-3">Research Topic *</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Impact of social media on mental health"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] text-[15px]"
                            disabled={isExtracting}
                        />
                    </div>

                    <div>
                        <label className="block text-white font-medium mb-3">Field of Study (Optional)</label>
                        <input
                            type="text"
                            value={field}
                            onChange={(e) => setField(e.target.value)}
                            placeholder="e.g., Psychology, Computer Science, Environmental Science"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] text-[15px]"
                            disabled={isExtracting}
                        />
                    </div>

                    <div>
                        <label className="block text-white font-medium mb-3">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide a brief description of your research context, objectives, or background..."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] text-[15px] resize-none"
                            disabled={isExtracting}
                        />
                    </div>

                    <div>
                        <label className="block text-white font-medium mb-3">Research Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
                            {researchTypes.map((type) => (
                                <motion.button
                                    key={type.value}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setResearchType(type.value)}
                                    className={`p-4 rounded-xl transition-all text-left ${
                                        researchType === type.value
                                            ? 'bg-gradient-to-br from-[#4FACFE] to-[#00F260] text-white border-2 border-transparent'
                                            : 'bg-white/5 text-white border-2 border-white/10 hover:border-white/20'
                                    }`}
                                >
                                    <div className="font-bold text-sm mb-1">{type.label}</div>
                                    <div className="text-xs opacity-80">{type.description}</div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerate}
                        disabled={isGenerating || !topic.trim() || isExtracting}
                        className="w-full py-4 bg-gradient-to-r from-[#4FACFE] to-[#00F260] text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-[#4FACFE]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                    <ArrowRotateRight size="24" />
                                </motion.div>
                                Generating Questions...
                            </>
                        ) : isExtracting ? (
                            <>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                    <DocumentUpload size="24" />
                                </motion.div>
                                Extracting Information...
                            </>
                        ) : (
                            <>
                                <MessageQuestion size="24" variant="Bold" />
                                Generate Research Questions
                            </>
                        )}
                    </motion.button>
                </div>

                {/* Results Section */}
                {questions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-wrap gap-3">
                            <h3 className="text-2xl font-bold text-white">Generated Questions</h3>
                            <div className="flex gap-2 flex-wrap">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        const allText = questions.map((q, i) => `
QUESTION ${i + 1}: ${q.type}
${q.question}

RATIONALE: ${q.rationale}

${q.how ? `HOW TO APPROACH:\n${q.how}\n\n` : ''}${q.why ? `WHY IT MATTERS:\n${q.why}\n\n` : ''}${q.what ? `WHAT TO INVESTIGATE:\n${q.what}\n\n` : ''}${q.where ? `WHERE IT APPLIES:\n${q.where}\n\n` : ''}${q.when ? `WHEN CONSIDERATIONS:\n${q.when}\n\n` : ''}${q.who ? `WHO IS INVOLVED:\n${q.who}\n\n` : ''}
${'='.repeat(80)}
`).join('\n');
                                        navigator.clipboard.writeText(allText);
                                        alert('All questions copied to clipboard!');
                                    }}
                                    className="px-4 py-2 bg-[#9D4EDD] text-white rounded-xl hover:bg-[#9D4EDD]/90 transition-colors flex items-center gap-2 font-medium"
                                >
                                    <Copy size="18" />
                                    Copy All
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={downloadQuestions}
                                    className="px-4 py-2 bg-[#00F260] text-white rounded-xl hover:bg-[#00F260]/90 transition-colors flex items-center gap-2 font-medium"
                                >
                                    <DocumentUpload size="18" />
                                    Download
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={saveAllQuestions}
                                    className="px-4 py-2 bg-[#4FACFE] text-white rounded-xl hover:bg-[#4FACFE]/90 transition-colors flex items-center gap-2 font-medium"
                                >
                                    <Save2 size="18" />
                                    Save
                                </motion.button>
                            </div>
                        </div>

                        {questions.map((q, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-6 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl hover:border-[#4FACFE]/30 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4FACFE] to-[#00F260] flex items-center justify-center font-bold text-white">
                                            {index + 1}
                                        </div>
                                        <span className="px-3 py-1 bg-[#4FACFE]/20 text-[#4FACFE] rounded-full text-xs font-bold">
                                            {q.type}
                                        </span>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => copyQuestion(q, index)}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <Copy size="20" className="text-white" />
                                    </motion.button>
                                </div>

                                <p className="text-white text-xl font-bold mb-4 leading-relaxed" style={{ fontFamily: "'Times New Roman', serif" }}>
                                    {q.question}
                                </p>

                                <div className="space-y-4">
                                    {/* Rationale */}
                                    <div className="p-4 bg-gradient-to-br from-[#4FACFE]/10 to-[#00F260]/10 border border-[#4FACFE]/20 rounded-xl">
                                        <p className="text-sm text-[#4FACFE] mb-2 font-bold flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-[#4FACFE]"></span>
                                            Rationale
                                        </p>
                                        <p className="text-[#e2e2e2] text-sm leading-relaxed">{q.rationale}</p>
                                    </div>

                                    {/* Comprehensive Analysis Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {/* HOW */}
                                        {q.how && (
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                <p className="text-sm text-[#00F260] mb-2 font-bold flex items-center gap-2">
                                                    <span className="text-lg">🔧</span>
                                                    HOW to Approach
                                                </p>
                                                <p className="text-[#cccccc] text-sm leading-relaxed">{q.how}</p>
                                            </div>
                                        )}

                                        {/* WHY */}
                                        {q.why && (
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                <p className="text-sm text-[#FF4E50] mb-2 font-bold flex items-center gap-2">
                                                    <span className="text-lg">💡</span>
                                                    WHY It Matters
                                                </p>
                                                <p className="text-[#cccccc] text-sm leading-relaxed">{q.why}</p>
                                            </div>
                                        )}

                                        {/* WHAT */}
                                        {q.what && (
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                <p className="text-sm text-[#4FACFE] mb-2 font-bold flex items-center gap-2">
                                                    <span className="text-lg">📊</span>
                                                    WHAT to Investigate
                                                </p>
                                                <p className="text-[#cccccc] text-sm leading-relaxed">{q.what}</p>
                                            </div>
                                        )}

                                        {/* WHERE */}
                                        {q.where && (
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                <p className="text-sm text-[#FFA500] mb-2 font-bold flex items-center gap-2">
                                                    <span className="text-lg">📍</span>
                                                    WHERE It Applies
                                                </p>
                                                <p className="text-[#cccccc] text-sm leading-relaxed">{q.where}</p>
                                            </div>
                                        )}

                                        {/* WHEN */}
                                        {q.when && (
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                <p className="text-sm text-[#9D4EDD] mb-2 font-bold flex items-center gap-2">
                                                    <span className="text-lg">⏰</span>
                                                    WHEN Considerations
                                                </p>
                                                <p className="text-[#cccccc] text-sm leading-relaxed">{q.when}</p>
                                            </div>
                                        )}

                                        {/* WHO */}
                                        {q.who && (
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                <p className="text-sm text-[#06FFA5] mb-2 font-bold flex items-center gap-2">
                                                    <span className="text-lg">👥</span>
                                                    WHO Is Involved
                                                </p>
                                                <p className="text-[#cccccc] text-sm leading-relaxed">{q.who}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Tips Section */}
                <div className="mt-8 p-6 bg-gradient-to-br from-[#4FACFE]/10 to-[#00F260]/10 rounded-2xl border border-[#4FACFE]/20">
                    <h4 className="text-lg font-bold text-white mb-3">💡 Tips for Strong Research Questions:</h4>
                    <ul className="space-y-2 text-[#CCCCCC] text-sm">
                        <li>• Upload a PDF to automatically extract topic and context</li>
                        <li>• Be specific about your topic to get more focused questions</li>
                        <li>• Add a description to provide more context for better questions</li>
                        <li>• Choose the research type that matches your study goals</li>
                        <li>• Good questions are clear, focused, and researchable</li>
                        <li>• Consider feasibility - can you actually answer this question?</li>
                        <li>• Questions should be significant and contribute to your field</li>
                        <li>• You can generate multiple times to explore different angles</li>
                    </ul>
                </div>
            </div>
        </section>
    );
}
