import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Loader2 } from 'lucide-react';
import { uploadAvatar } from '@/lib/uploadAvatar';
import { useToast } from '@/hooks/use-toast';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userInitials: string;
  onAvatarUpdate: (newUrl: string) => void;
  className?: string;
}

export function AvatarUpload({ currentAvatarUrl, userInitials, onAvatarUpdate, className }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      setIsUploading(true);
      const newAvatarUrl = await uploadAvatar(file);
      
      if (newAvatarUrl) {
        onAvatarUpdate(newAvatarUrl);
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been successfully updated",
        });
        // Clean up preview since we have the real URL now
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl(null);
      }
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
      // Keep preview on error
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Avatar className="h-16 w-16 border-2 border-amber-300 dark:border-amber-700">
        <AvatarImage src={displayUrl} />
        <AvatarFallback className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-semibold text-lg">
          {userInitials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col gap-2">
        <Button 
          onClick={handleUploadClick}
          disabled={isUploading}
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {currentAvatarUrl ? 'Change Avatar' : 'Upload Avatar'}
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          JPG, PNG, GIF up to 5MB
        </p>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}