'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Sparkles, User as UserIcon } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Transaction } from '@/lib/data';
import { askAssistant } from '@/ai/flows/assistant-flow';
import { Skeleton } from '@/components/ui/skeleton';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'שלום! אני עוזר ה-AI של DebtWise. איך אני יכול לעזור לך היום עם ניהול ההתחייבויות שלך?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { user } = useUser();
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'transactions');
  }, [user, firestore]);

  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isLoadingTransactions) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!transactions) {
        throw new Error('No transactions data available');
      }
      const response = await askAssistant({ query: input, transactions });
      const assistantMessage: Message = { role: 'assistant', content: response.response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling AI assistant:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'אני מתנצל, התרחשה שגיאה. אנא נסה שוב מאוחר יותר.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8 h-full max-h-[calc(100vh-2rem)]">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">עוזר AI</h1>
        <p className="text-muted-foreground">שאל שאלות וקבל תובנות על המצב הפיננסי שלך.</p>
      </header>
      <Card className="flex flex-1 flex-col">
        <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[calc(100vh-20rem)] p-6" ref={scrollAreaRef}>
                <div className="space-y-6">
                {messages.map((message, index) => (
                    <div
                    key={index}
                    className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                    >
                    {message.role === 'assistant' && (
                        <Avatar className="h-9 w-9 border">
                           <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                                <Sparkles className="h-5 w-5" />
                           </div>
                        </Avatar>
                    )}
                    <div
                        className={`max-w-[75%] rounded-lg p-3 text-sm ${
                        message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                    >
                        <p style={{whiteSpace: 'pre-wrap'}}>{message.content}</p>
                    </div>
                     {message.role === 'user' && (
                        <Avatar className="h-9 w-9 border">
                           <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                                <UserIcon className="h-5 w-5" />
                           </div>
                        </Avatar>
                    )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9 border">
                             <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                                <Sparkles className="h-5 w-5" />
                           </div>
                        </Avatar>
                        <div className="max-w-[75%] rounded-lg p-3 text-sm bg-muted">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-2 w-2 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <Skeleton className="h-2 w-2 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <Skeleton className="h-2 w-2 rounded-full animate-bounce" />
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </ScrollArea>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoadingTransactions ? "טוען נתונים..." : "שאל אותי משהו על ההתחייבויות שלך..."}
              disabled={isLoading || isLoadingTransactions}
            />
            <Button type="submit" disabled={isLoading || isLoadingTransactions}>
              <Send className="h-4 w-4" />
              <span className="sr-only">שלח</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}