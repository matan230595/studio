"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Activity, activities, transactions } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {

  const getTransactionInfo = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) {
      return { name: 'לא ידוע', avatar: 'placeholder' };
    }
    return { name: transaction.creditor.name, avatar: transaction.creditor.avatar };
  }
  
  const getAvatarUrl = (avatarId: string) => {
    const image = PlaceHolderImages.find(img => img.id === avatarId);
    return image ? image.imageUrl : `https://picsum.photos/seed/${avatarId}/100/100`;
  };


  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          התראות
        </h1>
        <p className="text-muted-foreground">
          כל ההתראות והעדכונים האחרונים.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>פיד התראות</CardTitle>
          <CardDescription>סה"כ {activities.length} פעילויות אחרונות.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {activities.map((activity) => {
                const { name, avatar } = getTransactionInfo(activity.debtId);
                return (
                    <div key={activity.id} className="flex items-start gap-4">
                        <div className="bg-muted rounded-full p-2">
                           <Bell className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-grow">
                            <p className="font-medium">
                                {activity.description} - <span className="font-normal text-muted-foreground">{name}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                        </div>
                    </div>
                )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
