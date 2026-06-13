/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Track, Playlist } from '../types';
import { TRACKS_DATABASE } from '../data/tracks';
import { useAuth } from './AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

interface MusicContextType {
  isPlaying: boolean;
  currentTrack: Track | null;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: 'none' | 'one' | 'all';
  queue: Track[];
  history: Track[];
  playlists: Playlist[];
  likedTrackIds: string[];
  offlineDownloadedIds: string[];
  isAiGenerating: boolean;
  allTracks: Track[];
  registerCustomTracks: (tracks: Track[]) => void;
  
  // Playback Operations
  playTrack: (track: Track, contextTracks?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (level: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  
  // Queue Operations
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  playNext: (track: Track) => void;
  
  // Like/Offline state
  toggleLikeTrack: (trackId: string) => void;
  toggleDownloadTrack: (trackId: string) => void;
  
  // Playlist Operations
  createPlaylist: (name: string, description: string, coverColor?: string) => Playlist;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  updatePlaylistDetails: (playlistId: string, name: string, description: string) => void;
  
  // AI Operations
  generateAiPlaylist: (prompt: string) => Promise<Playlist | null>;

  // Audio Context / Analyser Node
  analyserNode: AnalyserNode | null;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

const LOCAL_DOWNLOADS_KEY_PREFIX = 'aura_downloads_';

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, addListeningMinutes, saveUserToDB } = useAuth();
  
  // Audio Controller Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const secondsPlayed = useRef<number>(0);

  // Web Audio API State and Refs
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<'none' | 'one' | 'all'>('none');
  
  // Playlists and lists state
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [queue, setQueue] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>([]);
  const [offlineDownloadedIds, setOfflineDownloadedIds] = useState<string[]>([]);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  const [customTracks, setCustomTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('aura_custom_tracks_cache');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allTracks = [...TRACKS_DATABASE, ...customTracks];

  const registerCustomTracks = (tracks: Track[]) => {
    setCustomTracks((prev) => {
      const existingIds = new Set(prev.map(t => t.id));
      const newTracks = tracks.filter(t => !existingIds.has(t.id));
      if (newTracks.length === 0) return prev;
      const updated = [...prev, ...newTracks];
      localStorage.setItem('aura_custom_tracks_cache', JSON.stringify(updated));
      return updated;
    });
  };

  // Keep live references of dynamic callbacks to completely avoid audio teardowns on user/history updates
  const callbacksRef = useRef({
    addListeningMinutes,
    handleSongEnded: () => {},
  });

  useEffect(() => {
    callbacksRef.current = {
      addListeningMinutes,
      handleSongEnded,
    };
  }, [addListeningMinutes, isRepeat, queue, history, isShuffle, currentTrack]);

  // Initialize unified audio player
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
    audioRef.current.crossOrigin = 'anonymous';

    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      secondsPlayed.current += 0.25; 
      if (secondsPlayed.current >= 60) {
        callbacksRef.current.addListeningMinutes(1);
        secondsPlayed.current = 0;
      }
    };

    const handleDurationChange = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      callbacksRef.current.handleSongEnded();
    };

