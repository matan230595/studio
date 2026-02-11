
'use client';

import type { Transaction } from './data';
import { format, parse } from 'date-fns';

// Define a strict list of allowed payment methods and a corresponding type.
export const PAYMENT_METHODS = ["העברה בנקאית", "כרטיס אשראי", "מזומן", "אחר"] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

/**
 * Type guard to check if a value is a valid PaymentMethod.
 * @param value The value to check.
 * @returns True if the value is a valid PaymentMethod.
 */
function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(value as string);
}

/**
 * Converts any given value to a valid PaymentMethod or returns undefined if invalid.
 * This ensures that only allowed string values are passed to the form.
 * @param value The raw value from the database.
 * @returns A valid PaymentMethod or undefined.
 */
function toPaymentMethod(value: unknown): PaymentMethod | undefined {
  if (isPaymentMethod(value)) {
    return value;
  }
  return undefined;
}

/**
 * A generic helper function that converts a null value to undefined.
 * This is crucial for matching the form's expectation for optional fields.
 * @param value The input value, which can be of any type, or null.
 * @returns The original value or undefined if the input was null.
 */
function normalizeNullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null ? undefined : value;
}

/**
 * Converts a date string from ISO format (YYYY-MM-DD) or other formats
 * to the form's required format (DD/MM/YYYY). Returns undefined if the date is invalid.
 * @param isoDate The date string from the database.
 * @returns A formatted date string or undefined.
 */
const fromIsoDate = (isoDate: string | null | undefined): string | undefined => {
    if (!isoDate) return undefined;
    try {
        // Attempt to parse from ISO format (YYYY-MM-DD)
        const dateFromIso = parse(isoDate, 'yyyy-MM-dd', new Date());
        if (!isNaN(dateFromIso.getTime())) {
            return format(dateFromIso, 'dd/MM/yyyy');
        }
        // If that fails, it might already be in the target format (DD/MM/YYYY)
        const dateFromDmy = parse(isoDate, 'dd/MM/yyyy', new Date());
        if (!isNaN(dateFromDmy.getTime())) {
            return isoDate;
        }
        return undefined; // Return undefined if parsing fails for both formats
    } catch {
        return undefined;
    }
};

/**
 * The main mapping function. Takes a raw Transaction object from Firestore
 * and transforms it into a clean, type-safe object that the form expects as default values.
 * @param transaction The raw transaction object from Firestore.
 * @returns An object ready to be used with form.reset() or as defaultValues.
 */
export function mapTransactionToFormDefaults(transaction: Transaction) {
  return {
    // Main details
    type: transaction.type,
    creditorName: transaction.creditor.name,
    description: normalizeNullToUndefined(transaction.description),
    amount: transaction.amount,
    startDate: fromIsoDate(transaction.startDate),
    dueDate: fromIsoDate(transaction.dueDate)!, // Due date is required, so we assert it's not undefined

    // Creditor Details
    creditorPhone: normalizeNullToUndefined(transaction.creditor.phone),
    creditorEmail: normalizeNullToUndefined(transaction.creditor.email),
    accountNumber: normalizeNullToUndefined(transaction.accountNumber),
    paymentUrl: normalizeNullToUndefined(transaction.paymentUrl),

    // Terms & Classification
    originalAmount: normalizeNullToUndefined(transaction.originalAmount),
    category: normalizeNullToUndefined(transaction.category),
    interestRate: normalizeNullToUndefined(transaction.interestRate),
    interestType: normalizeNullToUndefined(transaction.interestType),
    lateFee: normalizeNullToUndefined(transaction.lateFee),
    collateral: normalizeNullToUndefined(transaction.collateral),
    priority: normalizeNullToUndefined(transaction.priority),
    tags: normalizeNullToUndefined(transaction.tags),
    
    // Payment Settings
    paymentType: transaction.paymentType,
    numberOfPayments: normalizeNullToUndefined(transaction.numberOfPayments),
    nextPaymentAmount: normalizeNullToUndefined(transaction.nextPaymentAmount),
    paymentMethod: toPaymentMethod(transaction.paymentMethod),
    isAutoPay: transaction.isAutoPay,
    paymentFrequency: normalizeNullToUndefined(transaction.paymentFrequency),
  };
}
