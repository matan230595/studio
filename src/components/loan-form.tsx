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
import { Calendar as CalendarIcon, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Debt } from "@/lib/data";

const formSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("debt"),
    creditorName: z.string().min(2, { message: "שם הנושה חייב להכיל לפחות 2 תווים." }),
    amount: z.coerce.number().positive({ message: "הסכום חייב להיות מספר חיובי." }),
    dueDate: z.date({ required_error: "יש לבחור תאריך יעד." }),
  }),
  z.object({
    type: z.literal("loan"),
    creditorName: z.string().min(2, { message: "שם המלווה חייב להכיל לפחות 2 תווים." }),
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


export function DebtForm({ onFinished, debt }: { onFinished: () => void, debt?: Debt | null }) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: debt ? (
      {
        ...debt,
        dueDate: new Date(debt.dueDate),
        amount: debt.amount || undefined,
        creditorName: debt.creditor.name || "",
        ...(debt.type === 'loan' && {
          paymentType: debt.paymentType,
          interestRate: debt.interestRate ?? 0,
          nextPaymentAmount: debt.nextPaymentAmount || undefined,
        })
      }
    ) : {
      type: "debt",
    },
  });

  const type = form.watch("type");
  const paymentType = form.watch("paymentType");

  React.useEffect(() => {
    if (debt) {
      const defaultValues = {
        ...debt,
        dueDate: new Date(debt.dueDate),
        amount: debt.amount || undefined,
        creditorName: debt.creditor.name || "",
        ...(debt.type === 'loan' ? {
          paymentType: debt.paymentType,
          interestRate: debt.interestRate ?? 0,
          nextPaymentAmount: debt.nextPaymentAmount || undefined,
        } : {})
      };
      // @ts-ignore
      form.reset(defaultValues);
    } else {
      form.reset({
        type: "debt",
        creditorName: "",
        amount: undefined,
        dueDate: undefined,
      });
    }
  }, [debt, form]);
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "הצלחה!",
      description: debt ? "הפרטים עודכנו במערכת." : "הרישום החדש נוסף למערכת.",
    });
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

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
                        // Clear fields that are not shared
                        interestRate: undefined,
                        paymentType: undefined,
                        nextPaymentAmount: undefined,
                    });
                  }}
                  defaultValue={field.value}
                  className="flex space-x-4 space-x-reverse"
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
        
        <FormField
          control={form.control}
          name="creditorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{type === 'loan' ? 'שם המלווה' : 'שם הנושה'}</FormLabel>
              <FormControl>
                <Input placeholder={type === 'loan' ? 'לדוגמה: בנק לאומי, יעקב כהן' : 'לדוגמה: בזק, ועד בית'} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{type === 'loan' ? 'סכום הקרן' : 'סכום החוב'} (₪)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5,000" {...field} />
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
                      <Input type="number" step="0.1" placeholder="0" {...field} />
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
                        <Input type="number" placeholder="500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}
        </div>
        <Button type="submit" className="w-full">
            <PlusCircle className="ms-2 h-4 w-4" />
            {debt ? `עדכן ${debt.type === 'loan' ? 'הלוואה' : 'חוב'}` : 'הוסף למערכת'}
        </Button>
      </form>
    </Form>
  );
}
