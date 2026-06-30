/**
 * KORA Player Store — Global Audio State (Zustand)
 * 
 * Architecture DSP : l'audio persiste pendant la navigation
 * Comme Spotify, Apple Music, etc.
 * 
 * Note: State persists via React component tree (provider in _layout.tsx)
 */

import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  stream_url?: string;
  duration?: number;
  type?: 'audio' | 'video' | 'live';
  source?: string;
}

interface PlayerState {
  // Current Track
  currentTrack: Track | null;
  queue: Track[];
  
  // Playback State
  isPlaying: boolean;
  isBuffering: boolean;
  progress: number;     // 0-1
  duration: number;     // seconds
  currentTime: number;  // seconds
  
  // Player UI State
  isExpanded: boolean;  // Mini-player vs Full-screen
  isMiniPlayerVisible: boolean;
  
  // Preferences
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  isLiked: boolean;
  
  // Actions
  setCurrentTrack: (track: Track | null) => void;
  setQueue: (queue: Track[]) => void;
  addToQueue: (track: Track) => void;
  playNext: () => void;
  playPrevious: () => void;
  
  setIsPlaying: (playing: boolean) => void;
  setIsBuffering: (buffering: boolean) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
  setMiniPlayerVisible: (visible: boolean) => void;
  
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleLike: () => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  currentTrack: null as Track | null,
  queue: [] as Track[],
  isPlaying: false,
  isBuffering: false,
  progress: 0,
  duration: 0,
  currentTime: 0,
  isExpanded: false,
  isMiniPlayerVisible: false,
  shuffle: false,
  repeat: 'off' as const,
  isLiked: false,
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  ...initialState,
  
  setCurrentTrack: (track) => set({ 
    currentTrack: track,
    isMiniPlayerVisible: !!track,
    progress: 0,
    currentTime: 0,
  }),
  
  setQueue: (queue) => set({ queue }),
  
  addToQueue: (track) => set((state) => ({
    queue: [...state.queue, track]
  })),
  
  playNext: () => {
    const { queue, currentTrack, shuffle, repeat } = get();
    if (queue.length === 0) {
      if (repeat === 'one' || repeat === 'all') {
        set({ progress: 0, currentTime: 0 });
      }
      return;
    }
    
    let nextIndex = 0;
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
    
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeat === 'all') {
          nextIndex = 0;
        } else {
          return; // End of queue
        }
      }
    }
    
    set({ 
      currentTrack: queue[nextIndex],
      progress: 0,
      currentTime: 0,
    });
  },
  
  playPrevious: () => {
    const { queue, currentTrack, currentTime } = get();
    
    // If more than 3 seconds in, restart track
    if (currentTime > 3) {
      set({ progress: 0, currentTime: 0 });
      return;
    }
    
    const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex > 0) {
      set({ 
        currentTrack: queue[currentIndex - 1],
        progress: 0,
        currentTime: 0,
      });
    }
  },
  
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsBuffering: (isBuffering) => set({ isBuffering }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  setCurrentTime: (currentTime) => set((state) => ({
    currentTime,
    progress: state.duration > 0 ? currentTime / state.duration : 0,
  })),
  
  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
  setExpanded: (isExpanded) => set({ isExpanded }),
  setMiniPlayerVisible: (isMiniPlayerVisible) => set({ isMiniPlayerVisible }),
  
  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
  
  cycleRepeat: () => set((state) => ({
    repeat: state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off'
  })),
  
  toggleLike: () => set((state) => ({ isLiked: !state.isLiked })),
  
  reset: () => set(initialState),
}));
