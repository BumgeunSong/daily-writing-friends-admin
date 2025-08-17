import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getRemoteConfig, fetchAndActivate } from 'firebase/remote-config'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Initialize Remote Config
export const remoteConfig = getRemoteConfig(app)

// Set minimum fetch interval (1 minute for development, 12 hours for production)
remoteConfig.settings.minimumFetchIntervalMillis = 
  process.env.NODE_ENV === 'development' ? 60000 : 43200000

// Set default values
remoteConfig.defaultConfig = {
  active_board_id: '',
  upcoming_board_id: ''
}

// Fetch and activate on initialization
if (typeof window !== 'undefined') {
  fetchAndActivate(remoteConfig).catch(console.error)
}