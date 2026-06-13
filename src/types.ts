/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl: string;
  genre: string;
  lyrics: string[];
  likes: number;
  plays: number;
  featured?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl?: string;
  coverColor?: string; // fallback color block
  trackIds: string[];
  isPublic: boolean;
  createdAt: string;
  creatorId: string;
  creatorName: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  playlistCount: number;
  likedTracks: string[];
  recentlyPlayed: string[];
  followedArtists: string[];
  listeningMinutes: number;
  themeMode: 'light' | 'dark';
  isGuest?: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTrack: Track | null;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: 'none' | 'one' | 'all';
  queue: string[]; // Active list of track IDs up next
  history: string[]; // Recent track IDs played
}
