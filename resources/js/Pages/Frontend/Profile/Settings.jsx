import React, { useEffect, useRef, useState } from 'react';
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
    RiWhatsappLine,
    RiShieldCheckLine,
    RiMailLine,
    RiSendPlaneLine,
    RiRefreshLine,
    RiSparklingLine,
    RiCalendarLine,
    RiIdCardLine,
    RiScanLine,
} from 'react-icons/ri';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from 'react-toastify';
import PhoneInput from '@/Components/Admin/PhoneInput';
import DropdownSelect from '@/Components/DropdownSelect';
import CnicScanner from '@/Components/CnicScanner';
import axios from 'axios';

export default function Settings({ profile, mustVerifyEmail, status }) {
    const { __ } = useLang();
    const user = profile?.user || {};
    const meta = user.meta || {};

    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    const [activeSection, setActiveSection] = useState('profile'); // 'profile' | 'password' | 'notifications' | 'danger'
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Phone OTP Verification State
    const [phoneVerified, setPhoneVerified] = useState(!!meta.phone_verified);
    const [changingNumber, setChangingNumber] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [whatsappLink, setWhatsappLink] = useState('');

    const avatarInputRef = useRef(null);

    // Profile Information Form
    const profileForm = useForm({
        name: user.name || '',
        email: user.email || '',
        date_of_birth: meta.date_of_birth || '',
        cnic: meta.cnic || '',
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

    // Delete Account Form with OTP support
    const deleteForm = useForm({
        password: '',
        otp: '',
    });

    // Email OTP states for Delete Account
    const [deleteOtpSent, setDeleteOtpSent] = useState(false);
    const [deleteOtpLoading, setDeleteOtpLoading] = useState(false);

    // Email OTP states for Email Change
    const [emailOtpSent, setEmailOtpSent] = useState(false);
    const [emailOtpCode, setEmailOtpCode] = useState('');
    const [emailOtpVerified, setEmailOtpVerified] = useState(false);
    const [emailOtpLoading, setEmailOtpLoading] = useState(false);

    // CNIC Scanner Modal state
    const [showCnicScanner, setShowCnicScanner] = useState(false);

    // Fetch States on load (stores taxonomy ID)
    useEffect(() => {
        let isMounted = true;
        setLoadingStates(true);
        axios.get('/api/taxonomy-options/state', {
            params: { use_value: false, as_options: true }
        }).then(res => {
            if (isMounted) {
                setStates(Array.isArray(res.data) ? res.data : []);
            }
        }).catch(err => {
            console.error('Failed to load states', err);
        }).finally(() => {
            if (isMounted) setLoadingStates(false);
        });

        return () => { isMounted = false; };
    }, []);

    // Fetch Cities whenever State ID changes
    useEffect(() => {
        let isMounted = true;
        const currentStateId = profileForm.data.state;

        if (!currentStateId) {
            setCities([]);
            return;
        }

        setLoadingCities(true);
        axios.get('/api/taxonomy-options/city', {
            params: {
                use_value: false,
                as_options: true,
                parent_id: currentStateId
            }
        })
            .then(res => {
                if (isMounted) {
                    setCities(Array.isArray(res.data) ? res.data : []);
                }
            })
            .catch(err => {
                console.error('Failed to load cities', err);
            })
            .finally(() => {
                if (isMounted) setLoadingCities(false);
            });

        return () => { isMounted = false; };
    }, [profileForm.data.state]);

    // Auto-detect Country by IP / Geolocation if not already saved, and persist to user_meta
    useEffect(() => {
        if (profileForm.data.country) return;

        let isMounted = true;

        const saveLocationToMeta = async (locationData) => {
            if (!locationData) return;
            try {
                await axios.post('/api/user/save-country', locationData);
            } catch (err) {
                console.error('Failed to auto-save detected country/ip to user_meta', err);
            }
        };

        const detectCountry = async () => {
            try {
                // Call server endpoint (no CORS restrictions and has fallback)
                const res = await axios.get('/api/detect-country');
                if (isMounted && res.data?.country) {
                    profileForm.setData('country', res.data.country);
                    saveLocationToMeta(res.data);
                    return;
                }
            } catch (err) {
                // Browser geolocation fallback
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(async (pos) => {
                        try {
                            const geoRes = await axios.get('/api/geocode', {
                                params: { q: `${pos.coords.latitude},${pos.coords.longitude}`, limit: 1 }
                            });
                            const feat = geoRes.data?.features?.[0]?.properties;
                            if (isMounted && feat) {
                                if (feat.country) {
                                    profileForm.setData('country', feat.country);
                                }
                                saveLocationToMeta({
                                    country: feat.country || '',
                                    region: feat.state || '',
                                    city: feat.city || '',
                                    postal: feat.postcode || '',
                                    latitude: pos.coords.latitude,
                                    longitude: pos.coords.longitude,
                                });
                            }
                        } catch (_) { }
                    }, () => { });
                }
            }
        };

        detectCountry();

        return () => { isMounted = false; };
    }, []);

    // Send OTP for phone verification
    const handleSendPhoneOtp = async () => {
        const phone = profileForm.data.phone;
        if (!phone || phone.trim().length < 8) {
            toast.error(__('Please enter a valid phone number first.'));
            return;
        }

        setOtpLoading(true);
        try {
            const res = await axios.post('/api/user/phone/send-otp', {
                phone: phone,
                channel: 'whatsapp',
            });

            if (res.data?.success) {
                setOtpSent(true);
                toast.success(res.data.message || __('Verification code sent!'));
                setOtpCode(''); // Keep blank so user types the code received on their phone
            } else {
                toast.error(res.data?.message || __('Failed to send OTP code.'));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || __('Error sending verification code.'));
        } finally {
            setOtpLoading(false);
        }
    };

    // Verify OTP code
    const handleVerifyPhoneOtp = async () => {
        if (!otpCode || otpCode.trim().length < 4) {
            toast.error(__('Please enter the verification code.'));
            return;
        }

        setOtpLoading(true);
        try {
            const res = await axios.post('/api/user/phone/verify-otp', {
                phone: profileForm.data.phone,
                otp: otpCode.trim(),
            });

            if (res.data?.success) {
                setPhoneVerified(true);
                setChangingNumber(false);
                setOtpSent(false);
                setOtpCode('');
                // Update form so the saved phone reflects the new verified number
                if (res.data.phone) {
                    profileForm.setData('phone', res.data.phone);
                }
                toast.success(res.data.message || __('Phone number verified successfully!'));
            } else {
                toast.error(res.data?.message || __('Invalid verification code.'));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || __('Verification failed. Please try again.'));
        } finally {
            setOtpLoading(false);
        }
    };

    // ── Email OTP: Send verification code for Delete Account ──
    const handleSendDeleteOtp = async () => {
        setDeleteOtpLoading(true);
        try {
            const res = await axios.post('/api/user/email/send-otp', {
                action: 'delete_account',
            });
            if (res.data?.success) {
                setDeleteOtpSent(true);
                toast.success(res.data.message || __('Verification code sent to your email!'));
            } else {
                toast.error(res.data?.message || __('Failed to send verification code.'));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || __('Error sending verification code. Please try again.'));
        } finally {
            setDeleteOtpLoading(false);
        }
    };

    // ── Email OTP: Send verification code when updating email ──
    const handleSendChangeEmailOtp = async () => {
        const targetEmail = profileForm.data.email?.trim();
        if (!targetEmail || targetEmail === user.email) {
            toast.error(__('Please enter a new email address first.'));
            return;
        }

        setEmailOtpLoading(true);
        try {
            const res = await axios.post('/api/user/email/send-otp', {
                action: 'change_email',
                email: targetEmail,
            });
            if (res.data?.success) {
                setEmailOtpSent(true);
                setEmailOtpVerified(false);
                toast.success(res.data.message || __('Verification code sent to your new email!'));
            } else {
                toast.error(res.data?.message || __('Failed to send verification code.'));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || __('Error sending verification code.'));
        } finally {
            setEmailOtpLoading(false);
        }
    };

    // ── Email OTP: Verify code for Email Change ──
    const handleVerifyChangeEmailOtp = async () => {
        if (!emailOtpCode || emailOtpCode.trim().length < 6) {
            toast.error(__('Please enter the 6-digit verification code.'));
            return;
        }

        setEmailOtpLoading(true);
        try {
            const res = await axios.post('/api/user/email/verify-otp', {
                action: 'change_email',
                otp: emailOtpCode.trim(),
            });
            if (res.data?.success) {
                setEmailOtpVerified(true);
                setEmailOtpSent(false);
                toast.success(res.data.message || __('Email verified! You can now save your changes.'));
            } else {
                toast.error(res.data?.message || __('Invalid verification code.'));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || __('Verification failed. Please try again.'));
        } finally {
            setEmailOtpLoading(false);
        }
    };

    // Handle Profile Form Submit
    const handleProfileSubmit = (e) => {
        e.preventDefault();

        // If email was changed but not yet verified with OTP
        if (profileForm.data.email && profileForm.data.email !== user.email && !emailOtpVerified) {
            toast.error(__('Please verify your new email address with the verification code before saving.'));
            return;
        }

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

    const [autoGeneratingAvatar, setAutoGeneratingAvatar] = useState(false);

    const handleAutoGenerateAvatar = async () => {
        setAutoGeneratingAvatar(true);
        try {
            const seed = (user.name || user.email || 'user_' + Math.floor(Math.random() * 999999)).toString().trim().replace(/\s+/g, '-');
            const styles = ['bottts', 'adventurer', 'avataaars', 'fun-emoji', 'thumbs', 'lorelei'];
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];
            const avatarUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

            const res = await fetch(avatarUrl);
            const blob = await res.blob();
            const file = new File([blob], `avatar-${seed}.svg`, { type: 'image/svg+xml' });

            const formData = new FormData();
            formData.append('avatar', file);

            router.post(route('profile.avatar.update'), formData, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(__('Avatar auto-generated & saved!'));
                },
                onError: () => {
                    toast.error(__('Failed to save auto-generated avatar.'));
                },
            });
        } catch (err) {
            console.error('Failed generating avatar', err);
            toast.error(__('Failed to auto-generate avatar.'));
        } finally {
            setAutoGeneratingAvatar(false);
        }
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
                                ? 'bg-secondary text-white shadow-xs font-semibold'
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
                                ? 'bg-secondary text-white shadow-xs font-semibold'
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
                                ? 'bg-secondary text-white shadow-xs font-semibold'
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
                                        className="px-3 py-1.5 text-xs font-medium bg-secondary text-white rounded hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                                    >
                                        <RiCameraLine size={14} />
                                        {__('Upload Photo')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAutoGenerateAvatar}
                                        disabled={autoGeneratingAvatar}
                                        className="px-3 py-1.5 text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded border border-emerald-500/30 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                                    >
                                        <RiSparklingLine size={14} className={autoGeneratingAvatar ? 'animate-spin' : ''} />
                                        {autoGeneratingAvatar ? __('Generating...') : __('Auto-Generate Avatar')}
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
                                    <div className=''>
                                        <label className="block text-xs font-semibold text-text mb-1">
                                            {__('Full Name')} <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.data.name}
                                            onChange={(e) => profileForm.setData('name', e.target.value)}
                                            required
                                            className="w-full px-3 py-2 text-xs h-10.5 bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                        />
                                        {profileForm.errors.name && (
                                            <p className="text-[11px] text-rose-500 mt-1">{profileForm.errors.name}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-xs font-semibold text-text">
                                                {__('Email Address')} <span className="text-rose-500">*</span>
                                            </label>
                                            {profileForm.data.email !== user.email && (
                                                emailOtpVerified ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200">
                                                        <RiShieldCheckLine size={13} /> {__('Verified')}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200">
                                                        {__('Verification Required')}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={profileForm.data.email}
                                                onChange={(e) => {
                                                    profileForm.setData('email', e.target.value);
                                                    if (e.target.value !== user.email) {
                                                        setEmailOtpVerified(false);
                                                    }
                                                }}
                                                required
                                                className="w-full px-3 py-2 text-xs h-10.5 bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                            />
                                        </div>
                                        {profileForm.errors.email && (
                                            <p className="text-[11px] text-rose-500 mt-1">{profileForm.errors.email}</p>
                                        )}

                                        {/* OTP Verification widget when user changes email */}
                                        {profileForm.data.email && profileForm.data.email !== user.email && !emailOtpVerified && (
                                            <div className="mt-2.5 p-3 bg-bg border border-border rounded text-xs space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-text">
                                                        <RiMailLine size={14} className="text-primary" />
                                                        {__('Verify new address')}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={handleSendChangeEmailOtp}
                                                        disabled={emailOtpLoading}
                                                        className="px-2.5 py-1 text-[11px] font-semibold bg-secondary text-white rounded hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs transition-opacity inline-flex items-center gap-1"
                                                    >
                                                        {emailOtpLoading ? (
                                                            <>
                                                                <RiRefreshLine size={12} className="animate-spin" />
                                                                {__('Sending...')}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <RiSendPlaneLine size={12} />
                                                                {emailOtpSent ? __('Resend Code') : __('Send OTP')}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                {emailOtpSent && (
                                                    <div className="space-y-2 pt-2 border-t border-border">
                                                        <p className="text-[11px] text-res">
                                                            {__('Enter the 6-digit code sent to')} <strong className="text-text">{profileForm.data.email}</strong>:
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder={__('Enter 6-digit OTP')}
                                                                value={emailOtpCode}
                                                                maxLength={6}
                                                                onChange={(e) => setEmailOtpCode(e.target.value)}
                                                                className="flex-1 px-3 py-1.5 text-xs bg-bg border border-border rounded text-text font-mono tracking-widest focus:outline-hidden focus:border-primary"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={handleVerifyChangeEmailOtp}
                                                                disabled={emailOtpLoading || !emailOtpCode}
                                                                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
                                                            >
                                                                {emailOtpLoading ? __('Verifying...') : __('Verify')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* CNIC Scanner trigger bar */}
                                    <div className="col-span-2 flex items-center justify-between p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                                        <div className="flex items-center gap-2">
                                            <RiIdCardLine size={16} className="text-primary" />
                                            <div>
                                                <p className="text-xs font-semibold text-text">{__('Identity Verification & CNIC')}</p>
                                                <p className="text-[11px] text-muted">{__('Scan your CNIC card to auto-fill CNIC Number and Date of Birth / Age.')}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowCnicScanner(true)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-md transition-all shrink-0"
                                        >
                                            <RiScanLine size={14} />
                                            {__('Scan CNIC')}
                                        </button>
                                    </div>

                                    {/* Date of Birth */}
                                    <div>
                                        <label className="block text-xs font-semibold text-text mb-1">
                                            <span className="inline-flex items-center gap-1">
                                                <RiCalendarLine size={13} className="text-primary" />
                                                {__('Date of Birth')}
                                            </span>
                                        </label>
                                        <input
                                            type="date"
                                            value={profileForm.data.date_of_birth}
                                            onChange={(e) => profileForm.setData('date_of_birth', e.target.value)}
                                            className="w-full px-3 py-2 text-xs h-10.5 bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                        />
                                        {profileForm.errors.date_of_birth && (
                                            <p className="text-[11px] text-rose-500 mt-1">{profileForm.errors.date_of_birth}</p>
                                        )}
                                    </div>

                                    {/* CNIC Number */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-xs font-semibold text-text">
                                                <span className="inline-flex items-center gap-1">
                                                    <RiIdCardLine size={13} className="text-primary" />
                                                    {__('CNIC Number')}
                                                </span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowCnicScanner(true)}
                                                className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
                                            >
                                                <RiScanLine size={12} />
                                                {__('Scan')}
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={profileForm.data.cnic}
                                            onChange={(e) => profileForm.setData('cnic', e.target.value)}
                                            placeholder="35202-1234567-1"
                                            maxLength={15}
                                            className="w-full px-3 py-2 text-xs h-10.5 bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors font-mono"
                                        />
                                        {profileForm.errors.cnic && (
                                            <p className="text-[11px] text-rose-500 mt-1">{profileForm.errors.cnic}</p>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2 col-span-2">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-xs font-semibold text-text">
                                                {__('Phone Number')}
                                            </label>
                                            {phoneVerified && !changingNumber ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200">
                                                    <RiShieldCheckLine size={13} /> {__('Verified')}
                                                </span>
                                            ) : (
                                                <span className="text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200">
                                                    {changingNumber ? __('Pending Verification') : __('Unverified')}
                                                </span>
                                            )}
                                        </div>

                                        {/* Verified — locked display with Change Number option */}
                                        {phoneVerified && !changingNumber ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 flex items-center gap-2 px-3 py-2 text-xs bg-bg border border-emerald-300 rounded text-text">
                                                    <RiShieldCheckLine size={14} className="text-emerald-600 shrink-0" />
                                                    <span className="font-mono tracking-wide">{profileForm.data.phone}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setChangingNumber(true);
                                                        setPhoneVerified(false);
                                                        setOtpSent(false);
                                                        setOtpCode('');
                                                        profileForm.setData('phone', '');
                                                    }}
                                                    className="px-3 py-2 text-[11px] font-semibold bg-bg border border-border text-res hover:text-text hover:bg-border rounded transition-colors cursor-pointer whitespace-nowrap"
                                                >
                                                    {__('Change Number')}
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <PhoneInput
                                                    value={profileForm.data.phone || ''}
                                                    onChange={(val) => {
                                                        profileForm.setData('phone', val);
                                                        // Reset OTP state if the number changes while typing
                                                        setOtpSent(false);
                                                        setOtpCode('');
                                                    }}
                                                    error={profileForm.errors.phone}
                                                    inputClassName="w-full px-3 py-2 text-xs bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                                />

                                                {/* Cancel change — go back to verified display */}
                                                {changingNumber && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setChangingNumber(false);
                                                            setPhoneVerified(true);
                                                            setOtpSent(false);
                                                            setOtpCode('');
                                                            profileForm.setData('phone', meta.phone || '');
                                                        }}
                                                        className="inline-flex items-center gap-1 text-[11px] text-res hover:text-text cursor-pointer"
                                                    >
                                                        <RiCloseLine size={13} /> {__('Cancel — keep current number')}
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {/* Phone Verification Actions (only when not verified and phone entered) */}
                                        {!phoneVerified && profileForm.data.phone && profileForm.data.phone.length > 7 && (
                                            <div className="p-3 bg-bg border border-border rounded text-xs space-y-2 mt-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                                                        <RiWhatsappLine size={13} /> {__('Verify via WhatsApp')}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={handleSendPhoneOtp}
                                                        disabled={otpLoading}
                                                        className="px-2.5 py-1 text-[11px] font-semibold bg-secondary text-white rounded hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs transition-opacity"
                                                    >
                                                        {otpLoading ? __('Sending...') : (otpSent ? __('Resend Code') : __('Get Code'))}
                                                    </button>
                                                </div>

                                                {/* Verification Input */}
                                                {otpSent && (
                                                    <div className="space-y-2 pt-2 border-t border-border">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder={__('Enter 6-digit OTP')}
                                                                value={otpCode}
                                                                maxLength={6}
                                                                onChange={(e) => setOtpCode(e.target.value)}
                                                                className="flex-1 px-3 py-1.5 text-xs bg-bg border border-border rounded text-text font-mono tracking-widest focus:outline-hidden focus:border-primary"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={handleVerifyPhoneOtp}
                                                                disabled={otpLoading || !otpCode}
                                                                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
                                                            >
                                                                {otpLoading ? __('Verifying...') : __('Verify')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Bio */}
                                    <div className='col-span-2'>
                                        <label className="block text-xs font-semibold text-text mb-1">
                                            {__('Bio / About')}
                                        </label>
                                        <textarea
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
                                    {/* Street Address with Photon Geocode Autocomplete like user.json */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-text mb-1">
                                            {__('Street Address')}
                                        </label>
                                        <DropdownSelect
                                            name="address"
                                            searchable={true}
                                            value={profileForm.data.address || ''}
                                            options={[]}
                                            apiConfig={{
                                                api: 'https://photon.komoot.io',
                                                endpoint: '/api/?q={query}&limit=5',
                                                proxy: '/api/geocode',
                                            }}
                                            onChange={(val) => profileForm.setData('address', val)}
                                            error={profileForm.errors.address}
                                        />
                                    </div>

                                    {/* State / Province (Dynamic Taxonomy dropdown from user.json) */}
                                    <div>
                                        <label className="block text-xs font-semibold text-text mb-1">
                                            {__('State / Province')}
                                        </label>
                                        <DropdownSelect
                                            name="state"
                                            searchable={true}
                                            value={profileForm.data.state || ''}
                                            options={states}
                                            isLoading={loadingStates}
                                            onChange={(val) => {
                                                profileForm.setData(prev => ({
                                                    ...prev,
                                                    state: val,
                                                    city: '', // reset city when state changes
                                                }));
                                            }}
                                            error={profileForm.errors.state}
                                        />
                                    </div>

                                    {/* City (Dependent on State from user.json) */}
                                    <div>
                                        <label className="block text-xs font-semibold text-text mb-1">
                                            {__('City')}
                                        </label>
                                        <DropdownSelect
                                            name="city"
                                            searchable={true}
                                            value={profileForm.data.city || ''}
                                            options={cities}
                                            isLoading={loadingCities}
                                            disabled={!profileForm.data.state}
                                            onChange={(val) => profileForm.setData('city', val)}
                                            error={profileForm.errors.city}
                                        />
                                    </div>

                                    {/* Country */}
                                    <div>
                                        <label className="block text-xs font-semibold text-text mb-1">
                                            {__('Country')}
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.data.country || ''}
                                            onChange={(e) => profileForm.setData('country', e.target.value)}
                                            placeholder={__('Detecting country...')}
                                            disabled
                                            className="w-full px-3 py-2 text-xs h-10.5 bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors cursor-not-allowed opacity-80"
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
                                            className="w-full px-3 py-2 text-xs h-10.5 bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 border-t border-border flex justify-end">
                                <button
                                    type="submit"
                                    disabled={profileForm.processing}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-secondary hover:opacity-90 text-white rounded shadow-xs transition-opacity cursor-pointer disabled:opacity-50"
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
                                        className="w-full px-3 h-10.5 py-2 pr-10 text-xs bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
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
                                        className="w-full px-3 py-2 h-10.5 pr-10 text-xs bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
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
                                    className="w-full px-3 py-2 text-xs h-10.5 bg-bg border border-border rounded text-text focus:outline-hidden focus:border-primary transition-colors"
                                />
                                {passwordForm.errors.password_confirmation && (
                                    <p className="text-[11px] text-rose-500 mt-1">{passwordForm.errors.password_confirmation}</p>
                                )}
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-secondary hover:opacity-90 text-white rounded shadow-xs transition-opacity cursor-pointer disabled:opacity-50"
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

                            {/* Chrome Desktop Notifications Card */}
                            <div className="p-4 bg-primary/5 rounded border border-primary/20 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <span className="text-xs font-semibold text-text block">
                                            {__('Chrome Desktop Push Notifications')}
                                        </span>
                                        <span className="text-[11px] text-res leading-relaxed block mt-0.5">
                                            {__('Receive instant native desktop popups when a new product is added or when your order status updates.')}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (typeof window !== 'undefined' && 'Notification' in window) {
                                                const res = await Notification.requestPermission();
                                                if (res === 'granted') {
                                                    new Notification('NestifyTech Notifications Active', {
                                                        body: 'You are now set up to receive instant notifications for orders and new products!',
                                                        icon: '/assets/image/favicon.png',
                                                    });
                                                    toast.success(__('Chrome notifications enabled!'));
                                                } else {
                                                    toast.info(__('Notification permission was not granted.'));
                                                }
                                            } else {
                                                toast.error(__('Desktop notifications are not supported by this browser.'));
                                            }
                                        }}
                                        className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded hover:opacity-90 shadow-xs cursor-pointer transition-opacity"
                                    >
                                        {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
                                            ? __('Active (Send Test)')
                                            : __('Enable Desktop Alerts')}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={profileForm.processing}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-secondary hover:opacity-90 text-white rounded shadow-xs transition-opacity cursor-pointer disabled:opacity-50"
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
                                {__('For your security, please confirm your current password and enter the one-time verification code sent to your email.')}
                            </p>

                            <div>
                                <label className="block text-xs font-semibold text-text mb-1">
                                    {__('Current Password')} <span className="text-rose-500">*</span>
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

                            {/* Email OTP Verification Section */}
                            <div className="p-3 bg-bg border border-border rounded text-xs space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-text">
                                        <RiMailLine size={14} className="text-rose-600" />
                                        {__('Email Verification Code')} <span className="text-rose-500">*</span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleSendDeleteOtp}
                                        disabled={deleteOtpLoading}
                                        className="px-2.5 py-1 text-[11px] font-semibold bg-secondary text-white rounded hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs transition-opacity inline-flex items-center gap-1"
                                    >
                                        {deleteOtpLoading ? (
                                            <>
                                                <RiRefreshLine size={12} className="animate-spin" />
                                                {__('Sending...')}
                                            </>
                                        ) : (
                                            <>
                                                <RiSendPlaneLine size={12} />
                                                {deleteOtpSent ? __('Resend Code') : __('Send OTP to Email')}
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="pt-2 border-t border-border">
                                    <input
                                        type="text"
                                        value={deleteForm.data.otp}
                                        onChange={(e) => deleteForm.setData('otp', e.target.value)}
                                        required
                                        maxLength={6}
                                        placeholder={__('Enter 6-digit code received on your email')}
                                        className="w-full px-3 py-2 text-xs bg-bg border border-border rounded text-text font-mono tracking-widest focus:outline-hidden focus:border-rose-500"
                                    />
                                    {deleteForm.errors.otp && (
                                        <p className="text-[11px] text-rose-500 mt-1">{deleteForm.errors.otp}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        deleteForm.reset();
                                        setDeleteOtpSent(false);
                                    }}
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

            {/* CNIC Scanner Modal */}
            <CnicScanner
                isOpen={showCnicScanner}
                onClose={() => setShowCnicScanner(false)}
                onScanComplete={({ cnic, dob, age }) => {
                    let updated = false;
                    if (cnic) {
                        profileForm.setData('cnic', cnic);
                        updated = true;
                    }
                    if (dob) {
                        profileForm.setData('date_of_birth', dob);
                        updated = true;
                    }
                    if (updated) {
                        const parts = [];
                        if (cnic) parts.push(`CNIC: ${cnic}`);
                        if (dob) parts.push(`DOB: ${dob}${age !== null ? ` (Age: ${age})` : ''}`);
                        toast.success(`Scanned successfully: ${parts.join(', ')}`);
                    }
                }}
            />
        </ProfileLayout>
    );
}
