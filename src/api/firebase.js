import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- Firebase and App ID Configuration ---
// Read configuration from environment variables provided by Vite.
// The variable is a string, so we need to parse it into a JavaScript object.
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
export const appId = import.meta.env.VITE_APP_ID;


// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// --- Re-exporting auth methods for use in other parts of the app ---
export { onAuthStateChanged, signInAnonymously, signInWithCustomToken };

// --- Helper Functions ---
export const getUserId = () => auth.currentUser?.uid || 'anonymous';