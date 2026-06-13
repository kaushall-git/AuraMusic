/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Pause, SkipForward, Heart } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { motion } from 'motion/react';

interface MiniPlayerProps {
  onExpand: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onExpand }) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    likedTrackIds,
    toggleLikeTrack
  } = useMusic();

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isLiked = likedTrackIds.includes(currentTrack.id);

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-18 left-4 right-4 z-40 max-w-xl mx-auto overflow-hidden rounded-[20px] border border-white/10 bg-neutral-950/85 shadow-[0_12px_36px_rgba(0,0,0,0.6)] backdrop-blur-xl md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[500px]"
    >
      {/* Top micro progress track */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-white/5">
        <div
          className="h-full bg-[#FF375F] transition-all duration-[200ms] ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-4 h-[64px]">
        {/* Track Details - Clicking here expands player */}
        <div
          onClick={onExpand}
          className="flex flex-1 items-center gap-3 cursor-pointer select-none overflow-hidden h-full"
        >
          {/* Cover Art */}
          <div className="relative h-11 w-11 flex-shrink-0 rounded-[10px] overflow-hidden bg-white/5">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className={`h-full w-full object-cover transition-transform duration-500 ${
                isPlaying ? 'scale-105' : 'scale-90 opacity-90'
              }`}
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Title / Artist */}
          <div className="overflow-hidden leading-tight text-left">
            <h4 className="truncate text-[13.5px] font-bold text-white">
              {currentTrack.title}
            </h4>
            <p className="truncate text-[11.5px] font-medium text-[#FF375F] mt-0.5">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        {/* Player Mini Controls */}
        <div className="flex items-center gap-3.5 pl-2">
          {/* Like */}
          <button
            onClick={() => toggleLikeTrack(currentTrack.id)}
            className={`p-1.5 hover:scale-110 active:scale-95 transition-transform duration-200 ${
              isLiked ? 'text-[#FF375F]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Heart className="h-4.5 w-4.5" fill={isLiked ? 'currentColor' : 'none'} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="h-[14px] w-[14px]" fill="currentColor" />
            ) : (
              <Play className="h-[14px] w-[14px] translate-x-[0.5px]" fill="currentColor" />
            )}
          </button>

          {/* Skip Next */}
          <button
            onClick={nextTrack}
            className="p-1.5 text-neutral-400 hover:scale-110 active:scale-95 hover:text-white transition-all duration-200"
          >
            <SkipForward className="h-4.5 w-4.5" fill="currentColor" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
