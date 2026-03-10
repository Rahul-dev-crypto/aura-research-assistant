"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { User, Call, Sms, Lock, Camera, Edit2, TickCircle } from "iconsax-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form states
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [profileImage, setProfileImage] = useState("");

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const guestMode = localStorage.getItem('guestMode');
        
        if (!userData && !guestMode) {
            router.push('/');
            return;
        }
        
        if (guestMode === 'true') {
            // Guest user
            setUser({
                name: 'Guest',
                username: 'guest',
                email: 'guest@example.com',
                phone: 'N/A',
                role: 'guest',
                profileImage: ''
            });
            setName('Guest');
            setEmail('guest@example.com');
            setPhone('N/A');
        } else if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setName(parsedUser.name);
            setEmail(parsedUser.email);
            setPhone(parsedUser.phone);
            setProfileImage(parsedUser.profileImage || '');
        }
    }, [router]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Prevent guest users from uploading images
        if (user?.role === 'guest') {
            setError("Guest users cannot upload profile images. Please create an account.");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError('Image size must be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setProfileImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Prevent guest users from updating profile
        if (user?.role === 'guest') {
            setError("Guest users cannot update profile. Please create an account to save your information.");
            return;
        }

        if (newPassword && newPassword !== confirmPassword) {
            setError("New passwords don't match");
            return;
        }

        if (newPassword && !currentPassword) {
            setError("Please enter current password to change password");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    name,
                    email,
                    phone,
                    currentPassword: currentPassword || undefined,
                    newPassword: newPassword || undefined,
                    profileImage,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess("Profile updated successfully!");
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                setError(data.error || "Failed to update profile");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen selection:bg-cyan-500/30">
            <Navbar />
            <main className="pt-32 pb-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-4xl font-bold text-white mb-4">
                            My <span className="text-gradient-hero">Profile</span>
                            {user?.role === 'guest' && (
                                <span className="ml-4 px-4 py-2 text-sm bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-full text-orange-400">
                                    Guest Mode
                                </span>
                            )}
                        </h1>
                        <p className="text-[#999999]">
                            {user?.role === 'guest' 
                                ? 'Guest users cannot save profile changes. Create an account to save your information.' 
                                : 'Manage your account settings and preferences'}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card rounded-3xl p-8"
                    >
                        {/* Profile Image Section */}
                        <div className="flex flex-col items-center mb-8 pb-8 border-b border-white/10">
                            <div className="relative group">
                                {profileImage ? (
                                    <img
                                        src={profileImage}
                                        alt={name}
                                        className="w-32 h-32 rounded-full object-cover border-4 border-white/10"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#4FACFE] to-[#00F260] flex items-center justify-center text-white text-5xl font-bold border-4 border-white/10">
                                        {name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <label className="absolute bottom-0 right-0 p-3 bg-gradient-to-br from-[#4FACFE] to-[#00F260] rounded-full cursor-pointer hover:scale-110 transition-transform">
                                    <Camera size="20" className="text-white" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <h2 className="text-2xl font-bold text-white mt-4">{name}</h2>
                            <p className="text-[#999999]">@{user.username}</p>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-400 flex items-center gap-2">
                                <TickCircle size="20" variant="Bold" />
                                {success}
                            </div>
                        )}

                        {/* Update Form */}
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            {/* Personal Information */}
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <User size="24" className="text-[#4FACFE]" />
                                    Personal Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                                            <Sms size="16" />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                                            <Call size="16" />
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Change Password */}
                            <div className="pt-6 border-t border-white/10">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Lock size="24" className="text-[#4FACFE]" />
                                    Change Password
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] transition-all"
                                            placeholder="Enter current password"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] transition-all"
                                            placeholder="Enter new password (min 6 characters)"
                                            minLength={6}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#666666] focus:outline-none focus:border-[#4FACFE] transition-all"
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-4 pt-6">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 py-3 bg-gradient-to-br from-[#4FACFE] to-[#00F260] text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        "Updating..."
                                    ) : (
                                        <>
                                            <Edit2 size="20" />
                                            Update Profile
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push('/')}
                                    className="px-6 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
