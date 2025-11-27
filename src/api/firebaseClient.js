import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, writeBatch } from "firebase/firestore";

// TODO: Replace with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

const getCollection = async (collectionName, filters = []) => {
  const collRef = collection(db, collectionName);
  const q = filters.length > 0 ? query(collRef, ...filters.map(f => where(f.field, f.operator, f.value))) : collRef;
  const querySnapshot = await getDocs(q);
  const collectionData = [];
  querySnapshot.forEach((doc) => {
    collectionData.push({ id: doc.id, ...doc.data() });
  });
  return collectionData;
};

const getDocument = async (collectionName, id) => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    console.log("No such document!");
    return null;
  }
};

const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return { id: docRef.id, ...data };
  } catch (e) {
    console.error("Error adding document: ", e);
    return null;
  }
};

const updateDocument = async (collectionName, id, data) => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, data);
};

const deleteDocument = async (collectionName, id) => {
  await deleteDoc(doc(db, collectionName, id));
};

const bulkCreate = async (collectionName, records) => {
    if (!records || records.length === 0) return;
    const batch = writeBatch(db);
    records.forEach((record) => {
        const docRef = doc(collection(db, collectionName)); // Creates a new doc with a random ID
        batch.set(docRef, record);
    });
    await batch.commit();
};

const deleteFilteredDocs = async (collectionName, filters = []) => {
    const docsToDelete = await getCollection(collectionName, filters);
    if (docsToDelete.length === 0) return;

    const batch = writeBatch(db);
    docsToDelete.forEach(record => {
        batch.delete(doc(db, collectionName, record.id));
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
