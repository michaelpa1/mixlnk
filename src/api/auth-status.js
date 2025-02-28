// Simple API endpoint to check authentication status
import { supabase } from '../lib/supabase';

export default async function handler(req, res) {
  try {
    // Get the user from the session
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return res.status(401).json({ 
        authenticated: false, 
        message: 'Not authenticated',
        error: error ? error.message : 'No user found'
      });
    }
    
    return res.status(200).json({ 
      authenticated: true, 
      userId: user.id,
      email: user.email
    });
  } catch (error) {
    console.error('Auth status check error:', error);
    return res.status(500).json({ 
      authenticated: false, 
      message: 'Error checking authentication status',
      error: error.message
    });
  }
}