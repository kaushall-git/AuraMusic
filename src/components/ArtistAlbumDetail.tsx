/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Shuffle, Clock, ChevronLeft, Plus, Trash2, Music, Check } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { Track, Playlist } from '../types';

interface ArtistAlbumDetailProps {
  type: 'playlist' | 'artist' | 'genre';
  entityId: string;
  onBack: () => void;
}

export const ArtistAlbumDetail: React.FC<ArtistAlbumDetailProps> = ({ type, entityId, onBack }) => {
  const {
    playlists,
    playTrack,
    likedTrackIds,
    toggleLikeTrack,
    removeTrackFromPlaylist,
    deletePlaylist,
    isPlaying,
    currentTrack,
    allTracks
  } = useMusic();

  let title = '';
  let description = '';
  let coverUrl = '';
  let coverColor = 'from-violet-500 to-rose-400';
  let tracks: Track[] = [];
  let metaInfo = '';

  if (type === 'playlist') {
    const pl = playlists.find(p => p.id === entityId);
    if (!pl) return null;
    title = pl.name;
    description = pl.description;
    coverColor = pl.coverColor || 'from-indigo-600 to-rose-500';
    tracks = pl.trackIds.map(id => allTracks.find(t => t.id === id)).filter(Boolean) as Track[];
    metaInfo = `Curated by ${pl.creatorName} • ${tracks.length} track${tracks.length !== 1 ? 's' : ''}`;
    // Use first track cover as cover fallback
    if (tracks.length > 0) coverUrl = tracks[0].coverUrl;
  } else if (type === 'artist') {
    title = entityId; // Artist Name passed directly in entityId
    description = `Official fan catalog for ${entityId}. Streaming top releases.`;
    tracks = allTracks.filter(t => t.artist === entityId);
    coverColor = 'from-emerald-600 to-teal-500';
    metaInfo = `Artist • ${tracks.length} releases`;
    if (tracks.length > 0) coverUrl = tracks[0].coverUrl;
  } else if (type === 'genre') {
    title = entityId; // Genre Name
    description = `Premium selection of top-charts matching ${entityId} beats.`;
    tracks = allTracks.filter(t => t.genre.toLowerCase() === entityId.toLowerCase());
    coverColor = 'from-amber-600 to-red-500';
    metaInfo = `Genre station • ${tracks.length} tracks`;
    if (tracks.length > 0) coverUrl = tracks[0].coverUrl;
  }

  const handlePlayAll = (shuffle: boolean) => {
    if (tracks.length === 0) return;
    let selectedTracks = [...tracks];
    if (shuffle) {
      selectedTracks.sort(() => Math.random() - 0.5);
    }
    playTrack(selectedTracks[0], selectedTracks);
  };

  const handleRemoveTrack = (trackId: string) => {
    if (type === 'playlist') {
      removeTrackFromPlaylist(entityId, trackId);
    }
  };

  const handleDeleteThisPlaylist = () => {
    if (confirm('Are you sure you want to delete this playlist?')) {
      deletePlaylist(entityId);
      onBack();
    }
  };

  // Duration parser for minutes and seconds
  const formatSecs = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-y-0 left-0 right-0 z-30 flex flex-col bg-[#000000] text-white overflow-y-auto pb-36 w-full max-w-5xl mx-auto md:rounded-[32px] md:border md:border-white/5 transition-all duration-300 shadow-2xl">
      
      {/* Absolute floating Header bar */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur px-4 py-4 flex items-center justify-between border-b border-white/5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#FF375F] cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5 stroke-[2.5]" /> Back
        </button>
        <span className="text-sm font-semibold truncate max-w-[200px]">{title}</span>
        {type === 'playlist' && entityId.startsWith('pl-') && !entityId.includes('pl-ai-') ? (
          <button
            onClick={handleDeleteThisPlaylist}
            className="text-red-500 p-1.5 rounded-full hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
            title="Delete Playlist"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        ) : (
          <div className="w-8 h-8" />
        )}
      </div>

      {/* Hero Header Area */}
      <div className="p-6 pt-8 flex flex-col items-center border-b border-white/5">
        {coverUrl ? (
          <div className="h-40 w-40 rounded-2xl overflow-hidden shadow-2xl relative">
            <img src={coverUrl} alt={title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className={`h-40 w-40 rounded-2xl bg-gradient-to-tr ${coverColor} shadow-2xl flex items-center justify-center text-white`}>
            <Music className="h-16 w-16 stroke-[1.5]" />
          </div>
        )}

        {/* Info */}
        <div className="mt-5 text-center px-4 leading-tight">
          <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
          <p className="mt-1.5 text-xs font-medium text-[#FF375F] uppercase tracking-wider">{metaInfo}</p>
          <p className="mt-2 text-sm text-neutral-400 max-w-xs">{description}</p>
        </div>

        {/* Playback Buttons */}
        {tracks.length > 0 ? (
          <div className="mt-6 flex gap-4 w-full max-w-xs justify-center">
            <button
              onClick={() => handlePlayAll(false)}
              className="flex-1 flex items-center justify-center gap-2 bg-[#FF375F] text-white font-bold py-3 px-5 rounded-full hover:bg-[#FF375F]/90 active:scale-95 transition-all text-sm shadow shadow-[#FF375F]/20 cursor-pointer"
            >
              <Play className="h-4.5 w-4.5 fill-current" /> Play
            </button>
            <button
              onClick={() => handlePlayAll(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-5 rounded-full active:scale-95 transition-all text-sm cursor-pointer"
            >
              <Shuffle className="h-4.5 w-4.5" /> Shuffle
            </button>
          </div>
        ) : (
          <div className="mt-6 text-xs text-neutral-400 italic p-4 bg-white/5 rounded-xl leading-relaxed text-center max-w-xs">
            To build your playlist, click on Search, find tracks of your choice, and tap the Add option next to them!
          </div>
        )}
      </div>

      {/* Tracks List */}
      <div className="p-4 space-y-2">
        <div className="px-2 mb-3 flex justify-between text-xs font-bold text-neutral-500 uppercase tracking-wider">
          <span>Tracks</span>
          <Clock className="h-4 w-4" />
        </div>

        {tracks.map((track, index) => {
          const isCurrentActive = currentTrack?.id === track.id;
          const isLiked = likedTrackIds.includes(track.id);

          return (
            <div
              key={`${track.id}-${index}`}
              className={`group flex items-center justify-between p-3.5 rounded-[18px] hover:bg-white/5 border border-transparent transition-all duration-200 cursor-pointer ${
                isCurrentActive ? 'bg-white/10' : ''
              }`}
              onClick={() => playTrack(track, tracks)}
            >
              <div className="flex items-center gap-3.5 overflow-hidden">
                <span className={`text-[11px] font-mono font-bold w-4 flex-shrink-0 text-center ${
                  isCurrentActive ? 'text-[#FF375F]' : 'text-neutral-500'
                }`}>
                  {isCurrentActive && isPlaying ? (
                    <div className="flex gap-0.5 justify-center items-end h-3 w-3">
                      <span className="w-[2px] bg-[#FF375F] animate-[bounce_1s_infinite] h-full" style={{ animationDelay: '0.1s' }} />
                      <span className="w-[2px] bg-[#FF375F] animate-[bounce_1s_infinite] h-2/3" style={{ animationDelay: '0.3s' }} />
                      <span className="w-[2px] bg-[#FF375F] animate-[bounce_1s_infinite] h-5/6" style={{ animationDelay: '0.5s' }} />
                    </div>
                  ) : (
                    index + 1
                  )}
                </span>
                
                <img src={track.coverUrl} className="h-10 w-10 rounded-lg object-cover shadow-sm flex-shrink-0" />
                
                <div className="overflow-hidden leading-tight text-left">
                  <p className={`font-bold text-sm truncate ${
                    isCurrentActive ? 'text-[#FF375F]' : 'text-white'
                  }`}>
                    {track.title}
                  </p>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">{track.artist}</p>
                </div>
              </div>

              {/* Action Operations */}
              <div className="flex items-center gap-2 pl-2">
                {/* Like */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLikeTrack(track.id);
                  }}
                  className={`p-1.5 rounded-full hover:bg-white/5 transition-colors ${
                    isLiked ? 'text-[#FF375F]' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  <Plus className={`h-4.5 w-4.5 transition-transform ${isLiked ? 'rotate-45 text-[#FF375F] stroke-[3px]' : ''}`} />
                </button>

                {/* Remove from Playlist (if active playlist) */}
                {type === 'playlist' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTrack(track.id);
                    }}
                    className="p-1.5 rounded-full text-neutral-500 hover:text-red-500 hover:bg-white/5 transition-all cursor-pointer"
                    title="Remove Song"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}

                <span className="text-xs font-mono font-medium text-neutral-500 w-10 text-right">
                  {formatSecs(track.duration)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
