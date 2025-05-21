import express from "express";
import http from "http";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { authenticateUser, authenticateApiToken } from "./middleware/auth";
import { handleTemplateGeneration } from "./handlers/template";
import { getUploadUrl } from "./handlers/s3Upload";
import { processAudio } from "./handlers/processAudio";
import { handleUpdateContainerText } from "./handlers/containerText";
import { wrapAuthenticatedHandler } from "./middleware/handlers";
import { handleVisitRegeneration } from "./handlers/admin";
import { handleSoapNoteRegeneration, handleTemplateNoteRegeneration } from "./handlers/noteRegeneration";
// Add serverless-express import for Lambda deployment
import serverlessExpress from '@vendia/serverless-express';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

dotenv.config();

// Check if running in serverless environment
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const isServerless = process.env.VERCEL === '1' || isLambda;
const tmpDir = isServerless ? '/tmp' : path.join(__dirname, '../tmp');

// Ensure tmp directory exists
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Express app setup
const app = express();

// Only create HTTP server for local development
const server = isLambda ? null : http.createServer(app);

// Add JSON body parser middleware
app.use(express.json());

// CORS configuration
const allowedOrigins = [
  'https://global-sc.vercel.app',
  'https://eastmedical.com',    // Add your production domain
  'https://app.eastmedical.com', // Add your app subdomain
  'http://localhost:5173',      // Vite's default dev server port
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests, or Lambda invocations)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'], // Extended methods for API
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'], // Added X-Api-Key
  credentials: true
}));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.includes('webm') ? '.webm' : '.ogg';
    cb(null, `upload-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "audio/webm" ||
      file.mimetype === "audio/ogg" ||
      file.mimetype === "audio/ogg;codecs=opus" ||
      file.mimetype.includes("ogg") ||
      file.mimetype.includes("webm")
    ) {
      cb(null, true);
    } else {
      console.log("Rejected file with mimetype:", file.mimetype);
      cb(new Error(`Invalid file type: ${file.mimetype}. Only WebM and Ogg audio files are accepted.`));
    }
  },
}).single("audio");

// Routes

app.post("/get-upload-url", authenticateUser, getUploadUrl);
app.post("/process-audio", authenticateUser, processAudio);
app.post("/update-container-text", authenticateApiToken, express.json(), wrapAuthenticatedHandler(handleUpdateContainerText));
app.post("/generate-from-template", authenticateUser, express.json(), wrapAuthenticatedHandler(handleTemplateGeneration));
app.post("/admin/regenerate-visit", authenticateUser, express.json(), wrapAuthenticatedHandler(handleVisitRegeneration));

// Note regeneration endpoints
app.post('/api/notes/:noteId/regenerate-soap', authenticateUser, wrapAuthenticatedHandler(handleSoapNoteRegeneration));
app.post('/api/notes/:noteId/regenerate-template', authenticateUser, wrapAuthenticatedHandler(handleTemplateNoteRegeneration));

// Add a root endpoint for health checks
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', environment: isLambda ? 'lambda' : 'server' });
});

// Start the server if we're not in Lambda
if (!isLambda && server) {
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Create and export the Lambda handler
// Modern way of using serverless-express with promise support
export const handler = serverlessExpress({ app });

