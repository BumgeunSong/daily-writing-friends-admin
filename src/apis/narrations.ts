import { 
  collection, 
  addDoc, 
  getDocs, 
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy, 
  query,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { 
  ref, 
  uploadBytes, 
  deleteObject
} from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { Narration, NarrationSection } from '@/types/firestore'

// Narration API functions
export const fetchNarrations = async (): Promise<Narration[]> => {
  const narrationsRef = collection(db, 'narrations')
  const q = query(narrationsRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt as Timestamp,
    updatedAt: doc.data().updatedAt as Timestamp,
  })) as Narration[]
}

export const fetchNarration = async (narrationId: string): Promise<Narration | null> => {
  const narrationRef = doc(db, 'narrations', narrationId)
  const snapshot = await getDoc(narrationRef)
  
  if (!snapshot.exists()) {
    return null
  }
  
  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt as Timestamp,
    updatedAt: snapshot.data().updatedAt as Timestamp,
  } as Narration
}

export const createNarration = async (title: string, createdBy: string): Promise<void> => {
  const narrationsRef = collection(db, 'narrations')
  const newNarration = {
    title,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  
  await addDoc(narrationsRef, newNarration)
}

// Section API functions
export const fetchNarrationSections = async (narrationId: string): Promise<NarrationSection[]> => {
  const sectionsRef = collection(db, `narrations/${narrationId}/sections`)
  const q = query(sectionsRef, orderBy('createdAt', 'asc'))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt as Timestamp,
    updatedAt: doc.data().updatedAt as Timestamp,
  })) as NarrationSection[]
}

export const createSection = async (narrationId: string, sectionsCount: number): Promise<void> => {
  const sectionsRef = collection(db, `narrations/${narrationId}/sections`)
  const newSection = {
    title: `섹션 ${sectionsCount + 1}`,
    script: '',
    pauseMinutes: 1,
    storagePath: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  
  await addDoc(sectionsRef, newSection)
}

export interface SectionUpdateData {
  title?: string
  script?: string
  pauseMinutes?: number
}

export const updateSection = async (
  narrationId: string, 
  sectionId: string, 
  data: SectionUpdateData
): Promise<void> => {
  const sectionRef = doc(db, `narrations/${narrationId}/sections/${sectionId}`)
  await updateDoc(sectionRef, {
    ...data,
    updatedAt: serverTimestamp()
  })
}

export const deleteSection = async (narrationId: string, sectionId: string): Promise<void> => {
  // First, try to delete the audio file if it exists
  const storagePath = `narrations/${narrationId}/${sectionId}.mp3`
  const storageRef = ref(storage, storagePath)
  
  try {
    await deleteObject(storageRef)
  } catch (storageError) {
    // File might not exist, continue with section deletion
    console.log('Audio file not found or already deleted:', storageError)
  }

  // Delete the section document
  const sectionRef = doc(db, `narrations/${narrationId}/sections/${sectionId}`)
  await deleteDoc(sectionRef)
}

export const uploadSectionAudio = async (
  narrationId: string,
  sectionId: string, 
  audioBlob: Blob, 
  sectionIndex: number
): Promise<void> => {
  console.log('🎵 Starting audio upload:', { narrationId, sectionId, sectionIndex, blobSize: audioBlob.size })
  
  const storagePath = `narrations/${narrationId}/${sectionIndex}.mp3`
  const storageRef = ref(storage, storagePath)
  
  console.log('📁 Storage path:', storagePath)
  
  // Delete existing file if it exists
  try {
    await deleteObject(storageRef)
    console.log('🗑️ Deleted existing file')
  } catch (error) {
    // File might not exist, continue with upload
    console.log('ℹ️ No existing file to delete:', error)
  }

  // Upload new file
  console.log('⬆️ Uploading audio blob...')
  const uploadResult = await uploadBytes(storageRef, audioBlob)
  console.log('✅ Upload completed:', uploadResult.metadata.fullPath)
  
  // Update section with storage path
  console.log('💾 Updating Firestore with storage path...')
  const sectionRef = doc(db, `narrations/${narrationId}/sections/${sectionId}`)
  await updateDoc(sectionRef, {
    storagePath,
    updatedAt: serverTimestamp()
  })
  console.log('✅ Firestore updated with storagePath:', storagePath)
}