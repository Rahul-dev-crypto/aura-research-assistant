"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, Add, Copy, Trash, Edit2, TickCircle, CloseCircle, DocumentDownload, Link2, MagicStar } from "iconsax-react";
import { saveAs } from "file-saver";

interface Citation {
    _id?: string;
    type: 'book' | 'journal' | 'website' | 'conference';
    authors: string;
    title: string;
    year: string;
    publisher?: string;
    journal?: string;
    volume?: string;
    pages?: string;
    url?: string;
    doi?: string;
}

const citationStyles = {
    APA: (citation: Citation) => {
        const { authors, year, title, journal, volume, pages, publisher, url, doi } = citation;
        if (citation.type === 'journal') {
            return `${authors} (${year}). ${title}. ${journal}, ${volume}${pages ? `, ${pages}` : ''}.${doi ? ` https://doi.org/${doi}` : url ? ` ${url}` : ''}`;
        } else if (citation.type === 'book') {
            return `${authors} (${year}). ${title}. ${publisher}.`;
        } else if (citation.type === 'website') {
            return `${authors} (${year}). ${title}. Retrieved from ${url}`;
        }
        return `${authors} (${year}). ${title}.`;
    },
    MLA: (citation: Citation) => {
        const { authors, title, journal, volume, year, pages, publisher, url } = citation;
        if (citation.type === 'journal') {
            return `${authors}. "${title}." ${journal} ${volume} (${year}): ${pages}.${url ? ` Web. ${url}` : ''}`;
        } else if (citation.type === 'book') {
            return `${authors}. ${title}. ${publisher}, ${year}. Print.`;
        } else if (citation.type === 'website') {
            return `${authors}. "${title}." ${year}. Web. ${url}`;
        }
        return `${authors}. "${title}." ${year}.`;
    },
    Chicago: (citation: Citation) => {
        const { authors, year, title, journal, volume, pages, publisher } = citation;
        if (citation.type === 'journal') {
            return `${authors}. "${title}." ${journal} ${volume} (${year}): ${pages}.`;
        } else if (citation.type === 'book') {
            return `${authors}. ${title}. ${publisher}, ${year}.`;
        }
        return `${authors}. ${title}. ${year}.`;
    },
    Harvard: (citation: Citation) => {
        const { authors, year, title, journal, volume, pages, publisher } = citation;
        const authorLastName = authors.split(',')[0] || authors.split(' ').pop();
        if (citation.type === 'journal') {
            return `${authorLastName} (${year}) '${title}', ${journal}, ${volume}${pages ? `, pp. ${pages}` : ''}.`;
        } else if (citation.type === 'book') {
            return `${authorLastName} (${year}) ${title}, ${publisher}.`;
        }
        return `${authorLastName} (${year}) ${title}.`;
    },
    IEEE: (citation: Citation) => {
        const { authors, title, journal, volume, pages, year, publisher } = citation;
        if (citation.type === 'journal') {
            return `${authors}, "${title}," ${journal}, vol. ${volume}, pp. ${pages}, ${year}.`;
        } else if (citation.type === 'book') {
            return `${authors}, ${title}. ${publisher}, ${year}.`;
        }
        return `${authors}, "${title}," ${year}.`;
    },
    BibTeX: (citation: Citation) => {
        const key = `${citation.authors.split(',')[0].replace(/\s/g, '')}${citation.year}`;
        let bibtex = `@${citation.type}{${key},\n`;
        bibtex += `  author = {${citation.authors}},\n`;
        bibtex += `  title = {${citation.title}},\n`;
        bibtex += `  year = {${citation.year}},\n`;
        if (citation.journal) bibtex += `  journal = {${citation.journal}},\n`;
        if (citation.volume) bibtex += `  volume = {${citation.volume}},\n`;
        if (citation.pages) bibtex += `  pages = {${citation.pages}},\n`;
        if (citation.publisher) bibtex += `  publisher = {${citation.publisher}},\n`;
        if (citation.doi) bibtex += `  doi = {${citation.doi}},\n`;
        if (citation.url) bibtex += `  url = {${citation.url}},\n`;
        bibtex += `}`;
        return bibtex;
    }
};

