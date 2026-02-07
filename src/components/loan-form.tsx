"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const loanFormSchema = z.object({
  borrowerName: z.string().min(2, { message: "שם הלווה חייב להכיל לפחות 2 תווים." }),
  amount: z.coerce.number().positive({ message: "הסכום חייב להיות מספר חיובי." }),
  interestRate: z.coerce.number().min(0, { message: "הריבית לא יכולה להיות שלילית." }),
  loanType: z.string({ required_error: "יש לבחור סוג הלוואה." }),
  paymentDate: z.date({ required_error: "יש לבחור תאריך." }),
});

export function LoanForm({ onFinished }: { onFinished: () => void }) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof loanFormSchema>>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      borrowerName: "",
    },
  });

  function onSubmit(values: z.infer<typeof loanFormSchema>) {
    console.log(values);
    toast({
      title: "הצלחה!",
      description: "ההלוואה החדשה נוספה למערכת.",
    });
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="borrowerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>שם הלווה</FormLabel>
              <FormControl>
                <Input placeholder="לדוגמה: ישראל ישראלי" {...field} />
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
                  <FormLabel>סכום ההלוואה (₪)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="50,000" {...field} />
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
                    <Input type="number" step="0.1" placeholder="3.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="loanType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סוג הלוואה</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר סוג" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="short-term">טווח קצר</SelectItem>
                      <SelectItem value="long-term">טווח ארוך</SelectItem>
                      <SelectItem value="linked">צמודת מדד</SelectItem>
                      <SelectItem value="unlinked">לא צמודה</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                  <FormLabel>תאריך תשלום ראשון</FormLabel>
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
        </div>
        <Button type="submit" className="w-full">
            <PlusCircle className="ms-2 h-4 w-4" />
            הוסף הלוואה
        </Button>
      </form>
    </Form>
  );
}
