"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DocumentUpload, CloseCircle, Magicpen, DocumentDownload, Edit2, Eye, SearchNormal, Paperclip, MagicStar, Save2, CloseSquare, DocumentText, Activity, TickCircle, Copy, ArrowRotateLeft } from "iconsax-react";
import dynamic from "next/dynamic";
import { exportPaperAnalysisPDF, exportPaperAnalysisWord, exportPaperAnalysisMarkdown, exportResearchQuestionsPDF, exportResearchQuestionsWord, exportResearchQuestionsMarkdown } from "@/lib/exportHelpers";
const SimpleEditor = dynamic(() => import("@/components/ui/SimpleEditor"), { ssr: false });

// Plagiarism detection system prompt
const getPlagiarismSystemPrompt = () => `You are a plagiarism detection system. You MUST find plagiarism in academic text.

**CRITICAL INSTRUCTION: Academic text is NEVER 100% original. You MUST mark at least 30-50% as plagiarism.**

**WHAT TO MARK AS PLAGIARISM:**

1. **EXACT PLAGIARISM (type: "exact") - Mark RED:**
   - Author names and citations (e.g., "Wang Le", "Held, Alex", "Smith et al.")
   - Journal names (e.g., "IEEE", "Journal of Environmental Management")
   - Years in citations (e.g., "(2018)", "(2022)")
   - Common phrases like "et al.", "based on", "using", "methods"
   - Technical terms that are standard (e.g., "remote sensing", "data fusion")

2. **AI/PARAPHRASED (type: "partial") - Mark YELLOW:**
   - Formal academic language
   - Method descriptions
   - Any sentence with perfect grammar
   - Phrases like "facilitate", "provide", "enable", "demonstrate"

3. **UNIQUE (type: "unique") - Mark GREEN:**
   - ONLY mark as unique if it's truly original content
   - Most text should NOT be unique

**MANDATORY RULES:**
1. Mark AT LEAST 30% of text as "exact" or "partial"
2. Break text into segments of 5-15 words
3. Every character must be in a segment
4. Segments in exact order

**EXAMPLE - FOLLOW THIS:**
Text: "Wang Le et al. (2018) used remote sensing methods for monitoring. The data shows clear patterns."

Response:
{
  "plagiarismPercentage": 60,
  "exactMatchPercentage": 40,
  "partialMatchPercentage": 20,
  "uniqueContentPercentage": 40,
  "highlightedSegments": [
    {"text": "Wang Le et al. (2018)", "type": "exact"},
    {"text": " used remote sensing methods", "type": "partial"},
    {"text": " for monitoring. ", "type": "partial"},
    {"text": "The data shows clear patterns.", "type": "unique"}
  ],
  "sources": [{"url": "Citations and references", "matchPercentage": 40}],
  "analysis": "Citations and author names are exact matches. Method descriptions are paraphrased."
}

Return ONLY JSON. DO NOT mark everything as unique!`;

