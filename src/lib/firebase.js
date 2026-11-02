import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase web config is public by design - access is limited by the
// project's Firebase rules and authorized domains, not by hiding these values
const firebaseConfig = {
  apiKey: "AIzaSyBygOpzBgAL_C8hR63ZrHhevtk8OBG5Iws",
  authDomain: "tunduk-ai.firebaseapp.com",
  projectId: "tunduk-ai",
  storageBucket: "tunduk-ai.firebasestorage.app",
  messagingSenderId: "781208825003",
  appId: "1:781208825003:web:3b8775a2e1eb0dc4711bee",
  measurementId: "G-99V725GS15",
};

export const app = initializeApp(firebaseConfig);

// Analytics throws in unsupported environments (some in-app browsers,
// blocked cookies/IndexedDB), so only start it where it works
export const analyticsPromise = isSupported()
  .then((supported) => (supported ? getAnalytics(app) : null))
  .catch(() => null);
