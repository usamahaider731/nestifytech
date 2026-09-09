import ApplicationLogo from '@/Components/ApplicationLogo';
import ThemeSwitcher from '@/Components/ThemeSwitcher';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-bg pt-6 sm:justify-center sm:pt-0 font-primary text-res">
            <ThemeSwitcher />
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-20 w-20 fill-current text-primary" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-accent px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg border border-permanent/20">
                {children}
            </div>
        </div>
    );
}
