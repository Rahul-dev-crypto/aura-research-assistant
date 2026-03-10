"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CopySuccess, User, LogoutCurve } from "iconsax-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { AuthModal } from "@/components/ui/AuthModal";

export function Navbar() {
    const pathname = usePathname();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Check if user is logged in
        const userData = localStorage.getItem('user');
        const guestMode = localStorage.getItem('guestMode');
        
        if (userData) {
            const parsedUser = JSON.parse(userData);
            // Migrate old _id to id format
            const userId = parsedUser.id || parsedUser._id;
            
            if (!parsedUser.id && parsedUser._id) {
                // Migrate old user data to new format
                const migratedUser = { ...parsedUser, id: userId };
                delete migratedUser._id;
                localStorage.setItem('user', JSON.stringify(migratedUser));
                setUser(migratedUser);
            } else {
                setUser(parsedUser);
            }
        } else if (guestMode === 'true') {
            // Set guest user
            setUser({
                name: 'Guest',
                username: 'guest',
                email: '',
                phone: '',
                role: 'guest',
                profileImage: ''
            });
        }
    }, []);

    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('guestMode');
        setUser(null);
        setIsDropdownOpen(false);
        window.location.href = '/';
    };

    const handleGuestMode = () => {
        sessionStorage.removeItem('welcomeShown'); // Clear flag so welcome shows on next page load
        localStorage.setItem('guestMode', 'true');
        setIsAuthModalOpen(false);
        window.location.reload();
    };

    return (
        <>
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 glass"
            >
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <CopySuccess size="32" className="text-white" variant="Bold" />
                    <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-[#4FACFE] to-[#00F260] bg-clip-text text-transparent">
                        Aura
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    <Link 
                        href="/" 
                        className={`font-medium transition-all relative ${
                            pathname === '/' 
                                ? 'text-white' 
                                : 'text-[#999999] hover:text-white'
                        }`}
                    >
                        Home
                        {pathname === '/' && (
                            <motion.div
                                layoutId="navbar-indicator"
                                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4FACFE] to-[#00F260]"
                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                        )}
                    </Link>
                    <Link 
                        href="/dashboard" 
                        className={`font-medium transition-all relative ${
                            pathname === '/dashboard' 
                                ? 'text-white' 
                                : 'text-[#999999] hover:text-white'
                        }`}
                    >
                        Dashboard
                        {pathname === '/dashboard' && (
                            <motion.div
                                layoutId="navbar-indicator"
                                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4FACFE] to-[#00F260]"
                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                        )}
                    </Link>
                    <Link 
                        href="/citations" 
                        className={`font-medium transition-all relative ${
                            pathname === '/citations' 
                                ? 'text-white' 
                                : 'text-[#999999] hover:text-white'
                        }`}
                    >
                        Citations
                        {pathname === '/citations' && (
                            <motion.div
                                layoutId="navbar-indicator"
                                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4FACFE] to-[#00F260]"
                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                        )}
                    </Link>
                    {user?.role === 'admin' && (
                        <Link 
                            href="/admin" 
                            className={`font-medium transition-all relative ${
                                pathname === '/admin' 
                                    ? 'text-white' 
                                    : 'text-[#999999] hover:text-white'
                            }`}
                        >
                            Admin
                            {pathname === '/admin' && (
                                <motion.div
                                    layoutId="navbar-indicator"
                                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4FACFE] to-[#00F260]"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </Link>
                    )}
                </nav>

                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-3 px-4 py-2 rounded-full border border-white/20 hover:bg-white/5 transition-all"
                            >
                                {user.profileImage ? (
                                    <img
                                        src={user.profileImage}
                                        alt={user.name}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4FACFE] to-[#00F260] flex items-center justify-center text-white font-bold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className="text-white font-medium">{user.name}</span>
                                <svg
                                    className={`w-4 h-4 text-white transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 mt-2 w-56 glass-card rounded-2xl border border-white/10 overflow-hidden"
                                    >
                                        <div className="p-4 border-b border-white/10">
                                            <p className="text-white font-medium">{user.name}</p>
                                            <p className="text-[#999999] text-sm">@{user.username}</p>
                                        </div>
                                        <div className="py-2">
                                            <Link
                                                href="/profile"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/5 transition-colors"
                                            >
                                                <User size="20" />
                                                <span>My Profile</span>
                                            </Link>
                                            {user.role === 'admin' && (
                                                <Link
                                                    href="/admin"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-3 text-purple-400 hover:bg-white/5 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span>Admin Panel</span>
                                                </Link>
                                            )}
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-white/5 transition-colors"
                                            >
                                                <LogoutCurve size="20" />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsAuthModalOpen(true)}
                            className="px-6 py-2 rounded-full font-medium text-white border border-white/20 hover:bg-white/5 transition-all"
                        >
                            Sign in
                        </button>
                    )}
                </div>
            </motion.header>

            {isAuthModalOpen && (
                <AuthModal 
                    onClose={() => setIsAuthModalOpen(false)} 
                    onGuestMode={handleGuestMode}
                />
            )}
        </>
    );
}
