"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight2, Magicpen, TickCircle, Save2, DocumentDownload, Activity, Edit2, Eye } from "iconsax-react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
const SimpleEditor = dynamic(() => import("./SimpleEditor"), { ssr: false, loading: () => <p>Loading editor...</p> });
import { PROPOSAL_TEMPLATES } from "@/lib/templates";
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

export function GrantWizard({ isGuest = false }: { isGuest?: boolean }) {
    const [step, setStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [complete, setComplete] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");

    // Form State
    const [title, setTitle] = useState("");
    const [docType, setDocType] = useState("Grant Proposal");
    const [agency, setAgency] = useState("National Science Foundation (NSF)");
    const [field, setField] = useState("");
    const [problemStatement, setProblemStatement] = useState("");
    const [objective, setObjective] = useState("");
    const [tone, setTone] = useState(50);
    const [budget, setBudget] = useState("");
    const [timeline, setTimeline] = useState("");
    const [teamDetails, setTeamDetails] = useState("");
    const [timelineDescription, setTimelineDescription] = useState("");
    const [budgetDescription, setBudgetDescription] = useState("");
    const [result, setResult] = useState<string | null>(null);

    // File upload state
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
    const [fileAnalysis, setFileAnalysis] = useState<any>(null);
    const [isFileUploaded, setIsFileUploaded] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisData, setAnalysisData] = useState<{ novelty: number; impact: number; feasibility: number; summary: string } | null>(null);

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

        // Check file type - only PDF supported by Gemini
        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF document. Word files are not supported by the AI model. You can convert your Word document to PDF first.');
            return;
        }

        setUploadedFile(file);
        setIsAnalyzingFile(true);
        setStep(4); // Move to analysis step immediately
        setIsAnalyzing(true);

        try {
            const base64 = await fileToBase64(file);
            
            // Step 1: Extract information from document
            const extractionPrompt = `You are an expert research analyst. Analyze this research paper/document thoroughly and extract key information.

CRITICAL: Return ONLY a valid JSON object (no markdown, no code blocks, no extra text).

VALIDATION RULES:
- Document MUST contain a clear research title
- Document MUST contain research objectives or goals
- Document MUST contain a problem statement or research gap
- Document MUST contain methodology or approach
- If ANY of these are missing or unclear, set isValid to false

Extract and return this exact JSON structure:
{
  "title": "<project title - must be clear and specific>",
  "field": "<field of study>",
  "problemStatement": "<detailed research gap or problem being addressed - minimum 50 words>",
  "objective": "<main research objectives and goals - minimum 50 words>",
  "methodology": "<research methodology if mentioned>",
  "teamDetails": "<author names and affiliations if mentioned>",
  "isValid": true/false,
  "validationMessage": "<specific message about what is missing if isValid is false>"
}

If the document is incomplete, provide a specific validationMessage like:
"This document is missing [specific items]. Please upload a complete research paper that includes: Title, Problem Statement, Research Objectives, and Methodology."`;

            const extractRes = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: "Analyze this research document and extract the information.",
                    system: extractionPrompt,
                    files: [{
                        data: base64,
                        mimeType: file.type
                    }]
                }),
            });

            const extractData = await extractRes.json();
            
            if (!extractRes.ok) {
                throw new Error('Failed to extract document information');
            }

            const cleanJsonStr = extractData.result
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();
            const analysis = JSON.parse(cleanJsonStr);
            
            if (analysis.isValid === false) {
                alert(analysis.validationMessage || 'The uploaded document does not contain proper research details. Please upload a complete research paper.');
                setUploadedFile(null);
                setFileAnalysis(null);
                setIsFileUploaded(false);
                setIsAnalyzingFile(false);
                setIsAnalyzing(false);
                setStep(1);
                return;
            }
            
            setFileAnalysis(analysis);
            setIsFileUploaded(true);
            // Auto-fill form fields
            setTitle(analysis.title || "");
            setField(analysis.field || "");
            setProblemStatement(analysis.problemStatement || "");
            setObjective(analysis.objective || "");
            setTeamDetails(analysis.teamDetails || "");
            
            // Step 2: Analyze novelty
            const noveltyPrompt = `You are an expert grant reviewer. Analyze this research proposal and return ONLY a valid JSON object (no markdown, no code blocks).

Project: ${analysis.title}
Field: ${analysis.field}
Problem: ${analysis.problemStatement}
Objective: ${analysis.objective}

Return this exact JSON structure:
{
  "novelty": <number 0-100>,
  "impact": <number 0-100>,
  "feasibility": <number 0-100>,
  "summary": "<2 sentences about strengths>"
}`;

            const noveltyRes = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    prompt: "Analyze and return JSON only.", 
                    system: noveltyPrompt 
                }),
            });

            const noveltyData = await noveltyRes.json();
            
            if (noveltyRes.ok) {
                const cleanNoveltyStr = noveltyData.result
                    .replace(/```json/g, '')
                    .replace(/```/g, '')
                    .trim();
                const parsed = JSON.parse(cleanNoveltyStr);
                setAnalysisData({
                    novelty: parsed.novelty || 80,
                    impact: parsed.impact || 80,
                    feasibility: parsed.feasibility || 80,
                    summary: parsed.summary || "Strong proposal with good potential."
                });
            } else {
                // Fallback if novelty analysis fails
                setAnalysisData({ 
                    novelty: 85, 
                    impact: 90, 
                    feasibility: 75, 
                    summary: "Strong research direction with significant potential impact." 
                });
            }
            
        } catch (err) {
            console.error('File upload error:', err);
            alert('Failed to process file. Please try again.');
            setUploadedFile(null);
            setIsFileUploaded(false);
            setStep(1);
        } finally {
            setIsAnalyzingFile(false);
            setIsAnalyzing(false);
        }
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setStep(4);
        try {
            const systemPrompt = `You are an expert grant reviewer. Analyze this research proposal and return ONLY a valid JSON object (no markdown, no code blocks).

Project: ${title}
Field: ${field}
Problem: ${problemStatement}
Objective: ${objective}

Return this exact JSON structure:
{
  "novelty": <number 0-100>,
  "impact": <number 0-100>,
  "feasibility": <number 0-100>,
  "summary": "<2 sentences about strengths>"
}`;

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    prompt: "Analyze and return JSON only.", 
                    system: systemPrompt 
                }),
            });

            const data = await res.json();
            if (res.ok) {
                try {
                    const cleanJsonStr = data.result
                        .replace(/```json/g, '')
                        .replace(/```/g, '')
                        .trim();
                    const parsed = JSON.parse(cleanJsonStr);
                    setAnalysisData({
                        novelty: parsed.novelty || 80,
                        impact: parsed.impact || 80,
                        feasibility: parsed.feasibility || 80,
                        summary: parsed.summary || "Strong proposal with good potential."
                    });
                } catch (e) {
                    setAnalysisData({ 
                        novelty: 85, 
                        impact: 90, 
                        feasibility: 75, 
                        summary: "Strong research direction with significant potential impact." 
                    });
                }
            }
        } catch (err) {
            setAnalysisData({ 
                novelty: 80, 
                impact: 80, 
                feasibility: 80, 
                summary: "Unable to complete analysis. Proceeding with generation." 
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleNext = async () => {
        if (step < 3) {
            setStep(step + 1);
        } else if (step === 3) {
            await handleAnalyze();
        } else if (step === 4 && isFileUploaded && analysisData) {
            // For file uploads, after showing novelty, move to budget input (step 5)
            setStep(5);
        } else {
            setIsGenerating(true);
            try {
                const toneDescription = tone < 33 
                    ? "formal, conservative academic tone" 
                    : tone > 66 
                    ? "visionary, persuasive, innovative tone" 
                    : "balanced, professional tone";

                const formatInstructions = PROPOSAL_TEMPLATES[agency] || PROPOSAL_TEMPLATES["Generic"] || "Standard academic format";

                const systemPrompt = `You are an expert academic writer. Create a comprehensive Research Grant Proposal following this EXACT structure and format:

# RESEARCH GRANT PROPOSAL

## Title: ${title}

## 1. Executive Summary
Write a comprehensive executive summary (200-300 words) covering:
- Brief overview of the project
- Problem statement: ${problemStatement}
- Proposed solution
- Project duration: ${timeline}
- Funding amount: ${budget}

## 2. Background and Problem Statement
Elaborate on: ${problemStatement}
Include:
- Current challenges in the field
- Existing gaps in research
- Why this research is needed now
- Impact of not addressing this problem

## 3. Objectives
Detail the objectives: ${objective}
Include:
- Primary research objectives (3-5 specific goals)
- Expected outcomes for each objective
- Measurable success criteria

## 4. Literature Review
Provide a comprehensive literature review:
- Recent studies and findings in ${field}
- Existing systems and their limitations
- How this project addresses the gaps
- Cite relevant research (use realistic citations)

## 5. Research Methodology
### 5.1 Data Collection
Describe data sources and collection methods

### 5.2 Data Preprocessing
Explain preprocessing steps and techniques

### 5.3 Model Development
Detail the development approach and technologies

### 5.4 Evaluation Metrics
List specific metrics for measuring success

### 5.5 Deployment
Describe deployment strategy and implementation plan

## 6. Expected Outcomes
List specific deliverables:
- Research publications
- Prototypes or systems
- Datasets
- Impact on the field
- Societal benefits

## 7. Project Timeline (${timeline})

${timelineDescription ? `The user has provided specific timeline details. You MUST use this exact information and only refine the grammar and English:

${timelineDescription}

Present the above timeline in a well-formatted structured list with bold phase headings. Do NOT change the phases, durations, or activities - only improve grammar and readability.` : 'Create an appropriate timeline breakdown based on the project scope.'}

${!timelineDescription ? `Present the project timeline as a structured list with clear phases. Format each phase like this:

**Phase 1: [Phase Name] (Months X-Y)**
- Activity 1
- Activity 2
- Activity 3

**Phase 2: [Phase Name] (Months X-Y)**
- Activity 1
- Activity 2
- Activity 3

Continue for 4-6 phases covering the entire ${timeline} duration. Be specific and detailed about activities in each phase.` : ''}

## 8. Budget Justification

${budgetDescription ? `The user has provided specific budget details. You MUST use this exact information and only refine the grammar and English:

${budgetDescription}

Present the above budget in a well-formatted structured list with bold category headings and amounts. Do NOT change the categories or amounts - only improve grammar, formatting, and add brief justifications if missing. Ensure the total equals ${budget}.` : 'Create an appropriate budget breakdown based on the project scope.'}

${!budgetDescription ? `Present the budget breakdown as a structured list. Total budget: ${budget}

Format each category like this:

**1. Research Personnel: ₹X,XX,XXX**
- Research Assistant/Post-doctoral Fellow
- Student researchers and support staff
- Justification for personnel costs

**2. Computing Resources: ₹X,XX,XXX**
- GPU/Cloud computing services
- High-performance computing access
- Data storage and backup

**3. Software and Tools: ₹X,XX,XXX**
- Software licenses
- Development tools
- Analysis platforms

Continue for 6-8 budget categories. Ensure all amounts add up to exactly ${budget}. Provide brief justification for each category.` : ''}

## 9. Ethical Considerations
Address:
- Patient/participant data anonymization
- Institutional ethical clearance requirements
- Compliance with data protection regulations
- Transparent AI model reporting
- Bias mitigation strategies

## 10. Dissemination Plan
Detail plans for:
- Publication in peer-reviewed journals (specify target journals)
- Conference presentations (specify conferences)
- Open-source contributions (if applicable)
- Community engagement
- Knowledge transfer

## 11. Conclusion
Write a strong conclusion (150-200 words):
- Summarize the research significance
- Emphasize the impact on ${field}
- Highlight innovation and feasibility
- Reinforce the value proposition

CRITICAL FORMATTING REQUIREMENTS:
1. Use Markdown with # for H1, ## for H2, ### for H3
2. Make all section headings bold using **
3. Use structured lists with bold subheadings for Timeline and Budget sections
4. Be detailed and analytical (2500-3500 words total)
5. Use professional academic language
6. Include realistic citations where appropriate
7. Field: ${field}
8. Team: ${teamDetails}

ABSOLUTE REQUIREMENTS:
- Generate ALL 11 sections completely from start to finish
- Timeline section: Present 4-6 phases as structured list with bold phase names and bullet points
- Budget section: Present 6-8 categories as structured list with bold category names and amounts
- All budget amounts must sum to ${budget}
- DO NOT use Markdown tables (| | format) - use structured lists instead
- DO NOT stop mid-generation - complete the entire document including the Conclusion section`;

                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: `Generate the complete Research Grant Proposal now in Markdown format following the exact structure provided.`,
                        system: systemPrompt
                    }),
                });

                const data = await res.json();

                if (res.ok) {
                    let generatedContent = data.result;
                    
                    // Post-process to clean up formatting
                    generatedContent = generatedContent
                        // Clean up multiple consecutive blank lines
                        .replace(/\n{4,}/g, '\n\n\n')
                        // Ensure proper spacing after headings
                        .replace(/(#{1,3}\s+[^\n]+)\n([^\n])/g, '$1\n\n$2')
                        // Remove any stray table separators if AI still tries to make tables
                        .split('\n')
                        .filter((line: string) => {
                            const trimmed = line.trim();
                            // Remove lines that are just table separators with dashes
                            return !(trimmed.match(/^\|[\s-]+\|[\s-]+\|[\s-]*\|?$/) && trimmed.split('|').every(cell => cell.trim() === '' || /^-+$/.test(cell.trim())));
                        })
                        .join('\n');
                    
                    setResult(generatedContent);
                    setEditContent(generatedContent);
                } else {
                    setResult(`# Error\n\nFailed to generate proposal: ${data.error || 'Unknown error'}`);
                }
            } catch (err) {
                setResult(`# Error\n\nConnection error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            } finally {
                setIsGenerating(false);
                setComplete(true);
            }
        }
    };

    const handleSave = async () => {
        if (!result) return;
        
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
            
            const res = await fetch("/api/research", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: userId,
                    title: `${docType}: ${title || 'Untitled'}`,
                    type: docType === "Journal Paper" ? "paper" : "proposal",
                    content: isEditing ? editContent : result,
                    sourcePrompt: `Target: ${agency}\nObjective: ${objective}`
                }),
            });
            if (res.ok) {
                setIsSaved(true);
            }
        } catch (err) {
            console.error("Failed to save", err);
        }
    };

    const exportToPDF = async () => {
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const element = document.getElementById('pdf-export-content');
            if (element) {
                // Make the element visible temporarily for PDF generation
                element.style.display = 'block';
                
                await html2pdf().from(element).set({
                    margin: [0.75, 0.75, 0.75, 0.75],
                    filename: `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'document'}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { 
                        scale: 2, 
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#ffffff'
                    },
                    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                }).save();
                
                // Hide it again after generation
                element.style.display = 'none';
            }
        } catch (error) {
            console.error("PDF export failed:", error);
            alert("PDF export failed. Please try again.");
        }
    };

    const exportToWord = () => {
        try {
            const contentToExport = isEditing ? editContent : result;
            if (!contentToExport) return;
            
            // Function to convert Markdown formatting to HTML with improved regex
            const convertMarkdownToHtml = (text: string): string => {
                return text
                    // Handle bold + italic (*** or ___) - must be done first
                    .replace(/\*\*\*([\s\S]+?)\*\*\*/g, '<strong><em>$1</em></strong>')
                    .replace(/\_\_\_([\s\S]+?)\_\_\_/g, '<strong><em>$1</em></strong>')
                    // Handle bold (** or __)
                    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\_\_([\s\S]+?)\_\_/g, '<strong>$1</strong>')
                    // Handle italic (* or _) - must be done last
                    .replace(/\*([\s\S]+?)\*/g, '<em>$1</em>')
                    .replace(/\_([\s\S]+?)\_/g, '<em>$1</em>');
            };
            
            // Enhanced Markdown to HTML conversion with proper structure
            let lines = contentToExport.split('\n');
            let htmlContent = '';
            let inList = false;
            
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                
                // Handle headings
                if (line.startsWith('### ')) {
                    if (inList) { htmlContent += '</ul>'; inList = false; }
                    let headingText = convertMarkdownToHtml(line.substring(4));
                    htmlContent += `<h3>${headingText}</h3>`;
                } else if (line.startsWith('## ')) {
                    if (inList) { htmlContent += '</ul>'; inList = false; }
                    let headingText = convertMarkdownToHtml(line.substring(3));
                    htmlContent += `<h2>${headingText}</h2>`;
                } else if (line.startsWith('# ')) {
                    if (inList) { htmlContent += '</ul>'; inList = false; }
                    let headingText = convertMarkdownToHtml(line.substring(2));
                    htmlContent += `<h1>${headingText}</h1>`;
                }
                // Handle list items (both - and *)
                else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                    if (!inList) { htmlContent += '<ul>'; inList = true; }
                    let listContent = convertMarkdownToHtml(line.trim().substring(2));
                    htmlContent += `<li>${listContent}</li>`;
                }
                // Handle regular paragraphs
                else if (line.trim() !== '') {
                    if (inList) { htmlContent += '</ul>'; inList = false; }
                    let paraContent = convertMarkdownToHtml(line);
                    htmlContent += `<p>${paraContent}</p>`;
                }
                // Handle empty lines
                else {
                    if (inList) { htmlContent += '</ul>'; inList = false; }
                }
            }
            
            // Close any open list
            if (inList) { htmlContent += '</ul>'; }
            
            const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${title}</title>
                <!--[if gte mso 9]>
                <xml>
                    <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:Zoom>100</w:Zoom>
                        <w:DoNotOptimizeForBrowser/>
                    </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                    @page {
                        size: 8.5in 11in;
                        margin: 1in;
                    }
                    body { 
                        font-family: "Times New Roman", Times, serif; 
                        font-size: 12pt; 
                        line-height: 1.5; 
                        color: #000000;
                        margin: 0;
                        padding: 0;
                    }
                    h1 { 
                        font-family: "Times New Roman", Times, serif;
                        font-size: 18pt; 
                        font-weight: bold; 
                        margin-top: 24pt;
                        margin-bottom: 12pt;
                        margin-left: 0;
                        margin-right: 0;
                        text-align: center;
                        page-break-after: avoid;
                        line-height: 1.2;
                    }
                    h2 { 
                        font-family: "Times New Roman", Times, serif;
                        font-size: 14pt; 
                        font-weight: bold; 
                        margin-top: 18pt; 
                        margin-bottom: 8pt;
                        margin-left: 0;
                        margin-right: 0;
                        text-align: left;
                        page-break-after: avoid;
                        line-height: 1.2;
                    }
                    h3 { 
                        font-family: "Times New Roman", Times, serif;
                        font-size: 12pt; 
                        font-weight: bold; 
                        margin-top: 14pt; 
                        margin-bottom: 6pt;
                        margin-left: 0;
                        margin-right: 0;
                        text-align: left;
                        page-break-after: avoid;
                        line-height: 1.2;
                    }
                    p { 
                        font-family: "Times New Roman", Times, serif;
                        font-size: 12pt;
                        margin-top: 0;
                        margin-bottom: 10pt;
                        margin-left: 0;
                        margin-right: 0;
                        text-align: justify;
                        text-indent: 0;
                        line-height: 1.5;
                    }
                    ul { 
                        font-family: "Times New Roman", Times, serif;
                        font-size: 12pt;
                        margin-top: 6pt;
                        margin-bottom: 10pt; 
                        margin-left: 0.5in;
                        margin-right: 0;
                        padding-left: 0;
                        list-style-type: disc;
                    }
                    ol { 
                        font-family: "Times New Roman", Times, serif;
                        font-size: 12pt;
                        margin-top: 6pt;
                        margin-bottom: 10pt; 
                        margin-left: 0.5in;
                        margin-right: 0;
                        padding-left: 0;
                    }
                    li { 
                        font-family: "Times New Roman", Times, serif;
                        font-size: 12pt;
                        margin-bottom: 4pt;
                        margin-left: 0;
                        text-align: left;
                        line-height: 1.5;
                    }
                    strong { 
                        font-weight: bold; 
                    }
                    em { 
                        font-style: italic; 
                    }
                </style>
            </head>
            <body>${htmlContent}</body></html>`;
            
            const blob = new Blob(['\ufeff', html], {
                type: 'application/msword;charset=utf-8'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'document'}.doc`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Word export failed:", error);
            alert("Word export failed. Please try again.");
        }
    };


    return (
        <section id="grant-wizard" className="px-6 py-24 max-w-4xl mx-auto">
            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-center mb-12"
            >
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                    <span className="text-gradient-grant">Grant</span> Generator
                </h2>
                <p className="text-[#999999] text-lg">Step-by-step wizard to craft compelling, structured grant proposals.</p>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="glass-card rounded-[32px] p-8 md:p-12 relative overflow-hidden"
            >
                {/* Progress Bar */}
                <div className="flex gap-2 mb-12">
                    {(isFileUploaded ? [1, 4, 5] : [1, 2, 3, 4]).map((s) => (
                        <div
                            key={s}
                            className={`h-2 flex-1 rounded-full transition-colors duration-500 ${(s <= step && !complete) || complete ? "bg-[#FF4E50]" : "bg-white/10"
                                }`}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {!complete && !isGenerating && (
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {step === 1 && (
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-6">1. Project Overview</h3>
                                    
                                    {/* File Upload Option */}
                                    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h4 className="text-white font-semibold mb-1">Quick Start: Upload Research Paper</h4>
                                                <p className="text-[#999999] text-sm">Upload a PDF document - AI will analyze and auto-fill everything</p>
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isAnalyzingFile}
                                                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {isAnalyzingFile ? (
                                                    <>
                                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                                            <Activity size="18" />
                                                        </motion.div>
                                                        Analyzing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <DocumentDownload size="18" />
                                                        Upload Paper
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        {uploadedFile && (
                                            <div className="text-sm text-green-400 flex items-center gap-2">
                                                <TickCircle size="16" />
                                                Analyzed: {uploadedFile.name}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[#999999] mb-2 font-medium">Project Title</label>
                                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-[#FF4E50]/50 outline-none transition-colors" placeholder="e.g. AI-Based Early Detection of Diabetic Retinopathy" />
                                        </div>
                                        <div>
                                            <label className="block text-[#999999] mb-2 font-medium">Field of Study</label>
                                            <input type="text" value={field} onChange={(e) => setField(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-[#FF4E50]/50 outline-none transition-colors" placeholder="e.g. Artificial Intelligence, Healthcare" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-6">2. Core Details</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[#999999] mb-2 font-medium">Problem Statement / Research Gap</label>
                                            <textarea value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-[#FF4E50]/50 outline-none transition-colors h-24 resize-none custom-scrollbar" placeholder="What specific problem does this solve?..." />
                                        </div>
                                        <div>
                                            <label className="block text-[#999999] mb-2 font-medium">Primary Goal & Objectives</label>
                                            <textarea value={objective} onChange={(e) => setObjective(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-[#FF4E50]/50 outline-none transition-colors h-24 resize-none custom-scrollbar" placeholder="Describe what you aim to achieve..." />
                                        </div>
                                        <div>
                                            <label className="block text-[#999999] mb-4 font-medium flex justify-between">
                                                <span>Conservative Tone</span>
                                                <span>Visionary Tone</span>
                                            </label>
                                            <input type="range" min="0" max="100" value={tone} onChange={(e) => setTone(parseInt(e.target.value))} className="w-full accent-[#FF4E50]" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && !isFileUploaded && (
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-6">3. Logistics & Team</h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {docType === "Grant Proposal" && (
                                                <div>
                                                    <label className="block text-[#999999] mb-2 font-medium">Budget Range</label>
                                                    <input type="text" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-[#FF4E50]/50 outline-none transition-colors" placeholder="e.g. $50,000 - $100,000" />
                                                </div>
                                            )}
                                            <div className={docType !== "Grant Proposal" ? "md:col-span-2" : ""}>
                                                <label className="block text-[#999999] mb-2 font-medium">Timeline / Duration</label>
                                                <input type="text" value={timeline} onChange={(e) => setTimeline(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-[#FF4E50]/50 outline-none transition-colors" placeholder="e.g. 12 Months, Q1-Q4 2024" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[#999999] mb-2 font-medium">Team Details & Affiliations</label>
                                            <textarea value={teamDetails} onChange={(e) => setTeamDetails(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-[#FF4E50]/50 outline-none transition-colors h-24 resize-none custom-scrollbar" placeholder="e.g. John Doe (PI), Jane Doe (Co-PI) from Stanford Dept of CS..." />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-6">4. AI Proposal Analysis</h3>

                                    {isAnalyzing ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-4">
                                                <Activity size="48" className="text-[#4FACFE]" />
                                            </motion.div>
                                            <p className="text-white text-lg font-medium">Evaluating novelty and impact...</p>
                                        </div>
                                    ) : analysisData ? (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-black/30 p-8 rounded-3xl border border-white/5 mb-8">
                                            <div className="w-full max-w-[300px] mx-auto aspect-square">
                                                <Radar
                                                    data={{
                                                        labels: ['Novelty', 'Impact', 'Feasibility'],
                                                        datasets: [
                                                            {
                                                                label: 'Score',
                                                                data: [analysisData.novelty, analysisData.impact, analysisData.feasibility],
                                                                backgroundColor: 'rgba(79, 172, 254, 0.2)',
                                                                borderColor: 'rgba(79, 172, 254, 1)',
                                                                borderWidth: 2,
                                                                pointBackgroundColor: 'rgba(255, 78, 80, 1)',
                                                                pointBorderColor: '#fff',
                                                                pointHoverBackgroundColor: '#fff',
                                                                pointHoverBorderColor: 'rgba(255, 78, 80, 1)'
                                                            }
                                                        ]
                                                    }}
                                                    options={{
                                                        scales: {
                                                            r: {
                                                                angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                                                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                                                pointLabels: { color: '#e2e2e2', font: { size: 14, family: 'sans-serif' } },
                                                                min: 0,
                                                                max: 100,
                                                                ticks: { display: false }
                                                            }
                                                        },
                                                        plugins: { legend: { display: false } },
                                                        maintainAspectRatio: false
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <TickCircle size="32" className="text-[#4FACFE]" variant="Bulk" />
                                                    <h4 className="text-2xl font-bold text-white">AI Verdict</h4>
                                                </div>
                                                <p className="text-[#e2e2e2] text-lg leading-relaxed mb-6">
                                                    {analysisData.summary}
                                                </p>
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-[#999999]">Novelty</span>
                                                        <span className="font-bold text-white">{analysisData.novelty}/100</span>
                                                    </div>
                                                    <div className="w-full bg-white/10 rounded-full h-2">
                                                        <div className="bg-[#4FACFE] h-2 rounded-full" style={{ width: `${analysisData.novelty}%` }}></div>
                                                    </div>

                                                    <div className="flex justify-between items-center text-sm mt-2">
                                                        <span className="text-[#999999]">Impact</span>
                                                        <span className="font-bold text-white">{analysisData.impact}/100</span>
                                                    </div>
                                                    <div className="w-full bg-white/10 rounded-full h-2">
                                                        <div className="bg-[#FF4E50] h-2 rounded-full" style={{ width: `${analysisData.impact}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                    ) : null}
                                </div>
                            )}

                            {step === 5 && isFileUploaded && (
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-6">5. Budget & Timeline Details</h3>
                                    <p className="text-[#999999] mb-6">Please provide the budget and timeline details to complete the proposal generation.</p>
                                    
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[#999999] mb-2 font-medium">Budget Amount <span className="text-red-400">*</span></label>
                                                <input 
                                                    type="text" 
                                                    value={budget} 
                                                    onChange={(e) => setBudget(e.target.value)} 
                                                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-[#FF4E50]/50 outline-none transition-colors" 
                                                    placeholder="e.g. ₹18,50,000 or $50,000" 
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[#999999] mb-2 font-medium">Timeline Duration <span className="text-red-400">*</span></label>
                                                <input 
                                                    type="text" 
                                                    value={timeline} 
                                                    onChange={(e) => setTimeline(e.target.value)} 
                                                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-[#FF4E50]/50 outline-none transition-colors" 
                                                    placeholder="e.g. 24 Months" 
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="border-t border-white/10 pt-6">
                                            <h4 className="text-lg font-semibold text-white mb-3">Optional: Detailed Breakdown</h4>
                                            <p className="text-sm text-[#999999] mb-4">Provide specific details for timeline phases and budget categories. If skipped, AI will generate appropriate breakdowns automatically.</p>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[#999999] mb-2 font-medium">Timeline Breakdown (Optional)</label>
                                                    <textarea 
                                                        value={timelineDescription} 
                                                        onChange={(e) => setTimelineDescription(e.target.value)} 
                                                        className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-[#FF4E50]/50 outline-none transition-colors h-32 resize-none" 
                                                        placeholder="e.g. Phase 1 (Months 1-3): Literature review & data collection&#10;Phase 2 (Months 4-8): Model development&#10;Phase 3 (Months 9-12): Testing & validation"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[#999999] mb-2 font-medium">Budget Breakdown (Optional)</label>
                                                    <textarea 
                                                        value={budgetDescription} 
                                                        onChange={(e) => setBudgetDescription(e.target.value)} 
                                                        className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-[#FF4E50]/50 outline-none transition-colors h-32 resize-none" 
                                                        placeholder="e.g. Research Assistant: ₹6,00,000&#10;Computing Resources: ₹4,50,000&#10;Software & Tools: ₹1,50,000"
                                                    />
                                                </div>
                                            </div>

                                            {!timelineDescription && !budgetDescription && (
                                                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                                                    <p className="text-sm text-yellow-400">
                                                        <strong>Note:</strong> If you do not describe the timeline and budget breakdown, the AI will generate a random but appropriate breakdown and timeline based on similar research projects and industry standards.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end mt-8">
                                <button
                                    onClick={handleNext}
                                    disabled={(step === 4 && isAnalyzing)}
                                    className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-white/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {step === 3 ? "Analyze Proposal" : 
                                     step === 4 && isFileUploaded ? "Continue to Budget" : 
                                     step === 4 ? "Generate Document" : 
                                     step === 5 ? "Generate Proposal" : 
                                     "Continue"}
                                    <ArrowRight2 size="20" variant="Bold" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {isGenerating && (
                        <motion.div
                            key="generating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="mb-8"
                            >
                                <Magicpen size="64" className="text-[#FF4E50]" variant="Bulk" />
                            </motion.div>
                            <h3 className="text-2xl font-bold text-white mb-2">Architecting Document...</h3>
                            <div className="flex flex-col items-center gap-2 mt-4">
                                <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="text-[#4FACFE]">Analyzing literature corpus...</motion.p>
                                <motion.p animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2.2, repeat: Infinity, delay: 0.5 }} className="text-[#FF4E50]">Generating proposal structure...</motion.p>
                                <motion.p animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2.5, repeat: Infinity, delay: 1 }} className="text-white">Generating academic synthesis...</motion.p>
                            </div>
                        </motion.div>
                    )}

                    {complete && result && (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col py-4"
                        >
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                                        <TickCircle size="24" className="text-green-500" variant="Bold" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">Document Ready</h3>
                                        <p className="text-[#999999] text-sm mt-1">Formatted for {agency}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 flex-wrap justify-end">
                                    <button
                                        onClick={() => {
                                            if (isEditing) {
                                                // Save edited content back to result
                                                setResult(editContent);
                                                setIsEditing(false);
                                            } else {
                                                // Load current result into editor
                                                setEditContent(result || "");
                                                setIsEditing(true);
                                            }
                                        }}
                                        className="px-4 py-2 rounded-full border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-2 font-medium"
                                    >
                                        {isEditing ? <Eye size="18" /> : <Edit2 size="18" />}
                                        {isEditing ? "Preview" : "Edit"}
                                    </button>
                                    <button onClick={exportToWord} className="px-4 py-2 rounded-full border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 transition-colors flex items-center gap-2 font-medium">
                                        <DocumentDownload size="18" /> Word
                                    </button>
                                    <button onClick={exportToPDF} className="px-4 py-2 rounded-full border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 font-medium">
                                        <DocumentDownload size="18" /> PDF
                                    </button>
                                    {isSaved ? (
                                        <span className="px-4 py-2 rounded-full border border-green-500/50 text-green-400 bg-green-500/10 flex items-center gap-2">
                                            <TickCircle size="18" /> Saved
                                        </span>
                                    ) : (
                                        <button onClick={handleSave} className="px-4 py-2 rounded-full border border-[#FF4E50]/50 text-[#FF4E50] hover:bg-[#FF4E50]/10 transition-colors flex items-center gap-2 font-medium">
                                            <Save2 size="18" /> Save
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="w-full text-left bg-black/50 p-6 md:p-8 rounded-2xl border border-white/5 overflow-y-auto max-h-[70vh] custom-scrollbar">
                                {isEditing ? (
                                    <SimpleEditor 
                                        value={editContent} 
                                        onChange={setEditContent} 
                                    />
                                ) : (
                                    <>
                                        {/* Hidden div for PDF export */}
                                        <div id="pdf-export-content" style={{ display: 'none' }}>
                                            <div style={{ 
                                                fontFamily: '"Times New Roman", Times, serif',
                                                fontSize: '12pt',
                                                lineHeight: '1.5',
                                                color: 'black',
                                                padding: '0.75in',
                                                backgroundColor: '#ffffff'
                                            }}>
                                                <ReactMarkdown
                                                    components={{
                                                        h1: ({node, ...props}) => <h1 style={{ fontSize: '18pt', fontWeight: 'bold', marginTop: '24pt', marginBottom: '12pt', textAlign: 'center', color: 'black' }} {...props} />,
                                                        h2: ({node, ...props}) => <h2 style={{ fontSize: '14pt', fontWeight: 'bold', marginTop: '18pt', marginBottom: '8pt', color: 'black' }} {...props} />,
                                                        h3: ({node, ...props}) => <h3 style={{ fontSize: '12pt', fontWeight: 'bold', marginTop: '14pt', marginBottom: '6pt', color: 'black' }} {...props} />,
                                                        p: ({node, ...props}) => <p style={{ marginBottom: '10pt', textAlign: 'justify', color: 'black' }} {...props} />,
                                                        strong: ({node, ...props}) => <strong style={{ fontWeight: 'bold', color: 'black' }} {...props} />,
                                                        em: ({node, ...props}) => <em style={{ fontStyle: 'italic', color: 'black' }} {...props} />,
                                                        ul: ({node, ...props}) => <ul style={{ marginBottom: '10pt', marginLeft: '0.5in', color: 'black' }} {...props} />,
                                                        ol: ({node, ...props}) => <ol style={{ marginBottom: '10pt', marginLeft: '0.5in', color: 'black' }} {...props} />,
                                                        li: ({node, ...props}) => <li style={{ marginBottom: '4pt', color: 'black' }} {...props} />,
                                                    }}
                                                >
                                                    {result}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                        
                                        {/* Visible preview */}
                                        <div className="bg-white text-black p-12 md:p-16 mx-auto w-full max-w-[816px] min-h-[1056px] shadow-2xl" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt', lineHeight: '1.5' }}>
                                            <div className="prose prose-slate max-w-none" style={{ color: 'black' }}>
                                                <ReactMarkdown
                                                    components={{
                                                        h1: ({node, ...props}) => <h1 style={{ fontSize: '18pt', fontWeight: 'bold', marginTop: '24pt', marginBottom: '12pt', textAlign: 'center' }} {...props} />,
                                                        h2: ({node, ...props}) => <h2 style={{ fontSize: '14pt', fontWeight: 'bold', marginTop: '18pt', marginBottom: '8pt' }} {...props} />,
                                                        h3: ({node, ...props}) => <h3 style={{ fontSize: '12pt', fontWeight: 'bold', marginTop: '14pt', marginBottom: '6pt' }} {...props} />,
                                                        p: ({node, ...props}) => <p style={{ marginBottom: '10pt', textAlign: 'justify' }} {...props} />,
                                                        strong: ({node, ...props}) => <strong style={{ fontWeight: 'bold' }} {...props} />,
                                                        em: ({node, ...props}) => <em style={{ fontStyle: 'italic' }} {...props} />,
                                                        ul: ({node, ...props}) => <ul style={{ marginBottom: '10pt', marginLeft: '0.5in' }} {...props} />,
                                                        ol: ({node, ...props}) => <ol style={{ marginBottom: '10pt', marginLeft: '0.5in' }} {...props} />,
                                                        li: ({node, ...props}) => <li style={{ marginBottom: '4pt' }} {...props} />,
                                                    }}
                                                >
                                                    {result}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="mt-8 flex justify-center">
                                <button onClick={() => { setComplete(false); setStep(1); setResult(null); setIsSaved(false); }} className="text-[#999999] hover:text-white transition-colors underline">
                                    Start New Proposal
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </section>
    );
}
