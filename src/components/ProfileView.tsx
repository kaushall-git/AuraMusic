/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogOut, Sun, Moon, Edit, Check, Settings, Activity, Disc, Heart, Music, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMusic } from '../contexts/MusicContext';

interface ProfileViewProps {
  onSelectArtist: (artist: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onSelectArtist }) => {
  const { user, themeMode, toggleTheme, updateProfile, logout } = useAuth();
  const { likedTrackIds, playlists } = useMusic();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.photoURL || '');

  const avatarSeeds = ['Luna', 'Apex', 'Zephyr', 'Soundwave', 'Nova', 'Pioneer'];

  const handleSave = () => {
    if (!editedName.trim()) return;
    updateProfile(editedName, selectedAvatar);
    setIsEditing(false);
  };

  const handleAvatarSelect = (seed: string) => {
    setSelectedAvatar(`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`);
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

  return (
    <div className="flex flex-col pb-36 text-white px-4 md:px-6 pt-6 overflow-y-auto w-full max-w-5xl">
      <header className="flex items-center justify-between pb-3.5 mb-6 border-b border-white/5">
        <div className="text-left">
          <h1 className="text-3xl font-black tracking-tight text-white leading-9">Account</h1>
          <p className="text-xs text-neutral-400 mt-1 font-semibold">
            Manage your credentials and aesthetics
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-rose-500 hover:bg-rose-500/10 active:scale-95 duration-200 transition-colors rounded-full cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="h-5.5 w-5.5" />
        </button>
      </header>

      {/* Profile Detail Card */}
      {user && (
        <div className="rounded-[24px] border border-white/5 bg-white/5 p-6 flex flex-col items-center text-center shadow-sm relative mb-8 backdrop-blur-md">
          
          {/* Cover image edit indicator */}
          <div className="relative group cursor-pointer" onClick={() => setIsEditing(true)}>
            <img
              src={selectedAvatar || user.photoURL}
              alt={user.displayName}
              className="h-24 w-24 rounded-full border-2 border-[#FF375F] shadow-md object-cover"
            />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 duration-150 transition-all">
              <Edit className="h-5 w-5 text-white" />
            </div>
          </div>

          {isEditing ? (
            <div className="mt-4 w-full space-y-3.5">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full text-center px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 font-bold outline-none ring-1 ring-transparent focus:ring-[#FF375F] focus:border-[#FF375F] text-white"
              />
              {/* Avatar Swatches selection */}
              <div className="space-y-1">
                <small className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Select Avatar Style</small>
                <div className="flex justify-center gap-2 mt-1">
                  {avatarSeeds.map((seed) => {
                    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
                    return (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => handleAvatarSelect(seed)}
                        className={`h-8 w-8 rounded-full overflow-hidden border-2 transition-transform active:scale-90 cursor-pointer ${
                          selectedAvatar === avatarUrl ? 'border-[#FF375F] scale-110 shadow' : 'border-transparent'
                        }`}
                      >
                        <img src={avatarUrl} className="h-full w-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedName(user.displayName);
                    setSelectedAvatar(user.photoURL || '');
                  }}
                  className="flex-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs py-2.5 font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 rounded-xl bg-[#FF375F] text-white text-xs py-2.5 font-bold shadow hover:bg-[#FF375F]/90"
                >
                  Save Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <h2 className="text-xl font-extrabold flex items-center justify-center gap-1.5 leading-tight">
                {user.displayName}
                <Sparkles className="h-4.5 w-4.5 text-amber-500 fill-amber-500" title="Aura Premium" />
              </h2>
              <p className="text-xs text-neutral-400 mt-1">{user.email}</p>
              {user.phoneNumber && (
                <p className="text-[10px] font-mono text-neutral-400 font-medium tracking-wide mt-1">
                  MAPPED PHONE: {user.phoneNumber} (OTP OK)
                </p>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="mt-3 text-xs text-[#FF375F] hover:text-[#FF375F]/90 font-bold uppercase tracking-wider flex items-center justify-center gap-1 mx-auto py-1 px-3 bg-[#FF375F]/5 hover:bg-[#FF375F]/10 rounded-full"
              >
                <Edit className="h-3 w-3" /> Edit Details
              </button>
            </div>
          )}
        </div>
      )}

      {/* Visual listening stats indicators widgets */}
      <section className="mb-8 text-left">
        <h3 className="text-xs uppercase font-bold text-neutral-400 tracking-widest mb-4 flex items-center gap-1.5">
          <Activity className="h-4 w-4" /> Lifetime Statistics
        </h3>
        
        <div className="grid grid-cols-3 gap-3">
          {/* Minutes played */}
          <div className="rounded-[18px] bg-white/5 p-4 border border-white/5 text-center">
            <h4 className="font-extrabold text-[#FF375F] text-lg leading-none">{formatListeningTime(user?.listeningMinutes || 0)}</h4>
            <span className="text-[10px] text-neutral-450 font-semibold uppercase mt-1.5 block">Tension Air</span>
          </div>

          {/* Liked songs */}
          <div className="rounded-[18px] bg-white/5 p-4 border border-white/5 text-center">
            <h4 className="font-extrabold text-[#FF375F] text-lg leading-none">{likedTrackIds.length} Song{likedTrackIds.length !== 1 ? 's' : ''}</h4>
            <span className="text-[10px] text-neutral-450 font-semibold uppercase mt-1.5 block">Favorites</span>
          </div>

          {/* Saved playlists */}
          <div className="rounded-[18px] bg-white/5 p-4 border border-white/5 text-center">
            <h4 className="font-extrabold text-[#FF375F] text-lg leading-none">{playlists.length} List{playlists.length !== 1 ? 's' : ''}</h4>
            <span className="text-[10px] text-neutral-450 font-semibold uppercase mt-1.5 block">Playlists</span>
          </div>
        </div>
      </section>

      {/* Interactive Account & Color Preferences */}
      <section className="mb-8 text-left">
        <h3 className="text-xs uppercase font-bold text-neutral-400 tracking-widest mb-4 flex items-center gap-1.5">
          <Settings className="h-4 w-4" /> Aesthetics & Theme Mode
        </h3>

        <div className="rounded-[18px] border border-white/5 bg-white/5 p-4 divide-y divide-white/5">
          
          {/* Theme preference placeholder lock */}
          <div className="flex items-center justify-between pb-3.5">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-[#FF375F]" />
              <div>
                <span className="text-sm font-bold block">Theme Preference</span>
                <small className="text-[10px] text-neutral-400">Locked to modern streaming pitch-black theme</small>
              </div>
            </div>
            <button
              disabled
              className="relative inline-flex h-6.5 w-12 items-center rounded-full bg-white/5 cursor-not-allowed p-0.5 opacity-50"
            >
              <span className="sr-only">Toggle Theme Mode</span>
              <span
                className="h-5 w-5 rounded-full bg-[#FF375F] shadow-md transform translate-x-5.5"
              />
            </button>
          </div>

          {/* Secure credentials verification status */}
          <div className="flex items-center justify-between pt-3.5">
            <div>
              <span className="text-sm font-bold block">Subscription Package</span>
              <small className="text-[10px] text-neutral-400">Ad-Free Listener Level Enabled</small>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 py-1 px-2.5 rounded-full border border-emerald-500/20">
              Verified
            </span>
          </div>

        </div>
      </section>

      {/* Followed Artists Index */}
      {user && user.followedArtists && user.followedArtists.length > 0 && (
        <section className="mb-2 text-left">
          <h3 className="text-xs uppercase font-bold text-neutral-400 tracking-widest mb-4">
            Followed Artists ({user.followedArtists.length})
          </h3>
          <div className="grid grid-cols-2 gap-3.5">
            {user.followedArtists.map((artistName) => (
              <div
                key={artistName}
                onClick={() => onSelectArtist(artistName)}
                className="group p-3 rounded-[18px] bg-white/5 border border-white/5 flex items-center gap-3.5 cursor-pointer hover:scale-[1.01] hover:bg-white/10 transition-all text-center leading-tight overflow-hidden"
              >
                <div className="h-9 w-9 rounded-full bg-[#FF375F]/10 text-[#FF375F] font-extrabold flex items-center justify-center text-sm border border-[#FF375F]/10">
                  {artistName.charAt(0)}
                </div>
                <div className="overflow-hidden text-left">
                  <span className="font-bold text-xs text-white truncate block group-hover:text-[#FF375F]">{artistName}</span>
                  <small className="text-[9px] text-neutral-450 mt-0.5 block">View Catalog &rarr;</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
