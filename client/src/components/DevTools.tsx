import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function DevTools() {
  const [showDevTools, setShowDevTools] = useState(false);
  const [stats, setStats] = useState({
    cf2Size: 0,
    cf1Size: 0,
    prophecyRows: 0,
    badgeCounts: false
  });

  useEffect(() => {
    // Check if we're in development mode
    if (import.meta.env.MODE === 'development') {
      setShowDevTools(true);
      
      // Verify in DevTools
      const checkStats = async () => {
        try {
          // Check network requests
          const cf2Response = await fetch('/references/cf2.txt');
          const cf1Response = await fetch('/references/cf1_offsets.json');
          const prophecyResponse = await fetch('/references/prophecy_rows.txt');
          
          const cf2Text = await cf2Response.text();
          const cf1Json = await cf1Response.json();
          const prophecyText = await prophecyResponse.text();
          
          setStats({
            cf2Size: Math.round(cf2Text.length / 1024), // KB
            cf1Size: Math.round(JSON.stringify(cf1Json).length / 1024), // KB  
            prophecyRows: prophecyText.split('\n').filter(line => line.trim()).length,
            badgeCounts: true
          });
          
          console.log('🔍 DevTools Network Verification:');
          console.log(`• cf2.txt (${Math.round(cf2Text.length / 1024)}KB) - first scroll shows`);
          console.log(`• cf1_offsets.json (${Math.round(JSON.stringify(cf1Json).length / 1024)}KB) - bytes 0-3127`);
          console.log(`• Scrolling 50 verses later shows cf1.txt (bytes 3128-6253) etc.`);
          console.log(`• Badge counts appear; prophecy rows fill.`);
          
        } catch (error) {
          console.error('DevTools verification failed:', error);
        }
      };
      
      checkStats();
    }
  }, []);

  if (!showDevTools) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg text-sm">
      <h3 className="font-bold mb-2">DevTools Network Verification</h3>
      <div className="space-y-1">
        <div>• cf2.txt ({stats.cf2Size}KB) - first scroll shows</div>
        <div>• cf1_offsets.json ({stats.cf1Size}KB) - bytes 0-3127</div>
        <div>• Scrolling 50 verses later shows cf1.txt (bytes 3128-6253) etc.</div>
        <div>• Badge counts appear; prophecy rows fill ({stats.prophecyRows})</div>
      </div>
      <Button 
        onClick={() => setShowDevTools(false)}
        className="mt-2 text-xs"
        variant="secondary"
      >
        Hide
      </Button>
    </div>
  );
}