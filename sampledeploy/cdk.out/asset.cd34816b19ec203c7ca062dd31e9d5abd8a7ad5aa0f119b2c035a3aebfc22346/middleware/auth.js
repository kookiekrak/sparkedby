"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateApiToken = authenticateApiToken;
exports.authenticateUser = authenticateUser;
const supabase_1 = require("../utils/supabase");
const apiCredentials_1 = require("../utils/apiCredentials");
// Add API token authentication middleware
async function authenticateApiToken(req, res, next) {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: "No authorization token provided" });
            return;
        }
        const token = authHeader.split(' ')[1];
        // Check if token matches the API token - now using the secure verification function
        const isValid = await (0, apiCredentials_1.verifyApiToken)(token);
        if (!isValid) {
            res.status(401).json({ error: "Invalid token" });
            return;
        }
        // Initialize Supabase service client for this request
        const supabase = await (0, supabase_1.initializeSupabaseClients)();
        // Add service client to request object
        req.supabase = supabase;
        // Add a system user ID for logging
        req.user = { id: 'system' };
        next();
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        res.status(401).json({ error: "Authentication failed" });
    }
}
async function authenticateUser(req, res, next) {
    try {
        console.log("Auth middleware start");
        const authHeader = req.headers["authorization"];
        console.log("Auth header:", authHeader?.slice(0, 20) + "...");
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log("No valid auth header found");
            res.status(401).json({ error: "No authorization token provided" });
            return;
        }
        const token = authHeader.split(' ')[1];
        console.log("Token extracted, attempting verification");
        // Initialize Supabase clients for this request
        const supabase = await (0, supabase_1.initializeSupabaseClients)();
        // Verify the JWT token
        console.log("Calling supabase.auth.getUser");
        const { data, error } = await supabase.userClient.auth.getUser(token);
        console.log("Supabase auth response:", { data, error });
        if (error) {
            console.error("Auth error:", error);
            res.status(401).json({ error: "Invalid token" });
            return;
        }
        const user = data.user;
        if (!user?.id) {
            console.error("Auth error: No user ID in token");
            res.status(401).json({ error: "No user ID provided" });
            return;
        }
        console.log("Successfully authenticated user:", user.id);
        // Add user and supabase clients to request object
        req.user = user;
        req.supabase = supabase;
        next();
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        res.status(401).json({ error: "Authentication failed" });
    }
}
