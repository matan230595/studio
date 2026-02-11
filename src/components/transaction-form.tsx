
"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PlusCircle } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { format, parse, addMonths } from "date-fns"
import { Transaction } from "@/lib/data"

const dateStringSchema = z
  .string()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, "התאריך חייב להיות בפורמט DD/MM/YYYY")

const optionalNumber = z.coerce.number().positive().optional().or(z.literal("")).transform(v => v === "" ? undefined : v);

const formSchema = z
  .object({
    type: z.enum(["debt", "loan"]),
    // Basic info
    creditorName: z
      .string()
      .min(2, { message: "שם הנושה חייב להכיל לפחות 2 תווים." }),
    description: z.string().optional(),
    amount: z.coerce
      .number()
      .positive({ message: "הסכום חייב להיות מספר חיובי." }),
    startDate: dateStringSchema.optional().or(z.literal("")),
    dueDate: dateStringSchema.min(1, { message: "יש להזין תאריך יעד." }),

    // Creditor Details
    creditorPhone: z.string().optional(),
    creditorEmail: z.string().email({ message: "כתובת אימייל לא תקינה." }).optional().or(z.literal("")),
    accountNumber: z.string().optional(),
    paymentUrl: z.string().url({ message: "כתובת אינטרנט לא תקינה." }).optional().or(z.literal("")),

    // Terms & Classification
    originalAmount: optionalNumber,
    category: z.enum(["דיור", "רכב", "לימודים", "עסק", "אישי", "אחר"]).optional(),
    interestRate: optionalNumber,
    interestType: z.enum(['קבועה', 'משתנה']).optional(),
    lateFee: optionalNumber,
    collateral: z.string().optional(),
    priority: z.enum(['נמוכה', 'בינונית', 'גבוהה']).optional(),
    tags: z.string().optional(),

    // Payment Settings
    paymentType: z.enum(["single", "installments"]),
    numberOfPayments: optionalNumber,
    nextPaymentAmount: optionalNumber,
    paymentMethod: z.enum(["העברה בנקאית", "כרטיס אשראי", "מזומן", "אחר"]).optional(),
    isAutoPay: z.boolean().default(false),
    paymentFrequency: z.enum(['יומי', 'שבועי', 'דו-שבועי', 'חודשי', 'רבעוני', 'שנתי']).optional(),
  })
  .refine(
    data => {
      if (
        data.type === "loan" &&
        data.paymentType === "installments" &&
        (data.nextPaymentAmount === undefined || data.nextPaymentAmount <= 0)
      ) {
        return false
      }
      return true
    },
    {
      message: "יש להזין סכום החזר חודשי עבור הלוואה בתשלומים.",
      path: ["nextPaymentAmount"],
    }
  )

