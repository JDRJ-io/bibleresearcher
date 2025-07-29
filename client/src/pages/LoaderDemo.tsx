import React, { useState } from 'react';
import { HolyBookLoader } from '@/components/ui/HolyBookLoader';
import BiblePageFan from '@/components/ui/BiblePageFan';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LoaderDemo() {
  const [selectedLoader, setSelectedLoader] = useState<'current' | 'new'>('current');
  const [fanColor, setFanColor] = useState('#2fc2ff');
  const [fanSize, setFanSize] = useState(120);
  const [fanSpeed, setFanSpeed] = useState(1400);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Bible Loader Comparison</h1>
          <p className="text-xl text-muted-foreground">
            Comparing the current HolyBookLoader with the new BiblePageFan component
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current HolyBookLoader */}
          <Card className="space-y-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Current HolyBookLoader
                <Badge variant="secondary">Active</Badge>
              </CardTitle>
              <CardDescription>
                Multi-layer curved spine design with CSS animations and staggered page effects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center min-h-[200px] bg-muted/30 rounded-lg">
                <div className="text-center space-y-4">
                  <HolyBookLoader size="lg" />
                  <p className="text-sm text-muted-foreground">Loading Scripture...</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Features:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Curved spine with multiple page layers</li>
                  <li>• CSS keyframe animations with transform</li>
                  <li>• 3D rotateY effects for realistic page turning</li>
                  <li>• Multiple color gradients (teal theme)</li>
                  <li>• Responsive sizing (sm/md/lg)</li>
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <HolyBookLoader size="sm" />
                  <p className="text-xs mt-2">Small</p>
                </div>
                <div className="text-center">
                  <HolyBookLoader size="md" />
                  <p className="text-xs mt-2">Medium</p>
                </div>
                <div className="text-center">
                  <HolyBookLoader size="lg" />
                  <p className="text-xs mt-2">Large</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New BiblePageFan */}
          <Card className="space-y-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                New BiblePageFan
                <Badge variant="outline">Lightweight</Badge>
              </CardTitle>
              <CardDescription>
                Elegant SVG-based fanning pages with SMIL animations and minimal footprint
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center min-h-[200px] bg-muted/30 rounded-lg">
                <div className="text-center space-y-4">
                  <BiblePageFan size={fanSize} color={fanColor} duration={fanSpeed} />
                  <p className="text-sm text-muted-foreground">Loading Scripture...</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Features:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Pure SVG with SMIL animations</li>
                  <li>• Three fanning page arcs with morphing paths</li>
                  <li>• Staggered timing for ripple effect</li>
                  <li>• Customizable color, size, and speed</li>
                  <li>• ~1KB gzipped, zero external requests</li>
                </ul>
              </div>

              {/* Interactive Controls */}
              <div className="space-y-4">
                <h4 className="font-semibold">Customization:</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Color:</label>
                    <div className="flex gap-2 mt-1">
                      {['#2fc2ff', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setFanColor(color)}
                          className="w-6 h-6 rounded border-2 border-border"
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
                      max="2400"
                      value={fanSpeed}
                      onChange={(e) => setFanSpeed(Number(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Comparison</CardTitle>
            <CardDescription>
              Side-by-side analysis of both loader components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="text-left p-4 font-semibold">HolyBookLoader</th>
                    <th className="text-left p-4 font-semibold">BiblePageFan</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="p-4 font-medium">Animation Type</td>
                    <td className="p-4">CSS Keyframes + Transform</td>
                    <td className="p-4">SVG SMIL Animation</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">File Size</td>
                    <td className="p-4">~2KB (with styles)</td>
                    <td className="p-4">~1KB gzipped</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Customization</td>
                    <td className="p-4">3 preset sizes</td>
                    <td className="p-4">Color, size, speed props</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Performance</td>
                    <td className="p-4">CSS animations (GPU accelerated)</td>
                    <td className="p-4">Native SVG (minimal CPU)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Browser Support</td>
                    <td className="p-4">Modern browsers</td>
                    <td className="p-4">SVG + SMIL support (97%+)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Accessibility</td>
                    <td className="p-4">Visual only</td>
                    <td className="p-4">Built-in aria-label</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Integration Recommendation */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Options</CardTitle>
            <CardDescription>
              Choose how to integrate the BiblePageFan component into your biblical research platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Option 1: Replace</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Replace HolyBookLoader entirely with BiblePageFan for lighter footprint
                </p>
                <Badge variant="outline" className="text-xs">Recommended</Badge>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Option 2: Alternative</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Add as an alternative loader with a prop to choose which one to use
                </p>
                <Badge variant="secondary" className="text-xs">Flexible</Badge>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Option 3: Context-specific</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Use HolyBookLoader for main loading, BiblePageFan for quick transitions
                </p>
                <Badge variant="secondary" className="text-xs">Specialized</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}