import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';

export default function SocialAuthButtons({ action = 'Sign in' }) {
    return (
        <div className="space-y-3">
            <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-res font-medium">
                        Or continue with
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <a
                    href={route('auth.social.redirect', { provider: 'google' })}
                    className="flex items-center justify-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-text bg-bg hover:bg-dynamic/40 border border-border rounded-lg shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                    <FcGoogle size={18} />
                    <span>Google</span>
                </a>

                <a
                    href={route('auth.social.redirect', { provider: 'facebook' })}
                    className="flex items-center justify-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#1877F2] hover:bg-[#166fe5] border border-transparent rounded-lg shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                    <FaFacebook size={18} />
                    <span>Facebook</span>
                </a>
            </div>
        </div>
    );
}
