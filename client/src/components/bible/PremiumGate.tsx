import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PremiumGateProps {
  feature: string;
  description?: string;
  onUpgrade?: () => void;
}

export function PremiumGate({ feature, description, onUpgrade }: PremiumGateProps) {
  const { profile } = useAuth();
  
  // All users are founding members - never show the premium gate
  return null;
  
  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
      <CardContent className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-full mb-4">
          <Crown className="w-8 h-8 text-amber-600" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          Premium Feature
        </h3>
        
        <p className="text-muted-foreground mb-4">
          {description || `${feature} is available to premium members.`}
        </p>
        
        <Button 
          onClick={onUpgrade}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          Upgrade to Premium - $5/month
        </Button>
      </CardContent>
    </Card>
  );
}