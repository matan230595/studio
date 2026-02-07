"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Activity, activities, transactions } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAiHint, getAvatarUrl } from '@/lib/utils';
import { Bell, Banknote, Landmark, BadgeCheck, AlertTriangle } from 'lucide-react';

const activityIcons = {
    payment: <BadgeCheck className="h-5 w-5 text-green-500" />,
    late: <AlertTriangle className="h-5 w-5 text-red-500" />,
    new: <Banknote className="h-5 w-5 text-blue-500" />,
    default: <Bell className="h-5 w-5 text-muted-foreground" />,
}

const getActivityIcon = (activity: Activity) => {
    if (activity.description.includes('שולם')) return activityIcons.payment;
    if (activity.description.includes('איחור')) return activityIcons.late;
    if (activity.description.includes('חדש')) return activityIcons.new;
    return activityIcons.default;
}

export default function NotificationsPage() {

  const getTransactionInfo = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) {
      return { name: 'לא ידוע', avatar: 'placeholder', type: 'debt' as 'debt' | 'loan' };
    }
    return { name: transaction.creditor.name, avatar: transaction.creditor.avatar, type: transaction.type };
  }
  
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          התראות
        </h1>
        <p className="text-muted-foreground">
          כל העדכונים והפעילויות האחרונות במערכת.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>פיד פעילות</CardTitle>
          <CardDescription>מציג את {activities.length} הפעילויות האחרונות.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activities.map((activity) => {
                const { name, avatar, type } = getTransactionInfo(activity.debtId);
                return (
                    <div key={activity.id} className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={getAvatarUrl(avatar)} alt={name} data-ai-hint={getAiHint(avatar)} />
                            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <p className="font-medium">
                                {activity.description} - <span className="font-normal text-muted-foreground">{name}</span>
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{activity.timestamp}</span>
                                &middot;
                                <div className="flex items-center gap-1">
                                    {type === 'loan' ? <Landmark className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                                    <span>{type === 'loan' ? 'הלוואה' : 'חוב'}</span>
                                </div>
                            </div>
                        </div>
                         <div className="bg-muted rounded-full p-2 hidden sm:block">
                           {getActivityIcon(activity)}
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
