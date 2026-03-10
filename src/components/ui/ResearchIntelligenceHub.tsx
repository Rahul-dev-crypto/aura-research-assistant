"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { SearchNormal, DocumentText, TrendUp, Lamp, MagicStar, Copy, ArrowDown, Link2, Save2, DocumentDownload } from "iconsax-react";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";

export function ResearchIntelligenceHub({ isGuest = false }: { isGuest?: boolean }) {
    const [topic, setTopic] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    
    // Filter and sort states
    const [sortBy, setSortBy] = useState<'relevance' | 'year' | 'citations'>('relevance');
    const [yearFilter, setYearFilter] = useState<string>('all');
    const [minCitations, setMinCitations] = useState<number>(0);
    const [filteredPapers, setFilteredPapers] = useState<any[]>([]);
    
    // Paper details modal
    const [selectedPaper, setSelectedPaper] = useState<any>(null);
    const [showPaperModal, setShowPaperModal] = useState(false);
    
    // Search history and recommendations
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [relatedTopics, setRelatedTopics] = useState<string[]>([]);

    const analyzeResearch = async () => {
        if (!topic.trim()) {
            alert("Please enter a research topic");
            return;
        }

        setIsAnalyzing(true);
        
        try {
            // Step 1: Fetch real papers from Semantic Scholar API via backend
            let realPapers: any[] = [];
            let rateLimitMessage = '';
            try {
                const semanticResponse = await fetch(`/api/semantic-scholar?query=${encodeURIComponent(topic)}`);
                
                if (semanticResponse.ok) {
                    const semanticData = await semanticResponse.json();
                    realPapers = semanticData.data || [];
                    rateLimitMessage = semanticData.message || '';
                    console.log('Fetched papers from Semantic Scholar:', realPapers.length);
                    console.log('Sample paper:', realPapers[0]);
                } else {
                    console.error('Semantic Scholar API error:', semanticResponse.status);
                }
            } catch (apiError) {
                console.error('Semantic Scholar API error:', apiError);
            }

            // Step 2: Use AI to analyze the research landscape
            const systemPrompt = `You are a research intelligence expert. Analyze the research landscape for the given topic.

${realPapers.length > 0 ? `I have found ${realPapers.length} real papers from Semantic Scholar. Use these as reference but also add your knowledge of other important papers in this field.

Real Papers Found:
${realPapers.map((p, i) => `${i+1}. "${p.title}" by ${p.authors} (${p.year}) - ${p.citationCount} citations`).join('\n')}
` : 'Semantic Scholar API is unavailable. Generate 8-10 well-known, real papers from your knowledge in this field with realistic details.'}

Provide:
${realPapers.length === 0 ? `0. PAPERS: List of 8-10 real, well-known papers in this field with:
   - title: Full paper title
   - authors: Author names (realistic)
   - year: Publication year
   - venue: Conference/Journal name
   - summary: Brief abstract (150-200 chars)
   - citationCount: Estimated citations (realistic numbers)
` : ''}
1. EXISTING RESEARCH: Summary of current state (3-4 key areas)
2. RESEARCH GAPS: Specific gaps in literature (3-5 gaps)
3. FUTURE DIRECTIONS: Promising directions (3-5 directions)
4. TRENDS: Current trends in this field
5. RECOMMENDATIONS: Actionable recommendations

Format as JSON:
{
  ${realPapers.length === 0 ? `"generatedPapers": [{"title": "Paper title", "authors": "Author names", "year": 2023, "venue": "Conference/Journal", "summary": "Abstract...", "citationCount": 100}],` : ''}
  "existingResearch": [{"area": "Area name", "summary": "Brief summary", "keyFindings": "Key findings"}],
  "researchGaps": [{"gap": "Gap description", "importance": "Why it matters", "difficulty": "Easy/Medium/Hard"}],
  "futureDirections": [{"direction": "Direction name", "description": "Description", "potential": "High/Medium/Low"}],
  "trends": [{"trend": "Trend name", "description": "Description"}],
  "recommendations": [{"recommendation": "Recommendation", "rationale": "Why"}],
  "overallAssessment": "Brief overall assessment"
}`;

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: `Analyze the research landscape for: ${topic}`,
                    system: systemPrompt
                }),
            });

            const data = await res.json();
            if (res.ok) {
                const cleanJson = data.result.replace(/```json/g, '').replace(/```/g, '').trim();
                const analysisResults = JSON.parse(cleanJson);
                
                // Combine real papers with AI analysis
                analysisResults.papers = realPapers.length > 0 ? realPapers : [];
                analysisResults.topic = topic;
                analysisResults.dataSource = realPapers.length > 0 ? 'Semantic Scholar + AI Analysis' : 'AI Analysis';
                
                setResults(analysisResults);
                setFilteredPapers(realPapers); // Initialize filtered papers
                
                // Add to search history
                addToHistory(topic);
                
                // Generate related topics
                generateRelatedTopics(topic);
            } else {
                throw new Error(data.error || 'Analysis failed');
            }
        } catch (err: any) {
            console.error('Analysis error:', err);
            alert(`Error: ${err.message || 'Failed to analyze research landscape'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const saveToDashboard = async () => {
        if (isGuest) {
            alert('Please login to save to dashboard');
            return;
        }

        setIsSaving(true);
        try {
            const userData = localStorage.getItem('user');
            if (!userData) {
                alert('Please login to save');
                setIsSaving(false);
                return;
            }

            const user = JSON.parse(userData);
            
            // Format the content as a comprehensive readable string
            let formattedContent = `RESEARCH INTELLIGENCE ANALYSIS\n\n`;
            formattedContent += `Topic: ${results.topic}\n\n`;
            formattedContent += `Overall Assessment:\n${results.overallAssessment}\n\n`;
            
            // Papers
            if (results.papers && results.papers.length > 0) {
                formattedContent += `=== RELEVANT RESEARCH PAPERS (${results.papers.length}) ===\n\n`;
                results.papers.forEach((p: any, i: number) => {
                    formattedContent += `${i+1}. ${p.title}\n`;
                    formattedContent += `   Authors: ${p.authors}\n`;
                    formattedContent += `   Year: ${p.year}${p.venue ? ` | Venue: ${p.venue}` : ''}\n`;
                    if (p.summary) formattedContent += `   Summary: ${p.summary}\n`;
                    formattedContent += `\n`;
                });
            }
            
            // Existing Research
            if (results.existingResearch && results.existingResearch.length > 0) {
                formattedContent += `=== EXISTING RESEARCH ===\n\n`;
                results.existingResearch.forEach((r: any, i: number) => {
                    formattedContent += `${i+1}. ${r.area}\n`;
                    formattedContent += `   Summary: ${r.summary}\n`;
                    formattedContent += `   Key Findings: ${r.keyFindings}\n\n`;
                });
            }
            
            // Research Gaps
            if (results.researchGaps && results.researchGaps.length > 0) {
                formattedContent += `=== RESEARCH GAPS ===\n\n`;
                results.researchGaps.forEach((g: any, i: number) => {
                    formattedContent += `${i+1}. ${g.gap} [${g.difficulty}]\n`;
                    formattedContent += `   Importance: ${g.importance}\n\n`;
                });
            }
            
            // Future Directions
            if (results.futureDirections && results.futureDirections.length > 0) {
                formattedContent += `=== FUTURE RESEARCH DIRECTIONS ===\n\n`;
                results.futureDirections.forEach((d: any, i: number) => {
                    formattedContent += `${i+1}. ${d.direction} [${d.potential} Potential]\n`;
                    formattedContent += `   Description: ${d.description}\n\n`;
                });
            }
            
            // Trends
            if (results.trends && results.trends.length > 0) {
                formattedContent += `=== CURRENT TRENDS ===\n\n`;
                results.trends.forEach((t: any, i: number) => {
                    formattedContent += `${i+1}. ${t.trend}\n`;
                    formattedContent += `   ${t.description}\n\n`;
                });
            }
            
            // Recommendations
            if (results.recommendations && results.recommendations.length > 0) {
                formattedContent += `=== RECOMMENDATIONS ===\n\n`;
                results.recommendations.forEach((r: any, i: number) => {
                    formattedContent += `${i+1}. ${r.recommendation}\n`;
                    formattedContent += `   Rationale: ${r.rationale}\n\n`;
                });
            }
            
            const researchData = {
                title: `Research Intelligence: ${results.topic}`,
                type: 'intelligence-hub',
                content: formattedContent,
                userId: user._id,
                sourcePrompt: results.topic
            };

            console.log('Saving research data:', researchData);

            const res = await fetch('/api/research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(researchData)
            });

            const data = await res.json();
            
            if (res.ok) {
                alert('✅ Saved to dashboard successfully!');
            } else {
                console.error('Save error response:', data);
                throw new Error(data.error || 'Failed to save to dashboard');
            }
        } catch (err: any) {
            console.error('Save error:', err);
            alert(`❌ Failed to save: ${err.message || 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const downloadAsPDF = () => {
        setIsDownloading(true);
        setShowExportMenu(false);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const maxWidth = pageWidth - 2 * margin;
            let yPos = margin;

            // Helper function to add text with word wrap
            const addText = (text: string, fontSize: number, color: [number, number, number], isBold = false) => {
                doc.setFontSize(fontSize);
                doc.setTextColor(color[0], color[1], color[2]);
                doc.setFont("times", isBold ? "bold" : "normal");
                
                const lines = doc.splitTextToSize(text, maxWidth);
                
                // Check if we need a new page
                if (yPos + (lines.length * fontSize * 0.5) > pageHeight - margin) {
                    doc.addPage();
                    yPos = margin;
                }
                
                doc.text(lines, margin, yPos);
                yPos += lines.length * fontSize * 0.5 + 5;
            };

            // Helper for colored boxes
            const addColoredBox = (text: string, bgColor: [number, number, number], textColor: [number, number, number]) => {
                const lines = doc.splitTextToSize(text, maxWidth - 10);
                const boxHeight = lines.length * 6 + 10;
                
                if (yPos + boxHeight > pageHeight - margin) {
                    doc.addPage();
                    yPos = margin;
                }
                
                doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
                doc.rect(margin, yPos, maxWidth, boxHeight, 'F');
                doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                doc.setFontSize(11);
                doc.setFont("times", "normal");
                doc.text(lines, margin + 5, yPos + 7);
                yPos += boxHeight + 5;
            };

            // Title
            doc.setFontSize(20);
            doc.setTextColor(37, 99, 235); // Blue
            doc.setFont("times", "bold");
            doc.text("Research Intelligence Analysis", pageWidth / 2, yPos, { align: "center" });
            yPos += 15;

            // Topic
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.setFont("times", "normal");
            doc.text(`Topic: ${results.topic}`, pageWidth / 2, yPos, { align: "center" });
            yPos += 10;
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: "center" });
            yPos += 15;

            // Overall Assessment
            addText("Overall Assessment", 14, [30, 64, 175], true);
            addColoredBox(results.overallAssessment, [219, 234, 254], [0, 0, 0]);
            yPos += 5;

            // Papers
            if (results.papers && results.papers.length > 0) {
                addText(`Relevant Research Papers (${results.papers.length})`, 14, [30, 64, 175], true);
                results.papers.forEach((paper: any, idx: number) => {
                    const paperText = `${idx + 1}. ${paper.title}\n${paper.authors} | ${paper.year}${paper.venue ? ` | ${paper.venue}` : ''}${paper.summary ? `\n${paper.summary}` : ''}`;
                    addColoredBox(paperText, [240, 249, 255], [30, 64, 175]);
                });
                yPos += 5;
            }

            // Existing Research
            if (results.existingResearch && results.existingResearch.length > 0) {
                addText("Existing Research", 14, [30, 64, 175], true);
                results.existingResearch.forEach((research: any, idx: number) => {
                    addText(`${idx + 1}. ${research.area}`, 12, [59, 130, 246], true);
                    addText(`Summary: ${research.summary}`, 11, [0, 0, 0]);
                    addText(`Key Findings: ${research.keyFindings}`, 11, [100, 100, 100]);
                    yPos += 3;
                });
            }

            // Research Gaps
            if (results.researchGaps && results.researchGaps.length > 0) {
                addText("Research Gaps", 14, [30, 64, 175], true);
                results.researchGaps.forEach((gap: any, idx: number) => {
                    const gapText = `${idx + 1}. ${gap.gap} [${gap.difficulty}]\n${gap.importance}`;
                    addColoredBox(gapText, [254, 226, 226], [153, 27, 27]);
                });
                yPos += 5;
            }

            // Future Directions
            if (results.futureDirections && results.futureDirections.length > 0) {
                addText("Future Research Directions", 14, [30, 64, 175], true);
                results.futureDirections.forEach((direction: any, idx: number) => {
                    const dirText = `${idx + 1}. ${direction.direction} [${direction.potential} Potential]\n${direction.description}`;
                    addColoredBox(dirText, [209, 250, 229], [6, 95, 70]);
                });
                yPos += 5;
            }

            // Trends
            if (results.trends && results.trends.length > 0) {
                addText("Current Trends", 14, [30, 64, 175], true);
                results.trends.forEach((trend: any, idx: number) => {
                    const trendText = `${idx + 1}. ${trend.trend}\n${trend.description}`;
                    addColoredBox(trendText, [233, 213, 255], [107, 33, 168]);
                });
                yPos += 5;
            }

            // Recommendations
            if (results.recommendations && results.recommendations.length > 0) {
                addText("Recommendations", 14, [30, 64, 175], true);
                results.recommendations.forEach((rec: any, idx: number) => {
                    const recText = `${idx + 1}. ${rec.recommendation}\nRationale: ${rec.rationale}`;
                    addColoredBox(recText, [254, 243, 199], [146, 64, 14]);
                });
            }

            // Save PDF
            doc.save(`Research_Intelligence_${results.topic.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`);
            
            setTimeout(() => {
                alert('✅ PDF downloaded successfully!');
            }, 300);
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download PDF');
        } finally {
            setIsDownloading(false);
        }
    };

    const downloadAsWord = async () => {
        setIsDownloading(true);
        setShowExportMenu(false);
        try {
            const children: any[] = [];

            // Title
            children.push(
                new Paragraph({
                    text: "Research Intelligence Analysis",
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                })
            );

            // Topic
            children.push(
                new Paragraph({
                    text: `Topic: ${results.topic}`,
                    alignment: AlignmentType.CENTER,
                })
            );

            children.push(
                new Paragraph({
                    text: `Generated: ${new Date().toLocaleDateString()}`,
                    alignment: AlignmentType.CENTER,
                })
            );

            children.push(new Paragraph({ text: "" }));

            // Overall Assessment
            children.push(
                new Paragraph({
                    text: "Overall Assessment",
                    heading: HeadingLevel.HEADING_2,
                })
            );
            children.push(new Paragraph({ text: results.overallAssessment }));
            children.push(new Paragraph({ text: "" }));

            // Papers
            if (results.papers && results.papers.length > 0) {
                children.push(
                    new Paragraph({
                        text: `Relevant Research Papers (${results.papers.length})`,
                        heading: HeadingLevel.HEADING_2,
                    })
                );
                results.papers.forEach((paper: any, idx: number) => {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: `${idx + 1}. `, bold: true }),
                                new TextRun({ text: paper.title, bold: true }),
                            ],
                        })
                    );
                    children.push(
                        new Paragraph({
                            text: `${paper.authors} | ${paper.year}${paper.venue ? ` | ${paper.venue}` : ''}`,
                        })
                    );
                    if (paper.summary) {
                        children.push(new Paragraph({ text: paper.summary }));
                    }
                    children.push(new Paragraph({ text: "" }));
                });
            }

            // Existing Research
            if (results.existingResearch && results.existingResearch.length > 0) {
                children.push(
                    new Paragraph({
                        text: "Existing Research",
                        heading: HeadingLevel.HEADING_2,
                    })
                );
                results.existingResearch.forEach((research: any, idx: number) => {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: `${idx + 1}. `, bold: true }),
                                new TextRun({ text: research.area, bold: true }),
                            ],
                        })
                    );
                    children.push(new Paragraph({ text: `Summary: ${research.summary}` }));
                    children.push(new Paragraph({ text: `Key Findings: ${research.keyFindings}` }));
                    children.push(new Paragraph({ text: "" }));
                });
            }

            // Research Gaps
            if (results.researchGaps && results.researchGaps.length > 0) {
                children.push(
                    new Paragraph({
                        text: "Research Gaps",
                        heading: HeadingLevel.HEADING_2,
                    })
                );
                results.researchGaps.forEach((gap: any, idx: number) => {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: `${idx + 1}. `, bold: true }),
                                new TextRun({ text: `${gap.gap} [${gap.difficulty}]`, bold: true }),
                            ],
                        })
                    );
                    children.push(new Paragraph({ text: gap.importance }));
                    children.push(new Paragraph({ text: "" }));
                });
            }

            // Future Directions
            if (results.futureDirections && results.futureDirections.length > 0) {
                children.push(
                    new Paragraph({
                        text: "Future Research Directions",
                        heading: HeadingLevel.HEADING_2,
                    })
                );
                results.futureDirections.forEach((direction: any, idx: number) => {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: `${idx + 1}. `, bold: true }),
                                new TextRun({ text: `${direction.direction} [${direction.potential} Potential]`, bold: true }),
                            ],
                        })
                    );
                    children.push(new Paragraph({ text: direction.description }));
                    children.push(new Paragraph({ text: "" }));
                });
            }

            // Trends
            if (results.trends && results.trends.length > 0) {
                children.push(
                    new Paragraph({
                        text: "Current Trends",
                        heading: HeadingLevel.HEADING_2,
                    })
                );
                results.trends.forEach((trend: any, idx: number) => {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: `${idx + 1}. `, bold: true }),
                                new TextRun({ text: trend.trend, bold: true }),
                            ],
                        })
                    );
                    children.push(new Paragraph({ text: trend.description }));
                    children.push(new Paragraph({ text: "" }));
                });
            }

            // Recommendations
            if (results.recommendations && results.recommendations.length > 0) {
                children.push(
                    new Paragraph({
                        text: "Recommendations",
                        heading: HeadingLevel.HEADING_2,
                    })
                );
                results.recommendations.forEach((rec: any, idx: number) => {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: `${idx + 1}. `, bold: true }),
                                new TextRun({ text: rec.recommendation, bold: true }),
                            ],
                        })
                    );
                    children.push(new Paragraph({ text: `Rationale: ${rec.rationale}` }));
                    children.push(new Paragraph({ text: "" }));
                });
            }

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: children,
                }],
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `Research_Intelligence_${results.topic.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.docx`);
            
            setTimeout(() => {
                alert('✅ Word document downloaded successfully!');
            }, 300);
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download Word document');
        } finally {
            setIsDownloading(false);
        }
    };

    const downloadAsMarkdown = () => {
        setIsDownloading(true);
        setShowExportMenu(false);
        try {
            let markdown = `# Research Intelligence Analysis\n\n`;
            markdown += `**Topic:** ${results.topic}\n\n`;
            markdown += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;
            markdown += `---\n\n`;

            // Overall Assessment
            markdown += `## Overall Assessment\n\n${results.overallAssessment}\n\n`;

            // Papers
            if (results.papers && results.papers.length > 0) {
                markdown += `## Relevant Research Papers (${results.papers.length})\n\n`;
                results.papers.forEach((paper: any, idx: number) => {
                    markdown += `### ${idx + 1}. ${paper.title}\n\n`;
                    markdown += `**Authors:** ${paper.authors}\n\n`;
                    markdown += `**Year:** ${paper.year}${paper.venue ? ` | **Venue:** ${paper.venue}` : ''}\n\n`;
                    if (paper.citationCount !== undefined) {
                        markdown += `**Citations:** ${paper.citationCount}\n\n`;
                    }
                    if (paper.summary) {
                        markdown += `${paper.summary}\n\n`;
                    }
                    if (paper.paperId) {
                        markdown += `[View on Semantic Scholar](https://www.semanticscholar.org/paper/${paper.paperId})\n\n`;
                    }
                    markdown += `---\n\n`;
                });
            }

            // Existing Research
            if (results.existingResearch && results.existingResearch.length > 0) {
                markdown += `## Existing Research\n\n`;
                results.existingResearch.forEach((research: any, idx: number) => {
                    markdown += `### ${idx + 1}. ${research.area}\n\n`;
                    markdown += `**Summary:** ${research.summary}\n\n`;
                    markdown += `**Key Findings:** ${research.keyFindings}\n\n`;
                });
            }

            // Research Gaps
            if (results.researchGaps && results.researchGaps.length > 0) {
                markdown += `## Research Gaps\n\n`;
                results.researchGaps.forEach((gap: any, idx: number) => {
                    markdown += `### ${idx + 1}. ${gap.gap} [${gap.difficulty}]\n\n`;
                    markdown += `${gap.importance}\n\n`;
                });
            }

            // Future Directions
            if (results.futureDirections && results.futureDirections.length > 0) {
                markdown += `## Future Research Directions\n\n`;
                results.futureDirections.forEach((direction: any, idx: number) => {
                    markdown += `### ${idx + 1}. ${direction.direction} [${direction.potential} Potential]\n\n`;
                    markdown += `${direction.description}\n\n`;
                });
            }

            // Trends
            if (results.trends && results.trends.length > 0) {
                markdown += `## Current Trends\n\n`;
                results.trends.forEach((trend: any, idx: number) => {
                    markdown += `### ${idx + 1}. ${trend.trend}\n\n`;
                    markdown += `${trend.description}\n\n`;
                });
            }

            // Recommendations
            if (results.recommendations && results.recommendations.length > 0) {
                markdown += `## Recommendations\n\n`;
                results.recommendations.forEach((rec: any, idx: number) => {
                    markdown += `### ${idx + 1}. ${rec.recommendation}\n\n`;
                    markdown += `**Rationale:** ${rec.rationale}\n\n`;
                });
            }

            const blob = new Blob([markdown], { type: 'text/markdown' });
            saveAs(blob, `Research_Intelligence_${results.topic.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.md`);
            
            setTimeout(() => {
                alert('✅ Markdown file downloaded successfully!');
            }, 300);
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download Markdown');
        } finally {
            setIsDownloading(false);
        }
    };

    const downloadBibTeX = () => {
        setIsDownloading(true);
        setShowExportMenu(false);
        try {
            if (!results.papers || results.papers.length === 0) {
                alert('No papers to export');
                setIsDownloading(false);
                return;
            }

            let bibtex = '';
            results.papers.forEach((paper: any, idx: number) => {
                const key = `${paper.authors.split(',')[0].replace(/\s/g, '')}${paper.year}`;
                bibtex += `@article{${key},\n`;
                bibtex += `  title={${paper.title}},\n`;
                bibtex += `  author={${paper.authors}},\n`;
                bibtex += `  year={${paper.year}},\n`;
                if (paper.venue) {
                    bibtex += `  journal={${paper.venue}},\n`;
                }
                if (paper.doi) {
                    bibtex += `  doi={${paper.doi}},\n`;
                }
                bibtex += `}\n\n`;
            });

            const blob = new Blob([bibtex], { type: 'text/plain' });
            saveAs(blob, `Research_Intelligence_${results.topic.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.bib`);
            
            setTimeout(() => {
                alert('✅ BibTeX file downloaded successfully!');
            }, 300);
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download BibTeX');
        } finally {
            setIsDownloading(false);
        }
    };

    const copySection = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    // Share functions
    const copyFullAnalysis = () => {
        let text = `RESEARCH INTELLIGENCE ANALYSIS\n\n`;
        text += `Topic: ${results.topic}\n\n`;
        text += `${results.overallAssessment}\n\n`;
        
        if (results.papers && results.papers.length > 0) {
            text += `RELEVANT PAPERS (${results.papers.length}):\n`;
            results.papers.forEach((p: any, i: number) => {
                text += `${i+1}. ${p.title} (${p.year})\n`;
            });
            text += `\n`;
        }
        
        if (results.researchGaps && results.researchGaps.length > 0) {
            text += `RESEARCH GAPS:\n`;
            results.researchGaps.forEach((g: any, i: number) => {
                text += `${i+1}. ${g.gap}\n`;
            });
        }
        
        navigator.clipboard.writeText(text);
        alert('✅ Full analysis copied to clipboard!');
        setShowShareMenu(false);
    };

    const shareViaEmail = () => {
        const subject = encodeURIComponent(`Research Analysis: ${results.topic}`);
        const body = encodeURIComponent(`I wanted to share this research analysis with you:\n\nTopic: ${results.topic}\n\n${results.overallAssessment}\n\nGenerated by Aura Research Assistant`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        setShowShareMenu(false);
    };

    const generateShareableText = () => {
        let text = `📊 Research Analysis: ${results.topic}\n\n`;
        text += `${results.overallAssessment}\n\n`;
        text += `📚 Found ${results.papers?.length || 0} relevant papers\n`;
        text += `🔍 Identified ${results.researchGaps?.length || 0} research gaps\n`;
        text += `🚀 ${results.futureDirections?.length || 0} future directions\n\n`;
        text += `Generated by Aura Research Assistant`;
        
        navigator.clipboard.writeText(text);
        alert('✅ Shareable summary copied! Perfect for social media or messaging.');
        setShowShareMenu(false);
    };

    // Filter and sort papers
    const applyFiltersAndSort = () => {
        if (!results?.papers) return;

        let papers = [...results.papers];

        // Apply year filter
        if (yearFilter !== 'all') {
            const currentYear = new Date().getFullYear();
            const yearsAgo = parseInt(yearFilter);
            const cutoffYear = currentYear - yearsAgo;
            papers = papers.filter(p => p.year && p.year >= cutoffYear);
        }

        // Apply citation filter
        if (minCitations > 0) {
            papers = papers.filter(p => p.citationCount >= minCitations);
        }

        // Apply sorting
        if (sortBy === 'year') {
            papers.sort((a, b) => (b.year || 0) - (a.year || 0));
        } else if (sortBy === 'citations') {
            papers.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
        }
        // 'relevance' keeps original order from API

        setFilteredPapers(papers);
    };

    // Apply filters whenever filter/sort options change
    React.useEffect(() => {
        if (results?.papers) {
            applyFiltersAndSort();
        }
    }, [sortBy, yearFilter, minCitations, results]);

    // Load search history on mount
    React.useEffect(() => {
        const saved = localStorage.getItem('researchSearchHistory');
        if (saved) {
            setSearchHistory(JSON.parse(saved));
        }
    }, []);

    // Save to history when analysis completes
    const addToHistory = (searchTopic: string) => {
        const updated = [searchTopic, ...searchHistory.filter(h => h !== searchTopic)].slice(0, 10);
        setSearchHistory(updated);
        localStorage.setItem('researchSearchHistory', JSON.stringify(updated));
    };

    // Generate related topics using AI
    const generateRelatedTopics = async (currentTopic: string) => {
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: `Generate 5 related research topics for: "${currentTopic}". Return ONLY a JSON array of strings, no explanation.`,
                    system: "You are a research topic generator. Return only valid JSON array."
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const cleanJson = data.result.replace(/```json/g, '').replace(/```/g, '').trim();
                const topics = JSON.parse(cleanJson);
                setRelatedTopics(topics);
            }
        } catch (err) {
            console.error('Failed to generate related topics:', err);
        }
    };

    const openPaperDetails = (paper: any) => {
        setSelectedPaper(paper);
        setShowPaperModal(true);
    };

    const closePaperModal = () => {
        setShowPaperModal(false);
        setSelectedPaper(null);
    };

    return (
        <section id="intelligence-hub" className="py-20 px-6 bg-gradient-to-b from-[#0A0A0A] to-[#1A1A1A]">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Research <span className="text-gradient-intelligence">Intelligence Hub</span>
                    </h2>
                    <p className="text-[#999999] text-lg max-w-3xl mx-auto">
                        Discover existing research, identify gaps, explore future directions, and get comprehensive analysis for your research topic
                    </p>
                </motion.div>

                {/* Search Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="max-w-4xl mx-auto mb-12"
                >
                    <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <SearchNormal size="28" className="text-[#4FACFE]" variant="Bold" />
                            <h3 className="text-2xl font-bold text-white">Enter Your Research Topic</h3>
                        </div>
                        
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && analyzeResearch()}
                            onFocus={() => setShowHistory(true)}
                            placeholder="e.g., Machine Learning in Healthcare, Climate Change Adaptation, Quantum Computing..."
                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] text-lg mb-4"
                        />

                        {/* Search History Dropdown */}
                        {showHistory && searchHistory.length > 0 && !results && (
                            <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-[#999999]">Recent Searches</p>
                                    <button
                                        onClick={() => {
                                            setSearchHistory([]);
                                            localStorage.removeItem('researchSearchHistory');
                                        }}
                                        className="text-xs text-red-400 hover:text-red-300"
                                    >
                                        Clear History
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {searchHistory.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setTopic(item);
                                                setShowHistory(false);
                                            }}
                                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={analyzeResearch}
                            disabled={isAnalyzing || !topic.trim()}
                            className="w-full py-4 bg-gradient-to-r from-[#4FACFE] to-[#00F260] text-white rounded-2xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {isAnalyzing ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    >
                                        <MagicStar size="24" variant="Bold" />
                                    </motion.div>
                                    Analyzing Research Landscape...
                                </>
                            ) : (
                                <>
                                    <MagicStar size="24" variant="Bold" />
                                    Analyze Research Landscape
                                </>
                            )}
                        </motion.button>
                    </div>
                </motion.div>

                {/* Results Section */}
                {results && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Research Papers */}
                        {results.papers && results.papers.length > 0 && (
                            <div className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-3xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <DocumentText size="28" className="text-blue-400" variant="Bold" />
                                        Relevant Research Papers ({filteredPapers.length})
                                    </h3>
                                </div>

                                {/* Filters and Sort Controls */}
                                <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Sort By */}
                                        <div>
                                            <label className="block text-sm text-[#999999] mb-2">Sort By</label>
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value as any)}
                                                className="w-full px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                                            >
                                                <option value="relevance">Relevance</option>
                                                <option value="year">Most Recent</option>
                                                <option value="citations">Most Cited</option>
                                            </select>
                                        </div>

                                        {/* Year Filter */}
                                        <div>
                                            <label className="block text-sm text-[#999999] mb-2">Published Within</label>
                                            <select
                                                value={yearFilter}
                                                onChange={(e) => setYearFilter(e.target.value)}
                                                className="w-full px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                                            >
                                                <option value="all">All Time</option>
                                                <option value="1">Last Year</option>
                                                <option value="3">Last 3 Years</option>
                                                <option value="5">Last 5 Years</option>
                                                <option value="10">Last 10 Years</option>
                                            </select>
                                        </div>

                                        {/* Citation Filter */}
                                        <div>
                                            <label className="block text-sm text-[#999999] mb-2">Min Citations</label>
                                            <select
                                                value={minCitations}
                                                onChange={(e) => setMinCitations(parseInt(e.target.value))}
                                                className="w-full px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                                            >
                                                <option value="0">Any</option>
                                                <option value="10">10+</option>
                                                <option value="50">50+</option>
                                                <option value="100">100+</option>
                                                <option value="500">500+</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Active Filters Display */}
                                    {(yearFilter !== 'all' || minCitations > 0 || sortBy !== 'relevance') && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="text-xs text-[#999999]">Active filters:</span>
                                            {sortBy !== 'relevance' && (
                                                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                                                    Sort: {sortBy === 'year' ? 'Most Recent' : 'Most Cited'}
                                                </span>
                                            )}
                                            {yearFilter !== 'all' && (
                                                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                                                    Last {yearFilter} year{yearFilter !== '1' ? 's' : ''}
                                                </span>
                                            )}
                                            {minCitations > 0 && (
                                                <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                                                    {minCitations}+ citations
                                                </span>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setSortBy('relevance');
                                                    setYearFilter('all');
                                                    setMinCitations(0);
                                                }}
                                                className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {filteredPapers.map((paper: any, idx: number) => (
                                        <div 
                                            key={idx} 
                                            className="p-5 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all group"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 
                                                        className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-blue-400 transition-colors cursor-pointer"
                                                        onClick={() => openPaperDetails(paper)}
                                                    >
                                                        {paper.title}
                                                    </h4>
                                                    
                                                    {paper.authors && (
                                                        <p className="text-sm text-[#999999] mb-2">
                                                            {typeof paper.authors === 'string' 
                                                                ? paper.authors
                                                                : Array.isArray(paper.authors) 
                                                                    ? paper.authors.slice(0, 3).map((a: any) => typeof a === 'string' ? a : a.name).join(', ') + 
                                                                      (paper.authors.length > 3 ? ` +${paper.authors.length - 3} more` : '')
                                                                    : paper.authors
                                                            }
                                                        </p>
                                                    )}
                                                    
                                                    {paper.summary && (
                                                        <p className="text-sm text-[#CCCCCC] mb-3 line-clamp-2">
                                                            {paper.summary}
                                                        </p>
                                                    )}
                                                    
                                                    <div className="flex flex-wrap gap-3 text-xs items-center">
                                                        {paper.year && (
                                                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                                                                📅 {paper.year}
                                                            </span>
                                                        )}
                                                        {paper.venue && (
                                                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                                                                📖 {paper.venue}
                                                            </span>
                                                        )}
                                                        {paper.citationCount !== undefined && (
                                                            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded">
                                                                📊 {paper.citationCount} citations
                                                            </span>
                                                        )}
                                                        {paper.paperId && (
                                                            <a
                                                                href={`https://www.semanticscholar.org/paper/${paper.paperId}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded hover:bg-cyan-500/30 transition-colors flex items-center gap-1"
                                                            >
                                                                🔗 Semantic Scholar
                                                            </a>
                                                        )}
                                                        {paper.doi && (
                                                            <a
                                                                href={`https://doi.org/${paper.doi}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded hover:bg-orange-500/30 transition-colors flex items-center gap-1"
                                                            >
                                                                🔗 DOI
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={() => openPaperDetails(paper)}
                                                            className="text-blue-400 hover:text-blue-300 text-xs ml-auto"
                                                        >
                                                            View Details →
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* No Results Message */}
                                {filteredPapers.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-[#999999] mb-2">No papers match your filters</p>
                                        <button
                                            onClick={() => {
                                                setSortBy('relevance');
                                                setYearFilter('all');
                                                setMinCitations(0);
                                            }}
                                            className="text-blue-400 hover:text-blue-300 text-sm"
                                        >
                                            Clear filters to see all {results.papers.length} papers
                                        </button>
                                    </div>
                                )}
                                
                                {/* Google Scholar Search Button */}
                                <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                                    <p className="text-[#CCCCCC] mb-3">
                                        Search for these papers and find more research on Google Scholar
                                    </p>
                                    <a 
                                        href={`https://scholar.google.com/scholar?q=${encodeURIComponent(topic)}`}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                                    >
                                        <SearchNormal size="20" variant="Bold" />
                                        Search on Google Scholar
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Overall Assessment */}
                        <div className="p-6 bg-gradient-to-br from-[#4FACFE]/10 to-[#00F260]/10 border border-[#4FACFE]/30 rounded-3xl">
                            <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
                                <Lamp size="28" className="text-[#4FACFE]" variant="Bold" />
                                Overall Assessment
                            </h3>
                            <p className="text-white leading-relaxed text-lg">{results.overallAssessment}</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Existing Research */}
                            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                        <DocumentText size="24" className="text-blue-400" variant="Bold" />
                                        Existing Research
                                    </h3>
                                    <button
                                        onClick={() => copySection(JSON.stringify(results.existingResearch, null, 2))}
                                        className="text-[#4FACFE] hover:text-[#00F260] transition-colors"
                                    >
                                        <Copy size="20" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {results.existingResearch.map((research: any, idx: number) => (
                                        <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10">
                                            <h4 className="text-blue-400 font-bold mb-2">{research.area}</h4>
                                            <p className="text-[#CCCCCC] text-sm mb-2">{research.summary}</p>
                                            <p className="text-[#999999] text-xs italic">Key: {research.keyFindings}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Research Gaps */}
                            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                        <TrendUp size="24" className="text-red-400" variant="Bold" />
                                        Research Gaps
                                    </h3>
                                    <button
                                        onClick={() => copySection(JSON.stringify(results.researchGaps, null, 2))}
                                        className="text-[#4FACFE] hover:text-[#00F260] transition-colors"
                                    >
                                        <Copy size="20" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {results.researchGaps.map((gap: any, idx: number) => (
                                        <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-red-400 font-bold">{gap.gap}</h4>
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    gap.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                                                    gap.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {gap.difficulty}
                                                </span>
                                            </div>
                                            <p className="text-[#CCCCCC] text-sm">{gap.importance}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Future Directions */}
                            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                        <ArrowDown size="24" className="text-green-400 rotate-[-45deg]" variant="Bold" />
                                        Future Directions
                                    </h3>
                                    <button
                                        onClick={() => copySection(JSON.stringify(results.futureDirections, null, 2))}
                                        className="text-[#4FACFE] hover:text-[#00F260] transition-colors"
                                    >
                                        <Copy size="20" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {results.futureDirections.map((direction: any, idx: number) => (
                                        <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-green-400 font-bold">{direction.direction}</h4>
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    direction.potential === 'High' ? 'bg-green-500/20 text-green-400' :
                                                    direction.potential === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                    {direction.potential}
                                                </span>
                                            </div>
                                            <p className="text-[#CCCCCC] text-sm">{direction.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Trends */}
                            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                        <TrendUp size="24" className="text-purple-400" variant="Bold" />
                                        Current Trends
                                    </h3>
                                    <button
                                        onClick={() => copySection(JSON.stringify(results.trends, null, 2))}
                                        className="text-[#4FACFE] hover:text-[#00F260] transition-colors"
                                    >
                                        <Copy size="20" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {results.trends.map((trend: any, idx: number) => (
                                        <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10">
                                            <h4 className="text-purple-400 font-bold mb-2">{trend.trend}</h4>
                                            <p className="text-[#CCCCCC] text-sm">{trend.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <Lamp size="24" className="text-[#00F260]" variant="Bold" />
                                    Recommendations
                                </h3>
                                <button
                                    onClick={() => copySection(JSON.stringify(results.recommendations, null, 2))}
                                    className="text-[#4FACFE] hover:text-[#00F260] transition-colors"
                                >
                                    <Copy size="20" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {results.recommendations.map((rec: any, idx: number) => (
                                    <div key={idx} className="p-4 bg-gradient-to-br from-[#00F260]/10 to-[#4FACFE]/10 rounded-xl border border-[#00F260]/30">
                                        <h4 className="text-[#00F260] font-bold mb-2">✓ {rec.recommendation}</h4>
                                        <p className="text-[#CCCCCC] text-sm">{rec.rationale}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap justify-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={saveToDashboard}
                                disabled={isSaving || isGuest}
                                className="px-6 py-3 bg-gradient-to-r from-[#4FACFE] to-[#00F260] text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Save2 size="20" variant="Bold" />
                                        </motion.div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save2 size="20" variant="Bold" />
                                        {isGuest ? 'Login to Save' : 'Save to Dashboard'}
                                    </>
                                )}
                            </motion.button>

                            {/* Export Dropdown */}
                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    disabled={isDownloading}
                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-white/20"
                                >
                                    {isDownloading ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            >
                                                <DocumentDownload size="20" variant="Bold" />
                                            </motion.div>
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <DocumentDownload size="20" variant="Bold" />
                                            Export
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </>
                                    )}
                                </motion.button>

                                {/* Export Menu */}
                                {showExportMenu && !isDownloading && (
                                    <div className="absolute top-full mt-2 right-0 bg-[#1a1a1a] border border-white/20 rounded-xl overflow-hidden shadow-xl z-10 min-w-[200px]">
                                        <button
                                            onClick={downloadAsPDF}
                                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                                        >
                                            <DocumentDownload size="18" />
                                            PDF Document
                                        </button>
                                        <button
                                            onClick={downloadAsWord}
                                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                                        >
                                            <DocumentText size="18" />
                                            Word Document
                                        </button>
                                        <button
                                            onClick={downloadAsMarkdown}
                                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                                        >
                                            <DocumentText size="18" />
                                            Markdown File
                                        </button>
                                        <button
                                            onClick={downloadBibTeX}
                                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                                        >
                                            <Copy size="18" />
                                            BibTeX Citations
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Share Dropdown */}
                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowShareMenu(!showShareMenu)}
                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all flex items-center gap-2 border border-white/20"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Share
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </motion.button>

                                {/* Share Menu */}
                                {showShareMenu && (
                                    <div className="absolute top-full mt-2 right-0 bg-[#1a1a1a] border border-white/20 rounded-xl overflow-hidden shadow-xl z-10 min-w-[220px]">
                                        <button
                                            onClick={copyFullAnalysis}
                                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                                        >
                                            <Copy size="18" />
                                            Copy Full Analysis
                                        </button>
                                        <button
                                            onClick={generateShareableText}
                                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                                        >
                                            <Copy size="18" />
                                            Copy Summary
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    setResults(null);
                                    setTopic("");
                                }}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
                            >
                                New Analysis
                            </button>
                        </div>

                        {/* Related Topics Section */}
                        {relatedTopics.length > 0 && (
                            <div className="mt-8 p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-3xl">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Lamp size="24" className="text-purple-400" variant="Bold" />
                                    Explore Related Topics
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {relatedTopics.map((relatedTopic, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setTopic(relatedTopic);
                                                setResults(null);
                                                setRelatedTopics([]);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all hover:scale-105 flex items-center gap-2"
                                        >
                                            <SearchNormal size="16" />
                                            {relatedTopic}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Paper Details Modal */}
            {showPaperModal && selectedPaper && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={closePaperModal}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#1a1a1a] border border-white/20 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-[#1a1a1a] border-b border-white/10 p-6 flex items-start justify-between">
                            <div className="flex-1 pr-4">
                                <h2 className="text-2xl font-bold text-white mb-2">{selectedPaper.title}</h2>
                                {selectedPaper.authors && (
                                    <p className="text-[#999999]">
                                        {typeof selectedPaper.authors === 'string' 
                                            ? selectedPaper.authors 
                                            : Array.isArray(selectedPaper.authors)
                                                ? selectedPaper.authors.map((a: any) => typeof a === 'string' ? a : a.name).join(', ')
                                                : selectedPaper.authors
                                        }
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={closePaperModal}
                                className="text-[#999999] hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Metadata */}
                            <div className="flex flex-wrap gap-3">
                                {selectedPaper.year && (
                                    <span className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm">
                                        📅 {selectedPaper.year}
                                    </span>
                                )}
                                {selectedPaper.venue && (
                                    <span className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-sm">
                                        📖 {selectedPaper.venue}
                                    </span>
                                )}
                                {selectedPaper.citationCount !== undefined && (
                                    <span className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-lg text-sm">
                                        📊 {selectedPaper.citationCount} citations
                                    </span>
                                )}
                            </div>

                            {/* Abstract */}
                            {selectedPaper.summary && (
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                        <DocumentText size="20" className="text-blue-400" variant="Bold" />
                                        Abstract
                                    </h3>
                                    <p className="text-[#CCCCCC] leading-relaxed">
                                        {selectedPaper.summary.replace('...', '')}
                                    </p>
                                </div>
                            )}

                            {/* Links */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Link2 size="20" className="text-cyan-400" variant="Bold" />
                                    Access Paper
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {selectedPaper.paperId && (
                                        <a
                                            href={`https://www.semanticscholar.org/paper/${selectedPaper.paperId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center gap-2"
                                        >
                                            🔗 View on Semantic Scholar
                                        </a>
                                    )}
                                    {selectedPaper.doi && (
                                        <a
                                            href={`https://doi.org/${selectedPaper.doi}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-orange-500/20 text-orange-300 rounded-lg hover:bg-orange-500/30 transition-colors flex items-center gap-2"
                                        >
                                            🔗 DOI Link
                                        </a>
                                    )}
                                    {selectedPaper.arxivId && (
                                        <a
                                            href={`https://arxiv.org/abs/${selectedPaper.arxivId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
                                        >
                                            🔗 arXiv
                                        </a>
                                    )}
                                    <a
                                        href={`https://scholar.google.com/scholar?q=${encodeURIComponent(selectedPaper.title)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2"
                                    >
                                        🔗 Google Scholar
                                    </a>
                                </div>
                            </div>

                            {/* Citation Info */}
                            <div className="p-4 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/30">
                                <h3 className="text-lg font-bold text-white mb-3">Citation Information</h3>
                                <div className="space-y-2 text-sm">
                                    <p className="text-[#CCCCCC]">
                                        <span className="text-white font-semibold">Title:</span> {selectedPaper.title}
                                    </p>
                                    {selectedPaper.authors && (
                                        <p className="text-[#CCCCCC]">
                                            <span className="text-white font-semibold">Authors:</span> {
                                                typeof selectedPaper.authors === 'string' 
                                                    ? selectedPaper.authors 
                                                    : Array.isArray(selectedPaper.authors)
                                                        ? selectedPaper.authors.map((a: any) => typeof a === 'string' ? a : a.name).join(', ')
                                                        : selectedPaper.authors
                                            }
                                        </p>
                                    )}
                                    {selectedPaper.year && (
                                        <p className="text-[#CCCCCC]">
                                            <span className="text-white font-semibold">Year:</span> {selectedPaper.year}
                                        </p>
                                    )}
                                    {selectedPaper.venue && (
                                        <p className="text-[#CCCCCC]">
                                            <span className="text-white font-semibold">Venue:</span> {selectedPaper.venue}
                                        </p>
                                    )}
                                    {selectedPaper.doi && (
                                        <p className="text-[#CCCCCC]">
                                            <span className="text-white font-semibold">DOI:</span> {selectedPaper.doi}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        const citation = `${selectedPaper.authors}. (${selectedPaper.year}). ${selectedPaper.title}. ${selectedPaper.venue}${selectedPaper.doi ? `. https://doi.org/${selectedPaper.doi}` : ''}`;
                                        navigator.clipboard.writeText(citation);
                                        alert('Citation copied to clipboard!');
                                    }}
                                    className="mt-3 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                                >
                                    <Copy size="16" />
                                    Copy Citation
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </section>
    );
}
