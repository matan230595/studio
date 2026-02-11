"use client";

import Link from 'next/link';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarMenuBadge,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Landmark, FileText, Settings, Bell, Banknote, LogOut, Sparkles, Menu } from 'lucide-react';
import { useAuth, useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';
import { getUpcomingReminders } from '@/lib/financial-utils';
import type { Transaction } from '@/lib/data';
import { collection } from 'firebase/firestore';
import { AppLogo } from './app-logo';


export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const transactionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'transactions');
  }, [user, firestore]);

  const { data: transactions } = useCollection<Transaction>(transactionsQuery);

  const notificationCount = React.useMemo(() => {
    if (!transactions) return 0;
    const reminders = getUpcomingReminders(transactions, 7);
    const lateItems = transactions.filter(t => t.status === 'late');
    return reminders.length + lateItems.length;
  }, [transactions]);


  const handleSignOut = async () => {
    if (!auth) return;
    try {
        await signOut(auth);
        router.push('/login');
    } catch(e) {
        console.error("Error signing out: ", e);
    }
  };

  if (!user) {
    // This should ideally not be reached due to AuthGuard
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar side="right" collapsible="icon">
        <SidebarHeader>
           <div className="flex items-center justify-between gap-3 p-2">
            <div className="flex items-center gap-3">
              <AppLogo />
              <h1 className="font-headline text-2xl font-bold text-sidebar-primary-foreground group-data-[collapsible=icon]:hidden">DebtWise</h1>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/dashboard">
                <SidebarMenuButton isActive={pathname === '/dashboard'} tooltip={{children: 'לוח מחוונים', side: 'left'}}>
                  <Home />
                  <span>לוח מחוונים</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <Link href="/debts">
                <SidebarMenuButton isActive={pathname.startsWith('/debts')} tooltip={{children: 'ניהול חובות', side: 'left'}}>
                  <Banknote />
                  <span>ניהול חובות</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <Link href="/loans">
                <SidebarMenuButton isActive={pathname.startsWith('/loans')} tooltip={{children: 'ניהול הלוואות', side: 'left'}}>
                  <Landmark />
                  <span>ניהול הלוואות</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <Link href="/reports">
                <SidebarMenuButton isActive={pathname.startsWith('/reports')} tooltip={{children: 'דוחות', side: 'left'}}>
                  <FileText />
                  <span>דוחות</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <Link href="/assistant">
                <SidebarMenuButton isActive={pathname.startsWith('/assistant')} tooltip={{children: 'עוזר AI', side: 'left'}}>
                  <Sparkles />
                  <span>עוזר AI</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/notifications">
                <SidebarMenuButton isActive={pathname.startsWith('/notifications')} tooltip={{children: 'התראות', side: 'left'}}>
                  <Bell />
                  <span>התראות</span>
                   {notificationCount > 0 && (
                    <SidebarMenuBadge className="bg-destructive text-destructive-foreground">
                      {notificationCount}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/settings">
                <SidebarMenuButton isActive={pathname.startsWith('/settings')} tooltip={{children: 'הגדרות', side: 'left'}}>
                  <Settings />
                  <span>הגדרות</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <Link href="/profile">
                <SidebarMenuButton isActive={pathname.startsWith('/profile')} tooltip={{children: 'פרופיל משתמש', side: 'left'}}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "User"} />
                    <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="group-data-[collapsible=icon]:hidden">{user.displayName ?? user.email}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut} tooltip={{children: 'התנתק', side: 'left'}}>
                  <LogOut />
                  <span className="group-data-[collapsible=icon]:hidden">התנתק</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger>
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <div className="w-full flex-1">
              {/* You can add a global search bar here if you want */}
            </div>
          </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
