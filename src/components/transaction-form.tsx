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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Transaction } from "@/lib/data";

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "התאריך חייב להיות בפורמט YYYY-MM-DD");

const formSchema = z.object({
    type: z.enum(['debt', 'loan']),
    creditorName: z.string().min(2, { message: "שם הנושה חייב להכיל לפחות 2 תווים." }),
    description: z.string().optional(),
    amount: z.coerce.number().positive({ message: "הסכום חייב להיות מספר חיובי." }),
    originalAmount: z.coerce.number().positive({ message: "הסכום חייב להיות מספר חיובי." }).optional(),
    startDate: dateStringSchema.optional().or(z.literal('')),
    dueDate: dateStringSchema.min(1, { message: "יש לבחור תאריך יעד." }),
    interestRate: z.coerce.number().min(0, { message: "הריבית לא יכולה להיות שלילית." }).optional(),
    paymentType: z.enum(['single', 'installments']),
    nextPaymentAmount: z.coerce.number().positive().optional(),
    paymentMethod: z.string().optional(),
}).refine(data => {
    if (data.type === 'loan' && data.paymentType === 'installments' && (data.nextPaymentAmount === undefined || data.nextPaymentAmount <= 0)) {
        return false;
    }
    return true;
}, {
    message: "יש להזין סכום החזר חודשי עבור הלוואה בתשלומים.",
    path: ["nextPaymentAmount"],
});


export function TransactionForm({ onFinished, transaction, fixedType }: { onFinished: (transaction: Transaction) => void, transaction?: Transaction | null, fixedType?: 'debt' | 'loan' }) {
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const type = form.watch("type");
  const paymentType = form.watch("paymentType");

  React.useEffect(() => {
    if (transaction) {
      form.reset({
        ...transaction,
        creditorName: transaction.creditor.name,
      });
    } else {
        const defaultDueDate = new Date();
        defaultDueDate.setMonth(defaultDueDate.getMonth() + 1);

      form.reset({
        type: fixedType || 'debt',
        creditorName: '',
        description: '',
        amount: undefined,
        originalAmount: undefined,
        interestRate: undefined,
        paymentType: 'single',
        nextPaymentAmount: undefined,
        paymentMethod: undefined,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(defaultDueDate, 'yyyy-MM-dd'),
      });
    }
  }, [transaction, fixedType, form]);
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    const newOrUpdatedTransaction: Transaction = {
      id: transaction?.id || `${values.type.charAt(0).toUpperCase()}${Date.now()}`,
      status: transaction?.status || 'active',
      creditor: {
        name: values.creditorName,
      },
      type: values.type,
      amount: values.amount,
      originalAmount: values.originalAmount || values.amount,
      description: values.description,
      startDate: values.startDate || format(new Date(), 'yyyy-MM-dd'),
      dueDate: values.dueDate,
      paymentType: values.paymentType,
      paymentMethod: values.paymentMethod,
      interestRate: values.interestRate,
      nextPaymentAmount: values.nextPaymentAmount
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
                        form.reset({
                            ...form.getValues(),
                            type: value as 'debt' | 'loan',
                            paymentType: value === 'debt' ? 'single' : 'single',
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>תיאור (אופציונלי)</FormLabel>
              <FormControl>
                <Textarea placeholder="פרטים נוספים על ההתחייבות..." {...field} value={field.value ?? ''} />
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
                  <FormLabel>{type === 'loan' ? 'סכום נותר לתשלום' : 'סכום החוב'} (₪)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5,000" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="originalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סכום מקורי (אופציונלי)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5,000" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        {type === 'loan' && (
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            </div>
        )}

        <FormField
            control={form.control}
            name="paymentType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>אופן תשלום</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
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
        
        {paymentType === 'installments' && (
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
           <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תאריך התחלה</FormLabel>
                  <FormControl>
                    <Input placeholder="YYYY-MM-DD" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{paymentType === 'installments' ? 'תאריך תשלום הבא' : 'תאריך יעד'}</FormLabel>
                   <FormControl>
                    <Input placeholder="YYYY-MM-DD" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
            <FormItem>
                <FormLabel>אמצעי תשלום</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger>
                    <SelectValue placeholder="בחר אמצעי תשלום" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    <SelectItem value="Bank Transfer">העברה בנקאית</SelectItem>
                    <SelectItem value="Credit Card">כרטיס אשראי</SelectItem>
                    <SelectItem value="Cash">מזומן</SelectItem>
                    <SelectItem value="Other">אחר</SelectItem>
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />
        <Button type="submit" className="w-full">
            <PlusCircle className="ms-2 h-4 w-4" />
            {transaction ? `עדכן ${transaction.type === 'loan' ? 'הלוואה' : 'חוב'}` : `הוסף ${type === 'loan' ? 'הלוואה' : 'חוב'}`}
        </Button>
      </form>
    </Form>
  );
}
