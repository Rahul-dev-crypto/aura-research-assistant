"use client";

import { motion } from "framer-motion";
import { SearchNormal1 } from "iconsax-react";
import { useState } from "react";
import { AuthModal } from "@/components/ui/AuthModal";

interface HeroProps {
    isAuthenticated: boolean;
}

export function Hero({ isAuthenticated }: HeroProps) {
    const [showAuthModal, setShowAuthModal] = useState(false);

    const handleStartResearching = () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
        } else {
            document.getElementById('wizard')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleAuthSuccess = () => {
        setShowAuthModal(false);
        // Reload page to show full features
        window.location.reload();
    };

    const handleGuestMode = () => {
        sessionStorage.removeItem('welcomeShown'); // Clear flag so welcome shows on next page load
        localStorage.setItem('guestMode', 'true');
        setShowAuthModal(false);
        window.location.reload();
    };

    return (
        <>
            <section className="relative pt-48 pb-32 px-6 flex flex-col items-center text-center overflow-hidden">
                {/* Animated Background Glows - Smooth Floating */}
                <motion.div
                    animate={{ 
                        y: [0, -30, 0],
                        x: [0, 20, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                        repeat: Infinity, 
                        duration: 12, 
                        ease: "easeInOut" 
                    }}
                    className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-[#4FACFE]/30 to-[#00F2FE]/20 rounded-full blur-[140px] -z-10 pointer-events-none"
                />
                <motion.div
                    animate={{ 
                        y: [0, 30, 0],
                        x: [0, -25, 0],
                        scale: [1, 1.15, 1]
                    }}
                    transition={{ 
                        repeat: Infinity, 
                        duration: 15, 
                        ease: "easeInOut", 
                        delay: 2 
                    }}
                    className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-l from-[#FF4E50]/20 to-[#F9D423]/10 rounded-full blur-[120px] -z-10 pointer-events-none"
                />
                <motion.div
                    animate={{ 
                        y: [0, -20, 0],
                        x: [0, 15, 0],
                        scale: [1, 1.05, 1],
                        rotate: [0, 180, 360]
                    }}
                    transition={{ 
                        repeat: Infinity, 
                        duration: 20, 
                        ease: "linear"
                    }}
                    className="absolute bottom-1/4 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-[#00F260]/15 to-[#0575E6]/10 rounded-full blur-[100px] -z-10 pointer-events-none"
                />

                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                >
                    <motion.h1 
                        className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        Aura: the next-generation <span className="text-gradient-hero">research workspace</span>
                    </motion.h1>
                    <motion.p 
                        className="text-[#999999] text-lg md:text-xl max-w-2xl mx-auto mb-12"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        Intelligent research automation for academics. From literature discovery to grant writing, powered by advanced AI.
                    </motion.p>

                    <motion.div 
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                    >
                        <motion.button 
                            onClick={handleStartResearching}
                            className="relative px-8 py-4 rounded-full font-medium text-white border border-white/20 glass overflow-hidden group"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                boxShadow: "0 0 30px rgba(79, 172, 254, 0.2)"
                            }}
                        >
                            {/* Subtle shimmer effect */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                animate={{ x: ["-100%", "200%"] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 1 }}
                            />
                            
                            {/* Hover glow */}
                            <motion.div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"
                                style={{
                                    background: "radial-gradient(circle at center, rgba(79, 172, 254, 0.15), transparent 70%)"
                                }}
                            />
                            
                            {/* Button content */}
                            <span className="relative z-10 flex items-center gap-2">
                                <SearchNormal1 className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                                <span>Start Researching</span>
                            </span>
                        </motion.button>
                    </motion.div>
                </motion.div>
            </section>

            {/* Auth Modal with Guest Option */}
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
