"use client";

import { Navbar } from "@/components/layout/Navbar";
import { CitationManager } from "@/components/ui/CitationManager";
import { CopilotSidebar } from "@/components/ui/CopilotSidebar";

export default function CitationsPage() {
    return (
        <main className="min-h-screen bg-[#050505] text-white">
            <Navbar />
            <div className="pt-32 px-6 max-w-7xl mx-auto pb-24">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">
                        <span className="text-gradient-hero">Citation</span> Manager
                    </h1>
                    <p className="text-[#999999] text-lg">Manage all your research citations in one place</p>
                </div>
                
                <CitationManager />
            </div>
            <CopilotSidebar />
        </main>
    );
}
