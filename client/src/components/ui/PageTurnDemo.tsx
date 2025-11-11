import React, { useState } from 'react';
import { BookPageTransition } from './BookPageTransition';
import { RealisticBookTransition } from './RealisticBookTransition';
import BibleHairFan from './BibleHairFan';
import { Button } from './button';

export function PageTurnDemo() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const demos = [
    {
      id: 'hair-fan',
      name: 'Bible Hair Fan',
      description: 'Flowing hair-like page strands animation',
      component: BibleHairFan
    },
    {
      id: 'page-transition',
      name: 'Book Page Transition',
      description: 'Sequential page turning animation',
      component: BookPageTransition
    },
    {
      id: 'realistic-book',
      name: 'Realistic Book Transition',
      description: 'Most realistic book page flipping effect',
      component: RealisticBookTransition
    }
  ];

  const handleShowDemo = (demoId: string) => {
    setActiveDemo(demoId);
    
    // Auto-hide after a reasonable time
    setTimeout(() => {
      setActiveDemo(null);
    }, 10000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-amber-900 dark:text-amber-100 mb-4">
            Book Page Turning Animations
          </h1>
          <p className="text-lg text-amber-700 dark:text-amber-300">
            Realistic page-flipping effects inspired by open books
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {demos.map((demo) => (
            <div key={demo.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-amber-200 dark:border-gray-700">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {demo.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {demo.description}
                </p>
              </div>

              {/* Small preview */}
              <div className="flex justify-center mb-6">
                {demo.id === 'hair-fan' ? (
                  <BibleHairFan size={60} color="#2fc2ff" duration={1800} />
                ) : demo.id === 'page-transition' ? (
                  <BookPageTransition isVisible={true} size="sm" speed="fast" />
                ) : (
                  <div className="w-12 h-8 bg-gradient-to-br from-amber-800 to-amber-700 rounded shadow-lg flex items-center justify-center">
                    <div className="text-yellow-200 text-xs">📖</div>
                  </div>
                )}
              </div>

              <Button 
                onClick={() => handleShowDemo(demo.id)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                View Full Animation
              </Button>
            </div>
          ))}
        </div>

        {/* Usage examples */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-amber-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Usage Examples</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Between Page Navigation
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Use these animations when users navigate between different sections or chapters:
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 font-mono text-sm">
                <div className="text-green-600 dark:text-green-400">// Show transition while loading new chapter</div>
                <div className="text-blue-600 dark:text-blue-400">const</div> [showTransition, setShowTransition] = useState(false);
                <br />
                <div className="text-blue-600 dark:text-blue-400">const</div> handleChapterChange = () =&gt; {'{'}
                <br />
                &nbsp;&nbsp;setShowTransition(true);
                <br />
                &nbsp;&nbsp;<div className="text-green-600 dark:text-green-400">// Load new content</div>
                <br />
                {'}'};
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Data Loading States
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Perfect for when loading biblical content, translations, or cross-references:
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 font-mono text-sm">
                <div className="text-blue-600 dark:text-blue-400">{'<RealisticBookTransition'}</div>
                <br />
                &nbsp;&nbsp;isVisible={'{isLoading}'}
                <br />
                &nbsp;&nbsp;message="Loading Scripture..."
                <br />
                &nbsp;&nbsp;onComplete={'{() => setIsLoading(false)}'}
                <br />
                <div className="text-blue-600 dark:text-blue-400">{'/>'}</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Component Features
              </h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-2">
                <li>• <strong>Realistic 3D page turning</strong> with perspective transforms</li>
                <li>• <strong>Divine light effects</strong> and golden shimmer animations</li>
                <li>• <strong>Customizable sizes</strong> (sm, md, lg) and speeds</li>
                <li>• <strong>Multiple page layers</strong> for depth and realism</li>
                <li>• <strong>Sacred book styling</strong> with cross emblems and golden spine</li>
                <li>• <strong>Completion callbacks</strong> for seamless integration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Demo overlays */}
      {activeDemo === 'hair-fan' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setActiveDemo(null)}>
          <BibleHairFan size={200} color="#2fc2ff" duration={1800} />
        </div>
      )}

      {activeDemo === 'page-transition' && (
        <BookPageTransition 
          isVisible={true} 
          onComplete={() => setActiveDemo(null)}
          size="lg"
          speed="medium"
        />
      )}

      {activeDemo === 'realistic-book' && (
        <RealisticBookTransition 
          isVisible={true} 
          onComplete={() => setActiveDemo(null)}
          message="Sacred Pages Turning..."
          size="lg"
        />
      )}
    </div>
  );
}