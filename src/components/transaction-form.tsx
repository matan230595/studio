"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, PlusCircle, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Transaction } from "@/lib/data";
import { generateImage } from "@/ai/flows/generate-image-flow";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("debt"),
    creditorName: z.string().min(2, { message: "שם הנושה חייב להכיל לפחות 2 תווים." }),
    creditorAvatar: z.string().min(1, { message: "יש לבחור או ליצור תמונה." }),
    amount: z.coerce.number().positive({ message: "הסכום חייב להיות מספר חיובי." }),
    dueDate: z.date({ required_error: "יש לבחור תאריך יעד." }),
    paymentType: z.enum(['single', 'installments']),
  }),
  z.object({
    type: z.literal("loan"),
    creditorName: z.string().min(2, { message: "שם המלווה חייב להכיל לפחות 2 תווים." }),
    creditorAvatar: z.string().min(1, { message: "יש לבחור או ליצור תמונה." }),
    amount: z.coerce.number().positive({ message: "סכום הקרן חייב להיות מספר חיובי." }),
    interestRate: z.coerce.number().min(0, { message: "הריבית לא יכולה להיות שלילית." }).optional(),
    paymentType: z.enum(['single', 'installments'], { required_error: 'יש לבחור אופן תשלום.'}),
    nextPaymentAmount: z.coerce.number().positive().optional(),
    dueDate: z.date({ required_error: "יש לבחור תאריך יעד/תשלום הבא." }),
  })
]).refine(data => {
    if (data.type === 'loan' && data.paymentType === 'installments' && (data.nextPaymentAmount === undefined || data.nextPaymentAmount <= 0)) {
        return false;
    }
    return true;
}, {
    message: "יש להזין סכום החזר חודשי עבור הלוואה בתשלומים.",
    path: ["nextPaymentAmount"],
});


