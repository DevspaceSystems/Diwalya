import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Authentication disabled per user request for direct access
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:flex w-64 fixed inset-y-0 left-0 z-40 bg-slate-900 border-r border-white/5 shadow-2xl">
        <AdminSidebar />
      </aside>
      <div className="flex-grow lg:ml-64 flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </div>
  );
}
