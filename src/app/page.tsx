"use client";

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';


export default function Home() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && user) {
            router.replace('/dashboard');
        }
    }, [user, isUserLoading, router]);
  
  // Render nothing, or a loading indicator, while we determine the redirect.
  // AuthGuard will show a global loader anyway.
  return null;
}
