
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getClientId } from '@/lib/clientId';
import { useToast } from '@/components/ui/use-toast';

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const { toast } = useToast();
  const audioRef = useRef(new Audio());
  const clientId = getClientId();
  
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load preferences from database
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data: prefs, error: prefsError } = await supabase
          .from('music_preferences')
          .select('*, last_track:public_music(*)')
          .eq('client_id', clientId)
          .single();

        if (prefsError && prefsError.code !== 'PGRST116') {
          throw prefsError;
        }

        if (prefs) {
          setVolume(prefs.volume);
          setCurrentTime(prefs.current_time);
          setIsPlaying(prefs.is_playing);
          if (prefs.last_track) {
            setCurrentTrack(prefs.last_track);
          }
        } else {
          // Create initial preferences
          await supabase
            .from('music_preferences')
            .insert({ client_id: clientId });
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        toast({
          title: "Error",
          description: "Failed to load music preferences",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [clientId]);

  // Save preferences to database
  const savePreferences = async () => {
    try {
      const { error } = await supabase
        .from('music_preferences')
        .upsert({
          client_id: clientId,
          last_track_id: currentTrack?.id,
          volume,
          current_time: currentTime,
          is_playing: isPlaying,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  // Save preferences when they change
  useEffect(() => {
    if (!loading) {
      savePreferences();
    }
  }, [currentTrack?.id, volume, currentTime, isPlaying]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (error) => {
      console.error('Audio playback error:', error);
      setIsPlaying(false);
      toast({
        title: "Playback Error",
        description: "Failed to play the track",
        variant: "destructive"
      });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Handle volume changes
  useEffect(() => {
    audioRef.current.volume = volume / 100;
  }, [volume]);

  // Handle track changes
  useEffect(() => {
    const audio = audioRef.current;

    if (currentTrack) {
      audio.src = currentTrack.file_url;
      audio.currentTime = currentTime;
      
      if (isPlaying) {
        audio.play().catch(error => {
          console.error('Playback failed:', error);
          setIsPlaying(false);
          toast({
            title: "Playback Error",
            description: "Failed to play the track",
            variant: "destructive"
          });
        });
      }
    }

    return () => {
      audio.pause();
      setCurrentTime(audio.currentTime);
    };
  }, [currentTrack]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;

    if (isPlaying && currentTrack) {
      audio.play().catch(error => {
        console.error('Playback failed:', error);
        setIsPlaying(false);
        toast({
          title: "Playback Error",
          description: "Failed to play the track",
          variant: "destructive"
        });
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const playTrack = (track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  const setAudioVolume = (value) => {
    setVolume(value);
  };

  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <MusicContext.Provider
      value={{
        currentTrack,
        isPlaying,
        volume,
        currentTime,
        loading,
        playTrack,
        setAudioVolume,
        seekTo,
        duration: audioRef.current.duration || 0,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
