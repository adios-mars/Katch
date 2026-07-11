import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCMWsYcfcsRROFN_kZp4KnK_Xnzr00sqpk",
  authDomain: "katch-app-5663b.firebaseapp.com",
  projectId: "katch-app-5663b",
  storageBucket: "katch-app-5663b.firebasestorage.app",
  messagingSenderId: "391369155531",
  appId: "1:391369155531:web:825b1671dbf02f43044c4e"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)