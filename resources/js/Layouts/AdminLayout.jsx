import AdminPanel from '@/Components/Admin/AdminPanel'
import Header from '@/Components/Admin/Header'
import React from 'react'
import { ToastContainer } from 'react-toastify'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'

import { Head, usePage } from '@inertiajs/react'

function AdminLayoutInner({ children, title }) {
    const { theme } = useTheme();
    const { setting } = usePage().props;
    const siteName = setting?.site?.name?.value || 'NestifyTech';
    const documentTitle = title ? `${title} - ${siteName}` : siteName;

    return (
        <div className='flex w-full min-h-screen bg-bg font-primary text-heading antialiased selection:bg-primary selection:text-white'>
            <Head title={documentTitle} />
            <aside className='w-[260px] min-w-[260px] h-screen sticky top-0 left-0 border-r border-permanent/40 bg-accent z-30 shadow-lg'>
                <AdminPanel />
            </aside>
            <div className='flex-1 flex flex-col min-h-screen bg-bg'>
                <Header />
                <main className='px-6 pb-8 flex-1'>
                    {children}
                </main>
            </div>
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
                theme={theme} />
        </div>
    )
}

function AdminLayout({ children, title }) {
    return (
        <ThemeProvider>
            <AdminLayoutInner title={title}>{children}</AdminLayoutInner>
        </ThemeProvider>
    )
}

export default AdminLayout
