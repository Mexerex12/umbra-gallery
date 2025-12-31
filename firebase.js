import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

if(!process.env.FB_PRIVATE_KEY || !process.env.FB_CLIENT_EMAIL || !process.env.FB_STORAGE_BUCKET){
  console.log("❌ Variáveis do Firebase não carregadas (.env)");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FB_PROJECT_ID,
    clientEmail: process.env.FB_CLIENT_EMAIL,
    privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, "\n")
  }),
  storageBucket: process.env.FB_STORAGE_BUCKET
});

export const db = admin.firestore();
export const bucket = admin.storage().bucket();
