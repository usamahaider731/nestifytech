import PrimaryButton from '@/Components/Admin/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { RiMailCheckLine, RiSendPlaneLine, RiLogoutBoxRLine } from 'react-icons/ri';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div className="mb-6 text-center">
                <div className="size-12 mx-auto mb-3 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <RiMailCheckLine size={24} />
                </div>
                <h1 className="text-xl font-bold text-heading">Verify Your Email</h1>
                <p className="text-xs text-res mt-1 leading-relaxed">
                    Thanks for signing up! Please click on the verification link we just emailed to your inbox.
                    If you didn't receive it, we'll gladly send you another.
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700 text-center">
                    A new verification link has been sent to your registered email address.
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <PrimaryButton className="w-full justify-center py-2.5 text-xs font-bold rounded-lg shadow-xs" disabled={processing}>
                    <RiSendPlaneLine size={16} className="mr-1.5" />
                    Resend Verification Email
                </PrimaryButton>

                <div className="pt-2 text-center">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                    >
                        <RiLogoutBoxRLine size={14} />
                        Log Out
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
