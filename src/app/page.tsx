"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/layout/Hero";
import { GrantWizard } from "@/components/ui/GrantWizard";
import { ResearchWizard } from "@/components/ui/ResearchWizard";
import { ResearchIntelligenceHub } from "@/components/ui/ResearchIntelligenceHub";
import { FeatureShowcase } from "@/components/ui/FeatureShowcase";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TickCircle } from "iconsax-react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const guestMode = localStorage.getItem('guestMode');
    const welcomeShown = sessionStorage.getItem('welcomeShown'); // Use sessionStorage so it resets on browser close
    
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.name);
      setIsAuthenticated(true);
      
      // Only show welcome if not shown in this session
      if (!welcomeShown) {
        setShowWelcomeDialog(true);
        sessionStorage.setItem('welcomeShown', 'true');
        
        // Hide dialog after 3 seconds
        setTimeout(() => {
          setShowWelcomeDialog(false);
        }, 3000);
      }
    } else if (guestMode === 'true') {
      setUserName('Guest');
      setIsGuest(true);
      setIsAuthenticated(true);
      
      // Only show welcome if not shown in this session
      if (!welcomeShown) {
        setShowWelcomeDialog(true);
        sessionStorage.setItem('welcomeShown', 'true');
        
        // Hide dialog after 3 seconds
        setTimeout(() => {
          setShowWelcomeDialog(false);
        }, 3000);
      }
    }
  }, []);

  return (
    <div className="min-h-screen selection:bg-cyan-500/30">
      <Navbar />
      <main>
        <Hero isAuthenticated={isAuthenticated || isGuest} />
        
        {/* Always show feature showcase */}
        <FeatureShowcase isAuthenticated={isAuthenticated || isGuest} />
        
        {/* Only show wizards when authenticated */}
        {(isAuthenticated || isGuest) && (
          <>
            <ResearchWizard isGuest={isGuest} />
            <ResearchIntelligenceHub isGuest={isGuest} />
            <GrantWizard isGuest={isGuest} />
          </>
        )}
      </main>

      {/* Welcome Dialog */}
      <AnimatePresence>
        {showWelcomeDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-[#111] to-[#1a1a1a] border border-[#4FACFE]/30 rounded-3xl p-12 max-w-md text-center shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#4FACFE] to-[#00F260] rounded-full flex items-center justify-center"
              >
                <TickCircle size="48" variant="Bold" className="text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Welcome Back!
              </h2>
              <p className="text-xl text-gradient-hero font-semibold">
                {userName}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
