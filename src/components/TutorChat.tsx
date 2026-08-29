import React, { useState, useRef, useEffect } from 'react';
import { StudentProfile, ChatMessage, Subject, GradeBand } from '../types';
import { TOPIC_PRESETS, QUICK_HELP_PROMPTS, SUBJECT_COLORS } from '../data/presetData';
import { FormattedText } from './FormattedText';
import { 
  Send, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Lightbulb, 
  HelpCircle, 
  Image as ImageIcon, 
  RefreshCw,
  Mic,
  MicOff,
  AlertCircle,
  Bot,
  User,
  CheckCircle,
  Zap,
  ZoomIn,
  Maximize2,
  X
} from 'lucide-react';

interface TutorChatProps {
  profile: StudentProfile;
  setProfile: React.Dispatch<React.SetStateAction<StudentProfile>>;
}

function createAudioUrlFromBase64(base64Data: string, mimeType: string = 'audio/wav'): string {
  if (base64Data.startsWith('UklGR')) {
    return `data:audio/wav;base64,${base64Data}`;
  }

  let sampleRate = 24000;
  const match = mimeType.match(/rate=(\d+)/);
  if (match && match[1]) {
    sampleRate = parseInt(match[1], 10);
  }

  try {
    const binaryString = atob(base64Data);
    const pcmLen = binaryString.length;
    const buffer = new ArrayBuffer(44 + pcmLen);
    const view = new DataView(buffer);

    view.setUint8(0, 0x52); // 'R'
    view.setUint8(1, 0x49); // 'I'
    view.setUint8(2, 0x46); // 'F'
    view.setUint8(3, 0x46); // 'F'
    view.setUint32(4, 36 + pcmLen, true);
    view.setUint8(8, 0x57);  // 'W'
    view.setUint8(9, 0x41);  // 'A'
    view.setUint8(10, 0x56); // 'V'
    view.setUint8(11, 0x45); // 'E'

    view.setUint8(12, 0x66); // 'f'
    view.setUint8(13, 0x6d); // 'm'
    view.setUint8(14, 0x74); // 't'
    view.setUint8(15, 0x20); // ' '
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);

    view.setUint8(36, 0x64); // 'd'
    view.setUint8(37, 0x61); // 'a'
    view.setUint8(38, 0x74); // 't'
    view.setUint8(39, 0x61); // 'a'
    view.setUint32(40, pcmLen, true);

    const pcmBytes = new Uint8Array(buffer, 44, pcmLen);
    for (let i = 0; i < pcmLen; i++) {
      pcmBytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch {
    return `data:${mimeType};base64,${base64Data}`;
  }
}

const getSubjectGreeting = (subject: Subject, gradeBand: GradeBand, name: string) => {
  const studentName = name || 'there';
  switch (subject) {
    case 'Math':
      return `Hi ${studentName}! 👋 I am your dedicated Math Specialist for Grade ${gradeBand}! 🧮 Math is my absolute superpower—ask me any math equation, word problem, or fraction! (Note: I am strictly a Math tutor—if you ask me about Reading, Science, or History, I will politely refer you to those tabs above!)`;
    case 'ELA':
      return `Hi ${studentName}! 👋 I am your Reading & Writing Specialist for Grade ${gradeBand}! 📚 Stories, essays, grammar, and vocabulary are my superpower! (Note: I am strictly an ELA tutor—if you ask me about Math, Science, or Social Studies, I will refer you to those tabs above!)`;
    case 'Science':
      return `Hi ${studentName}! 👋 I am your Science Specialist for Grade ${gradeBand}! 🔬 Biology, space, chemistry, physics, and nature are my specialty! (Note: I am strictly a Science tutor—if you ask me about Math, ELA, or History, I will refer you to those tabs above!)`;
    case 'Social Studies':
    default:
      return `Hi ${studentName}! 👋 I am your Social Studies & History Specialist for Grade ${gradeBand}! 🌍 World history, maps, civics, and cultures are my specialty! (Note: I am strictly a Social Studies tutor—if you ask me about Math, ELA, or Science, I will refer you to those tabs above!)`;
  }
};

export const TutorChat: React.FC<TutorChatProps> = ({ profile, setProfile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      sender: 'tutor',
      text: getSubjectGreeting(profile.subject, profile.gradeBand, profile.name),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  const [input, setInput] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Update initial tutor greeting when subject/gradeBand changes
  useEffect(() => {
    setSelectedTopic('');
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'tutor',
        text: getSubjectGreeting(profile.subject, profile.gradeBand, profile.name),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  }, [profile.subject, profile.gradeBand, profile.name]);

  // Send message to Express API
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'student',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInput('');
    setIsLoading(true);

    const isDrawRequest = /\b(draw|diagram|picture|illustration|sketch|graphic|visual|show me|paint|render)\b/i.test(textToSend);

    try {
      const chatPromise = fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          gradeBand: profile.gradeBand,
          subject: profile.subject,
          topic: selectedTopic,
        }),
      });

      let visualAidPromise: Promise<Response> | null = null;
      if (isDrawRequest) {
        visualAidPromise = fetch('/api/tutor/visual-aid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: textToSend,
            gradeBand: profile.gradeBand,
            subject: profile.subject,
          }),
        });
      }

      const [response, visualRes] = await Promise.all([
        chatPromise,
        visualAidPromise ? visualAidPromise.catch(() => null) : Promise.resolve(null),
      ]);

      if (!response.ok) {
        throw new Error('Failed to fetch tutor response');
      }

      const data = await response.json();
      let imageUrl: string | undefined = undefined;

      if (visualRes && visualRes.ok) {
        try {
          const visualData = await visualRes.json();
          if (visualData.imageUrl) {
            imageUrl = visualData.imageUrl;
          }
        } catch (e) {
          console.warn('Failed to parse visual diagram response:', e);
        }
      }

      const tutorReply: ChatMessage = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        text: data.text,
        imageUrl,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, tutorReply]);

      // Award student engagement points
      setProfile((prev) => ({
        ...prev,
        points: prev.points + 10,
      }));
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'tutor',
          text: "I had a tiny hiccup connecting, but I'm right here! Could you ask that one more time?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Educational Visual Aid Diagram
  const handleRequestVisualAid = async () => {
    if (isGeneratingImage || isLoading) return;

    const topicPrompt = selectedTopic || input || profile.subject;
    const requestText = `Draw an educational diagram or visual illustration for ${profile.subject}: ${topicPrompt}`;

    const userMsg: ChatMessage = {
      id: `user-img-${Date.now()}`,
      sender: 'student',
      text: `🖼️ Can you show me a visual diagram of this?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsGeneratingImage(true);

    try {
      const res = await fetch('/api/tutor/visual-aid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: topicPrompt,
          gradeBand: profile.gradeBand,
          subject: profile.subject,
        }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        const tutorImgMsg: ChatMessage = {
          id: `tutor-img-${Date.now()}`,
          sender: 'tutor',
          text: `Here is a custom visual illustration to help you picture **${topicPrompt}**! 🎨`,
          imageUrl: data.imageUrl,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, tutorImgMsg]);
      } else {
        throw new Error('Image creation failed');
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-img-${Date.now()}`,
          sender: 'tutor',
          text: "I couldn't draw the diagram right now, but I can describe it step-by-step for you!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Play Speech Audio (TTS)
  const handlePlayTTS = async (messageId: string, text: string) => {
    if (isSpeaking === messageId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(null);
      return;
    }

    setIsSpeaking(messageId);

    const speakWithWebSpeech = () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#]/g, ''));
        utterance.rate = profile.gradeBand === 'PreK-2' ? 0.85 : 0.95;
        utterance.onend = () => setIsSpeaking(null);
        utterance.onerror = () => setIsSpeaking(null);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(null);
      }
    };

    try {
      // Try Gemini TTS endpoint first
      const res = await fetch('/api/tutor/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'Kore' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audioUrl = createAudioUrlFromBase64(data.audioBase64, data.mimeType);
          const audio = new Audio();
          audioRef.current = audio;

          audio.onended = () => {
            if (audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
            setIsSpeaking(null);
          };
          audio.onerror = () => {
            if (audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
            speakWithWebSpeech();
          };

          audio.src = audioUrl;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              if (audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
              audioRef.current = null;
              speakWithWebSpeech();
            });
          }
          return;
        }
      }
    } catch {
      /* quiet fallback */
    }

    // Fallback: Web Speech API in browser
    speakWithWebSpeech();
  };

  // Speech Recognition input for all learners with interim feedback & mic permission support
  const handleSpeechInput = async () => {
    setMicError(null);

    // If currently listening, stop it
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          /* ignore stop error */
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // Check mediaDevices permission first to ensure iframe permission modal or prompt is triggered properly
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Close tracks immediately after permission check
        stream.getTracks().forEach(track => track.stop());
      } catch (err: any) {
        console.warn('Microphone permission check error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMicError('Microphone permission was denied. Please allow microphone access in your browser address bar.');
          return;
        }
      }
    }

    if (!SpeechRecognition) {
      setMicError('Speech recognition is not directly supported by this browser. You can type your question in the text box below!');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      let finalTranscript = '';

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptChunk;
          } else {
            interim += transcriptChunk;
          }
        }
        const textSoFar = finalTranscript || interim;
        if (textSoFar) {
          setInput(textSoFar);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setMicError('Microphone access was denied. Please allow microphone access in your browser address bar.');
        } else if (event.error === 'no-speech') {
          setMicError('No speech was detected. Click the microphone and try speaking clearly again!');
        } else if (event.error !== 'aborted') {
          setMicError(`Voice input error: ${event.error}. Please try again or type your question.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setMicError('Could not start microphone listening. Please verify browser microphone permissions.');
    }
  };

  const currentTopics = TOPIC_PRESETS[profile.gradeBand]?.[profile.subject] || [];
  const activeColor = SUBJECT_COLORS[profile.subject];

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-10rem)] min-h-[550px] bg-white dark:bg-[#1A1817] rounded-3xl shadow-xs border border-[#EFEBE5] dark:border-[#2B2623] overflow-hidden">
      
      {/* Header Banner */}
      <div className={`px-6 py-3 border-b border-[#EFEBE5] dark:border-[#2B2623] flex items-center justify-between ${activeColor.bg}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#7A8D6E] flex items-center justify-center text-white font-bold shadow-2xs border border-[#E9EDDF]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-[#433D3A] dark:text-[#EFEBE5] text-sm">
                Virtual Tutor ({profile.subject})
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E9EDDF] dark:bg-[#2B2623] text-[#58694C] dark:text-[#C3D1B9]">
                {profile.gradeBand} Mode
              </span>
            </div>
            <p className="text-xs text-[#77716E] dark:text-[#A8A29E]">
              {selectedTopic ? `Focused on: ${selectedTopic}` : 'Select a topic or type any question!'}
            </p>
          </div>
        </div>

        {/* Visual Aid Button */}
        <button
          id="btn-request-visual-aid"
          onClick={handleRequestVisualAid}
          disabled={isGeneratingImage || isLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#2B2623] border border-[#EFEBE5] dark:border-[#3D3734] text-xs font-semibold text-[#433D3A] dark:text-[#EFEBE5] hover:bg-[#FDFBF7] dark:hover:bg-[#322C28] transition-all shadow-2xs disabled:opacity-50"
        >
          {isGeneratingImage ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#7A8D6E]" />
          ) : (
            <ImageIcon className="w-3.5 h-3.5 text-[#7A8D6E]" />
          )}
          <span className="hidden sm:inline">Draw Diagram</span>
        </button>
      </div>

      {/* Topic Presets Bar */}
      <div className="px-6 py-2 bg-[#FDFBF7] dark:bg-[#23201E] border-b border-[#EFEBE5] dark:border-[#2B2623] flex items-center space-x-2 overflow-x-auto">
        <span className="text-xs font-semibold text-[#77716E] dark:text-[#A8A29E] flex items-center space-x-1 whitespace-nowrap">
          <Zap className="w-3.5 h-3.5 text-[#D6A378]" />
          <span>Topics:</span>
        </span>
        {currentTopics.map((top) => (
          <button
            key={top}
            id={`topic-chip-${top.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            onClick={() => {
              setSelectedTopic(top);
              handleSendMessage(`Let's learn about ${top}! Can you explain it simply with an example?`);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedTopic === top
                ? 'bg-[#7A8D6E] text-white shadow-2xs font-semibold'
                : 'bg-white dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] border border-[#EFEBE5] dark:border-[#3D3734] hover:border-[#7A8D6E]'
            }`}
          >
            {top}
          </button>
        ))}
      </div>

      {/* Message History Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FDFBF7]/60 dark:bg-[#171514]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${
              msg.sender === 'student' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-2xs ${
                msg.sender === 'tutor'
                  ? 'bg-[#7A8D6E] border-2 border-[#E9EDDF]'
                  : 'bg-[#D6A378] border-2 border-[#F5E8DC]'
              }`}
            >
              {msg.sender === 'tutor' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>

            {/* Content Bubble */}
            <div className={`max-w-[82%] sm:max-w-[75%] space-y-2`}>
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'tutor'
                    ? 'bg-white dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] border-l-4 border-l-[#7A8D6E] border-y border-r border-[#EFEBE5] dark:border-[#3D3734] shadow-xs'
                    : 'bg-[#7A8D6E] text-white font-medium shadow-2xs'
                }`}
              >
                {/* Formatted Text */}
                <div className="whitespace-pre-wrap font-sans">
                  <FormattedText text={msg.text} />
                </div>

                {/* Generated Diagram Image */}
                {msg.imageUrl && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-[#CBD5E1] dark:border-[#3D3734] bg-white p-2.5 shadow-sm">
                    <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-[#F1F5F9]">
                      <span className="flex items-center space-x-1.5 text-xs font-bold text-[#1E293B]">
                        <ImageIcon className="w-4 h-4 text-[#7A8D6E]" />
                        <span>High-Clarity Diagram</span>
                      </span>
                      <button
                        onClick={() => setEnlargedImage(msg.imageUrl || null)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#E2E8F0] text-xs font-semibold text-[#334155] transition-colors border border-[#CBD5E1]"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Enlarge</span>
                      </button>
                    </div>
                    <div 
                      onClick={() => setEnlargedImage(msg.imageUrl || null)}
                      className="cursor-pointer group relative rounded-xl overflow-hidden bg-white p-2 flex items-center justify-center border border-[#F1F5F9]"
                    >
                      <img
                        src={msg.imageUrl}
                        alt="Visual Diagram"
                        className="w-full h-auto max-h-80 object-contain rounded-lg transition-transform duration-200 group-hover:scale-[1.01]"
                      />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-3.5 py-1.5 rounded-full font-semibold flex items-center space-x-1.5 shadow-lg">
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Click to View Full Size</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Toolbar for Tutor Messages */}
              {msg.sender === 'tutor' && (
                <div className="flex items-center space-x-2 text-xs text-[#77716E] dark:text-[#A8A29E]">
                  <button
                    id={`tts-btn-${msg.id}`}
                    onClick={() => handlePlayTTS(msg.id, msg.text)}
                    className="flex items-center space-x-1 hover:text-[#7A8D6E] transition-colors py-0.5 px-1.5 rounded-md hover:bg-[#E9EDDF]/50 dark:hover:bg-[#2B2623]"
                  >
                    {isSpeaking === msg.id ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-[#7A8D6E] animate-pulse" />
                        <span className="text-[#7A8D6E] font-semibold">Stop</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen</span>
                      </>
                    )}
                  </button>

                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-2xl bg-[#7A8D6E] text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white dark:bg-[#2B2623] border border-[#EFEBE5] dark:border-[#3D3734] text-xs text-[#77716E] dark:text-[#A8A29E] flex items-center space-x-2 shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#7A8D6E] animate-spin" />
              <span>Thinking about the best way to explain this...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Scaffolding Helper Chips */}
      <div className="px-4 py-2 bg-[#FDFBF7] dark:bg-[#23201E] border-t border-[#EFEBE5] dark:border-[#2B2623] flex items-center space-x-2 overflow-x-auto">
        {QUICK_HELP_PROMPTS.map((prompt) => (
          <button
            key={prompt.label}
            id={`quick-prompt-${prompt.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            onClick={() => handleSendMessage(prompt.text)}
            disabled={isLoading}
            className="px-3 py-1 rounded-xl bg-white dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] text-xs font-semibold border border-[#EFEBE5] dark:border-[#3D3734] hover:border-[#7A8D6E] hover:bg-[#E9EDDF]/50 dark:hover:bg-[#2B2623] transition-all whitespace-nowrap disabled:opacity-50"
          >
            {prompt.label}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 bg-white dark:bg-[#1A1817] border-t border-[#EFEBE5] dark:border-[#2B2623] space-y-2">
        {/* Active Listening Visual Banner */}
        {isListening && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-red-500/10 dark:bg-red-900/20 border border-red-300 dark:border-red-800/50 rounded-xl text-xs font-bold text-red-600 dark:text-red-300 animate-pulse">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
              <span>Listening... Speak into your microphone!</span>
            </div>
            <button
              onClick={handleSpeechInput}
              className="text-[11px] underline hover:opacity-80"
            >
              Stop
            </button>
          </div>
        )}

        {/* Mic Error Banner */}
        {micError && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/10 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800/50 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300">
            <div className="flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{micError}</span>
            </div>
            <button
              onClick={() => setMicError(null)}
              className="text-[11px] font-bold underline hover:opacity-80 ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          {/* Voice Input Button */}
          <button
            type="button"
            id="voice-mic-input-btn"
            onClick={handleSpeechInput}
            title={isListening ? "Stop listening" : "Speak your question"}
            className={`p-2.5 rounded-xl border transition-all shrink-0 ${
              isListening
                ? 'bg-red-500 text-white border-red-600 ring-2 ring-red-400 animate-pulse'
                : 'bg-[#E9EDDF]/60 dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] border-[#D0D7C5] dark:border-[#3D3734] hover:bg-[#E9EDDF]'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input Field */}
          <input
            type="text"
            id="tutor-chat-input"
            aria-label="Ask your virtual tutor a question"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              profile.gradeBand === 'PreK-2'
                ? "Type or speak your question here! 🌟"
                : "Ask your virtual tutor a question or ask for step-by-step help..."
            }
            className="flex-1 bg-[#FDFBF7] dark:bg-[#2B2623] text-[#433D3A] dark:text-[#EFEBE5] text-sm rounded-xl px-4 py-2.5 border border-[#EFEBE5] dark:border-[#3D3734] focus:outline-none focus:ring-2 focus:ring-[#7A8D6E]"
          />

          {/* Send Button */}
          <button
            type="submit"
            id="tutor-chat-submit-btn"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 bg-[#7A8D6E] hover:bg-[#687a5d] text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center space-x-1.5 shadow-xs"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Lightbox / Enlarged Diagram Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setEnlargedImage(null)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[92vh] bg-white dark:bg-[#1C1917] rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-[#3D3734] flex flex-col items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-[#2B2623]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#E9EDDF] dark:bg-[#2B2623] flex items-center justify-center text-[#7A8D6E]">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1E293B] dark:text-[#EFEBE5] text-base leading-tight">High-Clarity Diagram Viewer</h3>
                  <p className="text-xs text-[#64748B] dark:text-[#A8A29E]">High-contrast labels & crisp vector text</p>
                </div>
              </div>
              <button
                id="close-enlarged-diagram-btn"
                onClick={() => setEnlargedImage(null)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#2B2623] text-slate-500 dark:text-[#A8A29E] transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full flex-1 overflow-auto bg-white p-4 sm:p-6 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner min-h-[350px]">
              <img 
                src={enlargedImage} 
                alt="Enlarged High Clarity Diagram" 
                className="max-w-full max-h-[70vh] object-contain rounded-xl"
              />
            </div>
            <div className="mt-3 flex items-center justify-between w-full text-xs text-[#64748B] dark:text-[#A8A29E] px-1">
              <span>Press ESC or click anywhere outside to close</span>
              <span className="font-semibold text-[#7A8D6E]">✓ Ultra-clear text enabled</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
