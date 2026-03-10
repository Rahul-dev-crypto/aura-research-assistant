"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { DocumentUpload, Activity, TickCircle, Copy, Save2, DocumentDownload } from "iconsax-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface AnalysisResult {
    title: string;
    abstract: string;
    methodology: string;
    results: string;
    conclusions: string;
    keyFindings: string[];
    researchGaps: string[];
    summary: string;
}

export function PaperAnalyzer() {
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const exportRef = useRef<HTMLDivElement>(null);

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
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        if (uploadedFile.type !== 'application/pdf') {
            alert('Please upload a PDF file.');
            return;
        }

        setFile(uploadedFile);
        setIsAnalyzing(true);
        setAnalysis(null);

        try {
            const base64 = await fileToBase64(uploadedFile);
            
            const systemPrompt = `You are an expert research paper analyzer. Analyze this research paper and extract key information.

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "title": "<paper title>",
  "abstract": "<abstract summary in 2-3 sentences>",
  "methodology": "<methodology description in 2-3 sentences>",
  "results": "<key results in 2-3 sentences>",
  "conclusions": "<main conclusions in 2-3 sentences>",
  "keyFindings": ["<finding 1>", "<finding 2>", "<finding 3>"],
  "researchGaps": ["<gap 1>", "<gap 2>", "<gap 3>"],
  "summary": "<overall summary in 3-4 sentences>"
}

Be concise and extract only the most important information.`;

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: "Analyze this research paper and return the structured JSON.",
                    system: systemPrompt,
                    files: [{
                        data: base64,
                        mimeType: uploadedFile.type
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
            setAnalysis(analysisResult);
            
        } catch (err) {
            console.error('Analysis error:', err);
            alert('Failed to analyze paper. Please try again.');
            setFile(null);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveAnalysis = async () => {
        if (!analysis) return;
        
        try {
            const content = `<div style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000;">
<h1 style="font-size: 18pt; font-weight: bold; margin-bottom: 16px;">${analysis.title}</h1>

<h2 style="font-size: 14pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">Abstract</h2>
<p style="text-align: justify; margin-bottom: 12px;">${analysis.abstract}</p>

<h2 style="font-size: 14pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">Methodology</h2>
<p style="text-align: justify; margin-bottom: 12px;">${analysis.methodology}</p>

<h2 style="font-size: 14pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">Results</h2>
<p style="text-align: justify; margin-bottom: 12px;">${analysis.results}</p>

<h2 style="font-size: 14pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">Conclusions</h2>
<p style="text-align: justify; margin-bottom: 12px;">${analysis.conclusions}</p>

<h2 style="font-size: 14pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">Key Findings</h2>
<ul style="margin-left: 20px; margin-bottom: 12px;">
${analysis.keyFindings.map(f => `<li style="margin-bottom: 8px;">${f}</li>`).join('\n')}
</ul>

<h2 style="font-size: 14pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">Research Gaps Identified</h2>
<ul style="margin-left: 20px; margin-bottom: 12px;">
${analysis.researchGaps.map(g => `<li style="margin-bottom: 8px;">${g}</li>`).join('\n')}
</ul>

<h2 style="font-size: 14pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">Summary</h2>
<p style="text-align: justify; margin-bottom: 12px;">${analysis.summary}</p>
</div>`;

            console.log('Saving analysis with data:', {
                title: analysis.title,
                type: "paper",
                contentLength: content.length,
                sourcePrompt: `Analyzed from: ${file?.name || 'Unknown'}`
            });

            const res = await fetch("/api/research", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: analysis.title,
                    type: "paper",
                    content: content,
                    sourcePrompt: `Analyzed from: ${file?.name || 'Unknown'}`
                }),
            });
            
            const data = await res.json();
            console.log('Save response:', data);
            
            if (res.ok) {
                alert('Saved successfully!');
            } else {
                console.error('Save error details:', data);
                throw new Error(data.error || data.details || 'Failed to save');
            }
        } catch (err: any) {
            console.error("Failed to save - full error:", err);
            alert(`Failed to save analysis: ${err.message}`);
        }
    };

    const copyAllText = () => {
        if (!analysis) return;
        
        const fullText = `${analysis.title}

Abstract
${analysis.abstract}

Methodology
${analysis.methodology}

Results
${analysis.results}

Conclusions
${analysis.conclusions}

Key Findings
${analysis.keyFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Research Gaps Identified
${analysis.researchGaps.map((g, i) => `${i + 1}. ${g}`).join('\n')}

Summary
${analysis.summary}`;

        navigator.clipboard.writeText(fullText);
        alert('Entire analysis copied to clipboard!');
    };

    const copySection = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const handleExportPDF = async () => {
        if (!exportRef.current || !analysis) return;

        try {
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
            
            // Calculate dimensions to fit width
            const ratio = pdfWidth / imgWidth;
            const scaledHeight = imgHeight * ratio;
            
            // Calculate how many pages we need
            const totalPages = Math.ceil(scaledHeight / pdfHeight);
            
            // Add pages with content
            for (let page = 0; page < totalPages; page++) {
                if (page > 0) {
                    pdf.addPage();
                }
                
                const yOffset = -(page * pdfHeight);
                pdf.addImage(imgData, 'PNG', 0, yOffset, pdfWidth, scaledHeight);
            }
            
            pdf.save(`${analysis.title.replace(/[^a-z0-9]/gi, '_')}_analysis.pdf`);
        } catch (err) {
            console.error('PDF export error:', err);
            alert('Failed to export PDF. Please try again.');
        }
    };

    const resetAnalyzer = () => {
        setFile(null);
        setAnalysis(null);
        setIsAnalyzing(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <section className="px-6 py-24 max-w-6xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4 text-white">
                    <span className="text-gradient-hero">Paper</span> Analyzer
                </h2>
                <p className="text-[#999999]">Upload research papers and get AI-powered analysis and summaries.</p>
            </div>

            <div className="glass-card rounded-[32px] p-8 md:p-12">
                {!file && !analysis && (
                    <div className="text-center py-12">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="mx-auto mb-6 p-8 rounded-3xl border-2 border-dashed border-white/20 hover:border-[#4FACFE]/50 transition-colors group"
                        >
                            <DocumentUpload size="64" variant="Bulk" className="text-white/40 group-hover:text-[#4FACFE] transition-colors mx-auto mb-4" />
                            <p className="text-white font-medium mb-2">Click to upload research paper</p>
                            <p className="text-[#999999] text-sm">PDF files only • Max 10MB</p>
                        </button>
                    </div>
                )}

                {isAnalyzing && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="mb-6"
                        >
                            <Activity size="64" className="text-[#4FACFE]" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-white mb-2">Analyzing Paper...</h3>
                        <p className="text-[#999999]">Extracting key information and insights</p>
                    </div>
                )}

                {analysis && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 pb-6 border-b border-white/10">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <TickCircle size="24" className="text-green-500" variant="Bold" />
                                    <h3 className="text-2xl font-bold text-white">Analysis Complete</h3>
                                </div>
                                <h4 className="text-xl text-[#4FACFE] mb-2">{analysis.title}</h4>
                                <p className="text-sm text-[#999999]">Source: {file?.name}</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={copyAllText}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
                                >
                                    <Copy size="18" />
                                    Copy All
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
                                >
                                    <DocumentDownload size="18" />
                                    Export PDF
                                </button>
                                <button
                                    onClick={handleSaveAnalysis}
                                    className="px-4 py-2 bg-[#4FACFE] text-white rounded-xl hover:bg-[#4FACFE]/90 transition-colors flex items-center gap-2 font-medium"
                                >
                                    <Save2 size="18" />
                                    Save
                                </button>
                                <button
                                    onClick={resetAnalyzer}
                                    className="px-4 py-2 border border-white/10 text-white rounded-xl hover:bg-white/5 transition-colors font-medium"
                                >
                                    New Analysis
                                </button>
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="p-6 bg-gradient-to-br from-[#4FACFE]/10 to-[#00F260]/10 rounded-2xl border border-[#4FACFE]/20">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-lg font-bold text-white">Summary</h4>
                                <button
                                    onClick={() => copySection(analysis.summary)}
                                    className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
                                >
                                    <Copy size="16" className="text-white" />
                                    <span className="text-white text-sm font-medium">Copy</span>
                                </button>
                            </div>
                            <p className="text-white/90 leading-relaxed">{analysis.summary}</p>
                        </div>

                        {/* Sections Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Abstract */}
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-lg font-bold text-white">Abstract</h4>
                                    <button
                                        onClick={() => copySection(analysis.abstract)}
                                        className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
                                    >
                                        <Copy size="16" className="text-[#999999]" />
                                        <span className="text-[#999999] text-sm font-medium">Copy</span>
                                    </button>
                                </div>
                                <p className="text-[#CCCCCC] text-sm leading-relaxed">{analysis.abstract}</p>
                            </div>

                            {/* Methodology */}
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-lg font-bold text-white">Methodology</h4>
                                    <button
                                        onClick={() => copySection(analysis.methodology)}
                                        className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
                                    >
                                        <Copy size="16" className="text-[#999999]" />
                                        <span className="text-[#999999] text-sm font-medium">Copy</span>
                                    </button>
                                </div>
                                <p className="text-[#CCCCCC] text-sm leading-relaxed">{analysis.methodology}</p>
                            </div>

                            {/* Results */}
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-lg font-bold text-white">Results</h4>
                                    <button
                                        onClick={() => copySection(analysis.results)}
                                        className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
                                    >
                                        <Copy size="16" className="text-[#999999]" />
                                        <span className="text-[#999999] text-sm font-medium">Copy</span>
                                    </button>
                                </div>
                                <p className="text-[#CCCCCC] text-sm leading-relaxed">{analysis.results}</p>
                            </div>

                            {/* Conclusions */}
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-lg font-bold text-white">Conclusions</h4>
                                    <button
                                        onClick={() => copySection(analysis.conclusions)}
                                        className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
                                    >
                                        <Copy size="16" className="text-[#999999]" />
                                        <span className="text-[#999999] text-sm font-medium">Copy</span>
                                    </button>
                                </div>
                                <p className="text-[#CCCCCC] text-sm leading-relaxed">{analysis.conclusions}</p>
                            </div>
                        </div>

                        {/* Key Findings */}
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold text-white">Key Findings</h4>
                                <button
                                    onClick={() => copySection(analysis.keyFindings.join('\n'))}
                                    className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
                                >
                                    <Copy size="16" className="text-[#999999]" />
                                    <span className="text-[#999999] text-sm font-medium">Copy</span>
                                </button>
                            </div>
                            <ul className="space-y-2">
                                {analysis.keyFindings.map((finding, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4FACFE]/20 text-[#4FACFE] flex items-center justify-center text-xs font-bold">
                                            {index + 1}
                                        </span>
                                        <span className="text-[#CCCCCC] text-sm leading-relaxed">{finding}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Research Gaps */}
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold text-white">Research Gaps Identified</h4>
                                <button
                                    onClick={() => copySection(analysis.researchGaps.join('\n'))}
                                    className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
                                >
                                    <Copy size="16" className="text-[#999999]" />
                                    <span className="text-[#999999] text-sm font-medium">Copy</span>
                                </button>
                            </div>
                            <ul className="space-y-2">
                                {analysis.researchGaps.map((gap, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF4E50]/20 text-[#FF4E50] flex items-center justify-center text-xs font-bold">
                                            {index + 1}
                                        </span>
                                        <span className="text-[#CCCCCC] text-sm leading-relaxed">{gap}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Hidden export element for PDF */}
            {analysis && (
                <div ref={exportRef} style={{ 
                    display: 'none', 
                    padding: '40px', 
                    backgroundColor: '#ffffff', 
                    width: '210mm', 
                    minHeight: 'auto',
                    fontFamily: "'Times New Roman', serif",
                    fontSize: '14pt',
                    lineHeight: '1.8',
                    color: '#000000'
                }}>
                    <h1 style={{ 
                        fontSize: '22pt', 
                        fontWeight: 'bold', 
                        marginBottom: '24px', 
                        color: '#000000',
                        fontFamily: "'Times New Roman', serif"
                    }}>{analysis.title}</h1>
                    
                    <div style={{ 
                        marginBottom: '24px', 
                        padding: '20px', 
                        backgroundColor: '#E3F2FD', 
                        borderRadius: '8px', 
                        border: '3px solid #4FACFE' 
                    }}>
                        <h2 style={{ 
                            fontSize: '16pt', 
                            fontWeight: 'bold', 
                            marginBottom: '12px', 
                            color: '#000000',
                            fontFamily: "'Times New Roman', serif"
                        }}>Summary</h2>
                        <p style={{ 
                            textAlign: 'justify', 
                            marginBottom: '0', 
                            color: '#000000',
                            fontSize: '14pt',
                            lineHeight: '1.8',
                            fontFamily: "'Times New Roman', serif"
                        }}>{analysis.summary}</p>
                    </div>

                    <h2 style={{ 
                        fontSize: '16pt', 
                        fontWeight: 'bold', 
                        marginTop: '28px', 
                        marginBottom: '12px', 
                        color: '#000000',
                        fontFamily: "'Times New Roman', serif"
                    }}>Abstract</h2>
                    <p style={{ 
                        textAlign: 'justify', 
                        marginBottom: '16px', 
                        color: '#000000',
                        fontSize: '14pt',
                        lineHeight: '1.8',
                        fontFamily: "'Times New Roman', serif"
                    }}>{analysis.abstract}</p>

                    <h2 style={{ 
                        fontSize: '16pt', 
                        fontWeight: 'bold', 
                        marginTop: '28px', 
                        marginBottom: '12px', 
                        color: '#000000',
                        fontFamily: "'Times New Roman', serif"
                    }}>Methodology</h2>
                    <p style={{ 
                        textAlign: 'justify', 
                        marginBottom: '16px', 
                        color: '#000000',
                        fontSize: '14pt',
                        lineHeight: '1.8',
                        fontFamily: "'Times New Roman', serif"
                    }}>{analysis.methodology}</p>

                    <h2 style={{ 
                        fontSize: '16pt', 
                        fontWeight: 'bold', 
                        marginTop: '28px', 
                        marginBottom: '12px', 
                        color: '#000000',
                        fontFamily: "'Times New Roman', serif"
                    }}>Results</h2>
                    <p style={{ 
                        textAlign: 'justify', 
                        marginBottom: '16px', 
                        color: '#000000',
                        fontSize: '14pt',
                        lineHeight: '1.8',
                        fontFamily: "'Times New Roman', serif"
                    }}>{analysis.results}</p>

                    <h2 style={{ 
                        fontSize: '16pt', 
                        fontWeight: 'bold', 
                        marginTop: '28px', 
                        marginBottom: '12px', 
                        color: '#000000',
                        fontFamily: "'Times New Roman', serif"
                    }}>Conclusions</h2>
                    <p style={{ 
                        textAlign: 'justify', 
                        marginBottom: '16px', 
                        color: '#000000',
                        fontSize: '14pt',
                        lineHeight: '1.8',
                        fontFamily: "'Times New Roman', serif"
                    }}>{analysis.conclusions}</p>

                    <h2 style={{ 
                        fontSize: '16pt', 
                        fontWeight: 'bold', 
                        marginTop: '28px', 
                        marginBottom: '16px', 
                        color: '#000000',
                        fontFamily: "'Times New Roman', serif"
                    }}>Key Findings</h2>
                    <div style={{ marginLeft: '0', marginBottom: '16px' }}>
                        {analysis.keyFindings.map((finding, index) => (
                            <div key={index} style={{ 
                                marginBottom: '12px', 
                                display: 'flex', 
                                alignItems: 'flex-start',
                                color: '#000000'
                            }}>
                                <span style={{ 
                                    display: 'inline-block', 
                                    width: '28px', 
                                    height: '28px', 
                                    borderRadius: '50%', 
                                    backgroundColor: '#4FACFE', 
                                    color: '#ffffff', 
                                    textAlign: 'center', 
                                    lineHeight: '28px', 
                                    marginRight: '12px', 
                                    fontSize: '12pt', 
                                    fontWeight: 'bold',
                                    flexShrink: '0',
                                    fontFamily: "'Times New Roman', serif"
                                }}>
                                    {index + 1}
                                </span>
                                <span style={{ 
                                    flex: '1',
                                    fontSize: '14pt',
                                    lineHeight: '1.8',
                                    color: '#000000',
                                    fontFamily: "'Times New Roman', serif"
                                }}>{finding}</span>
                            </div>
                        ))}
                    </div>

                    <h2 style={{ 
                        fontSize: '16pt', 
                        fontWeight: 'bold', 
                        marginTop: '28px', 
                        marginBottom: '16px', 
                        color: '#000000',
                        fontFamily: "'Times New Roman', serif"
                    }}>Research Gaps Identified</h2>
                    <div style={{ marginLeft: '0', marginBottom: '16px' }}>
                        {analysis.researchGaps.map((gap, index) => (
                            <div key={index} style={{ 
                                marginBottom: '12px', 
                                display: 'flex', 
                                alignItems: 'flex-start',
                                color: '#000000'
                            }}>
                                <span style={{ 
                                    display: 'inline-block', 
                                    width: '28px', 
                                    height: '28px', 
                                    borderRadius: '50%', 
                                    backgroundColor: '#FF4E50', 
                                    color: '#ffffff', 
                                    textAlign: 'center', 
                                    lineHeight: '28px', 
                                    marginRight: '12px', 
                                    fontSize: '12pt', 
                                    fontWeight: 'bold',
                                    flexShrink: '0',
                                    fontFamily: "'Times New Roman', serif"
                                }}>
                                    {index + 1}
                                </span>
                                <span style={{ 
                                    flex: '1',
                                    fontSize: '14pt',
                                    lineHeight: '1.8',
                                    color: '#000000',
                                    fontFamily: "'Times New Roman', serif"
                                }}>{gap}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