export function TransactionForm({
  onFinished,
  transaction,
  fixedType,
}: {
  onFinished: (transaction: Transaction) => void
  transaction?: Transaction | null
  fixedType?: "debt" | "loan"
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        isAutoPay: false
    }
  })

  const type = form.watch("type")
  const paymentType = form.watch("paymentType")
  const startDate = form.watch("startDate")
  const numberOfPayments = form.watch("numberOfPayments")

  React.useEffect(() => {
    if (paymentType === 'installments' && startDate && numberOfPayments && numberOfPayments > 0) {
        try {
            const parsedStartDate = parse(startDate, 'dd/MM/yyyy', new Date());
            if (!isNaN(parsedStartDate.getTime())) {
                const newDueDate = addMonths(parsedStartDate, numberOfPayments);
                form.setValue('dueDate', format(newDueDate, 'dd/MM/yyyy'), { shouldValidate: true });
            }
        } catch (e) {
            console.error("Could not parse start date to calculate due date:", e);
        }
    }
  }, [startDate, numberOfPayments, paymentType, form]);


  const fromIsoDate = (isoDate: string | undefined | null): string => {
      if (!isoDate) return "";
      try {
        // Handle both yyyy-MM-dd and dd/MM/yyyy inputs gracefully
        if (isoDate.includes('-')) {
            const date = parse(isoDate, 'yyyy-MM-dd', new Date());
            return format(date, 'dd/MM/yyyy');
        }
        return isoDate; // Already in dd/MM/yyyy format
      } catch {
        return isoDate;
      }
  };

  React.useEffect(() => {
    if (transaction) {
      // Explicitly map all fields, converting null to undefined to match the form schema.
      // This is the definitive fix for the build error.
      form.reset({
        type: transaction.type,
        amount: transaction.amount,
        isAutoPay: transaction.isAutoPay,
        paymentType: transaction.paymentType,
        
        // Mapped fields
        creditorName: transaction.creditor.name,
        startDate: fromIsoDate(transaction.startDate),
        dueDate: fromIsoDate(transaction.dueDate),

        // Optional fields: null -> undefined
        creditorPhone: transaction.creditor.phone ?? undefined,
        creditorEmail: transaction.creditor.email ?? undefined,
        description: transaction.description ?? undefined,
        originalAmount: transaction.originalAmount ?? undefined,
        category: transaction.category ?? undefined,
        interestRate: transaction.interestRate ?? undefined,
        interestType: transaction.interestType ?? undefined,
        lateFee: transaction.lateFee ?? undefined,
        collateral: transaction.collateral ?? undefined,
        priority: transaction.priority ?? undefined,
        tags: transaction.tags ?? undefined,
        numberOfPayments: transaction.numberOfPayments ?? undefined,
        nextPaymentAmount: transaction.nextPaymentAmount ?? undefined,
        paymentMethod: transaction.paymentMethod ?? undefined,
        accountNumber: transaction.accountNumber ?? undefined,
        paymentUrl: transaction.paymentUrl ?? undefined,
        paymentFrequency: transaction.paymentFrequency ?? undefined,
      });
    } else {
      const defaultDueDate = new Date()
      defaultDueDate.setMonth(defaultDueDate.getMonth() + 1)

      form.reset({
        type: fixedType || "debt",
        paymentType: "single",
        startDate: format(new Date(), "dd/MM/yyyy"),
        dueDate: format(defaultDueDate, "dd/MM/yyyy"),
        isAutoPay: false,
        // Reset all other fields to empty/undefined
        creditorName: "",
        amount: undefined,
        description: "",
        originalAmount: undefined,
        interestRate: undefined,
        nextPaymentAmount: undefined,
        numberOfPayments: undefined,
        creditorPhone: "",
        creditorEmail: "",
        accountNumber: "",
        paymentUrl: "",
        category: undefined,
        interestType: undefined,
        lateFee: undefined,
        collateral: "",
        paymentFrequency: "חודשי",
        priority: "בינונית",
        tags: "",
        paymentMethod: undefined,
      })
    }
  }, [transaction, fixedType, form])

  function onSubmit(values: z.infer<typeof formSchema>) {
     const toIsoDate = (dmyDate: string | undefined): string | undefined => {
        if (!dmyDate) return undefined;
        try {
            const date = parse(dmyDate, 'dd/MM/yyyy', new Date());
            return format(date, 'yyyy-MM-dd');
        } catch {
            return undefined;
        }
    }

    const isoStartDate = toIsoDate(values.startDate);
    const isoDueDate = toIsoDate(values.dueDate);
    
    if (!isoDueDate) {
      console.error("Due date is invalid");
      return;
    }

    const newOrUpdatedTransaction: Transaction = {
      id:
        transaction?.id || `${values.type.charAt(0).toUpperCase()}${Date.now()}`,
      status: transaction?.status || "active",
      creditor: {
        name: values.creditorName,
        phone: values.creditorPhone || null,
        email: values.creditorEmail || null
      },
      type: values.type,
      amount: values.amount,
      originalAmount: values.originalAmount ?? null,
      description: values.description || null,
      startDate: isoStartDate || format(new Date(), 'yyyy-MM-dd'),
      dueDate: isoDueDate,
      paymentType: values.paymentType,
      paymentMethod: values.paymentMethod || null,
      interestRate: values.interestRate ?? null,
      nextPaymentAmount: values.nextPaymentAmount ?? null,
      numberOfPayments: values.numberOfPayments ?? null,
      accountNumber: values.accountNumber || null,
      paymentUrl: values.paymentUrl || null,
      category: (values.category as Transaction['category']) || null,
      interestType: (values.interestType as Transaction['interestType']) || null,
      lateFee: values.lateFee ?? null,
      collateral: values.collateral || null,
      isAutoPay: values.isAutoPay,
      paymentFrequency: (values.paymentFrequency as Transaction['paymentFrequency']) || null,
      priority: (values.priority as Transaction['priority']) || null,
      tags: values.tags || null,
    }
    onFinished(newOrUpdatedTransaction)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        {!fixedType && (
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>סוג</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={value => {
                      field.onChange(value)
                    }}
                    value={field.value}
                    className="flex space-x-4 space-x-reverse"
                    dir="rtl"
                    disabled={!!transaction}
                  >
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                      <FormControl>
                        <RadioGroupItem value="debt" id="debt" />
                      </FormControl>
                      <FormLabel htmlFor="debt" className="font-normal">
                        חוב
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                      <FormControl>
                        <RadioGroupItem value="loan" id="loan" />
                      </FormControl>
                      <FormLabel htmlFor="loan" className="font-normal">
                        הלוואה
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>פרטים בסיסיים</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="creditorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {type === "loan" ? "שם המלווה" : "שם הנושה"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            type === "loan"
                              ? "לדוגמה: בנק לאומי, יעקב כהן"
                              : "לדוגמה: בזק, ועד בית"
                          }
                          {...field}
                          value={field.value ?? ""}
                        />
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
                        <Textarea
                          placeholder="פרטים נוספים על ההתחייבות..."
                          {...field}
                           value={field.value ?? ""}
                           className="text-sm"
                        />
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
                        <FormLabel>
                          {type === "loan" ? "סכום נותר" : "סכום החוב"} (₪)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="5,000"
                            {...field}
                             value={field.value ?? ""}
                             className="text-sm"
                          />
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
                          <Input
                            type="number"
                            placeholder="5,000"
                            {...field}
                             value={field.value ?? ""}
                             className="text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>תאריך התחלה</FormLabel>
                            <FormControl>
                            <Input
                                placeholder="DD/MM/YYYY"
                                {...field}
                                value={field.value ?? ""}
                                className="text-sm"
                            />
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
                            <FormLabel>תאריך יעד / תשלום הבא</FormLabel>
                            <FormControl>
                            <Input
                                placeholder="DD/MM/YYYY"
                                {...field}
                                value={field.value ?? ""}
                                className="text-sm"
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger>פרטי נושה (מורחב)</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                 <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>מספר חשבון / אסמכתא</FormLabel>
                      <FormControl><Input placeholder="123-456789" {...field} value={field.value ?? ""} className="text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                    control={form.control}
                    name="creditorPhone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>טלפון ליצירת קשר</FormLabel>
                        <FormControl><Input type="tel" placeholder="050-1234567" {...field} value={field.value ?? ""} className="text-sm" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="creditorEmail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>אימייל ליצירת קשר</FormLabel>
                        <FormControl><Input type="email" placeholder="contact@example.com" {...field} value={field.value ?? ""} className="text-sm" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <FormField
                  control={form.control}
                  name="paymentUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>קישור לתשלום</FormLabel>
                      <FormControl><Input type="url" placeholder="https://example.com/pay" {...field} value={field.value ?? ""} className="text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </AccordionContent>
          </AccordionItem>

           <AccordionItem value="item-3">
            <AccordionTrigger>תנאים וסיווג</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                     <FormField
                        control={form.control}
                        name="interestRate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>ריבית שנתית (%)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.1" placeholder="0" {...field} value={field.value ?? ""} className="text-sm" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="interestType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>סוג ריבית</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                <FormControl><SelectTrigger><SelectValue placeholder="בחר סוג" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="קבועה">קבועה</SelectItem>
                                    <SelectItem value="משתנה">משתנה</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                 <FormField
                  control={form.control}
                  name="lateFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>עמלת פיגורים (₪)</FormLabel>
                      <FormControl><Input type="number" placeholder="50" {...field} value={field.value ?? ""} className="text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="collateral"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>בטחונות</FormLabel>
                      <FormControl><Input placeholder="לדוגמה: רכב, דירה" {...field} value={field.value ?? ""} className="text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                     <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>קטגוריה</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                <FormControl><SelectTrigger><SelectValue placeholder="בחר קטגוריה" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="דיור">דיור</SelectItem>
                                    <SelectItem value="רכב">רכב</SelectItem>
                                    <SelectItem value="לימודים">לימודים</SelectItem>
                                    <SelectItem value="עסק">עסק</SelectItem>
                                    <SelectItem value="אישי">אישי</SelectItem>
                                    <SelectItem value="אחר">אחר</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>עדיפות</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                <FormControl><SelectTrigger><SelectValue placeholder="בחר עדיפות" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="נמוכה">נמוכה</SelectItem>
                                    <SelectItem value="בינונית">בינונית</SelectItem>
                                    <SelectItem value="גבוהה">גבוהה</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                 <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>תגיות (מופרדות בפסיק)</FormLabel>
                      <FormControl><Input placeholder="חשבונות, אישי, לטיפול..." {...field} value={field.value ?? ""} className="text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>הגדרות תשלום</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
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
                            dir="rtl"
                            >
                            <FormItem className="flex items-center space-x-2 space-x-reverse">
                                <FormControl><RadioGroupItem value="single" id="single" /></FormControl>
                                <FormLabel htmlFor="single" className="font-normal">תשלום חד פעמי</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-x-reverse">
                                <FormControl><RadioGroupItem value="installments" id="installments" /></FormControl>
                                <FormLabel htmlFor="installments" className="font-normal">תשלומים</FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    {paymentType === "installments" && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                        control={form.control}
                        name="nextPaymentAmount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>החזר חודשי (₪)</FormLabel>
                            <FormControl><Input type="number" placeholder="500" {...field} value={field.value ?? ""} className="text-sm" /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="numberOfPayments"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>מספר תשלומים</FormLabel>
                            <FormControl><Input type="number" placeholder="12" {...field} value={field.value ?? ""} className="text-sm" /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    )}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>אמצעי תשלום</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                <FormControl><SelectTrigger><SelectValue placeholder="בחר אמצעי תשלום" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="העברה בנקאית">העברה בנקאית</SelectItem>
                                    <SelectItem value="כרטיס אשראי">כרטיס אשראי</SelectItem>
                                    <SelectItem value="מזומן">מזומן</SelectItem>
                                    <SelectItem value="אחר">אחר</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                            control={form.control}
                            name="paymentFrequency"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>תדירות תשלום</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                    <FormControl><SelectTrigger><SelectValue placeholder="בחר תדירות" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="יומי">יומי</SelectItem>
                                        <SelectItem value="שבועי">שבועי</SelectItem>
                                        <SelectItem value="דו-שבועי">דו-שבועי</SelectItem>
                                        <SelectItem value="חודשי">חודשי</SelectItem>
                                        <SelectItem value="רבעוני">רבעוני</SelectItem>
                                        <SelectItem value="שנתי">שנתי</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    </div>
                    <FormField
                        control={form.control}
                        name="isAutoPay"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-end space-x-3 space-y-0 rounded-md border p-4 space-x-reverse">
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none text-right">
                                <FormLabel>תשלום אוטומטי (הוראת קבע)</FormLabel>
                            </div>
                           
                            </FormItem>
                        )}
                    />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button type="submit" className="w-full">
          <PlusCircle className="ms-2 h-4 w-4" />
          {transaction
            ? `עדכן ${transaction.type === "loan" ? "הלוואה" : "חוב"}`
            : `הוסף ${type === "loan" ? "הלוואה" : "חוב"}`}
        </Button>
      </form>
    </Form>
  )
}
