/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Compass, Play, Plus, ChevronRight, Disc, Star, Flame, Trophy, Sparkles } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { TRACKS_DATABASE } from '../data/tracks';
import { Track } from '../types';
import { motion } from 'motion/react';

interface BrowseViewProps {
  onSelectArtist: (artist: string) => void;
  onSelectGenre: (genre: string) => void;
  onSelectPlaylist: (playlistId: string) => void;
}

export const BrowseView: React.FC<BrowseViewProps> = ({
  onSelectArtist,
  onSelectGenre,
  onSelectPlaylist,
}) => {
  const { playTrack, playlists } = useMusic();

  const featuredBanners = [
    {
      id: 'banner-1',
      title: 'Cosmic Drift: Full Horizon Tour',
      subtitle: 'FEATURED ALBUM',
      description: 'Luna Eclipse delivers outstanding retro synthscapes.',
      trackId: 'track-1',
      cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
      tag: 'NEW RELEASE',
      gradient: 'from-purple-900/90 to-rose-950/95',
    },
    {
      id: 'banner-2',
      title: 'Solitude & Coffee Sessions',
      subtitle: 'CURATED SPOTLIGHT',
      description: 'Find your supreme coding cadence with Nostalgic Keys.',
      trackId: 'track-3',
      cover: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=600&auto=format&fit=crop&q=80',
      tag: 'LOFI STUDY',
      gradient: 'from-amber-950/90 to-stone-900/95',
    },
    {
      id: 'banner-3',
      title: 'Sunrise Sonata: Acoustic Dawn',
      subtitle: 'DAILY REFRESH',
      description: 'Wake up with positive vibrations from Morning Dew.',
      trackId: 'track-5',
      cover: 'https://images.unsplash.com/photo-1470252649358-96f5b871f022?w=600&auto=format&fit=crop&q=80',
      tag: 'CHILLACOUSTIC',
      gradient: 'from-emerald-950/90 to-teal-950/95',
    }
  ];

  // Hot/Trending releases
  const hotTracks = [...TRACKS_DATABASE].sort((a, b) => b.plays - a.plays).slice(0, 6);
  
  // Curated playlists fallback if none created
  const curatedCategories = [
    { name: 'Late Night Chill', desc: 'Sleep and focus music with soft synth beats', coverColor: 'from-blue-600 to-indigo-900', genre: 'Ambient' },
    { name: 'Workplace Flow', desc: 'No-vocal lo-fi soundscapes for developers', coverColor: 'from-pink-500_to-rose-600', genre: 'Lofi Hip Hop' },
    { name: 'Sunset Horizon', desc: 'Acoustic warm rhythm chords and gentle guitar', coverColor: 'from-amber-500 to-red-600', genre: 'Chilled Acoustic' },
    { name: 'Metropolitan Neon', desc: 'High-octane synth lines for city night driving', coverColor: 'from-purple-600 to-pink-600', genre: 'Synthwave' }
  ];

  // Find track in DB by id or play first
  const handlePlayRecommended = (trackId: string) => {
    const track = TRACKS_DATABASE.find(t => t.id === trackId);
    if (track) {
      playTrack(track, TRACKS_DATABASE);
    }
  };

  return (
    <div className="flex flex-col pb-36 text-white px-4 md:px-6 pt-6 overflow-y-auto w-full max-w-5xl">
      
      {/* Title Header */}
      <header className="flex items-center justify-between pb-3.5 mb-6 border-b border-white/5">
        <div className="text-left">
          <h1 className="text-3xl font-black tracking-tight text-white leading-9">Browse</h1>
          <p className="text-xs text-neutral-400 mt-1 font-semibold">
            Curated and tailored hit updates
          </p>
        </div>
        <div className="h-9 w-9 rounded-full bg-[#FF375F]/10 flex items-center justify-center text-[#FF375F]">
          <Compass className="h-5 w-5 stroke-[2.2px]" />
        </div>
      </header>

      {/* 1. Large featured album banner carousel */}
      <section className="mb-6">
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
          {featuredBanners.map((banner) => (
            <motion.div
              key={banner.id}
              whileTap={{ scale: 0.98 }}
              className="flex-shrink-0 w-[290px] h-[340px] rounded-[24px] relative overflow-hidden snap-center group shadow-lg border border-white/5"
            >
              <img
                src={banner.cover}
                alt={banner.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[7s] ease-out group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              {/* Apple Music gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${banner.gradient} opacity-90 mix-blend-multiply`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute top-5 left-5 right-5 flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 text-white backdrop-blur px-2.5 py-1 rounded-full border border-white/10">
                  {banner.tag}
                </span>
                <span className="text-[9px] font-black text-white/50 tracking-wider">AURA MUSIC EXCLUSIVE</span>
              </div>

              <div className="absolute bottom-5 left-5 right-5 text-white text-left">
                <p className="text-[10px] font-black tracking-widest text-[#FF375F] mb-1">{banner.subtitle}</p>
                <h3 className="text-lg font-black tracking-tight leading-tight line-clamp-2">
                  {banner.title}
                </h3>
                <p className="text-xs text-white/70 font-medium leading-relaxed mt-1.5 line-clamp-1">
                  {banner.description}
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handlePlayRecommended(banner.trackId)}
                    className="flex items-center gap-1.5 bg-white text-black hover:bg-neutral-105 font-bold text-xs py-2 px-4 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" /> Listen Now
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 2. Top Charts section with premium styling */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-base font-black tracking-tight flex items-center gap-1.5 text-white">
            <Trophy className="h-5 w-5 text-amber-500" /> Apple Top Charts
          </h3>
          <span className="text-xs text-[#FF375F] font-bold flex items-center cursor-pointer hover:underline">
            See All <ChevronRight className="h-4 w-4" />
          </span>
        </div>

        <div className="space-y-3">
          {hotTracks.map((track, i) => (
            <motion.div
              key={track.id}
              whileHover={{ x: 4 }}
              onClick={() => playTrack(track, hotTracks)}
              className="group flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 cursor-pointer shadow-xs backdrop-blur-md"
            >
              <div className="flex items-center gap-3.5 overflow-hidden">
                {/* Ranking number */}
                <div className="w-6 text-center">
                  <span className="text-sm font-black font-mono text-neutral-400">
                    {i + 1}
                  </span>
                </div>
                {/* Cover representation */}
                <div className="h-11 w-11 rounded-[10px] overflow-hidden flex-shrink-0 relative">
                  <img src={track.coverUrl} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-all flex items-center justify-center">
                    <Play className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-all" fill="currentColor" />
                  </div>
                </div>
                {/* Track titles */}
                <div className="overflow-hidden leading-tight text-left">
                  <h4 className="font-bold text-sm truncate text-white">
                    {track.title}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 truncate">
                    {track.artist}
                  </p>
                </div>
              </div>

              {/* Tag/Metadata */}
              <div className="flex items-center gap-3 pl-2 flex-shrink-0">
                <span className="text-[9.5px] bg-white/10 text-neutral-300 px-2.5 py-1 rounded-sm font-black uppercase tracking-wider font-sans border border-white/5">
                  {track.plays >= 100000 ? `${(track.plays / 1000).toFixed(0)}K plays` : track.genre}
                </span>
                <button className="text-neutral-400 hover:text-white p-1">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. New Releases Horizontal Scroll */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-base font-black tracking-tight flex items-center gap-1.5 text-white">
            <Flame className="h-5 w-5 text-[#FF375F]" /> New on Aura Music
          </h3>
          <span className="text-xs text-[#FF375F] font-bold flex items-center cursor-pointer hover:underline">
            Browse All <ChevronRight className="h-4 w-4" />
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {[...TRACKS_DATABASE].reverse().map((track) => (
            <motion.div
              key={`new-${track.id}`}
              whileHover={{ y: -4 }}
              onClick={() => playTrack(track, TRACKS_DATABASE)}
              className="flex-shrink-0 w-36 cursor-pointer group"
            >
              <div className="relative h-36 w-36 rounded-[18px] overflow-hidden shadow-sm bg-neutral-900 border border-white/5">
                <img src={track.coverUrl} className="h-full w-full object-cover transition-transform duration-350 group-hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-all" fill="currentColor" />
                </div>
              </div>
              <h4 className="mt-2.5 font-bold text-xs truncate text-white">
                {track.title}
              </h4>
              <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                {track.artist}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. Curated Mood Carousels */}
      <section className="mb-2">
        <h3 className="text-base font-black tracking-tight mb-3.5 text-white flex items-center gap-1.5 text-left">
          <Sparkles className="h-5 w-5 text-[#FF375F]" /> Curated Audio Stations
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {curatedCategories.map((cat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectGenre(cat.genre)}
              className="flex flex-col p-5 rounded-2xl border border-white/5 bg-white/5 cursor-pointer shadow-xs text-left backdrop-blur-md"
            >
              <div className={`h-10 w-10 text-white rounded-xl bg-gradient-to-tr ${cat.coverColor} flex items-center justify-center shadow-md border border-white/10`}>
                <Disc className="h-5 w-5 animate-spin-slow" />
              </div>
              <h4 className="mt-3 font-bold text-sm tracking-tight text-white">{cat.name}</h4>
              <p className="text-[10px] text-neutral-400 leading-normal mt-1 line-clamp-2">
                {cat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
