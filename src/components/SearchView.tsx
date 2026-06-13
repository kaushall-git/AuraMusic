/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, Play, Plus, X, ListCheck, Music, Check, Volume2, Globe, Loader2, Compass } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { TRACKS_DATABASE, GENRES_LIST } from '../data/tracks';
import { Track, Playlist } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SearchViewProps {
  onSelectArtist: (artist: string) => void;
  onSelectGenre: (genre: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ onSelectArtist, onSelectGenre }) => {
  const {
    playTrack,
    playlists,
    addTrackToPlaylist,
    registerCustomTracks
  } = useMusic();

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'songs' | 'artists' | 'genres'>('all');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceSupport, setVoiceSupport] = useState(false);
  
  // Internet Search integrations
  const [isInternetSearch, setIsInternetSearch] = useState(true);
  const [internetTracks, setInternetTracks] = useState<Track[]>([]);
  const [isSearchingInternet, setIsSearchingInternet] = useState(false);
  const [internetError, setInternetError] = useState<string | null>(null);

  // Playlist picker popup
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [addedSuccessMsg, setAddedSuccessMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Check voice search capabilities
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupport(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVoiceListening(true);
        setVoiceTranscript('Listening...');
      };

      recognition.onerror = () => {
        setVoiceTranscript('No sound detected. Try again.');
        setTimeout(() => setIsVoiceListening(false), 1500);
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(`" ${transcript} "`);
        setQuery(transcript);
        setTimeout(() => setIsVoiceListening(false), 1200);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Sync / Debounce query for live web Audius Music Catalog lookup (full length streaming)
  useEffect(() => {
    if (!isInternetSearch || !query.trim()) {
      setInternetTracks([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingInternet(true);
      setInternetError(null);
      
      const backupEndpoints = [
        'https://discoveryprovider.audius.co',
        'https://audius-metadata-common.figment.io',
        'https://discovery-us-east.audius.open-infra.cloud',
        'https://discovery-node-2.audius.co',
        'https://audius-dp.singapore.fastly.net'
      ];

      let host = 'https://api.audius.co';
      try {
        const hostRes = await fetch('https://api.audius.co', { method: 'GET' });
        if (hostRes.ok) {
          const hostData = await hostRes.json();
          if (hostData.data && hostData.data.length > 0) {
            host = hostData.data[Math.floor(Math.random() * Math.min(hostData.data.length, 3))];
          }
        }
      } catch (e) {
        console.warn('Could not fetch healthy Audius nodes, using stable backup endpoints', e);
        host = backupEndpoints[Math.floor(Math.random() * backupEndpoints.length)];
      }

      host = host.replace(/\/$/, "");

      try {
        const response = await fetch(
          `${host}/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=aura_music`
        );
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          const parsed: Track[] = data.data
            .filter((item: any) => item.is_streamable !== false)
            .map((item: any) => {
              const artist = item.user?.name || item.user?.handle || 'Unknown Artist';
              const coverUrl = item.artwork?.['480x480'] || item.artwork?.['1000x1000'] || item.artwork?.['150x150'] || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17';
              const duration = item.duration ? Math.ceil(item.duration) : 180;
              
              return {
                id: `audius-${item.id}`,
                title: item.title || 'Untitled',
                artist: artist,
                album: item.title || 'Single',
                duration: duration,
                coverUrl: coverUrl,
                audioUrl: `${host}/v1/tracks/${item.id}/stream?app_name=aura_music`,
                genre: item.genre || 'Electronic',
                lyrics: [
                  `[00:00] (Playing full length track from Audius Network)`,
                  `[00:05] Track: ${item.title}`,
                  `[00:10] Artist: ${artist}`,
                  `[00:15] Genre: ${item.genre || 'Various'}`,
                  `[00:20] Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`,
                  `[00:30] Enjoy this high-quality music stream!`
                ],
                likes: Math.floor(Math.random() * 12000) + 300,
                plays: item.play_count || Math.floor(Math.random() * 85000) + 1200
              };
            });

          setInternetTracks(parsed);
          
          if (parsed.length > 0) {
            registerCustomTracks(parsed);
          }
        }
      } catch (err) {
        console.error('Error fetching from Audius API:', err);
        setInternetError("Could not reach Audius Global Music Catalog. Check your internet connection.");
      } finally {
        setIsSearchingInternet(false);
      }
    }, 550); // 550ms debounce response

    return () => clearTimeout(delayDebounceFn);
  }, [query, isInternetSearch]);

  const triggerVoiceSearch = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        recognitionRef.current.stop();
        setIsVoiceListening(false);
      }
    } else {
      setIsVoiceListening(true);
      setVoiceTranscript('Listening simulated...');
      setTimeout(() => {
        const testKeywords = ['Midnight Oasis', 'Jazz', 'Lofi', 'Synthwave'];
        const randomTerm = testKeywords[Math.floor(Math.random() * testKeywords.length)];
        setVoiceTranscript(`Heard: "${randomTerm}"`);
        setQuery(randomTerm);
        setTimeout(() => setIsVoiceListening(false), 1000);
      }, 1800);
    }
  };

  const handleApplyToPlaylist = (playlistId: string, track: Track) => {
    addTrackToPlaylist(playlistId, track.id);
    setShowPlaylistMenu(false);
    setSelectedTrackForPlaylist(null);
    setAddedSuccessMsg(`Successfully added "${track.title}" to your playlist!`);
    setTimeout(() => setAddedSuccessMsg(null), 3000);
  };

  // Local Search Flow
  const localSearchResults = TRACKS_DATABASE.filter((track) => {
    const term = query.toLowerCase().trim();
    if (!term) return false;
    return (
      track.title.toLowerCase().includes(term) ||
      track.artist.toLowerCase().includes(term) ||
      track.album.toLowerCase().includes(term) ||
      track.genre.toLowerCase().includes(term)
    );
  });

  const activeTracksStream = isInternetSearch ? internetTracks : localSearchResults;

  const getFilteredResults = () => {
    if (activeFilter === 'songs') return activeTracksStream;
    if (activeFilter === 'artists') {
      const savedArtists = new Set<string>();
      return activeTracksStream.filter(t => {
        if (savedArtists.has(t.artist)) return false;
        savedArtists.add(t.artist);
        return true;
      });
    }
    if (activeFilter === 'genres') {
      const savedGenres = new Set<string>();
      return activeTracksStream.filter(t => {
        if (savedGenres.has(t.genre)) return false;
        savedGenres.add(t.genre);
        return true;
      });
    }
    return activeTracksStream;
  };

  const displayedResults = getFilteredResults();

  return (
    <div className="flex flex-col pb-36 text-slate-800 dark:text-white px-4 md:px-6 pt-6 overflow-y-auto w-full max-w-5xl">
      
      {/* Search title header section */}
      <header className="flex items-center justify-between pb-3.5 mb-6 border-b border-slate-200 dark:border-white/5">
        <div className="text-left">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-9">Search</h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 font-semibold">
            Discover and play full streaming audio
          </p>
        </div>
        <div className="h-9 w-9 rounded-full bg-[#FF375F]/10 flex items-center justify-center text-[#FF375F]">
          <Search className="h-5 w-5 stroke-[2.2px]" />
        </div>
      </header>
      
      <div className="relative flex items-center mb-4 gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={isInternetSearch ? "Search artists, tracks, lofi remixes..." : "Search local tracks, artists, genres..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 pl-11 pr-10 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#FF375F]/15 focus:border-[#FF375F]/50 transition-all text-slate-800 dark:text-white font-sans text-left"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-800 dark:hover:text-white"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
        
        {/* Dynamic Voice mic */}
        <button
          onClick={triggerVoiceSearch}
          className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all cursor-pointer shadow-xs ${
            isVoiceListening
              ? 'bg-[#FF375F] text-white animate-pulse'
              : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[#FF375F] hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
          title="Voice Search"
        >
          <Mic className="h-5.5 w-5.5" />
        </button>
      </div>

      {/* Dynamic Source Selector */}
      <div className="flex items-center justify-between mb-5 bg-slate-100/60 dark:bg-white/5 p-3 rounded-2xl border border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-2">
          <Globe className={`h-4.5 w-4.5 ${isInternetSearch ? 'text-[#FF375F] animate-pulse' : 'text-slate-400'}`} />
          <div className="text-left">
            <span className="text-[11px] font-extrabold text-[#FF375F] block uppercase tracking-wider">
              {isInternetSearch ? 'Full-Length Tracks' : 'Internal Catalog'}
            </span>
            <small className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium">
              {isInternetSearch ? 'Streaming via global Audius nodes' : 'Play standard built-in tracks'}
            </small>
          </div>
        </div>
        <button
          onClick={() => {
            setIsInternetSearch(!isInternetSearch);
            setQuery('');
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isInternetSearch ? 'bg-[#FF375F]' : 'bg-slate-200 dark:bg-white/10'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isInternetSearch ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {addedSuccessMsg && (
        <div className="mb-4 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold py-3.5 px-4 rounded-xl flex items-center gap-2">
          <Check className="h-4.5 w-4.5 shrink-0 stroke-[3px]" /> {addedSuccessMsg}
        </div>
      )}

      {/* Filter tags */}
      {query && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {(['all', 'songs', 'artists', 'genres'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-4.5 py-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                activeFilter === filter
                  ? 'bg-[#FF375F] text-white shadow shadow-rose-500/20'
                  : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {/* Results block */}
      {query ? (
        <div className="space-y-3.5 text-left">
          {isSearchingInternet && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-500">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF375F]" />
              <span className="text-xs font-bold font-sans">Connecting global audio streams...</span>
            </div>
          )}

          {!isSearchingInternet && displayedResults.map((track) => (
            <motion.div
              layout
              whileHover={{ x: 3 }}
              key={track.id}
              className="group rounded-2xl bg-slate-100/60 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-3.5 flex items-center justify-between cursor-pointer"
              onClick={() => playTrack(track, displayedResults)}
            >
              <div className="flex items-center gap-3.5 overflow-hidden">
                <img src={track.coverUrl} className="h-12 w-12 rounded-[10px] object-cover shadow-sm" />
                <div className="overflow-hidden leading-tight">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate group-hover:text-[#FF375F] transition-colors">
                    {track.title}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 truncate mt-1">{track.artist}</p>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-neutral-500 truncate mt-1 uppercase tracking-widest">{track.genre}</p>
                </div>
              </div>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => playTrack(track, [track])}
                  className="p-2.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-[#FF375F]"
                >
                  <Play className="h-4.5 w-4.5 fill-current" />
                </button>
                <button
                  onClick={() => {
                    setSelectedTrackForPlaylist(track);
                    setShowPlaylistMenu(true);
                  }}
                  className="p-2.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-neutral-400 hover:text-[#FF375F]"
                >
                  <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
                </button>
              </div>
            </motion.div>
          ))}

          {!isSearchingInternet && displayedResults.length === 0 && (
            <div className="text-center py-20 bg-slate-100/60 dark:bg-white/5 border border-slate-205 dark:border-white/5 rounded-3xl">
              <p className="text-sm text-slate-500 dark:text-neutral-400 font-bold">
                No matching tracks found for "{query}"
              </p>
              <small className="text-xs text-neutral-500 mt-1 block">Try adjusting your spelling or filters</small>
            </div>
          )}
        </div>
      ) : (
        /* Categories list */
        <div className="text-left">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight mb-4 flex items-center gap-1.5">
            <Compass className="h-5 w-5 text-[#FF375F]" /> Browse All Categories
          </h2>
          <div className="grid grid-cols-2 gap-3.5">
            {GENRES_LIST.map((genre) => (
              <motion.div
                whileHover={{ scale: 1.025 }}
                whileTap={{ scale: 0.975 }}
                key={genre.name}
                onClick={() => onSelectGenre(genre.name)}
                className={`relative h-28 overflow-hidden rounded-[18px] bg-gradient-to-tr ${genre.color} p-4 text-white shadow-md cursor-pointer group`}
              >
                <span className="font-black text-base tracking-tight leading-snug drop-shadow-sm max-w-[100px] block">
                  {genre.name}
                </span>
                <div className="absolute -bottom-2 -right-2 h-16 w-16 rotate-12 transition-transform duration-350 group-hover:scale-110 group-hover:rotate-6">
                  <img src={genre.image} className="h-full w-full rounded-lg object-cover shadow-2xl opacity-60 dark:opacity-80" referrerPolicy="no-referrer" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Voice listening pulse panel */}
      <AnimatePresence>
        {isVoiceListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-55 flex flex-col items-center justify-center bg-black/85 backdrop-blur-lg text-white"
          >
            <div className="h-32 w-32 rounded-full bg-rose-500/20 flex items-center justify-center animate-ping absolute" />
            <div className="h-24 w-24 rounded-full bg-rose-500/30 flex items-center justify-center animate-pulse relative z-10 shadow-3xl shadow-rose-500/50">
              <Mic className="h-10 w-10 text-white animate-bounce" />
            </div>
            <h2 className="mt-8 text-xl font-extrabold tracking-tight">{voiceTranscript}</h2>
            <p className="mt-2 text-xs text-white/50 tracking-widest uppercase font-black">Aura Voice Controller Active</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist Custom Pop-up Picker */}
      {showPlaylistMenu && selectedTrackForPlaylist && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-md px-2 pb-safe">
          <div className="w-full max-w-md rounded-t-3xl bg-neutral-950 px-6 py-6 border-t border-white/10 text-white flex flex-col max-h-[75vh]">
            <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3 text-left">
              <div>
                <h3 className="text-base font-extrabold">Add to Playlist</h3>
                <small className="text-xs text-neutral-400 font-medium">Choose target list for "{selectedTrackForPlaylist.title}"</small>
              </div>
              <button
                onClick={() => setShowPlaylistMenu(false)}
                className="p-1.5 rounded-full hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1 text-left" style={{ scrollbarWidth: 'none' }}>
              {playlists.map((pl) => {
                const alreadyHas = pl.trackIds.includes(selectedTrackForPlaylist.id);
                return (
                  <button
                    key={pl.id}
                    disabled={alreadyHas}
                    onClick={() => handleApplyToPlaylist(pl.id, selectedTrackForPlaylist)}
                    className="w-full text-left rounded-2xl bg-white/5 hover:bg-white/10 p-4 flex items-center justify-between border border-white/5 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed group transition-all"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`h-10 w-10 rounded-lg bg-gradient-to-tr ${pl.coverColor || 'from-rose-500 to-indigo-500'} flex items-center justify-center text-white text-xs border border-white/10`}>
                        <Music className="h-5 w-5" />
                      </div>
                      <div className="overflow-hidden leading-tight">
                        <p className="font-extrabold text-sm tracking-tight truncate text-white group-hover:text-[#FF375F]">{pl.name}</p>
                        <span className="text-[10px] text-neutral-450 uppercase font-semibold">{pl.trackIds.length} Songs</span>
                      </div>
                    </div>
                    {alreadyHas ? (
                      <span className="text-xs text-[#FF375F] font-semibold flex items-center gap-1.5"><Check className="h-4 w-4 stroke-[3px]" /> Added</span>
                    ) : (
                      <span className="text-xs font-bold text-[#FF375F] group-hover:translate-x-1 duration-200 transition-transform">Add &rarr;</span>
                    )}
                  </button>
                );
              })}

              {playlists.length === 0 && (
                <div className="text-center py-10 text-xs text-neutral-450 italic font-medium">
                  No playlists have been created yet. Launch Library, set up a playlist card, and enjoy adding tracks!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
