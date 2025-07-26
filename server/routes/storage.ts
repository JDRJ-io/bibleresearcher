// Storage API routes for accessing Supabase Storage via server proxy
import express from 'express';

const router = express.Router();

// Proxy route for accessing labels from Supabase Storage
router.get('/labels/:translationCode/all.json', async (req, res) => {
  try {
    const { translationCode } = req.params;
    
    // Construct Supabase Storage URL
    const supabaseUrl = 'https://efvztudkmafxfcyglvcl.supabase.co/storage/v1/object/public/anointed';
    const fileUrl = `${supabaseUrl}/labels/${translationCode}/all.json`;
    
    // Forward the request to Supabase
    const response = await fetch(fileUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: `Labels file not found for translation: ${translationCode}` });
      }
      throw new Error(`Supabase Storage error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.text();
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    res.send(data);
  } catch (error) {
    console.error('Storage proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch labels data' });
  }
});

export default router;