"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, formatDistanceToNowStrict } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/data';

type DaysToDueBadgeProps = {
  dueDate: string;
  status: Transaction['status'];
};

export function DaysToDueBadge({ dueDate, status }: DaysToDueBadgeProps) {
  if (status === 'paid') {
    return <Badge variant="secondary">שולם</Badge>;
  }

  const now = new Date();
  const due = new Date(dueDate);
  const daysDiff = differenceInDays(due, now);

  if (status === 'late') {
    return (
      <Badge variant="destructive">
        באיחור של {formatDistanceToNowStrict(due, { locale: he, addSuffix: false })}
      </Badge>
    );
  }

  if (daysDiff < 0) {
     return (
      <Badge variant="destructive">
        באיחור של {formatDistanceToNowStrict(due, { locale: he, addSuffix: false })}
      </Badge>
    );
  }
  
  if (daysDiff === 0) {
    return <Badge className="bg-yellow-500 text-white">היום</Badge>;
  }

  if (daysDiff <= 7) {
    return (
      <Badge variant="outline" className="text-yellow-600 border-yellow-500">
        בעוד {formatDistanceToNowStrict(due, { locale: he, addSuffix: false })}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
        בעוד {formatDistanceToNowStrict(due, { locale: he, addSuffix: false })}
    </Badge>
  );
};
