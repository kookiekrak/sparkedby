import { Request, Response, NextFunction } from "express";
import { initializeSupabaseClients, SupabaseClients } from "../utils/supabase";
import { verifyApiToken } from "../utils/apiCredentials";

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
  supabase: SupabaseClients;
}

// Add API token authentication middleware
export async function authenticateApiToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers["authorization"];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: "No authorization token provided" });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    // Check if token matches the API token - now using the secure verification function
    const isValid = await verifyApiToken(token);
    if (!isValid) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    // Initialize Supabase service client for this request
    const supabase = await initializeSupabaseClients();
    
    // Add service client to request object
    (req as AuthenticatedRequest).supabase = supabase;
    // Add a system user ID for logging
    (req as AuthenticatedRequest).user = { id: 'system' };
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
}

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
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
    const supabase = await initializeSupabaseClients();
    
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
    (req as AuthenticatedRequest).user = user;
    (req as AuthenticatedRequest).supabase = supabase;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
} 