import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/Admin/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { RiLockPasswordLine, RiShieldKeyholeLine } from 'react-icons/ri';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <div className="mb-6 text-center">
                <div className="size-12 mx-auto mb-3 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <RiShieldKeyholeLine size={24} />
                </div>
                <h1 className="text-xl font-bold text-heading">Confirm Password</h1>
                <p className="text-xs text-res mt-1">
                    This is a secure area of the application. Please confirm your password before continuing.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="password" value="Password" className="text-xs font-semibold text-text" />

                    <div className="relative mt-1">
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="block w-full text-xs pl-9 py-2.5 rounded-lg border-border focus:border-primary"
                            isFocused={true}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                        <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-res size-4" />
                    </div>

                    <InputError message={errors.password} className="mt-1.5" />
                </div>

                <PrimaryButton className="w-full justify-center py-2.5 text-xs font-bold rounded-lg shadow-xs" disabled={processing}>
                    Confirm
                </PrimaryButton>
            </form>
        </GuestLayout>
    );
}
