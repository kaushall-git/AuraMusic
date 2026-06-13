/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Play, Music, Flame, Clock, Plus, Disc, HelpCircle, Star, ArrowRight } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { useAuth as useUserAuth } from '../contexts/AuthContext';
import { TRACKS_DATABASE } from '../data/tracks';
import { Track } from '../types';
import { motion } from 'motion/react';

interface HomeViewProps {
  onSelectArtist: (artist: string) => void;
  onSelectPlaylist: (playlistId: string) => void;
  onSelectGenre: (genre: string) => void;
  onOpenAiStudio: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectArtist,
  onSelectPlaylist,
  onSelectGenre,
  onOpenAiStudio
}) => {
  const { user } = useUserAuth();
  const { playTrack, history, generateAiPlaylist, isAiGenerating } = useMusic();
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);

  // Hourly greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Suggested tags
  const promptSuggestions = [
    'Deep lofi coding state',
    'Synthwave night drive',
    'Acoustic cozy coffee study',
    'Calm sleep ambient'
  ];

  const handleAiSynthesize = async (p: string) => {
    if (!p.trim() || isAiGenerating) return;
    setAiError(null);
    try {
      const generatedPl = await generateAiPlaylist(p);
      if (generatedPl) {
        setAiPrompt('');
        onSelectPlaylist(generatedPl.id);
      }
    } catch {
      setAiError('Oops! The recommendation engine experienced a heavy load. Created a default custom mix instead!');
    }
  };

  const trendingTracks = [...TRACKS_DATABASE].sort((a, b) => b.likes - a.likes).slice(0, 5);
  const newReleases = [...TRACKS_DATABASE].reverse().slice(0, 5);
  const featuredArtistList = Array.from(new Set(TRACKS_DATABASE.map(t => t.artist))).slice(0, 4);

  return (
    <div className="flex flex-col pb-36 text-white px-4 md:px-6 pt-6 overflow-y-auto w-full max-w-5xl">
      
      {/* Dynamic Greetings header */}
      <header className="flex items-center justify-between pb-4 mb-6 border-b border-white/5">
        <div className="text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-white leading-9">
            {getGreeting()}
          </h1>
          <p className="text-[13px] text-neutral-400 mt-1 font-medium">
            Welcome back, <span className="text-[#FF375F] font-bold">{user?.displayName || 'Music Lover'}</span>
          </p>
        </div>
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt="Profile Avatar"
            className="h-11 w-11 rounded-full border border-white/10 shadow-md object-cover"
          />
        ) : (
          <div className="h-11 w-11 rounded-full bg-[#FF375F]/15 flex items-center justify-center text-[#FF375F] font-black text-sm border border-[#FF375F]/20">
            {user?.displayName?.charAt(0) || 'M'}
          </div>
        )}
      </header>

      {/* Featured Banner Card: Apple Music Style */}
      <div className="mb-6 rounded-[24px] bg-[#111111] overflow-hidden relative h-56 flex items-center p-6 md:p-8 text-white shadow-2xl border border-white/5">
        <div className="absolute inset-0 bg-cover bg-center opacity-50 transition-transform duration-700 ease-out hover:scale-105" style={{ backgroundImage: `url(${TRACKS_DATABASE[0].coverUrl})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        
        <div className="relative z-10 max-w-md text-left">
          <span className="text-[10px] font-black tracking-[0.2em] text-[#FF375F] uppercase">FEATURED STATION</span>
          <h2 className="text-2xl font-black tracking-tight mt-1 leading-tight">Cosmic Drift Radio</h2>
          <p className="text-[12px] text-neutral-300 mt-1 leading-relaxed">Relaxing soundscapes matching your digital space and focus flows.</p>
          <button
            onClick={() => playTrack(TRACKS_DATABASE[0], TRACKS_DATABASE)}
            className="mt-4 flex items-center gap-2 bg-[#FF375F] text-white hover:bg-[#ff4f72] active:scale-95 transition-all text-xs font-bold px-5 py-2.5 rounded-full cursor-pointer shadow-lg shadow-[#FF375F]/20"
          >
            <Play className="h-3.5 w-3.5 fill-current" /> Listen Now
          </button>
        </div>
      </div>

      {/* Smart AI Playlist Synthesizer Block */}
      <section className="mb-8 overflow-hidden rounded-[24px] bg-gradient-to-tr from-[#7C3AED] to-[#EC4899] p-5 md:p-6 text-white shadow-xl relative border border-white/10">
        <div className="absolute right-[-20px] bottom-[-20px] opacity-15 blur-sm max-w-[150px] pointer-events-none">
          <Disc className="h-40 w-44 animate-spin-slow text-white" />
        </div>

        <div className="relative z-10 text-left">
          <div className="flex items-center gap-1.5 font-bold text-[9px] uppercase tracking-widest bg-white/15 px-2.5 py-1 rounded-full w-fit">
            <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300" /> GEMINI AI PLAYLISTS
          </div>
          
          <h2 className="mt-2 text-xl font-black leading-tight tracking-tight">
            Synthesize Custom Playlists
          </h2>
          <p className="mt-1 text-xs text-white/90 leading-relaxed max-w-md">
            Enter any mood, genre concept, or focus topic. Let Gemini AI assemble a tailored, ready-to-stream mix!
          </p>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row items-stretch sm:items-center">
            <input
              type="text"
              placeholder="e.g., Late night focus beats for coding"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="flex-1 rounded-xl bg-black/25 px-4 py-3 text-xs text-white placeholder-white/40 border border-white/10 outline-none focus:bg-black/40 transition-all text-left"
              disabled={isAiGenerating}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSynthesize(aiPrompt)}
            />
            <button
              onClick={() => handleAiSynthesize(aiPrompt)}
              disabled={isAiGenerating || !aiPrompt.trim()}
              className="rounded-xl bg-white font-extrabold text-slate-950 px-5 py-3 text-xs hover:bg-neutral-100 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-white/50 shrink-0 shadow-lg"
            >
              {isAiGenerating ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 fill-current text-[#7C3AED]" />
                  Synthesize
                </>
              )}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-white/80 font-medium">Want to generate custom voice audio tracks, transcribe notes, or render music clips?</p>
            <button
              onClick={onOpenAiStudio}
              className="rounded-xl bg-white/15 border border-white/10 hover:bg-white/25 active:scale-95 transition-all text-white font-black text-[11px] py-2.5 px-4 flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto text-center justify-center shadow-inner"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" /> Aura AI Creator Lab <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Quick-Prompt suggestions */}
          <div className="mt-3.5 flex flex-wrap gap-2">
            {promptSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setAiPrompt(s)}
                className="text-[9.5px] bg-white/10 hover:bg-white/20 border border-white/5 py-1 px-3 rounded-full transition-colors text-white/90 cursor-pointer font-semibold"
              >
                {s}
              </button>
            ))}
          </div>

          {aiError && (
            <p className="mt-3 text-xs bg-red-500/20 text-red-100 py-1.5 px-3 rounded-lg font-medium">{aiError}</p>
          )}
        </div>
      </section>

      {/* Recently Played */}
      {history.length > 0 && (
        <section className="mb-8 text-left">
          <h3 className="text-base font-black text-white tracking-tight flex items-center gap-1.5 mb-4">
            <Clock className="h-5 w-5 text-neutral-400" /> Recently Played
          </h3>
          <div 
            className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
            style={{ scrollbarWidth: 'none' }}
          >
            {history.slice(0, 6).map((track, idx) => (
              <motion.div
                whileHover={{ scale: 1.02 }}
                key={`${track.id}-${idx}`}
                onClick={() => playTrack(track, history)}
                className="flex-shrink-0 w-32 cursor-pointer select-none group"
              >
                <div className="relative h-32 w-32 rounded-[18px] overflow-hidden shadow-md bg-[#111111] border border-white/5">
                  <img src={track.coverUrl} className="h-full w-full object-cover group-hover:scale-105 duration-350 transition-transform" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0" fill="currentColor" />
                  </div>
                </div>
                <h4 className="mt-2 font-bold text-xs truncate text-white">{track.title}</h4>
                <p className="text-[10px] text-neutral-400 truncate mt-0.5">{track.artist}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Made For You */}
      <section className="mb-8 text-left">
        <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5 mb-4">
          <Sparkles className="h-5 w-5 text-[#FF375F]" /> Made For You
        </h3>
        <div 
          className="flex gap-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {TRACKS_DATABASE.slice(0, 5).map((track) => (
            <motion.div
              whileHover={{ y: -3 }}
              key={`made-for-you-${track.id}`}
              onClick={() => playTrack(track, TRACKS_DATABASE)}
              className="flex-shrink-0 w-36 cursor-pointer group"
            >
              <div className="relative h-36 w-36 rounded-[18px] overflow-hidden shadow-md bg-[#111111] border border-white/5">
                <img src={track.coverUrl} className="h-full w-full object-cover group-hover:scale-105 duration-350 transition-transform" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0" fill="currentColor" />
                </div>
              </div>
              <h4 className="mt-2 font-bold text-xs truncate text-white">{track.title}</h4>
              <p className="text-[10px] text-neutral-400 truncate mt-0.5">{track.artist}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trending Now */}
      <section className="mb-8 text-left">
        <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5 mb-4">
          <Star className="h-5 w-5 text-amber-400" /> Trending Now
        </h3>
        <div 
          className="flex gap-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {trendingTracks.map((track) => (
            <motion.div
              whileHover={{ y: -3 }}
              key={`trending-${track.id}`}
              onClick={() => playTrack(track, trendingTracks)}
              className="flex-shrink-0 w-36 cursor-pointer group"
            >
              <div className="relative h-36 w-36 rounded-[18px] overflow-hidden shadow-lg bg-[#111111] border border-white/5">
                <img src={track.coverUrl} className="h-full w-full object-cover group-hover:scale-105 duration-350 transition-transform" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0" fill="currentColor" />
                </div>
              </div>
              <h4 className="mt-2 font-bold text-xs truncate text-white">{track.title}</h4>
              <p className="text-[10px] text-neutral-400 truncate mt-0.5">{track.artist}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* New Releases Slider */}
      <section className="mb-8 text-left">
        <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5 mb-4">
          <Flame className="h-5 w-5 text-[#FF375F]" /> New Releases
        </h3>
        <div 
          className="flex gap-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {newReleases.map((track) => (
            <motion.div
              whileHover={{ y: -3 }}
              key={`new-release-${track.id}`}
              onClick={() => playTrack(track, newReleases)}
              className="flex-shrink-0 w-36 cursor-pointer group"
            >
              <div className="relative h-36 w-36 rounded-[18px] overflow-hidden shadow-md bg-[#111111] border border-white/5">
                <img src={track.coverUrl} className="h-full w-full object-cover group-hover:scale-105 duration-350 transition-transform" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0" fill="currentColor" />
                </div>
              </div>
              <h4 className="mt-2.5 font-bold text-xs truncate text-white">{track.title}</h4>
              <p className="text-[10px] text-neutral-400 truncate mt-0.5">{track.artist}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Artists section */}
      <section className="mb-8 text-left">
        <h3 className="text-base font-black tracking-tight text-white mb-3.5">
          Artists to Follow
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {featuredArtistList.map((artist) => (
            <motion.div
              whileHover={{ scale: 1.015 }}
              key={artist}
              onClick={() => onSelectArtist(artist)}
              className="flex items-center gap-3.5 p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer shadow-xs animate-fade-in backdrop-blur-md"
            >
              <div className="h-10 w-10 rounded-full overflow-hidden bg-[#FF375F]/10 flex items-center justify-center text-[#FF375F] font-black shadow-sm border border-[#FF375F]/15">
                {artist.charAt(0)}
              </div>
              <div className="overflow-hidden leading-tight">
                <p className="font-extrabold text-sm truncate text-white">{artist}</p>
                <small className="text-[9px] text-[#FF375F] font-black uppercase tracking-wider">Top Chart</small>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Global Charts and Categories */}
      <section className="mb-2 text-left">
        <h3 className="text-base font-black tracking-tight text-white mb-3.5">
          Curated Genre Waves
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {['Synthwave', 'Ambient', 'Jazz'].map((g) => (
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              key={g}
              onClick={() => onSelectGenre(g)}
              className="h-16 flex items-center justify-center font-black text-xs text-white rounded-2xl bg-gradient-to-tr from-neutral-900 to-neutral-950 border border-white/5 shadow-md cursor-pointer text-center px-1"
            >
              {g}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