export function CitationManager() {
    const [citations, setCitations] = useState<Citation[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState<keyof typeof citationStyles>('APA');
    const [searchQuery, setSearchQuery] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [autoFormatInput, setAutoFormatInput] = useState("");
    const [isAutoFormatting, setIsAutoFormatting] = useState(false);
    
    const [formData, setFormData] = useState<Citation>({
        type: 'journal',
        authors: '',
        title: '',
        year: '',
        journal: '',
        volume: '',
        pages: '',
        publisher: '',
        url: '',
        doi: ''
    });

    useEffect(() => {
        fetchCitations();
    }, []);

    const fetchCitations = async () => {
        try {
            const res = await fetch('/api/citations');
            const data = await res.json();
            if (data.citations) {
                setCitations(data.citations);
            }
        } catch (error) {
            console.error("Failed to fetch citations", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const url = editingId ? '/api/citations' : '/api/citations';
            const method = editingId ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingId ? { ...formData, id: editingId } : formData)
            });

            if (res.ok) {
                fetchCitations();
                resetForm();
                setShowAddForm(false);
            }
        } catch (error) {
            console.error("Failed to save citation", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this citation?')) return;
        
        try {
            const res = await fetch(`/api/citations?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCitations(citations.filter(c => c._id !== id));
            }
        } catch (error) {
            console.error("Failed to delete citation", error);
        }
    };

    const handleEdit = (citation: Citation) => {
        setFormData(citation);
        setEditingId(citation._id || null);
        setShowAddForm(true);
    };

    const resetForm = () => {
        setFormData({
            type: 'journal',
            authors: '',
            title: '',
            year: '',
            journal: '',
            volume: '',
            pages: '',
            publisher: '',
            url: '',
            doi: ''
        });
        setEditingId(null);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Citation copied to clipboard!');
    };

    const generateBibliography = () => {
        const bibliography = filteredCitations
            .map(citation => citationStyles[selectedStyle](citation))
            .join('\n\n');
        
        const blob = new Blob([bibliography], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bibliography_${selectedStyle}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const filteredCitations = citations.filter(citation =>
        citation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        citation.authors.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <section className="px-6 py-24 max-w-6xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4 text-white">
                    <span className="text-gradient-hero">Citation</span> Manager
                </h2>
                <p className="text-[#999999]">Organize your references and generate bibliographies in multiple formats.</p>
            </div>

            <div className="glass-card rounded-[32px] p-8 md:p-12">
                {/* Header Controls */}
                <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                resetForm();
                                setShowAddForm(!showAddForm);
                            }}
                            className="px-6 py-3 bg-[#4FACFE] text-white rounded-xl hover:bg-[#4FACFE]/90 transition-colors flex items-center gap-2 font-medium"
                        >
                            <Add size="20" />
                            Add Citation
                        </button>
                        
                        {citations.length > 0 && (
                            <button
                                onClick={generateBibliography}
                                className="px-6 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 transition-colors flex items-center gap-2 font-medium"
                            >
                                <Book size="20" />
                                Export Bibliography
                            </button>
                        )}
                    </div>

                    {/* Style Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-[#999999]">Style:</span>
                        <select
                            value={selectedStyle}
                            onChange={(e) => setSelectedStyle(e.target.value as any)}
                            className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none cursor-pointer [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                        >
                            {Object.keys(citationStyles).map(style => (
                                <option key={style} value={style} className="bg-[#1a1a1a] text-white">{style}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Search Bar */}
                {citations.length > 0 && (
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Search citations by title or author..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-6 py-3 text-white placeholder:text-[#666666] focus:border-[#4FACFE]/50 outline-none transition-colors"
                        />
                    </div>
                )}

                {/* Add/Edit Form */}
                <AnimatePresence>
                    {showAddForm && (
                        <motion.form
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleSubmit}
                            className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10"
                        >
                            <h3 className="text-xl font-bold text-white mb-4">
                                {editingId ? 'Edit Citation' : 'Add New Citation'}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[#999999] mb-2 text-sm">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                                        required
                                    >
                                        <option value="journal" className="bg-[#1a1a1a] text-white">Journal Article</option>
                                        <option value="book" className="bg-[#1a1a1a] text-white">Book</option>
                                        <option value="website" className="bg-[#1a1a1a] text-white">Website</option>
                                        <option value="conference" className="bg-[#1a1a1a] text-white">Conference Paper</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[#999999] mb-2 text-sm">Authors *</label>
                                    <input
                                        type="text"
                                        value={formData.authors}
                                        onChange={(e) => setFormData({...formData, authors: e.target.value})}
                                        placeholder="Smith, J., & Doe, A."
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666666] outline-none"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[#999999] mb-2 text-sm">Title *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        placeholder="Article or Book Title"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666666] outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[#999999] mb-2 text-sm">Year *</label>
                                    <input
                                        type="text"
                                        value={formData.year}
                                        onChange={(e) => setFormData({...formData, year: e.target.value})}
                                        placeholder="2024"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666666] outline-none"
                                        required
                                    />
                                </div>

                                {formData.type === 'journal' && (
                                    <>
                                        <div>
                                            <label className="block text-[#999999] mb-2 text-sm">Journal Name</label>
                                            <input
                                                type="text"
                                                value={formData.journal}
                                                onChange={(e) => setFormData({...formData, journal: e.target.value})}
                                                placeholder="Nature"
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666666] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[#999999] mb-2 text-sm">Volume</label>
                                            <input
                                                type="text"
                                                value={formData.volume}
                                                onChange={(e) => setFormData({...formData, volume: e.target.value})}
                                                placeholder="15"
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666666] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[#999999] mb-2 text-sm">Pages</label>
                                            <input
                                                type="text"
                                                value={formData.pages}
                                                onChange={(e) => setFormData({...formData, pages: e.target.value})}
                                                placeholder="123-145"
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666666] outline-none"
                                            />
                                        </div>
                                    </>
                                )}

                                {formData.type === 'book' && (
                                    <div>
                                        <label className="block text-[#999999] mb-2 text-sm">Publisher</label>
                                        <input
                                            type="text"
                                            value={formData.publisher}
                                            onChange={(e) => setFormData({...formData, publisher: e.target.value})}
                                            placeholder="Oxford University Press"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666666] outline-none"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[#999999] mb-2 text-sm">URL</label>
                                    <input
                                        type="url"
                                        value={formData.url}
                                        onChange={(e) => setFormData({...formData, url: e.target.value})}
                                        placeholder="https://..."
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666666] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[#999999] mb-2 text-sm">DOI</label>
                                    <input
                                        type="text"
                                        value={formData.doi}
                                        onChange={(e) => setFormData({...formData, doi: e.target.value})}
                                        placeholder="10.1000/xyz123"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#666666] outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-[#4FACFE] text-white rounded-xl hover:bg-[#4FACFE]/90 transition-colors flex items-center gap-2 font-medium"
                                >
                                    <TickCircle size="20" />
                                    {editingId ? 'Update' : 'Add'} Citation
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        resetForm();
                                    }}
                                    className="px-6 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 transition-colors flex items-center gap-2 font-medium"
                                >
                                    <CloseCircle size="20" />
                                    Cancel
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* Citations List */}
                {filteredCitations.length === 0 ? (
                    <div className="text-center py-12">
                        <Book size="64" variant="Bulk" className="text-white/20 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Citations Yet</h3>
                        <p className="text-[#999999]">Add your first citation to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredCitations.map((citation, index) => (
                            <motion.div
                                key={citation._id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-3 py-1 bg-[#4FACFE]/20 text-[#4FACFE] text-xs font-medium rounded-lg">
                                                {citation.type}
                                            </span>
                                            <span className="text-xs text-[#999999]">{citation.year}</span>
                                        </div>
                                        <p className="text-white font-mono text-sm leading-relaxed">
                                            {citationStyles[selectedStyle](citation)}
                                        </p>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => copyToClipboard(citationStyles[selectedStyle](citation))}
                                            className="px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-1 text-sm font-medium"
                                            title="Copy citation"
                                        >
                                            <Copy size="16" variant="Bold" />
                                            Copy
                                        </button>
                                        <button
                                            onClick={() => handleEdit(citation)}
                                            className="px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex items-center gap-1 text-sm font-medium"
                                            title="Edit citation"
                                        >
                                            <Edit2 size="16" variant="Bold" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(citation._id!)}
                                            className="px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1 text-sm font-medium"
                                            title="Delete citation"
                                        >
                                            <Trash size="16" variant="Bold" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
