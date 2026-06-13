/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Mic, 
  Square, 
  Volume2, 
  Music, 
  Sparkle, 
  Copy, 
  ArrowRight, 
  Loader2, 
  FileAudio, 
  Play, 
  PlusCircle, 
  Compass, 
  Flame, 
  CheckCircle2, 
  X, 
  ChevronRight,
  Disc,
  Info
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { Track } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AiStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiStudio: React.FC<AiStudioProps> = ({ isOpen, onClose }) => {
  const { registerCustomTracks, playTrack } = useMusic();

  // Active section inside AI Studio: 'transcribe' | 'generate'
  const [activeSegment, setActiveSegment] = useState<'transcribe' | 'generate'>('transcribe');

  // --- TRANSCRIPTION STATE ---
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- MUSIC GENERATION STATE ---
  const [musicPrompt, setMusicPrompt] = useState<string>('');
  const [generationType, setGenerationType] = useState<'clip' | 'pro'>('clip');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedTrack, setGeneratedTrack] = useState<Track | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<string>('');

  // Audio preview for the created track
  const [previewPlaying, setPreviewPlaying] = useState<boolean>(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Suggested prompts
  const suggestions = [
    "Ambient forest breeze with gentle synthesizer bells and sub-bass",
    "Energetic cyber synthwave theme for a high-intensity ride",
    "Relaxing jazzy piano chords over crackling vinyl lofi beats",
    "Epic cinematic orchestral melody featuring deep brass strings"
  ];

  // Duration Timer for recording
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setRecordingSeconds(0);
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRecording]);

  // Audio preview release cleanup
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  // --- RECORDER ACTIONS ---
  const startRecording = async () => {
    setTranscribeError(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Choose supported MIME type
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options = { mimeType: 'audio/ogg' };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        await uploadAndTranscribe(audioBlob, mediaRecorder.mimeType);
        
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250); // Fetch chunk every 250ms
      setIsRecording(true);
    } catch (err: any) {
      console.error('Microphone permission check failed:', err);
      setTranscribeError('Could not open your microphone. Please check system permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAndTranscribe = async (audioBlob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setTranscribeError(null);

    // Convert Blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64data = reader.result as string;

      try {
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioData: base64data,
            mimeType: mimeType || 'audio/webm'
          })
        });

        if (!response.ok) {
          throw new Error('Transcription API status error');
        }

        const data = await response.json();
        setTranscribedText(data.text || 'Silence detected.');
      } catch (err: any) {
        console.error('Transcription process failed:', err);
        setTranscribeError('Failed to fetch transcription. Ensure your backend and API key are active.');
      } finally {
        setIsTranscribing(false);
      }
    };
  };

  // --- MUSIC GENERATION ACTIONS ---
  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedTrack(null);
    setPreviewPlaying(false);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    const steps = [
      'Authenticating Lyria session clusters...',
      'Synthesizing instrumentation algorithms...',
      'Deconstructing harmonies and voice layers...',
      'Assembling stereo wave sequences...',
      'Compiling lyrical metadata and master stems...'
    ];

    let stepIndex = 0;
    setGenerationStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setGenerationStep(steps[stepIndex]);
      }
    }, 4500);

    try {
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: musicPrompt,
          version: generationType
        })
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Server rejected track rendering');
      }

      const data = await response.json();

      // Decode base64 to Blob URL for local stream playback
      const binaryString = atob(data.audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
      const objectUrl = URL.createObjectURL(audioBlob);

      // Creative lyrics splitter for visual tracking
      const rawLyrics = data.lyrics || `[00:00] Aura Lyria AI Synth active\n[00:04] Inspired by "${musicPrompt}"\n[00:10] Floating through the ambient clouds\n[00:20] Aura streams endless frequencies`;
      const lyricsArray = rawLyrics.split('\n').filter((l: string) => l.trim().length > 0);

      // Create new track entity
      const trackId = `ai-gen-${Math.random().toString(36).substr(2, 9)}`;
      const newTrack: Track = {
        id: trackId,
        title: data.title || `AI: ${musicPrompt.slice(0, 16)}`,
        artist: data.artist || 'Aura Lyria AI Creator',
        album: generationType === 'clip' ? 'Aura Lyria Clip' : 'Aura Lyria LP',
        duration: generationType === 'clip' ? 30 : 120, // default approximation
        audioUrl: objectUrl,
        coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=250&auto=format&fit=crop',
        genre: 'AI Synthesized',
        lyrics: lyricsArray,
        likes: 0,
        plays: 0
      };

      setGeneratedTrack(newTrack);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error('Music rendering error:', err);
      setGenerationError(err.message || 'Lyria model experienced rendering boundaries. Please try another prompt.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegisterTrack = () => {
    if (!generatedTrack) return;
    registerCustomTracks([generatedTrack]);
    playTrack(generatedTrack);
    onClose();
  };

  const togglePreview = () => {
    if (!generatedTrack) return;

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(generatedTrack.audioUrl);
      previewAudioRef.current.onended = () => setPreviewPlaying(false);
    }

    if (previewPlaying) {
      previewAudioRef.current.pause();
      setPreviewPlaying(false);
    } else {
      previewAudioRef.current.play()
        .then(() => setPreviewPlaying(true))
        .catch((e) => console.error('Preview stream loaded failed:', e));
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#070708] text-white overflow-hidden">
      {/* Premium Studio Header */}
      <div className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-gradient-to-tr from-[#FF375F] to-[#7C3AED] rounded-xl flex items-center justify-center relative shadow-md">
            <Sparkle className="h-5 w-5 text-white animate-spin-slow fill-white/10" />
            <div className="absolute inset-0 bg-white/10 rounded-xl" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-black tracking-tight uppercase">Aura AI Creator Lab</h2>
            <p className="text-[10px] text-neutral-400 mt-0.5 tracking-wider font-bold">GEMINI FLASH & LYRIA WORKSPACE</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="h-8.5 w-8.5 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/10 active:scale-90 transition-all cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Main Container Content */}
      <div className="flex-1 overflow-y-auto pb-24 max-w-3xl mx-auto w-full px-4 md:px-8 pt-6">
        
        {/* Toggle Mode segment bar */}
        <div className="bg-zinc-950 p-1.5 rounded-2xl border border-white/5 flex mb-8">
          <button
            onClick={() => {
              setActiveSegment('transcribe');
              setGenerationError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 text-xs font-black rounded-xl transition-all cursor-pointer ${
              activeSegment === 'transcribe'
                ? 'bg-gradient-to-tr from-[#FF375F] to-[#C026D3] text-white shadow-md'
                : 'text-neutral-405 hover:text-white'
            }`}
          >
            <Mic className="h-4 w-4" /> Transcribe Speech
          </button>
          <button
            onClick={() => {
              setActiveSegment('generate');
              setTranscribeError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 text-xs font-black rounded-xl transition-all cursor-pointer ${
              activeSegment === 'generate'
                ? 'bg-gradient-to-tr from-[#9d5ee5] to-[#7C3AED] text-white shadow-md'
                : 'text-neutral-405 hover:text-white'
            }`}
          >
            <Music className="h-4 w-4" /> Generate AI Music
          </button>
        </div>

        {/* Content Modules */}
        <AnimatePresence mode="wait">
          {activeSegment === 'transcribe' ? (
            <motion.div
              key="transcribe-module"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-left"
            >
              <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col items-center text-center shadow-lg relative overflow-hidden">
                <div className="absolute -top-16 -right-16 h-36 w-36 bg-[#FF375F]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="mb-4 text-xs font-extrabold uppercase tracking-widest text-[#FF375F] flex items-center gap-1">
                  <Mic className="h-3.5 w-3.5" /> Voice Recorder Dashboard
                </div>

                <h3 className="text-xl font-black text-white leading-tight">Microphone Speech to Text</h3>
                <p className="text-xs text-neutral-400 mt-2 max-w-sm leading-relaxed">
                  Record short voice sessions, song concepts, or general notes. Gemini 3.5 Flash turns your vocal chords into written text.
                </p>

                {/* Main Action Recorder Center */}
                <div className="mt-8 mb-6 flex flex-col items-center gap-3">
                  <div className="relative h-28 w-28 flex items-center justify-center">
                    {/* Pulsing ring during record */}
                    {isRecording && (
                      <span className="absolute animate-ping h-24 w-24 rounded-full bg-rose-500/20" />
                    )}
                    
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isTranscribing}
                      className={`h-20 w-20 rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg active:scale-95 transition-all ${
                        isRecording 
                          ? 'bg-[#FF375F] hover:bg-rose-500 shadow-rose-500/20' 
                          : 'bg-zinc-800 hover:bg-zinc-700 hover:border-rose-500 border border-white/5 shadow-black/40'
                      }`}
                    >
                      {isRecording ? (
                        <Square className="h-7 w-7 fill-current stroke-[2.5]" />
                      ) : (
                        <Mic className="h-8.5 w-8.5 stroke-[2]" />
                      )}
                    </button>
                  </div>

                  {isRecording && (
                    <div className="text-xs font-mono font-bold text-rose-500 flex items-center gap-1.5 animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-rose-600 block" /> RECORDING: {formatTimer(recordingSeconds)}
                    </div>
                  )}

                  {!isRecording && !isTranscribing && (
                    <span className="text-[11px] font-bold text-neutral-400 mt-1 uppercase tracking-widest">
                      Tap record to begin session
                    </span>
                  )}
                </div>

                {isTranscribing && (
                  <div className="flex items-center gap-2.5 text-xs text-neutral-400 py-2 border border-[#FF375F]/15 bg-[#FF375F]/5 rounded-xl px-4 animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin text-[#FF375F]" />
                    Analyzing wave frequencies with Gemini...
                  </div>
                )}

                {transcribeError && (
                  <p className="text-xs text-red-400 font-semibold bg-red-950/30 border border-red-500/10 rounded-xl px-4 py-2 mt-2">
                    {transcribeError}
                  </p>
                )}
              </div>

              {/* Transcribed Text Result card */}
              <div className="rounded-3xl border border-white/5 bg-zinc-950/60 p-6 flex flex-col">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs font-black text-neutral-300 uppercase tracking-widest">GEMINI OUTPUT TRANSCRIPT</span>
                  {transcribedText && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setMusicPrompt(transcribedText);
                          setActiveSegment('generate');
                        }}
                        className="flex items-center gap-1.2 rounded-lg bg-[#FF375F]/10 hover:bg-[#FF375F]/15 text-[#FF375F] text-[10px] font-black uppercase py-1 px-3.5 transition-colors cursor-pointer"
                      >
                        Use as Music Prompt <ChevronRight className="h-3 w-3 stroke-[3px]" />
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(transcribedText);
                        }}
                        className="p-1 px-2.5 rounded-lg bg-zinc-900 border border-white/5 text-neutral-400 hover:text-white hover:bg-zinc-850 text-[10px] font-bold uppercase transition-colors cursor-pointer"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {transcribedText ? (
                  <div className="mt-4 text-sm leading-relaxed text-zinc-100 font-medium select-text">
                    "{transcribedText}"
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-neutral-500">
                    <FileAudio className="h-8 w-8 text-neutral-600 mb-2" />
                    <p className="text-xs">Your transcript will appear here automatically right after recording stops.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="generate-module"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-left"
            >
              {/* Prompt formulation with suggestions */}
              <div className="p-6 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/5 rounded-3xl space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-violet-400 uppercase tracking-widest">
                    Craft Music Prompt
                  </label>
                  <p className="text-[10px] text-neutral-400">Describe the atmosphere, instrument arrays, pacing, and overall genre mood.</p>
                </div>

                <div className="flex gap-2.5 items-center">
                  <textarea
                    required
                    placeholder="e.g., Atmospheric cybernetic soundscape featuring synth lines..."
                    value={musicPrompt}
                    onChange={(e) => setMusicPrompt(e.target.value)}
                    disabled={isGenerating}
                    className="flex-1 rounded-2xl bg-black/40 border border-white/5 py-3.5 px-4 text-xs text-white placeholder-neutral-500 outline-none focus:border-violet-500/50 transition-colors min-h-[90px] leading-relaxed resize-none font-sans"
                  />
                </div>

                {/* Suggestions array */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">AI Creative Coordinates:</span>
                  <div className="flex flex-col gap-1.2">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setMusicPrompt(s)}
                        disabled={isGenerating}
                        className="text-[10px] text-zinc-400 hover:text-white bg-white/5 hover:bg-zinc-800 border border-white/5 p-2 rounded-xl text-left truncate transition-all font-medium cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generator Type & Trigger Button */}
                <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex gap-2.5 bg-black/30 p-1 rounded-xl border border-white/5 self-stretch sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setGenerationType('clip')}
                      disabled={isGenerating}
                      className={`flex-1 sm:flex-initial text-[10px] font-black uppercase py-1.5 px-4 rounded-lg cursor-pointer transition-all ${
                        generationType === 'clip' ? 'bg-[#9d5ee5] text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Short Clip (30s)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenerationType('pro')}
                      disabled={isGenerating}
                      className={`flex-1 sm:flex-initial text-[10px] font-black uppercase py-1.5 px-4 rounded-lg cursor-pointer transition-all ${
                        generationType === 'pro' ? 'bg-[#9d5ee5] text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Full Track (120s)
                    </button>
                  </div>

                  <button
                    onClick={handleGenerateMusic}
                    disabled={isGenerating || !musicPrompt.trim()}
                    className="w-full sm:w-auto rounded-xl bg-gradient-to-tr from-[#9d5ee5] to-[#7C3AED] hover:from-[#a56aec] hover:to-[#844beb] text-white font-extrabold text-xs px-6 py-3 shadow-lg shadow-purple-500/10 active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer disabled:bg-[#7C3AED]/20 disabled:text-white/40 shrink-0"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Rendering stems...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 fill-current" />
                        Render Track
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Advanced rendering progress steps with micro copy */}
              {isGenerating && (
                <div className="p-5 border border-purple-500/15 bg-purple-950/10 rounded-2xl flex flex-col space-y-3.5 text-center items-center">
                  <div className="h-10 w-10 rounded-full border border-purple-500/30 flex items-center justify-center bg-purple-500/10">
                    <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-white uppercase tracking-wider">{generationStep}</h5>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed max-w-xs mx-auto">
                      Generating music with Google Lyria models can take up to 30-40 seconds to process audio synthesizers. Your patience will be highly rewarded!
                    </p>
                  </div>
                </div>
              )}

              {generationError && (
                <div className="p-4 bg-red-950/30 border border-red-500/15 text-red-300 rounded-2xl text-xs font-semibold leading-relaxed">
                  {generationError}
                </div>
              )}

              {/* Complete render layout result */}
              {generatedTrack && (
                <div className="p-6 bg-gradient-to-r from-zinc-900 to-zinc-950 rounded-3xl border border-white/10 flex flex-col md:flex-row gap-5 items-stretch md:items-center">
                  
                  {/* Rotating cover art placeholder */}
                  <div className="relative h-24 w-24 rounded-2xl flex-shrink-0 bg-neutral-900 overflow-hidden group border border-white/10 flex items-center justify-center mx-auto md:mx-0">
                    <img 
                      src={generatedTrack.coverUrl} 
                      className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                        previewPlaying ? 'animate-spin-slow' : ''
                      }`} 
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <button
                        onClick={togglePreview}
                        className="h-11 w-11 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center hover:scale-105 active:scale-90 transition-transform cursor-pointer text-white"
                      >
                        {previewPlaying ? (
                          <Square className="h-4.5 w-4.5 fill-current" />
                        ) : (
                          <Play className="h-5.5 w-5.5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Core info display */}
                  <div className="flex-1 overflow-hidden leading-tight text-center md:text-left flex flex-col justify-center">
                    <p className="text-[9px] font-black tracking-[0.25em] text-[#C026D3] uppercase">AI RENDER CONCLUDED</p>
                    <h3 className="font-black text-base text-white mt-1.5 truncate">{generatedTrack.title}</h3>
                    <p className="text-xs text-neutral-400 mt-1">{generatedTrack.artist}</p>
                    <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                      <span className="text-[10px] font-bold text-neutral-400 bg-white/5 py-1 px-2.5 rounded-lg border border-white/5">
                        Format: WAV wave
                      </span>
                      <span className="text-[10px] font-bold text-neutral-405 bg-white/5 py-1 px-2.5 rounded-lg border border-white/5">
                        Model: Lyria 3
                      </span>
                    </div>
                  </div>

                  {/* Add to collection button container */}
                  <div className="flex-shrink-0 flex items-center justify-center md:border-l md:border-white/5 md:pl-5">
                    <button
                      onClick={handleRegisterTrack}
                      className="flex items-center gap-2.5 rounded-xl bg-[#FF375F] hover:bg-rose-500 hover:scale-102 duration-200 shadow-md text-white font-extrabold text-xs px-5 py-3 transition-colors cursor-pointer"
                    >
                      <PlusCircle className="h-4 w-4" /> Save & Stream
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Informational Guidance bar */}
        <div className="mt-12 bg-zinc-950/40 p-4 border border-zinc-900 rounded-2xl flex gap-3 text-neutral-400 text-left items-start">
          <Info className="h-5 w-5 text-neutral-500 mt-0.5 flex-shrink-0" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold text-neutral-300">Aura AI Lab Specifications:</span> Transcribe speech utilizes Gemini 3.5 Flash for audio translations, while rendering custom music clips utilizes the Google Lyria models. Ensure you have authorized microphone permissions before clicking record. Lyria models can only run when you are utilizing a valid API key.
          </div>
        </div>

      </div>
    </div>
  );
};