    const handleCanPlay = () => {};

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
    };
  }, []);

  const initAudioAnalysis = () => {
    if (audioContextRef.current || !audioRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      setAnalyserNode(analyser);
    } catch (err) {
      console.warn('Failed to initialize Web Audio API analyser:', err);
    }
  };

  const resumeAudioContext = () => {
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch((e) => console.warn('Context resume failed:', e));
      }
    } else {
      initAudioAnalysis();
    }
  };

  // Handle Loading of User Specific Data in Real Time
  useEffect(() => {
    if (!user) {
      setPlaylists([]);
      setLikedTrackIds([]);
      setOfflineDownloadedIds([]);
      setHistory([]);
      setCurrentTrack(null);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.src = '';
      }
      return;
    }

    const userId = user.uid;
    
    // Sync Liked Tracks directly from User DB Document State
    setLikedTrackIds(user.likedTracks || []);

    // Load Offline Downloads from localStorage (safely local-only browser caching mapping)
    const localDownloads = localStorage.getItem(`${LOCAL_DOWNLOADS_KEY_PREFIX}${userId}`);
    if (localDownloads) {
      setOfflineDownloadedIds(JSON.parse(localDownloads));
    }

    // Sync Listening History tracks from User DB recentlyPlayed array
    if (user.recentlyPlayed && user.recentlyPlayed.length > 0) {
      const historyTracks = user.recentlyPlayed
        .map(id => allTracks.find(t => t.id === id))
        .filter(Boolean) as Track[];
      setHistory(historyTracks);
    } else {
      setHistory([]);
    }

    // Handled locally if guest user
    if (user.isGuest) {
      const localPlaylists = localStorage.getItem(`aura_guest_playlists_${userId}`);
      if (localPlaylists) {
        try {
          setPlaylists(JSON.parse(localPlaylists));
        } catch (e) {
          console.warn('Error reading stored guest playlists:', e);
        }
      } else {
        setPlaylists([]);
      }
      return () => {};
    }

    // 1. Subscribe to playlists created by this user
    const playlistsQuery = query(
      collection(db, 'playlists'),
      where('creatorId', '==', userId)
    );

    const unsubscribePlaylists = onSnapshot(playlistsQuery, (snapshot) => {
      const fetchedPlaylists: Playlist[] = [];
      snapshot.forEach((docSnap) => {
        fetchedPlaylists.push(docSnap.data() as Playlist);
      });
      // Sort newest created playlists to the top
      fetchedPlaylists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPlaylists(fetchedPlaylists);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'playlists');
    });

    return () => {
      unsubscribePlaylists();
    };
  }, [user]);

  // Direct Audio Playback Mechanics
  const playTrack = (track: Track, contextTracks?: Track[]) => {
    if (!audioRef.current || !user) return;
    
    resumeAudioContext();
    
    const wasPlayingSame = currentTrack?.id === track.id;
    
    if (wasPlayingSame) {
      togglePlay();
      return;
    }

    setCurrentTrack(track);
    setDuration(track.duration || 0);
    audioRef.current.src = track.audioUrl;
    audioRef.current.volume = isMuted ? 0 : volume;
    secondsPlayed.current = 0;

    // Build context queue if provided
    if (contextTracks && contextTracks.length > 0) {
      const songIndex = contextTracks.findIndex(t => t.id === track.id);
      if (songIndex !== -1) {
        const upcomingQueue = contextTracks.slice(songIndex + 1);
        setQueue(upcomingQueue);
      }
    } else {
      const currentIndex = allTracks.findIndex(t => t.id === track.id);
      if (currentIndex !== -1) {
        setQueue(allTracks.slice(currentIndex + 1));
      }
    }

    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('interrupted'))) {
          console.log('Audio playback request interrupted by consecutive load/pause (benign).');
        } else {
          console.error('Audio playback failed: ', err);
        }
      });

    addToHistory(track);
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    
    resumeAudioContext();
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('interrupted'))) {
            console.log('Playback play request interrupted (benign).');
          } else {
            console.error('Playback fail: ', err);
          }
        });
    }
  };

  const handleSongEnded = () => {
    if (isRepeat === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => {
          if (e instanceof Error && (e.name === 'AbortError' || e.message?.includes('interrupted'))) {
            console.log('Repeat loop play request interrupted (benign).');
          } else {
            console.error('Loop playback fail: ', e);
          }
        });
      }
    } else {
      nextTrack();
    }
  };

  const nextTrack = () => {
    if (!audioRef.current) return;
    
    if (queue.length === 0) {
      if (isRepeat === 'all' && history.length > 0) {
        const fullRotation = [...history].reverse();
        const next = fullRotation[0];
        setQueue(fullRotation.slice(1));
        if (next) playTrack(next);
      } else {
        const next = allTracks[0];
        if (next) playTrack(next);
      }
      return;
    }

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      const selectedTrack = queue[randomIndex];
      const remainingQueue = queue.filter((_, idx) => idx !== randomIndex);
      setQueue(remainingQueue);
      playTrack(selectedTrack);
    } else {
      const next = queue[0];
      const remainingQueue = queue.slice(1);
      setQueue(remainingQueue);
      playTrack(next);
    }
  };

  const prevTrack = () => {
    if (!audioRef.current) return;

    if (audioRef.current.currentTime > 4) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    } else if (history.length > 0) {
      const previous = history[0]; 
      const updatedHistory = history.slice(1);
      setHistory(updatedHistory);
      
      if (currentTrack) {
        setQueue([currentTrack, ...queue]);
      }
      playTrack(previous);
    } else {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const seekTo = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const setVolume = (level: number) => {
    if (!audioRef.current) return;
    const bounded = Math.max(0, Math.min(1, level));
    audioRef.current.volume = isMuted ? 0 : bounded;
    setVolumeState(bounded);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    audioRef.current.volume = nextMuted ? 0 : volume;
    setIsMuted(nextMuted);
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const toggleRepeat = () => {
    setIsRepeat((prev) => {
      if (prev === 'none') return 'one';
      if (prev === 'one') return 'all';
      return 'none';
    });
  };

  // Queue Operations
  const addToQueue = (track: Track) => {
    if (queue.some(q => q.id === track.id)) return;
    setQueue([...queue, track]);
  };

  const playNext = (track: Track) => {
    const cleanQueue = queue.filter(q => q.id !== track.id);
    setQueue([track, ...cleanQueue]);
  };

  const removeFromQueue = (trackId: string) => {
    setQueue(queue.filter(q => q.id !== trackId));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  // History mechanics
  const addToHistory = async (track: Track) => {
    if (!user) return;
    const historyIds = history.map(t => t.id);
    const filteredHistory = historyIds.filter(id => id !== track.id);
    const updatedHistoryIds = [track.id, ...filteredHistory].slice(0, 50);

    const updatedUser = {
      ...user,
      recentlyPlayed: updatedHistoryIds
    };

    await saveUserToDB(updatedUser);
  };

  // Likes and downloads
  const toggleLikeTrack = async (trackId: string) => {
    if (!user) return;
    const updatedLikes = likedTrackIds.includes(trackId)
      ? likedTrackIds.filter(id => id !== trackId)
      : [...likedTrackIds, trackId];

    setLikedTrackIds(updatedLikes);
    const updatedUser = {
      ...user,
      likedTracks: updatedLikes
    };

    await saveUserToDB(updatedUser);
  };

  const toggleDownloadTrack = (trackId: string) => {
    if (!user) return;
    const userId = user.uid;
    const updatedDownloads = offlineDownloadedIds.includes(trackId)
      ? offlineDownloadedIds.filter(id => id !== trackId)
      : [...offlineDownloadedIds, trackId];

    setOfflineDownloadedIds(updatedDownloads);
    localStorage.setItem(`${LOCAL_DOWNLOADS_KEY_PREFIX}${userId}`, JSON.stringify(updatedDownloads));
  };

  // Playlist configurations - SAVED to Firestore
  const createPlaylist = (name: string, description: string, coverColor?: string) => {
    if (!user) throw new Error('Unauthenticated user!');
    const userId = user.uid;
    const playlistId = `pl-${Math.random().toString(36).substr(2, 9)}`;
    
    const newPlaylist: Playlist = {
      id: playlistId,
      name,
      description,
      trackIds: [],
      isPublic: false,
      createdAt: new Date().toISOString(),
      creatorId: userId,
      creatorName: user.displayName,
      coverColor: coverColor || 'from-indigo-600 to-rose-500'
    };

    if (user.isGuest) {
      const updatedPlaylists = [newPlaylist, ...playlists];
      setPlaylists(updatedPlaylists);
      localStorage.setItem(`aura_guest_playlists_${userId}`, JSON.stringify(updatedPlaylists));
      
      const updatedUser = {
        ...user,
        playlistCount: (user.playlistCount || 0) + 1
      };
      saveUserToDB(updatedUser);
      return newPlaylist;
    }

    // Save to Firestore!
    const docRef = doc(db, 'playlists', playlistId);
    setDoc(docRef, newPlaylist)
      .catch(err => handleFirestoreError(err, OperationType.CREATE, `playlists/${playlistId}`));

    // Increment user profile playlistCount
    const updatedUser = {
      ...user,
      playlistCount: (user.playlistCount || 0) + 1
    };
    saveUserToDB(updatedUser);

    return newPlaylist;
  };

  const deletePlaylist = async (id: string) => {
    if (!user) return;
    
    if (user.isGuest) {
      const updatedPlaylists = playlists.filter(p => p.id !== id);
      setPlaylists(updatedPlaylists);
      localStorage.setItem(`aura_guest_playlists_${user.uid}`, JSON.stringify(updatedPlaylists));
      
      const updatedUser = {
        ...user,
        playlistCount: Math.max(0, (user.playlistCount || 0) - 1)
      };
      await saveUserToDB(updatedUser);
      return;
    }

    const docRef = doc(db, 'playlists', id);
    try {
      await deleteDoc(docRef);
      
      const updatedUser = {
        ...user,
        playlistCount: Math.max(0, (user.playlistCount || 0) - 1)
      };
      await saveUserToDB(updatedUser);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `playlists/${id}`);
    }
  };

  const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
    if (!user) return;
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return;
    if (pl.trackIds.includes(trackId)) return;
    
    const updatedTrackIds = [...pl.trackIds, trackId];

    if (user.isGuest) {
      const updatedPlaylists = playlists.map(p => 
        p.id === playlistId ? { ...p, trackIds: updatedTrackIds } : p
      );
      setPlaylists(updatedPlaylists);
      localStorage.setItem(`aura_guest_playlists_${user.uid}`, JSON.stringify(updatedPlaylists));
      return;
    }

    const docRef = doc(db, 'playlists', playlistId);
    try {
      await updateDoc(docRef, { trackIds: updatedTrackIds });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `playlists/${playlistId}`);
    }
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    if (!user) return;
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return;
    
    const updatedTrackIds = pl.trackIds.filter(id => id !== trackId);

    if (user.isGuest) {
      const updatedPlaylists = playlists.map(p => 
        p.id === playlistId ? { ...p, trackIds: updatedTrackIds } : p
      );
      setPlaylists(updatedPlaylists);
      localStorage.setItem(`aura_guest_playlists_${user.uid}`, JSON.stringify(updatedPlaylists));
      return;
    }

    const docRef = doc(db, 'playlists', playlistId);
    try {
      await updateDoc(docRef, { trackIds: updatedTrackIds });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `playlists/${playlistId}`);
    }
  };

  const updatePlaylistDetails = async (playlistId: string, name: string, description: string) => {
    if (!user) return;

    if (user.isGuest) {
      const updatedPlaylists = playlists.map(p => 
        p.id === playlistId ? { ...p, name, description } : p
      );
      setPlaylists(updatedPlaylists);
      localStorage.setItem(`aura_guest_playlists_${user.uid}`, JSON.stringify(updatedPlaylists));
      return;
    }

    const docRef = doc(db, 'playlists', playlistId);
    try {
      await updateDoc(docRef, { name, description });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `playlists/${playlistId}`);
    }
  };

  // AI intelligence features
  const generateAiPlaylist = async (prompt: string): Promise<Playlist | null> => {
    if (!user) return null;
    setIsAiGenerating(true);
    
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          availableTracks: TRACKS_DATABASE.map(t => ({
            id: t.id,
            title: t.title,
            artist: t.artist,
            genre: t.genre
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Recommendations payload error');
      }

      const recommendation = await response.json();
      
      const matchedTrackIds = (recommendation.recommendedTrackIds || [])
        .filter((id: string) => TRACKS_DATABASE.some(t => t.id === id)) as string[];

      const finalTrackIds = matchedTrackIds.length > 0
        ? matchedTrackIds
        : [TRACKS_DATABASE[0].id, TRACKS_DATABASE[1].id];

      const playlistId = `pl-ai-${Math.random().toString(36).substr(2, 9)}`;
      const aiPlaylist: Playlist = {
        id: playlistId,
        name: recommendation.playlistTitle || `AI Mix: ${prompt.slice(0, 20)}...`,
        description: recommendation.description || `AI curated mix optimized for: ${prompt}.`,
        trackIds: finalTrackIds,
        isPublic: false,
        createdAt: new Date().toISOString(),
        creatorId: user.uid,
        creatorName: 'Aura AI Curator',
        coverColor: 'from-violet-600 via-fuchsia-500 to-pink-500' 
      };

      // Auto-save the AI playlist
      if (user.isGuest) {
        const updatedPlaylists = [aiPlaylist, ...playlists];
        setPlaylists(updatedPlaylists);
        localStorage.setItem(`aura_guest_playlists_${user.uid}`, JSON.stringify(updatedPlaylists));
        
        const updatedUser = {
          ...user,
          playlistCount: (user.playlistCount || 0) + 1
        };
        await saveUserToDB(updatedUser);
      } else {
        const docRef = doc(db, 'playlists', playlistId);
        await setDoc(docRef, aiPlaylist);

        const updatedUser = {
          ...user,
          playlistCount: (user.playlistCount || 0) + 1
        };
        await saveUserToDB(updatedUser);
      }

      return aiPlaylist;
    } catch (err) {
      console.warn('AI playlist generation caught error, executing client-side local matching:', err);
      // Client-side visual keyword matching fallback
      const cleanPrompt = prompt.toLowerCase();
      let matchedTrackIds: string[] = [];

      if (cleanPrompt.includes('code') || cleanPrompt.includes('work') || cleanPrompt.includes('stud')) {
        matchedTrackIds = [TRACKS_DATABASE[2].id, TRACKS_DATABASE[0].id, TRACKS_DATABASE[5].id];
      } else if (cleanPrompt.includes('chill') || cleanPrompt.includes('relax') || cleanPrompt.includes('night')) {
        matchedTrackIds = [TRACKS_DATABASE[0].id, TRACKS_DATABASE[4].id, TRACKS_DATABASE[1].id];
      } else if (cleanPrompt.includes('pop') || cleanPrompt.includes('groov') || cleanPrompt.includes('happy')) {
        matchedTrackIds = [TRACKS_DATABASE[1].id, TRACKS_DATABASE[3].id, TRACKS_DATABASE[5].id];
      } else {
        // Fallback random tracks
        matchedTrackIds = [TRACKS_DATABASE[0].id, TRACKS_DATABASE[2].id, TRACKS_DATABASE[3].id];
      }

      const playlistId = `pl-ai-${Math.random().toString(36).substr(2, 9)}`;
      const fallbackPlaylist: Playlist = {
        id: playlistId,
        name: `AI: ${prompt.charAt(0).toUpperCase() + prompt.slice(1, 22)}`,
        description: `Custom computed AI mix crafted for: "${prompt}". Ready to groove!`,
        trackIds: matchedTrackIds,
        isPublic: false,
        createdAt: new Date().toISOString(),
        creatorId: user.uid,
        creatorName: 'Aura AI Generator',
        coverColor: 'from-fuchsia-600 to-rose-500'
      };

      if (user.isGuest) {
        const updatedPlaylists = [fallbackPlaylist, ...playlists];
        setPlaylists(updatedPlaylists);
        localStorage.setItem(`aura_guest_playlists_${user.uid}`, JSON.stringify(updatedPlaylists));
        
        const updatedUser = {
          ...user,
          playlistCount: (user.playlistCount || 0) + 1
        };
        await saveUserToDB(updatedUser);
      } else {
        try {
          const docRef = doc(db, 'playlists', playlistId);
          await setDoc(docRef, fallbackPlaylist);

          const updatedUser = {
            ...user,
            playlistCount: (user.playlistCount || 0) + 1
          };
          await saveUserToDB(updatedUser);
        } catch (writeErr) {
          handleFirestoreError(writeErr, OperationType.WRITE, `playlists/${playlistId}`);
        }
      }

      return fallbackPlaylist;
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <MusicContext.Provider
      value={{
        isPlaying,
        currentTrack,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        isRepeat,
        queue,
        history,
        playlists,
        likedTrackIds,
        offlineDownloadedIds,
        isAiGenerating,
        allTracks,
        registerCustomTracks,
        analyserNode,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
        removeFromQueue,
        clearQueue,
        playNext,
        toggleLikeTrack,
        toggleDownloadTrack,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        updatePlaylistDetails,
        generateAiPlaylist
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
