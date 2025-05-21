"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./middleware/auth");
const template_1 = require("./handlers/template");
const s3Upload_1 = require("./handlers/s3Upload");
const processAudio_1 = require("./handlers/processAudio");
const containerText_1 = require("./handlers/containerText");
const handlers_1 = require("./middleware/handlers");
const admin_1 = require("./handlers/admin");
const noteRegeneration_1 = require("./handlers/noteRegeneration");
// Add serverless-express import for Lambda deployment
const serverless_express_1 = __importDefault(require("@vendia/serverless-express"));
dotenv_1.default.config();
// Check if running in serverless environment
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const isServerless = process.env.VERCEL === '1' || isLambda;
const tmpDir = isServerless ? '/tmp' : path_1.default.join(__dirname, '../tmp');
// Ensure tmp directory exists
if (!fs_1.default.existsSync(tmpDir)) {
    fs_1.default.mkdirSync(tmpDir, { recursive: true });
}
// Express app setup
const app = (0, express_1.default)();
// Only create HTTP server for local development
const server = isLambda ? null : http_1.default.createServer(app);
// Add JSON body parser middleware
app.use(express_1.default.json());
// CORS configuration
const allowedOrigins = [
    'https://global-sc.vercel.app',
    'https://eastmedical.com', // Add your production domain
    'https://app.eastmedical.com', // Add your app subdomain
    'http://localhost:5173', // Vite's default dev server port
    'http://localhost:3000'
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl requests, or Lambda invocations)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, origin);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'], // Extended methods for API
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'], // Added X-Api-Key
    credentials: true
}));
// Multer config
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tmpDir);
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.includes('webm') ? '.webm' : '.ogg';
        cb(null, `upload-${Date.now()}${ext}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "audio/webm" ||
            file.mimetype === "audio/ogg" ||
            file.mimetype === "audio/ogg;codecs=opus" ||
            file.mimetype.includes("ogg") ||
            file.mimetype.includes("webm")) {
            cb(null, true);
        }
        else {
            console.log("Rejected file with mimetype:", file.mimetype);
            cb(new Error(`Invalid file type: ${file.mimetype}. Only WebM and Ogg audio files are accepted.`));
        }
    },
}).single("audio");
// Routes
app.post("/get-upload-url", auth_1.authenticateUser, s3Upload_1.getUploadUrl);
app.post("/process-audio", auth_1.authenticateUser, processAudio_1.processAudio);
app.post("/update-container-text", auth_1.authenticateApiToken, express_1.default.json(), (0, handlers_1.wrapAuthenticatedHandler)(containerText_1.handleUpdateContainerText));
app.post("/generate-from-template", auth_1.authenticateUser, express_1.default.json(), (0, handlers_1.wrapAuthenticatedHandler)(template_1.handleTemplateGeneration));
app.post("/admin/regenerate-visit", auth_1.authenticateUser, express_1.default.json(), (0, handlers_1.wrapAuthenticatedHandler)(admin_1.handleVisitRegeneration));
// Note regeneration endpoints
app.post('/api/notes/:noteId/regenerate-soap', auth_1.authenticateUser, (0, handlers_1.wrapAuthenticatedHandler)(noteRegeneration_1.handleSoapNoteRegeneration));
app.post('/api/notes/:noteId/regenerate-template', auth_1.authenticateUser, (0, handlers_1.wrapAuthenticatedHandler)(noteRegeneration_1.handleTemplateNoteRegeneration));
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
exports.handler = (0, serverless_express_1.default)({ app });
