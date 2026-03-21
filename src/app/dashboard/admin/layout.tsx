import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Authentication disabled per user request for direct access
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>
      <div className="flex-grow lg:ml-64 flex flex-col min-h-screen w-full">
        <AdminHeader />
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </div>
  );
}
