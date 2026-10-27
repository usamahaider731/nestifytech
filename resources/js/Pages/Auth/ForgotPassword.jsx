import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/Admin/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { RiMailLine, RiSendPlaneLine } from 'react-icons/ri';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="mb-6 text-center">
                <h1 className="text-xl font-bold text-heading">Forgot Password</h1>
                <p className="text-xs text-res mt-1">
                    No problem. Enter your email and we will send you a password reset link.
                </p>
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
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                        <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-res size-4" />
                    </div>

                    <InputError message={errors.email} className="mt-1.5" />
                </div>

                <PrimaryButton className="w-full justify-center py-2.5 text-xs font-bold rounded-lg shadow-xs" disabled={processing}>
                    <RiSendPlaneLine size={16} className="mr-1.5" />
                    Email Password Reset Link
                </PrimaryButton>

                <div className="mt-4 pt-4 border-t border-border text-center">
                    <Link
                        href={route('login')}
                        className="text-xs font-semibold text-primary hover:underline"
                    >
                        Back to Login
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
