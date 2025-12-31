import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";

import { db, bucket } from "./firebase.js";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* ============================
   ✅ ROTA RAIZ
============================ */
app.get("/", (req, res) => {
  res.send("📸 Umbra Gallery Backend online");
});

/* ============================
   🔹 CRIAR EVENTO (ADMIN)
============================ */
app.post("/admin/event", async (req, res) => {
  try {
    const { password, name } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(403).json({ error: "Senha inválida" });
    }

    if (!name) {
      return res.status(400).json({ error: "Nome do evento é obrigatório" });
    }

    const doc = await db.collection("events").add({
      name,
      createdAt: new Date()
    });

    res.json({
      id: doc.id,
      name
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar evento" });
  }
});

/* ============================
   🔹 UPLOAD DE IMAGENS (ADMIN)
============================ */
app.post(
  "/admin/upload/:eventId",
  upload.array("images"),
  async (req, res) => {
    try {
      const { password } = req.body;
      const { eventId } = req.params;

      if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Senha inválida" });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Nenhuma imagem enviada" });
      }

      const uploadedUrls = [];

      for (const file of req.files) {
        const fileName = `events/${eventId}/${Date.now()}_${file.originalname}`;
        const blob = bucket.file(fileName);

        await blob.save(file.buffer, {
          contentType: file.mimetype
        });

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        uploadedUrls.push(publicUrl);

        await db
          .collection("events")
          .doc(eventId)
          .collection("photos")
          .add({
            url: publicUrl,
            createdAt: new Date()
          });
      }

      res.json({
        uploaded: uploadedUrls.length,
        urls: uploadedUrls
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro no upload" });
    }
  }
);

/* ============================
   🔹 LISTAR EVENTOS + FOTOS
============================ */
app.get("/events", async (req, res) => {
  try {
    const eventsSnap = await db.collection("events").orderBy("createdAt", "desc").get();
    const events = [];

    for (const doc of eventsSnap.docs) {
      const photosSnap = await doc.ref
        .collection("photos")
        .orderBy("createdAt", "desc")
        .get();

      events.push({
        id: doc.id,
        name: doc.data().name,
        photos: photosSnap.docs.map(p => p.data().url)
      });
    }

    res.json(events);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar eventos" });
  }
});

/* ============================
   🚀 START SERVER
============================ */
app.listen(PORT, () => {
  console.log(`📸 Umbra Gallery Backend rodando em http://localhost:${PORT}`);
});
