/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  RotateCw,
  Volume2,
  VolumeX,
  Heart,
  Download,
  ListMusic,
  Share2,
  Mic,
  AlignLeft,
  Tv,
  Cast,
  CheckCircle2,
  ListOrdered,
  Copy,
  Check,
  X,
  Sparkles,
  MoreHorizontal
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { Track } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface FullPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LyricLine {
  time: number;
  text: string;
}

export const FullPlayer: React.FC<FullPlayerProps> = ({ isOpen, onClose }) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    isRepeat,
    queue,
    likedTrackIds,
    offlineDownloadedIds,
    analyserNode,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleLikeTrack,
    toggleDownloadTrack,
    removeFromQueue
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'cover' | 'lyrics' | 'queue'>('cover');
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState<number>(-1);
  const [isCastOpen, setIsCastOpen] = useState<boolean>(false);
  const [castSuccess, setCastSuccess] = useState<string | null>(null);

  // Session & UI Options
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);

  // Sharing states
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [shareTheme, setShareTheme] = useState<'cosmic' | 'slate' | 'vinyl' | 'neon'>('cosmic');
  const [isCopyingDone, setIsCopyingDone] = useState<boolean>(false);
  const [isImageGenerating, setIsImageGenerating] = useState<boolean>(false);

  // Audio Visualizer Canvas Hook Setup
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen || !analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Dynamic floating particle objects
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      alpha: number;
      color: string;
    }> = [];

    // Genre-specific visual color sets
    const getVisualColors = () => {
      const genre = currentTrack?.genre || '';
      switch (genre) {
        case 'Synthwave':
          return ['rgba(139, 92, 246, ', 'rgba(244, 63, 94, ', 'rgba(236, 72, 153, '];
        case 'Ambient':
          return ['rgba(16, 185, 129, ', 'rgba(59, 130, 246, ', 'rgba(6, 182, 212, '];
        case 'Jazz':
          return ['rgba(217, 70, 239, ', 'rgba(79, 70, 229, ', 'rgba(99, 102, 241, '];
        case 'Lofi Hip Hop':
          return ['rgba(244, 63, 94, ', 'rgba(245, 158, 11, ', 'rgba(251, 113, 133, '];
        case 'Chilled Acoustic':
          return ['rgba(245, 158, 11, ', 'rgba(16, 185, 129, ', 'rgba(101, 163, 13, '];
        default:
          return ['rgba(244, 63, 94, ', 'rgba(139, 92, 246, ', 'rgba(251, 113, 133, '];
      }
    };

    // Spawn floating dust particles
    const initParticles = (width: number, height: number) => {
      const colors = getVisualColors();
      particles.length = 0;
      for (let i = 0; i < 25; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 3 + 1,
          speedY: -(Math.random() * 0.4 + 0.15),
          speedX: Math.random() * 0.2 - 0.1,
          alpha: Math.random() * 0.4 + 0.1,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    // Canvas coordinate projection resizing
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      initParticles(rect.width, rect.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let phase = 0;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // Draw standard clear
      ctx.clearRect(0, 0, width, height);

      // Extract raw audio data
      analyserNode.getByteFrequencyData(dataArray);

      // Quantize energy frequency bands
      let bassSum = 0;
      let midSum = 0;
      let trebleSum = 0;

      for (let i = 0; i < 12; i++) bassSum += dataArray[i];
      for (let i = 12; i < 50; i++) midSum += dataArray[i];
      for (let i = 50; i < 110; i++) trebleSum += dataArray[i];

      const bass = bassSum / 12 / 255;      // 0.0 to 1.0 multiplier
      const mid = midSum / 38 / 255;        // 0.0 to 1.0 multiplier
      const treble = trebleSum / 60 / 255;  // 0.0 to 1.0 multiplier
      const overallValue = (bass + mid + treble) / 3;

      const colors = getVisualColors();

      // Render floating particle systems
      particles.forEach((p) => {
        const speedBoost = 1 + bass * 3.5 + treble * 1.5;
        p.y += p.speedY * speedBoost;
        p.x += p.speedX * (1 + mid * 2);

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10 || p.x > width + 10) {
          p.x = Math.random() * width;
        }

        const sizeOffset = p.size * (1 + bass * 0.9 + overallValue * 0.3);
        const alphaOffset = Math.min(0.9, p.alpha * (1 + treble * 1.2));

        ctx.fillStyle = `${p.color}${alphaOffset})`;
        ctx.shadowBlur = bass > 0.4 ? 12 * bass : 0;
        ctx.shadowColor = p.color + '0.5)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, sizeOffset, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Update oscillation progression
      phase += 0.015 + overallValue * 0.035;

      // Compound Bézier Sine Wave ribbons drawing helper
      const drawWave = (waveIndex: number, amplitudeBoost: number, frequencyMultiplier: number, opacityVal: number, colorPrefix: string) => {
        ctx.beginPath();
        const finalAmplitude = (25 + amplitudeBoost * 85) * (0.35 + overallValue * 0.65);
        const baselineY = height * 0.58 + waveIndex * 20;

        ctx.moveTo(0, baselineY);

        for (let x = 0; x <= width; x += 6) {
          const relativeX = x / width;
          const osc1 = Math.sin(relativeX * Math.PI * 2 * frequencyMultiplier + phase + waveIndex * 1.2);
          const osc2 = Math.cos(relativeX * Math.PI * 4 * frequencyMultiplier - phase * 0.8);
          const maskVal = Math.sin(relativeX * Math.PI); // Smooth out bounds

          const offset = osc1 * osc2 * finalAmplitude * maskVal;
          ctx.lineTo(x, baselineY + offset);
        }

        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, colorPrefix + '0.0)');
        grad.addColorStop(0.5, colorPrefix + opacityVal + ')');
        grad.addColorStop(1, colorPrefix + '0.0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.0 + waveIndex * 1.5;
        ctx.shadowBlur = 12 * overallValue;
        ctx.shadowColor = colorPrefix + '0.3)';
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      // Draw layered colored waves
      drawWave(0, bass, 1.1, 0.42, colors[0]);
      drawWave(1, mid, 2.3, 0.32, colors[1]);
      drawWave(2, treble, 3.5, 0.22, colors[2]);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isOpen, analyserNode, currentTrack]);

  const handleCopyDirectLink = () => {
    if (!currentTrack) return;
    const directLink = `${window.location.origin}/?track=${currentTrack.id}`;
    navigator.clipboard.writeText(directLink)
      .then(() => {
        setIsCopyingDone(true);
        setTimeout(() => setIsCopyingDone(false), 2000);
        setCastSuccess("Aura direct track link copied!");
        setTimeout(() => setCastSuccess(null), 2500);
      })
      .catch((err) => {
        console.error('Failed to copy direct link:', err);
      });
  };

  const handleDownloadCard = () => {
    if (!currentTrack) return;
    setIsImageGenerating(true);
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 780;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsImageGenerating(false);
      return;
    }

    const drawFullCard = (img?: HTMLImageElement) => {
      // 1. Background Fill Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (shareTheme === 'cosmic') {
        grad.addColorStop(0, '#0F0C20');
        grad.addColorStop(0.5, '#3B1078');
        grad.addColorStop(1, '#6F0A43');
      } else if (shareTheme === 'slate') {
        grad.addColorStop(0, '#09090D');
        grad.addColorStop(0.5, '#15151A');
        grad.addColorStop(1, '#2B2B33');
      } else if (shareTheme === 'vinyl') {
        grad.addColorStop(0, '#5C2204');
        grad.addColorStop(0.5, '#180B30');
        grad.addColorStop(1, '#020208');
      } else {
        // Neon grid glow
        grad.addColorStop(0, '#000000');
        grad.addColorStop(0.6, '#0B0B0F');
        grad.addColorStop(1, '#3B0A16');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Abstract Glowing Halos
      if (shareTheme === 'cosmic') {
        const glowGrad = ctx.createRadialGradient(canvas.width / 2, 300, 30, canvas.width / 2, 300, 260);
        glowGrad.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 300, 260, 0, Math.PI * 2);
        ctx.fill();
      } else if (shareTheme === 'neon') {
        // Glowing Neon Accent Lines
        ctx.strokeStyle = 'rgba(255, 55, 95, 0.4)';
        ctx.lineWidth = 14;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
        
        ctx.strokeStyle = 'rgba(255, 55, 95, 0.1)';
        ctx.lineWidth = 1;
        // Drawing Cyber Grid lines
        for (let ix = 50; ix < canvas.width; ix += 50) {
          ctx.beginPath();
          ctx.moveTo(ix, 50);
          ctx.lineTo(ix, canvas.height - 50);
          ctx.stroke();
        }
        for (let iy = 50; iy < canvas.height; iy += 50) {
          ctx.beginPath();
          ctx.moveTo(50, iy);
          ctx.lineTo(canvas.width - 50, iy);
          ctx.stroke();
        }
      } else if (shareTheme === 'vinyl') {
        // Concentric LP record representation peeking behind
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1.5;
        for (let r = 150; r <= 230; r += 14) {
          ctx.beginPath();
          ctx.arc(canvas.width / 2 + 110, 300, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Rounded border wrapper for card
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = shareTheme === 'vinyl' ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = shareTheme === 'vinyl' ? 2 : 1;

      const cardX = 40;
      const cardY = 40;
      const cardW = canvas.width - 80;
      const cardH = canvas.height - 80;

      const drawRounded = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      };

      drawRounded(cardX, cardY, cardW, cardH, 30);
      ctx.fill();
      ctx.stroke();

      // Draw Album Cover Image
      const imgSize = 320;
      const imgX = (canvas.width - imgSize) / 2;
      const imgY = 95;

      ctx.save();
      // Rounded clipping mask for cover picture
      drawRounded(imgX, imgY, imgSize, imgSize, 22);
      ctx.clip();

      if (img) {
        ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
      } else {
        // Premium Fallback Vinyl illustration if CORS issues block loading image
        const recordGrad = ctx.createRadialGradient(canvas.width / 2, imgY + imgSize / 2, 20, canvas.width / 2, imgY + imgSize / 2, imgSize / 2);
        recordGrad.addColorStop(0, '#FF375F');
        recordGrad.addColorStop(0.35, '#7C3AED');
        recordGrad.addColorStop(0.85, '#050510');
        recordGrad.addColorStop(1, '#000000');
        ctx.fillStyle = recordGrad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let row = 15; row < imgSize / 2 - 5; row += 10) {
          ctx.beginPath();
          ctx.arc(canvas.width / 2, imgY + imgSize / 2, row, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, imgY + imgSize / 2, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Outer cover frame border
      ctx.strokeStyle = shareTheme === 'vinyl' ? '#D4AF37' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = shareTheme === 'vinyl' ? 2 : 1;
      drawRounded(imgX, imgY, imgSize, imgSize, 22);
      ctx.stroke();

      // Song Title
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.font = '800 28px Inter, system-ui, sans-serif';
      ctx.fillText(currentTrack.title, canvas.width / 2, 470);

      // Artist name
      ctx.font = '600 18px Inter, system-ui, sans-serif';
      ctx.fillStyle = shareTheme === 'neon' ? '#FF375F' : 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(currentTrack.artist, canvas.width / 2, 502);

      // Metadata line
      ctx.font = '700 12px Inter, monospace, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText(`${currentTrack.album.toUpperCase()} • ${currentTrack.genre.toUpperCase()}`, canvas.width / 2, 528);

      // Waveform display
      ctx.beginPath();
      ctx.strokeStyle = shareTheme === 'neon' ? '#FF375F' : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2.5;
      const startX = 110;
      const endX = canvas.width - 110;
      const centerY = 585;
      
      ctx.moveTo(startX, centerY);
      // Nice math representation of a stylized audio wavelength
      for (let x = startX; x <= endX; x++) {
        const relativeX = (x - startX) / (endX - startX);
        const term1 = Math.sin(relativeX * Math.PI * 8.5);
        const term2 = Math.cos(relativeX * Math.PI * 2);
        const envelope = Math.sin(relativeX * Math.PI);
        const wave = term1 * term2 * 15 * envelope;
        ctx.lineTo(x, centerY + wave);
      }
      ctx.stroke();

      // End caps for waveform line
      ctx.fillStyle = shareTheme === 'neon' ? '#FF375F' : 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(startX, centerY, 3, 0, Math.PI * 2);
      ctx.arc(endX, centerY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Audio Time tags
      ctx.font = '500 11px Inter, monospace, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillText('0:00', startX, centerY + 28);
      ctx.fillText(formatTime(currentTrack.duration), endX, centerY + 28);

      // Exclusivity stamp
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.font = '900 10px Inter, system-ui, sans-serif';
      ctx.letterSpacing = '3px';
      ctx.fillText('STREAMING EXCLUSIVELY ON AURA MUSIC', canvas.width / 2, 658);

      // Aesthetic mini QR / matrix visual block
      const qrSize = 24;
      const qrX = canvas.width / 2 - qrSize / 2;
      const qrY = 684;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(qrX, qrY, qrSize, qrSize);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(qrX + 3, qrY + 3, qrSize - 6, qrSize - 6);
      ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
      ctx.fillRect(qrX + 7, qrY + 7, qrSize - 14, qrSize - 14);

      try {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `AuraCard_${currentTrack.title.replace(/\s+/g, '_')}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setCastSuccess("Aura Share Card Saved!");
        setTimeout(() => setCastSuccess(null), 3000);
      } catch (err) {
        console.error('Canvas export error:', err);
        setCastSuccess("Export issue. Link copied standard instead.");
        setTimeout(() => setCastSuccess(null), 3000);
      } finally {
        setIsImageGenerating(false);
      }
    };

    // Construct image with cache-busting logic
    const imgElement = new Image();
    imgElement.crossOrigin = 'anonymous';
    imgElement.src = currentTrack.coverUrl + '?t=' + Date.now();

    imgElement.onload = () => {
      drawFullCard(imgElement);
    };
    imgElement.onerror = () => {
      console.warn('Cover art load blocked by CORS. Rendering pristine geometric card art fallback.');
      drawFullCard();
    };
  };

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragValue, setDragValue] = useState<number>(0);

  // Synchronise local drag value when not dragging to prevent jitter
  useEffect(() => {
    if (!isDragging) {
      setDragValue(currentTime);
    }
  }, [currentTime, isDragging]);

  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLyricRef = useRef<HTMLDivElement | null>(null);

  // Parse [mm:ss] timestamp lyrics
  useEffect(() => {
    if (!currentTrack) return;
    
    const lyricsList: LyricLine[] = [];
    currentTrack.lyrics.forEach((line) => {
      const match = line.match(/^\[(\d{2}):(\d{2})\]\s*(.*)/);
      if (match) {
        const mins = parseInt(match[1]);
        const secs = parseInt(match[2]);
        lyricsList.push({
          time: mins * 60 + secs,
          text: match[3]
        });
      } else {
        lyricsList.push({
          time: -1,
          text: line
        });
      }
    });
    setParsedLyrics(lyricsList);
  }, [currentTrack]);

  // Sync active lyric block based on current playback seconds
  useEffect(() => {
    if (parsedLyrics.length === 0 || activeTab !== 'lyrics') return;

    let activeIdx = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (parsedLyrics[i].time !== -1 && currentTime >= parsedLyrics[i].time) {
        activeIdx = i;
      }
    }

    setActiveLyricIndex(activeIdx);
  }, [currentTime, parsedLyrics, activeTab]);

  // Auto scroll logic
  useEffect(() => {
    if (activeLyricRef.current && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const element = activeLyricRef.current;
      
      const desiredScrollTop = element.offsetTop - container.clientHeight / 2 + element.clientHeight / 2;
      container.scrollTo({
        top: desiredScrollTop,
        behavior: 'smooth'
      });
    }
  }, [activeLyricIndex]);

  const progressPercentage = duration > 0 ? (dragValue / duration) * 100 : 0;

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const isLiked = currentTrack ? likedTrackIds.includes(currentTrack.id) : false;
  const isDownloaded = currentTrack ? offlineDownloadedIds.includes(currentTrack.id) : false;

  const getDynamicBackground = () => {
    if (!currentTrack) return {};
    switch(currentTrack.genre) {
      case 'Synthwave':
        return { background: 'radial-gradient(circle at 50% 25%, rgba(139, 92, 246, 0.45) 0%, rgba(244, 63, 94, 0.35) 40%, rgba(12, 12, 15, 0.98) 100%)' };
      case 'Ambient':
        return { background: 'radial-gradient(circle at 50% 25%, rgba(16, 185, 129, 0.4) 0%, rgba(59, 130, 246, 0.35) 40%, rgba(12, 12, 15, 0.98) 100%)' };
      case 'Jazz':
        return { background: 'radial-gradient(circle at 50% 25%, rgba(217, 70, 239, 0.4) 0%, rgba(79, 70, 229, 0.35) 40%, rgba(12, 12, 15, 0.98) 100%)' };
      case 'Lofi Hip Hop':
        return { background: 'radial-gradient(circle at 50% 25%, rgba(244, 63, 94, 0.45) 0%, rgba(245, 158, 11, 0.35) 40%, rgba(12, 12, 15, 0.98) 100%)' };
      case 'Chilled Acoustic':
        return { background: 'radial-gradient(circle at 50% 25%, rgba(245, 158, 11, 0.4) 0%, rgba(16, 185, 129, 0.35) 40%, rgba(12, 12, 15, 0.98) 100%)' };
      default:
        return { background: 'radial-gradient(circle at 50% 25%, rgba(244, 63, 94, 0.4) 0%, rgba(139, 92, 246, 0.35) 40%, rgba(12, 12, 15, 0.98) 100%)' };
    }
  };

  const getGenreLyricColor = () => {
    if (!currentTrack) return '#FF375F';
    switch(currentTrack.genre) {
      case 'Synthwave':
        return '#8B5CF6';
      case 'Ambient':
        return '#10B981';
      case 'Jazz':
        return '#D946EF';
      case 'Lofi Hip Hop':
        return '#F43F5E';
      case 'Chilled Acoustic':
        return '#F59E0B';
      default:
        return '#FF375F';
    }
  };

  const triggerCastSimulation = (device: string) => {
    setCastSuccess(`Streaming seamlessly on: ${device}!`);
    setIsCastOpen(false);
    setTimeout(() => setCastSuccess(null), 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && currentTrack && (
        <motion.div
          initial={{ y: '100%', opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          drag="y"
          dragDirectionLock
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.1, bottom: 0.8 }}
          onDragEnd={(e, info) => {
            if (info.offset.y > 120 || info.velocity.y > 600) {
              onClose();
            }
          }}
          style={getDynamicBackground()}
          className="fixed inset-0 z-50 flex flex-col text-white overflow-hidden shadow-2xl h-screen w-screen bg-[#070709] select-none"
        >
          {/* Blurred overlay background cover */}
          <div className="absolute inset-0 z-0 h-full w-full overflow-hidden opacity-45 pointer-events-none">
            <div 
              className="absolute inset-0 bg-cover bg-center blur-[120px] scale-150 transform-gpu"
              style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
            />
            {/* Soft dark premium gradient fallback overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c]/40 via-[#0a0a0c]/70 to-[#0a0a0c]" />
          </div>

          {/* Dynamic Web Audio API Frequency Visualizer Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 h-full w-full pointer-events-none opacity-40 mix-blend-screen"
          />

          <div className="relative z-10 flex flex-col justify-between h-full w-full max-w-xl mx-auto px-6 py-8 md:py-12 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            
            {/* Header bar */}
            <header className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="rounded-full bg-white/5 active:scale-95 transition-all p-3 text-white/80 hover:bg-white/10 cursor-pointer"
                aria-label="Minimize Player"
              >
                <ChevronDown className="h-6 w-6 stroke-[2.5]" />
              </button>

              <div className="text-center font-medium leading-tight">
                <small className="block text-[10px] uppercase tracking-[0.2em] text-[#FF375F] font-black">PLAYING FROM ALBUM</small>
                <span className="text-sm font-bold text-white/90 truncate max-w-[200px] block mt-0.5">{currentTrack.album}</span>
              </div>

              <button
                onClick={() => setIsMoreMenuOpen(prev => !prev)}
                className="rounded-full bg-white/5 active:scale-95 transition-all p-3 text-white/80 hover:bg-white/10 cursor-pointer"
                title="More options"
              >
                <MoreHorizontal className="h-6 w-6" />
              </button>
            </header>

            {/* Success Notification Bar */}
            <AnimatePresence>
              {castSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-22 inset-x-5 z-45 bg-[#FF375F] text-white py-3.5 px-4 rounded-2xl flex items-center gap-2.5 shadow-lg text-xs font-bold animate-pulse"
                >
                  <CheckCircle2 className="h-4.5 w-4.5 stroke-[2.5]" /> {castSuccess}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Container */}
            <main className="flex-1 flex flex-col justify-center my-4 overflow-hidden">
              
              {/* TAB 1: Center Cover View */}
              {activeTab === 'cover' && (
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                  {/* Center scaling album artwork */}
                  <motion.div
                    layout
                    animate={{
                      scale: isPlaying ? 1.0 : 0.88,
                    }}
                    transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                    className="relative shadow-[0_24px_50px_rgba(0,0,0,0.65)] rounded-[24px] overflow-hidden aspect-square w-full max-w-[320px] md:max-w-[360px] border border-white/15 bg-zinc-950"
                  >
                    <img
                      src={currentTrack.coverUrl}
                      alt={currentTrack.title}
                      className="h-full w-full object-cover select-none"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                  
                  {/* Song title block and likes */}
                  <div className="mt-8 flex items-center justify-between w-full max-w-[320px] md:max-w-[360px] px-1 leading-tight">
                    <div className="overflow-hidden pr-4 text-left font-semibold">
                      <motion.h2
                        layout
                        className="text-2xl md:text-3xl font-extrabold tracking-tight text-white truncate"
                      >
                        {currentTrack.title}
                      </motion.h2>
                      <p className="mt-1.5 text-base md:text-lg font-semibold text-white/60 truncate">
                        {currentTrack.artist}
                      </p>
                      <span className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1 block">{currentTrack.genre}</span>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => toggleLikeTrack(currentTrack.id)}
                      className={`p-3 rounded-full hover:bg-white/5 cursor-pointer flex-shrink-0 transition-colors ${
                        isLiked ? 'text-[#FF375F] bg-[#FF375F]/10' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <Heart className="h-6.5 w-6.5" fill={isLiked ? 'currentColor' : 'none'} />
                    </motion.button>
                  </div>
                </div>
              )}

              {/* TAB 2: Apple Music Realtime Synced Lyrics view */}
              {activeTab === 'lyrics' && (
                <div className="flex-1 flex flex-col py-4 overflow-hidden">
                  <h3 className="text-[10px] uppercase tracking-widest text-[#FF375F] font-extrabold mb-4 px-2 flex items-center gap-2">
                    <Mic className="h-4.5 w-4.5 text-[#FF375F]" /> Synced Premium Lyrics
                  </h3>
                  <div
                    ref={lyricsContainerRef}
                    className="flex-1 overflow-y-auto pr-2 space-y-7 max-h-[48vh] relative pt-[15vh] pb-[25vh]"
                    style={{
                      scrollbarWidth: 'none',
                      maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, transparent 100%)',
                      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, transparent 100%)'
                    }}
                  >
                    {parsedLyrics.map((line, idx) => {
                      const isActive = idx === activeLyricIndex;
                      return (
                        <motion.div
                          key={idx}
                          ref={isActive ? activeLyricRef : null}
                          onClick={() => line.time !== -1 && seekTo(line.time)}
                          animate={{
                            opacity: isActive ? 1.0 : 0.32,
                            scale: isActive ? 1.04 : 0.95,
                            x: isActive ? 6 : 0,
                          }}
                          transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                          className={`select-none px-5 py-3.5 rounded-2xl cursor-pointer leading-normal transition-all duration-[300ms] ${
                            isActive
                              ? 'text-2xl font-black text-white bg-white/10 shadow-lg'
                              : 'text-xl font-bold text-white/60 hover:text-white hover:opacity-90 origin-left'
                          }`}
                          style={{
                            borderLeft: isActive ? `6.5px solid ${getGenreLyricColor()}` : '6px solid transparent',
                            textShadow: isActive ? `0 0 16px ${getGenreLyricColor()}65` : 'none',
                            boxShadow: isActive ? `0 8px 30px ${getGenreLyricColor()}20` : 'none',
                          }}
                        >
                          {line.text}
                        </motion.div>
                      );
                    })}
                    {parsedLyrics.length === 0 && (
                      <div className="text-center text-white/40 font-semibold py-24 text-sm italic">
                        Beautiful instrumental piece. Enjoy raw atmospheric beats.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Queue Screen */}
              {activeTab === 'queue' && (
                <div className="flex-1 flex flex-col py-4 overflow-hidden">
                  <div className="mb-4 flex items-center justify-between px-2">
                    <h3 className="text-[10px] uppercase tracking-widest text-[#FF375F] font-bold flex items-center gap-1.5">
                      <ListMusic className="h-5 w-5" /> Upcoming Rotation
                    </h3>
                    <span className="text-xs text-white/40 font-medium">{queue.length} Songs</span>
                  </div>
                  
                  <div 
                    className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[48vh]"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    <div className="border border-white/5 bg-white/5 rounded-2xl p-3.5 flex items-center gap-3">
                      <img src={currentTrack.coverUrl} className="h-10 w-10 rounded-lg object-cover" />
                      <div className="flex-1 overflow-hidden leading-tight text-left">
                        <span className="text-[9px] uppercase font-black tracking-widest text-[#FF375F]">Currently Playing</span>
                        <p className="font-extrabold text-sm truncate">{currentTrack.title}</p>
                        <p className="text-xs text-white/60 truncate mt-0.5">{currentTrack.artist}</p>
                      </div>
                    </div>

                    {queue.map((track, idx) => (
                      <div
                        key={`${track.id}-${idx}`}
                        className="group rounded-2xl bg-white/5 hover:bg-white/10 p-3 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden text-left">
                          <img src={track.coverUrl} className="h-10 w-10 rounded-lg object-cover" />
                          <div className="overflow-hidden leading-none">
                            <p className="font-bold text-sm truncate">{track.title}</p>
                            <p className="text-xs text-white/40 truncate mt-1">{track.artist}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromQueue(track.id)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 text-white/50 hover:text-[#FF375F] hover:bg-white/15 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Drop
                        </button>
                      </div>
                    ))}
                    {queue.length === 0 && (
                      <div className="text-center text-white/30 font-semibold py-24 text-xs italic">
                        No upcoming songs in the queue block.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>

            {/* Consolidated Premium Controls */}
            <footer className="space-y-6">
              
              {/* Timeline Seek bar */}
              <div className="space-y-2">
                <input
                  id="audio-seek"
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={dragValue}
                  onMouseDown={() => setIsDragging(true)}
                  onTouchStart={() => setIsDragging(true)}
                  onChange={(e) => setDragValue(parseFloat(e.target.value))}
                  onMouseUp={(e) => {
                    const val = parseFloat((e.target as HTMLInputElement).value);
                    seekTo(val);
                    setIsDragging(false);
                  }}
                  onTouchEnd={(e) => {
                    const val = parseFloat((e.target as HTMLInputElement).value);
                    seekTo(val);
                    setIsDragging(false);
                  }}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-apple-rose overflow-hidden outline-none transition-all hover:h-2"
                  style={{
                    background: `linear-gradient(to right, #FF375F 0%, #FF375F ${progressPercentage}%, rgba(255, 255, 255, 0.1) ${progressPercentage}%, rgba(255, 255, 255, 0.1) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs font-semibold font-mono text-white/40 px-0.5">
                  <span>{formatTime(dragValue)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Controls Row */}
              <div className="flex items-center justify-between px-1">
                {/* Shuffle */}
                <button
                  onClick={toggleShuffle}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    isShuffle ? 'text-[#FF375F] bg-[#FF375F]/10 scale-105' : 'text-white/50 hover:text-white'
                  }`}
                  title="Shuffle"
                >
                  <Shuffle className="h-6 w-6" />
                </button>

                {/* Skip Back */}
                <button
                  onClick={prevTrack}
                  className="p-3 text-white/80 active:scale-90 hover:text-white transition-all hover:scale-110 cursor-pointer"
                  title="Previous Track"
                >
                  <SkipBack className="h-8 w-8" fill="currentColor" />
                </button>

                {/* Master Play / Pause */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={togglePlay}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-neutral-900 shadow-[0_8px_32px_rgba(255,255,255,0.12)] cursor-pointer hover:bg-neutral-100 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-9 w-9 text-neutral-900" fill="currentColor" />
                  ) : (
                    <Play className="h-9 w-9 translate-x-[2px] text-neutral-900" fill="currentColor" />
                  )}
                </motion.button>

                {/* Skip Forward */}
                <button
                  onClick={nextTrack}
                  className="p-3 text-white/80 active:scale-90 hover:text-white transition-all hover:scale-110 cursor-pointer"
                  title="Next Track"
                >
                  <SkipForward className="h-8 w-8" fill="currentColor" />
                </button>

                {/* Repeat */}
                <button
                  onClick={toggleRepeat}
                  className={`relative p-2.5 rounded-xl transition-all cursor-pointer ${
                    isRepeat !== 'none' ? 'text-[#FF375F] bg-[#FF375F]/10 scale-105' : 'text-white/50 hover:text-white'
                  }`}
                  title="Repeat"
                >
                  <RotateCw className="h-6 w-6" />
                  {isRepeat === 'one' && <span className="absolute -top-1 -right-1 text-[8px] bg-[#FF375F] text-white rounded-full h-4 w-4 flex items-center justify-center font-bold border border-zinc-950">1</span>}
                  {isRepeat === 'all' && <span className="absolute -top-1 -right-1 text-[8px] bg-[#FF375F] text-white rounded-full h-4 w-4 flex items-center justify-center font-bold border border-zinc-950">A</span>}
                </button>
              </div>

              {/* Volume slide control */}
              <div className="flex items-center gap-3.5 text-white/40 px-1">
                <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors cursor-pointer">
                  {isMuted || volume === 0 ? <VolumeX className="h-5 w-5 text-[#FF375F]" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <input
                  id="audio-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-lg bg-white/10 outline-none accent-apple-rose hover:bg-white/20 transition-all pointer-events-auto"
                  style={{
                    background: `linear-gradient(to right, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.7) ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.1) ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
                  }}
                />
                <Volume2 className="h-5 w-5 text-white/60" />
              </div>

              {/* Bottom Row Utilities */}
              <div className="flex items-center justify-between border-t border-white/5 pt-5 text-white/65 font-semibold">
                <button
                  onClick={() => setActiveTab('cover')}
                  className={`p-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs transition-all ${
                    activeTab === 'cover' ? 'text-[#FF375F] bg-white/10 scale-102 font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <AlignLeft className="h-4.5 w-4.5" /> Art
                </button>
                
                <button
                  onClick={() => setActiveTab('lyrics')}
                  className={`p-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs transition-all ${
                    activeTab === 'lyrics' ? 'text-[#FF375F] bg-white/10 scale-102 font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Mic className="h-4.5 w-4.5" /> Lyrics
                </button>

                <button
                  onClick={() => setIsCastOpen(true)}
                  className="p-2 rounded-full hover:bg-white/5 text-white/60 hover:text-white cursor-pointer transition-colors"
                  title="AirPlay & Cast"
                >
                  <Cast className="h-5 w-5" />
                </button>

                <button
                  onClick={() => setIsShareOpen(true)}
                  className="p-2 rounded-full hover:bg-white/5 text-white/60 hover:text-white cursor-pointer transition-colors"
                  title="Share Design Card"
                >
                  <Share2 className="h-5 w-5" />
                </button>

                <button
                  onClick={() => setActiveTab('queue')}
                  className={`p-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs transition-all ${
                    activeTab === 'queue' ? 'text-[#FF375F] bg-white/10 scale-102 font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <ListOrdered className="h-4.5 w-4.5" /> Queue
                </button>
              </div>

            </footer>

          </div>

          {/* Cast Device Overlay */}
          {isCastOpen && (
            <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/75 backdrop-blur-md px-6">
              <div className="w-full max-w-sm rounded-[32px] bg-neutral-900 border border-white/10 p-6 shadow-2xl text-white">
                <h3 className="text-base font-extrabold pb-3 border-b border-white/5 flex items-center gap-2">
                  <Tv className="h-5 w-5 text-[#FF375F]" /> AirPlay & Cast Output
                </h3>
                <div className="mt-4 space-y-2">
                  {['HomePod Pro (Living Room)', 'Aura Soundbar', 'Apple TV (Bedroom)', 'Local Device'].map((dev) => (
                    <button
                      key={dev}
                      onClick={() => triggerCastSimulation(dev)}
                      className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-between transition-colors text-sm font-bold cursor-pointer"
                    >
                      <span>{dev}</span>
                      <span className="text-[10px] text-[#FF375F] uppercase tracking-widest font-black">Link</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsCastOpen(false)}
                  className="mt-6 w-full py-3 bg-white/10 hover:bg-white/15 rounded-2xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Close Panel
                </button>
              </div>
            </div>
          )}

          {/* Social Share Overlay */}
          {isShareOpen && (
            <div className="fixed inset-0 z-55 flex flex-col justify-end md:justify-center md:items-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
              <div className="w-full max-w-sm rounded-[32px] bg-neutral-900 border border-white/10 p-5 shadow-2xl text-white flex flex-col max-h-[92vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                  <h3 className="text-sm font-extrabold flex items-center gap-2">
                    <Share2 className="h-4.5 w-4.5 text-[#FF375F]" /> Share Aura Track
                  </h3>
                  <button
                    onClick={() => setIsShareOpen(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Live Interactive Card Preview */}
                <div className="flex flex-col items-center mb-5 select-none scale-95 md:scale-100">
                  <div 
                    className={`w-full aspect-[4/5] rounded-[24px] relative overflow-hidden flex flex-col p-4 border border-white/10 shadow-xl justify-between transition-all duration-300 ${
                      shareTheme === 'cosmic' ? 'bg-gradient-to-b from-indigo-950 via-purple-950 to-[#500e33]' :
                      shareTheme === 'slate' ? 'bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950' :
                      shareTheme === 'vinyl' ? 'bg-gradient-to-b from-amber-950 via-[#120726] to-black border-[#D4AF37]/50' :
                      'bg-gradient-to-b from-black via-[#0B0B0F] to-[#450a1b]' // neon
                    }`}
                  >
                    {/* Visual accent ring / decorative elements */}
                    {shareTheme === 'cosmic' && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-48 h-48 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
                    )}
                    {shareTheme === 'neon' && (
                      <div className="absolute inset-2 border border-rose-500/10 pointer-events-none opacity-40 grid grid-cols-4 grid-rows-5">
                        {[...Array(20)].map((_, i) => (
                          <div key={i} className="border-r border-b border-rose-500/5" />
                        ))}
                      </div>
                    )}
                    {shareTheme === 'vinyl' && (
                      <div className="absolute top-[28%] right-2 w-36 h-36 rounded-full border border-white/5 pointer-events-none flex items-center justify-center opacity-40">
                        <div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full border border-white/5" />
                        </div>
                      </div>
                    )}

                    {/* Inner border style line */}
                    <div className="absolute inset-0 rounded-[24px] border border-white/5 pointer-events-none" />
                    
                    {/* Brand label & Stamp */}
                    <div className="flex justify-between items-center text-[8px] tracking-widest text-white/50 font-black relative z-10 ms-1 me-1">
                      <span>AURA STREAM SELECTION</span>
                      <span className={shareTheme === 'vinyl' ? 'text-[#D4AF37]' : 'text-[#FF375F]'}>EST. 2026</span>
                    </div>

                    {/* Cover Frame preview */}
                    <div className="flex justify-center my-3 relative z-10">
                      <div 
                        className={`w-36 h-36 rounded-xl overflow-hidden shadow-2xl relative transition-all duration-300 ${
                          shareTheme === 'vinyl' ? 'ring-2 ring-[#D4AF37] scale-102' : 'ring-1 ring-white/15'
                        }`}
                      >
                        <img 
                          src={currentTrack.coverUrl} 
                          alt={currentTrack.title} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                    {/* Text section */}
                    <div className="text-center relative z-10 px-1 leading-tight text-white shadow-sm">
                      <h4 className="font-extrabold text-sm truncate mb-0.5">{currentTrack.title}</h4>
                      <p className={`text-xs font-semibold ${
                        shareTheme === 'neon' ? 'text-[#FF375F]' : 'text-white/70'
                      } truncate`}>
                        {currentTrack.artist}
                      </p>
                      <p className="text-[9px] uppercase tracking-wider font-mono text-white/35 mt-1">{currentTrack.album}</p>
                    </div>

                    {/* Waveform preview and small footer */}
                    <div className="relative z-10 flex flex-col gap-1.5 mt-auto">
                      <div className="flex items-center justify-between text-[8px] font-mono text-white/30">
                        <span>0:00</span>
                        <div className="flex-1 mx-2 h-[1px] bg-white/10 relative flex items-center justify-center">
                          {/* Stylized wave pattern */}
                          <div className="absolute inset-x-0 h-3 flex items-center justify-between px-2 text-white/20">
                            <div className="w-[1.5px] h-1.5 bg-current" />
                            <div className="w-[1.5px] h-2.5 bg-current" />
                            <div className="w-[1.5px] h-3.5 bg-current" />
                            <div className="w-[1.5px] h-2 bg-current" />
                            <div className="w-[1.5px] h-1.5 bg-current" />
                            <div className="w-[1.5px] h-3 bg-current" />
                            <div className="w-[1.5px] h-2 bg-current" />
                            <div className="w-[1.5px] h-1.5 bg-current" />
                          </div>
                        </div>
                        <span>{formatTime(currentTrack.duration)}</span>
                      </div>
                      
                      <span className="text-[7.5px] text-center font-black tracking-widest text-[#FF375F] uppercase mt-1">
                        STREAMING EXCLUSIVELY ON AURA MUSIC
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customized Theme selector segment */}
                <div className="mb-4 bg-white/5 rounded-2xl p-2.5 border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1.5 px-1">
                    Card Custom Style Template
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'cosmic', label: 'Cosmic', bg: 'bg-indigo-950 border-purple-500/20 text-purple-200' },
                      { id: 'slate', label: 'Noir Slate', bg: 'bg-zinc-800 border-zinc-700/50 text-zinc-300' },
                      { id: 'vinyl', label: 'Gold LP', bg: 'bg-amber-950 border-amber-800/30 text-[#D4AF37]' },
                      { id: 'neon', label: 'Cyber', bg: 'bg-stone-900 border-[#FF375F]/20 text-[#FF375F]' },
                    ].map((th) => (
                      <button
                        key={th.id}
                        onClick={() => setShareTheme(th.id as any)}
                        className={`py-1.5 px-0.5 rounded-xl border text-[9px] font-extrabold flex flex-col items-center justify-center transition-all cursor-pointer ${th.bg} ${
                          shareTheme === th.id ? 'ring-1.5 ring-white scale-102 border-transparent' : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        {th.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Final control buttons */}
                <div className="space-y-2 mt-auto">
                  <button
                    onClick={handleCopyDirectLink}
                    className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-[0.99] border border-white/10 flex items-center justify-between transition-all text-xs font-bold cursor-pointer group"
                  >
                    <span className="flex items-center gap-2">
                      <Copy className="h-4 w-4 text-[#FF375F] group-hover:scale-110 transition-transform" />
                      Copy Direct Song Link
                    </span>
                    {isCopyingDone ? (
                      <span className="text-[10px] text-green-400 font-extrabold flex items-center gap-1 animate-pulse">
                        <Check className="h-3 w-3" /> Copied!
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/30 uppercase font-black tracking-widest group-hover:text-white/60">
                        Get URL
                      </span>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadCard}
                    disabled={isImageGenerating}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#FF375F] hover:bg-[#FF375F]/90 active:scale-[0.99] flex items-center justify-center gap-2 transition-all text-xs font-black shadow shadow-[#FF375F]/25 disabled:opacity-60 cursor-pointer"
                  >
                    <Sparkles className={`h-4.5 w-4.5 ${isImageGenerating ? 'animate-spin' : ''}`} />
                    {isImageGenerating ? 'Composing Share Card...' : 'Generate Shareable Image'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* More Options sliding menu */}
          <AnimatePresence>
            {isMoreMenuOpen && (
              <div className="fixed inset-0 z-55 flex items-end justify-center bg-black/60 backdrop-blur-sm">
                <div className="absolute inset-0 animate-fade-in" onClick={() => setIsMoreMenuOpen(false)} />
                
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="relative z-10 w-full max-w-xl rounded-t-[32px] bg-[#121216]/95 border-t border-white/10 p-6 pb-12 shadow-2xl text-white select-none backdrop-blur-xl"
                >
                  <div className="mx-auto w-12 h-1.5 bg-white/20 rounded-full mb-6" />
                  
                  {/* Song Head layout */}
                  <div className="flex items-center gap-4 pb-5 border-b border-white/5 mb-4">
                    <img src={currentTrack.coverUrl} className="h-16 w-16 rounded-xl object-cover shadow-lg animate-scale-up" />
                    <div className="overflow-hidden leading-tight text-left">
                      <h3 className="font-extrabold text-lg text-white truncate">{currentTrack.title}</h3>
                      <p className="text-sm text-[#FF375F] font-bold mt-0.5 truncate">{currentTrack.artist}</p>
                      <p className="text-xs text-white/40 truncate mt-0.5">{currentTrack.album}</p>
                    </div>
                  </div>

                  {/* Options items */}
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        toggleLikeTrack(currentTrack.id);
                        setIsMoreMenuOpen(false);
                        setCastSuccess(isLiked ? "Removed from Favorites" : "Added to Favorites!");
                        setTimeout(() => setCastSuccess(null), 2500);
                      }}
                      className="w-full py-4 px-4 rounded-2xl hover:bg-white/5 text-left text-sm font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>{isLiked ? "Remove from Saved Tracks" : "Save to Favorites"}</span>
                      <Heart className="h-5 w-5 text-[#FF375F]" fill={isLiked ? "currentColor" : "none"} />
                    </button>

                    <button
                      onClick={() => {
                        toggleDownloadTrack(currentTrack.id);
                        setIsMoreMenuOpen(false);
                        setCastSuccess(isDownloaded ? "Removed Offline Storage" : "Downloaded to Offline Vault!");
                        setTimeout(() => setCastSuccess(null), 2500);
                      }}
                      className="w-full py-4 px-4 rounded-2xl hover:bg-white/5 text-left text-sm font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>{isDownloaded ? "Delete Offline Download" : "Download Offline"}</span>
                      <Download className={`h-5 w-5 ${isDownloaded ? 'text-green-400' : 'text-white/60'}`} />
                    </button>

                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setIsShareOpen(true);
                      }}
                      className="w-full py-4 px-4 rounded-2xl hover:bg-white/5 text-left text-sm font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Share Track Presentation Card</span>
                      <Share2 className="h-5 w-5 text-indigo-400" />
                    </button>

                    <button
                      onClick={async () => {
                        handleCopyDirectLink();
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full py-4 px-4 rounded-2xl hover:bg-white/5 text-left text-sm font-bold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>Copy Direct Track Link</span>
                      <Copy className="h-5 w-5 text-emerald-400" />
                    </button>
                  </div>

                  <button
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="mt-6 w-full py-4 bg-white/5 hover:bg-white/10 active:scale-98 rounded-2xl text-sm font-bold uppercase tracking-wider cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
