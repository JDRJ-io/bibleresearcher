import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface CrossReferenceSwitcherProps {
  currentSet: 'cf1' | 'cf2';
  onSetChange: (set: 'cf1' | 'cf2') => void;
}

export function CrossReferenceSwitcher({ currentSet, onSetChange }: CrossReferenceSwitcherProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Cross-Reference Set</Label>
      <RadioGroup value={currentSet} onValueChange={(value) => onSetChange(value as 'cf1' | 'cf2')}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="cf1" id="cf1" />
          <Label htmlFor="cf1" className="cursor-pointer">
            Set 1 (Standard)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="cf2" id="cf2" />
          <Label htmlFor="cf2" className="cursor-pointer">
            Set 2 (Extended)
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}