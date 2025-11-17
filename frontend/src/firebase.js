import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// Only use analytics if you really need it
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAc2DcOvickOJlyib6IuZGBInE3g8r9880",
  authDomain: "rishe-store.firebaseapp.com",
  projectId: "rishe-store",
  storageBucket: "rishe-store.firebasestorage.app",
  messagingSenderId: "705418646561",
  appId: "1:705418646561:web:3e9c8cc7005e557087bf60",
  // measurementId is not required for auth
  // measurementId: "G-57CQW0D6NK"
};

const app = initializeApp(firebaseConfig);

// If you really want analytics and you're in browser-only CRA:
 // const analytics = getAnalytics(app);

export const auth = getAuth(app);
export default app;
