import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, Modality, LiveServerMessage, Blob, FunctionDeclaration, Type } from '@google/genai';
import { AppState, Passage, Speaker, TranscriptEntry } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';
import { encode, decode, decodeAudioData } from '../services/audioUtils';

const getScriptureFunctionDeclaration: FunctionDeclaration = {
  name: 'get_scripture',
  description: 'Retrieves the text of a specific Bible verse or passage from the King James Version (KJV).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reference: {
        type: Type.STRING,
        description: 'The Bible reference, e.g., "John 3:16" or "Genesis 1:1-5".',
      },
    },
    required: ['reference'],
  },
};

export const useGeminiLive = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [passage, setPassage] = useState<Passage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<LiveSession | null>(null);
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const audioContextRefs = useRef<{
    input: AudioContext | null;
    output: AudioContext | null;
    micSource: MediaStreamAudioSourceNode | null;
    processor: ScriptProcessorNode | null;
    outputSources: Set<AudioBufferSourceNode>;
  }>({ input: null, output: null, micSource: null, processor: null, outputSources: new Set() });
  
  const nextAudioStartTime = useRef(0);

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    sessionPromiseRef.current = null;
    
    audioContextRefs.current.processor?.disconnect();
    audioContextRefs.current.micSource?.disconnect();
    audioContextRefs.current.input?.close();
    audioContextRefs.current.output?.close();
    audioContextRefs.current.outputSources.forEach(source => source.stop());

    audioContextRefs.current = { input: null, output: null, micSource: null, processor: null, outputSources: new Set() };
    
    setAppState(AppState.IDLE);
    console.log('Session stopped and cleaned up.');
  }, []);

  const startSession = useCallback(async () => {
    setAppState(AppState.CONNECTING);
    setError(null);
    setTranscript([]);
    setPassage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRefs.current.input = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRefs.current.output = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextAudioStartTime.current = 0;
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [getScriptureFunctionDeclaration] }],
        },
        callbacks: {
          onopen: () => {
            console.log('Session opened.');
            setAppState(AppState.ACTIVE);
            
            const { input } = audioContextRefs.current;
            if (!input) return;

            audioContextRefs.current.micSource = input.createMediaStreamSource(stream);
            audioContextRefs.current.processor = input.createScriptProcessor(4096, 1, 1);
            
            audioContextRefs.current.processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            
            audioContextRefs.current.micSource.connect(audioContextRefs.current.processor);
            audioContextRefs.current.processor.connect(input.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
                for (const fc of message.toolCall.functionCalls) {
                  if (fc.name === 'get_scripture' && fc.args?.reference) {
                    try {
                      const reference = fc.args.reference as string;
                      const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}?translation=kjv`);
                      if (!response.ok) {
                        throw new Error(`API error: ${response.status} ${response.statusText}`);
                      }
                      const data = await response.json();
                      const passageText = data.text.trim().replace(/\n/g, ' ');
                      const passageReference = data.reference;
    
                      setPassage({ reference: passageReference, text: passageText });
    
                      sessionPromise.then(session => {
                        session.sendToolResponse({
                          functionResponses: {
                            id: fc.id,
                            name: fc.name,
                            response: { result: `Successfully fetched "${passageReference}": ${passageText}` },
                          }
                        });
                      });
    
                    } catch (e) {
                      console.error("Failed to fetch scripture:", e);
                      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                      sessionPromise.then(session => {
                        session.sendToolResponse({
                          functionResponses: {
                            id: fc.id,
                            name: fc.name,
                            response: { error: `Failed to retrieve the passage. Please ask the user to try another reference. Error: ${errorMessage}` },
                          }
                        });
                      });
                    }
                  }
                }
            }

            if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                setTranscript(prev => {
                    const last = prev[prev.length - 1];
                    if (last?.speaker === Speaker.User && !last.isFinal) {
                        return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                    }
                    return [...prev, { speaker: Speaker.User, text, isFinal: false }];
                });
            }
            if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                setTranscript(prev => {
                    const last = prev[prev.length - 1];
                    if (last?.speaker === Speaker.AI && !last.isFinal) {
                        return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                    }
                    return [...prev, { speaker: Speaker.AI, text, isFinal: false }];
                });
            }
            if (message.serverContent?.turnComplete) {
                setTranscript(prev => prev.map(entry => ({ ...entry, isFinal: true })));
            }
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const { output, outputSources } = audioContextRefs.current;
              if (!output) return;

              const audioBuffer = await decodeAudioData(decode(audioData), output, 24000, 1);
              const source = output.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(output.destination);

              const currentTime = output.currentTime;
              nextAudioStartTime.current = Math.max(nextAudioStartTime.current, currentTime);
              source.start(nextAudioStartTime.current);
              nextAudioStartTime.current += audioBuffer.duration;
              
              outputSources.add(source);
              source.onended = () => outputSources.delete(source);
            }
          },
          onerror: (e) => {
            console.error('Session error:', e);
            setError(`Session error: ${e.type}`);
            setAppState(AppState.ERROR);
            stopSession();
          },
          onclose: () => {
            console.log('Session closed.');
            stream.getTracks().forEach(track => track.stop());
            if (appState !== AppState.IDLE) {
                setAppState(AppState.IDLE);
            }
          },
        },
      });

      sessionPromiseRef.current = sessionPromise;
      sessionRef.current = await sessionPromise;

    } catch (err) {
      console.error('Failed to start session:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to start: ${errorMessage}`);
      setAppState(AppState.ERROR);
    }
  }, [stopSession, appState]);

  return { appState, transcript, passage, error, startSession, stopSession };
};