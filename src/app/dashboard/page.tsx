"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DocumentText, Magicpen, Clock, SearchNormal, Filter, DocumentDownload, CloseCircle, ArrowLeft, Edit2, Save2, Eye, Lamp, Chart, MessageQuestion, Shield, Tag, TextalignLeft } from "iconsax-react";
import { Navbar } from "@/components/layout/Navbar";
import { CopilotSidebar } from "@/components/ui/CopilotSidebar";
import ReactMarkdown from "react-markdown";
import dynamic from "next/dynamic";
const SimpleEditor = dynamic(() => import("@/components/ui/SimpleEditor"), { ssr: false, loading: () => <p>Loading editor...</p> });

interface ResearchItem {
    _id: string;
    title: string;
    type: 'synthesis' | 'proposal' | 'paper' | 'intelligence-hub' | 'analysis' | 'questions' | 'abstract' | 'plagiarism' | 'keywords' | 'refiner';
    content: string;
    sourcePrompt?: string;
    createdAt: string;
}

export default function DashboardPage() {
    const [items, setItems] = useState<ResearchItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<ResearchItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<'all' | 'synthesis' | 'proposal' | 'paper' | 'intelligence-hub' | 'analysis' | 'questions' | 'abstract' | 'plagiarism' | 'keywords' | 'refiner'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
    const [selectedItem, setSelectedItem] = useState<ResearchItem | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [analytics, setAnalytics] = useState({
        total: 0,
        byType: {} as Record<string, number>,
        recentActivity: [] as { date: string; count: number }[],
        mostUsedType: '',
    });

    // Helper function to get type display info
    const getTypeInfo = (type: string) => {
        const typeMap: Record<string, { label: string; color: string; bgColor: string }> = {
            'synthesis': { label: 'Literature Synthesis', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
            'proposal': { label: 'Grant Proposal', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
            'paper': { label: 'Paper Analysis', color: 'text-green-400', bgColor: 'bg-green-500/20' },
            'intelligence-hub': { label: 'Research Intelligence', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
            'analysis': { label: 'Paper Analysis', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
            'questions': { label: 'Research Questions', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
            'abstract': { label: 'Abstract', color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
            'plagiarism': { label: 'Plagiarism Check', color: 'text-red-400', bgColor: 'bg-red-500/20' },
            'keywords': { label: 'Keywords', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
            'refiner': { label: 'Text Refiner', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' }
        };
        return typeMap[type] || { label: type, color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
    };

    // Calculate analytics
    const calculateAnalytics = (itemsList: ResearchItem[]) => {
        const byType: Record<string, number> = {};
        const activityMap: Record<string, number> = {};
        
        itemsList.forEach(item => {
            // Count by type
            byType[item.type] = (byType[item.type] || 0) + 1;
            
            // Count by date
            const date = new Date(item.createdAt).toLocaleDateString();
            activityMap[date] = (activityMap[date] || 0) + 1;
        });
        
        // Get most used type
        let mostUsedType = '';
        let maxCount = 0;
        Object.entries(byType).forEach(([type, count]) => {
            if (count > maxCount) {
                maxCount = count;
                mostUsedType = type;
            }
        });
        
        // Format recent activity (last 7 days)
        const recentActivity = Object.entries(activityMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 7);
        
        setAnalytics({
            total: itemsList.length,
            byType,
            recentActivity,
            mostUsedType
        });
    };

    // Helper function to get icon for type
    const TypeIcon = ({ type, size = 24 }: { type: string; size?: number }) => {
        const iconProps = { size, variant: "Bulk" as const, className: "drop-shadow-sm" };
        
        switch (type) {
            case 'synthesis':
                return <DocumentText {...iconProps} />;
            case 'proposal':
                return <Magicpen {...iconProps} />;
            case 'paper':
                return <DocumentText {...iconProps} />;
            case 'intelligence-hub':
                return <Lamp {...iconProps} />;
            case 'analysis':
                return <Chart {...iconProps} />;
            case 'questions':
                return <MessageQuestion {...iconProps} />;
            case 'abstract':
                return <DocumentText {...iconProps} />;
            case 'plagiarism':
                return <Shield {...iconProps} />;
            case 'keywords':
                return <Tag {...iconProps} />;
            case 'refiner':
                return <TextalignLeft {...iconProps} />;
            default:
                return <DocumentText {...iconProps} />;
        }
    };

    useEffect(() => {
        const fetchItems = async () => {
            try {
                // Get user data from localStorage
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                    setLoading(false);
                    return;
                }
                
                const user = JSON.parse(userStr);
                const userId = user._id;
                const role = user.role || 'user';
                
                const res = await fetch(`/api/research?userId=${userId}&role=${role}`);
                const data = await res.json();
                if (data.items) {
                    setItems(data.items);
                    setFilteredItems(data.items);
                    
                    // Calculate analytics
                    calculateAnalytics(data.items);
                }
            } catch (error) {
                console.error("Failed to fetch research items", error);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    // Filter and search logic with improved case-insensitive and space-insensitive matching
    useEffect(() => {
        let filtered = [...items];

        // Apply type filter
        if (filterType !== 'all') {
            filtered = filtered.filter(item => item.type === filterType);
        }

        // Apply search with better matching (case-insensitive, space-insensitive)
        if (searchQuery.trim()) {
            const normalizedQuery = searchQuery.toLowerCase().replace(/\s+/g, '');
            filtered = filtered.filter(item => {
                const normalizedTitle = item.title.toLowerCase().replace(/\s+/g, '');
                const normalizedContent = item.content.toLowerCase().replace(/\s+/g, '');
                return normalizedTitle.includes(normalizedQuery) || normalizedContent.includes(normalizedQuery);
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            } else if (sortBy === 'oldest') {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else {
                return a.title.localeCompare(b.title);
            }
        });

        setFilteredItems(filtered);
    }, [items, searchQuery, filterType, sortBy]);

    const handleDelete = async (id: string) => {
        try {
            // Get user data from localStorage
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            
            const user = JSON.parse(userStr);
            const userId = user._id;
            const role = user.role || 'user';
            
            const res = await fetch(`/api/research?id=${id}&userId=${userId}&role=${role}`, { method: 'DELETE' });
            if (res.ok) {
                setItems(items.filter(item => item._id !== id));
                setShowDeleteConfirm(null);
            }
        } catch (error) {
            console.error("Failed to delete item", error);
        }
    };

    const exportItem = (item: ResearchItem) => {
        const blob = new Blob([item.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const exportToPDF = async (item: ResearchItem) => {
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const element = document.getElementById('pdf-export-content');
            if (element) {
                element.style.display = 'block';
                
                await html2pdf().from(element).set({
                    margin: [0.75, 0.75, 0.75, 0.75],
                    filename: `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'document'}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { 
                        scale: 2, 
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#ffffff'
                    },
                    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                }).save();
                
                element.style.display = 'none';
            }
        } catch (error) {
            console.error("PDF export failed:", error);
            alert("PDF export failed. Please try again.");
        }
    };

    const exportToWord = (item: ResearchItem) => {
        try {
            const contentToExport = isEditing ? editContent : item.content;
            
            const convertMarkdownToHtml = (text: string): string => {
                return text
                    .replace(/\*\*\*([\s\S]+?)\*\*\*/g, '<strong><em>$1</em></strong>')
                    .replace(/\_\_\_([\s\S]+?)\_\_\_/g, '<strong><em>$1</em></strong>')
                    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\_\_([\s\S]+?)\_\_/g, '<strong>$1</strong>')
                    .replace(/\*([\s\S]+?)\*/g, '<em>$1</em>')
                    .replace(/\_([\s\S]+?)\_/g, '<em>$1</em>');
            };
            
            let lines = contentToExport.split('\n');
            let htmlContent = '';
            let inList = false;
            
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                
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
                else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                    if (!inList) { htmlContent += '<ul>'; inList = true; }
                    let listContent = convertMarkdownToHtml(line.trim().substring(2));
                    htmlContent += `<li>${listContent}</li>`;
                }
                else if (line.trim() !== '') {
                    if (inList) { htmlContent += '</ul>'; inList = false; }
                    let paraContent = convertMarkdownToHtml(line);
                    htmlContent += `<p>${paraContent}</p>`;
                }
                else {
                    if (inList) { htmlContent += '</ul>'; inList = false; }
                }
            }
            
            if (inList) { htmlContent += '</ul>'; }
            
            const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${item.title}</title>
                <style>
                    body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; color: #000000; margin: 0; padding: 0; }
                    h1 { font-family: "Times New Roman", Times, serif; font-size: 18pt; font-weight: bold; margin-top: 24pt; margin-bottom: 12pt; text-align: center; }
                    h2 { font-family: "Times New Roman", Times, serif; font-size: 14pt; font-weight: bold; margin-top: 18pt; margin-bottom: 8pt; }
                    h3 { font-family: "Times New Roman", Times, serif; font-size: 12pt; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; }
                    p { font-family: "Times New Roman", Times, serif; font-size: 12pt; margin-bottom: 10pt; text-align: justify; }
                    ul { font-family: "Times New Roman", Times, serif; font-size: 12pt; margin-bottom: 10pt; margin-left: 0.5in; }
                    li { font-family: "Times New Roman", Times, serif; font-size: 12pt; margin-bottom: 4pt; }
                    strong { font-weight: bold; }
                    em { font-style: italic; }
                </style>
            </head>
            <body>${htmlContent}</body></html>`;
            
            const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'document'}.doc`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Word export failed:", error);
            alert("Word export failed. Please try again.");
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedItem) return;
        
        try {
            // Get user data from localStorage
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            
            const user = JSON.parse(userStr);
            const userId = user._id;
            const role = user.role || 'user';
            
            const res = await fetch('/api/research', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedItem._id,
                    userId: userId,
                    role: role,
                    content: editContent
                })
            });
            
            if (res.ok) {
                // Update local state
                setItems(items.map(item => 
                    item._id === selectedItem._id 
                        ? { ...item, content: editContent }
                        : item
                ));
                setSelectedItem({ ...selectedItem, content: editContent });
                setIsEditing(false);
                alert('Changes saved successfully!');
            }
        } catch (error) {
            console.error("Failed to save changes", error);
            alert('Failed to save changes. Please try again.');
        }
    };

    // Full document view
    if (selectedItem) {
        return (
            <main className="min-h-screen bg-[#050505] text-white">
                <Navbar />
                <div className="pt-32 px-6 max-w-5xl mx-auto pb-24">
                    {/* Back Button */}
                    <button
                        onClick={() => {
                            setSelectedItem(null);
                            setIsEditing(false);
                        }}
                        className="flex items-center gap-2 text-[#4FACFE] hover:text-[#4FACFE]/80 transition-colors mb-6"
                    >
                        <ArrowLeft size="20" />
                        Back to Dashboard
                    </button>

                    {/* Document Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-3 rounded-xl ${getTypeInfo(selectedItem.type).bgColor} ${getTypeInfo(selectedItem.type).color}`}>
                                <TypeIcon type={selectedItem.type} size={32} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-lg ${getTypeInfo(selectedItem.type).bgColor} ${getTypeInfo(selectedItem.type).color}`}>
                                        {getTypeInfo(selectedItem.type).label}
                                    </span>
                                </div>
                                <h1 className="text-3xl font-bold">{selectedItem.title}</h1>
                                <div className="flex items-center gap-2 text-sm text-[#999999] mt-1">
                                    <Clock size="14" />
                                    {new Date(selectedItem.createdAt).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => {
                                    if (isEditing) {
                                        setIsEditing(false);
                                    } else {
                                        setEditContent(selectedItem.content);
                                        setIsEditing(true);
                                    }
                                }}
                                className="px-6 py-3 rounded-xl border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-2 font-medium"
                            >
                                {isEditing ? <Eye size="18" /> : <Edit2 size="18" />}
                                {isEditing ? "Preview" : "Edit"}
                            </button>
                            
                            {isEditing && (
                                <button
                                    onClick={handleSaveEdit}
                                    className="px-6 py-3 rounded-xl bg-[#4FACFE] text-white hover:bg-[#4FACFE]/90 transition-colors flex items-center gap-2 font-medium"
                                >
                                    <Save2 size="18" />
                                    Save Changes
                                </button>
                            )}
                            
                            <button
                                onClick={() => exportToWord(selectedItem)}
                                className="px-6 py-3 rounded-xl border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 transition-colors flex items-center gap-2 font-medium"
                            >
                                <DocumentDownload size="18" />
                                Word
                            </button>
                            
                            <button
                                onClick={() => exportToPDF(selectedItem)}
                                className="px-6 py-3 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 font-medium"
                            >
                                <DocumentDownload size="18" />
                                PDF
                            </button>
                            
                            <button
                                onClick={() => setShowDeleteConfirm(selectedItem._id)}
                                className="px-6 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 font-medium"
                            >
                                <CloseCircle size="18" variant="Bold" />
                                Delete
                            </button>
                        </div>
                    </div>

                    {/* Document Content */}
                    {isEditing ? (
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                            <SimpleEditor 
                                value={editContent} 
                                onChange={setEditContent} 
                            />
                        </div>
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
                                    {selectedItem.content.trim().startsWith('<') ? (
                                        // Render HTML content directly
                                        <div dangerouslySetInnerHTML={{ __html: selectedItem.content }} />
                                    ) : (
                                        // Render Markdown content
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
                                            {selectedItem.content}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            </div>
                            
                            {/* Visible preview */}
                            <div className="bg-white text-black p-12 rounded-2xl shadow-2xl" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt', lineHeight: '1.5' }}>
                                <div className="prose prose-slate max-w-none" style={{ color: 'black' }}>
                                    {selectedItem.content.trim().startsWith('<') ? (
                                        // Render HTML content directly
                                        <div dangerouslySetInnerHTML={{ __html: selectedItem.content }} />
                                    ) : (
                                        // Render Markdown content
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
                                            {selectedItem.content}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {showDeleteConfirm === selectedItem._id && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
                            onClick={() => setShowDeleteConfirm(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-md w-full"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-red-500/20 rounded-xl">
                                        <CloseCircle size="32" variant="Bold" className="text-red-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold">Delete Item?</h3>
                                </div>
                                <p className="text-[#999999] mb-6">
                                    Are you sure you want to delete "{selectedItem.title}"? This action cannot be undone.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(null)}
                                        className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
                                    >
                                        No, Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleDelete(selectedItem._id);
                                            setSelectedItem(null);
                                        }}
                                        className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                                    >
                                        Yes, Delete
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white">
            <Navbar />
            <div className="pt-32 px-6 max-w-7xl mx-auto pb-24">
                <div className="mb-12 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                            My <span className="text-gradient-primary">Research</span>
                        </h1>
                        <p className="text-[#999999] text-lg">
                            Your saved research documents, analysis, and generated content.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                    >
                        <Chart size="20" variant="Bold" />
                        {showAnalytics ? 'Hide' : 'Show'} Analytics
                    </button>
                </div>

                {/* Analytics Panel */}
                {showAnalytics && analytics.total > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {/* Total Documents */}
                        <div className="p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">Total Documents</h3>
                                <DocumentText size="32" className="text-blue-400" variant="Bold" />
                            </div>
                            <p className="text-4xl font-bold text-white">{analytics.total}</p>
                            <p className="text-sm text-[#999999] mt-2">Saved research items</p>
                        </div>

                        {/* Most Used Feature */}
                        <div className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">Most Used</h3>
                                <Magicpen size="32" className="text-purple-400" variant="Bold" />
                            </div>
                            <p className="text-2xl font-bold text-white">{getTypeInfo(analytics.mostUsedType).label}</p>
                            <p className="text-sm text-[#999999] mt-2">{analytics.byType[analytics.mostUsedType]} documents</p>
                        </div>

                        {/* Recent Activity */}
                        <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                                <Clock size="32" className="text-green-400" variant="Bold" />
                            </div>
                            <p className="text-4xl font-bold text-white">{analytics.recentActivity.length}</p>
                            <p className="text-sm text-[#999999] mt-2">Active days (last 7)</p>
                        </div>

                        {/* Documents by Type */}
                        <div className="md:col-span-3 p-6 bg-white/5 border border-white/10 rounded-2xl">
                            <h3 className="text-xl font-bold text-white mb-6">Documents by Type</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {Object.entries(analytics.byType).map(([type, count]) => {
                                    const typeInfo = getTypeInfo(type);
                                    return (
                                        <div key={type} className={`p-4 ${typeInfo.bgColor} rounded-xl border border-white/10`}>
                                            <p className={`text-sm ${typeInfo.color} font-medium mb-1`}>{typeInfo.label}</p>
                                            <p className="text-2xl font-bold text-white">{count}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Search and Filter Bar */}
                <div className="mb-8 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <SearchNormal size="20" className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999999]" />
                        <input
                            type="text"
                            placeholder="Search by title or content..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white placeholder:text-[#666666] focus:border-[#4FACFE]/50 outline-none transition-colors"
                        />
                    </div>

                    {/* Filters and Sort */}
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="flex items-center gap-2">
                            <Filter size="20" className="text-[#999999]" />
                            <span className="text-sm text-[#999999] font-medium">Filter by Type:</span>
                        </div>
                        
                        {/* Type Filter Buttons - Organized in rows */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setFilterType('all')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                    filterType === 'all'
                                        ? 'bg-gradient-to-r from-[#4FACFE] to-[#00F260] text-white shadow-lg'
                                        : 'bg-white/5 text-[#999999] hover:bg-white/10 border border-white/10'
                                }`}
                            >
                                All ({items.length})
                            </button>
                            
                            {/* Research Tools */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'synthesis', label: 'Literature Synthesis', color: 'blue' },
                                    { value: 'intelligence-hub', label: 'Research Intelligence', color: 'cyan' },
                                    { value: 'analysis', label: 'Paper Analysis', color: 'emerald' },
                                    { value: 'questions', label: 'Research Questions', color: 'yellow' },
                                ].map(({ value, label, color }) => (
                                    <button
                                        key={value}
                                        onClick={() => setFilterType(value as any)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                            filterType === value
                                                ? `bg-${color}-500 text-white shadow-lg`
                                                : `bg-white/5 text-${color}-400 hover:bg-${color}-500/10 border border-${color}-500/30`
                                        }`}
                                    >
                                        {label} ({items.filter(i => i.type === value).length})
                                    </button>
                                ))}
                            </div>
                            
                            {/* Writing Tools */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'proposal', label: 'Grant Proposal', color: 'purple' },
                                    { value: 'abstract', label: 'Abstract', color: 'pink' },
                                    { value: 'refiner', label: 'Text Refiner', color: 'indigo' },
                                ].map(({ value, label, color }) => (
                                    <button
                                        key={value}
                                        onClick={() => setFilterType(value as any)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                            filterType === value
                                                ? `bg-${color}-500 text-white shadow-lg`
                                                : `bg-white/5 text-${color}-400 hover:bg-${color}-500/10 border border-${color}-500/30`
                                        }`}
                                    >
                                        {label} ({items.filter(i => i.type === value).length})
                                    </button>
                                ))}
                            </div>
                            
                            {/* Analysis Tools */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'plagiarism', label: 'Plagiarism Check', color: 'red' },
                                    { value: 'keywords', label: 'Keywords', color: 'orange' },
                                    { value: 'paper', label: 'Paper', color: 'green' },
                                ].map(({ value, label, color }) => (
                                    <button
                                        key={value}
                                        onClick={() => setFilterType(value as any)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                            filterType === value
                                                ? `bg-${color}-500 text-white shadow-lg`
                                                : `bg-white/5 text-${color}-400 hover:bg-${color}-500/10 border border-${color}-500/30`
                                        }`}
                                    >
                                        {label} ({items.filter(i => i.type === value).length})
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-sm text-[#999999] font-medium">Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none cursor-pointer hover:border-[#4FACFE]/50 transition-colors [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="title">Title (A-Z)</option>
                            </select>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="text-sm text-[#999999]">
                        Showing {filteredItems.length} of {items.length} items
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4FACFE]"></div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20 glass-card rounded-3xl border border-white/5">
                        <DocumentText size="64" variant="Bulk" className="text-white/20 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">No Research Saved Yet</h3>
                        <p className="text-[#999999]">Head over to the Home page to generate your first Synthesis or Proposal.</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-20 glass-card rounded-3xl border border-white/5">
                        <SearchNormal size="64" variant="Bulk" className="text-white/20 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">No Results Found</h3>
                        <p className="text-[#999999]">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item, i) => {
                            const typeInfo = getTypeInfo(item.type);
                            return (
                                <motion.div
                                    key={item._id}
                                    initial={{ y: 30, opacity: 0, scale: 0.95 }}
                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                    transition={{ 
                                        delay: i * 0.08, 
                                        duration: 0.5,
                                        ease: [0.25, 0.46, 0.45, 0.94]
                                    }}
                                    whileHover={{ 
                                        y: -8, 
                                        scale: 1.02,
                                        boxShadow: "0 20px 60px rgba(79, 172, 254, 0.3), 0 0 40px rgba(79, 172, 254, 0.2)",
                                        transition: { duration: 0.3, ease: "easeOut" }
                                    }}
                                    className="glass-card rounded-[24px] p-6 flex flex-col hover:border-[#4FACFE]/50 transition-all relative group"
                                    style={{
                                        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)"
                                    }}
                                >
                                    {/* Animated glow on hover */}
                                    <motion.div
                                        className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-[#4FACFE]/0 via-[#4FACFE]/5 to-[#00F260]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                        animate={{
                                            background: [
                                                "linear-gradient(135deg, rgba(79,172,254,0) 0%, rgba(79,172,254,0.05) 50%, rgba(0,242,96,0) 100%)",
                                                "linear-gradient(225deg, rgba(0,242,96,0) 0%, rgba(79,172,254,0.05) 50%, rgba(79,172,254,0) 100%)",
                                                "linear-gradient(135deg, rgba(79,172,254,0) 0%, rgba(79,172,254,0.05) 50%, rgba(0,242,96,0) 100%)"
                                            ]
                                        }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    />
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className={`p-3 rounded-xl ${typeInfo.bgColor} ${typeInfo.color} flex-shrink-0`}>
                                            <TypeIcon type={item.type} size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${typeInfo.bgColor} ${typeInfo.color}`}>
                                                    {typeInfo.label}
                                                </span>
                                            </div>
                                            <h3 
                                                onClick={() => setSelectedItem(item)}
                                                className="font-bold text-lg line-clamp-2 cursor-pointer hover:text-[#4FACFE] transition-colors mb-1"
                                            >
                                                {item.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-[#999999]">
                                                <Clock size="12" />
                                                {new Date(item.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div 
                                        onClick={() => setSelectedItem(item)}
                                        className="flex-1 bg-white/5 rounded-xl p-4 overflow-hidden relative mb-4 cursor-pointer hover:bg-white/10 transition-colors border border-white/5"
                                    >
                                        <p className="text-sm text-[#CCCCCC] line-clamp-4 whitespace-pre-wrap font-sans leading-relaxed">
                                            {/* Strip HTML tags and show plain text */}
                                            {item.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()}
                                        </p>
                                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#111] to-transparent pointer-events-none" />
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setSelectedItem(item)}
                                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#4FACFE]/20 to-[#00F260]/20 border border-[#4FACFE]/30 text-sm font-medium hover:from-[#4FACFE]/30 hover:to-[#00F260]/30 transition-all flex items-center justify-center gap-2 text-white"
                                        >
                                            <Eye size="18" variant="Bold" />
                                            View
                                        </button>
                                        <button 
                                            onClick={() => exportItem(item)}
                                            className="flex-1 py-2.5 px-3 rounded-xl border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <DocumentDownload size="18" variant="Bold" />
                                            <span className="hidden sm:inline">Download</span>
                                        </button>
                                        <button 
                                            onClick={() => setShowDeleteConfirm(item._id)}
                                            className="py-2.5 px-4 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CloseCircle size="18" variant="Bold" />
                                            <span className="hidden sm:inline">Delete</span>
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
                        onClick={() => setShowDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-md w-full"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-red-500/20 rounded-xl">
                                    <CloseCircle size="32" variant="Bold" className="text-red-400" />
                                </div>
                                <h3 className="text-2xl font-bold">Delete Item?</h3>
                            </div>
                            <p className="text-[#999999] mb-6">
                                Are you sure you want to delete this item? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
                                >
                                    No, Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(showDeleteConfirm)}
                                    className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <CopilotSidebar />
        </main>
    );
}
