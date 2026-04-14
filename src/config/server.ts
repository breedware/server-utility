import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { database } from "firebase-admin";
 
const app = admin.initializeApp();

export const firestoreDB = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = database();
