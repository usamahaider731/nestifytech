import React from 'react';
import ThemeSwitcher from '@/Components/ThemeSwitcher';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import CartDrawer from '@/Components/Frontend/CartDrawer';
import { CartProvider } from '@/contexts/CartContext';

export default function FrontendLayout({ children, title }) {
    return (
        <CartProvider>
            <div className="min-h-screen font-primary text-res antialiased flex flex-col">
                <Header title={title} />
                <ThemeSwitcher />
                <main className="flex-grow">{children}</main>
                <Footer />
                <CartDrawer />
            </div>
        </CartProvider>
    );
}
