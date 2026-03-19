'use client';

import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Authentication disabled per user request for direct access
  return <>{children}</>;
}
