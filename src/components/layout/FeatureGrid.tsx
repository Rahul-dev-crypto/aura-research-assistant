"use client";

import { motion } from "framer-motion";
import { DocumentText, Magicpen, MessageQuestion } from "iconsax-react";

const features = [
    {
        title: "Instant Literature Synthesis",
        desc: "Seamlessly generate structured reviews with semantic search.",
        icon: <DocumentText size="32" variant="Bulk" className="text-white mb-4" />,
        className: "col-span-1 md:col-span-2 row-span-1",
    },
    {
        title: "Grant Generator",
        desc: "AI-powered wizard to draft successful proposals.",
        icon: <Magicpen size="32" variant="Bulk" className="text-white mb-4" />,
        className: "col-span-1 row-span-2",
    },
    {
        title: "Smart AI Copilot",
        desc: "Ask questions, refine ideas, and get context-aware answers.",
        icon: <MessageQuestion size="32" variant="Bulk" className="text-white mb-4" />,
        className: "col-span-1 md:col-span-2 row-span-1",
    }
];

export function FeatureGrid() {
    return (
        <section className="px-6 py-24 max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-white">
                    Powerful features, <span className="text-gradient-primary">optimized</span> for academia!
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
                {features.map((feature, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className={`glass-card rounded-[32px] p-8 flex flex-col justify-end group hover:border-[#4FACFE]/50 transition-colors ${feature.className}`}
                    >
                        <div>
                            {feature.icon}
                            <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-[#999999] group-hover:text-white/80 transition-colors">
                                {feature.desc}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
