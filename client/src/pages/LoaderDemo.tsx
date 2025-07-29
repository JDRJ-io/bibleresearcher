import React, { useState } from 'react';
import BibleHairFan from '@/components/ui/BibleHairFan';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LoaderDemo() {
  const [fanColor, setFanColor] = useState('#2fc2ff');
  const [fanSize, setFanSize] = useState(120);
  const [fanSpeed, setFanSpeed] = useState(1000);
  const [fanSpread, setFanSpread] = useState(60);
  const [fanStrands, setFanStrands] = useState(15);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">BibleHairFan Showcase</h1>
          <p className="text-xl text-muted-foreground">
            Flowing hair-like page strands animation for the biblical research platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* BibleHairFan Demo */}
          <Card className="space-y-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                BibleHairFan
                <Badge variant="outline">Hair-like</Badge>
              </CardTitle>
              <CardDescription>
                Hair-like page strands in a semicircle with independent swaying motion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center min-h-[200px] bg-muted/30 rounded-lg">
                <div className="text-center space-y-4">
                  <BibleHairFan 
                    size={fanSize} 
                    color={fanColor} 
                    duration={fanSpeed}
                    spread={fanSpread}
                    strands={fanStrands}
                  />
                  <p className="text-sm text-muted-foreground">Loading Scripture...</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Features:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 15 thin "page strands" flowing like hair in wind</li>
                  <li>• Sequential wave motion sweeping from side to side</li>
                  <li>• Spline-based animation for smooth flowing effect</li>
                  <li>• Customizable color, size, speed, spread, and strands</li>
                  <li>• ~1KB gzipped, compositor-only workload</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Controls */}
          <Card className="space-y-6">
            <CardHeader>
              <CardTitle>Interactive Controls</CardTitle>
              <CardDescription>
                Customize the BibleHairFan animation in real-time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex gap-2 mt-2">
                    {['#2fc2ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setFanColor(color)}
                        className="w-8 h-8 rounded-full border-2 border-white"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Size: {fanSize}px</label>
                  <input
                    type="range"
                    min="80"
                    max="200"
                    value={fanSize}
                    onChange={(e) => setFanSize(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Speed: {fanSpeed}ms</label>
                  <input
                    type="range"
                    min="800"
                    max="3000"
                    value={fanSpeed}
                    onChange={(e) => setFanSpeed(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Spread: {fanSpread}°</label>
                  <input
                    type="range"
                    min="30"
                    max="120"
                    value={fanSpread}
                    onChange={(e) => setFanSpread(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Strands: {fanStrands}</label>
                  <input
                    type="range"
                    min="20"
                    max="40"
                    value={fanStrands}
                    onChange={(e) => setFanStrands(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Size Variations:</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <BibleHairFan size={60} color={fanColor} duration={fanSpeed} />
                    <p className="text-xs mt-2">Small</p>
                  </div>
                  <div className="text-center">
                    <BibleHairFan size={100} color={fanColor} duration={fanSpeed} />
                    <p className="text-xs mt-2">Medium</p>
                  </div>
                  <div className="text-center">
                    <BibleHairFan size={140} color={fanColor} duration={fanSpeed} />
                    <p className="text-xs mt-2">Large</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Usage</CardTitle>
            <CardDescription>
              How to use BibleHairFan in your biblical research platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              <div className="text-blue-600 dark:text-blue-400">import</div> BibleHairFan <div className="text-blue-600 dark:text-blue-400">from</div> <div className="text-green-600 dark:text-green-400">'@/components/ui/BibleHairFan'</div>;
              <br /><br />
              <div className="text-blue-600 dark:text-blue-400">{'<BibleHairFan'}</div>
              <br />
              &nbsp;&nbsp;size={'{160}'}
              <br />
              &nbsp;&nbsp;color="<div className="text-green-600 dark:text-green-400">#2fc2ff</div>"
              <br />
              &nbsp;&nbsp;duration={'{1800}'}
              <br />
              &nbsp;&nbsp;spread={'{60}'}
              <br />
              &nbsp;&nbsp;strands={'{30}'}
              <br />
              <div className="text-blue-600 dark:text-blue-400">{'/>'}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Perfect for:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Bible page loading screens</li>
                  <li>• Translation switching transitions</li>
                  <li>• Cross-reference loading</li>
                  <li>• Search result loading</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Key Benefits:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Extremely lightweight (~1KB)</li>
                  <li>• Smooth GPU-accelerated animation</li>
                  <li>• Fully customizable appearance</li>
                  <li>• Zero external dependencies</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}