/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MusicProvider, useMusic } from './contexts/MusicContext';
import { Navigation } from './components/Navigation';
import { MiniPlayer } from './components/MiniPlayer';
import { FullPlayer } from './components/FullPlayer';
import { AuthScreen } from './components/AuthScreen';
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { LibraryView } from './components/LibraryView';
import { ProfileView } from './components/ProfileView';
import { BrowseView } from './components/BrowseView';
import { AiStudio } from './components/AiStudio';
import { ArtistAlbumDetail } from './components/ArtistAlbumDetail';
import { Heart, ChevronLeft, Play, Clock, Plus, Trash2 } from 'lucide-react';
import { TRACKS_DATABASE } from './data/tracks';

function AppContent() {
  const { isAuthenticated, themeMode } = useAuth();
  const {
    currentTrack,
    likedTrackIds,
    toggleLikeTrack,
    playTrack,
    isPlaying,
    allTracks
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'home' | 'browse' | 'search' | 'library' | 'profile'>('home');
  const [detailView, setDetailView] = useState<{ type: 'playlist' | 'artist' | 'genre'; id: string } | null>(null);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState<boolean>(false);
  const [isLikesDetailOpen, setIsLikesDetailOpen] = useState<boolean>(false);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState<boolean>(false);

  // Auto-play / load track from URL query parameter on startup
  React.useEffect(() => {
    if (!isAuthenticated) return;
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('track');
    if (trackId && allTracks.length > 0) {
      const match = allTracks.find(t => t.id === trackId);
      if (match && currentTrack?.id !== trackId) {
        playTrack(match);
        setIsPlayerExpanded(true);
        // Clear URL search parameters gracefully to prevent looping or accidental starts on refresh
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [isAuthenticated, allTracks, playTrack, currentTrack]);

  // If user is unauthenticated, show Auth Card screen
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Active subview resolver
  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeView
            onSelectArtist={(name) => setDetailView({ type: 'artist', id: name })}
            onSelectPlaylist={(id) => setDetailView({ type: 'playlist', id: id })}
            onSelectGenre={(genre) => setDetailView({ type: 'genre', id: genre })}
            onOpenAiStudio={() => setIsAiStudioOpen(true)}
          />
        );
      case 'browse':
        return (
          <BrowseView
            onSelectArtist={(name) => setDetailView({ type: 'artist', id: name })}
            onSelectGenre={(genre) => setDetailView({ type: 'genre', id: genre })}
            onSelectPlaylist={(id) => setDetailView({ type: 'playlist', id: id })}
          />
        );
      case 'search':
        return (
          <SearchView
            onSelectArtist={(name) => setDetailView({ type: 'artist', id: name })}
            onSelectGenre={(genre) => setDetailView({ type: 'genre', id: genre })}
          />
        );
      case 'library':
        return (
          <LibraryView
            onSelectPlaylist={(id) => setDetailView({ type: 'playlist', id: id })}
            onSelectLibraryLikes={() => setIsLikesDetailOpen(true)}
            onOpenAiStudio={() => setIsAiStudioOpen(true)}
          />
        );
      case 'profile':
        return <ProfileView onSelectArtist={(name) => setDetailView({ type: 'artist', id: name })} />;
      default:
        return <HomeView onSelectArtist={() => {}} onSelectPlaylist={() => {}} onSelectGenre={() => {}} onOpenAiStudio={() => setIsAiStudioOpen(true)} />;
    }
  };

  const likedTracksList = allTracks.filter(t => likedTrackIds.includes(t.id));

  // Minutes & seconds parser
  const formatSecs = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#080808] text-slate-900 dark:text-neutral-100 transition-colors duration-300 w-full flex flex-col items-center select-none">
      
      {/* Primary viewport content */}
      <div className="relative pb-40 min-h-screen w-full max-w-5xl px-4 md:px-6" style={{ display: isPlayerExpanded ? 'none' : 'block' }}>
        {renderActiveView()}
        
        {/* Dynamic Nested overlays: Playlist / Artist detail */}
        {detailView && (
          <ArtistAlbumDetail
            type={detailView.type}
            entityId={detailView.id}
            onBack={() => setDetailView(null)}
          />
        )}

        {/* Dynamic sliding panel: Favorites Favorites track collection */}
        {isLikesDetailOpen && (
          <div className="fixed inset-y-0 left-0 right-0 z-30 flex flex-col bg-[#fafafa] dark:bg-[#000000] text-slate-900 dark:text-white pb-36 w-full max-w-5xl mx-auto md:rounded-[32px] overflow-y-auto shadow-2xl">
            
            <div className="sticky top-0 z-40 bg-slate-50/85 dark:bg-black/85 backdrop-blur px-4 py-4 flex items-center justify-between border-b border-gray-100 dark:border-neutral-800/40">
              <button
                onClick={() => setIsLikesDetailOpen(false)}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5 stroke-[2.5]" /> Library
              </button>
              <span className="text-sm font-semibold">Favorites Archive</span>
              <div className="w-8 h-8" />
            </div>

            {/* Header section */}
            <div className="p-6 pt-10 flex flex-col items-center border-b border-gray-100 dark:border-zinc-800/50">
              <div className="h-32 w-32 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-500 shadow-xl flex items-center justify-center text-white scale-102">
                <Heart className="h-16 w-16 fill-current stroke-[1.5]" />
              </div>
              <h2 className="mt-4 text-2xl font-black">Liked Songs</h2>
              <p className="mt-1.5 text-xs text-[#f43f5e] font-bold uppercase tracking-wider">
                {likedTracksList.length} track{likedTracksList.length !== 1 ? 's' : ''} saved
              </p>
            </div>

            {/* List items */}
            <div className="p-4 space-y-2">
              <div className="px-2 mb-3 flex justify-between text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">
                <span>Song</span>
                <Clock className="h-4 w-4" />
              </div>

              {likedTracksList.map((track, i) => {
                const isCurrentActive = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className={`group flex items-center justify-between p-3 rounded-2xl hover:bg-white dark:hover:bg-zinc-900 border border-transparent hover:border-gray-100 dark:hover:border-neutral-800/40 cursor-pointer transition-all ${
                      isCurrentActive ? 'bg-white dark:bg-zinc-900 border-rose-500/35' : ''
                    }`}
                    onClick={() => playTrack(track, likedTracksList)}
                  >
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      <span className="text-[10px] font-mono text-slate-400 w-4 block text-center">
                        {isCurrentActive && isPlaying ? '●' : i + 1}
                      </span>
                      <img src={track.coverUrl} className="h-10 w-10 rounded-lg object-cover shadow-sm flex-shrink-0" />
                      <div className="overflow-hidden leading-tight">
                        <p className={`font-bold text-sm truncate ${isCurrentActive ? 'text-rose-500' : 'text-slate-800 dark:text-neutral-100'}`}>{track.title}</p>
                        <p className="text-xs text-slate-400 dark:text-neutral-400 truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLikeTrack(track.id);
                        }}
                        className="p-1 text-rose-500 hover:scale-115 active:scale-90 transition-transform"
                        title="Remove from favorites"
                      >
                        <Heart className="h-4 w-4" fill="currentColor" />
                      </button>
                      <span className="text-xs font-mono font-medium text-slate-400 dark:text-neutral-500 w-10 text-right">
                        {formatSecs(track.duration)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {likedTracksList.length === 0 && (
                <div className="text-center py-20 text-xs text-slate-400 italic">
                  No liked tracks identified yet. Find your style on Search and tag them with Love!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating mini-player above bottom-navbar */}
      {!isPlayerExpanded && (
        <MiniPlayer onExpand={() => setIsPlayerExpanded(true)} />
      )}

      {/* Slide-away Full player overlay */}
      <FullPlayer isOpen={isPlayerExpanded} onClose={() => setIsPlayerExpanded(false)} />

      {/* AI Studio component overlay */}
      <AiStudio isOpen={isAiStudioOpen} onClose={() => setIsAiStudioOpen(false)} />

      {/* Global Tab bar navigation */}
      {!isPlayerExpanded && (
        <Navigation activeTab={activeTab} setActiveTab={(tab) => {
          setActiveTab(tab);
          // Auto pull overlays back on navigations
          setDetailView(null);
          setIsLikesDetailOpen(false);
        }} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MusicProvider>
        <AppContent />
      </MusicProvider>
    </AuthProvider>
  );
}
