import { Request, Response } from 'express';
import { addToWaitlist } from '../services/supabaseService';

export const handleWaitlistSignup = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  try {
    const result = await addToWaitlist(email);

    if (!result.success) {
      // Check if it's a duplicate email error
      if (result.error && result.error.code === '23505') {
        res.status(409).json({ error: 'This email is already on our waitlist' });
        return;
      }
      
      throw result.error;
    }

    res.status(200).json({ success: true, message: 'Successfully added to waitlist' });
  } catch (error) {
    console.error('[Waitlist] Error in waitlist signup handler:', error);
    res.status(500).json({ 
      error: 'Failed to add to waitlist',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
