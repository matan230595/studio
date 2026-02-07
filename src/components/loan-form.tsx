"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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

const debtFormSchema = z.object({
  creditorName: z.string().min(2, { message: "שם הנושה חייב להכיל לפחות 2 תווים." }),
  amount: z.coerce.number().positive({ message: "הסכום חייב להיות מספר חיובי." }),
  interestRate: z.coerce.number().min(0, { message: "הריבית לא יכולה להיות שלילית." }),
  dueDate: z.date({ required_error: "יש לבחור תאריך." }),
  paymentType: z.enum(['single', 'installments'], { required_error: 'יש לבחור אופן תשלום.'}),
  nextPaymentAmount: z.coerce.number().positive().optional(),
})
.refine(data => {
    if (data.paymentType === 'installments' && (data.nextPaymentAmount === undefined || data.nextPaymentAmount <= 0)) {
        return false;
    }
    return true;
}, {
    message: "יש להזין סכום החזר חודשי עבור תשלומים.",
    path: ["nextPaymentAmount"],
});


export function DebtForm({ onFinished, debt }: { onFinished: () => void, debt?: Debt | null }) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof debtFormSchema>>({
    resolver: zodResolver(debtFormSchema),
    defaultValues: {
      creditorName: "",
      paymentType: "single",
    },
  });

  const paymentType = form.watch("paymentType");

  React.useEffect(() => {
    if (debt) {
      form.reset({
        creditorName: debt.creditor.name,
        amount: debt.amount,
        interestRate: debt.interestRate,
        dueDate: debt.dueDate !== '-' ? new Date(debt.dueDate) : new Date(),
        paymentType: debt.paymentType,
        nextPaymentAmount: debt.nextPaymentAmount,
      });
    } else {
      form.reset({
        creditorName: "",
        amount: undefined,
        interestRate: undefined,
        dueDate: undefined,
        paymentType: "single",
        nextPaymentAmount: undefined,
      });
    }
  }, [debt, form]);


  function onSubmit(values: z.infer<typeof debtFormSchema>) {
    console.log(values);
    toast({
      title: "הצלחה!",
      description: debt ? "החוב עודכן במערכת." : "החוב החדש נוסף למערכת.",
    });
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="creditorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>שם הנושה</FormLabel>
              <FormControl>
                <Input placeholder="לדוגמה: בזק, יעקב כהן" {...field} />
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
                  <FormLabel>סכום החוב (₪)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5,000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
        </div>

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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                  <FormLabel>תאריך יעד לתשלום</FormLabel>
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
            {paymentType === 'installments' && (
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
            {debt ? 'עדכן חוב' : 'הוסף חוב'}
        </Button>
      </form>
    </Form>
  );
}
