"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { User, Lock, SearchNormal1, TickCircle, CloseCircle, Edit2, Activity, Eye, Trash, UserRemove, UserTick } from "iconsax-react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentAdmin, setCurrentAdmin] = useState<any>(null);

    // Modal states
    const [showResetModal, setShowResetModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [newPassword, setNewPassword] = useState("");
    const [userActivity, setUserActivity] = useState<any>(null);
    const [loadingActivity, setLoadingActivity] = useState(false);
    const [viewedPassword, setViewedPassword] = useState("");

    // Suspension form states
    const [suspensionDays, setSuspensionDays] = useState("7");
    const [suspensionReason, setSuspensionReason] = useState("");

    // Edit form states
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editUsername, setEditUsername] = useState("");
    const [editRole, setEditRole] = useState("");

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/');
            return;
        }

        const user = JSON.parse(userData);
        if (user.role !== 'admin') {
            router.push('/');
            return;
        }

        // Fetch fresh admin data to get isSuperAdmin status
        fetchCurrentAdmin(user);
        fetchUsers();
    }, [router]);

    const fetchCurrentAdmin = async (user: any) => {
        try {
            const userId = user.id || user._id;
            const response = await fetch(`/api/auth/profile?userId=${userId}`);
            const data = await response.json();
            
            if (response.ok && data.user) {
                // Update localStorage with fresh data
                localStorage.setItem('user', JSON.stringify(data.user));
                setCurrentAdmin(data.user);
            } else {
                // Fallback to localStorage data
                setCurrentAdmin(user);
            }
        } catch (err) {
            console.error('Failed to fetch admin profile:', err);
            // Fallback to localStorage data
            setCurrentAdmin(user);
        }
    };

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/users');
            const data = await response.json();

            if (response.ok) {
                setUsers(data.users);
            } else {
                setError(data.error || 'Failed to fetch users');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (userId: string, newStatus: string) => {
        try {
            // Validate suspension details if suspending
            if (newStatus === 'suspended') {
                if (!suspensionDays || parseInt(suspensionDays) < 1) {
                    setError('Please enter a valid suspension duration');
                    return;
                }
                if (!suspensionReason.trim()) {
                    setError('Please provide a reason for suspension');
                    return;
                }
            }

            const response = await fetch('/api/admin/toggle-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId, 
                    status: newStatus,
                    suspensionDays: newStatus === 'suspended' ? suspensionDays : undefined,
                    suspensionReason: (newStatus === 'suspended' || newStatus === 'banned') ? suspensionReason : undefined
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`User status changed to ${newStatus} successfully`);
                fetchUsers();
                setShowStatusModal(false);
                setSelectedUser(null);
                setSuspensionDays("7");
                setSuspensionReason("");
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.error || 'Failed to change status');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to change status');
        }
    };

    const handleViewPassword = async (user: any) => {
        const adminId = currentAdmin?.id || currentAdmin?._id;
        
        if (!adminId) {
            setError('Admin authentication required');
            return;
        }

        try {
            setSelectedUser(user);
            setShowPasswordModal(true);
            setViewedPassword('Loading...');

            const response = await fetch('/api/admin/view-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user._id || user.id,
                    adminId: adminId
                })
            });

            const data = await response.json();

            if (response.ok) {
                setViewedPassword(data.password || 'No password available');
            } else {
                setViewedPassword('');
                setError(data.error || 'Failed to retrieve password');
                setShowPasswordModal(false);
            }
        } catch (err: any) {
            setViewedPassword('');
            setError(err.message || 'Failed to retrieve password');
            setShowPasswordModal(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            const userId = selectedUser._id || selectedUser.id;
            
            const response = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('User deleted successfully');
                setShowDeleteModal(false);
                setSelectedUser(null);
                fetchUsers();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.error || 'Failed to delete user');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to delete user');
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            const userId = selectedUser._id || selectedUser.id;
            
            const response = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Password reset successfully');
                setShowResetModal(false);
                setNewPassword('');
                setSelectedUser(null);
                fetchUsers();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.error || 'Failed to reset password');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        }
    };

    const handleUpdateUser = async () => {
        try {
            const userId = selectedUser._id || selectedUser.id;
            const adminId = currentAdmin?.id || currentAdmin?._id;
            
            const response = await fetch('/api/admin/update-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    adminId: adminId,
                    name: editName,
                    email: editEmail,
                    phone: editPhone,
                    username: editUsername,
                    role: editRole
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('User updated successfully');
                setShowEditModal(false);
                setSelectedUser(null);
                fetchUsers();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.error || 'Failed to update user');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update user');
        }
    };

    const handleViewActivity = async (user: any) => {
        try {
            setSelectedUser(user);
            setShowActivityModal(true);
            setLoadingActivity(true);

            const userId = user._id || user.id;
            const response = await fetch(`/api/admin/user-activity?userId=${userId}`);
            const data = await response.json();

            if (response.ok) {
                setUserActivity(data);
            } else {
                setError(data.error || 'Failed to fetch activity');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch activity');
        } finally {
            setLoadingActivity(false);
        }
    };

    const openEditModal = (user: any) => {
        setSelectedUser(user);
        setEditName(user.name || '');
        setEditEmail(user.email || '');
        setEditPhone(user.phone || '');
        setEditUsername(user.username || '');
        setEditRole(user.role || 'user');
        setShowEditModal(true);
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <Navbar />

            <div className="container mx-auto px-4 py-8 pt-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
                    <p className="text-gray-400">Manage users and system settings</p>
                    {currentAdmin && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-gray-400">Logged in as:</span>
                            <span className="text-white font-semibold">{currentAdmin.name}</span>
                            {currentAdmin.role === 'admin' && (
                                <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-bold text-white">
                                    ADMIN
                                </span>
                            )}
                        </div>
                    )}
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200"
                    >
                        {error}
                        <button onClick={() => setError('')} className="float-right">×</button>
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-200"
                    >
                        {success}
                        <button onClick={() => setSuccess('')} className="float-right">×</button>
                    </motion.div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Users</p>
                                <p className="text-white text-3xl font-bold">{users.length}</p>
                            </div>
                            <User size={40} className="text-purple-400" />
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Active Users</p>
                                <p className="text-white text-3xl font-bold">{users.filter(u => u.status === 'active').length}</p>
                            </div>
                            <TickCircle size={40} className="text-green-400" />
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Suspended</p>
                                <p className="text-white text-3xl font-bold">{users.filter(u => u.status === 'suspended').length}</p>
                            </div>
                            <UserRemove size={40} className="text-orange-400" />
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Banned</p>
                                <p className="text-white text-3xl font-bold">{users.filter(u => u.status === 'banned').length}</p>
                            </div>
                            <CloseCircle size={40} className="text-red-400" />
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <SearchNormal1 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-400">Loading users...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1400px]">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 w-[250px]">User</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 w-[220px]">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 w-[100px]">Role</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 w-[120px]">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 w-[500px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                        <User size={20} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium">{user.name}</div>
                                                        <div className="text-gray-400 text-sm">@{user.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-300">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    user.role === 'admin' 
                                                        ? 'bg-purple-500/20 text-purple-300' 
                                                        : 'bg-blue-500/20 text-blue-300'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    user.status === 'active' 
                                                        ? 'bg-green-500/20 text-green-300' 
                                                        : 'bg-red-500/20 text-red-300'
                                                }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2 flex-wrap">
                                                    {user.role !== 'admin' && (
                                                        <button
                                                            onClick={() => handleViewPassword(user)}
                                                            className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors border border-blue-500/50 text-blue-300 text-sm font-medium flex items-center gap-2"
                                                            title="View Password"
                                                        >
                                                            <Eye size={16} variant="Bold" />
                                                            View
                                                        </button>
                                                    )}
                                                    {user.role !== 'admin' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setShowResetModal(true);
                                                            }}
                                                            className="px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-colors border border-yellow-500/50 text-yellow-300 text-sm font-medium flex items-center gap-2"
                                                            title="Reset Password"
                                                        >
                                                            <Lock size={16} variant="Bold" />
                                                            Reset
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors border border-green-500/50 text-green-300 text-sm font-medium flex items-center gap-2"
                                                        title="Edit User"
                                                    >
                                                        <Edit2 size={16} variant="Bold" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewActivity(user)}
                                                        className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors border border-purple-500/50 text-purple-300 text-sm font-medium flex items-center gap-2"
                                                        title="View Activity"
                                                    >
                                                        <Activity size={16} variant="Bold" />
                                                        Activity
                                                    </button>
                                                    {user.role !== 'admin' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setShowStatusModal(true);
                                                            }}
                                                            className="px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-colors border border-orange-500/50 text-orange-300 text-sm font-medium flex items-center gap-2"
                                                            title="Change Status"
                                                        >
                                                            {user.status === 'active' ? (
                                                                <>
                                                                    <UserRemove size={16} variant="Bold" />
                                                                    Suspend
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UserTick size={16} variant="Bold" />
                                                                    Activate
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                    {user.role !== 'admin' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setShowDeleteModal(true);
                                                            }}
                                                            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors border border-red-500/50 text-red-300 text-sm font-medium flex items-center gap-2"
                                                            title="Delete User"
                                                        >
                                                            <Trash size={16} variant="Bold" />
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Reset Password Modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-white/20"
                    >
                        <h3 className="text-xl font-bold text-white mb-4">Reset Password</h3>
                        <p className="text-gray-400 mb-2">Reset password for <span className="text-white font-semibold">{selectedUser?.name}</span></p>
                        {selectedUser?.googleId && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                                <p className="text-yellow-300 text-sm">⚠️ This user signed up with Google OAuth. Setting a password will allow them to login with email/password as well.</p>
                            </div>
                        )}
                        <input
                            type="text"
                            placeholder="New password (min 6 characters)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={handleResetPassword}
                                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                            >
                                {selectedUser?.googleId ? 'Set Password' : 'Reset Password'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowResetModal(false);
                                    setNewPassword('');
                                }}
                                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* View Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-white/20"
                    >
                        <h3 className="text-xl font-bold text-white mb-4">View Password</h3>
                        <div className="mb-4">
                            <p className="text-gray-400 mb-2">User: <span className="text-white font-semibold">{selectedUser?.name}</span></p>
                            <p className="text-gray-400 mb-4">Email: <span className="text-white font-semibold">{selectedUser?.email}</span></p>
                            
                            <div className="bg-white/5 rounded-lg p-4 mb-4">
                                <p className="text-gray-400 text-sm mb-2">Password:</p>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={viewedPassword}
                                        readOnly
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-mono text-lg pr-12 select-all"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(viewedPassword);
                                            setSuccess('Password copied to clipboard');
                                            setTimeout(() => setSuccess(''), 2000);
                                        }}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                        title="Copy to clipboard"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            {viewedPassword === 'Loading...' && (
                                <div className="text-center text-gray-400 py-2">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                                </div>
                            )}
                            
                            {viewedPassword && viewedPassword !== 'Loading...' && !viewedPassword.includes('not available') && (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                    <p className="text-green-300 text-sm">✓ Password retrieved successfully</p>
                                </div>
                            )}
                            
                            {viewedPassword.includes('not available') && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                                    <p className="text-yellow-300 text-sm">⚠️ This user signed up with Google OAuth</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(viewedPassword);
                                    setSuccess('Password copied to clipboard');
                                    setTimeout(() => setSuccess(''), 2000);
                                }}
                                disabled={viewedPassword === 'Loading...' || viewedPassword.includes('not available')}
                                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Copy Password
                            </button>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setViewedPassword('');
                                }}
                                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Delete User Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-red-500/50"
                    >
                        <h3 className="text-xl font-bold text-red-400 mb-4">Delete User</h3>
                        <p className="text-gray-300 mb-2">Are you sure you want to delete this user?</p>
                        <p className="text-gray-400 mb-4">
                            <strong>{selectedUser?.name}</strong> ({selectedUser?.email})
                        </p>
                        <p className="text-red-300 text-sm mb-4">
                            ⚠️ This will permanently delete the user and all their research data. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteUser}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                Delete User
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Change Status Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-white/20 max-h-[90vh] overflow-y-auto"
                    >
                        <h3 className="text-xl font-bold text-white mb-4">Change User Status</h3>
                        <p className="text-gray-400 mb-4">
                            Change status for <strong>{selectedUser?.name}</strong>
                        </p>
                        <p className="text-gray-400 mb-4">Current status: <span className={`font-semibold ${
                            selectedUser?.status === 'active' ? 'text-green-400' :
                            selectedUser?.status === 'suspended' ? 'text-orange-400' : 'text-red-400'
                        }`}>{selectedUser?.status}</span></p>
                        
                        <div className="space-y-3 mb-4">
                            <button
                                onClick={() => handleToggleStatus(selectedUser._id || selectedUser.id, 'active')}
                                disabled={selectedUser?.status === 'active'}
                                className={`w-full px-4 py-3 rounded-lg transition-colors text-left flex items-center gap-3 ${
                                    selectedUser?.status === 'active' 
                                        ? 'bg-green-500/20 border-2 border-green-500 cursor-not-allowed' 
                                        : 'bg-white/10 hover:bg-green-500/20 border-2 border-transparent hover:border-green-500'
                                }`}
                            >
                                <TickCircle size={24} className="text-green-400" />
                                <div>
                                    <div className="text-white font-semibold">Active</div>
                                    <div className="text-gray-400 text-sm">User can access all features</div>
                                </div>
                            </button>
                            
                            {/* Suspension Option with Form */}
                            <div className={`rounded-lg border-2 ${
                                selectedUser?.status === 'suspended' 
                                    ? 'bg-orange-500/20 border-orange-500' 
                                    : 'bg-white/10 border-transparent'
                            }`}>
                                <div className="px-4 py-3">
                                    <div className="flex items-center gap-3 mb-3">
                                        <UserRemove size={24} className="text-orange-400" />
                                        <div>
                                            <div className="text-white font-semibold">Suspended</div>
                                            <div className="text-gray-400 text-sm">Temporarily block access</div>
                                        </div>
                                    </div>
                                    
                                    {selectedUser?.status !== 'suspended' && (
                                        <div className="space-y-3 mt-3 pl-9">
                                            <div>
                                                <label className="text-gray-300 text-sm block mb-1">Suspension Duration (days)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={suspensionDays}
                                                    onChange={(e) => setSuspensionDays(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                                    placeholder="7"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-gray-300 text-sm block mb-1">Reason for Suspension</label>
                                                <textarea
                                                    value={suspensionReason}
                                                    onChange={(e) => setSuspensionReason(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white resize-none"
                                                    rows={2}
                                                    placeholder="e.g., Violation of terms of service"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleToggleStatus(selectedUser._id || selectedUser.id, 'suspended')}
                                                className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                                            >
                                                Suspend User
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Ban Option with Reason */}
                            <div className={`rounded-lg border-2 ${
                                selectedUser?.status === 'banned' 
                                    ? 'bg-red-500/20 border-red-500' 
                                    : 'bg-white/10 border-transparent'
                            }`}>
                                <div className="px-4 py-3">
                                    <div className="flex items-center gap-3 mb-3">
                                        <CloseCircle size={24} className="text-red-400" />
                                        <div>
                                            <div className="text-white font-semibold">Banned</div>
                                            <div className="text-gray-400 text-sm">Permanently block access</div>
                                        </div>
                                    </div>
                                    
                                    {selectedUser?.status !== 'banned' && (
                                        <div className="space-y-3 mt-3 pl-9">
                                            <div>
                                                <label className="text-gray-300 text-sm block mb-1">Reason for Ban</label>
                                                <textarea
                                                    value={suspensionReason}
                                                    onChange={(e) => setSuspensionReason(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white resize-none"
                                                    rows={2}
                                                    placeholder="e.g., Severe violation of community guidelines"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleToggleStatus(selectedUser._id || selectedUser.id, 'banned')}
                                                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                            >
                                                Ban User Permanently
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => {
                                setShowStatusModal(false);
                                setSuspensionDays("7");
                                setSuspensionReason("");
                            }}
                            className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </motion.div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-white/20"
                    >
                        <h3 className="text-xl font-bold text-white mb-4">Edit User</h3>
                        <div className="space-y-4 mb-4">
                            <div>
                                <label className="text-gray-300 text-sm block mb-1">Name</label>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <label className="text-gray-300 text-sm block mb-1">Email</label>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <label className="text-gray-300 text-sm block mb-1">Phone</label>
                                <input
                                    type="text"
                                    placeholder="Phone"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <label className="text-gray-300 text-sm block mb-1">Username</label>
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <label className="text-gray-300 text-sm block mb-1 font-semibold">User Role / Type</label>
                                <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-medium"
                                >
                                    <option value="user" className="bg-slate-800">Regular User</option>
                                    <option value="admin" className="bg-slate-800">Administrator</option>
                                </select>
                                <p className="text-gray-400 text-xs mt-1">⚠️ Administrators have full access to manage users</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleUpdateUser}
                                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                            >
                                Update User
                            </button>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Activity Modal */}
            {showActivityModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 rounded-xl p-6 max-w-4xl w-full border border-white/20 max-h-[80vh] overflow-y-auto"
                    >
                        <h3 className="text-2xl font-bold text-white mb-4">User Details & Activity</h3>
                        
                        {loadingActivity ? (
                            <div className="text-center text-gray-400 py-8">Loading activity...</div>
                        ) : userActivity ? (
                            <div className="space-y-6">
                                {/* User Info */}
                                <div className="bg-white/5 rounded-lg p-6">
                                    <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                                        <User size={24} className="text-purple-400" />
                                        Account Information
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-gray-400 text-sm">Name</p>
                                            <p className="text-white font-medium">{userActivity.user?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Username</p>
                                            <p className="text-white font-medium">@{userActivity.user?.username}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Email</p>
                                            <p className="text-white font-medium">{userActivity.user?.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Phone</p>
                                            <p className="text-white font-medium">{userActivity.user?.phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Role</p>
                                            <p className="text-white font-medium capitalize">{userActivity.user?.role}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Status</p>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                userActivity.user?.status === 'active' ? 'bg-green-500/20 text-green-300' :
                                                userActivity.user?.status === 'suspended' ? 'bg-orange-500/20 text-orange-300' :
                                                'bg-red-500/20 text-red-300'
                                            }`}>
                                                {userActivity.user?.status}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Account Type</p>
                                            <p className="text-white font-medium">{userActivity.user?.isGoogleUser ? 'Google OAuth' : 'Email/Password'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Member Since</p>
                                            <p className="text-white font-medium">{new Date(userActivity.user?.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Login Stats */}
                                <div className="bg-white/5 rounded-lg p-6">
                                    <h4 className="text-white font-semibold text-lg mb-4">Login Statistics</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-gray-400 text-sm">Total Logins</p>
                                            <p className="text-white font-medium text-2xl">{userActivity.user?.loginCount || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Last Login</p>
                                            <p className="text-white font-medium">{userActivity.user?.lastLogin ? new Date(userActivity.user.lastLogin).toLocaleString() : 'Never'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Activity Stats */}
                                <div className="bg-white/5 rounded-lg p-6">
                                    <h4 className="text-white font-semibold text-lg mb-4">Research Activity</h4>
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div className="bg-purple-500/10 rounded-lg p-4 text-center">
                                            <p className="text-gray-400 text-sm">Research Items</p>
                                            <p className="text-white font-bold text-3xl">{userActivity.totalDocuments || 0}</p>
                                        </div>
                                        <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                                            <p className="text-gray-400 text-sm">Citations</p>
                                            <p className="text-white font-bold text-3xl">{userActivity.totalCitations || 0}</p>
                                        </div>
                                        <div className="bg-green-500/10 rounded-lg p-4 text-center">
                                            <p className="text-gray-400 text-sm">Last Active</p>
                                            <p className="text-white font-medium text-sm">{userActivity.lastActive ? new Date(userActivity.lastActive).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Document Types */}
                                    {Object.keys(userActivity.byType || {}).length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-gray-400 text-sm mb-2">By Document Type:</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {Object.entries(userActivity.byType).map(([type, count]: [string, any]) => (
                                                    <div key={type} className="bg-white/5 rounded px-3 py-2 flex justify-between">
                                                        <span className="text-gray-300 capitalize">{type}</span>
                                                        <span className="text-white font-semibold">{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Recent Activity */}
                                {userActivity.recentActivity && userActivity.recentActivity.length > 0 && (
                                    <div className="bg-white/5 rounded-lg p-6">
                                        <h4 className="text-white font-semibold text-lg mb-4">Recent Research Items</h4>
                                        <div className="space-y-2">
                                            {userActivity.recentActivity.map((item: any) => (
                                                <div key={item.id} className="bg-white/5 rounded-lg p-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-white font-medium">{item.title}</p>
                                                            <p className="text-gray-400 text-sm capitalize">{item.type}</p>
                                                        </div>
                                                        <p className="text-gray-400 text-xs">{new Date(item.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recent Citations */}
                                {userActivity.recentCitations && userActivity.recentCitations.length > 0 && (
                                    <div className="bg-white/5 rounded-lg p-6">
                                        <h4 className="text-white font-semibold text-lg mb-4">Recent Citations</h4>
                                        <div className="space-y-2">
                                            {userActivity.recentCitations.map((citation: any) => (
                                                <div key={citation.id} className="bg-white/5 rounded-lg p-3">
                                                    <p className="text-white font-medium">{citation.title}</p>
                                                    <p className="text-gray-400 text-sm">{citation.authors} ({citation.year})</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 py-8">No activity data available</div>
                        )}
                        
                        <button
                            onClick={() => setShowActivityModal(false)}
                            className="w-full mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
