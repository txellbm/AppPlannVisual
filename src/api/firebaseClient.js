
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, writeBatch } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBmRN67ntRZuYvuBEX3y1BXuNgC9_C1qkY",
  authDomain: "plann-visual-web.firebaseapp.com",
  projectId: "plann-visual-web",
  storageBucket: "plann-visual-web.appspot.com",
  messagingSenderId: "696666638120",
  appId: "1:696666638120:web:b73fa3e1dc2d63c640f21d",
  measurementId: "G-C8LLYW4C5F"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getCollection(collectionName, filters = []) {
  let q = collection(db, collectionName);
  if (filters.length > 0) {
    const whereClauses = filters.map(f => where(f.field, f.operator, f.value));
    q = query(q, ...whereClauses);
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getDocument(collectionName, id) {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

async function addDocument(collectionName, data) {
  const docRef = await addDoc(collection(db, collectionName), data);
  return docRef.id;
}

async function updateDocument(collectionName, id, data) {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, data);
}

async function deleteDocument(collectionName, id) {
  await deleteDoc(doc(db, collectionName, id));
}

async function bulkCreate(collectionName, records) {
  if (!records || records.length === 0) return;
  const batch = writeBatch(db);
  const collectionRef = collection(db, collectionName);
  records.forEach(record => {
    const docRef = doc(collectionRef);
    batch.set(docRef, record);
  });
  await batch.commit();
}

async function deleteFilteredDocs(collectionName, filters = []) {
    if (filters.length === 0) {
        console.warn(`Esborrat de col·lecció sencera ${collectionName} previngut. Cal un filtre.`);
        return;
    }
    const docsToDelete = await getCollection(collectionName, filters);
    if (docsToDelete.length === 0) return;

    const batch = writeBatch(db);
    docsToDelete.forEach(d => {
        const docRef = doc(db, collectionName, d.id);
        batch.delete(docRef);
    });
    await batch.commit();
}

export const firebaseClient = {
  getCollection,
  getDocument,
  addDocument,
  updateDocument,
  deleteDocument,
  bulkCreate,
  deleteFilteredDocs,
};
