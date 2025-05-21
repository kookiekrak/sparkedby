import { Request, Response, NextFunction } from "express";
import { 
  initializeSupabaseClients, 
  SupabaseClients 
} from "../utils/supabase";
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
    const supabase = await initializeSupabaseClients(null);
    
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

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No valid auth header found");
      res.status(401).json({ error: "No authorization token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    console.log("Token extracted:", token.slice(0, 10) + "...");

    if (!token) {
      console.error("Empty token provided");
      res.status(401).json({ error: "Empty token provided" });
      return;
    }

    // Initialize the user client with the token in headers
    const supabase = await initializeSupabaseClients(token);

    // Verify the user by explicitly passing the token to getUser(...)
    console.log("Calling supabase.auth.getUser(token)");
    const { data: userData, error } = await supabase.userClient.auth.getUser(token);

    if (error || !userData?.user) {
      console.error("Invalid token - user retrieval failed:", error);
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const user = userData.user;
    console.log("Token is valid for user:", user.id);

    // Add user and supabase clients to request object
    (req as AuthenticatedRequest).user = user;
    (req as AuthenticatedRequest).supabase = supabase;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
}
