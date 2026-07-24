'use client';

/**
 * Providers – wrapper cho NextAuth SessionProvider
 * Bao bọc toàn bộ ứng dụng để các component con có thể dùng useSession()
 */

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            fontSize: '1.1rem',
            padding: '16px 24px',
            maxWidth: '500px',
            fontWeight: '500'
          }
        }}
      />
    </SessionProvider>
  );
}
