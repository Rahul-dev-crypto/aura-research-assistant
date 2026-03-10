import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

// Export Paper Analysis
export const exportPaperAnalysisPDF = (analysis: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPos = margin;

    const addText = (text: string, fontSize: number, color: [number, number, number], isBold = false) => {
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFont("times", isBold ? "bold" : "normal");
        const lines = doc.splitTextToSize(text, maxWidth);
        if (yPos + (lines.length * fontSize * 0.5) > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
        }
        doc.text(lines, margin, yPos);
        yPos += lines.length * fontSize * 0.5 + 5;
    };

    // Title
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.setFont("times", "bold");
    doc.text("Paper Analysis Report", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    addText(analysis.title, 16, [0, 0, 0], true);
    addText("Summary", 14, [30, 64, 175], true);
    addText(analysis.summary, 11, [0, 0, 0]);
    
    if (analysis.abstract) {
        addText("Abstract", 14, [30, 64, 175], true);
        addText(analysis.abstract, 11, [0, 0, 0]);
    }
    
    if (analysis.methodology) {
        addText("Methodology", 14, [30, 64, 175], true);
        addText(analysis.methodology, 11, [0, 0, 0]);
    }
    
    if (analysis.results) {
        addText("Results", 14, [30, 64, 175], true);
        addText(analysis.results, 11, [0, 0, 0]);
    }
    
    if (analysis.conclusions) {
        addText("Conclusions", 14, [30, 64, 175], true);
        addText(analysis.conclusions, 11, [0, 0, 0]);
    }
    
    if (analysis.keyFindings && analysis.keyFindings.length > 0) {
        addText("Key Findings", 14, [30, 64, 175], true);
        analysis.keyFindings.forEach((f: string, i: number) => {
            addText(`${i + 1}. ${f}`, 11, [0, 0, 0]);
        });
    }
    
    if (analysis.researchGaps && analysis.researchGaps.length > 0) {
        addText("Research Gaps", 14, [30, 64, 175], true);
        analysis.researchGaps.forEach((g: string, i: number) => {
            addText(`${i + 1}. ${g}`, 11, [0, 0, 0]);
        });
    }

    doc.save(`${analysis.title.replace(/[^a-z0-9]/gi, '_')}_analysis.pdf`);
};

export const exportPaperAnalysisWord = async (analysis: any) => {
    const children: any[] = [];

    children.push(new Paragraph({ text: "Paper Analysis Report", heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: analysis.title, heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: "" }));
    
    children.push(new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_3 }));
    children.push(new Paragraph({ text: analysis.summary }));
    children.push(new Paragraph({ text: "" }));
    
    if (analysis.abstract) {
        children.push(new Paragraph({ text: "Abstract", heading: HeadingLevel.HEADING_3 }));
        children.push(new Paragraph({ text: analysis.abstract }));
        children.push(new Paragraph({ text: "" }));
    }
    
    if (analysis.methodology) {
        children.push(new Paragraph({ text: "Methodology", heading: HeadingLevel.HEADING_3 }));
        children.push(new Paragraph({ text: analysis.methodology }));
        children.push(new Paragraph({ text: "" }));
    }
    
    if (analysis.results) {
        children.push(new Paragraph({ text: "Results", heading: HeadingLevel.HEADING_3 }));
        children.push(new Paragraph({ text: analysis.results }));
        children.push(new Paragraph({ text: "" }));
    }
    
    if (analysis.conclusions) {
        children.push(new Paragraph({ text: "Conclusions", heading: HeadingLevel.HEADING_3 }));
        children.push(new Paragraph({ text: analysis.conclusions }));
        children.push(new Paragraph({ text: "" }));
    }
    
    if (analysis.keyFindings && analysis.keyFindings.length > 0) {
        children.push(new Paragraph({ text: "Key Findings", heading: HeadingLevel.HEADING_3 }));
        analysis.keyFindings.forEach((f: string, i: number) => {
            children.push(new Paragraph({ text: `${i + 1}. ${f}` }));
        });
        children.push(new Paragraph({ text: "" }));
    }
    
    if (analysis.researchGaps && analysis.researchGaps.length > 0) {
        children.push(new Paragraph({ text: "Research Gaps", heading: HeadingLevel.HEADING_3 }));
        analysis.researchGaps.forEach((g: string, i: number) => {
            children.push(new Paragraph({ text: `${i + 1}. ${g}` }));
        });
    }

    const doc = new Document({ sections: [{ properties: {}, children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${analysis.title.replace(/[^a-z0-9]/gi, '_')}_analysis.docx`);
};

export const exportPaperAnalysisMarkdown = (analysis: any) => {
    let md = `# Paper Analysis Report\n\n`;
    md += `## ${analysis.title}\n\n`;
    md += `### Summary\n\n${analysis.summary}\n\n`;
    
    if (analysis.abstract) md += `### Abstract\n\n${analysis.abstract}\n\n`;
    if (analysis.methodology) md += `### Methodology\n\n${analysis.methodology}\n\n`;
    if (analysis.results) md += `### Results\n\n${analysis.results}\n\n`;
    if (analysis.conclusions) md += `### Conclusions\n\n${analysis.conclusions}\n\n`;
    
    if (analysis.keyFindings && analysis.keyFindings.length > 0) {
        md += `### Key Findings\n\n`;
        analysis.keyFindings.forEach((f: string, i: number) => {
            md += `${i + 1}. ${f}\n`;
        });
        md += `\n`;
    }
    
    if (analysis.researchGaps && analysis.researchGaps.length > 0) {
        md += `### Research Gaps\n\n`;
        analysis.researchGaps.forEach((g: string, i: number) => {
            md += `${i + 1}. ${g}\n`;
        });
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    saveAs(blob, `${analysis.title.replace(/[^a-z0-9]/gi, '_')}_analysis.md`);
};

// Export Research Questions
export const exportResearchQuestionsPDF = (questions: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPos = margin;

    const addText = (text: string, fontSize: number, color: [number, number, number], isBold = false) => {
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFont("times", isBold ? "bold" : "normal");
        const lines = doc.splitTextToSize(text, maxWidth);
        if (yPos + (lines.length * fontSize * 0.5) > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
        }
        doc.text(lines, margin, yPos);
        yPos += lines.length * fontSize * 0.5 + 5;
    };

    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.setFont("times", "bold");
    doc.text("Research Questions", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    addText(`Topic: ${questions.topic}`, 12, [100, 100, 100]);
    yPos += 5;

    questions.questions.forEach((q: any, idx: number) => {
        addText(`Question ${idx + 1}: ${q.question}`, 12, [0, 0, 0], true);
        addText(`Rationale: ${q.rationale}`, 11, [0, 0, 0]);
        addText(`HOW: ${q.how}`, 11, [0, 0, 0]);
        addText(`WHY: ${q.why}`, 11, [0, 0, 0]);
        addText(`WHAT: ${q.what}`, 11, [0, 0, 0]);
        addText(`WHERE: ${q.where}`, 11, [0, 0, 0]);
        addText(`WHEN: ${q.when}`, 11, [0, 0, 0]);
        addText(`WHO: ${q.who}`, 11, [0, 0, 0]);
        yPos += 5;
    });

    doc.save(`research_questions_${questions.topic.replace(/[^a-z0-9]/gi, '_')}.pdf`);
};

export const exportResearchQuestionsWord = async (questions: any) => {
    const children: any[] = [];

    children.push(new Paragraph({ text: "Research Questions", heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: `Topic: ${questions.topic}` }));
    children.push(new Paragraph({ text: "" }));

    questions.questions.forEach((q: any, idx: number) => {
        children.push(new Paragraph({ text: `Question ${idx + 1}: ${q.question}`, heading: HeadingLevel.HEADING_3 }));
        children.push(new Paragraph({ text: `Rationale: ${q.rationale}` }));
        children.push(new Paragraph({ text: `HOW: ${q.how}` }));
        children.push(new Paragraph({ text: `WHY: ${q.why}` }));
        children.push(new Paragraph({ text: `WHAT: ${q.what}` }));
        children.push(new Paragraph({ text: `WHERE: ${q.where}` }));
        children.push(new Paragraph({ text: `WHEN: ${q.when}` }));
        children.push(new Paragraph({ text: `WHO: ${q.who}` }));
        children.push(new Paragraph({ text: "" }));
    });

    const doc = new Document({ sections: [{ properties: {}, children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `research_questions_${questions.topic.replace(/[^a-z0-9]/gi, '_')}.docx`);
};

export const exportResearchQuestionsMarkdown = (questions: any) => {
    let md = `# Research Questions\n\n`;
    md += `**Topic:** ${questions.topic}\n\n`;

    questions.questions.forEach((q: any, idx: number) => {
        md += `## Question ${idx + 1}: ${q.question}\n\n`;
        md += `**Rationale:** ${q.rationale}\n\n`;
        md += `**HOW:** ${q.how}\n\n`;
        md += `**WHY:** ${q.why}\n\n`;
        md += `**WHAT:** ${q.what}\n\n`;
        md += `**WHERE:** ${q.where}\n\n`;
        md += `**WHEN:** ${q.when}\n\n`;
        md += `**WHO:** ${q.who}\n\n`;
        md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    saveAs(blob, `research_questions_${questions.topic.replace(/[^a-z0-9]/gi, '_')}.md`);
};
