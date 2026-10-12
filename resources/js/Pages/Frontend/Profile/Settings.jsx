import React, { useRef, useState } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import ProfileLayout from './ProfileLayout';
import {
    RiUserLine,
    RiLockPasswordLine,
    RiNotification3Line,
    RiDeleteBinLine,
    RiCameraLine,
    RiCheckLine,
    RiAlertLine,
    RiSaveLine,
    RiCloseLine,
    RiEyeLine,
    RiEyeOffLine,
} from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from 'react-toastify';

export default function Settings({ profile, mustVerifyEmail, status }) {
    const { __ } = useLang();
    const user = profile?.user || {};
    const meta = user.meta || {};

    const [activeSection, setActiveSection] = useState('profile'); // 'profile' | 'password' | 'notifications' | 'danger'
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const avatarInputRef = useRef(null);

    // Profile Information Form
    const profileForm = useForm({
        name: user.name || '',
        email: user.email || '',
        phone: meta.phone || '',
        bio: meta.bio || '',
        address: meta.address || '',
        city: meta.city || '',
        state: meta.state || '',
        country: meta.country || '',
        postal_code: meta.postal_code || '',
        order_notifications: meta.order_notifications ?? true,
        newsletter: meta.newsletter ?? true,
    });

    // Password Update Form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Delete Account Form
    const deleteForm = useForm({
        password: '',
    });

    // Handle Profile Form Submit
    const handleProfileSubmit = (e) => {
        e.preventDefault();
        profileForm.post(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(__('Profile information updated successfully!'));
            },
            onError: () => {
                toast.error(__('Please correct the errors and try again.'));
            },
        });
    };

    // Handle Password Update Submit
    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        passwordForm.put(route('profile.password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
                toast.success(__('Password changed successfully!'));
            },
            onError: () => {
                toast.error(__('Failed to update password. Please check your current password.'));
            },
        });
    };

    // Handle Avatar File Upload
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error(__('Image size must be less than 5MB.'));
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        router.post(route('profile.avatar.update'), formData, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(__('Profile picture updated!'));
            },
            onError: () => {
                toast.error(__('Failed to upload profile picture.'));
            },
        });
    };

    // Handle Remove Avatar
    const handleRemoveAvatar = () => {
        if (window.confirm(__('Are you sure you want to remove your profile picture?'))) {
            router.delete(route('profile.avatar.remove'), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(__('Profile picture removed.'));
                },
            });
        }
    };

    // Handle Delete Account
    const handleDeleteAccount = (e) => {
        e.preventDefault();
        deleteForm.delete(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowDeleteModal(false);
            },
            onError: () => {
                toast.error(__('Incorrect password provided.'));
            },
        });
    };

    const avatarSrc = user.avatar || '/assets/image/profile-avatar.webp';

    return (
        <ProfileLayout title={__('Settings')} currentTab="settings" profile={profile}>
            <div className="space-y-6">
                {/* ── Top Header Bar ── */}
                <div className="bg-bg border border-border rounded p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-lg font-bold text-text">
                                {__('Account Settings & Security')}
                            </h1>
                            <p className="text-xs text-res mt-0.5">
                                {__('Manage personal contact information, delivery addresses, and login security credentials.')}
                            </p>
                        </div>
                    </div>

                    {/* Section Switcher Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none border-t border-border pt-3">
                        <button
                            type="button"
                            onClick={() => setActiveSection('profile')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${activeSection === 'profile'
                                    ? 'bg-common text-white shadow-xs font-semibold'
                                    : 'bg-bg text-res hover:text-text hover:bg-border'
                                }`}
                        >
                            <RiUserLine size={14} />
                            <span>{__('Profile & Address')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveSection('password')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${activeSection === 'password'
                                    ? 'bg-common text-white shadow-xs font-semibold'
                                    : 'bg-bg text-res hover:text-text hover:bg-border'
                                }`}
                        >
                            <RiLockPasswordLine size={14} />
                            <span>{__('Security & Password')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveSection('notifications')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${activeSection === 'notifications'
                                    ? 'bg-common text-white shadow-xs font-semibold'
                                    : 'bg-bg text-res hover:text-text hover:bg-border'
                                }`}
                        >
                            <RiNotification3Line size={14} />
                            <span>{__('Preferences')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveSection('danger')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${activeSection === 'danger'
                                    ? 'bg-rose-600 text-white shadow-xs font-semibold'
                                    : 'bg-bg text-rose-600 hover:bg-rose-50'
                                }`}
                        >
                            <RiDeleteBinLine size={14} />
                            <span>{__('Danger Zone')}</span>
                        </button>
                    </div>
                </div>

                {/* ── SECTION 1: Profile & Address ── */}
                {activeSection === 'profile' && (
                    <div className="bg-bg border border-border rounded p-6 shadow-xs space-y-6">
                        {/* Avatar Upload Banner */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-border">
                            <div className="relative group shrink-0">
                                <img
                                    src={avatarSrc}
                                    alt={user.name}
                                    className="size-20 rounded-full object-cover border-2 border-border p-0.5 shadow-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/40 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    title={__('Upload Photo')}
                                >
                                    <RiCameraLine size={20} />
                                    <span className="text-[10px] font-medium mt-0.5">{__('Change')}</span>
                                </button>
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </div>

                            <div className="text-center sm:text-left flex-1 min-w-0">
                                <h3 className="font-semibold text-text text-sm mb-1">
                                    {__('Profile Avatar')}
                                </h3>
                                <p className="text-xs text-res mb-3 leading-relaxed">
                                    {__('Upload a clear square photo. Recommended size: at least 250x250px (JPG, PNG, or WebP up to 5MB).')}
                                </p>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                    <button
                                        type="button"
                                        onClick={() => avatarInputRef.current?.click()}
                                        className="px-3 py-1.5 text-xs font-medium bg-common text-white rounded hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                                    >
                                        <RiCameraLine size={14} />
                                        {__('Upload Photo')}
                                    </button>
                                    {user.avatar && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveAvatar}
                                            className="px-3 py-1.5 text-xs font-medium bg-bg hover:bg-rose-50 text-rose-600 rounded border border-border transition-colors cursor-pointer inline-flex items-center gap-1"
                                        >
                                            <RiDeleteBinLine size={14} />
                                            {__('Remove Photo')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Profile & Address Form */}
                        <form onSubmit={handleProfileSubmit} className="space-y-5">
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-res mb-3">
                                    {__('Basic Contact Details')}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-semibold text-text mb-1">
                                            {__('Full Name')} <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.data.name}
                                            onChange={(e) => profileForm.setData('name', e.target.value)}
                                            required
                                            className="w-full px-3 py-2 text-xs bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                        />
                                        {profileForm.errors.name && (
                                            <p className="text-[11px] text-rose-500 mt-1">{profileForm.errors.name}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-xs font-semibold text-text mb-1">
                                            {__('Email Address')} <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={profileForm.data.email}
                                            onChange={(e) => profileForm.setData('email', e.target.value)}
                                            required
                                            className="w-full px-3 py-2 text-xs bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                        />
                                        {profileForm.errors.email && (
                                            <p className="text-[11px] text-rose-500 mt-1">{profileForm.errors.email}</p>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-xs font-semibold text-text mb-1">
                                            {__('Phone Number')}
                                        </label>
                                        <input
                                            type="tel"
                                            value={profileForm.data.phone}
                                            onChange={(e) => profileForm.setData('phone', e.target.value)}
                                            placeholder="+1 (555) 000-0000"
                                            className="w-full px-3 py-2 text-xs bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                        />
                                    </div>

                                    {/* Bio */}
                                    <div>
                                        <label className="block text-xs font-semibold text-text mb-1">
                                            {__('Bio / About')}
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.data.bio}
                                            onChange={(e) => profileForm.setData('bio', e.target.value)}
                                            placeholder={__('Brief note about yourself...')}
                                            className="w-full px-3 py-2 text-xs bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address Information */}
                            <div className="pt-4 border-t border-border">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-res mb-3">
                                    {__('Default Shipping & Delivery Address')}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Street Address */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-text mb-1">
                                            {__('Street Address')}
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.data.address}
                                            onChange={(e) => profileForm.setData('address', e.target.value)}
                                            placeholder="123 Main Street, Suite 4B"
                                            className="w-full px-3 py-2 text-xs bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                        />
                                    </div>

                                    {/* City */}
                                    <div>
                                        <label className="block text-xs font-semibold text-text mb-1">
                                            {__('City')}
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.data.city}
                                            onChange={(e) => profileForm.setData('city', e.target.value)}
                                            placeholder="New York"
                                            className="w-full px-3 py-2 text-xs bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                        />
                                    </div>

                                    {/* State / Province */}
                                    <div>
                                        <label className="block text-xs font-semibold text-text mb-1">
                                            {__('State / Province')}
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.data.state}
                                            onChange={(e) => profileForm.setData('state', e.target.value)}
                                            placeholder="NY"
                                            className="w-full px-3 py-2 text-xs bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                        />
                                    </div>

                                    {/* Country */}
                                    <div>
                                        <label className="block text-xs font-semibold text-text mb-1">
                                            {__('Country')}
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.data.country}
                                            onChange={(e) => profileForm.setData('country', e.target.value)}
                                            placeholder="United States"
                                            className="w-full px-3 py-2 text-xs bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                        />
                                    </div>

                                    {/* Postal / Zip Code */}
                                    <div>
                                        <label className="block text-xs font-semibold text-text mb-1">
                                            {__('Postal / ZIP Code')}
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.data.postal_code}
                                            onChange={(e) => profileForm.setData('postal_code', e.target.value)}
                                            placeholder="10001"
                                            className="w-full px-3 py-2 text-xs bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 border-t border-border flex justify-end">
                                <button
                                    type="submit"
                                    disabled={profileForm.processing}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-common hover:opacity-90 text-white rounded shadow-xs transition-opacity cursor-pointer disabled:opacity-50"
                                >
                                    <RiSaveLine size={15} />
                                    <span>{profileForm.processing ? __('Saving...') : __('Save Changes')}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── SECTION 2: Security & Password ── */}
                {activeSection === 'password' && (
                    <div className="bg-bg border border-border rounded p-6 shadow-xs space-y-6">
                        <div>
                            <h2 className="text-sm font-bold text-text mb-1">
                                {__('Change Account Password')}
                            </h2>
                            <p className="text-xs text-res">
                                {__('Ensure your account is protected with a strong, secure password containing at least 8 characters.')}
                            </p>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
                            {/* Current Password */}
                            <div>
                                <label className="block text-xs font-semibold text-text mb-1">
                                    {__('Current Password')} <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={passwordForm.data.current_password}
                                        onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 pr-10 text-xs bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-res hover:text-text cursor-pointer"
                                    >
                                        {showCurrentPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                                    </button>
                                </div>
                                {passwordForm.errors.current_password && (
                                    <p className="text-[11px] text-rose-500 mt-1">{passwordForm.errors.current_password}</p>
                                )}
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="block text-xs font-semibold text-text mb-1">
                                    {__('New Password')} <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={passwordForm.data.password}
                                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 pr-10 text-xs bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-res hover:text-text cursor-pointer"
                                    >
                                        {showNewPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                                    </button>
                                </div>
                                {passwordForm.errors.password && (
                                    <p className="text-[11px] text-rose-500 mt-1">{passwordForm.errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-xs font-semibold text-text mb-1">
                                    {__('Confirm New Password')} <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                    required
                                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                />
                                {passwordForm.errors.password_confirmation && (
                                    <p className="text-[11px] text-rose-500 mt-1">{passwordForm.errors.password_confirmation}</p>
                                )}
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-common hover:opacity-90 text-white rounded shadow-xs transition-opacity cursor-pointer disabled:opacity-50"
                                >
                                    <RiLockPasswordLine size={15} />
                                    <span>{passwordForm.processing ? __('Updating...') : __('Update Password')}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── SECTION 3: Notification Preferences ── */}
                {activeSection === 'notifications' && (
                    <div className="bg-bg border border-border rounded p-6 shadow-xs space-y-6">
                        <div>
                            <h2 className="text-sm font-bold text-text mb-1">
                                {__('Communication Preferences')}
                            </h2>
                            <p className="text-xs text-res">
                                {__('Choose which notifications and updates you would like to receive from NestifyTech.')}
                            </p>
                        </div>

                        <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
                            {/* Order Notifications Toggle */}
                            <label className="flex items-start gap-3 p-3.5 bg-bg rounded border border-border cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={profileForm.data.order_notifications}
                                    onChange={(e) => profileForm.setData('order_notifications', e.target.checked)}
                                    className="mt-0.5 rounded text-primary focus:ring-primary size-4"
                                />
                                <div>
                                    <span className="text-xs font-semibold text-text block">
                                        {__('Order Status Updates & Tracking Emails')}
                                    </span>
                                    <span className="text-[11px] text-res leading-relaxed block mt-0.5">
                                        {__('Receive automated tracking details, dispatch confirmations, and delivery notifications.')}
                                    </span>
                                </div>
                            </label>

                            {/* Newsletter Toggle */}
                            <label className="flex items-start gap-3 p-3.5 bg-bg rounded border border-border cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={profileForm.data.newsletter}
                                    onChange={(e) => profileForm.setData('newsletter', e.target.checked)}
                                    className="mt-0.5 rounded text-primary focus:ring-primary size-4"
                                />
                                <div>
                                    <span className="text-xs font-semibold text-text block">
                                        {__('Promotional Newsletter & Exclusive Offers')}
                                    </span>
                                    <span className="text-[11px] text-res leading-relaxed block mt-0.5">
                                        {__('Get weekly discount codes, early access to new arrivals, and seasonal tech promotions.')}
                                    </span>
                                </div>
                            </label>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={profileForm.processing}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-common hover:opacity-90 text-white rounded shadow-xs transition-opacity cursor-pointer disabled:opacity-50"
                                >
                                    <RiSaveLine size={15} />
                                    <span>{profileForm.processing ? __('Saving...') : __('Save Preferences')}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── SECTION 4: Danger Zone ── */}
                {activeSection === 'danger' && (
                    <div className="bg-bg border border-rose-200 dark:border-rose-900/50 rounded p-6 shadow-xs space-y-4">
                        <div className="flex items-start gap-3 text-rose-600">
                            <RiAlertLine size={24} className="shrink-0" />
                            <div>
                                <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400">
                                    {__('Delete Account Permanently')}
                                </h3>
                                <p className="text-xs text-res mt-1 leading-relaxed">
                                    {__('Once your account is deleted, all of your profile information, order history, and activity records will be permanently erased. Please proceed with caution.')}
                                </p>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-rose-100 dark:border-rose-900/40">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                            >
                                <RiDeleteBinLine size={14} />
                                {__('Delete My Account')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Delete Account Confirmation Modal ── */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-bg border border-border rounded max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                            <h3 className="font-bold text-text text-base flex items-center gap-2 text-rose-600">
                                <RiAlertLine size={18} />
                                {__('Confirm Account Deletion')}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="p-1.5 rounded hover:bg-bg text-res hover:text-text cursor-pointer"
                            >
                                <RiCloseLine size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleDeleteAccount} className="space-y-4">
                            <p className="text-xs text-res leading-relaxed">
                                {__('Please enter your password to confirm that you wish to permanently delete your account.')}
                            </p>

                            <div>
                                <label className="block text-xs font-semibold text-text mb-1">
                                    {__('Current Password')}
                                </label>
                                <input
                                    type="password"
                                    value={deleteForm.data.password}
                                    onChange={(e) => deleteForm.setData('password', e.target.value)}
                                    required
                                    placeholder={__('Enter your password')}
                                    className="w-full px-3 py-2 text-xs bg-bg border border-border rounded text-text focus:outline-hidden focus:border-rose-500 transition-colors"
                                />
                                {deleteForm.errors.password && (
                                    <p className="text-[11px] text-rose-500 mt-1">{deleteForm.errors.password}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 text-xs font-medium bg-bg hover:bg-border text-text rounded border border-border transition-colors cursor-pointer"
                                >
                                    {__('Cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={deleteForm.processing}
                                    className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {deleteForm.processing ? __('Deleting...') : __('Permanently Delete')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ProfileLayout>
    );
}
