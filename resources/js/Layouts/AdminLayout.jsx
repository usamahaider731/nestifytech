import AdminPanel from '@/Components/Admin/AdminPanel'
import Header from '@/Components/Admin/Header'
import React from 'react'
import { ToastContainer } from 'react-toastify'

function AdminLayout({ children }) {
    return (
        <div className='flex w-full min-h-screen bg-bg font-primary text-heading'>
            <aside className='w-[260px] min-w-[260px] h-screen sticky top-0 left-0 border-r border-r-white/5 bg-accent/60 backdrop-blur-md'>
                <AdminPanel />
            </aside>
            <div className='flex-1 flex flex-col h-screen overflow-x-hidden'>
                <Header />
                <main className='p-6 flex-1'>
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
                theme="dark" />

        </div>
    )
}

export default AdminLayout