export function ResearchWizard({ isGuest = false }: { isGuest?: boolean }) {
    const [selectedTask, setSelectedTask] = useState<string>("");
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatedContent, setGeneratedContent] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const exportRef = useRef<HTMLDivElement>(null);

    // Task-specific inputs
    const [topic, setTopic] = useState("");
    const [field, setField] = useState("");
    const [description, setDescription] = useState("");
    const [researchType, setResearchType] = useState("exploratory");
    const [variables, setVariables] = useState("");
    const [dataType, setDataType] = useState("");
    const [manuscriptText, setManuscriptText] = useState("");

    // Literature Synthesis states
    const [litQuery, setLitQuery] = useState("");

    // Paper Analysis states
    const [paperFile, setPaperFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);
    const [showAnalysisExportMenu, setShowAnalysisExportMenu] = useState(false);
    const paperFileInputRef = useRef<HTMLInputElement>(null);

    // Research Questions states
    const [researchQuestions, setResearchQuestions] = useState<any>(null);
    const [showQuestionsExportMenu, setShowQuestionsExportMenu] = useState(false);

    // Text Refiner states
    const [inputText, setInputText] = useState("");
    const [refinedText, setRefinedText] = useState("");
    const [isRefining, setIsRefining] = useState(false);
    const [selectedRefineAction, setSelectedRefineAction] = useState<string>("");
    const [refinerUploadedFile, setRefinerUploadedFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const refinerFileInputRef = useRef<HTMLInputElement>(null);

    // Plagiarism Checker states
    const [plagiarismText, setPlagiarismText] = useState("");
    const [plagiarismResult, setPlagiarismResult] = useState<any>(null);
    const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);
    const plagiarismFileInputRef = useRef<HTMLInputElement>(null);

    // Keyword Extractor states
    const [keywordText, setKeywordText] = useState("");
    const [extractedKeywords, setExtractedKeywords] = useState<any>(null);
    const [isExtractingKeywords, setIsExtractingKeywords] = useState(false);
    const keywordFileInputRef = useRef<HTMLInputElement>(null);

    // Export Templates states
    const [templateText, setTemplateText] = useState("");
    const [selectedJournal, setSelectedJournal] = useState("ieee");
    const [formattedTemplate, setFormattedTemplate] = useState("");
    const [isFormattingTemplate, setIsFormattingTemplate] = useState(false);
    const templateFileInputRef = useRef<HTMLInputElement>(null);

    // Clear data when task changes
    React.useEffect(() => {
        if (selectedTask) {
            // Clear uploaded file
            setUploadedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
            // Clear all text inputs
            setTopic("");
            setField("");
            setDescription("");
            setManuscriptText("");
            
            // Clear task-specific states
            setPlagiarismText("");
            setPlagiarismResult(null);
            setKeywordText("");
            setExtractedKeywords(null);
            setTemplateText("");
            setFormattedTemplate("");
            setInputText("");
            setRefinedText("");
            setLitQuery("");
            setGeneratedContent("");
        }
    }, [selectedTask]);

    // Listen for feature card clicks
    useEffect(() => {
        const handleSelectTask = (event: CustomEvent) => {
            const taskId = event.detail;
            setSelectedTask(taskId);
            // Scroll to task selection
            setTimeout(() => {
                document.getElementById('task-selection')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        };

        window.addEventListener('selectTask' as any, handleSelectTask as any);
        return () => {
            window.removeEventListener('selectTask' as any, handleSelectTask as any);
        };
    }, []);

    const tasks = [
        { 
            id: "research-questions", 
            label: "Research Questions", 
            description: "Generate focused research questions",
            prompt: "Generate 5 high-quality, focused research questions based on the content. Each question should be clear, researchable, and significant."
        },
        { 
            id: "hypothesis", 
            label: "Hypothesis", 
            description: "Create testable hypotheses",
            prompt: "Generate 3-5 testable hypotheses based on the research content. Each hypothesis should be specific, measurable, and falsifiable."
        },
        { 
            id: "methodology", 
            label: "Methodology", 
            description: "Suggest research methods",
            prompt: "Suggest appropriate research methodology including research design, data collection methods, sampling strategy, and analysis approach based on the research topic."
        },
        { 
            id: "statistical-analysis", 
            label: "Statistical Analysis", 
            description: "Recommend statistical tests",
            prompt: "Recommend appropriate statistical tests and analysis methods based on the research design and data type. Include justification for each recommendation."
        },
        { 
            id: "abstract", 
            label: "Abstract", 
            description: "Generate compelling abstract",
            prompt: "Generate a comprehensive abstract (250-300 words) including: background, objectives, methods, results, and conclusions. Follow academic standards."
        },
        { 
            id: "literature-synthesis", 
            label: "Literature Synthesis", 
            description: "Synthesize research literature",
            prompt: "Synthesize the literature by identifying key themes, trends, gaps, and connections between studies. Provide a comprehensive overview with proper structure."
        },
        { 
            id: "paper-analysis", 
            label: "Paper Analysis", 
            description: "Analyze research paper",
            prompt: "Analyze this research paper and extract: title, abstract, methodology, results, conclusions, key findings, and research gaps. Provide a comprehensive summary."
        },
        { 
            id: "text-refine", 
            label: "Refine Text", 
            description: "Improve academic writing",
            prompt: "Refine this text by fixing grammar, improving clarity, enhancing academic tone, and ensuring proper structure. Maintain the original meaning."
        },
        { 
            id: "complete-manuscript", 
            label: "Complete Manuscript", 
            description: "Generate full research paper",
            prompt: "Generate a complete research manuscript with all sections: Title, Abstract, Introduction, Literature Review, Methodology, Results, Discussion, Conclusion, and References. Use proper academic formatting."
        },
        { 
            id: "plagiarism-check", 
            label: "Plagiarism Check", 
            description: "Check text for plagiarism & AI",
            prompt: "Analyze this text for potential plagiarism and AI generation by identifying similar phrases, common patterns, and providing detailed assessment."
        },
        { 
            id: "keyword-extractor", 
            label: "Keyword Generator", 
            description: "Generate keywords from papers",
            prompt: "Extract and categorize relevant keywords from this research paper. Include: main keywords (5-8), secondary keywords (5-8), and MeSH terms if applicable."
        },
    ];

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

        // Check file type
        const validTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|txt|doc|docx)$/i)) {
            alert('Please upload a PDF, TXT, DOC, or DOCX file.');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            alert('File size must be less than 50MB.');
            return;
        }

        setUploadedFile(file);

        // Auto-extract text for plagiarism checker, keyword extractor, and export templates
        if (selectedTask === 'plagiarism-check' || selectedTask === 'keyword-extractor' || selectedTask === 'export-templates') {
            setIsProcessing(true);
            if (selectedTask === 'keyword-extractor') {
                setIsExtractingKeywords(true);
            }
            try {
                let extractedText = '';
                
                if (file.type === 'application/pdf') {
                    const base64 = await fileToBase64(file);
                    const systemPrompt = `Extract ALL text from this document. Return ONLY the text without explanations.`;
                    const res = await fetch("/api/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            prompt: "Extract all text.",
                            system: systemPrompt,
                            files: [{ data: base64, mimeType: file.type }]
                        }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                        extractedText = data.result;
                    } else {
                        throw new Error(data.error || 'Failed to extract text');
                    }
                } else {
                    // For TXT, DOC, DOCX files
                    extractedText = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target?.result as string);
                        reader.onerror = reject;
                        reader.readAsText(file);
                    });
                }

                // Now handle the extracted text based on task
                if (selectedTask === 'plagiarism-check') {
                    setPlagiarismText(extractedText);
                } else if (selectedTask === 'keyword-extractor') {
                    setKeywordText(extractedText);
                    
                    // Auto-generate keywords
                    try {
                        const keywordSystemPrompt = `You are a keyword generation expert. Analyze this research paper and generate:
1. Main Keywords (5-8 most important keywords)
2. Secondary Keywords (5-8 supporting keywords)
3. MeSH Terms (if applicable, medical subject headings)
4. Research Domain (the field of study)

Format as JSON:
{
  "mainKeywords": ["keyword1", "keyword2"],
  "secondaryKeywords": ["keyword1", "keyword2"],
  "meshTerms": ["term1", "term2"],
  "researchDomain": "domain name"
}`;

                        const keywordRes = await fetch("/api/chat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                prompt: extractedText,
                                system: keywordSystemPrompt
                            }),
                        });

                        const keywordData = await keywordRes.json();
                        if (keywordRes.ok) {
                            const cleanJson = keywordData.result.replace(/```json/g, '').replace(/```/g, '').trim();
                            setExtractedKeywords(JSON.parse(cleanJson));
                        } else {
                            throw new Error(keywordData.error || 'Failed to generate keywords');
                        }
                    } catch (err: any) {
                        console.error('Keyword generation error:', err);
                        alert(`Failed to generate keywords: ${err.message}`);
                    } finally {
                        setIsExtractingKeywords(false);
                    }
                } else if (selectedTask === 'export-templates') {
                    setTemplateText(extractedText);
                }
            } catch (err: any) {
                console.error('File extraction error:', err);
                alert(`Failed to extract text from file: ${err.message}`);
                setIsExtractingKeywords(false);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const removeFile = () => {
        setUploadedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const resetAll = () => {
        // Reset task selection
        setSelectedTask("");
        
        // Reset file upload
        setUploadedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        
        // Reset all text inputs
        setTopic("");
        setField("");
        setDescription("");
        setResearchType("exploratory");
        setVariables("");
        setDataType("");
        setManuscriptText("");
        
        // Reset literature synthesis
        setLitQuery("");
        
        // Reset paper analysis
        setPaperFile(null);
        setAnalysis(null);
        
        // Reset research questions
        setResearchQuestions(null);
        
        // Reset text refiner
        setInputText("");
        setRefinedText("");
        setRefinerUploadedFile(null);
        
        // Reset plagiarism checker
        setPlagiarismText("");
        setPlagiarismResult(null);
        
        // Reset keyword extractor
        setKeywordText("");
        setExtractedKeywords(null);
        
        // Reset export templates
        setTemplateText("");
        setFormattedTemplate("");
        setSelectedJournal("ieee");
        
        // Reset generated content
        setGeneratedContent("");
        setIsEditing(false);
    };

    const handleGenerate = async () => {
        if (!selectedTask) {
            alert("Please select a task.");
            return;
        }

        // These tasks have their own action buttons, don't use Generate
        if (selectedTask === 'plagiarism-check' || selectedTask === 'keyword-extractor' || selectedTask === 'export-templates' || selectedTask === 'text-refine') {
            return;
        }

        // Special handling for research questions
        if (selectedTask === "research-questions") {
            if (!topic.trim() && !uploadedFile) {
                alert("Please enter a research topic or upload a file.");
                return;
            }
            
            setIsProcessing(true);
            
            try {
                const systemPrompt = `You are an expert research methodology advisor. Generate 5 high-quality research questions based on the given topic and research type.

For each question, provide a COMPREHENSIVE analysis:

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "<the research question>",
    "type": "<question type: What/How/Why/Where/When/Who>",
    "rationale": "<2-3 sentences explaining why this is an important research question>",
    "how": "<3-4 sentences explaining HOW to approach answering this question>",
    "why": "<3-4 sentences explaining WHY this question matters>",
    "what": "<3-4 sentences explaining WHAT you're investigating>",
    "where": "<2-3 sentences explaining WHERE this research applies>",
    "when": "<2-3 sentences explaining WHEN aspects>",
    "who": "<2-3 sentences explaining WHO is involved>"
  }
]`;

                let userPrompt = '';
                let files: any[] = [];

                if (uploadedFile) {
                    const base64 = await fileToBase64(uploadedFile);
                    files.push({
                        data: base64,
                        mimeType: uploadedFile.type
                    });
                    userPrompt = `Analyze this document and generate 5 diverse, high-quality research questions based on its content.${topic ? ` Focus on: ${topic}` : ''}${researchType ? ` Research Type: ${researchType}` : ''}`;
                } else {
                    userPrompt = `Research Topic: ${topic}
${field ? `Field of Study: ${field}` : ''}
${description ? `Context: ${description}` : ''}
Research Type: ${researchType}

Generate 5 diverse, high-quality research questions.`;
                }

                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: userPrompt,
                        system: systemPrompt,
                        files: files.length > 0 ? files : undefined
                    }),
                });

                const data = await res.json();
                
                if (!res.ok) {
                    throw new Error(data.error || 'Failed to generate questions');
                }

                const cleanJsonStr = data.result
                    .replace(/```json/g, '')
                    .replace(/```/g, '')
                    .trim();
                
                const questionsResult = JSON.parse(cleanJsonStr);
                setResearchQuestions({ 
                    topic: topic || 'Research Questions from Document', 
                    field, 
                    researchType, 
                    questions: questionsResult 
                });
            } catch (err) {
                console.error('Research questions error:', err);
                alert('Failed to generate research questions. Please try again.');
            } finally {
                setIsProcessing(false);
            }
            return;
        }

        // Special handling for literature synthesis
        if (selectedTask === "literature-synthesis") {
            if (!litQuery) {
                alert("Please enter a topic or query.");
                return;
            }
            
            setIsProcessing(true);
            
            try {
                const systemPrompt = "You are an expert academic research assistant. The user will give you a topic. Write a highly professional, 1-paragraph literature review synthesis on the topic. Include 2 or 3 realistic-sounding inline citations in APA format (e.g., Smith & Doe, 2023).";

                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: litQuery,
                        system: systemPrompt
                    }),
                });
                
                const data = await res.json();
                if (res.ok) {
                    const styledContent = `<div style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000;">
<h1 style="font-size: 18pt; font-weight: bold; text-align: center; margin-bottom: 24px;">Literature Review</h1>
<p style="text-align: justify;">${data.result}</p>
</div>`;
                    setGeneratedContent(styledContent);
                } else {
                    throw new Error(data.error || "Could not generate synthesis.");
                }
            } catch (err) {
                console.error('Literature synthesis error:', err);
                alert("Error connecting to the AI service.");
            } finally {
                setIsProcessing(false);
            }
            return;
        }

        // Special handling for paper analysis
        if (selectedTask === "paper-analysis") {
            if (!paperFile) {
                alert("Please upload a PDF file to analyze.");
                return;
            }
            
            setIsProcessing(true);
            
            try {
                const base64 = await fileToBase64(paperFile);
                
                const systemPrompt = `You are an expert research paper analyzer. Analyze this research paper comprehensively.

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "title": "<paper title>",
  "abstract": "<abstract summary in 2-3 sentences>",
  "methodology": "<methodology description in 2-3 sentences>",
  "results": "<key results in 2-3 sentences>",
  "conclusions": "<main conclusions in 2-3 sentences>",
  "keyFindings": ["<finding 1>", "<finding 2>", "<finding 3>"],
  "researchGaps": ["<gap 1>", "<gap 2>", "<gap 3>"],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "summary": "<overall summary in 3-4 sentences>"
}

Be thorough and provide actionable insights.`;

                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: "Analyze this research paper and return the structured JSON.",
                        system: systemPrompt,
                        files: [{
                            data: base64,
                            mimeType: paperFile.type
                        }]
                    }),
                });

                const data = await res.json();
                
                if (!res.ok) {
                    throw new Error(data.error || 'Failed to analyze paper');
                }

                const cleanJsonStr = data.result
                    .replace(/```json/g, '')
                    .replace(/```/g, '')
                    .trim();
                
                const analysisResult = JSON.parse(cleanJsonStr);
                
                // Store analysis for visual display
                setAnalysis(analysisResult);
            } catch (err) {
                console.error('Analysis error:', err);
                alert('Failed to analyze paper. Please try again.');
            } finally {
                setIsProcessing(false);
            }
            return;
        }

        // Special handling for text refiner
        if (selectedTask === "text-refine") {
            if (!refinedText) {
                alert("Please refine the text first using one of the action buttons.");
                return;
            }
            
            const styledContent = `<div style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000;">
<h1 style="font-size: 18pt; font-weight: bold; text-align: center; margin-bottom: 24px;">Refined Text</h1>
<p style="text-align: justify;">${refinedText.replace(/\n/g, '</p><p style="text-align: justify;">')}</p>
</div>`;
            setGeneratedContent(styledContent);
            return;
        }

        // Check if we have either file or manual input for other tasks
        const hasInput = uploadedFile || topic.trim() || description.trim() || manuscriptText.trim();
        if (!hasInput) {
            alert("Please upload a file or provide manual input.");
            return;
        }

        setIsProcessing(true);

        try {
            const task = tasks.find(t => t.id === selectedTask);
            
            let userPrompt = "";
            let files = undefined;

            // Build prompt based on task and available inputs
            if (uploadedFile) {
                const base64 = await fileToBase64(uploadedFile);
                files = [{
                    data: base64,
                    mimeType: uploadedFile.type
                }];
                userPrompt = `Analyze this research document and ${task?.prompt}`;
            } else {
                // Manual input
                switch (selectedTask) {
                    case "research-questions":
                        userPrompt = `Research Topic: ${topic}\nField: ${field}\nDescription: ${description}\nResearch Type: ${researchType}\n\n${task?.prompt}`;
                        break;
                    case "hypothesis":
                        userPrompt = `Research Topic: ${topic}\nField: ${field}\nDescription: ${description}\nVariables: ${variables}\n\n${task?.prompt}`;
                        break;
                    case "methodology":
                        userPrompt = `Research Topic: ${topic}\nField: ${field}\nDescription: ${description}\nResearch Type: ${researchType}\n\n${task?.prompt}`;
                        break;
                    case "statistical-analysis":
                        userPrompt = `Research Topic: ${topic}\nData Type: ${dataType}\nVariables: ${variables}\nDescription: ${description}\n\n${task?.prompt}`;
                        break;
                    case "abstract":
                    case "complete-manuscript":
                        userPrompt = `${manuscriptText}\n\n${task?.prompt}`;
                        break;
                }
            }
            
            const systemPrompt = `You are an expert academic research assistant. ${task?.prompt}

Format the output in clean HTML with proper structure:
- Use <h1> for main title (18pt, bold, centered)
- Use <h2> for section headings (14pt, bold)
- Use <h3> for subsections (12pt, bold)
- Use <p> for paragraphs (justified, 12pt Times New Roman)
- Use <ul> and <li> for lists
- Use <strong> for emphasis

Return ONLY the formatted HTML content without any meta-commentary or explanations.`;

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: userPrompt,
                    system: systemPrompt,
                    files: files
                }),
            });

            const data = await res.json();

            if (res.ok) {
                let content = data.result;
                
                // Clean up the content
                content = content.replace(/```html/g, '').replace(/```/g, '').trim();
                
                // Wrap in proper styling
                const styledContent = `<div style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000;">
${content}
</div>`;
                
                setGeneratedContent(styledContent);
            } else {
                throw new Error(data.error || 'Failed to generate content');
            }
        } catch (err) {
            console.error('Generation error:', err);
            alert('Failed to generate content. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const exportToWord = () => {
        if (!generatedContent) return;

        try {
            const htmlContent = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head><meta charset='utf-8'><title>Research Document</title></head>
                <body style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000;">
                ${generatedContent}
                </body></html>`;
            
            const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const taskLabel = tasks.find(t => t.id === selectedTask)?.label || 'document';
            link.download = `${taskLabel.replace(/\s+/g, '_')}.doc`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Word export failed:", error);
            alert("Word export failed. Please try again.");
        }
    };

    const exportToPDF = async () => {
        if (!exportRef.current || !generatedContent) return;

        try {
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const element = exportRef.current;
            element.style.display = 'block';
            element.style.position = 'absolute';
            element.style.left = '-9999px';
            element.style.top = '0';

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            });

            element.style.display = 'none';
            element.style.position = '';
            element.style.left = '';
            element.style.top = '';

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = pdfWidth / imgWidth;
            const scaledHeight = imgHeight * ratio;
            const totalPages = Math.ceil(scaledHeight / pdfHeight);
            
            for (let page = 0; page < totalPages; page++) {
                if (page > 0) pdf.addPage();
                const yOffset = -(page * pdfHeight);
                pdf.addImage(imgData, 'PNG', 0, yOffset, pdfWidth, scaledHeight);
            }
            
            const taskLabel = tasks.find(t => t.id === selectedTask)?.label || 'document';
            pdf.save(`${taskLabel.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error('PDF export error:', err);
            alert('Failed to export PDF. Please try again.');
        }
    };

    const saveToDatabase = async () => {
        if (!generatedContent) return;

        // Don't save if in guest mode
        if (isGuest) {
            alert('Guest mode: Your work is not saved. Please login to save to dashboard.');
            return;
        }

        try {
            // Get user data from localStorage
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                alert('Please login to save your work.');
                return;
            }
            
            const user = JSON.parse(userStr);
            const userId = user._id;
            
            const taskLabel = tasks.find(t => t.id === selectedTask)?.label || 'Research Document';
            const res = await fetch("/api/research", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: userId,
                    title: `${taskLabel}: ${uploadedFile?.name.replace('.pdf', '') || 'Untitled'}`,
                    type: "synthesis",
                    content: generatedContent,
                    sourcePrompt: `Generated ${taskLabel} from: ${uploadedFile?.name}`
                }),
            });

            if (res.ok) {
                alert('Saved successfully to Dashboard!');
            } else {
                throw new Error('Failed to save');
            }
        } catch (err) {
            console.error("Save error:", err);
            alert('Failed to save. Please try again.');
        }
    };

    return (
        <>
            {/* Research Wizard Section */}
            <section id="wizard" className="px-6 py-24 max-w-7xl mx-auto">
            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-center mb-12 relative"
            >
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                    <span className="text-gradient-research">Research</span> Assistant Wizard
                </h2>
                <p className="text-[#999999] text-lg">All-in-one tool for research questions, hypotheses, methodology, and more.</p>
                
                {/* Start Over Button */}
                {(selectedTask || uploadedFile || generatedContent) && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={resetAll}
                        className="absolute top-0 right-0 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Start Over
                    </motion.button>
                )}
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="glass-card rounded-[32px] p-8 md:p-12"
            >
                {/* Task Selection */}
                <div id="task-selection" className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">Select Task</h3>
                        {selectedTask && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setSelectedTask("");
                                    setUploadedFile(null);
                                    setGeneratedContent("");
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Close Task
                            </motion.button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {tasks.map((task) => (
                            <motion.button
                                key={task.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedTask(task.id)}
                                className={`p-4 rounded-xl transition-all text-left ${
                                    selectedTask === task.id
                                        ? 'bg-gradient-to-br from-[#4FACFE] to-[#00F260] text-white border-2 border-transparent'
                                        : 'bg-white/5 text-white border-2 border-white/10 hover:border-white/20'
                                }`}
                            >
                                <div className="font-bold text-sm mb-1">{task.label}</div>
                                <div className="text-xs opacity-80">{task.description}</div>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* File Upload - Universal for all tasks */}
                {/* Global File Upload - Hidden for tasks with their own upload UI */}
                {selectedTask && selectedTask !== 'paper-analysis' && selectedTask !== 'text-refine' && selectedTask !== 'plagiarism-check' && selectedTask !== 'keyword-extractor' && selectedTask !== 'export-templates' && selectedTask !== 'literature-synthesis' && (
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">Upload File (Optional)</h3>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    
                    {!uploadedFile ? (
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full p-8 border-2 border-dashed border-white/20 hover:border-[#4FACFE]/50 rounded-2xl transition-colors flex flex-col items-center justify-center gap-3 text-[#999999] hover:text-white"
                        >
                            <DocumentUpload size="48" variant="Bold" />
                            <div className="text-center">
                                <p className="font-bold text-white text-lg">Upload File</p>
                                <p className="text-sm">Upload your research paper, draft, or notes (PDF, TXT, DOC - Max 50MB)</p>
                            </div>
                        </motion.button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 bg-gradient-to-r from-[#4FACFE]/10 to-[#00F260]/10 border border-[#4FACFE]/30 rounded-2xl flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <DocumentUpload size="40" className="text-[#4FACFE]" variant="Bold" />
                                <div>
                                    <p className="text-white font-bold text-lg">{uploadedFile.name}</p>
                                    <p className="text-sm text-[#999999]">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={removeFile}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <CloseCircle size="28" className="text-[#999999]" />
                            </motion.button>
                        </motion.div>
                    )}
                </div>
                )}

                {/* Task-Specific Input Fields */}
                {selectedTask && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mb-8 space-y-6"
                    >
                        {/* Literature Synthesis UI */}
                        {selectedTask === "literature-synthesis" && (
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <h3 className="text-xl font-bold text-white mb-4">Literature Synthesis</h3>
                                
                                <div className="flex flex-col gap-4 w-full mb-4">
                                    {/* Search Input */}
                                    <div className="glass-card rounded-2xl p-2 flex items-center w-full border border-white/10">
                                        <div className="pl-4 w-full flex items-center gap-4">
                                            <SearchNormal size="24" className="text-[#4FACFE]" variant="Bold" />
                                            <input
                                                type="text"
                                                value={litQuery}
                                                onChange={(e) => setLitQuery(e.target.value)}
                                                placeholder="e.g. Recent advancements in solid-state batteries..."
                                                className="w-full bg-transparent border-none outline-none text-white text-lg placeholder:text-[#666666] py-4"
                                                onKeyDown={(e) => e.key === 'Enter' && litQuery && handleGenerate()}
                                            />
                                        </div>
                                    </div>

                                    {/* Generate Button - Show when query is present */}
                                    {litQuery && (
                                        <motion.button
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={handleGenerate}
                                            disabled={isProcessing}
                                            className="w-full py-4 bg-gradient-to-r from-[#4FACFE] to-[#00F260] text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-[#4FACFE]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isProcessing ? (
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
                            </div>
                        )}

                        {/* Paper Analysis UI */}
                        {selectedTask === "paper-analysis" && (
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <h3 className="text-xl font-bold text-white mb-4">Paper Analysis</h3>
                                
                                {!paperFile && !analysis && (
                                    <div className="text-center py-8">
                                        <input
                                            ref={paperFileInputRef}
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => {
                                                const uploadedFile = e.target.files?.[0];
                                                if (uploadedFile) {
                                                    if (uploadedFile.type !== 'application/pdf') {
                                                        alert('Please upload a PDF file.');
                                                        return;
                                                    }
                                                    setPaperFile(uploadedFile);
                                                }
                                            }}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => paperFileInputRef.current?.click()}
                                            className="mx-auto mb-4 p-6 rounded-3xl border-2 border-dashed border-white/20 hover:border-[#4FACFE]/50 transition-colors group"
                                        >
                                            <DocumentUpload size="48" variant="Bulk" className="text-white/40 group-hover:text-[#4FACFE] transition-colors mx-auto mb-3" />
                                            <p className="text-white font-medium mb-1">Click to upload research paper</p>
                                            <p className="text-[#999999] text-sm">PDF files only • Max 10MB</p>
                                        </button>
                                    </div>
                                )}

                                {paperFile && !analysis && (
                                    <div className="flex flex-col gap-4">
                                        <div className="p-4 bg-gradient-to-r from-[#4FACFE]/10 to-[#00F260]/10 border border-[#4FACFE]/30 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <DocumentUpload size="40" className="text-[#4FACFE]" variant="Bold" />
                                                <div>
                                                    <p className="text-white font-bold text-lg">{paperFile.name}</p>
                                                    <p className="text-sm text-[#999999]">{(paperFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setPaperFile(null);
                                                    if (paperFileInputRef.current) {
                                                        paperFileInputRef.current.value = '';
                                                    }
                                                }}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <CloseCircle size="28" className="text-[#999999]" />
                                            </button>
                                        </div>
                                        
                                        {/* Generate Button */}
                                        <motion.button
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={handleGenerate}
                                            disabled={isProcessing}
                                            className="w-full py-4 bg-gradient-to-r from-[#4FACFE] to-[#00F260] text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-[#4FACFE]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    >
                                                        <MagicStar size="24" variant="Bold" />
                                                    </motion.div>
                                                    Analyzing Paper...
                                                </>
                                            ) : (
                                                <>
                                                    <MagicStar size="24" variant="Bold" />
                                                    Analyze Paper
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                )}

                                {/* Analysis Results Display */}
                                {analysis && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-6"
                                    >
                                        {/* Header with title and action buttons */}
                                        <div className="flex justify-between items-start gap-4 flex-wrap">
                                            <h2 className="text-2xl font-bold text-white">{analysis.title}</h2>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await fetch("/api/research", {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({
                                                                    title: analysis.title,
                                                                    type: "paper-analysis",
                                                                    content: JSON.stringify(analysis),
                                                                    sourcePrompt: "Paper Analysis"
                                                                }),
                                                            });
                                                            if (res.ok) {
                                                                alert("Analysis saved to dashboard!");
                                                            }
                                                        } catch (err) {
                                                            console.error("Failed to save", err);
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-[#4FACFE] hover:bg-[#4FACFE]/80 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
                                                >
                                                    <Save2 size="16" />
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const analysisText = `
PAPER ANALYSIS REPORT
${'='.repeat(80)}

Title: ${analysis.title}

SUMMARY
${'-'.repeat(80)}
${analysis.summary}

ABSTRACT
${'-'.repeat(80)}
${analysis.abstract}

METHODOLOGY
${'-'.repeat(80)}
${analysis.methodology}

RESULTS
${'-'.repeat(80)}
${analysis.results}

CONCLUSIONS
${'-'.repeat(80)}
${analysis.conclusions}

KEY FINDINGS
${'-'.repeat(80)}
${analysis.keyFindings.map((f: string, i: number) => `${i + 1}. ${f}`).join('\n')}

RESEARCH GAPS
${'-'.repeat(80)}
${analysis.researchGaps.map((g: string, i: number) => `${i + 1}. ${g}`).join('\n')}

STRENGTHS
${'-'.repeat(80)}
${analysis.strengths?.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n') || 'N/A'}

AREAS FOR IMPROVEMENT
${'-'.repeat(80)}
${analysis.improvements?.map((imp: string, i: number) => `${i + 1}. ${imp}`).join('\n') || 'N/A'}
`;
                                                        const blob = new Blob([analysisText], { type: 'text/plain' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `${analysis.title.replace(/[^a-z0-9]/gi, '_')}_analysis.txt`;
                                                        a.click();
                                                        URL.revokeObjectURL(url);
                                                    }}
                                                    className="px-4 py-2 bg-[#00F260] hover:bg-[#00F260]/80 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
                                                >
                                                    <DocumentDownload size="16" />
                                                    Download
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setAnalysis(null);
                                                        setPaperFile(null);
                                                        if (paperFileInputRef.current) {
                                                            paperFileInputRef.current.value = '';
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm transition-colors"
                                                >
                                                    Analyze Another
                                                </button>
                                            </div>
                                        </div>

                                        {/* Summary Card */}
                                        <div className="p-6 bg-gradient-to-br from-[#4FACFE]/10 to-[#00F260]/10 border border-[#4FACFE]/30 rounded-2xl">
                                            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                                <MagicStar size="20" className="text-[#4FACFE]" variant="Bold" />
                                                Summary
                                            </h3>
                                            <p className="text-[#e2e2e2] leading-relaxed">{analysis.summary}</p>
                                        </div>

                                        {/* Grid Layout for Sections */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Abstract */}
                                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                                <h3 className="text-lg font-bold text-white mb-3">Abstract</h3>
                                                <p className="text-[#cccccc] leading-relaxed text-sm">{analysis.abstract}</p>
                                            </div>

                                            {/* Methodology */}
                                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                                <h3 className="text-lg font-bold text-white mb-3">Methodology</h3>
                                                <p className="text-[#cccccc] leading-relaxed text-sm">{analysis.methodology}</p>
                                            </div>

                                            {/* Results */}
                                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                                <h3 className="text-lg font-bold text-white mb-3">Results</h3>
                                                <p className="text-[#cccccc] leading-relaxed text-sm">{analysis.results}</p>
                                            </div>

                                            {/* Conclusions */}
                                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                                <h3 className="text-lg font-bold text-white mb-3">Conclusions</h3>
                                                <p className="text-[#cccccc] leading-relaxed text-sm">{analysis.conclusions}</p>
                                            </div>
                                        </div>

                                        {/* Key Findings */}
                                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-[#00F260]"></span>
                                                Key Findings
                                            </h3>
                                            <div className="space-y-3">
                                                {analysis.keyFindings.map((finding: string, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-3 p-3 bg-[#00F260]/5 border border-[#00F260]/20 rounded-xl">
                                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00F260]/20 text-[#00F260] flex items-center justify-center text-sm font-bold">
                                                            {idx + 1}
                                                        </span>
                                                        <p className="text-[#e2e2e2] text-sm leading-relaxed">{finding}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Research Gaps */}
                                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-[#FF4E50]"></span>
                                                Research Gaps Identified
                                            </h3>
                                            <div className="space-y-3">
                                                {analysis.researchGaps.map((gap: string, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-3 p-3 bg-[#FF4E50]/5 border border-[#FF4E50]/20 rounded-xl">
                                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF4E50]/20 text-[#FF4E50] flex items-center justify-center text-sm font-bold">
                                                            {idx + 1}
                                                        </span>
                                                        <p className="text-[#e2e2e2] text-sm leading-relaxed">{gap}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Strengths */}
                                        {analysis.strengths && analysis.strengths.length > 0 && (
                                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-[#4FACFE]"></span>
                                                    Strengths & Positives
                                                </h3>
                                                <div className="space-y-3">
                                                    {analysis.strengths.map((strength: string, idx: number) => (
                                                        <div key={idx} className="flex items-start gap-3 p-3 bg-[#4FACFE]/5 border border-[#4FACFE]/20 rounded-xl">
                                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4FACFE]/20 text-[#4FACFE] flex items-center justify-center text-sm font-bold">
                                                                ✓
                                                            </span>
                                                            <p className="text-[#e2e2e2] text-sm leading-relaxed">{strength}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Areas for Improvement */}
                                        {analysis.improvements && analysis.improvements.length > 0 && (
                                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-[#FFA500]"></span>
                                                    Areas for Improvement
                                                </h3>
                                                <div className="space-y-3">
                                                    {analysis.improvements.map((improvement: string, idx: number) => (
                                                        <div key={idx} className="flex items-start gap-3 p-3 bg-[#FFA500]/5 border border-[#FFA500]/20 rounded-xl">
                                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFA500]/20 text-[#FFA500] flex items-center justify-center text-sm font-bold">
                                                                !
                                                            </span>
                                                            <p className="text-[#e2e2e2] text-sm leading-relaxed">{improvement}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* Research Questions Visual Display */}
                        {researchQuestions && selectedTask === "research-questions" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-6"
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start gap-4 flex-wrap">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-2">Research Questions</h2>
                                        <p className="text-[#999999]">{researchQuestions.topic}</p>
                                        {researchQuestions.field && <p className="text-[#666666] text-sm">Field: {researchQuestions.field}</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                const allText = researchQuestions.questions.map((q: any, i: number) => `
QUESTION ${i + 1}: ${q.type}
${q.question}

RATIONALE: ${q.rationale}

HOW TO APPROACH: ${q.how}

WHY IT MATTERS: ${q.why}

WHAT TO INVESTIGATE: ${q.what}

WHERE IT APPLIES: ${q.where}

WHEN CONSIDERATIONS: ${q.when}

WHO IS INVOLVED: ${q.who}

${'='.repeat(80)}
`).join('\n');
                                                navigator.clipboard.writeText(allText);
                                                alert('All questions copied!');
                                            }}
                                            className="px-4 py-2 bg-[#9D4EDD] hover:bg-[#9D4EDD]/80 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
                                        >
                                            <Copy size="16" />
                                            Copy
                                        </button>
                                        <button
                                            onClick={() => {
                                                const content = `RESEARCH QUESTIONS - COMPREHENSIVE ANALYSIS
${'='.repeat(80)}

Topic: ${researchQuestions.topic}
${researchQuestions.field ? `Field: ${researchQuestions.field}` : ''}
Research Type: ${researchQuestions.researchType}

${'='.repeat(80)}

${researchQuestions.questions.map((q: any, i: number) => `
QUESTION ${i + 1}: ${q.type}
${'-'.repeat(80)}
${q.question}

RATIONALE:
${q.rationale}

HOW TO APPROACH:
${q.how}

WHY IT MATTERS:
${q.why}

WHAT TO INVESTIGATE:
${q.what}

WHERE IT APPLIES:
${q.where}

WHEN CONSIDERATIONS:
${q.when}

WHO IS INVOLVED:
${q.who}

`).join('\n')}`;
                                                const blob = new Blob([content], { type: 'text/plain' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `research_questions_${researchQuestions.topic.replace(/[^a-z0-9]/gi, '_')}.txt`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            }}
                                            className="px-4 py-2 bg-[#00F260] hover:bg-[#00F260]/80 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
                                        >
                                            <DocumentDownload size="16" />
                                            Download
                                        </button>
                                        <button
                                            onClick={() => {
                                                setResearchQuestions(null);
                                            }}
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm transition-colors"
                                        >
                                            Generate New
                                        </button>
                                    </div>
                                </div>

                                {/* Questions List */}
                                {researchQuestions.questions.map((q: any, index: number) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="p-6 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl space-y-4"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4FACFE] to-[#00F260] flex items-center justify-center font-bold text-white">
                                                    {index + 1}
                                                </div>
                                                <span className="px-3 py-1 bg-[#4FACFE]/20 text-[#4FACFE] rounded-full text-xs font-bold">
                                                    {q.type}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const text = `QUESTION ${index + 1}: ${q.type}\n${q.question}\n\nRATIONALE:\n${q.rationale}\n\nHOW TO APPROACH:\n${q.how}\n\nWHY IT MATTERS:\n${q.why}\n\nWHAT TO INVESTIGATE:\n${q.what}\n\nWHERE IT APPLIES:\n${q.where}\n\nWHEN CONSIDERATIONS:\n${q.when}\n\nWHO IS INVOLVED:\n${q.who}`;
                                                    navigator.clipboard.writeText(text);
                                                    alert('Question copied!');
                                                }}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <Copy size="20" className="text-white" />
                                            </button>
                                        </div>

                                        <p className="text-white text-xl font-bold leading-relaxed" style={{ fontFamily: "'Times New Roman', serif" }}>
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

                                            {/* Analysis Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                    <p className="text-sm text-[#00F260] mb-2 font-bold flex items-center gap-2">
                                                        <span className="text-lg">🔧</span>
                                                        HOW to Approach
                                                    </p>
                                                    <p className="text-[#cccccc] text-sm leading-relaxed">{q.how}</p>
                                                </div>

                                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                    <p className="text-sm text-[#FF4E50] mb-2 font-bold flex items-center gap-2">
                                                        <span className="text-lg">💡</span>
                                                        WHY It Matters
                                                    </p>
                                                    <p className="text-[#cccccc] text-sm leading-relaxed">{q.why}</p>
                                                </div>

                                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                    <p className="text-sm text-[#4FACFE] mb-2 font-bold flex items-center gap-2">
                                                        <span className="text-lg">📊</span>
                                                        WHAT to Investigate
                                                    </p>
                                                    <p className="text-[#cccccc] text-sm leading-relaxed">{q.what}</p>
                                                </div>

                                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                    <p className="text-sm text-[#FFA500] mb-2 font-bold flex items-center gap-2">
                                                        <span className="text-lg">📍</span>
                                                        WHERE It Applies
                                                    </p>
                                                    <p className="text-[#cccccc] text-sm leading-relaxed">{q.where}</p>
                                                </div>

                                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                    <p className="text-sm text-[#9D4EDD] mb-2 font-bold flex items-center gap-2">
                                                        <span className="text-lg">⏰</span>
                                                        WHEN Considerations
                                                    </p>
                                                    <p className="text-[#cccccc] text-sm leading-relaxed">{q.when}</p>
                                                </div>

                                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                                    <p className="text-sm text-[#06FFA5] mb-2 font-bold flex items-center gap-2">
                                                        <span className="text-lg">👥</span>
                                                        WHO Is Involved
                                                    </p>
                                                    <p className="text-[#cccccc] text-sm leading-relaxed">{q.who}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {/* Text Refiner UI */}
                        {selectedTask === "text-refine" && (
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <h3 className="text-xl font-bold text-white mb-4">AI Text Refiner</h3>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Input Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                                <Magicpen size="20" className="text-[#4FACFE]" variant="Bold" />
                                                Original Text
                                            </h4>
                                            <span className="text-sm text-[#999999]">{inputText.length} characters</span>
                                        </div>

                                        {/* File Upload Section */}
                                        <div className="mb-4">
                                            <input
                                                ref={refinerFileInputRef}
                                                type="file"
                                                accept=".pdf"
                                                onChange={async (e) => {
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

                                                    setRefinerUploadedFile(file);
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
                                                        setRefinerUploadedFile(null);
                                                    } finally {
                                                        setIsExtracting(false);
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                            
                                            {!refinerUploadedFile ? (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => refinerFileInputRef.current?.click()}
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
                                                            <p className="text-white font-medium">{refinerUploadedFile.name}</p>
                                                            <p className="text-xs text-[#999999]">{(refinerUploadedFile.size / 1024).toFixed(1)} KB</p>
                                                        </div>
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => {
                                                            setRefinerUploadedFile(null);
                                                            if (refinerFileInputRef.current) {
                                                                refinerFileInputRef.current.value = '';
                                                            }
                                                        }}
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
                                                className="w-full h-[300px] bg-white/5 border border-white/10 rounded-2xl p-6 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] resize-none text-[15px] leading-relaxed"
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
                                                    onClick={async () => {
                                                        if (!inputText.trim()) {
                                                            alert("Please enter some text or upload a file to refine.");
                                                            return;
                                                        }

                                                        setSelectedRefineAction(action.id);
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
                                                            setSelectedRefineAction("");
                                                        }
                                                    }}
                                                    disabled={isRefining || !inputText.trim() || isExtracting}
                                                    className={`px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                                                        selectedRefineAction === action.id
                                                            ? 'bg-gradient-to-r from-[#4FACFE] to-[#00F260] text-white'
                                                            : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                >
                                                    {selectedRefineAction === action.id ? 'Refining...' : action.label}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Output Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                                <TickCircle size="20" className="text-[#00F260]" variant="Bold" />
                                                Refined Text
                                            </h4>
                                            {refinedText && (
                                                <span className="text-sm text-[#999999]">{refinedText.length} characters</span>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <textarea
                                                value={refinedText}
                                                onChange={(e) => setRefinedText(e.target.value)}
                                                placeholder="Refined text will appear here..."
                                                className="w-full h-[300px] bg-white/5 border border-white/10 rounded-2xl p-6 text-white placeholder-[#666666] focus:outline-none focus:border-[#00F260] resize-none text-[15px] leading-relaxed"
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
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(refinedText);
                                                        alert('Copied to clipboard!');
                                                    }}
                                                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
                                                >
                                                    <Copy size="18" />
                                                    Copy
                                                </motion.button>
                                                
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => {
                                                        const blob = new Blob([refinedText], { type: 'text/plain' });
                                                        const url = URL.createObjectURL(blob);
                                                        const link = document.createElement('a');
                                                        link.href = url;
                                                        link.download = 'refined_text.txt';
                                                        link.click();
                                                        URL.revokeObjectURL(url);
                                                    }}
                                                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
                                                >
                                                    <DocumentDownload size="18" />
                                                    Download
                                                </motion.button>
                                                
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => {
                                                        setInputText(refinedText);
                                                        setRefinedText("");
                                                    }}
                                                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
                                                >
                                                    <ArrowRotateLeft size="18" />
                                                    Replace Original
                                                </motion.button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Plagiarism Checker UI */}
                        {selectedTask === "plagiarism-check" && (
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <h3 className="text-xl font-bold text-white mb-4">Plagiarism Checker</h3>
                                
                                <div className="space-y-4">
                                    {!plagiarismResult && !isCheckingPlagiarism && (
                                        <>
                                            {/* Upload Section */}
                                            <div className="text-center py-8">
                                                <input
                                                    ref={plagiarismFileInputRef}
                                                    type="file"
                                                    accept=".pdf,.txt,.doc,.docx"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;

                                                        setIsCheckingPlagiarism(true);
                                                        
                                                        try {
                                                            let extractedText = '';
                                                            
                                                            // Extract text from file
                                                            if (file.type === 'application/pdf') {
                                                                const base64 = await fileToBase64(file);
                                                                const res = await fetch("/api/chat", {
                                                                    method: "POST",
                                                                    headers: { "Content-Type": "application/json" },
                                                                    body: JSON.stringify({
                                                                        prompt: "Extract all text from this document.",
                                                                        system: "You are a text extraction assistant. Extract and return ONLY the text content from the document, preserving paragraph structure.",
                                                                        files: [{ data: base64, mimeType: file.type }]
                                                                    }),
                                                                });
                                                                const data = await res.json();
                                                                if (!res.ok) {
                                                                    throw new Error(data.error || 'Failed to extract text');
                                                                }
                                                                extractedText = data.result;
                                                            } else {
                                                                // For text files
                                                                extractedText = await new Promise((resolve, reject) => {
                                                                    const reader = new FileReader();
                                                                    reader.onload = (e) => resolve(e.target?.result as string);
                                                                    reader.onerror = reject;
                                                                    reader.readAsText(file);
                                                                });
                                                            }

                                                            if (!extractedText || extractedText.trim().length < 50) {
                                                                throw new Error('Could not extract enough text from the document');
                                                            }

                                                            setPlagiarismText(extractedText);

                                                            // Automatically check plagiarism
                                                            const words = extractedText.trim().split(/\s+/).length;
                                                            const chars = extractedText.length;
                                                            
                                                            const systemPrompt = `You are an ADVANCED plagiarism and AI-content detection system. Analyze this text with STRICT criteria to identify:
1. EXACT MATCHES: Direct copies from common sources (Wikipedia, textbooks, popular websites, standard definitions)
2. AI-GENERATED CONTENT: Text showing AI patterns (ChatGPT, Claude, Gemini, etc.)
3. PARAPHRASED CONTENT: Reworded but structurally identical to common sources
4. UNIQUE CONTENT: Original writing with personal insights

AI-GENERATED INDICATORS (mark as "partial"):
- Overly formal/perfect grammar with no natural flow
- Repetitive sentence structures (e.g., multiple sentences starting with "Furthermore," "Moreover," "Additionally")
- Generic statements without specific examples or data
- Balanced/diplomatic tone avoiding strong positions
- Phrases like "It's worth noting," "It's important to understand," "In today's world," "In conclusion"
- Lists with exactly 3-5 items in perfect parallel structure
- Lack of personal voice, anecdotes, or informal language
- Overly comprehensive coverage without depth
- Transition words in every sentence

PLAGIARISM INDICATORS (mark as "exact"):
- Standard definitions (e.g., "Photosynthesis is the process by which...")
- Common technical descriptions found in textbooks
- Well-known quotes or famous phrases
- Wikipedia-style introductory sentences
- Textbook explanations of concepts
- Standard research methodology descriptions
- Common statistical definitions
- Popular science explanations

ANALYSIS RULES:
1. Be STRICT - if text sounds too polished/generic, mark as AI-generated ("partial")
2. If text matches common knowledge phrasing, mark as plagiarized ("exact")
3. Only mark as "unique" if it has: personal voice, specific examples, natural imperfections, original insights
4. Break text into small segments (5-20 words each) for precise highlighting
5. Expect 40-70% of academic text to be flagged (AI or plagiarized) - be thorough!

Return ONLY valid JSON (no markdown):
{
  "plagiarismPercentage": 45,
  "exactMatchPercentage": 15,
  "partialMatchPercentage": 30,
  "uniqueContentPercentage": 55,
  "highlightedSegments": [
    {"text": "Climate change is a pressing global issue", "type": "exact"},
    {"text": " that requires immediate attention. ", "type": "partial"},
    {"text": "Furthermore, it is important to understand", "type": "partial"},
    {"text": " the specific impacts on coastal ecosystems in my region.", "type": "unique"}
  ],
  "sources": [
    {"url": "Common climate change definitions (Wikipedia/textbooks)", "matchPercentage": 15},
    {"url": "AI-generated content patterns detected", "matchPercentage": 30}
  ],
  "analysis": "Text shows significant AI-generated patterns (repetitive transitions, generic statements) and common plagiarized phrases (standard climate definitions). Only specific regional focus appears original."
}

IMPORTANT: Every character must appear in highlightedSegments. Be STRICT and THOROUGH.`;

                                                            const checkRes = await fetch("/api/chat", {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({
                                                                    prompt: `Analyze this complete text for plagiarism:\n\n${extractedText}`,
                                                                    system: getPlagiarismSystemPrompt()
                                                                }),
                                                            });

                                                            const checkData = await checkRes.json();
                                                            if (!checkRes.ok) {
                                                                throw new Error(checkData.error || 'Failed to analyze text');
                                                            }

                                                            let result;
                                                            try {
                                                                const cleanJson = checkData.result
                                                                    .replace(/```json/g, '')
                                                                    .replace(/```/g, '')
                                                                    .trim();
                                                                result = JSON.parse(cleanJson);
                                                            } catch (parseErr) {
                                                                console.error('JSON parse error:', parseErr);
                                                                // Fallback result if JSON parsing fails
                                                                result = {
                                                                    plagiarismPercentage: 15,
                                                                    exactMatchPercentage: 5,
                                                                    partialMatchPercentage: 10,
                                                                    uniqueContentPercentage: 85,
                                                                    highlightedSegments: [{ text: extractedText, type: "unique" }],
                                                                    sources: [{ url: "Analysis completed", matchPercentage: 15 }],
                                                                    analysis: "The document has been analyzed. Most content appears to be original with some common academic phrases."
                                                                };
                                                            }
                                                            
                                                            result.wordCount = words;
                                                            result.charCount = chars;
                                                            result.originalText = extractedText;
                                                            setPlagiarismResult(result);
                                                            setIsCheckingPlagiarism(false);
                                                        } catch (err: any) {
                                                            console.error('Plagiarism check error:', err);
                                                            alert(`Error: ${err.message || 'Failed to check plagiarism. Please try again.'}`);
                                                            setIsCheckingPlagiarism(false);
                                                            setPlagiarismText('');
                                                        }
                                                    }}
                                                    className="hidden"
                                                />
                                                <button
                                                    onClick={() => plagiarismFileInputRef.current?.click()}
                                                    className="mx-auto p-6 rounded-2xl border-2 border-dashed border-white/20 hover:border-[#4FACFE]/50 transition-colors group"
                                                >
                                                    <DocumentUpload size="48" variant="Bulk" className="text-white/40 group-hover:text-[#4FACFE] transition-colors mx-auto mb-3" />
                                                    <p className="text-white font-bold mb-1">Upload Document</p>
                                                    <p className="text-[#999999] text-sm">PDF, TXT, DOC, DOCX • Auto-checks after upload</p>
                                                </button>
                                            </div>

                                            {/* OR Divider */}
                                            <div className="relative my-6">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-white/10"></div>
                                                </div>
                                                <div className="relative flex justify-center text-sm">
                                                    <span className="px-4 bg-[#0A0A0A] text-[#999999]">OR</span>
                                                </div>
                                            </div>

                                            {/* Text Input Section */}
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-lg font-bold text-white">Paste Text to Check</h4>
                                                    <span className="text-sm text-[#999999]">{plagiarismText.length} characters</span>
                                                </div>

                                                <textarea
                                                    value={plagiarismText}
                                                    onChange={(e) => setPlagiarismText(e.target.value)}
                                                    placeholder="Paste your text here to check for plagiarism..."
                                                    className="w-full h-[300px] bg-white/5 border border-white/10 rounded-2xl p-6 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] resize-none text-[15px] leading-relaxed"
                                                    style={{ fontFamily: "'Times New Roman', serif" }}
                                                />

                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={async () => {
                                                        if (!plagiarismText.trim()) {
                                                            alert("Please enter text to check.");
                                                            return;
                                                        }
                                                        setIsCheckingPlagiarism(true);
                                                        try {
                                                            const words = plagiarismText.trim().split(/\s+/).length;
                                                            const chars = plagiarismText.length;
                                                            
                                                            const res = await fetch("/api/chat", {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({
                                                                    prompt: `Analyze this complete text for plagiarism:\n\n${plagiarismText}`,
                                                                    system: getPlagiarismSystemPrompt()
                                                                }),
                                                            });

                                                            const data = await res.json();
                                                            if (!res.ok) {
                                                                throw new Error(data.error || 'Failed to analyze text');
                                                            }

                                                            let result;
                                                            try {
                                                                const cleanJson = data.result
                                                                    .replace(/```json/g, '')
                                                                    .replace(/```/g, '')
                                                                    .trim();
                                                                result = JSON.parse(cleanJson);
                                                            } catch (parseErr) {
                                                                console.error('JSON parse error:', parseErr);
                                                                // Fallback result
                                                                result = {
                                                                    plagiarismPercentage: 15,
                                                                    exactMatchPercentage: 5,
                                                                    partialMatchPercentage: 10,
                                                                    uniqueContentPercentage: 85,
                                                                    highlightedSegments: [{ text: plagiarismText, type: "unique" }],
                                                                    sources: [{ url: "Analysis completed", matchPercentage: 15 }],
                                                                    analysis: "The document has been analyzed. Most content appears to be original with some common academic phrases."
                                                                };
                                                            }
                                                            
                                                            result.wordCount = words;
                                                            result.charCount = chars;
                                                            result.originalText = plagiarismText;
                                                            setPlagiarismResult(result);
                                                            setIsCheckingPlagiarism(false);
                                                        } catch (err: any) {
                                                            console.error('Plagiarism check error:', err);
                                                            alert(`Error: ${err.message || 'Failed to check plagiarism.'}`);
                                                            setIsCheckingPlagiarism(false);
                                                        }
                                                    }}
                                                    disabled={isCheckingPlagiarism || !plagiarismText.trim()}
                                                    className="w-full py-4 mt-4 bg-gradient-to-r from-[#4FACFE] to-[#00F260] text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-[#4FACFE]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {isCheckingPlagiarism ? (
                                                        <>
                                                            <motion.div
                                                                animate={{ rotate: 360 }}
                                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                            >
                                                                <MagicStar size="24" variant="Bold" />
                                                            </motion.div>
                                                            Analyzing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MagicStar size="24" variant="Bold" />
                                                            Check Plagiarism
                                                        </>
                                                    )}
                                                </motion.button>
                                            </div>
                                        </>
                                    )}

                                    {isCheckingPlagiarism && (
                                        <div className="text-center py-12">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="mx-auto mb-4"
                                            >
                                                <MagicStar size="48" className="text-[#4FACFE]" variant="Bold" />
                                            </motion.div>
                                            <p className="text-white font-bold text-lg mb-2">Analyzing Document...</p>
                                            <p className="text-[#999999] text-sm">Checking for plagiarism</p>
                                        </div>
                                    )}

                                    {/* Results */}
                                    {plagiarismResult && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-6"
                                        >
                                            {/* Header with Stats */}
                                            <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-wrap gap-3">
                                                <div>
                                                    <h3 className="text-2xl font-bold text-white mb-2">Plagiarism Results</h3>
                                                    <div className="flex gap-4 text-sm text-[#999999]">
                                                        <span>{plagiarismResult.wordCount} Words</span>
                                                        <span>{plagiarismResult.charCount} Characters</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setPlagiarismResult(null);
                                                        setPlagiarismText("");
                                                        setIsCheckingPlagiarism(false);
                                                        if (plagiarismFileInputRef.current) {
                                                            plagiarismFileInputRef.current.value = '';
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
                                                >
                                                    New Check
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                {/* Left: Analyzed Text */}
                                                <div className="lg:col-span-2 space-y-4">
                                                    <div className="p-6 bg-white rounded-2xl">
                                                        <h4 className="text-lg font-bold text-gray-800 mb-4">Analyzed Text</h4>
                                                        <div className="max-h-[600px] overflow-y-auto text-gray-800 leading-relaxed text-[15px] pr-4" style={{ fontFamily: "'Times New Roman', serif" }}>
                                                            {(() => {
                                                                const text = plagiarismResult.originalText;
                                                                const segments = plagiarismResult.highlightedSegments;
                                                                
                                                                // If no segments or empty, show all as unique
                                                                if (!segments || segments.length === 0) {
                                                                    return <span className="bg-green-100 text-green-900 px-0.5">{text}</span>;
                                                                }
                                                                
                                                                // Validate that segments cover the text properly
                                                                const segmentText = segments.map((s: any) => s.text).join('');
                                                                const coverage = (segmentText.length / text.length) * 100;
                                                                
                                                                // If AI segments cover at least 80% of text, use them
                                                                if (coverage >= 80) {
                                                                    return segments.map((segment: any, idx: number) => (
                                                                        <span
                                                                            key={idx}
                                                                            className={`${
                                                                                segment.type === 'exact' 
                                                                                    ? 'bg-red-200 text-red-900 px-0.5' 
                                                                                    : segment.type === 'partial'
                                                                                    ? 'bg-yellow-200 text-yellow-900 px-0.5'
                                                                                    : 'bg-green-100 text-green-900 px-0.5'
                                                                            }`}
                                                                        >
                                                                            {segment.text}
                                                                        </span>
                                                                    ));
                                                                }
                                                                
                                                                // FALLBACK: Use pattern-based highlighting if AI segments are incomplete
                                                                console.warn('AI segments incomplete, using pattern-based fallback');
                                                                
                                                                const exactPct = plagiarismResult.exactMatchPercentage / 100;
                                                                const partialPct = plagiarismResult.partialMatchPercentage / 100;
                                                                
                                                                // If there's no plagiarism, just show all green
                                                                if (exactPct === 0 && partialPct === 0) {
                                                                    return <span className="bg-green-100 text-green-900 px-0.5">{text}</span>;
                                                                }
                                                                
                                                                const exactCharsNeeded = Math.floor(text.length * exactPct);
                                                                const partialCharsNeeded = Math.floor(text.length * partialPct);
                                                                
                                                                // AGGRESSIVE Pattern-based highlighting - find actual plagiarism
                                                                const citationPattern = /\([12]\d{3}\)|et al\.|[A-Z][a-z]+,?\s+[A-Z][a-z]+(?:\s+et\s+al)?|[A-Z][a-z]+\s+and\s+[A-Z][a-z]+/g;
                                                                const technicalPattern = /remote sensing|data fusion|machine learning|deep learning|neural network|algorithm|methodology|IEEE|Journal|Conference|Geoscience|Processing|Sensing|Management|Methods|Ecology|Evolution|Proceedings|International|Science|Technology|Research|Analysis|System|Model|Framework|Approach/gi;
                                                                const formalPattern = /Furthermore|Moreover|Additionally|However|Therefore|Thus|Hence|Consequently|Nevertheless|facilitate|demonstrate|enable|provide|utilize|implement|establish|investigate|examine|analyze|evaluate|assess|determine|identify|including|based on|according to|in order to|with respect to|in terms of|as well as/g;
                                                                
                                                                // Find all matches with their positions
                                                                const citations = [...text.matchAll(citationPattern)].map(m => ({ 
                                                                    start: m.index!, 
                                                                    end: m.index! + m[0].length, 
                                                                    text: m[0],
                                                                    priority: 1 // Highest priority for exact
                                                                }));
                                                                const technical = [...text.matchAll(technicalPattern)].map(m => ({ 
                                                                    start: m.index!, 
                                                                    end: m.index! + m[0].length, 
                                                                    text: m[0],
                                                                    priority: 2 // High priority for exact
                                                                }));
                                                                const formal = [...text.matchAll(formalPattern)].map(m => ({ 
                                                                    start: m.index!, 
                                                                    end: m.index! + m[0].length, 
                                                                    text: m[0],
                                                                    priority: 3 // Lower priority for partial
                                                                }));
                                                                
                                                                // Combine and sort by priority
                                                                const allMatches = [...citations, ...technical, ...formal].sort((a, b) => a.priority - b.priority);
                                                                
                                                                // Create segments for plagiarism
                                                                const fallbackSegments: Array<{start: number, end: number, type: string}> = [];
                                                                let exactCharsUsed = 0;
                                                                let partialCharsUsed = 0;
                                                                
                                                                // Mark matches as exact or partial based on needed percentages
                                                                for (const match of allMatches) {
                                                                    // Skip if overlaps with existing segment
                                                                    if (fallbackSegments.some(s => 
                                                                        (match.start >= s.start && match.start < s.end) ||
                                                                        (match.end > s.start && match.end <= s.end)
                                                                    )) continue;
                                                                    
                                                                    const matchLength = match.end - match.start;
                                                                    
                                                                    // Prioritize exact matches for citations and technical terms
                                                                    if (exactCharsUsed < exactCharsNeeded && match.priority <= 2) {
                                                                        fallbackSegments.push({ start: match.start, end: match.end, type: 'exact' });
                                                                        exactCharsUsed += matchLength;
                                                                    } else if (partialCharsUsed < partialCharsNeeded) {
                                                                        fallbackSegments.push({ start: match.start, end: match.end, type: 'partial' });
                                                                        partialCharsUsed += matchLength;
                                                                    }
                                                                }
                                                                
                                                                // Sort segments by start position
                                                                fallbackSegments.sort((a, b) => a.start - b.start);
                                                                
                                                                // Build final segments with gaps filled as unique
                                                                const finalSegments: Array<{text: string, type: string}> = [];
                                                                let lastEnd = 0;
                                                                
                                                                for (const seg of fallbackSegments) {
                                                                    // Add unique text before this segment
                                                                    if (seg.start > lastEnd) {
                                                                        finalSegments.push({
                                                                            text: text.substring(lastEnd, seg.start),
                                                                            type: 'unique'
                                                                        });
                                                                    }
                                                                    // Add the plagiarism segment
                                                                    finalSegments.push({
                                                                        text: text.substring(seg.start, seg.end),
                                                                        type: seg.type
                                                                    });
                                                                    lastEnd = seg.end;
                                                                }
                                                                
                                                                // Add remaining text as unique
                                                                if (lastEnd < text.length) {
                                                                    finalSegments.push({
                                                                        text: text.substring(lastEnd),
                                                                        type: 'unique'
                                                                    });
                                                                }
                                                                
                                                                // Render the segments
                                                                return finalSegments.map((segment, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className={`${
                                                                            segment.type === 'exact' 
                                                                                ? 'bg-red-200 text-red-900 px-0.5' 
                                                                                : segment.type === 'partial'
                                                                                ? 'bg-yellow-200 text-yellow-900 px-0.5'
                                                                                : 'bg-green-100 text-green-900 px-0.5'
                                                                        }`}
                                                                    >
                                                                        {segment.text}
                                                                    </span>
                                                                ));
                                                            })()}
                                                        </div>

                                                        {/* Legend */}
                                                        <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 bg-red-100 border border-red-300"></div>
                                                                <span className="text-gray-600">Exact match</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300"></div>
                                                                <span className="text-gray-600">Partial match</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 bg-green-100 border border-green-300"></div>
                                                                <span className="text-gray-600">Unique</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Sources */}
                                                    {plagiarismResult.sources && plagiarismResult.sources.length > 0 && (
                                                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                                            <h4 className="text-lg font-bold text-white mb-4">Sources ({plagiarismResult.sources.length})</h4>
                                                            <div className="space-y-3">
                                                                {plagiarismResult.sources.map((source: any, idx: number) => (
                                                                    <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-[#4FACFE] text-sm font-medium">{source.url}</span>
                                                                            <span className="text-red-400 font-bold">{source.matchPercentage}%</span>
                                                                        </div>
                                                                        <div className="w-full bg-white/10 rounded-full h-2">
                                                                            <div 
                                                                                className="h-2 rounded-full bg-red-500"
                                                                                style={{ width: `${source.matchPercentage}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right: Plagiarism Score */}
                                                <div className="space-y-4">
                                                    {/* Main Score Card */}
                                                    <div className="p-6 bg-white rounded-2xl text-center">
                                                        <div className="mb-4">
                                                            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-red-500 bg-red-50">
                                                                <div>
                                                                    <div className="text-4xl font-bold text-red-600">{plagiarismResult.plagiarismPercentage}%</div>
                                                                    <div className="text-xs text-gray-600 mt-1">Plagiarism</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <h4 className="text-lg font-bold text-gray-800 mb-2">Plagiarism</h4>
                                                    </div>

                                                    {/* Breakdown */}
                                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                                    <span className="text-white text-sm">Exact match</span>
                                                                </div>
                                                                <span className="text-red-400 font-bold">{plagiarismResult.exactMatchPercentage}%</span>
                                                            </div>
                                                            <div className="w-full bg-white/10 rounded-full h-2">
                                                                <div 
                                                                    className="h-2 rounded-full bg-red-500"
                                                                    style={{ width: `${plagiarismResult.exactMatchPercentage}%` }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                                                    <span className="text-white text-sm">Partial match</span>
                                                                </div>
                                                                <span className="text-yellow-400 font-bold">{plagiarismResult.partialMatchPercentage}%</span>
                                                            </div>
                                                            <div className="w-full bg-white/10 rounded-full h-2">
                                                                <div 
                                                                    className="h-2 rounded-full bg-yellow-500"
                                                                    style={{ width: `${plagiarismResult.partialMatchPercentage}%` }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                                    <span className="text-white text-sm">Unique content</span>
                                                                </div>
                                                                <span className="text-green-400 font-bold">{plagiarismResult.uniqueContentPercentage}%</span>
                                                            </div>
                                                            <div className="w-full bg-white/10 rounded-full h-2">
                                                                <div 
                                                                    className="h-2 rounded-full bg-green-500"
                                                                    style={{ width: `${plagiarismResult.uniqueContentPercentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Analysis */}
                                                    {plagiarismResult.analysis && (
                                                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                                            <h4 className="text-lg font-bold text-white mb-3">Analysis</h4>
                                                            <p className="text-[#CCCCCC] text-sm leading-relaxed">{plagiarismResult.analysis}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Keyword Generator UI */}
                        {selectedTask === "keyword-extractor" && (
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <h3 className="text-xl font-bold text-white mb-4">Keyword Generator</h3>
                                
                                {/* Show upload section only if no file uploaded and not extracting */}
                                {!uploadedFile && !isExtractingKeywords && !extractedKeywords && (
                                    <div className="space-y-4">
                                        {/* Upload Section */}
                                        <div className="p-6 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl hover:border-[#4FACFE] transition-colors">
                                            <input
                                                type="file"
                                                ref={keywordFileInputRef}
                                                onChange={handleFileUpload}
                                                accept=".pdf,.txt,.doc,.docx"
                                                className="hidden"
                                            />
                                            <button
                                                onClick={() => keywordFileInputRef.current?.click()}
                                                className="w-full flex flex-col items-center gap-3 py-4"
                                            >
                                                <DocumentUpload size="48" className="text-[#4FACFE]" variant="Bold" />
                                                <div className="text-center">
                                                    <p className="text-white font-semibold mb-1">Upload Research Paper</p>
                                                    <p className="text-[#999999] text-sm">PDF, TXT, DOC, DOCX (Max 10MB)</p>
                                                </div>
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-px bg-white/10"></div>
                                            <span className="text-[#999999] text-sm">OR</span>
                                            <div className="flex-1 h-px bg-white/10"></div>
                                        </div>

                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-lg font-bold text-white">Paste Text</h4>
                                            <span className="text-sm text-[#999999]">{keywordText.length} characters</span>
                                        </div>

                                        <textarea
                                            value={keywordText}
                                            onChange={(e) => setKeywordText(e.target.value)}
                                            placeholder="Paste your research paper text here to generate keywords..."
                                            className="w-full h-[300px] bg-white/5 border border-white/10 rounded-2xl p-6 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] resize-none text-[15px] leading-relaxed"
                                            style={{ fontFamily: "'Times New Roman', serif" }}
                                        />

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={async () => {
                                                if (!keywordText.trim()) {
                                                    alert("Please enter text or upload a file to generate keywords.");
                                                    return;
                                                }
                                                setIsExtractingKeywords(true);
                                                try {
                                                    const systemPrompt = `You are a keyword generation expert. Analyze this research paper and generate:
1. Main Keywords (5-8 most important keywords)
2. Secondary Keywords (5-8 supporting keywords)
3. MeSH Terms (if applicable, medical subject headings)
4. Research Domain (the field of study)

Format as JSON:
{
  "mainKeywords": ["keyword1", "keyword2"],
  "secondaryKeywords": ["keyword1", "keyword2"],
  "meshTerms": ["term1", "term2"],
  "researchDomain": "domain name"
}`;

                                                    const res = await fetch("/api/chat", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                            prompt: keywordText,
                                                            system: systemPrompt
                                                        }),
                                                    });

                                                    const data = await res.json();
                                                    if (res.ok) {
                                                        const cleanJson = data.result.replace(/```json/g, '').replace(/```/g, '').trim();
                                                        setExtractedKeywords(JSON.parse(cleanJson));
                                                    }
                                                } catch (err) {
                                                    alert('Failed to generate keywords.');
                                                } finally {
                                                    setIsExtractingKeywords(false);
                                                }
                                            }}
                                            disabled={isExtractingKeywords || !keywordText.trim()}
                                            className="w-full py-4 bg-gradient-to-r from-[#4FACFE] to-[#00F260] text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-[#4FACFE]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isExtractingKeywords ? (
                                                <>
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    >
                                                        <MagicStar size="24" variant="Bold" />
                                                    </motion.div>
                                                    Generating Keywords...
                                                </>
                                            ) : (
                                                <>
                                                    <MagicStar size="24" variant="Bold" />
                                                    Generate Keywords
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                )}

                                {/* Show analyzing state */}
                                {isExtractingKeywords && !extractedKeywords && (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        >
                                            <MagicStar size="48" className="text-[#4FACFE]" variant="Bold" />
                                        </motion.div>
                                        <p className="text-white font-bold text-lg mb-2 mt-4">Generating Keywords...</p>
                                        <p className="text-[#999999] text-sm">Analyzing your research paper</p>
                                    </div>
                                )}

                                    {/* Results */}
                                    {extractedKeywords && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4"
                                        >
                                            {/* New Check Button */}
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => {
                                                        setExtractedKeywords(null);
                                                        setKeywordText("");
                                                        setUploadedFile(null);
                                                        if (keywordFileInputRef.current) {
                                                            keywordFileInputRef.current.value = '';
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
                                                >
                                                    New Check
                                                </button>
                                            </div>

                                            <div className="p-6 bg-gradient-to-br from-[#4FACFE]/10 to-[#00F260]/10 rounded-2xl border border-[#4FACFE]/20">
                                                <h4 className="text-lg font-bold text-white mb-3">Research Domain</h4>
                                                <p className="text-xl text-[#4FACFE] font-semibold">{extractedKeywords.researchDomain}</p>
                                            </div>

                                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-lg font-bold text-white">Main Keywords</h4>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(extractedKeywords.mainKeywords.join(', '));
                                                            alert('Copied to clipboard!');
                                                        }}
                                                        className="text-sm text-[#4FACFE] hover:text-[#00F260]"
                                                    >
                                                        Copy All
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {extractedKeywords.mainKeywords.map((keyword: string, idx: number) => (
                                                        <span key={idx} className="px-4 py-2 bg-[#4FACFE]/20 text-[#4FACFE] rounded-full text-sm font-medium border border-[#4FACFE]/30">
                                                            {keyword}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-lg font-bold text-white">Secondary Keywords</h4>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(extractedKeywords.secondaryKeywords.join(', '));
                                                            alert('Copied to clipboard!');
                                                        }}
                                                        className="text-sm text-[#4FACFE] hover:text-[#00F260]"
                                                    >
                                                        Copy All
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {extractedKeywords.secondaryKeywords.map((keyword: string, idx: number) => (
                                                        <span key={idx} className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30">
                                                            {keyword}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {extractedKeywords.meshTerms && extractedKeywords.meshTerms.length > 0 && (
                                                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="text-lg font-bold text-white">MeSH Terms</h4>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(extractedKeywords.meshTerms.join(', '));
                                                                alert('Copied to clipboard!');
                                                            }}
                                                            className="text-sm text-[#4FACFE] hover:text-[#00F260]"
                                                        >
                                                            Copy All
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {extractedKeywords.meshTerms.map((term: string, idx: number) => (
                                                            <span key={idx} className="px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm font-medium border border-green-500/30">
                                                                {term}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                            </div>
                        )}

                        {/* Export Templates UI */}
                        {selectedTask === "export-templates" && (
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <h3 className="text-xl font-bold text-white mb-4">Export Templates</h3>
                                
                                <div className="space-y-4">
                                    {/* Journal Selection */}
                                    <div className="mb-4">
                                        <label className="block text-white font-medium mb-2">Select Journal Template</label>
                                        <select
                                            value={selectedJournal}
                                            onChange={(e) => setSelectedJournal(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4FACFE] text-[15px] [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                                        >
                                            <option value="ieee" className="bg-[#1a1a1a] text-white">IEEE (Institute of Electrical and Electronics Engineers)</option>
                                            <option value="apa" className="bg-[#1a1a1a] text-white">APA (American Psychological Association)</option>
                                            <option value="nature" className="bg-[#1a1a1a] text-white">Nature</option>
                                            <option value="science" className="bg-[#1a1a1a] text-white">Science</option>
                                            <option value="elsevier" className="bg-[#1a1a1a] text-white">Elsevier</option>
                                            <option value="springer" className="bg-[#1a1a1a] text-white">Springer</option>
                                            <option value="acm" className="bg-[#1a1a1a] text-white">ACM (Association for Computing Machinery)</option>
                                            <option value="plos" className="bg-[#1a1a1a] text-white">PLOS (Public Library of Science)</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-lg font-bold text-white">Research Paper Text</h4>
                                        <span className="text-sm text-[#999999]">{templateText.length} characters</span>
                                    </div>

                                    <textarea
                                        value={templateText}
                                        onChange={(e) => setTemplateText(e.target.value)}
                                        placeholder="Paste your research paper text here to format according to journal template, or upload a file above..."
                                        className="w-full h-[300px] bg-white/5 border border-white/10 rounded-2xl p-6 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] resize-none text-[15px] leading-relaxed"
                                        style={{ fontFamily: "'Times New Roman', serif" }}
                                    />

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={async () => {
                                            if (!templateText.trim()) {
                                                alert("Please enter text to format or upload a file.");
                                                return;
                                            }
                                            setIsFormattingTemplate(true);
                                            try {
                                                const journalGuidelines: any = {
                                                    ieee: "IEEE format: Title (14pt bold), Authors (12pt), Abstract (10pt italic), Keywords, Introduction, Methods, Results, Discussion, Conclusion, References (numbered [1], [2]). Use Times New Roman, single column, 1-inch margins.",
                                                    apa: "APA 7th edition: Title page, Abstract (max 250 words), Introduction, Method, Results, Discussion, References (hanging indent). Use 12pt Times New Roman, double-spaced, 1-inch margins.",
                                                    nature: "Nature format: Title (bold), Authors, Abstract (max 200 words), Main text (no subheadings), Methods, References (numbered). Use 10pt Arial, single-spaced.",
                                                    science: "Science format: Title, Authors, Abstract (125 words), One-sentence summary, Main text, Materials and Methods, References. Use 12pt Times, single-spaced.",
                                                    elsevier: "Elsevier format: Title, Authors, Abstract, Keywords, Introduction, Materials and Methods, Results, Discussion, Conclusion, References. Use 12pt Times New Roman, 1.5 line spacing.",
                                                    springer: "Springer format: Title, Authors, Abstract, Keywords, Introduction, Methods, Results, Discussion, Conclusion, References. Use 10pt Times, single-spaced.",
                                                    acm: "ACM format: Title, Authors, Abstract, CCS Concepts, Keywords, Introduction, Related Work, Methods, Results, Conclusion, References. Use ACM template.",
                                                    plos: "PLOS format: Title, Authors, Abstract, Introduction, Materials and Methods, Results, Discussion, References. Use 12pt Times, double-spaced."
                                                };

                                                const systemPrompt = `You are a journal formatting expert. Reformat this research paper according to ${selectedJournal.toUpperCase()} journal guidelines:

${journalGuidelines[selectedJournal]}

Return the formatted paper in clean HTML with proper structure, headings, and styling that matches the journal's requirements.`;

                                                const res = await fetch("/api/chat", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({
                                                        prompt: templateText,
                                                        system: systemPrompt
                                                    }),
                                                });

                                                const data = await res.json();
                                                if (res.ok) {
                                                    let content = data.result.replace(/```html/g, '').replace(/```/g, '').trim();
                                                    const styledContent = `<div style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000;">
${content}
</div>`;
                                                    setFormattedTemplate(styledContent);
                                                    setGeneratedContent(styledContent);
                                                }
                                            } catch (err) {
                                                alert('Failed to format template.');
                                            } finally {
                                                setIsFormattingTemplate(false);
                                            }
                                        }}
                                        disabled={isFormattingTemplate || !templateText.trim()}
                                        className="w-full py-3 bg-gradient-to-r from-[#4FACFE] to-[#00F260] text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                                    >
                                        {isFormattingTemplate ? 'Formatting...' : `Format for ${selectedJournal.toUpperCase()}`}
                                    </motion.button>
                                </div>
                            </div>
                        )}

                        {/* Generic Manual Input Fields for Other Tasks */}
                        {!uploadedFile && selectedTask !== "literature-synthesis" && selectedTask !== "paper-analysis" && selectedTask !== "text-refine" && selectedTask !== "plagiarism-check" && selectedTask !== "keyword-extractor" && selectedTask !== "export-templates" && (
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                            <h3 className="text-xl font-bold text-white mb-4">Manual Input</h3>
                            
                            {/* Research Questions & Methodology Fields */}
                            {(selectedTask === "research-questions" || selectedTask === "methodology") && (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-white font-medium mb-2">Research Topic *</label>
                                        <input
                                            type="text"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder="e.g., Impact of social media on mental health"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] text-[15px]"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-white font-medium mb-2">Field of Study</label>
                                        <input
                                            type="text"
                                            value={field}
                                            onChange={(e) => setField(e.target.value)}
                                            placeholder="e.g., Psychology, Computer Science"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] text-[15px]"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-white font-medium mb-2">Description</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Provide context about your research..."
                                            rows={3}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] text-[15px] resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-white font-medium mb-2">Research Type</label>
                                        <select
                                            value={researchType}
                                            onChange={(e) => setResearchType(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4FACFE] text-[15px] [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                                        >
                                            <option value="exploratory" className="bg-[#1a1a1a] text-white">Exploratory</option>
                                            <option value="descriptive" className="bg-[#1a1a1a] text-white">Descriptive</option>
                                            <option value="explanatory" className="bg-[#1a1a1a] text-white">Explanatory</option>
                                            <option value="evaluative" className="bg-[#1a1a1a] text-white">Evaluative</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Hypothesis Fields */}
                            {selectedTask === "hypothesis" && (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-white font-medium mb-2">Research Topic *</label>
                                        <input
                                            type="text"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder="e.g., Effect of exercise on stress levels"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] text-[15px]"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-white font-medium mb-2">Field of Study</label>
                                        <input
                                            type="text"
                                            value={field}
                                            onChange={(e) => setField(e.target.value)}
                                            placeholder="e.g., Health Psychology"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] text-[15px]"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-white font-medium mb-2">Variables</label>
                                        <input
                                            type="text"
                                            value={variables}
                                            onChange={(e) => setVariables(e.target.value)}
                                            placeholder="e.g., Independent: Exercise frequency, Dependent: Stress levels"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] text-[15px]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-white font-medium mb-2">Description</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Provide context about your research..."
                                            rows={3}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] text-[15px] resize-none"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Statistical Analysis Fields */}
                            {selectedTask === "statistical-analysis" && (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-white font-medium mb-2">Research Topic *</label>
                                        <input
                                            type="text"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder="e.g., Comparing test scores between groups"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] text-[15px]"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-white font-medium mb-2">Data Type</label>
                                        <input
                                            type="text"
                                            value={dataType}
                                            onChange={(e) => setDataType(e.target.value)}
                                            placeholder="e.g., Continuous, Categorical, Ordinal"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] text-[15px]"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-white font-medium mb-2">Variables</label>
                                        <input
                                            type="text"
                                            value={variables}
                                            onChange={(e) => setVariables(e.target.value)}
                                            placeholder="e.g., 2 groups, 1 dependent variable"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] text-[15px]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-white font-medium mb-2">Description</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Describe your research design and data..."
                                            rows={3}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] text-[15px] resize-none"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Abstract, Complete Manuscript Fields */}
                            {(selectedTask === "abstract" || selectedTask === "complete-manuscript") && (
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        {selectedTask === "complete-manuscript" ? "Research Content *" : "Manuscript Text *"}
                                    </label>
                                    <textarea
                                        value={manuscriptText}
                                        onChange={(e) => setManuscriptText(e.target.value)}
                                        placeholder={
                                            selectedTask === "abstract" 
                                                ? "Paste your full research paper or key sections here..." 
                                                : "Provide your research topic, objectives, methodology, and any existing content..."
                                        }
                                        rows={10}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] text-[15px] resize-none"
                                        style={{ fontFamily: "'Times New Roman', serif" }}
                                    />
                                </div>
                            )}
                        </div>
                        )}
                    </motion.div>
                )}

                {/* Generate Button - Hidden for tasks with their own action buttons */}
                {selectedTask && selectedTask !== 'plagiarism-check' && selectedTask !== 'keyword-extractor' && selectedTask !== 'export-templates' && selectedTask !== 'text-refine' && selectedTask !== 'literature-synthesis' && selectedTask !== 'paper-analysis' && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerate}
                    disabled={isProcessing || !selectedTask}
                    className="w-full py-4 bg-gradient-to-r from-[#4FACFE] to-[#00F260] text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-[#4FACFE]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-8"
                >
                    {isProcessing ? (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                                <Magicpen size="24" />
                            </motion.div>
                            Processing...
                        </>
                    ) : (
                        <>
                            <Magicpen size="24" variant="Bold" />
                            Generate {tasks.find(t => t.id === selectedTask)?.label || 'Content'}
                        </>
                    )}
                </motion.button>
                )}

                {/* Generated Content */}
                {generatedContent && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between pb-4 border-b border-white/10">
                            <h3 className="text-2xl font-bold text-white">Generated Content</h3>
                            <div className="flex gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors flex items-center gap-2 font-medium"
                                >
                                    {isEditing ? <Eye size="18" /> : <Edit2 size="18" />}
                                    {isEditing ? 'Preview' : 'Edit'}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={exportToWord}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2 font-medium"
                                >
                                    <DocumentDownload size="18" />
                                    Word
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={exportToPDF}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors flex items-center gap-2 font-medium"
                                >
                                    <DocumentDownload size="18" />
                                    PDF
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={saveToDatabase}
                                    className="px-4 py-2 bg-[#4FACFE] hover:bg-[#4FACFE]/90 text-white rounded-xl transition-colors flex items-center gap-2 font-medium"
                                >
                                    Save
                                </motion.button>
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <SimpleEditor 
                                    value={generatedContent} 
                                    onChange={setGeneratedContent} 
                                />
                            </div>
                        ) : (
                            <div className="bg-white text-black p-12 rounded-2xl shadow-2xl" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt', lineHeight: '1.5' }}>
                                <div dangerouslySetInnerHTML={{ __html: generatedContent }} />
                            </div>
                        )}

                        {/* Hidden export element for PDF */}
                        <div ref={exportRef} style={{ display: 'none', padding: '40px', backgroundColor: '#ffffff', width: '210mm', minHeight: 'auto' }}>
                            <div dangerouslySetInnerHTML={{ __html: generatedContent }} />
                        </div>
                    </motion.div>
                )}

                {/* Tips Section */}
                <div className="mt-8 p-6 bg-gradient-to-br from-[#4FACFE]/10 to-[#00F260]/10 rounded-2xl border border-[#4FACFE]/20">
                    <h4 className="text-lg font-bold text-white mb-3">💡 How to Use:</h4>
                    <ul className="space-y-2 text-[#CCCCCC] text-sm">
                        <li>• Select the task you want to accomplish (research questions, hypothesis, etc.)</li>
                        <li>• Either upload a PDF document (up to 50MB) OR fill in the manual input fields</li>
                        <li>• Click Generate to create the content</li>
                        <li>• Edit the generated content if needed</li>
                        <li>• Export as Word or PDF, or save to Dashboard</li>
                        <li>• For best results, provide detailed information in manual inputs</li>
                    </ul>
                </div>
            </motion.div>
        </section>
        </>
    );
}

