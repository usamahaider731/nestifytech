import Checkbox from '@/Components/Admin/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/Admin/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import SocialAuthButtons from '@/Components/Auth/SocialAuthButtons';
import { Head, Link, useForm } from '@inertiajs/react';
import { RiLockPasswordLine, RiMailLine, RiLoginCircleLine, RiEyeCloseLine, RiEyeLine, RiEyeOffLine, RiEyeOffFill } from 'react-icons/ri';
import { useState } from 'react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const [PasswordType, SetPasswordType] = useState('password')
    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="mb-6 text-center">
                <h1 className="text-xl font-bold text-heading">Welcome Back</h1>
                <p className="text-xs text-res mt-1">Sign in to access your orders, wishlist, and account.</p>
            </div>

            {status && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="email" value="Email Address" className="text-xs font-semibold text-text" />

                    <div className="relative mt-1">
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="block w-full text-xs pl-9 py-2.5 rounded-lg border-border focus:border-primary"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                        <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-res size-4" />
                    </div>

                    <InputError message={errors.email} className="mt-1.5" />
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <InputLabel htmlFor="password" value="Password" className="text-xs font-semibold text-text" />
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-[11px] font-medium text-primary hover:underline"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>

                    <div className="relative mt-1">
                        <TextInput
                            id="password"
                            type={PasswordType}
                            name="password"
                            value={data.password}
                            className="block w-full text-xs pl-9 py-2.5 rounded-lg border-border focus:border-primary"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                        <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-res size-4" />
                        {
                            PasswordType == "password" ?
                                <RiEyeLine onClick={() => SetPasswordType('text')} className="absolute right-3 top-1/2 -translate-y-1/2 text-res size-4" />
                                :
                                <RiEyeOffLine onClick={() => SetPasswordType('password')} className="absolute right-3 top-1/2 -translate-y-1/2 text-res size-4" />
                        }
                    </div>

                    <InputError message={errors.password} className="mt-1.5" />
                </div>

                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center cursor-pointer">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                        />
                        <span className="ms-2 text-xs text-res">
                            Remember me
                        </span>
                    </label>
                </div>

                <PrimaryButton className="w-full bg-primary hover:bg-secondary justify-center py-2.5 text-xs font-bold rounded-lg shadow-xs" disabled={processing}>
                    <RiLoginCircleLine size={16} className="mr-1.5" />
                    Sign in
                </PrimaryButton>
            </form>

            {/* Social Media Login (Google & Facebook) */}
            <SocialAuthButtons action="Sign in" />

            <div className="mt-6 pt-4 border-t border-border text-center">
                <p className="text-xs text-res">
                    Don't have an account?{' '}
                    <Link
                        href={route('register')}
                        className="font-semibold text-primary hover:underline"
                    >
                        Create an account
                    </Link>
                </p>
            </div>
        </GuestLayout>
    );
}
