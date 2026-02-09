import React, { useState, useRef } from 'react';
import { transcribeAudio } from '../services/geminiService';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        try {
            const text = await transcribeAudio(audioBlob);
            onTranscriptionComplete(text);
        } catch (error) {
            alert("Erro ao transcrever áudio.");
        } finally {
            setIsProcessing(false);
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Erro ao acessar microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      {!isRecording && !isProcessing && (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center gap-2 px-3 py-1.5 bg-macos-bg border border-macos-border rounded-full text-sm font-medium hover:bg-white transition-colors"
        >
          <svg className="w-4 h-4 text-macos-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Gravar Nota
        </button>
      )}

      {isRecording && (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-full text-sm font-medium animate-pulse"
        >
          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
          Parar Gravação
        </button>
      )}

      {isProcessing && (
        <span className="text-sm text-gray-500 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-macos-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Transcrevendo com Gemini...
        </span>
      )}
    </div>
  );
};

export default AudioRecorder;
