import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/Admin/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import SocialAuthButtons from '@/Components/Auth/SocialAuthButtons';
import { Head, Link, useForm } from '@inertiajs/react';
import { RiUser3Line, RiMailLine, RiLockPasswordLine, RiUserAddLine } from 'react-icons/ri';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Create an Account" />

            <div className="mb-6 text-center">
                <h1 className="text-xl font-bold text-heading">Create an Account</h1>
                <p className="text-xs text-res mt-1">Join NestifyTech to order products, save wishlists, and track shipments.</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="name" value="Full Name" className="text-xs font-semibold text-text" />

                    <div className="relative mt-1">
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="block w-full text-xs pl-9 py-2.5 rounded-lg border-border focus:border-primary"
                            autoComplete="name"
                            isFocused={true}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="John Doe"
                            required
                        />
                        <RiUser3Line className="absolute left-3 top-1/2 -translate-y-1/2 text-res size-4" />
                    </div>

                    <InputError message={errors.name} className="mt-1.5" />
                </div>

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
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                        <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-res size-4" />
                    </div>

                    <InputError message={errors.email} className="mt-1.5" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Password" className="text-xs font-semibold text-text" />

                    <div className="relative mt-1">
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="block w-full text-xs pl-9 py-2.5 rounded-lg border-border focus:border-primary"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                        <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-res size-4" />
                    </div>

                    <InputError message={errors.password} className="mt-1.5" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                        className="text-xs font-semibold text-text"
                    />

                    <div className="relative mt-1">
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="block w-full text-xs pl-9 py-2.5 rounded-lg border-border focus:border-primary"
                            autoComplete="new-password"
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            placeholder="••••••••"
                            required
                        />
                        <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-res size-4" />
                    </div>

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-1.5"
                    />
                </div>

                <PrimaryButton className="w-full justify-center py-2.5 text-xs font-bold rounded-lg shadow-xs" disabled={processing}>
                    <RiUserAddLine size={16} className="mr-1.5" />
                    Register
                </PrimaryButton>
            </form>

            {/* Social Media Login (Google & Facebook) */}
            <SocialAuthButtons action="Sign up" />

            <div className="mt-6 pt-4 border-t border-border text-center">
                <p className="text-xs text-res">
                    Already have an account?{' '}
                    <Link
                        href={route('login')}
                        className="font-semibold text-primary hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </GuestLayout>
    );
}
