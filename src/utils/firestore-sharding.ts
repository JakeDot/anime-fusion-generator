import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const SHARD_SIZE = 800 * 1024; // 800KB to stay safely under the 1MB limit

export async function saveShardedImage(collectionName: string, metadata: any, base64String: string): Promise<string> {
  // 1. Create the main document
  const docRef = await addDoc(collection(db, collectionName), {
    ...metadata,
    isSharded: true,
    createdAt: serverTimestamp(),
  });

  // 2. Split the base64 string
  const shards = [];
  for (let i = 0; i < base64String.length; i += SHARD_SIZE) {
    shards.push(base64String.substring(i, i + SHARD_SIZE));
  }

  // 3. Save shards in a subcollection
  const shardsRef = collection(db, `${collectionName}/${docRef.id}/shards`);
  for (let i = 0; i < shards.length; i++) {
    await setDoc(doc(shardsRef, i.toString()), {
      index: i,
      data: shards[i]
    });
  }

  // 4. Update main document with shard count
  await setDoc(docRef, { shardCount: shards.length }, { merge: true });

  return docRef.id;
}

export async function loadShardedImage(collectionName: string, docId: string): Promise<any> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Document not found");
  }

  const data = docSnap.data();

  if (!data.isSharded) {
    return data; // Backward compatibility for un-sharded images
  }

  const shardsRef = collection(db, `${collectionName}/${docId}/shards`);
  const q = query(shardsRef, orderBy('index'));
  const querySnapshot = await getDocs(q);

  let base64String = "";
  querySnapshot.forEach((doc) => {
    base64String += doc.data().data;
  });

  return {
    ...data,
    imageUrl: base64String
  };
}
