import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import fs from "fs";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ dest: "uploads/" });

let aiClient: GoogleGenAI | null = null;
const getAI = () => {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY no configurado en el servidor.");
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
};

let supabaseClient: any = null;
const getSupabaseServer = () => {
  if (supabaseClient) return supabaseClient;
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Credenciales de Supabase no configuradas en el servidor.");
  supabaseClient = createClient(url, key);
  return supabaseClient;
};

let stripeClient: Stripe | null = null;
const getStripe = () => {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY no configurado en el servidor.");
  stripeClient = new Stripe(key);
  return stripeClient;
};

// Load firebase config for database ID
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = admin.firestore(firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  
  // Stripe Webhook needs raw body
  app.post("/api/payments/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = getStripe().webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = session.client_reference_id;
      const plan = session.metadata.plan;

      if (userId && plan) {
        await db.collection('users').doc(userId).update({
          subscription: plan,
          transcriptionCount: 0, // Reset count on upgrade
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Plan updated for user ${userId} to ${plan}`);
      }
    }

    res.json({ received: true });
  });

  app.use(express.json());

  // --- MIDDLEWARE DE LÍMITES ---
  const checkTranscriptionLimit = async (req: any, res: any, next: any) => {
    const userId = req.headers['x-user-id'];
    
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    try {
      const userDoc = await db.collection('users').doc(userId as string).get();
      if (!userDoc.exists) return res.status(404).json({ error: "Usuario no encontrado" });

      const userData = userDoc.data();
      const plan = userData?.subscription;
      const count = userData?.transcriptionCount || 0;

      const limits: Record<string, number> = {
        "Básico": 3,
        "Intermedio": 20,
        "Full": Infinity
      };

      const limit = limits[plan as string] || 3;

      if (count >= limit) {
        return res.status(403).json({ 
          error: `Límite del plan ${plan} alcanzado (${count}/${limit}). Por favor mejora tu plan.`,
          limitReached: true 
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: "Error de servidor" });
    }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Transcriptor Clínico API" });
  });

  // Ruta protegida por el middleware de límites
  app.post("/api/transcriptions/start", checkTranscriptionLimit, (req, res) => {
    res.json({ allowed: true, message: "Sesión autorizada" });
  });

  app.post("/api/payments/create-checkout-session", async (req, res) => {
    const { userId, plan, priceId } = req.body;
    
    try {
      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId, // Stripe Price ID
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.APP_URL || 'http://localhost:3000'}/?payment=success`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/?payment=cancel`,
        client_reference_id: userId,
        metadata: {
          plan: plan,
        },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- SUPABASE STORAGE & TRANSCRIPTIONS ---
  app.post("/api/clinical/upload", upload.single('file'), async (req, res) => {
    const file = req.file;
    const { userId, patientId } = req.body;

    if (!file || !userId || !patientId) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    try {
      const fileBuffer = fs.readFileSync(file.path);
      const fileExtension = path.extname(file.originalname);
      const fileName = `${userId}/${Date.now()}${fileExtension}`;

      // 1. Subir a Supabase Storage
      const { data: uploadData, error: uploadError } = await getSupabaseServer().storage
        .from('clinica-audios')
        .upload(fileName, fileBuffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: urlData } = getSupabaseServer().storage
        .from('clinica-audios')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // 3. Insertar en tabla 'transcriptions' de Supabase
      const { data: transcriptData, error: dbError } = await getSupabaseServer()
        .from('transcriptions')
        .insert([
          {
            patient_id: patientId,
            therapist_id: userId,
            audio_url: publicUrl,
            status: 'Pendiente',
            metadata: {
              original_name: file.originalname,
              size: file.size,
              mimetype: file.mimetype
            }
          }
        ])
        .select();

      if (dbError) throw dbError;

      // Limpiar archivo temporal
      fs.unlinkSync(file.path);

      res.json({ 
        success: true, 
        transcriptionId: transcriptData[0].id,
        publicUrl 
      });

    } catch (error: any) {
      console.error("Supabase Bio Upload Error:", error);
      if (file) fs.unlinkSync(file.path);
      res.status(500).json({ error: error.message });
    }
  });

  // --- RUTAS ADMINISTRATIVAS ---
  app.get("/api/admin/metrics", async (req, res) => {
    try {
      const usersSnapshot = await db.collection('users').get();
      const users = usersSnapshot.docs.map(doc => doc.data());
      
      const totalUsers = users.length;
      const totalTranscriptions = users.reduce((acc, u) => acc + (u.transcriptionCount || 0), 0);
      
      const monthlyRevenue = users.reduce((acc, u) => {
        if (u.subscription === "Intermedio") return acc + 29;
        if (u.subscription === "Full") return acc + 69;
        return acc;
      }, 0);

      const activeToday = users.filter(u => {
        if (!u.updatedAt) return false;
        const lastUpdate = u.updatedAt.toDate ? u.updatedAt.toDate() : new Date(u.updatedAt);
        return lastUpdate > new Date(Date.now() - 24 * 60 * 60 * 1000);
      }).length;

      res.json({
        totalUsers,
        totalTranscriptions,
        monthlyRevenue,
        activeToday
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const snapshot = await db.collection('users').get();
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener usuarios" });
    }
  });

  app.patch("/api/admin/users/:id", async (req, res) => {
    const { id } = req.params;
    const { role, subscription, transcriptionCount } = req.body;
    try {
      const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      if (role) updateData.role = role;
      if (subscription) updateData.subscription = subscription;
      if (transcriptionCount !== undefined) updateData.transcriptionCount = transcriptionCount;

      await db.collection('users').doc(id).update(updateData);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar usuario" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