export function TransactionForm({ onFinished, transaction, fixedType }: { onFinished: (transaction: Transaction) => void, transaction?: Transaction | null, fixedType?: 'debt' | 'loan' }) {
  
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationPrompt, setGenerationPrompt] = React.useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: transaction ? (
      {
        ...transaction,
        dueDate: new Date(transaction.dueDate),
        amount: transaction.amount ?? undefined,
        creditorName: transaction.creditor.name ?? "",
        creditorAvatar: transaction.creditor.avatar ?? "",
        ...(transaction.type === 'loan' && {
          paymentType: transaction.paymentType,
          interestRate: transaction.interestRate ?? 0,
          nextPaymentAmount: transaction.nextPaymentAmount ?? undefined,
        })
      }
    ) : {
      type: fixedType || "debt",
      paymentType: 'single',
      creditorAvatar: "avatar1",
    },
  });

  const type = form.watch("type");
  const paymentType = form.watch("paymentType");

  const handleGenerateAvatar = async () => {
    if (!generationPrompt) return;
    setIsGenerating(true);
    try {
        const result = await generateImage({ prompt: generationPrompt });
        form.setValue('creditorAvatar', result.imageDataUri, { shouldValidate: true });
    } catch (error) {
        console.error("Avatar generation failed", error);
        // TODO: Show toast on error
    } finally {
        setIsGenerating(false);
    }
  }


  React.useEffect(() => {
    if (transaction) {
      const defaultValues = {
        ...transaction,
        dueDate: new Date(transaction.dueDate),
        amount: transaction.amount ?? undefined,
        creditorName: transaction.creditor.name ?? "",
        creditorAvatar: transaction.creditor.avatar ?? "",
        ...(transaction.type === 'loan' ? {
          paymentType: transaction.paymentType,
          interestRate: transaction.interestRate ?? 0,
          nextPaymentAmount: transaction.nextPaymentAmount ?? undefined,
        } : { paymentType: transaction.paymentType || 'single'})
      };
      // @ts-ignore
      form.reset(defaultValues);
    } else {
      form.reset({
        type: fixedType || 'debt',
        creditorName: "",
        creditorAvatar: "avatar1",
        amount: undefined,
        dueDate: undefined,
        paymentType: fixedType === 'loan' ? undefined : 'single',
        interestRate: undefined,
        nextPaymentAmount: undefined,
      });
    }
  }, [transaction, fixedType, form.reset]);
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    const newOrUpdatedTransaction: Transaction = {
      id: transaction?.id || `${values.type.charAt(0).toUpperCase()}${Date.now()}`,
      status: transaction?.status || 'active',
      creditor: {
        name: values.creditorName,
        avatar: values.creditorAvatar,
      },
      dueDate: format(values.dueDate, 'yyyy-MM-dd'),
      type: values.type,
      amount: values.amount,
      paymentType: values.type === 'loan' ? values.paymentType : 'single',
      ...(values.type === 'loan' && {
        interestRate: values.interestRate,
        nextPaymentAmount: values.nextPaymentAmount
      })
    };
    onFinished(newOrUpdatedTransaction);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {!fixedType && (
            <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem className="space-y-3">
                <FormLabel>סוג</FormLabel>
                <FormControl>
                    <RadioGroup
                    onValueChange={(value) => {
                        field.onChange(value);
                        const currentValues = form.getValues();
                        form.reset({
                            ...currentValues,
                            type: value as 'debt' | 'loan',
                            paymentType: value === 'debt' ? 'single' : currentValues.paymentType,
                            interestRate: undefined,
                            nextPaymentAmount: undefined,
                        });
                    }}
                    defaultValue={field.value}
                    className="flex space-x-4 space-x-reverse"
                    disabled={!!transaction}
                    >
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                        <FormControl>
                        <RadioGroupItem value="debt" id="debt" />
                        </FormControl>
                        <FormLabel htmlFor="debt" className="font-normal">חוב</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                        <FormControl>
                        <RadioGroupItem value="loan" id="loan" />
                        </FormControl>
                        <FormLabel htmlFor="loan" className="font-normal">הלוואה</FormLabel>
                    </FormItem>
                    </RadioGroup>
                </FormControl>
                <FormDescription>
                    {type === 'debt' ? 'חוב עבור שירות, מוצר או חשבון.' : 'הלוואה היא כסף שלווית ותצטרך להחזיר, לעתים קרובות עם ריבית.'}
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
        )}
        
        <FormField
          control={form.control}
          name="creditorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{type === 'loan' ? 'שם המלווה' : 'שם הנושה'}</FormLabel>
              <FormControl>
                <Input placeholder={type === 'loan' ? 'לדוגמה: בנק לאומי, יעקב כהן' : 'לדוגמה: בזק, ועד בית'} {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="creditorAvatar"
          render={({ field }) => (
          <FormItem>
              <FormLabel>תמונת נושה</FormLabel>
              <FormDescription>בחר תמונה קיימת או צור אחת חדשה בעזרת AI.</FormDescription>
              <div className="flex items-center gap-4 pt-2">
                  <Avatar className="h-20 w-20 ring-2 ring-primary ring-offset-2 flex-shrink-0">
                      <AvatarImage src={getAvatarUrl(field.value)} />
                      <AvatarFallback><Wand2 /></AvatarFallback>
                  </Avatar>
                  <ScrollArea className="h-24 w-full">
                      <div className="flex space-x-4 space-x-reverse pb-4">
                          {PlaceHolderImages.map(img => (
                              <Avatar 
                                  key={img.id}
                                  className={cn(
                                      "h-20 w-20 cursor-pointer ring-2 ring-transparent transition-all hover:ring-primary flex-shrink-0",
                                      field.value === img.id && "ring-primary"
                                  )}
                                  onClick={() => field.onChange(img.id)}
                              >
                                  <AvatarImage src={img.imageUrl} alt={img.description} />
                                  <AvatarFallback>{img.id.charAt(0)}</AvatarFallback>
                              </Avatar>
                          ))}
                      </div>
                  </ScrollArea>
              </div>
              <FormMessage />
          </FormItem>
          )}
        />

        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Input 
                    placeholder="יצירת תמונה עם AI, לדוגמה: בניין דירות מודרני"
                    value={generationPrompt}
                    onChange={(e) => setGenerationPrompt(e.target.value)}
                />
                <Button type="button" onClick={handleGenerateAvatar} disabled={isGenerating || !generationPrompt}>
                    {isGenerating ? <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Wand2 />}
                    <span className="ms-2 hidden sm:inline">{isGenerating ? "יוצר..." : "צור"}</span>
                </Button>
            </div>
        </div>


        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{type === 'loan' ? 'סכום הקרן' : 'סכום החוב'} (₪)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5,000" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {type === 'loan' && (
              <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ריבית שנתית (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="0" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
        </div>

        {type === 'loan' && (
          <FormField
            control={form.control}
            name="paymentType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>אופן תשלום</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4 space-x-reverse"
                  >
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                      <FormControl>
                        <RadioGroupItem value="single" id="single" />
                      </FormControl>
                      <FormLabel htmlFor="single" className="font-normal">תשלום חד פעמי</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                      <FormControl>
                        <RadioGroupItem value="installments" id="installments" />
                      </FormControl>
                      <FormLabel htmlFor="installments" className="font-normal">תשלומים</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                  <FormLabel>{type === 'loan' && paymentType === 'installments' ? 'תאריך תשלום הבא' : 'תאריך יעד'}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-right font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>בחר תאריך</span>
                          )}
                          <CalendarIcon className="me-auto h-4 w-4" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            {type === 'loan' && paymentType === 'installments' && (
                <FormField
                  control={form.control}
                  name="nextPaymentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>החזר חודשי (₪)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="500" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}
        </div>
        <Button type="submit" className="w-full">
            <PlusCircle className="ms-2 h-4 w-4" />
            {transaction ? `עדכן ${transaction.type === 'loan' ? 'הלוואה' : 'חוב'}` : `הוסף ${type === 'loan' ? 'הלוואה' : 'חוב'}`}
        </Button>
      </form>
    </Form>
  );
}
