import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/Admin/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { RiMailLine, RiLockPasswordLine, RiKeyLine } from 'react-icons/ri';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <div className="mb-6 text-center">
                <div className="size-12 mx-auto mb-3 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <RiKeyLine size={24} />
                </div>
                <h1 className="text-xl font-bold text-heading">Set New Password</h1>
                <p className="text-xs text-res mt-1">
                    Enter your email and choose a strong new password for your account.
                </p>
            </div>

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
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                        <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-res size-4" />
                    </div>

                    <InputError message={errors.email} className="mt-1.5" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="New Password" className="text-xs font-semibold text-text" />

                    <div className="relative mt-1">
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="block w-full text-xs pl-9 py-2.5 rounded-lg border-border focus:border-primary"
                            autoComplete="new-password"
                            isFocused={true}
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
                        value="Confirm New Password"
                        className="text-xs font-semibold text-text"
                    />

                    <div className="relative mt-1">
                        <TextInput
                            type="password"
                            id="password_confirmation"
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
                    Reset Password
                </PrimaryButton>
            </form>
        </GuestLayout>
    );
}
