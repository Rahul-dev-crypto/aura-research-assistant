"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { AuthModal } from "./AuthModal";

interface FeatureShowcaseProps {
    isAuthenticated: boolean;
}

export function FeatureShowcase({ isAuthenticated }: FeatureShowcaseProps) {
    const [showAuthModal, setShowAuthModal] = useState(false);

    const handleFeatureClick = (taskId: string) => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
        } else {
            // Special handling for grant-wizard and intelligence-hub
            if (taskId === 'grant-wizard') {
                document.getElementById('grant-wizard')?.scrollIntoView({ behavior: 'smooth' });
            } else if (taskId === 'intelligence-hub') {
                document.getElementById('intelligence-hub')?.scrollIntoView({ behavior: 'smooth' });
            } else {
                // Scroll to wizard and select task
                const event = new CustomEvent('selectTask', { detail: taskId });
                window.dispatchEvent(event);
                document.getElementById('wizard')?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    const handleAuthSuccess = () => {
        setShowAuthModal(false);
        window.location.reload();
    };

    const handleGuestMode = () => {
        sessionStorage.removeItem('welcomeShown'); // Clear flag so welcome shows on next page load
        localStorage.setItem('guestMode', 'true');
        setShowAuthModal(false);
        window.location.reload();
    };

    const features = [
        {
            id: 'research-questions',
            title: 'Research Questions',
            description: 'Generate focused, researchable questions tailored to your field and topic',
            gradient: 'from-[#4FACFE]/20 to-[#00F260]/20',
            iconColor: 'text-[#4FACFE]',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )
        },
        {
            id: 'hypothesis',
            title: 'Hypothesis Builder',
            description: 'Create testable, specific hypotheses that drive your research forward',
            gradient: 'from-purple-500/20 to-pink-500/20',
            iconColor: 'text-purple-400',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            )
        },
        {
            id: 'methodology',
            title: 'Methodology Advisor',
            description: 'Get recommendations for research design, data collection, and analysis methods',
            gradient: 'from-blue-500/20 to-cyan-500/20',
            iconColor: 'text-blue-400',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            )
        },
        {
            id: 'statistical-analysis',
            title: 'Statistical Analysis',
            description: 'Identify the right statistical tests and analysis approaches for your data',
            gradient: 'from-green-500/20 to-emerald-500/20',
            iconColor: 'text-green-400',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            )
        },
        {
            id: 'abstract',
            title: 'Abstract Generator',
            description: 'Create compelling abstracts following academic standards and best practices',
            gradient: 'from-orange-500/20 to-red-500/20',
            iconColor: 'text-orange-400',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            )
        },
        {
            id: 'literature-synthesis',
            title: 'Literature Synthesis',
            description: 'Synthesize research literature with AI-generated citations and insights',
            gradient: 'from-yellow-500/20 to-amber-500/20',
            iconColor: 'text-yellow-400',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            )
        },
        {
            id: 'paper-analysis',
            title: 'Paper Analyzer',
            description: 'Extract key findings, methodology, and research gaps from any paper',
            gradient: 'from-indigo-500/20 to-purple-500/20',
            iconColor: 'text-indigo-400',
            icon: (
                <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </>
            )
        },
        {
            id: 'plagiarism-check',
            title: 'Plagiarism Checker',
            description: 'Analyze text for originality with visual highlighting and detailed reports',
            gradient: 'from-red-500/20 to-pink-500/20',
            iconColor: 'text-red-400',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            )
        },
        {
            id: 'keyword-extractor',
            title: 'Keyword Extractor',
            description: 'Automatically extract main, secondary, and MeSH keywords from papers',
            gradient: 'from-teal-500/20 to-cyan-500/20',
            iconColor: 'text-teal-400',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            )
        },
        {
            id: 'text-refine',
            title: 'Text Refiner',
            description: 'Polish your writing with grammar fixes, tone adjustments, and clarity improvements',
            gradient: 'from-pink-500/20 to-rose-500/20',
            iconColor: 'text-pink-400',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            )
        },
        {
            id: 'complete-manuscript',
            title: 'Complete Manuscript',
            description: 'Generate full research papers with all sections from introduction to conclusion',
            gradient: 'from-violet-500/20 to-purple-500/20',
            iconColor: 'text-violet-400',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            )
        },
        {
            id: 'intelligence-hub',
            title: 'Research Intelligence Hub',
            description: 'Discover papers, identify gaps, explore trends, and get comprehensive research analysis',
            gradient: 'from-cyan-500/20 to-blue-500/20',
            iconColor: 'text-cyan-400',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            )
        },
        {
            id: 'grant-wizard',
            title: 'Grant Generator',
            description: 'Step-by-step wizard to craft compelling, structured grants',
            gradient: 'from-amber-500/20 to-orange-500/20',
            iconColor: 'text-amber-400',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )
        },
    ];

    return (
        <>
            <section className="px-6 py-16 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                        Powerful features, <span className="text-gradient-hero">optimized</span> for academia!
                    </h2>
                    <p className="text-[#999999] text-lg max-w-3xl mx-auto">
                        Everything you need to accelerate your research workflow, from ideation to publication
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.button
                            key={feature.id}
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ 
                                delay: index * 0.06,
                                duration: 0.5,
                                ease: [0.25, 0.46, 0.45, 0.94]
                            }}
                            whileHover={{ 
                                scale: 1.03, 
                                y: -8,
                                transition: { duration: 0.3, ease: "easeOut" }
                            }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleFeatureClick(feature.id)}
                            className="glass-card rounded-3xl p-8 border border-white/10 hover:border-[#4FACFE]/50 transition-all cursor-pointer text-left relative group overflow-hidden"
                        >
                            {/* Animated gradient overlay on hover */}
                            <motion.div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{
                                    background: `linear-gradient(135deg, ${feature.gradient.replace('from-', 'rgba(79,172,254,0.05) 0%, ').replace('to-', 'rgba(0,242,96,0.05) 100%')})`
                                }}
                            />
                            
                            <motion.div 
                                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 relative z-10`}
                                whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <svg className={`w-8 h-8 ${feature.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {feature.icon}
                                </svg>
                            </motion.div>
                            <h3 className="text-xl font-bold text-white mb-3 relative z-10">{feature.title}</h3>
                            <p className="text-[#999999] text-sm leading-relaxed relative z-10">
                                {feature.description}
                            </p>
                        </motion.button>
                    ))}
                </div>
            </section>

            {showAuthModal && (
                <AuthModal 
                    onClose={() => setShowAuthModal(false)}
                    onSuccess={handleAuthSuccess}
                    onGuestMode={handleGuestMode}
                />
            )}
        </>
    );
}
