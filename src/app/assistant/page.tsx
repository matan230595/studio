'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Sparkles, User as UserIcon, Volume2 } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Transaction } from '@/lib/data';
import { askAssistant } from '@/ai/flows/assistant-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateFinancialSummary, getLateTransactions, getUpcomingPayments } from '@/lib/financial-utils';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init1',
      role: 'assistant',
      content: 'שלום! אני עוזר ה-AI של DebtWise. איך אני יכול לעזור לך היום עם ניהול ההתחייבויות שלך?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [audioSource, setAudioSource] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

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

    const userMessage: Message = { role: 'user', content: input, id: `user-${Date.now()}` };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setAudioSource('');
    setSpeakingMessageId(null);


    try {
      if (!transactions) {
        throw new Error('No transactions data available');
      }
      
      const summary = calculateFinancialSummary(transactions);
      const lateTransactions = getLateTransactions(transactions);
      const upcomingPayments = getUpcomingPayments(transactions);

      const response = await askAssistant({ 
        query: input, 
        transactions,
        summary,
        lateTransactions,
        upcomingPayments,
      });

      const assistantMessage: Message = { role: 'assistant', content: response.response, id: `assistant-${Date.now()}` };
      setMessages((prev) => [...prev, assistantMessage]);
      
      try {
        const audioResponse = await textToSpeech({ text: response.response });
        setAudioSource(audioResponse.audioDataUri);
        setSpeakingMessageId(assistantMessage.id);
      } catch (audioError) {
        console.error('Text-to-speech failed:', audioError);
      }

    } catch (error) {
      console.error('Error calling AI assistant:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
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
        <p className="text-muted-foreground">שאל שאלות וקבל תובנות על המצב הפיננסי שלך. העוזר גם יקריא לך את התשובות.</p>
      </header>
      <Card className="flex flex-1 flex-col">
        <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[calc(100vh-20rem)] p-6" ref={scrollAreaRef}>
                <div className="space-y-6">
                {messages.map((message) => {
                  if (message.role === 'user') {
                    return (
                      <div key={message.id} className="flex items-start gap-3 justify-end">
                        <div className="flex items-end gap-2 max-w-[75%] rounded-lg p-3 text-sm bg-primary text-primary-foreground">
                          <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
                        </div>
                        <Avatar className="h-9 w-9 border">
                          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                            <UserIcon className="h-5 w-5" />
                          </div>
                        </Avatar>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={message.id} className="flex items-start gap-3 justify-start">
                      <Avatar className="h-9 w-9 border">
                        <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                          <Sparkles className="h-5 w-5" />
                        </div>
                      </Avatar>
                      <div className="flex items-end gap-2 max-w-[75%] rounded-lg p-3 text-sm bg-muted">
                        <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
                        {speakingMessageId === message.id && (
                          <Volume2 className="h-4 w-4 text-muted-foreground animate-pulse" />
                        )}
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                    <div className="flex items-start gap-3 justify-start">
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
            <Button type="submit" size="icon" disabled={isLoading || isLoadingTransactions}>
              <Send className="h-4 w-4" />
              <span className="sr-only">שלח</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
      {audioSource && (
        <audio
          key={audioSource}
          autoPlay
          hidden
          onEnded={() => setSpeakingMessageId(null)}
          src={audioSource}
        />
      )}
    </div>
  );
}
