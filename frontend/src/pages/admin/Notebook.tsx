import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Upload, FileText, Trash2, Bot, User, AlertCircle, Bookmark, ChevronLeft, ChevronRight, RotateCw, Mic, Square, Edit2, Check, X } from 'lucide-react';
import api, { getNotes, createNote, deleteNote } from '../../lib/api';
import type { KnowledgeNote } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import VisualInfographic from '../../components/knowledge/VisualInfographic';

interface Document {
    id: string;
    title: string;
    filename: string;
    created_at: string;
    status: string;
    error_message?: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: string[];
    infographic_data?: any;
    image_url?: string;
}

interface ChatSession {
    id: string;
    title: string;
    updated_at: string;
}

interface ExamQuestion {
    question: string;
    options: string[];
    answer: string; // e.g. 'A'
}

export default function Notebook() {
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [selectedNote, setSelectedNote] = useState<KnowledgeNote | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const queryClient = useQueryClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    // ── Exam State ──
    const [examState, setExamState] = useState<'idle' | 'taking' | 'results' | 'feedback'>('idle');
    const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
    const [examFeedback, setExamFeedback] = useState<string>('');
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [examLoading, setExamLoading] = useState(false);
    const [examSaved, setExamSaved] = useState(false);
    const [activeAction, setActiveAction] = useState<string | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    // Fetch Chat Sessions
    const { data: sessions, isLoading: sessionsLoading } = useQuery({
        queryKey: ['chatSessions'],
        queryFn: async () => {
            const res = await api.get('/knowledge/chat/sessions');
            return res.data;
        },
    });

    // Fetch Session History
    const { data: sessionData, isLoading: sessionLoading } = useQuery({
        queryKey: ['chatSession', selectedSessionId],
        queryFn: async () => {
            if (!selectedSessionId) return null;
            const res = await api.get(`/knowledge/chat/sessions/${selectedSessionId}`);
            return res.data;
        },
        enabled: !!selectedSessionId
    });

    // Sync History
    useEffect(() => {
        if (sessionData) {
            const EXAM_PROMPT_PREFIX = 'Generate a 10-question multiple-choice exam';
            const FEEDBACK_PROMPT_PREFIX = 'You are a learning coach';
            const msgs: Message[] = sessionData.messages.map((m: any) => ({
                role: m.role, 
                content: m.content, 
                sources: m.sources,
                infographic_data: m.infographic_data,
                image_url: m.image_url
            }));

            const filtered: Message[] = [];
            for (let i = 0; i < msgs.length; i++) {
                const m = msgs[i];

                if (m.role === 'user' && m.content.startsWith(EXAM_PROMPT_PREFIX)) {
                    // Skip the exam prompt AND the following assistant's raw JSON response
                    if (i + 1 < msgs.length && msgs[i + 1].role === 'assistant') i++;
                    continue;
                }

                if (m.role === 'user' && m.content.startsWith(FEEDBACK_PROMPT_PREFIX)) {
                    // Skip the feedback prompt but KEEP the assistant's feedback report
                    if (i + 1 < msgs.length && msgs[i + 1].role === 'assistant') {
                        i++;
                        filtered.push({
                            role: 'assistant',
                            content: `### 📝 Exam Performance Report\n\n${msgs[i].content}`,
                            sources: msgs[i].sources,
                        });
                    }
                    continue;
                }

                // Still drop raw JSON exam arrays from assistant (if sent without feedback prompt context)
                if (m.role === 'assistant') {
                    try {
                        const clean = m.content.trim();
                        const parsed = JSON.parse(clean.startsWith('```') ? clean.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '') : clean);
                        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.question && parsed[0]?.options) continue;
                    } catch { /* not JSON, keep it */ }
                }

                filtered.push(m);
            }

            // If the session had only exam messages and no feedback, show a placeholder
            if (filtered.length === 0 && msgs.length > 0) {
                filtered.push({
                    role: 'assistant',
                    content: '📝 **Exam session** — No feedback was generated for this session. Take a new exam and tap **🧠 Generate Feedback** or **💾 Save Results** to track your progress.',
                    sources: [],
                });
            }

            setChatHistory(filtered);
        } else if (!selectedSessionId) {
            setChatHistory([]);
        }
    }, [sessionData, selectedSessionId]);



    // Fetch Documents
    const { data: documents, isLoading: docsLoading } = useQuery({
        queryKey: ['documents'],
        queryFn: async () => {
            const res = await api.get('/knowledge/documents');
            return res.data;
        },
    });

    // Upload Mutation
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            await api.post('/knowledge/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            setIsUploading(false);
        },
        onError: () => setIsUploading(false),
    });

    // Podcast Mutation
    const podcastMutation = useMutation({
        mutationFn: async (docIds: string[]) => {
            const res = await api.post('/knowledge/podcast', {
                document_ids: docIds,
                session_id: selectedSessionId
            });
            return res.data;
        },
        onSuccess: (data) => {
            const audioBlock = `[🎧 Listen to Podcast](${data.audio_url})`;
            let transcriptText = "";
            if (data.script && Array.isArray(data.script)) {
                transcriptText = "\n\n***\n\n### 🎙️ Discussion Transcript\n\n";
                data.script.forEach((line: any) => {
                    const speakerName = line.speaker === "A" ? "Host" : "Guest";
                    const icon = line.speaker === "A" ? "🎙️" : "🎧";
                    const cleanText = (line.text || "").replace(/\\n/g, ' ');
                    transcriptText += `> **${icon} ${speakerName}:** ${cleanText}\n>\n`;
                });
            }

            setChatHistory((prev) => [
                ...prev,
                { role: 'assistant', content: `${audioBlock}${transcriptText}` },
            ]);

            if (!selectedSessionId && data.session_id) {
                setSelectedSessionId(data.session_id);
                queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
            }
        },
        onError: (err: any) => {
            const errorMsg = err.response?.data?.detail || err.message || 'An unexpected error occurred.';
            setChatHistory((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: `❌ **Error Generating Podcast:** ${errorMsg}\n\nThere was an issue creating the audio.`
                },
            ]);
        },
        onSettled: () => {
            setActiveAction(null);
        }
    });

    const infographicMutation = useMutation({
        mutationFn: async (docIds: string[]) => {
            const res = await api.post('/knowledge/infographic', {
                document_ids: docIds,
                session_id: selectedSessionId
            });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['chatSession', selectedSessionId] });
            queryClient.invalidateQueries({ queryKey: ['knowledgeNotes'] });
            
            // Add a visual message to the chat history
            setChatHistory(prev => [
                ...prev,
                { 
                    role: 'assistant', 
                    content: 'Generated a premium visual infographic for you.',
                    infographic_data: data.summary_data,
                    image_url: data.image_url
                }
            ]);

            if (!selectedSessionId && data.session_id) {
                setSelectedSessionId(data.session_id);
                queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
            }
        },
        onError: (err: any) => {
            const errorMsg = err.response?.data?.detail || err.message || 'An unexpected error occurred.';
            setChatHistory((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: `❌ **Error Generating Infographic:** ${errorMsg}`
                },
            ]);
        },
        onSettled: () => {
            setActiveAction(null);
        }
    });

    // Chat Mutation
    const chatMutation = useMutation({
        mutationFn: async (msg: string) => {
            const res = await api.post('/knowledge/chat', {
                message: msg,
                session_id: selectedSessionId
            });
            return res.data;
        },
        onSuccess: (data) => {
            const rawAnswer: string = data.answer || '';
            // Try to detect exam JSON
            let examParsed: ExamQuestion[] | null = null;
            try {
                let clean = rawAnswer.trim();
                if (clean.startsWith('```json')) clean = clean.replace(/^```json\n?/, '').replace(/\n?```$/, '');
                else if (clean.startsWith('```')) clean = clean.replace(/^```\n?/, '').replace(/\n?```$/, '');
                const parsed = JSON.parse(clean);
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].question && parsed[0].options && parsed[0].answer) {
                    examParsed = parsed;
                }
            } catch { /* not exam JSON */ }

            if (examParsed) {
                setExamQuestions(examParsed);
                setCurrentQuestionIndex(0);
                setExamAnswers({});
                setExamState('taking');
                // Don't add to chat history — render inline instead
            } else {
                setChatHistory((prev) => [
                    ...prev,
                    { role: 'assistant', content: rawAnswer, sources: data.sources },
                ]);
            }
            if (!selectedSessionId && data.session_id) {
                setSelectedSessionId(data.session_id);
                queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
            }
        },
        onError: (err: any) => {
            const errorMsg = err.response?.data?.detail || err.message || 'An unexpected error occurred.';
            setChatHistory((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: `❌ **Error:** ${errorMsg}\n\nThis usually happens when the AI service is overloaded or the API quota is reached. Please try again in a few moments.`
                },
            ]);
        },
        onSettled: () => {
            setActiveAction(null);
        },
    });

    // Fetch Notes
    const { data: notes, isLoading: notesLoading } = useQuery({
        queryKey: ['knowledgeNotes'],
        queryFn: getNotes,
    });

    // Create Note Mutation
    const createNoteMutation = useMutation({
        mutationFn: async (content: string) => {
            // Clean up content to generate a presentable title
            let cleanTitle = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Extract text from markdown links
            cleanTitle = cleanTitle.replace(/[*#>`]/g, '').trim();           // Remove markdown symbols
            cleanTitle = cleanTitle.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim(); // Remove newlines

            // If it's a podcast, give it a specific title format
            if (cleanTitle.includes('Listen to Podcast') && cleanTitle.includes('Discussion Transcript')) {
                cleanTitle = 'Podcast: ' + cleanTitle.replace('Listen to Podcast', '').replace('Discussion Transcript', '').trim();
            }

            const title = cleanTitle.substring(0, 35) + (cleanTitle.length > 35 ? '...' : '');
            return createNote({ title: title || 'Saved Note', content });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledgeNotes'] });
            // Could add a toast notification here
        },
    });

    // Delete Note Mutation
    const deleteNoteMutation = useMutation({
        mutationFn: deleteNote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledgeNotes'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/knowledge/documents/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
    });

    // Delete Session Mutation
    const deleteSessionMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/knowledge/chat/sessions/${id}`);
        },
        onSuccess: (_, id) => {
            if (selectedSessionId === id) {
                setSelectedSessionId(null);
            }
            queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
        },
    });

    // Rename Session Mutation
    const renameSessionMutation = useMutation({
        mutationFn: async ({ id, newTitle }: { id: string; newTitle: string }) => {
            await api.put(`/knowledge/chat/sessions/${id}`, { title: newTitle });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
        },
    });

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : '';
            const mediaRecorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            recognitionRef.current = mediaRecorder;
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                    console.log(`Audio chunk collected: ${e.data.size} bytes`);
                }
            };
            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                const totalSize = chunks.reduce((acc, chunk) => acc + chunk.size, 0);
                console.log(`Total audio size to upload: ${totalSize} bytes`);

                if (totalSize < 1000) {
                    alert('Recording was too short. Please speak clearly into the microphone.');
                    return;
                }

                const audioBlob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
                const formData = new FormData();
                formData.append('file', audioBlob, 'recording.webm');
                try {
                    const res = await api.post('/knowledge/transcribe', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    const text = res.data?.text?.trim();
                    if (text) {
                        // Automatically send the message for a "direct voice search" experience
                        handleSendMessage(text);
                    } else {
                        alert('No speech detected. Please speak clearly into the microphone.');
                    }
                } catch (err: any) {
                    alert('Transcription failed: ' + (err.response?.data?.detail || err.message));
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error(err);
            alert('Could not access microphone. Please allow microphone permissions.');
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current && isRecording) {
            (recognitionRef.current as MediaRecorder).stop();
            recognitionRef.current = null;
        }
        setIsRecording(false);
    };

    const handleSendMessage = useCallback((overrideMessage?: string | React.MouseEvent | React.KeyboardEvent) => {
        const isString = typeof overrideMessage === 'string';
        const msgToSend = isString ? overrideMessage : message;
        if (!msgToSend.trim()) return;
        setChatHistory((prev) => [...prev, { role: 'user', content: msgToSend }]);
        chatMutation.mutate(msgToSend);
        if (!isString) setMessage('');
    }, [message, chatMutation]);

    const handleSaveNote = useCallback((content: string) => {
        createNoteMutation.mutate(content);
    }, [createNoteMutation]);

    // ── Exam Handlers ──
    const handleStartExam = useCallback(async () => {
        const prompt = `Generate a 10-question multiple-choice exam based strictly on the uploaded documents. Return ONLY a valid JSON array (no markdown, no explanation, no code block wrapper). Each object in the array must have exactly these keys:
- "question": string (the question text)
- "options": array of 4 strings, each starting with "A) ", "B) ", "C) ", or "D) "
- "answer": string (one of "A", "B", "C", or "D")
Example: [{"question":"What is X?","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"B"}]`;
        // Call API directly — don't add raw prompt to chat history
        setExamLoading(true);
        try {
            const res = await api.post('/knowledge/chat', { message: prompt, session_id: selectedSessionId });
            const rawAnswer: string = res.data.answer || '';
            let clean = rawAnswer.trim();
            if (clean.startsWith('```json')) clean = clean.replace(/^```json\n?/, '').replace(/\n?```$/, '');
            else if (clean.startsWith('```')) clean = clean.replace(/^```\n?/, '').replace(/\n?```$/, '');
            const parsed = JSON.parse(clean);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].question) {
                setExamQuestions(parsed);
                setCurrentQuestionIndex(0);
                setExamAnswers({});
                setExamState('taking');
                if (!selectedSessionId && res.data.session_id) {
                    setSelectedSessionId(res.data.session_id);
                    queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
                }
            } else {
                alert('Could not generate exam questions. Please try again.');
            }
        } catch {
            alert('Failed to generate exam. Please ensure a document is uploaded and try again.');
        } finally {
            setExamLoading(false);
        }
    }, [selectedSessionId, queryClient]);

    const handleSelectAnswer = useCallback((questionIndex: number, option: string) => {
        const letter = option.charAt(0); // extract 'A', 'B', 'C', or 'D'
        setExamAnswers(prev => ({ ...prev, [questionIndex]: letter }));
    }, []);

    const handleNextQuestion = useCallback(() => {
        setCurrentQuestionIndex(prev => prev + 1);
    }, []);

    const handleSubmitExam = useCallback(() => {
        setExamState('results');
    }, []);

    const handleGenerateFeedback = useCallback(async (questions: ExamQuestion[], answers: Record<number, string>) => {
        setFeedbackLoading(true);
        const wrongOnes = questions
            .map((q, i) => ({ q, userAnswer: answers[i], correct: q.answer }))
            .filter(item => item.userAnswer !== item.correct)
            .map(item => `Q: ${item.q.question} | Correct: ${item.correct} | User chose: ${item.userAnswer || 'Not answered'}`);
        const score = questions.filter((q, i) => answers[i] === q.answer).length;
        const feedbackPrompt = `You are a learning coach. A student just completed a ${questions.length}-question multiple-choice test and scored ${score}/${questions.length}.

Questions they got wrong:
${wrongOnes.length === 0 ? 'None \u2014 the student got a perfect score!' : wrongOnes.join('\n')}

IMPORTANT: Respond in plain Markdown prose ONLY. Do NOT return JSON, do NOT use code blocks. Use ## headings and bullet points.

Write a performance report with exactly these four sections:

## Overall Assessment
Write 2-3 sentences summarising the score and overall performance.

## Strengths
List topics the student answered correctly as bullet points.

## Weaknesses & Focus Areas
List each topic the student got wrong as a bullet point with a brief explanation of what they should review.

## Study Recommendations
Give 3-4 specific, actionable study tips based on the weak areas.`;
        try {
            const res = await api.post('/knowledge/chat', { message: feedbackPrompt, session_id: selectedSessionId });
            let answerText: string = res.data.answer || '';
            // Defensive: if the AI returned JSON anyway, convert it to Markdown
            try {
                let clean = answerText.trim();
                if (clean.startsWith('{') || clean.startsWith('[')) {
                    const parsed = JSON.parse(clean);
                    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                        answerText = Object.entries(parsed)
                            .map(([key, value]) => `## ${key}\n${Array.isArray(value) ? (value as any[]).map((v: any) => typeof v === 'object' ? `- **${v.topic || ''}**: ${v.explanation || ''}` : `- ${v}`).join('\n') : value}`)
                            .join('\n\n');
                    }
                }
            } catch { /* not JSON, use as-is */ }
            setExamFeedback(answerText);
            setExamState('feedback');
        } catch {
            setExamFeedback('Could not generate feedback. Please try again.');
            setExamState('feedback');
        } finally {
            setFeedbackLoading(false);
        }
    }, [selectedSessionId]);

    const handleRestartExam = useCallback(() => {
        setExamState('idle');
        setExamQuestions([]);
        setCurrentQuestionIndex(0);
        setExamAnswers({});
        setExamFeedback('');
        setExamSaved(false);
    }, []);

    const handleSaveExamResult = useCallback((questions: ExamQuestion[], answers: Record<number, string>, feedback?: string) => {
        const score = questions.filter((q, i) => answers[i] === q.answer).length;
        const total = questions.length;
        const pct = Math.round((score / total) * 100);
        const date = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        const grade = pct >= 70 ? '🟢 Passed' : pct >= 50 ? '🟡 Near Pass' : '🔴 Needs Improvement';
        const correctCount = questions.filter((q, i) => answers[i] === q.answer).length;
        const wrongCount = total - correctCount;

        // Build a clean per-question section
        const questionBlocks = questions.map((q, i) => {
            const userAns = answers[i];
            const isRight = userAns === q.answer;
            const correctOption = q.options.find(o => o.startsWith(q.answer + ')')) || q.answer;
            const userOption = userAns ? q.options.find(o => o.startsWith(userAns + ')')) || userAns : 'Not answered';
            const status = isRight ? '✅ Correct' : '❌ Wrong';
            const answerLine = isRight
                ? `**Answer:** ${correctOption}`
                : `**Your answer:** ${userOption}\n\n**Correct answer:** ${correctOption}`;
            return `### Q${i + 1}: ${q.question}\n\n**Result:** ${status}\n\n${answerLine}`;
        }).join('\n\n---\n\n');

        // Table rows must stay on single \n (no blank line between table rows)
        const tableRows = [
            `| Field | Value |`,
            `|---|---|`,
            `| **Score** | ${score}/${total} (${pct}%) |`,
            `| **Grade** | ${grade} |`,
            `| **Correct** | ✅ ${score} |`,
            `| **Wrong** | ❌ ${wrongCount} |`,
        ].join('\n');

        const parts: string[] = [
            `# 📝 Exam Result — ${date}`,
            tableRows,
            `## ✏️ Answer Breakdown`,
            questionBlocks,
        ];
        if (feedback) {
            parts.push('## 🧠 AI Performance Feedback');
            parts.push(feedback);
        }
        const noteContent = parts.join('\n\n');

        createNoteMutation.mutate(noteContent, {
            onSuccess: () => setExamSaved(true),
        });
    }, [createNoteMutation]);

    const QUICK_ACTIONS = [
        { label: "FAQ", prompt: "Generate a detailed FAQ based on the uploaded documents." },
        { label: "Study Guide", prompt: "Create a comprehensive study guide summarizing the key concepts in the documents." },
        { label: "Briefing", prompt: "Write a high-level briefing document highlighting the most important takeaways." },
        { label: "Quiz", prompt: "Generate a 5-question multiple-choice quiz based on the key facts in these documents, including an answer key at the end." },
        { label: "Flashcards", prompt: "Generate strictly a JSON array of flashcards from these documents. Each object must have exactly two string keys: `term` and `definition`. Do not wrap the JSON in markdown code blocks." },
        { label: "Take Exam", prompt: '__EXAM__' },
        { label: "Podcast", prompt: '__PODCAST__' },
        { label: "Infographic", prompt: '__INFOGRAPHIC__' }
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setIsUploading(true);
            uploadMutation.mutate(e.target.files[0]);
        }
    };

    return (
        <div
            className="animate-fade-in"
            style={{
                display: 'flex',
                height: 'calc(100vh - 10rem)',
                gap: '0.75rem',
                backgroundColor: 'transparent',
                color: 'var(--gpt-text-primary)',
            }}
        >
            {/* ── LEFT COLUMN: Sources ── */}
            <div style={{ width: '18rem', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    backgroundColor: 'var(--gpt-sidebar)',
                    border: '1px solid var(--gpt-border)',
                    borderRadius: '1.25rem',
                    padding: '1.25rem',
                    overflowY: 'auto',
                    boxShadow: '0 4px 20px -5px rgba(0,0,0,0.15)',
                }}>
                    {/* Sources Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--gpt-text-primary)', margin: 0 }}>Sources</h2>
                        <button
                            onClick={() => { setSelectedSessionId(null); setSelectedNote(null); }}
                            style={{
                                padding: '0.35rem 0.75rem', borderRadius: '0.5rem',
                                backgroundColor: 'var(--gpt-button-primary)', color: 'var(--gpt-bg)',
                                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                            }}
                        >+ New</button>
                    </div>

                    {/* Upload Button */}
                    <label style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                        padding: '0.6rem 1rem', borderRadius: '0.75rem', marginBottom: '1rem',
                        border: '1px dashed var(--gpt-border)',
                        backgroundColor: 'var(--gpt-bg-secondary)',
                        color: 'var(--gpt-text-secondary)', fontSize: '0.85rem', fontWeight: 500,
                        cursor: isUploading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                        opacity: isUploading ? 0.6 : 1,
                    }}
                        onMouseEnter={(e) => { if (!isUploading) { e.currentTarget.style.borderColor = 'var(--color-primary-500)'; e.currentTarget.style.color = 'var(--gpt-text-primary)'; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--gpt-border)'; e.currentTarget.style.color = 'var(--gpt-text-secondary)'; }}
                    >
                        <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp" onChange={handleFileUpload} style={{ display: 'none' }} disabled={isUploading} />
                        {isUploading ? <Spinner size="sm" /> : <Upload style={{ width: '0.9rem', height: '0.9rem' }} />}
                        {isUploading ? 'Uploading...' : '+ Add source'}
                    </label>

                    {/* Document list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                        {docsLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}><Spinner /></div>
                        ) : documents?.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--gpt-text-secondary)', fontSize: '0.8rem', padding: '2rem 0.5rem' }}>
                                No sources yet. Upload a document to get started.
                            </div>
                        ) : (
                            documents?.map((doc: Document) => (
                                <DocItem key={doc.id} doc={doc} onDelete={() => deleteMutation.mutate(doc.id)} />
                            ))
                        )}
                    </div>

                    {/* Recent Chats Section */}
                    <div style={{ borderTop: '1px solid var(--gpt-border)', paddingTop: '1rem', marginTop: '1rem' }}>
                        <h3 style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--gpt-text-secondary)', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Chats</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {sessionsLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem' }}><Spinner /></div>
                            ) : sessions?.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--gpt-text-secondary)', fontSize: '0.8rem' }}>No recent chats.</div>
                            ) : (
                                sessions?.map((session: ChatSession) => (
                                    <SessionItem
                                        key={session.id} session={session} isActive={selectedSessionId === session.id}
                                        onClick={() => { setSelectedSessionId(session.id); setSelectedNote(null); }}
                                        onDelete={(e) => { e.stopPropagation(); deleteSessionMutation.mutate(session.id); }}
                                        onRename={(id, newTitle) => renameSessionMutation.mutate({ id, newTitle })}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CENTER COLUMN: Chat ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    backgroundColor: 'var(--gpt-bg)',
                    border: '1px solid var(--gpt-border)',
                    borderRadius: '1.25rem', overflow: 'hidden',
                    boxShadow: '0 8px 30px -10px rgba(0,0,0,0.15)',
                }}>
                    {/* Chat header */}
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gpt-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h2 style={{ fontWeight: 600, fontSize: '1rem', margin: 0, color: 'var(--gpt-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {examState !== 'idle' ? (
                                <>
                                    <span>📝</span>
                                    <span>{examState === 'taking' ? `Exam — Q${currentQuestionIndex + 1}/${examQuestions.length}` : examState === 'results' ? 'Exam Results' : 'Performance Report'}</span>
                                </>
                            ) : 'Chat'}
                        </h2>
                        {examState !== 'idle' && (
                            <button
                                onClick={handleRestartExam}
                                title="Exit exam and return to chat"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                                    padding: '0.4rem 0.9rem', borderRadius: '0.6rem',
                                    border: '1px solid var(--gpt-border)',
                                    backgroundColor: 'var(--gpt-bg-secondary)',
                                    color: 'var(--gpt-text-secondary)',
                                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--gpt-border)'; e.currentTarget.style.color = 'var(--gpt-text-secondary)'; }}
                            >
                                ✕ Close Exam
                            </button>
                        )}
                    </div>


                    {/* Message viewer or Note reader */}
                    {selectedNote ? (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--gpt-bg)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--gpt-border)', paddingBottom: '1rem' }}>
                                <div>
                                    <h1 style={{ margin: '0 0 0.5rem 0', fontWeight: 600, fontSize: '1.5rem', color: 'var(--gpt-text-primary)' }}>
                                        {selectedNote.title.includes('Listen to Podcast') ? 'Podcast Session' : selectedNote.title}
                                    </h1>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--gpt-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Bookmark style={{ width: '0.8rem', height: '0.8rem', color: 'var(--color-primary-500)' }} />
                                        Saved on {new Date(selectedNote.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedNote(null)}
                                    style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', backgroundColor: 'var(--gpt-bg-secondary)', border: '1px solid var(--gpt-border)', color: 'var(--gpt-text-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
                                >Close Note</button>
                            </div>
                            <div style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--gpt-text-primary)', whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: '800px' }}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                    p: ({ node, ...props }) => <p style={{ marginBottom: '0.75rem', marginTop: 0 }} {...props} />,
                                    ul: ({ node, ...props }) => <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '0.75rem' }} {...props} />,
                                    ol: ({ node, ...props }) => <ol style={{ listStyleType: 'decimal', paddingLeft: '1.5rem', marginBottom: '0.75rem' }} {...props} />,
                                    li: ({ node, ...props }) => <li style={{ marginBottom: '0.25rem' }} {...props} />,
                                    h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.4rem', fontWeight: 600, margin: '1rem 0 0.5rem' }} {...props} />,
                                    h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '1rem 0 0.5rem' }} {...props} />,
                                    h3: ({ node, ...props }) => <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0.75rem 0 0.5rem' }} {...props} />,
                                    strong: ({ node, ...props }) => <strong style={{ fontWeight: 700 }} {...props} />,
                                    a: ({ node, ...props }) => <a style={{ color: 'var(--gpt-button-primary)', textDecoration: 'underline' }} {...props} />,
                                    blockquote: ({ node, ...props }) => <blockquote style={{ borderLeft: '3px solid var(--gpt-border)', margin: '1rem 0', paddingLeft: '1rem', color: 'var(--gpt-text-secondary)', fontStyle: 'italic' }} {...props} />,
                                }}>
                                    {selectedNote.content.split('\\n').join('\n')}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ) : examState !== 'idle' ? (
                        /* ── EXAM UI: 3 phases ── */
                        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* ── Phase 1: Exam Taking ── */}
                            {examState === 'taking' && examQuestions.length > 0 && (() => {
                                const q = examQuestions[currentQuestionIndex];
                                const totalQ = examQuestions.length;
                                const selected = examAnswers[currentQuestionIndex];
                                const isLast = currentQuestionIndex === totalQ - 1;
                                return (
                                    <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
                                        {/* Progress bar */}
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--gpt-text-secondary)', marginBottom: '0.5rem' }}>
                                                <span>Question {currentQuestionIndex + 1} of {totalQ}</span>
                                                <span>{Object.keys(examAnswers).length} answered</span>
                                            </div>
                                            <div style={{ height: '4px', backgroundColor: 'var(--gpt-border)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${((currentQuestionIndex + 1) / totalQ) * 100}%`, backgroundColor: 'var(--gpt-button-primary)', borderRadius: '2px', transition: 'width 0.3s' }} />
                                            </div>
                                        </div>

                                        {/* Question */}
                                        <div style={{ backgroundColor: 'var(--gpt-bg-secondary)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.25rem', border: '1px solid var(--gpt-border)' }}>
                                            <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--gpt-text-primary)', lineHeight: 1.6 }}>{q.question}</p>
                                        </div>

                                        {/* Options */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                                            {q.options.map((opt) => {
                                                const letter = opt.charAt(0);
                                                const isSelected = selected === letter;
                                                return (
                                                    <button key={opt} onClick={() => handleSelectAnswer(currentQuestionIndex, opt)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                            padding: '0.875rem 1.25rem', borderRadius: '0.875rem',
                                                            border: `2px solid ${isSelected ? 'var(--color-primary-500)' : 'var(--gpt-border)'}`,
                                                            backgroundColor: isSelected ? 'rgba(14,165,233,0.1)' : 'var(--gpt-bg-secondary)',
                                                            color: 'var(--gpt-text-primary)', fontSize: '0.9rem',
                                                            cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                                                        }}
                                                    >
                                                        <span style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.8rem', fontWeight: 700, backgroundColor: isSelected ? 'var(--color-primary-500)' : 'var(--gpt-border)', color: isSelected ? 'white' : 'var(--gpt-text-secondary)' }}>{letter}</span>
                                                        <span>{opt.substring(3)}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Navigation */}
                                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                            {currentQuestionIndex > 0 && (
                                                <button onClick={() => setCurrentQuestionIndex(i => i - 1)} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: '1px solid var(--gpt-border)', backgroundColor: 'var(--gpt-bg-secondary)', color: 'var(--gpt-text-primary)', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}>← Back</button>
                                            )}
                                            {!isLast && (
                                                <button onClick={handleNextQuestion} disabled={!selected}
                                                    style={{ padding: '0.75rem 1.75rem', borderRadius: '0.75rem', border: 'none', backgroundColor: selected ? '#3b82f6' : 'var(--gpt-border)', color: selected ? 'white' : 'var(--gpt-text-secondary)', cursor: selected ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.9rem', opacity: selected ? 1 : 0.5 }}
                                                >Next →</button>
                                            )}
                                            {isLast && (
                                                <button onClick={handleSubmitExam} disabled={!selected}
                                                    style={{ padding: '0.75rem 1.75rem', borderRadius: '0.75rem', border: 'none', backgroundColor: selected ? '#10b981' : 'var(--gpt-border)', color: selected ? 'white' : 'var(--gpt-text-secondary)', cursor: selected ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.9rem', opacity: selected ? 1 : 0.5 }}
                                                >Submit Exam ✓</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* ── Phase 2: Results ── */}
                            {examState === 'results' && (() => {
                                const total = examQuestions.length;
                                const score = examQuestions.filter((q, i) => examAnswers[i] === q.answer).length;
                                const pct = Math.round((score / total) * 100);
                                const color = pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
                                return (
                                    <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
                                        {/* Score Card */}
                                        <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'var(--gpt-bg-secondary)', borderRadius: '1.25rem', border: `2px solid ${color}`, marginBottom: '1.5rem' }}>
                                            <div style={{ fontSize: '3.5rem', fontWeight: 800, color }}>{score}/{total}</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color, marginBottom: '0.5rem' }}>{pct}%</div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--gpt-text-secondary)' }}>{pct >= 70 ? '🎉 Great job! You passed.' : pct >= 50 ? '📚 Keep studying \u2014 almost there!' : '💪 More practice needed. You\u0027ve got this!'}</div>
                                        </div>

                                        {/* Answer Review */}
                                        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--gpt-text-primary)' }}>Answer Review</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                            {examQuestions.map((q, i) => {
                                                const userAns = examAnswers[i];
                                                const correct = q.answer;
                                                const isRight = userAns === correct;
                                                const correctOption = q.options.find(o => o.startsWith(correct + ')'));
                                                const userOption = userAns ? q.options.find(o => o.startsWith(userAns + ')')) : null;
                                                return (
                                                    <div key={i} style={{ padding: '1rem', borderRadius: '0.875rem', border: `1px solid ${isRight ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, backgroundColor: isRight ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                                            <span>{isRight ? '✅' : '❌'}</span>
                                                            <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem', color: 'var(--gpt-text-primary)' }}>Q{i + 1}: {q.question}</p>
                                                        </div>
                                                        <div style={{ paddingLeft: '1.5rem', fontSize: '0.8rem', color: 'var(--gpt-text-secondary)' }}>
                                                            <div style={{ color: '#10b981' }}>✓ Correct: {correctOption}</div>
                                                            {!isRight && <div style={{ color: '#ef4444' }}>✗ Your answer: {userOption || 'Not answered'}</div>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <button onClick={handleRestartExam} style={{ flex: 1, minWidth: '120px', padding: '0.875rem', borderRadius: '0.875rem', border: '1px solid var(--gpt-border)', backgroundColor: 'var(--gpt-bg-secondary)', color: 'var(--gpt-text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>🔄 Retake</button>
                                            <button
                                                onClick={() => handleSaveExamResult(examQuestions, examAnswers)}
                                                disabled={examSaved || createNoteMutation.isPending}
                                                style={{ flex: 1, minWidth: '120px', padding: '0.875rem', borderRadius: '0.875rem', border: 'none', backgroundColor: examSaved ? '#10b981' : '#f59e0b', color: 'white', cursor: examSaved || createNoteMutation.isPending ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.875rem', opacity: createNoteMutation.isPending ? 0.7 : 1 }}
                                            >{examSaved ? '✓ Saved!' : createNoteMutation.isPending ? 'Saving...' : '💾 Save Results'}</button>
                                            <button onClick={() => handleGenerateFeedback(examQuestions, examAnswers)} disabled={feedbackLoading}
                                                style={{ flex: 1, minWidth: '120px', padding: '0.875rem', borderRadius: '0.875rem', border: 'none', backgroundColor: feedbackLoading ? 'var(--gpt-border)' : '#6366f1', color: 'white', cursor: feedbackLoading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.875rem', opacity: feedbackLoading ? 0.7 : 1 }}
                                            >{feedbackLoading ? 'Generating...' : '🧠 Generate Feedback'}</button>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* ── Phase 3: AI Feedback ── */}
                            {examState === 'feedback' && (
                                <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                        <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem', color: 'var(--gpt-text-primary)' }}>🧠 Performance Report</h2>
                                        <button onClick={handleRestartExam} style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--gpt-border)', backgroundColor: 'var(--gpt-bg-secondary)', color: 'var(--gpt-text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>Start Over</button>
                                    </div>
                                    <div style={{ padding: '1.5rem', backgroundColor: 'var(--gpt-bg-secondary)', borderRadius: '1.25rem', border: '1px solid var(--gpt-border)', fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--gpt-text-primary)' }}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                            p: ({ node, ...props }) => <p style={{ marginBottom: '0.75rem', marginTop: 0 }} {...props} />,
                                            ul: ({ node, ...props }) => <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '0.75rem' }} {...props} />,
                                            li: ({ node, ...props }) => <li style={{ marginBottom: '0.25rem' }} {...props} />,
                                            h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '1rem 0 0.5rem', color: 'var(--gpt-text-primary)' }} {...props} />,
                                            h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '1rem 0 0.5rem', color: 'var(--color-primary-500)' }} {...props} />,
                                            strong: ({ node, ...props }) => <strong style={{ fontWeight: 700 }} {...props} />,
                                        }}>{examFeedback}</ReactMarkdown>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                        <button
                                            onClick={() => handleSaveExamResult(examQuestions, examAnswers, examFeedback)}
                                            disabled={examSaved || createNoteMutation.isPending}
                                            style={{ flex: 1, padding: '0.875rem', borderRadius: '0.875rem', border: 'none', backgroundColor: examSaved ? '#10b981' : '#f59e0b', color: 'white', cursor: examSaved || createNoteMutation.isPending ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
                                        >{examSaved ? '✓ Saved to Notes!' : createNoteMutation.isPending ? 'Saving...' : '💾 Save Full Report'}</button>
                                        <button onClick={() => { handleRestartExam(); }} style={{ flex: 1, padding: '0.875rem', borderRadius: '0.875rem', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>📝 Take Another Exam</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Messages Feed */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', scrollBehavior: 'smooth' }}>
                                {chatHistory.length === 0 && !sessionLoading && (
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--gpt-text-secondary)', height: '100%', minHeight: '200px' }}>
                                        <Bot style={{ width: '3rem', height: '3rem', marginBottom: '1rem', opacity: 0.25 }} />
                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Add a source and start chatting.</p>
                                    </div>
                                )}
                                {sessionLoading && (
                                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}><Spinner /></div>
                                )}
                                {!sessionLoading && chatHistory.map((msg, idx) => (
                                    <ChatMessage key={idx} msg={msg} onSave={() => handleSaveNote(msg.content)} />
                                ))}
                                {chatMutation.isPending && <TypingIndicator />}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Bar */}
                            <div style={{ borderTop: '1px solid var(--gpt-border-light)', padding: '1.25rem', backgroundColor: 'var(--gpt-bg)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                    placeholder="Start typing..."
                                    style={{
                                        flex: 1, backgroundColor: 'var(--gpt-input-bg)', border: '1px solid var(--gpt-input-border)',
                                        borderRadius: '1rem', padding: '0.75rem 1.25rem', color: 'var(--gpt-text-primary)',
                                        fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s',
                                    }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary-500)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.15)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--gpt-input-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    style={{
                                        flexShrink: 0, width: '3rem', height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        borderRadius: '0.875rem', border: '1px solid var(--gpt-border)',
                                        backgroundColor: isRecording ? 'rgba(239,68,68,0.1)' : 'var(--gpt-bg-secondary)',
                                        color: isRecording ? '#ef4444' : 'var(--gpt-text-secondary)', cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    title={isRecording ? 'Stop Recording' : 'Start Voice Input'}
                                >
                                    {isRecording ? <Square style={{ width: '1.1rem', height: '1.1rem' }} /> : <Mic style={{ width: '1.1rem', height: '1.1rem' }} />}
                                </button>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={chatMutation.isPending || !message.trim()}
                                    style={{
                                        flexShrink: 0, width: '3rem', height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        borderRadius: '0.875rem', border: 'none',
                                        backgroundColor: chatMutation.isPending || !message.trim() ? 'var(--gpt-border)' : 'var(--gpt-button-primary)',
                                        color: 'var(--gpt-bg)', cursor: chatMutation.isPending || !message.trim() ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    }}
                                >
                                    <Send style={{ width: '1.25rem', height: '1.25rem' }} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── RIGHT COLUMN: Studio ── */}
            <div style={{ width: '22rem', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    backgroundColor: 'var(--gpt-sidebar)',
                    border: '1px solid var(--gpt-border)',
                    borderRadius: '1.25rem', padding: '1.25rem', overflowY: 'auto',
                    boxShadow: '0 4px 20px -5px rgba(0,0,0,0.15)',
                    gap: '1.25rem',
                }}>
                    {/* Studio Header */}
                    <h2 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--gpt-text-primary)', margin: 0 }}>Studio</h2>

                    {/* Quick Actions Grid */}
                    <style>{`
                        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                        @keyframes studio-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); } 50% { box-shadow: 0 0 0 6px rgba(99,102,241,0); } }
                    `}</style>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {QUICK_ACTIONS.map(action => {
                            const icons: Record<string, string> = {
                                'FAQ': '💬', 'Study Guide': '📖', 'Briefing': '📋', 'Quiz': '✅', 'Flashcards': '🃏', 'Take Exam': '📝', 'Podcast': '🎧', 'Infographic': '📊'
                            };
                            const colors: Record<string, string> = {
                                'FAQ': 'rgba(99,102,241,0.15)', 'Study Guide': 'rgba(16,185,129,0.15)',
                                'Briefing': 'rgba(245,158,11,0.15)', 'Quiz': 'rgba(239,68,68,0.15)',
                                'Flashcards': 'rgba(14,165,233,0.15)', 'Take Exam': 'rgba(168,85,247,0.15)', 'Podcast': 'rgba(236,72,153,0.15)', 'Infographic': 'rgba(20,184,166,0.15)'
                            };
                            const accentColors: Record<string, string> = {
                                'FAQ': '#6366f1', 'Study Guide': '#10b981', 'Briefing': '#f59e0b',
                                'Quiz': '#ef4444', 'Flashcards': '#0ea5e9', 'Take Exam': '#a855f7', 'Podcast': '#ec4899', 'Infographic': '#14b8a6'
                            };
                            const isExam = action.prompt === '__EXAM__';
                            const isThisActive = isExam ? examLoading : activeAction === action.label;
                            const isAnyLoading = chatMutation.isPending || examLoading;
                            const isDisabled = isAnyLoading;
                            const accent = accentColors[action.label] || '#6366f1';
                            return (
                                <button
                                    key={action.label}
                                    onClick={() => {
                                        if (isExam) {
                                            handleStartExam();
                                        } else if (action.prompt === '__PODCAST__') {
                                            if (!documents || documents.length === 0) {
                                                alert("Please upload at least one document first to generate a podcast.");
                                                return;
                                            }
                                            setActiveAction(action.label);
                                            setChatHistory(prev => [...prev, { role: 'user', content: '🎙️ *Generating Deep-Dive Podcast from uploaded documents...*' }]);
                                            const docIds = documents.map((d: Document) => d.id);
                                            podcastMutation.mutate(docIds);
                                        } else if (action.prompt === '__INFOGRAPHIC__') {
                                            if (!documents || documents.length === 0) {
                                                alert("Please upload at least one document first to generate an infographic.");
                                                return;
                                            }
                                            setActiveAction(action.label);
                                            setChatHistory(prev => [...prev, { role: 'user', content: '📊 *Generating a Visual Infographic from uploaded documents...*' }]);
                                            const docIds = documents.map((d: Document) => d.id);
                                            infographicMutation.mutate(docIds);
                                        } else {
                                            setActiveAction(action.label);
                                            handleSendMessage(action.prompt);
                                        }
                                    }}
                                    disabled={isDisabled}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem',
                                        padding: '0.875rem', borderRadius: '0.875rem',
                                        backgroundColor: isThisActive ? colors[action.label] || 'var(--gpt-bg-secondary)' : colors[action.label] || 'var(--gpt-bg-secondary)',
                                        border: `1px solid ${isThisActive ? accent : 'var(--gpt-border)'}`,
                                        color: 'var(--gpt-text-primary)', fontSize: '0.8rem', fontWeight: 600,
                                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s', textAlign: 'left',
                                        opacity: isAnyLoading && !isThisActive ? 0.4 : 1,
                                        animation: isThisActive ? 'studio-pulse 1.2s ease-in-out infinite' : 'none',
                                        position: 'relative', overflow: 'hidden',
                                    }}
                                    onMouseEnter={(e) => { if (!isDisabled) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 14px ${accent}40`; } }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    {isThisActive ? (
                                        <>
                                            <span style={{ width: '1.25rem', height: '1.25rem', border: `2px solid ${accent}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                                            <span style={{ color: accent }}>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span style={{ fontSize: '1.25rem' }}>{icons[action.label] || '✨'}</span>
                                            <span>{action.label}</span>
                                        </>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid var(--gpt-border)', paddingTop: '0.75rem' }}>
                        <h3 style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--gpt-text-secondary)', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Bookmark style={{ width: '0.8rem', height: '0.8rem', color: 'var(--color-primary-500)' }} />
                            Saved Notes
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {notesLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}><Spinner /></div>
                            ) : notes?.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--gpt-text-secondary)', fontSize: '0.8rem', padding: '1rem 0' }}>No saved notes yet.</div>
                            ) : (
                                notes?.map((note: KnowledgeNote) => (
                                    <NoteItem
                                        key={note.id} note={note}
                                        onClick={() => setSelectedNote(note)}
                                        onDelete={(e) => { e.stopPropagation(); deleteNoteMutation.mutate(note.id); }}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Sub-components ─────────────────────────────── */


const NoteItem = memo(function NoteItem({ note, onClick, onDelete }: { note: KnowledgeNote; onClick?: () => void; onDelete: (e: React.MouseEvent) => void }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.875rem',
                borderRadius: '0.875rem',
                backgroundColor: hovered ? 'var(--gpt-hover)' : 'transparent',
                transition: 'all 0.2s',
                cursor: onClick ? 'pointer' : 'default',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingRight: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--gpt-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                    {note.title.includes('Listen to Podcast') ? 'Podcast Session' : note.title}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--gpt-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {new Date(note.created_at).toLocaleDateString()}
                </span>
            </div>
            {hovered && (
                <button
                    onClick={onDelete}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gpt-text-secondary)'
                    }}
                    title="Delete Note"
                >
                    <Trash2 style={{ width: '0.9rem', height: '0.9rem' }} />
                </button>
            )}
        </div>
    );
});

const SessionItem = memo(function SessionItem({ session, isActive, onClick, onDelete, onRename }: { session: ChatSession; isActive: boolean; onClick: () => void; onDelete: (e: React.MouseEvent) => void; onRename: (id: string, newTitle: string) => void }) {
    const [hovered, setHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(session.title);

    // Auto-focus input when editing
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (editValue.trim() && editValue.trim() !== session.title) {
            onRename(session.id, editValue.trim());
        } else {
            setEditValue(session.title); // Reset if blank
        }
        setIsEditing(false);
    };

    return (
        <div
            onClick={!isEditing ? onClick : undefined}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.875rem',
                borderRadius: '0.875rem',
                backgroundColor: isActive ? 'var(--gpt-hover)' : hovered ? 'var(--gpt-hover)' : 'transparent',
                transition: 'all 0.2s',
                cursor: !isEditing ? 'pointer' : 'default',
            }}
        >
            {isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '0.5rem' }}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') {
                                setEditValue(session.title);
                                setIsEditing(false);
                            }
                        }}
                        style={{
                            flex: 1, backgroundColor: 'var(--gpt-bg)', color: 'var(--gpt-text-primary)', border: '1px solid var(--color-primary-500)',
                            borderRadius: '0.5rem', padding: '0.3rem 0.6rem', fontSize: '0.85rem', outline: 'none', width: '100%',
                        }}
                    />
                    <button onClick={(e) => { e.stopPropagation(); handleSave(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: '0.2rem' }}>
                        <Check style={{ width: '0.9rem', height: '0.9rem' }} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditValue(session.title); setIsEditing(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gpt-text-secondary)', padding: '0.2rem' }}>
                        <X style={{ width: '0.9rem', height: '0.9rem' }} />
                    </button>
                </div>
            ) : (
                <>
                    <span style={{ fontSize: '0.85rem', color: 'var(--gpt-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isActive ? 600 : 400 }}>
                        {session.title}
                    </span>
                    {(hovered || isActive) && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gpt-text-secondary)'
                                }}
                                title="Rename Chat"
                            >
                                <Edit2 style={{ width: '0.8rem', height: '0.8rem' }} />
                            </button>
                            <button
                                onClick={onDelete}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gpt-text-secondary)'
                                }}
                                title="Delete Chat"
                            >
                                <Trash2 style={{ width: '0.9rem', height: '0.9rem' }} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
});

const DocItem = memo(function DocItem({ doc, onDelete }: { doc: Document; onDelete: () => void }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.875rem',
                borderRadius: '0.875rem',
                backgroundColor: hovered ? 'var(--gpt-hover)' : 'transparent',
                transition: 'all 0.2s',
                cursor: 'pointer',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', flex: 1 }}>
                {doc.status === 'error' ? (
                    <AlertCircle style={{ width: '1rem', height: '1rem', color: '#ef4444', flexShrink: 0 }} />
                ) : doc.status === 'processing' ? (
                    <Spinner size="sm" />
                ) : (
                    <FileText style={{ width: '1rem', height: '1rem', color: '#3b82f6', flexShrink: 0 }} />
                )}
                <span
                    title={doc.status === 'error' ? `Error: ${doc.error_message || 'Could not extract text'}` : doc.title}
                    style={{
                        fontSize: '0.85rem',
                        color: doc.status === 'error' ? '#ef4444' : 'var(--gpt-text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: doc.status === 'error' ? 500 : 400,
                    }}
                >
                    {doc.title}
                </span>
            </div>
            <button
                onClick={onDelete}
                style={{
                    flexShrink: 0,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--gpt-text-secondary)',
                    opacity: hovered ? 1 : 0,
                    transition: 'opacity 0.15s, color 0.15s',
                    padding: '0.1rem',
                    display: 'flex',
                    alignItems: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--gpt-text-secondary)')}
            >
                <Trash2 style={{ width: '0.9rem', height: '0.9rem' }} />
            </button>
        </div>
    );
});

interface Flashcard {
    term: string;
    definition: string;
}

const FlashcardStack = memo(function FlashcardStack({ cards }: { cards: Flashcard[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [scores, setScores] = useState<{ [key: number]: 'got_it' | 'missed_it' }>({});

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => Math.min(prev + 1, cards.length - 1));
        }, 150);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => Math.max(prev - 1, 0));
        }, 150);
    };

    const handleScore = (status: 'got_it' | 'missed_it') => {
        setScores(prev => ({ ...prev, [currentIndex]: status }));
        if (currentIndex < cards.length - 1) {
            handleNext();
        }
    };

    const resetDeck = () => {
        setCurrentIndex(0);
        setIsFlipped(false);
        setScores({});
    };

    const currentCard = cards[currentIndex];

    // Calculate progress
    const gotItCount = Object.values(scores).filter(s => s === 'got_it').length;
    const missedItCount = Object.values(scores).filter(s => s === 'missed_it').length;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            width: '100%', maxWidth: '600px', margin: '0 auto',
            backgroundColor: '#1E2322', // Darker background similar to NotebookLM
            borderRadius: '1.25rem', padding: '1.5rem 1rem 1.25rem',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
            {/* Subtle Gradient Background like NotebookLM */}
            <div style={{
                position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                background: 'radial-gradient(circle at 10% 20%, rgba(30,50,60,0.5) 0%, rgba(0,0,0,0) 40%), radial-gradient(circle at 90% 80%, rgba(20,50,40,0.5) 0%, rgba(0,0,0,0) 40%)',
                zIndex: 0, pointerEvents: 'none'
            }} />

            {/* Navigation & Card Area */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', gap: '0.75rem', zIndex: 1, 
                minHeight: '280px'
            }}>
                {/* Prev Button */}
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    style={{
                        background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%',
                        width: '2.5rem', height: '2.5rem', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: currentIndex === 0 ? 'rgba(255,255,255,0.2)' : 'var(--color-primary-400)',
                        cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s', zIndex: 10,
                        flexShrink: 0
                    }}
                >
                    <ChevronLeft style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>

                {/* 3D Flipping Card */}
                <div
                    style={{
                        flex: 1, maxWidth: '400px', 
                        aspectRatio: '1/1',
                        minHeight: '250px',
                        perspective: '1000px', cursor: 'pointer'
                    }}
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <motion.div
                        initial={false}
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                        style={{
                            width: '100%', height: '100%',
                            position: 'relative',
                            transformStyle: 'preserve-3d'
                        }}
                    >
                        {/* Front (Term) */}
                        <div style={{
                            position: 'absolute', width: '100%', height: '100%',
                            backfaceVisibility: 'hidden',
                            backgroundColor: '#2A2D2C', // Card color
                            borderRadius: '1.5rem',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            padding: '3rem', textAlign: 'center',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <h3 style={{
                                color: 'white', 
                                fontSize: 'clamp(1rem, 4vw, 1.75rem)', 
                                fontWeight: 700, lineHeight: 1.25, margin: 0,
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                                maxWidth: '100%'
                            }}>
                                {currentCard.term}
                            </h3>
                            <button style={{
                                position: 'absolute', bottom: '1.5rem',
                                background: 'none', border: 'none',
                                color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', fontWeight: 500,
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                <RotateCw style={{ width: '1rem', height: '1rem' }} />
                                Click to reveal answer
                            </button>
                        </div>

                        {/* Back (Definition) */}
                        <div style={{
                            position: 'absolute', width: '100%', height: '100%',
                            backfaceVisibility: 'hidden',
                            backgroundColor: '#1E2322', // Slightly darker back
                            borderRadius: '1.5rem',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            padding: '1.5rem', textAlign: 'center',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            transform: 'rotateY(180deg)'
                        }}>
                            <p style={{
                                color: 'rgba(255,255,255,0.95)', 
                                fontSize: 'clamp(0.85rem, 3.5vw, 1.1rem)', 
                                lineHeight: 1.5, margin: 0,
                                overflowY: 'auto', maxHeight: '100%', paddingRight: '0.5rem',
                                scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent',
                                overflowWrap: 'anywhere'
                            }}>
                                {currentCard.definition}
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Next Button */}
                <button
                    onClick={handleNext}
                    disabled={currentIndex === cards.length - 1}
                    style={{
                        background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%',
                        width: '2.5rem', height: '2.5rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: currentIndex === cards.length - 1 ? 'rgba(255,255,255,0.2)' : 'var(--color-primary-400)',
                        cursor: currentIndex === cards.length - 1 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s', zIndex: 10,
                        flexShrink: 0
                    }}
                >
                    <ChevronRight style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
            </div>

            {/* Scoring Controls */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                marginTop: '1rem', zIndex: 1, width: '100%'
            }}>
                <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '1rem' }}>{missedItCount}</span>

                <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    justifyContent: 'center', 
                    gap: '0.5rem', 
                    width: '100%' 
                }}>
                    <button
                        onClick={() => handleScore('missed_it')}
                        style={{
                            flex: '1 1 auto',
                            minWidth: '80px',
                            padding: '0.4rem 1rem', 
                            borderRadius: '2rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#ef4444', fontWeight: 600, 
                            fontSize: '0.85rem', 
                            cursor: 'pointer',
                            opacity: isFlipped ? 1 : 0.5,
                            pointerEvents: isFlipped ? 'auto' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        Missed
                    </button>
                    <button
                        onClick={() => handleScore('got_it')}
                        style={{
                            flex: '1 1 auto',
                            minWidth: '80px',
                            padding: '0.4rem 1rem', 
                            borderRadius: '2rem',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            color: '#10b981', fontWeight: 600, 
                            fontSize: '0.85rem', 
                            cursor: 'pointer',
                            opacity: isFlipped ? 1 : 0.5,
                            pointerEvents: isFlipped ? 'auto' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        Got it
                    </button>
                </div>

                <span style={{ color: '#10b981', fontWeight: 600, fontSize: '1rem' }}>{gotItCount}</span>
            </div>

            {/* Progress Bar & Footer */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                width: '100%', marginTop: '1.5rem', zIndex: 1,
                padding: '0 0.25rem'
            }}>
                <button onClick={resetDeck} title="Reset Deck" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                    <RotateCw style={{ width: '0.9rem', height: '0.9rem' }} />
                </button>

                <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', height: '3px', borderRadius: '1.5px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${((currentIndex + 1) / cards.length) * 100}%`,
                        backgroundColor: 'var(--color-primary-500)',
                        height: '100%',
                        transition: 'width 0.3s ease-out'
                    }} />
                </div>

                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', fontWeight: 500 }}>
                    {currentIndex + 1} / {cards.length}
                </span>
            </div>
        </div>
    );
});

const ChatMessage = memo(function ChatMessage({ msg, onSave }: { msg: Message; onSave?: () => void }) {
    const isUser = msg.role === 'user';

    // Check if the message is a Flashcard JSON Array
    let flashcards: Flashcard[] | null = null;
    if (!isUser) {
        try {
            // Sometimes it comes wrapped in markdown json block
            let cleanContent = msg.content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/```json\n/g, '').replace(/\n```/g, '');
            } else if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/```\n/g, '').replace(/\n```/g, '');
            }

            const parsed = JSON.parse(cleanContent);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].term && parsed[0].definition) {
                flashcards = parsed;
            }
        } catch (e) {
            // Not JSON flashcards, fallback to markdown
        }
    }

    return (
        <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            justifyContent: isUser ? 'flex-end' : 'flex-start', 
            alignItems: 'flex-start',
            width: '100%'
        }}>
            {!isUser && (
                <div
                    style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        backgroundColor: 'var(--gpt-bg-secondary)',
                        border: '1px solid var(--gpt-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <Bot style={{ width: '1.1rem', height: '1.1rem', color: 'var(--gpt-button-primary)' }} />
                </div>
            )}
            <div
                style={{
                    maxWidth: flashcards ? '100%' : '85%',
                    width: flashcards ? '100%' : 'auto',
                    borderRadius: isUser ? '1.25rem 1.25rem 0.25rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.25rem',
                    padding: flashcards ? '0' : '1rem 1.25rem',
                    backgroundColor: flashcards ? 'transparent' : (isUser ? 'var(--gpt-message-user-bg)' : 'var(--gpt-message-bg)'),
                    color: isUser ? 'var(--gpt-message-user-text)' : 'var(--gpt-text-primary)',
                    boxShadow: flashcards ? 'none' : (isUser ? '0 4px 15px -3px rgba(0,0,0,0.1)' : '0 2px 10px -2px rgba(0,0,0,0.05)'),
                    border: flashcards ? 'none' : (isUser ? 'none' : '1px solid var(--gpt-border-light)'),
                    fontSize: '0.925rem',
                    lineHeight: 1.6,
                    whiteSpace: isUser ? 'pre-wrap' : 'normal',
                    wordBreak: 'break-word',
                }}
            >
                {isUser ? (
                    msg.content
                ) : msg.infographic_data ? (
                    <VisualInfographic data={msg.infographic_data} imageUrl={msg.image_url || ''} />
                ) : flashcards ? (
                    <FlashcardStack cards={flashcards} />
                ) : (
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({ node, ...props }) => <p style={{ marginBottom: '0.75rem', marginTop: 0 }} {...props} />,
                            ul: ({ node, ...props }) => <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '0.75rem' }} {...props} />,
                            ol: ({ node, ...props }) => <ol style={{ listStyleType: 'decimal', paddingLeft: '1.5rem', marginBottom: '0.75rem' }} {...props} />,
                            li: ({ node, ...props }) => <li style={{ marginBottom: '0.25rem' }} {...props} />,
                            h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.4rem', fontWeight: 600, margin: '1rem 0 0.5rem' }} {...props} />,
                            h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '1rem 0 0.5rem' }} {...props} />,
                            h3: ({ node, ...props }) => <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0.75rem 0 0.5rem' }} {...props} />,
                            strong: ({ node, ...props }) => <strong style={{ fontWeight: 700 }} {...props} />,
                            a: ({ node, ...props }) => {
                                if (props.href?.endsWith('.mp3')) {
                                    return (
                                        <div style={{ margin: '1rem 0', width: '100%', maxWidth: '400px' }}>
                                            <audio controls src={props.href} style={{ width: '100%', borderRadius: '0.5rem' }} />
                                            <a href={props.href} download style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gpt-text-secondary)', marginTop: '0.5rem', textAlign: 'center', textDecoration: 'none' }}>⬇️ Download Audio</a>
                                        </div>
                                    );
                                }
                                return <a style={{ color: 'var(--gpt-button-primary)', textDecoration: 'underline' }} {...props} />;
                            },
                        }}
                    >
                        {msg.content}
                    </ReactMarkdown>
                )}
                {msg.sources && msg.sources.length > 0 && (
                    <div
                        style={{
                            marginTop: '0.5rem',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid var(--gpt-border)',
                            fontSize: '0.75rem',
                            opacity: 0.7,
                        }}
                    >
                        <span style={{ fontWeight: 600 }}>Sources:</span> {msg.sources.join(', ')}
                    </div>
                )}

                {!isUser && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={onSave}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--gpt-text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '0.4rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = 'rgba(14, 165, 233, 0.1)';
                                e.currentTarget.style.color = 'var(--color-primary-500)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'var(--gpt-text-secondary)';
                            }}
                            title="Save to Notes"
                        >
                            <Bookmark style={{ width: '0.8rem', height: '0.8rem' }} /> Save Note
                        </button>
                    </div>
                )}
            </div>
            {isUser && (
                <div
                    style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        backgroundColor: 'var(--gpt-message-user-bg)',
                        border: '1px solid var(--gpt-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <User style={{ width: '1.1rem', height: '1.1rem', color: 'var(--gpt-text-secondary)' }} />
                </div>
            )}
        </div>
    );
});

const TypingIndicator = memo(function TypingIndicator() {
    return (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div
                style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    backgroundColor: 'var(--gpt-bg-secondary)',
                    border: '1px solid var(--gpt-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <Bot style={{ width: '1.1rem', height: '1.1rem', color: 'var(--gpt-button-primary)' }} />
            </div>
            <div
                style={{
                    borderRadius: '1rem 1rem 1rem 0.25rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--gpt-message-bg)',
                    border: '1px solid var(--gpt-border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                }}
            >
                <span style={{ fontSize: '0.85rem', color: 'var(--gpt-text-secondary)' }}>Thinking</span>
                <span style={{ display: 'flex', gap: '3px' }}>
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--gpt-text-secondary)',
                                display: 'inline-block',
                                animation: `notebook-dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                            }}
                        />
                    ))}
                </span>
            </div>
        </div>
    );
});
