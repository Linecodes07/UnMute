import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  BrainCircuit, 
  Volume2, 
  Search,
  LayoutDashboard,
  User,
  X,
  Bot,
  LogOut,
  Building2,
  BadgeCheck
} from 'lucide-react';
import { Complaint, ComplaintStatus, ViewMode, ChatMessage, AdminProfile } from './types';
import * as geminiService from './services/geminiService';
import AudioRecorder from './components/AudioRecorder';
import { playPCMData } from './services/audioUtils';

// --- MOCK INITIAL DATA ---
const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: '1',
    content: "Seniors in the hostel block B are forcing freshers to complete their assignments at night. It's happening every day after 11 PM.",
    timestamp: Date.now() - 86400000,
    status: ComplaintStatus.RESOLVED,
    category: 'Exclusion',
    isAudio: false
  }
];

// --- COMPONENT: NAV BAR ---
const NavBar = ({ viewMode, setViewMode }: { viewMode: ViewMode, setViewMode: (m: ViewMode) => void }) => (
  <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm px-4 py-3 flex justify-between items-center">
    <div className="flex items-center gap-2">
      <div className="bg-indigo-600 p-2 rounded-lg text-white">
        <ShieldAlert size={24} />
      </div>
      <h1 className="text-xl font-bold text-slate-800 tracking-tight">UnMute</h1>
    </div>
    <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
      <button
        onClick={() => setViewMode(ViewMode.STUDENT)}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
          viewMode === ViewMode.STUDENT ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <span className="flex items-center gap-2"><User size={16}/> Student</span>
      </button>
      <button
        onClick={() => setViewMode(ViewMode.ADMIN)}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
          viewMode === ViewMode.ADMIN ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <span className="flex items-center gap-2"><LayoutDashboard size={16}/> Admin</span>
      </button>
    </div>
  </nav>
);

// --- COMPONENT: CHAT BOT ---
const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: 'Hi! I am here to help. Ask me about anti-ragging laws or how to stay safe.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Transform messages for API history
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await geminiService.getChatResponse(history, userMsg.text);
    const modelMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText || "Error" };
    
    setMessages(prev => [...prev, modelMsg]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-xl transition-all hover:scale-105"
        >
          <Bot size={28} />
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 md:w-96 flex flex-col overflow-hidden h-[500px] animate-in slide-in-from-bottom-10 fade-in duration-200">
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <h3 className="font-semibold flex items-center gap-2"><Bot size={18}/> AI Support Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-500 p-1 rounded"><X size={18}/></button>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
               <div className="flex justify-start">
                 <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                   <div className="flex gap-1">
                     <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                     <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                     <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                   </div>
                 </div>
               </div>
            )}
          </div>

          <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-indigo-600 text-white p-2 rounded-full disabled:opacity-50 hover:bg-indigo-700"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENT: ADMIN LOGIN ---
const AdminLogin = ({ onLogin }: { onLogin: (profile: AdminProfile) => void }) => {
  const [formData, setFormData] = useState<AdminProfile>({ name: '', role: 'Hostel Warden', department: '' });

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <BadgeCheck size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Committee Access</h2>
        <p className="text-slate-500 mt-2 text-sm">Create a profile to access the anti-ragging dashboard and manage reports.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
              placeholder="e.g. Dr. A. Sharma"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
        </div>
        
        <div>
           <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
           <div className="relative">
             <select
               className="w-full pl-3 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white appearance-none"
               value={formData.role}
               onChange={e => setFormData({...formData, role: e.target.value})}
             >
               <option>Hostel Warden</option>
               <option>Faculty Member</option>
               <option>Anti-Ragging Committee</option>
               <option>Student Council</option>
             </select>
           </div>
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Department / Block</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
              placeholder="e.g. Block B or CSE Dept"
              value={formData.department}
              onChange={e => setFormData({...formData, department: e.target.value})}
            />
          </div>
        </div>

        <button
          onClick={() => {
            if (formData.name && formData.department) onLogin(formData);
          }}
          disabled={!formData.name || !formData.department}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-indigo-200"
        >
          Access Dashboard
        </button>
      </div>
    </div>
  );
};

