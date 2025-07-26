// Test if Web Worker can load label data directly
console.log('Testing Web Worker label loading...');

// Create a minimal worker to test label loading
const workerCode = `
self.onmessage = async (e) => {
  console.log('Worker received:', e.data);
  const { tCode, active } = e.data;
  
  try {
    const url = 'https://ecaqvxbbscwcxbjpfrdm.supabase.co/storage/v1/object/public/anointed/labels/' + tCode + '/ALL.json';
    console.log('Worker fetching:', url);
    
    const res = await fetch(url);
    const data = await res.json();
    
    console.log('Worker loaded verses:', Object.keys(data).length);
    
    // Filter for active labels
    const filtered = {};
    for (const [verse, labels] of Object.entries(data)) {
      const slim = {};
      for (const activeLabel of active) {
        if (labels[activeLabel]?.length) {
          slim[activeLabel] = labels[activeLabel];
        }
      }
      if (Object.keys(slim).length) {
        filtered[verse] = slim;
      }
    }
    
    console.log('Worker filtered verses:', Object.keys(filtered).length);
    console.log('Example filtered data:', Object.entries(filtered).slice(0, 3));
    
    self.postMessage({ tCode, filtered });
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({ tCode, filtered: {} });
  }
};
`;

// Create blob worker
const blob = new Blob([workerCode], { type: 'application/javascript' });
const worker = new Worker(URL.createObjectURL(blob));

// Test the worker
worker.onmessage = (e) => {
  console.log('Main thread received:', e.data);
  console.log('Filtered verses count:', Object.keys(e.data.filtered).length);
  
  // Show some examples
  const examples = Object.entries(e.data.filtered).slice(0, 5);
  examples.forEach(([verse, labels]) => {
    console.log(`\n${verse}:`, labels);
  });
  
  worker.terminate();
};

// Send test message
worker.postMessage({ tCode: 'KJV', active: ['what'] });