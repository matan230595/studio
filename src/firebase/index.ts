'use client';

import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';

export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
export { firebaseApp } from '@/lib/firebase';
