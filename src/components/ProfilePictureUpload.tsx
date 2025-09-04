'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { uploadProfilePicture } from '@/lib/hybrid-storage';
import { Camera, Upload, X, User } from 'lucide-react';
import Image from 'next/image';

interface ProfilePictureUploadProps {
  currentAvatar: string;
  onAvatarChange: (newAvatar: string) => void;
  userName: string;
}

export function ProfilePictureUpload({ currentAvatar, onAvatarChange, userName }: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, online } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select an image file (JPEG, PNG, GIF, etc.)',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
      });
      return;
    }

    // Store the file and create preview URL
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!previewUrl || !selectedFile || !user) return;

    setIsUploading(true);
    try {
      // Upload using hybrid storage (Supabase + local fallback)
      const downloadURL = await uploadProfilePicture(selectedFile, user.uid);
      
      // Update the avatar
      onAvatarChange(downloadURL);
      
      // Clear preview and selected file
      setPreviewUrl(null);
      setSelectedFile(null);
      
      const storageType = online ? 'cloud' : 'local storage';
      toast({
        title: 'Profile picture updated!',
        description: `Your new profile picture has been saved to ${storageType}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload profile picture. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const displayAvatar = previewUrl || currentAvatar;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center space-y-4">
        {/* Profile Picture Display */}
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border bg-muted flex items-center justify-center">
            {displayAvatar && displayAvatar !== 'https://placehold.co/128x128.png' ? (
              <Image
                src={displayAvatar}
                alt={`${userName}'s profile picture`}
                width={128}
                height={128}
                className="w-full h-full object-cover"
                unoptimized={displayAvatar.startsWith('blob:')}
              />
            ) : (
              <User className="w-16 h-16 text-muted-foreground" />
            )}
          </div>
          
          {/* Upload Overlay */}
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              size="icon"
              variant="secondary"
              onClick={handleCameraClick}
              className="w-10 h-10"
            >
              <Camera className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* File Input (Hidden) */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload Controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleCameraClick}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Change Picture
          </Button>
          
          {previewUrl && (
            <>
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? 'Uploading...' : 'Save Picture'}
              </Button>
              
              <Button
                onClick={handleRemove}
                variant="outline"
                size="icon"
                className="w-10 h-10"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Preview Info */}
        {previewUrl && (
          <div className="text-sm text-muted-foreground text-center">
            <p>Preview of your new profile picture</p>
            <p>Click "Save Picture" to confirm the change</p>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground text-center max-w-xs">
          <p>Supported formats: JPEG, PNG, GIF</p>
          <p>Maximum size: 5MB</p>
        </div>
      </div>
    </div>
  );
}
