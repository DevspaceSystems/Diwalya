'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2, Loader2, Volume2 } from 'lucide-react';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob | null) => void;
}

export default function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        onRecordingComplete(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Please allow microphone access to record audio.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const deleteRecording = () => {
    setAudioURL(null);
    onRecordingComplete(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mt-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Voice Description (Optional)</label>
        {isRecording && (
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
             <span className="text-xs font-black text-red-500 tabular-nums">{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4">
        {!audioURL ? (
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all ${
              isRecording 
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 pulse-light' 
                : 'bg-white text-slate-900 border border-slate-200 hover:border-primary hover:text-primary'
            }`}
          >
            {isRecording ? (
              <><Square size={20} /> Stop Recording</>
            ) : (
              <><Mic size={20} /> Record Voice Message</>
            )}
          </button>
        ) : (
          <div className="w-full flex items-center gap-3">
             <div className="flex-grow h-14 bg-white rounded-2xl border border-slate-100 flex items-center px-4 gap-3">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center animate-pulse">
                   <Volume2 size={16} />
                </div>
                <audio src={audioURL} controls className="h-8 flex-grow" />
             </div>
             <button
               type="button"
               onClick={deleteRecording}
               className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-all"
             >
               <Trash2 size={20} />
             </button>
          </div>
        )}
      </div>
      <p className="text-[9px] text-gray-700 font-bold mt-3 uppercase tracking-widest italic">
        {isRecording ? "Recording in progress..." : audioURL ? "Review your voice message before submitting" : "Can't type? Just record your message"}
      </p>
    </div>
  );
}