// --- COMPONENT: STUDENT VIEW (Complaint Form) ---
const StudentView = ({ onSubmit }: { onSubmit: (c: Partial<Complaint>) => void }) => {
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    onSubmit({ content, isAudio: false });
    setSubmitted(true);
    setContent('');
  };

  const handleAudio = async (blob: Blob) => {
    setIsProcessingAudio(true);
    try {
      const text = await geminiService.transcribeAudio(blob);
      // Automatically submit transcribed audio
      onSubmit({ content: text, transcription: text, isAudio: true });
      setSubmitted(true);
    } catch (e) {
      alert("Failed to process audio.");
    } finally {
      setIsProcessingAudio(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 text-center bg-white rounded-3xl shadow-xl border border-green-100">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Complaint Submitted</h2>
        <p className="text-slate-600 mb-6">
          Your identity remains anonymous. The Anti-Ragging committee has been notified.
        </p>
        <button 
          onClick={() => setSubmitted(false)}
          className="text-indigo-600 font-semibold hover:underline"
        >
          Submit another report
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Anonymous Reporting</h2>
          <p className="opacity-90">Speak up against ragging. Your voice matters, and your identity is safe.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Describe the incident</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Please provide details about what happened, where, and when..."
              className="w-full h-40 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-slate-700 bg-slate-50"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Alternative Input</p>
              <AudioRecorder onAudioRecorded={handleAudio} isProcessing={isProcessingAudio} />
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              <Send size={18} />
              Submit Report
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
          <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-blue-800 text-sm">Emergency?</h4>
            <p className="text-xs text-blue-700 mt-1">If you are in immediate danger, contact campus security or dial 100.</p>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-start gap-3">
           <ShieldAlert className="text-purple-600 shrink-0 mt-0.5" size={20} />
           <div>
            <h4 className="font-semibold text-purple-800 text-sm">Zero Tolerance</h4>
            <p className="text-xs text-purple-700 mt-1">Our institution follows a strict zero-tolerance policy against ragging.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: ADMIN DASHBOARD ---
const AdminDashboard = ({ 
  complaints, 
  onResolve,
  onAnalyze,
  profile,
  onLogout
}: { 
  complaints: Complaint[], 
  onResolve: (id: string) => void,
  onAnalyze: (id: string, text: string) => void,
  profile: AdminProfile,
  onLogout: () => void
}) => {
  const [filter, setFilter] = useState<'ALL' | 'RESOLVED' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{text: string, links: string[]} | null>(null);
  const [searching, setSearching] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  const filtered = complaints.filter(c => {
    if (filter === 'ALL') return true;
    return c.status === filter;
  });

  const handleSearch = async () => {
    if (!searchQuery) return;
    setSearching(true);
    const results = await geminiService.getGroundingResources(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const handleDeepAnalysis = async (c: Complaint) => {
    setAnalyzingIds(prev => new Set(prev).add(c.id));
    await onAnalyze(c.id, c.content);
    setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(c.id);
        return next;
    });
  };

  const handleSpeak = async (text: string) => {
     if (!audioContextRef.current) {
         audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
     }
     const base64Audio = await geminiService.generateSpeech(text);
     if (base64Audio && audioContextRef.current) {
         await playPCMData(base64Audio, audioContextRef.current);
     }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Welcome Bar */}
      <div className="lg:col-span-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-full text-indigo-700">
                <User size={24} />
            </div>
            <div>
                <h2 className="font-bold text-slate-800 text-lg">{profile.name}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium uppercase tracking-wide">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">{profile.role}</span>
                    <span>•</span>
                    <span>{profile.department}</span>
                </div>
            </div>
        </div>
        <button 
            onClick={onLogout} 
            className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors font-medium border border-transparent hover:border-red-100"
        >
            <LogOut size={16} />
            Log Out
        </button>
      </div>

      {/* Left Col: Complaints List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Incident Reports</h2>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Reports</option>
            <option value="PENDING">Unresolved</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        <div className="space-y-4">
          {filtered.length === 0 && (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-slate-500">No complaints found.</p>
              </div>
          )}
          {filtered.map(complaint => (
            <div key={complaint.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 relative group transition-all hover:shadow-md">
              
              {/* Status Badge */}
              <div className={`absolute top-5 right-5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                complaint.status === ComplaintStatus.RESOLVED 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {complaint.status === ComplaintStatus.RESOLVED ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                {complaint.status}
              </div>

              <div className="mb-2 flex items-center gap-2">
                 <span className="text-xs font-mono text-slate-400">#{complaint.id.slice(0,6)}</span>
                 <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                    {complaint.category || 'Processing...'}
                 </span>
                 {complaint.isAudio && <span className="text-xs flex items-center gap-1 text-indigo-500"><Volume2 size={12}/> Audio Report</span>}
              </div>

              <p className="text-slate-800 mb-4 pr-24 leading-relaxed">{complaint.content}</p>

              {complaint.aiAnalysis && (
                  <div className="mb-4 bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-sm text-indigo-900 animate-in fade-in">
                      <div className="flex items-center gap-2 font-semibold mb-1 text-indigo-700">
                          <BrainCircuit size={16} /> AI Analysis
                      </div>
                      {complaint.aiAnalysis}
                  </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                <button 
                  onClick={() => onResolve(complaint.id)}
                  className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                     complaint.status === ComplaintStatus.RESOLVED
                     ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                     : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {complaint.status === ComplaintStatus.RESOLVED ? 'Mark Unresolved' : 'Mark Resolved'}
                </button>
                
                <button 
                    onClick={() => handleDeepAnalysis(complaint)}
                    disabled={analyzingIds.has(complaint.id)}
                    className="text-sm px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 border border-indigo-200 font-medium flex items-center gap-2"
                >
                    {analyzingIds.has(complaint.id) ? (
                        <>Analyzing...</>
                    ) : (
                        <><BrainCircuit size={16}/> Analyze Severity</>
                    )}
                </button>

                <button 
                    onClick={() => handleSpeak(complaint.content)}
                    className="text-sm px-4 py-2 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 border border-slate-200 font-medium flex items-center gap-2"
                >
                    <Volume2 size={16}/> Read Aloud
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Col: Resources Search */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Search size={18} className="text-indigo-600"/> Resource Finder
            </h3>
            <p className="text-sm text-slate-500 mb-4">Search for legal acts, helplines, or UGC guidelines using real-time Google Search data.</p>
            
            <div className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="E.g. Anti-ragging helpline number"
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                    onClick={handleSearch}
                    disabled={searching}
                    className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                    {searching ? "..." : <Search size={18}/>}
                </button>
            </div>

            {searchResults && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm text-slate-700 mb-3 bg-slate-50 p-3 rounded-lg">{searchResults.text}</p>
                    {searchResults.links.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-500 uppercase">Sources:</p>
                            {searchResults.links.map((link, i) => (
                                <a key={i} href={link} target="_blank" rel="noreferrer" className="block text-xs text-blue-600 hover:underline truncate">
                                    {link}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.STUDENT);
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  const addComplaint = async (c: Partial<Complaint>) => {
    // 1. Create Complaint Object
    const newComplaint: Complaint = {
      id: Date.now().toString(),
      content: c.content || '',
      timestamp: Date.now(),
      status: ComplaintStatus.PENDING,
      isAudio: !!c.isAudio,
      transcription: c.transcription,
      category: 'Processing...' // Temporary
    };

    setComplaints(prev => [newComplaint, ...prev]);

    // 2. Trigger Fast AI Categorization (Async)
    const category = await geminiService.categorizeComplaint(newComplaint.content);
    setComplaints(prev => prev.map(comp => 
        comp.id === newComplaint.id ? { ...comp, category } : comp
    ));
  };

  const toggleResolution = (id: string) => {
    setComplaints(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: c.status === ComplaintStatus.RESOLVED ? ComplaintStatus.PENDING : ComplaintStatus.RESOLVED
        };
      }
      return c;
    }));
  };

  const updateAnalysis = async (id: string, text: string) => {
      const analysis = await geminiService.analyzeComplaintDeeply(text);
      setComplaints(prev => prev.map(c => 
        c.id === id ? { ...c, aiAnalysis: analysis } : c
      ));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <NavBar viewMode={viewMode} setViewMode={setViewMode} />
      
      <main>
        {viewMode === ViewMode.STUDENT ? (
          <StudentView onSubmit={addComplaint} />
        ) : (
          !adminProfile ? (
            <AdminLogin onLogin={setAdminProfile} />
          ) : (
            <AdminDashboard 
              complaints={complaints} 
              onResolve={toggleResolution} 
              onAnalyze={updateAnalysis}
              profile={adminProfile}
              onLogout={() => setAdminProfile(null)}
            />
          )
        )}
      </main>

      <ChatBot />
    </div>
  );
}