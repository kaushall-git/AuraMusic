/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  LogOut, Sun, Moon, Edit, Check, Settings, Activity, Disc, 
  Heart, Music, Sparkles, Camera, Upload, RotateCw, ZoomIn, 
  ZoomOut, Trash2, User, Image, ArrowLeft, RefreshCw, Sliders, Loader2 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMusic } from '../contexts/MusicContext';

interface PresetAvatar {
  id: string;
  name: string;
  category: 'Male' | 'Female' | 'Cartoon' | 'Anime' | 'Music' | 'Minimalist' | 'AI';
  url: string;
}

const PRESET_AVATARS: PresetAvatar[] = [
  // Male
  { id: 'm1', name: 'Hugo', category: 'Male', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Hugo' },
  { id: 'm2', name: 'Jack', category: 'Male', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack' },
  { id: 'm3', name: 'George', category: 'Male', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=George' },
  
  // Female
  { id: 'f1', name: 'Zoe', category: 'Female', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Zoe' },
  { id: 'f2', name: 'Anna', category: 'Female', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Anna' },
  { id: 'f3', name: 'Sarah', category: 'Female', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sarah' },
  
  // Cartoon
  { id: 'c1', name: 'Sparkle', category: 'Cartoon', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Sparkle' },
  { id: 'c2', name: 'Buster', category: 'Cartoon', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Buster' },
  { id: 'c3', name: 'Retro', category: 'Cartoon', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Retro' },
  
  // Anime-inspired
  { id: 'a1', name: 'Aira', category: 'Anime', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Aira' },
  { id: 'a2', name: 'Kazuto', category: 'Anime', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Kazuto' },
  { id: 'a3', name: 'Saber', category: 'Anime', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Saber' },
  
  // Music-Themed (Vibrant self-contained vector gradients and shapes)
  { 
    id: 'mu1', 
    name: 'Retro Vinyl', 
    category: 'Music', 
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="48" fill="%2318181b"/><circle cx="50" cy="50" r="30" fill="none" stroke="%23ffe4e6" stroke-width="2" stroke-dasharray="8 4"/><circle cx="50" cy="50" r="20" fill="none" stroke="%23ff375f" stroke-width="3"/><circle cx="50" cy="50" r="6" fill="%23ffffff"/></svg>' 
  },
  { 
    id: 'mu2', 
    name: 'Headphones Pro', 
    category: 'Music', 
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="20" fill="%23ff375f"/><path d="M25,50 C25,30 35,20 50,20 C65,20 75,30 75,50 C75,52 73,54 71,54 L65,54 C63,54 62,52 62,50 L62,44 C62,42 63,41 65,41 L71,41 C71,32 62,25 50,25 C38,25 29,32 29,41 L35,41 C37,41 38,42 38,44 L38,50 C38,52 37,54 35,54 L29,54 C27,54 25,52 25,50 Z" fill="%23ffffff"/><rect x="23" y="48" width="8" height="14" rx="3" fill="%23ffffff"/><rect x="69" y="48" width="8" height="14" rx="3" fill="%23ffffff"/></svg>' 
  },
  { 
    id: 'mu3', 
    name: 'Synth Wave', 
    category: 'Music', 
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="20" fill="%237c3aed"/><path d="M15,65 L25,50 L35,62 L45,35 L55,75 L65,45 L75,58 L85,42" fill="none" stroke="%23ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>' 
  },
  
  // Minimalist Gradients
  { 
    id: 'mi1', 
    name: 'Aurora Dusk', 
    category: 'Minimalist', 
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ff375f"/><stop offset="100%" stop-color="%237c3aed"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(%23g1)"/></svg>' 
  },
  { 
    id: 'mi2', 
    name: 'Golden Solar', 
    category: 'Minimalist', 
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23e11d48"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(%23g2)"/></svg>' 
  },
  { 
    id: 'mi3', 
    name: 'Electric Neon', 
    category: 'Minimalist', 
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(%23g3)"/></svg>' 
  },
  
  // AI-generated (Cybernetic glowing nodes)
  { 
    id: 'ai1', 
    name: 'Cyber Aura', 
    category: 'AI', 
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%2309090b"/><circle cx="50" cy="50" r="30" fill="none" stroke="%23a855f7" stroke-width="4" stroke-opacity="0.4"/><circle cx="50" cy="50" r="20" fill="none" stroke="%23ec4899" stroke-width="3" stroke-dasharray="4 2"/><polygon points="50,22 74,64 26,64" fill="none" stroke="%2306b6d4" stroke-width="2.5"/></svg>' 
  },
  { 
    id: 'ai2', 
    name: 'Synth Nexus', 
    category: 'AI', 
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%2309090b"/><circle cx="50" cy="50" r="35" fill="none" stroke="%2314b8a6" stroke-width="1.5"/><line x1="15" y1="50" x2="85" y2="50" stroke="%23f43f5e" stroke-width="1" stroke-dasharray="2 2"/><circle cx="50" cy="50" r="10" fill="%2314b8a6" fill-opacity="0.3" stroke="%2314b8a6" stroke-width="2"/></svg>' 
  },
  { 
    id: 'ai3', 
    name: 'Matrix Helix', 
    category: 'AI', 
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%23030712"/><path d="M 20,50 Q 35,20 50,50 T 80,50" fill="none" stroke="%2310b981" stroke-width="3"/><path d="M 20,50 Q 35,80 50,50 T 80,50" fill="none" stroke="%233b82f6" stroke-width="2" stroke-opacity="0.5"/><circle cx="50" cy="50" r="4" fill="%23ffffff"/></svg>' 
  }
];

interface ProfileViewProps {
  onSelectArtist: (artist: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onSelectArtist }) => {
  const { user, themeMode, toggleTheme, updateProfile, logout } = useAuth();
  const { likedTrackIds, playlists } = useMusic();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);

  // Default Avatar Preset Filters
  const [activeCategory, setActiveCategory] = useState<'All' | 'Male' | 'Female' | 'Cartoon' | 'Anime' | 'Music' | 'Minimalist' | 'AI'>('All');

  // Camera Capture State
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Image Cropping & Editing State
  const [editSrc, setEditSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropZoom, setCropZoom] = useState(1.0);
  const [cropRotation, setCropRotation] = useState(0);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploadProgress, setUploadProgress] = useState(0);

  // Clean up camera stream if unmounted
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSave = async () => {
    if (!editedName.trim()) return;
    setIsSaving(true);
    try {
      await updateProfile(editedName, selectedAvatar);
      setIsEditing(false);
    } catch (e) {
      console.error('Failed to save profile: ', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSelect = (url: string) => {
    setSelectedAvatar(url);
  };

  const handleRemovePhoto = () => {
    if (confirm('Are you sure you want to revert to the default placeholder icon?')) {
      const defaultIconUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user?.displayName || 'Aura')}`;
      setSelectedAvatar(defaultIconUrl);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out of Aura Music?')) {
      logout();
    }
  };

  // Convert minutes to proper hours display
  const formatListeningTime = (mins: number) => {
    if (!mins) return '0 hrs';
    if (mins < 60) return `${mins} mins`;
    const hrs = (mins / 60).toFixed(1);
    return `${hrs} hrs`;
  };

  // 1. Camera Handling
  const startCamera = async () => {
    setCameraError(null);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 480, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err: any) {
      console.warn("Camera check failed:", err);
      setCameraError(err.message || "Failed to access camera. Check system permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const captureSnapshot = () => {
    if (videoRef.current && streamRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirrored snapshot for front-facing camera natural intuition
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setEditSrc(dataUrl);
        // Reset cropper offsets
        setCropZoom(1.0);
        setCropRotation(0);
        setCropOffset({ x: 0, y: 0 });
        setIsCropping(true);
      }
      stopCamera();
    }
  };

  // 2. File Upload Change Handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("Unsupported format. Please upload JPG, PNG, or WEBP images.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image exceeds 5MB size limit. Please choose a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditSrc(event.target.result as string);
        // Reset cropper offsets
        setCropZoom(1.0);
        setCropRotation(0);
        setCropOffset({ x: 0, y: 0 });
        setIsCropping(true);
      }
    };
    reader.readAsDataURL(file);
    // Clear input
    e.target.value = '';
  };

  // 3. Interactive Cropper Drag Handling (Mouse & Touch)
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCropOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - cropOffset.x, y: touch.clientY - cropOffset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setCropOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetCropper = () => {
    setCropZoom(1.0);
    setCropRotation(0);
    setCropOffset({ x: 0, y: 0 });
  };

  // 4. Save Final Cropped & Compressed Base64 Profile Picture
  const handleSaveCrop = () => {
    setUploadProgress(20);
    const progressTimer = setInterval(() => {
      setUploadProgress(p => p < 90 ? p + 10 : p);
    }, 100);

    const img = new Image();
    img.src = editSrc || '';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear background with crisp absolute white
        ctx.fillStyle = themeMode === 'dark' ? '#0a0a0c' : '#ffffff';
        ctx.fillRect(0, 0, 300, 300);

        // Map translations to center
        ctx.translate(150, 150);
        ctx.rotate((cropRotation * Math.PI) / 180);
        ctx.scale(cropZoom, cropZoom);

        // Adjust visually based on 256px viewport offset
        const translationScale = 300 / 256;
        ctx.translate(
          (cropOffset.x * translationScale) / cropZoom,
          (cropOffset.y * translationScale) / cropZoom
        );

        // Calculate filling dimensions ensuring responsive aspect fits
        const imgAspect = img.width / img.height;
        let dWidth = 300;
        let dHeight = 300;
        if (imgAspect > 1) {
          dHeight = 300;
          dWidth = 300 * imgAspect;
        } else {
          dWidth = 300;
          dHeight = 300 / imgAspect;
        }

        ctx.drawImage(img, -dWidth / 2, -dHeight / 2, dWidth, dHeight);

        // Output optimized JPG Base64 of small, quick, syncable size
        const base64Img = canvas.toDataURL('image/jpeg', 0.82);
        
        setTimeout(() => {
          clearInterval(progressTimer);
          setUploadProgress(100);
          setSelectedAvatar(base64Img);
          setIsCropping(false);
          setUploadProgress(0);
        }, 500);
      }
    };
  };

  // Categories filter list
  const categories: Array<'All' | 'Male' | 'Female' | 'Cartoon' | 'Anime' | 'Music' | 'Minimalist' | 'AI'> = [
    'All', 'Male', 'Female', 'Cartoon', 'Anime', 'Music', 'Minimalist', 'AI'
  ];

  const filteredPresets = activeCategory === 'All' 
    ? PRESET_AVATARS 
    : PRESET_AVATARS.filter(av => av.category === activeCategory);

  return (
    <div className="flex flex-col pb-36 text-slate-900 dark:text-white px-4 md:px-6 pt-6 overflow-y-auto w-full max-w-5xl">
      <header className="flex items-center justify-between pb-3.5 mb-6 border-b border-slate-200 dark:border-white/5">
        <div className="text-left">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-9">Account</h1>
          <p className="text-xs text-neutral-400 dark:text-neutral-400 mt-1 font-semibold">
            Manage your credentials and aesthetics
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-[#FF375F] hover:bg-[#FF375F]/10 active:scale-95 duration-200 transition-colors rounded-full cursor-pointer bg-transparent"
          title="Sign Out"
        >
          <LogOut className="h-5.5 w-5.5" />
        </button>
      </header>

      {/* Profile Detail Card */}
      {user && (
        <div className="rounded-[24px] border border-slate-200 dark:border-white/5 bg-slate-100/60 dark:bg-white/5 p-6 flex flex-col items-center text-center shadow-sm relative mb-8 backdrop-blur-md">
          
          {/* Cover image edit indicator */}
          <div className="relative group cursor-pointer" onClick={() => setIsEditing(true)}>
            <img
              src={selectedAvatar || user.photoURL}
              alt={user.displayName}
              className="h-24 w-24 rounded-full border-2 border-[#FF375F] shadow-md object-cover bg-slate-200 dark:bg-neutral-800"
            />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 duration-150 transition-all">
              <Edit className="h-5 w-5 text-white" />
            </div>
          </div>

          {isEditing ? (
            <div className="mt-4 w-full space-y-4">
              {/* Display name input field */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-neutral-400 tracking-wider">Display Name</label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full text-center px-4 py-2.5 rounded-xl border border-slate-250 dark:border-white/10 bg-white dark:bg-white/5 font-bold outline-none ring-1 ring-transparent focus:ring-[#FF375F] focus:border-[#FF375F] text-slate-900 dark:text-white"
                />
              </div>

              {/* Advanced Interactive Options */}
              <div className="border border-slate-200 dark:border-white/5 rounded-2xl p-4 bg-slate-200/30 dark:bg-black/20 text-left space-y-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-neutral-400 tracking-widest block mb-2">Change Profile Picture</span>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {/* File Upload Selector */}
                  <label className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-300 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/8 cursor-pointer transition-all active:scale-95">
                    <Upload className="h-4.5 w-4.5 text-[#FF375F] mb-1" />
                    <span className="text-[10px] font-bold text-slate-800 dark:text-white">Upload Gallery</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>

                  {/* Take Photo Camera Button */}
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-300 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/8 cursor-pointer transition-all active:scale-95"
                  >
                    <Camera className="h-4.5 w-4.5 text-[#FF375F] mb-1" />
                    <span className="text-[10px] font-bold text-slate-800 dark:text-white">Take Photo</span>
                  </button>

                  {/* Remove Current Photo */}
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-300 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/8 cursor-pointer transition-all active:scale-95"
                  >
                    <Trash2 className="h-4.5 w-4.5 text-neutral-400 mb-1" />
                    <span className="text-[10px] font-bold text-neutral-500">Remove Photo</span>
                  </button>

                  <div className="hidden md:flex flex-col items-center justify-center p-3 text-center">
                    <span className="text-[9px] text-slate-400 font-medium leading-tight">PNG, JPG, WEBP<br/>up to 5MB</span>
                  </div>
                </div>

                {/* Predefined Avatars Category Browser */}
                <div className="space-y-2 pt-2 border-t border-slate-220 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-neutral-400 tracking-wider">Choose From Gallery Presets</span>
                    <span className="text-[9px] font-bold bg-[#FF375F]/15 text-[#FF375F] px-2 py-0.5 rounded-full">{filteredPresets.length} Avatars</span>
                  </div>

                  {/* Category Filter Chips */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`text-[9.5px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                          activeCategory === cat 
                            ? 'bg-[#FF375F] text-white' 
                            : 'bg-slate-200 text-slate-700 dark:bg-white/5 dark:text-neutral-300 hover:bg-slate-300 dark:hover:bg-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Grid Layout of Presets */}
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 max-h-32 overflow-y-auto p-1 border border-slate-220 dark:border-neutral-800 rounded-xl bg-white/30 dark:bg-black/10">
                    {filteredPresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleAvatarSelect(preset.url)}
                        title={preset.name}
                        className={`relative aspect-square rounded-full overflow-hidden border-2 transition-transform duration-150 active:scale-90 cursor-pointer flex items-center justify-center p-0.5 bg-slate-100 dark:bg-neutral-900/60 ${
                          selectedAvatar === preset.url ? 'border-[#FF375F]' : 'border-transparent'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="h-full w-full object-cover rounded-full" />
                        {selectedAvatar === preset.url && (
                          <div className="absolute inset-0 bg-[#FF375F]/10 flex items-center justify-center">
                            <Check className="h-4 w-4 text-[#FF375F] drop-shadow-md stroke-[3px]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  disabled={isSaving}
                  onClick={() => {
                    setIsEditing(false);
                    setEditedName(user.displayName);
                    setSelectedAvatar(user.photoURL || '');
                  }}
                  className="flex-1 rounded-xl bg-slate-200/60 dark:bg-white/5 hover:bg-slate-300/65 dark:hover:bg-white/10 text-xs py-2.5 text-slate-700 dark:text-white font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 rounded-xl bg-[#FF375F] text-white text-xs py-2.5 font-bold shadow hover:bg-[#FF375F]/90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <h2 className="text-xl font-extrabold flex items-center justify-center gap-1.5 leading-tight text-slate-900 dark:text-white">
                {user.displayName}
                <Sparkles className="h-4.5 w-4.5 text-amber-500 fill-amber-500" title="Aura Premium" />
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{user.email}</p>
              {user.phoneNumber && (
                <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-400 font-medium tracking-wide mt-1">
                  MAPPED PHONE: {user.phoneNumber} (OTP OK)
                </p>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="mt-3 text-xs text-[#FF375F] hover:text-[#FF375F]/90 font-bold uppercase tracking-wider flex items-center justify-center gap-1 mx-auto py-1 px-3 bg-[#FF375F]/5 hover:bg-[#FF375F]/10 rounded-full"
              >
                <Edit className="h-3 w-3" /> Edit Profile
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- FLOATING CAMERA MODAL --- */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[24px] border border-slate-200 dark:border-white/5 bg-white dark:bg-[#121216] p-6 text-center text-slate-900 dark:text-white shadow-2xl relative">
            <h3 className="text-base font-bold mb-1">Take Profile Photo</h3>
            <p className="text-[11px] text-neutral-400 mb-4 font-semibold">Center your face in the circular crop guideline below</p>
            
            {cameraError ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center">
                <span className="font-bold block mb-1">Camera Unreachable</span>
                {cameraError}
              </div>
            ) : (
              <div className="relative aspect-square w-full max-w-[260px] mx-auto rounded-3xl overflow-hidden bg-black/10 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-6">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform -scale-x-100" // Horizontal Mirroring
                />
                
                {/* Circular Crop Overlay Guide */}
                <div className="absolute inset-0 border-[36px] border-black/55 rounded-[12px] pointer-events-none flex items-center justify-center">
                  <div className="w-[188px] h-[188px] rounded-full border-2 border-dashed border-[#FF375F] pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
                </div>
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                onClick={stopCamera}
                className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-205 dark:bg-white/5 dark:hover:bg-white/10 text-xs py-2.5 font-bold"
              >
                Cancel
              </button>
              {!cameraError && (
                <button
                  onClick={captureSnapshot}
                  className="flex-1 rounded-xl bg-[#FF375F] text-white hover:bg-[#FF375F]/90 text-xs py-2.5 font-black shadow shadow-rose-500/15"
                >
                  Capture
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- CROPPER & ROTATOR INTERACTIVE EDITOR --- */}
      {isCropping && editSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200/50 dark:border-white/5 bg-white dark:bg-[#121216] p-6 text-center text-slate-800 dark:text-white shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold mb-1">Reposition & Style</h3>
            <p className="text-[11px] text-neutral-400 mb-4 font-semibold">Drag to reposition. Zoom and rotate to adjust circular crop.</p>
            
            {/* Visual crop viewport wrapper */}
            <div className="relative aspect-square w-full max-w-[256px] mx-auto mb-6 flex items-center justify-center">
              
              {/* Outer boundary */}
              <div 
                className="relative w-64 h-64 rounded-full overflow-hidden border-2 border-[#FF375F] shadow bg-neutral-950/20 select-none flex items-center justify-center cursor-grab active:cursor-grabbing"
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={editSrc}
                  alt="Crop preview source"
                  draggable={false}
                  className="max-h-full max-w-full object-contain"
                  style={{
                    transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) rotate(${cropRotation}deg) scale(${cropZoom})`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  }}
                />
                
                {/* Circular Mask Overlay */}
                <div className="absolute inset-0 border-[6px] border-black/30 rounded-full pointer-events-none" />
              </div>
            </div>

            {/* Editing Controls interface */}
            <div className="space-y-4 mb-6">
              {/* Slider for zoom */}
              <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-transparent">
                <ZoomOut className="h-4 w-4 text-neutral-400 shrink-0" />
                <SliderComp 
                  min={1.0} 
                  max={3.0} 
                  step={0.05} 
                  value={cropZoom} 
                  onChange={(val) => setCropZoom(val)} 
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4 text-[#FF375F] shrink-0" />
              </div>

              {/* Slider for rotation or fast rotate clickers */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setCropRotation(r => (r - 90 + 360) % 360)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl py-2.5 text-xs font-bold transition-all"
                >
                  <RotateCw className="h-3.5 w-3.5 -scale-x-100" /> Rotate Left
                </button>
                <button
                  type="button"
                  onClick={() => setCropRotation(r => (r + 90) % 360)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-205 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl py-2.5 text-xs font-bold transition-all"
                >
                  <RotateCw className="h-3.5 w-3.5" /> Rotate Right
                </button>
                <button
                  type="button"
                  onClick={resetCropper}
                  className="rounded-xl px-3 bg-slate-105 hover:bg-slate-200 dark:bg-white/8 dark:hover:bg-white/15 text-xs font-bold transition-all flex items-center justify-center"
                  title="Reset edits"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Display progress if any saving action takes place */}
            {uploadProgress > 0 && (
              <div className="mb-4">
                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-[#FF375F] mb-1">
                  <span>Formatting Image...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1 bg-slate-200 dark:bg-zinc-850 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-600 to-[#FF375F] duration-200 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                disabled={uploadProgress > 0}
                onClick={() => {
                  setIsCropping(false);
                  setEditSrc(null);
                }}
                className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs py-2.5 font-bold transition-all disabled:opacity-50"
              >
                Discard
              </button>
              <button
                onClick={handleSaveCrop}
                disabled={uploadProgress > 0}
                className="flex-1 rounded-xl bg-[#FF375F] text-white hover:bg-[#FF375F]/90 text-xs py-2.5 font-black shadow shadow-rose-500/15 transition-all disabled:opacity-50"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual listening stats indicators widgets */}
      <section className="mb-8 text-left">
        <h3 className="text-xs uppercase font-bold text-slate-500 dark:text-neutral-400 tracking-widest mb-4 flex items-center gap-1.5">
          <Activity className="h-4 w-4" /> Lifetime Statistics
        </h3>
        
        <div className="grid grid-cols-3 gap-3">
          {/* Minutes played */}
          <div className="rounded-[18px] bg-slate-100/60 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-4 text-center">
            <h4 className="font-extrabold text-[#FF375F] text-lg leading-none">{formatListeningTime(user?.listeningMinutes || 0)}</h4>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-semibold uppercase mt-1.5 block">Tension Air</span>
          </div>

          {/* Liked songs */}
          <div className="rounded-[18px] bg-slate-100/60 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-4 text-center">
            <h4 className="font-extrabold text-[#FF375F] text-lg leading-none">{likedTrackIds.length} Song{likedTrackIds.length !== 1 ? 's' : ''}</h4>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-semibold uppercase mt-1.5 block">Favorites</span>
          </div>

          {/* Saved playlists */}
          <div className="rounded-[18px] bg-slate-100/60 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-4 text-center">
            <h4 className="font-extrabold text-[#FF375F] text-lg leading-none">{playlists.length} List{playlists.length !== 1 ? 's' : ''}</h4>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-semibold uppercase mt-1.5 block">Playlists</span>
          </div>
        </div>
      </section>

      {/* Aesthetics & Theme Mode Options */}
      <section className="mb-8 text-left">
        <h3 className="text-xs uppercase font-bold text-slate-500 dark:text-neutral-400 tracking-widest mb-4 flex items-center gap-1.5">
          <Settings className="h-4 w-4" /> Aesthetics & Theme Mode
        </h3>

        <div className="rounded-[18px] border border-slate-200 dark:border-white/5 bg-slate-100/60 dark:bg-white/5 p-4 divide-y divide-slate-200 dark:divide-white/5">
          
          {/* Theme preference toggle */}
          <div className="flex items-center justify-between pb-3.5 bg-transparent">
            <div className="flex items-center gap-3">
              {themeMode === 'dark' ? (
                <Moon className="h-5 w-5 text-[#FF375F]" />
              ) : (
                <Sun className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <span className="text-sm font-bold block text-slate-900 dark:text-white">Theme Preference</span>
                <small className="text-[10px] text-slate-500 dark:text-neutral-400">
                  {themeMode === 'dark' ? 'Streaming pitch-black dark theme' : 'Crisp minimalist light theme'}
                </small>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6.5 w-12 items-center rounded-full transition-colors duration-300 p-0.5 cursor-pointer outline-none ${
                themeMode === 'dark' ? 'bg-[#FF375F]' : 'bg-slate-300'
              }`}
            >
              <span className="sr-only">Toggle Theme Mode</span>
              <span
                className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 transform ${
                  themeMode === 'dark' ? 'translate-x-5.5' : 'translate-x-[1px]'
                }`}
              />
            </button>
          </div>

          {/* Secure credentials verification status */}
          <div className="flex items-center justify-between pt-3.5">
            <div>
              <span className="text-sm font-bold block text-slate-900 dark:text-white">Subscription Package</span>
              <small className="text-[10px] text-slate-500 dark:text-neutral-400">Ad-Free Listener Level Enabled</small>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#FF375F] bg-[#FF375F]/10 py-1 px-2.5 rounded-full border border-[#FF375F]/20">
              Verified
            </span>
          </div>

        </div>
      </section>

      {/* Friends & Followers Index (displays circular follower custom avatars) */}
      <section className="mb-8 text-left">
        <h3 className="text-xs uppercase font-bold text-slate-500 dark:text-neutral-400 tracking-widest mb-4 flex items-center gap-1.5">
          <User className="h-4 w-4" /> Friends & Social
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="rounded-[18px] bg-slate-100/60 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Felix" alt="Felix Carter" className="h-9 w-9 rounded-full border border-slate-200 dark:border-white/10" />
              <div className="overflow-hidden leading-tight text-left">
                <span className="text-xs font-bold block text-slate-900 dark:text-white truncate">Felix Carter</span>
                <small className="text-[9.5px] text-slate-500 dark:text-neutral-400 truncate block">Listening to Retro Chill</small>
              </div>
            </div>
            <span className="text-[8.5px] uppercase font-black text-[#FF375F] bg-[#FF375F]/10 py-1 px-2.5 rounded-full tracking-wider shrink-0">Following</span>
          </div>

          <div className="rounded-[18px] bg-slate-100/60 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Aria" alt="Aria Bennett" className="h-9 w-9 rounded-full border border-slate-200 dark:border-white/10" />
              <div className="overflow-hidden leading-tight text-left">
                <span className="text-xs font-bold block text-slate-900 dark:text-white truncate">Aria Bennett</span>
                <small className="text-[9.5px] text-slate-500 dark:text-neutral-400 truncate block">Listening to Lofi Rain</small>
              </div>
            </div>
            <span className="text-[8.5px] uppercase font-black text-[#FF375F] bg-[#FF375F]/10 py-1 px-2.5 rounded-full tracking-wider shrink-0">Following</span>
          </div>
        </div>
      </section>

      {/* Followed Artists Index */}
      {user && user.followedArtists && user.followedArtists.length > 0 && (
        <section className="mb-2 text-left">
          <h3 className="text-xs uppercase font-bold text-[#FF375F] dark:text-[#FF375F] tracking-widest mb-4">
            Followed Artists ({user.followedArtists.length})
          </h3>
          <div className="grid grid-cols-2 gap-3.5">
            {user.followedArtists.map((artistName) => (
              <div
                key={artistName}
                onClick={() => onSelectArtist(artistName)}
                className="group p-3 rounded-[18px] bg-slate-100/60 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center gap-3.5 cursor-pointer hover:scale-[1.01] hover:bg-slate-200/50 dark:hover:bg-white/10 transition-all text-center leading-tight overflow-hidden"
              >
                <div className="h-9 w-9 rounded-full bg-[#FF375F]/10 text-[#FF375F] font-extrabold flex items-center justify-center text-sm border border-[#FF375F]/10 shrink-0">
                  {artistName.charAt(0)}
                </div>
                <div className="overflow-hidden text-left">
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate block group-hover:text-[#FF375F] transition-colors">{artistName}</span>
                  <small className="text-[9px] text-slate-500 dark:text-neutral-400 mt-0.5 block">View Catalog &rarr;</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// Specialized UI Mini-Slider component because direct HTML inputs can look highly raw
interface SliderCompProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
  className?: string;
}

const SliderComp: React.FC<SliderCompProps> = ({ min, max, step, value, onChange, className }) => {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={`h-1.5 rounded-lg bg-slate-200 dark:bg-neutral-800 accent-[#FF375F] cursor-pointer outline-none ${className}`}
    />
  );
};
