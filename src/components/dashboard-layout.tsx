"use client";

import Link from 'next/link';
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
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Landmark, FileText, Settings, Bell, Banknote, LogOut } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

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
      <Sidebar side="right">
        <SidebarHeader>
          <div className="flex items-center gap-3 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-8 w-8 text-primary-foreground"><rect width="256" height="256" fill="none"/><path fill="currentColor" d="M208,56V200a16,16,0,0,1-16,16H64a16,16,0,0,1-16-16V56A16,16,0,0,1,64,40H192A16,16,0,0,1,208,56ZM96,168a8,8,0,0,0,8,8h48a8,8,0,0,0,0-16H104A8,8,0,0,0,96,168Zm8-40a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Z"/></svg>
            <h1 className="font-headline text-2xl font-bold text-primary-foreground">DebtWise</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/">
                <SidebarMenuButton isActive={pathname === '/'} tooltip={{children: 'לוח מחוונים', side: 'right'}}>
                  <Home />
                  <span>לוח מחוונים</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <Link href="/debts">
                <SidebarMenuButton isActive={pathname.startsWith('/debts')} tooltip={{children: 'ניהול חובות', side: 'right'}}>
                  <Banknote />
                  <span>ניהול חובות</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <Link href="/loans">
                <SidebarMenuButton isActive={pathname.startsWith('/loans')} tooltip={{children: 'ניהול הלוואות', side: 'right'}}>
                  <Landmark />
                  <span>ניהול הלוואות</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <Link href="/reports">
                <SidebarMenuButton isActive={pathname.startsWith('/reports')} tooltip={{children: 'דוחות', side: 'right'}}>
                  <FileText />
                  <span>דוחות</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/notifications">
                <SidebarMenuButton isActive={pathname.startsWith('/notifications')} tooltip={{children: 'התראות', side: 'right'}}>
                  <Bell />
                  <span>התראות</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/settings">
                <SidebarMenuButton isActive={pathname.startsWith('/settings')} tooltip={{children: 'הגדרות', side: 'right'}}>
                  <Settings />
                  <span>הגדרות</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <Link href="/profile">
                <SidebarMenuButton isActive={pathname.startsWith('/profile')} tooltip={{children: 'פרופיל משתמש', side: 'right'}}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "User"} />
                    <AvatarFallback>{user.isAnonymous ? 'A' : (user.displayName?.charAt(0).toUpperCase() ?? 'U')}</AvatarFallback>
                  </Avatar>
                  <span>{user.isAnonymous ? 'משתמש אנונימי' : user.displayName}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut} tooltip={{children: 'התנתק', side: 'right'}}>
                  <LogOut />
                  <span>התנתק</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
