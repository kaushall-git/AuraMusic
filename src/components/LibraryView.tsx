/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Heart, Music, ListMusic, Check, FileDown, FolderHeart, Sparkles, LayoutGrid, LayoutList } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { TRACKS_DATABASE } from '../data/tracks';
import { Playlist } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface LibraryViewProps {
  onSelectPlaylist: (playlistId: string) => void;
  onSelectLibraryLikes: () => void;
  onOpenAiStudio: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onSelectPlaylist,
  onSelectLibraryLikes,
  onOpenAiStudio
}) => {
  const {
    playlists,
    likedTrackIds,
    createPlaylist,
    offlineDownloadedIds
  } = useMusic();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDesc, setPlaylistDesc] = useState('');
  const [playlistColor, setPlaylistColor] = useState('from-rose-500 to-indigo-500');
  
  // Grid/List toggle for premium playlist display
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const colorPresets = [
    { value: 'from-rose-500 to-indigo-500', name: 'Twilight Velvet' },
    { value: 'from-amber-400 to-red-500', name: 'Solar Flame' },
    { value: 'from-emerald-500 to-teal-400', name: 'Ocean Mist' },
    { value: 'from-cyan-500 to-blue-600', name: 'Cyber Blue' },
    { value: 'from-pink-500 to-rose-400', name: 'Summer Sorbet' },
    { value: 'from-purple-600 to-fuchsia-500', name: 'Deep Purple' }
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim()) return;

    createPlaylist(playlistName, playlistDesc, playlistColor);
    setPlaylistName('');
    setPlaylistDesc('');
    setShowCreateModal(false);
  };

  return (
    <div className="flex flex-col pb-36 text-white px-4 md:px-6 pt-6 overflow-y-auto w-full max-w-5xl">
      <header className="flex items-center justify-between pb-3.5 mb-6 border-b border-white/5">
        <div className="text-left">
          <h1 className="text-3xl font-black tracking-tight text-white leading-9">Library</h1>
          <p className="text-xs text-neutral-400 mt-1 font-semibold">
            Your personal music archive and stations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.2 rounded-full bg-[#FF375F] hover:bg-[#FF375F]/90 active:scale-95 transition-all text-white font-black text-xs py-2 px-3.5 shadow-sm cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 stroke-[3px]" /> Create
        </button>
      </header>

      {/* Primary Category Quick Launchers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
        {/* Liked Tracks launcher */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={onSelectLibraryLikes}
          className="rounded-[18px] border border-white/5 bg-white/5 p-4 hover:scale-[1.01] transition-all duration-200 cursor-pointer flex items-center gap-4 shadow-xs"
        >
          <div className="h-11 w-11 rounded-xl bg-[#FF375F] flex items-center justify-center text-white shadow-md shadow-[#FF375F]/10 flex-shrink-0">
            <Heart className="h-5.5 w-5.5" fill="currentColor" />
          </div>
          <div className="overflow-hidden">
            <h4 className="font-extrabold text-sm tracking-tight text-white truncate">Liked Songs</h4>
            <span className="text-[11px] text-neutral-400 mt-0.5 block font-bold">
              {likedTrackIds.length} Song{likedTrackIds.length !== 1 ? 's' : ''}
            </span>
          </div>
        </motion.div>

        {/* Offline downloaded track container */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="rounded-[18px] border border-white/5 bg-white/5 p-4 hover:scale-[1.01] transition-all duration-200 cursor-pointer flex items-center gap-4 shadow-xs"
        >
          <div className="h-11 w-11 rounded-xl bg-[#059669] flex items-center justify-center text-white shadow-md shadow-emerald-500/10 flex-shrink-0">
            <FileDown className="h-5.5 w-5.5" />
          </div>
          <div className="overflow-hidden">
            <h4 className="font-extrabold text-sm tracking-tight text-white truncate">Downloads</h4>
            <span className="text-[10px] text-emerald-400 font-extrabold mt-1 block uppercase tracking-wider">
              {offlineDownloadedIds.length} Offline
            </span>
          </div>
        </motion.div>

        {/* Aura AI Lab Launcher */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={onOpenAiStudio}
          className="rounded-[18px] border border-purple-500/15 bg-purple-950/5 p-4 hover:scale-[1.01] transition-all duration-200 cursor-pointer flex items-center gap-4 shadow-xs"
        >
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-[#FF375F] to-[#7C3AED] flex items-center justify-center text-white shadow-md shadow-purple-500/10 flex-shrink-0">
            <Sparkles className="h-5.5 w-5.5" />
          </div>
          <div className="overflow-hidden">
            <h4 className="font-extrabold text-sm tracking-tight text-white truncate">Aura AI Lab</h4>
            <span className="text-[10px] text-purple-400 font-extrabold mt-1 block uppercase tracking-wider">
              Voice & Music Studio
            </span>
          </div>
        </motion.div>
      </div>

      {/* Directory Listing Section Header with Layout Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-left">
          <FolderHeart className="h-5 w-5 text-[#FF375F]" /> My Playlists
        </h3>

        {/* Grid/List View Selector */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'list' ? 'bg-[#FF375F] text-white shadow-xs' : 'text-neutral-400'
            }`}
            title="List View"
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid' ? 'bg-[#FF375F] text-white shadow-xs' : 'text-neutral-405'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Dynamic View container */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {playlists.map((pl) => {
            const isAi = pl.id.includes('pl-ai-');
            return (
              <motion.div
                layout
                whileHover={{ scale: 1.005 }}
                key={pl.id}
                onClick={() => onSelectPlaylist(pl.id)}
                className="group flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-[18px] cursor-pointer transition-all duration-200 shadow-xs"
              >
                <div className="flex items-center gap-3.5 overflow-hidden text-left">
                  {/* Fallback gradients */}
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-tr ${pl.coverColor || 'from-indigo-600 to-rose-500'} flex items-center justify-center text-white shadow shadow-inner flex-shrink-0 relative overflow-hidden`}>
                    {isAi ? (
                      <Sparkles className="h-5.5 w-5.5" />
                    ) : (
                      <ListMusic className="h-5.5 w-5.5" />
                    )}
                    {isAi && (
                      <div className="absolute top-0 right-0 bg-yellow-500 text-[7px] font-black text-black py-0.5 px-2 uppercase tracking-wide rounded-bl">AI</div>
                    )}
                  </div>

                  <div className="overflow-hidden leading-tight">
                    <h4 className="font-extrabold text-sm text-white truncate group-hover:text-[#FF375F] transition-colors">
                      {pl.name}
                    </h4>
                    <p className="text-xs text-neutral-400 truncate mt-0.5 max-w-[200px]">{pl.description}</p>
                  </div>
                </div>

                <div className="flex items-center pl-2 flex-shrink-0">
                  <span className="text-xs font-black text-[#FF375F] px-2.5 py-1 bg-[#FF375F]/10 rounded-full">
                    {pl.trackIds.length} track{pl.trackIds.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Grid category display view */
        <div className="grid grid-cols-2 gap-4">
          {playlists.map((pl) => {
            const isAi = pl.id.includes('pl-ai-');
            return (
              <motion.div
                layout
                whileHover={{ scale: 1.02 }}
                key={pl.id}
                onClick={() => onSelectPlaylist(pl.id)}
                className="flex flex-col p-4 bg-white/5 border border-white/5 rounded-[18px] cursor-pointer transition-all duration-200 shadow-xs text-left group"
              >
                <div className={`h-24 w-full rounded-xl bg-gradient-to-tr ${pl.coverColor || 'from-indigo-600 to-rose-500'} flex items-center justify-center text-white shadow-md relative overflow-hidden`}>
                  {isAi ? (
                    <Sparkles className="h-10 w-10" />
                  ) : (
                    <ListMusic className="h-10 w-10" />
                  )}
                  {isAi && (
                    <div className="absolute top-0 right-0 bg-yellow-500 text-[8px] font-black text-black py-0.5 px-2 uppercase tracking-widest rounded-bl">AI</div>
                  )}
                </div>
                <h4 className="mt-3 font-extrabold text-sm text-white truncate group-hover:text-[#FF375F]">
                  {pl.name}
                </h4>
                <p className="text-[10px] text-neutral-400 truncate mt-0.5 leading-snug">{pl.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-neutral-550 uppercase tracking-wider">Creator: {pl.creatorName}</span>
                  <span className="text-[10px] font-extrabold text-[#FF375F] bg-[#FF375F]/10 px-2 py-0.5 rounded-full">{pl.trackIds.length} Tracks</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {playlists.length === 0 && (
        <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl bg-white/5 text-left px-6">
          <Music className="h-10 w-10 text-[#FF375F] bg-[#FF375F]/10 p-2 rounded-xl mx-auto mb-4" />
          <h5 className="font-extrabold text-sm text-white text-center">Your Library is Empty</h5>
          <p className="text-xs text-neutral-400 text-center max-w-xs mx-auto mt-1 leading-normal font-sans">
            Tap the plus Create button in the header, input a name, choose an artwork color, and craft your first playlist!
          </p>
        </div>
      )}

      {/* Playlist Creation Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-5"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-sm rounded-[28px] bg-neutral-950 border border-white/10 p-6 shadow-2xl text-white flex flex-col"
            >
              <h3 className="text-lg font-black tracking-tight border-b border-white/5 pb-3 text-left">New Playlist</h3>
              
              <form onSubmit={handleCreate} className="mt-4 space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Playlist Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Midnight Lofi Coding"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    className="w-full rounded-2xl bg-white/5 border border-white/5 pl-4 pr-4 py-3 text-sm focus:ring-1 focus:ring-[#FF375F] outline-none font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Description</label>
                  <textarea
                    placeholder="e.g., Deep focus sessions powered by atmospheric hums."
                    value={playlistDesc}
                    onChange={(e) => setPlaylistDesc(e.target.value)}
                    className="w-full rounded-2xl bg-white/5 border border-white/5 pl-4 pr-4 py-3 text-sm focus:ring-1 focus:ring-[#FF375F] outline-none min-h-[60px] font-sans"
                  />
                </div>

                {/* Color picker */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Artwork Preset</label>
                  <div className="grid grid-cols-6 gap-2 pt-1">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setPlaylistColor(preset.value)}
                        className={`h-7 w-7 rounded-lg bg-gradient-to-tr ${preset.value} border-2 relative cursor-pointer active:scale-90 transition-transform ${
                          playlistColor === preset.value ? 'border-[#FF375F] scale-105' : 'border-transparent'
                        }`}
                        title={preset.name}
                      >
                        {playlistColor === preset.value && (
                          <Check className="h-3.5 w-3.5 absolute inset-0 m-auto text-white stroke-[4px]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex gap-3 border-t border-white/5 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 rounded-full bg-white/5 hover:bg-white/10 font-extrabold py-3 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-full bg-[#FF375F] hover:bg-[#FF375F]/95 font-extrabold py-3 text-xs text-white shadow shadow-[#FF375F]/20"
                  >
                    Build List
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
