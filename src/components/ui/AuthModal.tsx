"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloseCircle, Eye, EyeSlash } from "iconsax-react";

declare global {
    interface Window {
        google: any;
    }
}

interface AuthModalProps {
    onClose: () => void;
    onSuccess?: () => void;
    onGuestMode?: () => void;
}

export function AuthModal({ onClose, onSuccess, onGuestMode }: AuthModalProps) {
    const [mode, setMode] = useState<"login" | "register" | "google-complete">("login");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Login form
    const [emailOrUsername, setEmailOrUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Register form
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");

    // Google auth data
    const [googleData, setGoogleData] = useState<any>(null);

    const resetForm = () => {
        setEmailOrUsername("");
        setLoginPassword("");
        setName("");
        setUsername("");
        setEmail("");
        setPhone("");
        setRegisterPassword("");
        setError("");
        setSuccess("");
        setShowPassword(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emailOrUsername,
                    password: loginPassword,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess("Login successful!");
                sessionStorage.removeItem('welcomeShown'); // Clear flag so welcome shows on next page load
                localStorage.setItem("user", JSON.stringify(data.user));
                setTimeout(() => {
                    if (onSuccess) {
                        onSuccess();
                    } else {
                        onClose();
                        resetForm();
                        window.location.reload();
                    }
                }, 1500);
            } else {
                setError(data.error || "Login failed");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    username,
                    email,
                    phone,
                    password: registerPassword,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess("Account created successfully! Please login.");
                setTimeout(() => {
                    setMode("login");
                    resetForm();
                }, 2000);
            } else {
                setError(data.error || "Registration failed");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        console.log("🔵 Google Sign-In button clicked!");
        setError("");
        setIsLoading(true);
        
        try {
            const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
            
            if (!clientId) {
                setError("Google Sign-In is not configured.");
                setIsLoading(false);
                return;
            }

            // Use OAuth 2.0 popup flow instead of One Tap (more compatible)
            const redirectUri = `${window.location.origin}`;
            const scope = 'email profile openid';
            const responseType = 'token id_token';
            const nonce = Math.random().toString(36).substring(7);
            
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${encodeURIComponent(clientId)}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&response_type=${encodeURIComponent(responseType)}` +
                `&scope=${encodeURIComponent(scope)}` +
                `&nonce=${nonce}` +
                `&prompt=select_account`;

            // Open popup
            const width = 500;
            const height = 600;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;
            
            const popup = window.open(
                authUrl,
                'Google Sign In',
                `width=${width},height=${height},left=${left},top=${top}`
            );

            if (!popup) {
                setError("Please allow popups for this site to use Google Sign-In");
                setIsLoading(false);
                return;
            }

            // Listen for the OAuth callback
            const checkPopup = setInterval(async () => {
                try {
                    if (popup.closed) {
                        clearInterval(checkPopup);
                        setIsLoading(false);
                        return;
                    }

                    // Check if popup redirected back
                    const popupUrl = popup.location.href;
                    if (popupUrl.includes(window.location.origin)) {
                        clearInterval(checkPopup);
                        
                        // Extract token from URL hash
                        const hash = popup.location.hash;
                        popup.close();
                        
                        if (hash) {
                            const params = new URLSearchParams(hash.substring(1));
                            const idToken = params.get('id_token');
                            
                            if (idToken) {
                                // Decode and process the token
                                const base64Url = idToken.split('.')[1];
                                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                                }).join(''));
                                
                                const userData = JSON.parse(jsonPayload);
                                
                                // Send to backend
                                const res = await fetch("/api/auth/google", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        email: userData.email,
                                        name: userData.name,
                                        googleId: userData.sub,
                                    }),
                                });

                                const data = await res.json();

                                if (res.ok) {
                                    if (data.isNewUser) {
                                        setGoogleData(data);
                                        setName(data.name);
                                        setEmail(data.email);
                                        setUsername(data.suggestedUsername);
                                        setMode("google-complete");
                                    } else {
                                        setSuccess("Login successful!");
                                        sessionStorage.removeItem('welcomeShown'); // Clear flag so welcome shows on next page load
                                        localStorage.setItem("user", JSON.stringify(data.user));
                                        setTimeout(() => {
                                            if (onSuccess) {
                                                onSuccess();
                                            } else {
                                                onClose();
                                                window.location.reload();
                                            }
                                        }, 1500);
                                    }
                                } else {
                                    setError(data.error || "Google sign-in failed");
                                }
                            }
                        }
                        setIsLoading(false);
                    }
                } catch (e) {
                    // Cross-origin error - popup hasn't redirected yet
                }
            }, 500);

        } catch (err) {
            console.error("❌ Google Sign-In error:", err);
            setError("Failed to initialize Google Sign-In");
            setIsLoading(false);
        }
    };

    const handleGoogleCallback = async (response: any) => {
        try {
            setIsLoading(true);
            
            // Decode JWT token to get user info
            const base64Url = response.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const userData = JSON.parse(jsonPayload);
            
            // Send to backend
            const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: userData.email,
                    name: userData.name,
                    googleId: userData.sub,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                if (data.isNewUser) {
                    // Show additional info form
                    setGoogleData(data);
                    setName(data.name);
                    setEmail(data.email);
                    setUsername(data.suggestedUsername);
                    setMode("google-complete");
                } else {
                    // Existing user, log them in
                    setSuccess("Login successful!");
                    sessionStorage.removeItem('welcomeShown'); // Clear flag so welcome shows on next page load
                    localStorage.setItem("user", JSON.stringify(data.user));
                    setTimeout(() => {
                        if (onSuccess) {
                            onSuccess();
                        } else {
                            onClose();
                            window.location.reload();
                        }
                    }, 1500);
                }
            } else {
                setError(data.error || "Google sign-in failed");
            }
        } catch (err) {
            console.error('Google sign-in error:', err);
            setError("Failed to sign in with Google");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompleteGoogleRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/google", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: googleData.email,
                    name,
                    username,
                    phone,
                    password: registerPassword,
                    googleId: googleData.googleId,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess("Registration successful!");
                sessionStorage.removeItem('welcomeShown'); // Clear flag so welcome shows on next page load
                localStorage.setItem("user", JSON.stringify(data.user));
                setTimeout(() => {
                    if (onSuccess) {
                        onSuccess();
                    } else {
                        onClose();
                        window.location.reload();
                    }
                }, 1500);
            } else {
                setError(data.error || "Registration failed");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
            >
                <div className="glass-card rounded-3xl p-8 md:p-12 w-full max-w-lg relative pointer-events-auto">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <CloseCircle size="28" className="text-[#999999]" />
                    </button>

                    {/* Header */}
                    <div className="text-center mb-10">
                            <h2 className="text-4xl md:text-5xl font-bold mb-2">
                                <span className="text-gradient-hero">
                                    {mode === "login" ? "Welcome Back" : mode === "register" ? "Create Account" : "Complete Your Profile"}
                                </span>
                            </h2>
                        </div>

                            {/* Error/Success Messages */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-400 text-sm text-center">
                                    {success}
                                </div>
                            )}

                            {/* Login Form */}
                            {mode === "login" && (
                                <form onSubmit={handleLogin} className="space-y-6">
                                    <div>
                                        <label className="block text-base font-medium text-white mb-3">
                                            Email or Username
                                        </label>
                                        <input
                                            type="text"
                                            value={emailOrUsername}
                                            onChange={(e) => setEmailOrUsername(e.target.value)}
                                            className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] transition-all text-base"
                                            placeholder="Enter your email or username"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-base font-medium text-white mb-3">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] transition-all text-base"
                                                placeholder="Enter your password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999999] hover:text-white"
                                            >
                                                {showPassword ? <EyeSlash size="22" /> : <Eye size="22" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 bg-gradient-to-br from-[#4FACFE] to-[#00F260] text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 mt-8"
                                    >
                                        {isLoading ? "Signing in..." : "Login"}
                                    </button>

                                    {/* Divider */}
                                    <div className="relative my-8">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-white/10"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-4 bg-[#0A0A0A] text-[#999999]">or</span>
                                        </div>
                                    </div>

                                    {/* Google Sign In */}
                                    <button
                                        type="button"
                                        onClick={handleGoogleSignIn}
                                        disabled={isLoading}
                                        className="w-full py-4 bg-white text-gray-800 font-semibold rounded-2xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        Continue with Google
                                    </button>

                                    {/* Register Link */}
                                    <div className="text-center mt-6">
                                        <p className="text-[#999999]">
                                            Don't have an account?{" "}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMode("register");
                                                    resetForm();
                                                }}
                                                className="text-gradient-hero font-semibold hover:underline"
                                            >
                                                Register
                                            </button>
                                        </p>
                                    </div>
                                </form>
                            )}

                            {/* Register Form */}
                            {mode === "register" && (
                                <form onSubmit={handleRegister} className="space-y-5">
                                    <div>
                                        <label className="block text-base font-medium text-white mb-3">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] transition-all text-base"
                                            placeholder="Enter your full name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-base font-medium text-white mb-3">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] transition-all text-base"
                                            placeholder="Choose a unique username"
                                            required
                                            minLength={3}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-base font-medium text-white mb-3">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] transition-all text-base"
                                            placeholder="Enter your email"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-base font-medium text-white mb-3">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] transition-all text-base"
                                            placeholder="Enter your phone number"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-base font-medium text-white mb-3">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={registerPassword}
                                                onChange={(e) => setRegisterPassword(e.target.value)}
                                                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] transition-all text-base"
                                                placeholder="Create a password (min 6 characters)"
                                                required
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999999] hover:text-white"
                                            >
                                                {showPassword ? <EyeSlash size="22" /> : <Eye size="22" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 bg-gradient-to-br from-[#4FACFE] to-[#00F260] text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 mt-8"
                                    >
                                        {isLoading ? "Creating account..." : "Create Account"}
                                    </button>

                                    {/* Divider */}
                                    <div className="relative my-8">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-white/10"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-4 bg-[#0A0A0A] text-[#999999]">or</span>
                                        </div>
                                    </div>

                                    {/* Google Sign In */}
                                    <button
                                        type="button"
                                        onClick={handleGoogleSignIn}
                                        disabled={isLoading}
                                        className="w-full py-4 bg-white text-gray-800 font-semibold rounded-2xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        Continue with Google
                                    </button>

                                    {/* Login Link */}
                                    <div className="text-center mt-6">
                                        <p className="text-[#999999]">
                                            Already have an account?{" "}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMode("login");
                                                    resetForm();
                                                }}
                                                className="text-gradient-hero font-semibold hover:underline"
                                            >
                                                Login
                                            </button>
                                        </p>
                                    </div>
                                </form>
                            )}

                            {/* Google Complete Registration Form */}
                            {mode === "google-complete" && (
                                <form onSubmit={handleCompleteGoogleRegistration} className="space-y-5">
                                    <p className="text-sm text-[#999999] text-center mb-4">
                                        Complete your profile to finish registration
                                    </p>

                                    <div>
                                        <label className="block text-base font-medium text-white mb-3">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] transition-all text-base"
                                            placeholder="Enter your full name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-base font-medium text-white mb-3">
                                            Email (from Google)
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            disabled
                                            className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-[#999999] text-base cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-base font-medium text-white mb-3">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] transition-all text-base"
                                            placeholder="Choose a unique username"
                                            required
                                            minLength={3}
                                        />
                                        <p className="text-xs text-[#666666] mt-2">You can change this suggested username</p>
                                    </div>

                                    <div>
                                        <label className="block text-base font-medium text-white mb-3">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] transition-all text-base"
                                            placeholder="Enter your phone number"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-base font-medium text-white mb-3">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={registerPassword}
                                                onChange={(e) => setRegisterPassword(e.target.value)}
                                                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] transition-all text-base"
                                                placeholder="Create a password (min 6 characters)"
                                                required
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999999] hover:text-white"
                                            >
                                                {showPassword ? <EyeSlash size="22" /> : <Eye size="22" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 bg-gradient-to-br from-[#4FACFE] to-[#00F260] text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 mt-8"
                                    >
                                        {isLoading ? "Completing registration..." : "Complete Registration"}
                                    </button>
                                </form>
                            )}

                            {/* Guest Mode Option */}
                            {onGuestMode && mode !== "google-complete" && (
                                <div className="mt-8 pt-6 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={onGuestMode}
                                        className="w-full py-3 text-[#999999] hover:text-white font-medium transition-colors"
                                    >
                                        Continue as Guest
                                    </button>
                                    <p className="text-xs text-[#666666] text-center mt-2">
                                        Note: Guest mode won't save your work to dashboard
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
        </>
    );
}
