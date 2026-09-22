import React from 'react';
import ThemeSwitcher from '@/Components/ThemeSwitcher';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import CartDrawer from '@/Components/Frontend/CartDrawer';
import { CartProvider } from '@/contexts/CartContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import BrandSlider from '@/Components/BrandSlider';
import { ToastContainer } from 'react-toastify';

export default function FrontendLayout({ children, title }) {
    return (
        <LanguageProvider>
            <ToastContainer
                position="top-right"
                autoClose={3500}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                limit={1}
                icon={true}
            
                theme={'light'} />
            <CartProvider>
                <div className="min-h-screen font-primary text-res antialiased w-full overflow-x-hidden flex flex-col">
                    <Header title={title} />
                    <ThemeSwitcher />
                    <main className="flex-grow">{children}</main>
                    <BrandSlider />
                    <Footer />
                    <CartDrawer />
                </div>
            </CartProvider>
        </LanguageProvider>
    );
}
