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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, PlusCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from 'date-fns/locale';
import { Transaction } from "@/lib/data";

const formSchema = z.object({
    type: z.enum(['debt', 'loan']),
    creditorName: z.string().min(2, { message: "שם הנושה חייב להכיל לפחות 2 תווים." }),
    description: z.string().optional(),
    amount: z.coerce.number().positive({ message: "הסכום חייב להיות מספר חיובי." }),
    originalAmount: z.coerce.number().positive({ message: "הסכום חייב להיות מספר חיובי." }).optional(),
    startDate: z.date().optional(),
    dueDate: z.date({ required_error: "יש לבחור תאריך יעד." }),
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
    defaultValues: transaction ? (
      {
        ...transaction,
        creditorName: transaction.creditor.name,
        amount: transaction.amount,
        originalAmount: transaction.originalAmount,
        description: transaction.description,
        startDate: transaction.startDate ? new Date(transaction.startDate) : undefined,
        dueDate: new Date(transaction.dueDate),
        interestRate: transaction.interestRate,
        paymentType: transaction.paymentType,
        paymentMethod: transaction.paymentMethod,
        nextPaymentAmount: transaction.nextPaymentAmount,
      }
    ) : {
      type: fixedType || "debt",
      paymentType: 'single',
    },
  });

  const type = form.watch("type");
  const paymentType = form.watch("paymentType");

  React.useEffect(() => {
    if (transaction) {
      form.reset({
        ...transaction,
        creditorName: transaction.creditor.name,
        amount: transaction.amount,
        originalAmount: transaction.originalAmount,
        description: transaction.description,
        startDate: transaction.startDate ? new Date(transaction.startDate) : undefined,
        dueDate: new Date(transaction.dueDate),
        interestRate: transaction.interestRate,
        paymentType: transaction.paymentType,
        paymentMethod: transaction.paymentMethod,
        nextPaymentAmount: transaction.nextPaymentAmount,
      });
    } else {
      form.reset({
        type: fixedType || 'debt',
        paymentType: 'single',
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
      startDate: values.startDate ? format(values.startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(values.dueDate, 'yyyy-MM-dd'),
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
                <FormItem className="flex flex-col pt-2">
                  <FormLabel>תאריך התחלה</FormLabel>
                  <Popover modal={true}>
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
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>בחר תאריך</span>
                          )}
                          <CalendarIcon className="me-auto h-4 w-4" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        locale={he}
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
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                  <FormLabel>{paymentType === 'installments' ? 'תאריך תשלום הבא' : 'תאריך יעד'}</FormLabel>
                   <Popover modal={true}>
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
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>בחר תאריך</span>
                          )}
                          <CalendarIcon className="me-auto h-4 w-4" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        locale={he}
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
