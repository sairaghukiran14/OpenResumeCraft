import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import Sidebar from './components/Sidebar/Sidebar';
import ResumeEditor from './components/Editor/ResumeEditor';
import ResumePreview from './components/Preview/ResumePreview';
import { 
  Menu, 
  RefreshCw, 
  Eraser, 
  Edit3, 
  Eye, 
  Sidebar as SidebarIcon,
  FileText,
  Upload,
  X,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { parseAIResponse } from './services/promptEngine';
import { asrkResume } from './data/defaultResume';

export default function App() {
  const { state, dispatch } = useApp();
  const { activePanel, sidebarOpen, isGenerating } = state;

  // Draggable Divider Resize State
  const [leftWidth, setLeftWidth] = useState(50); // Starts at exactly 50% split as requested
  const [isDragging, setIsDragging] = useState(false);

  // AI Resume Parser Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState(null);

  /**
   * Handles user file uploads for raw resume parsing.
   * Supports:
   *   - PDF (.pdf) and Word (.docx): Uploads raw binary streams to `/api/extract-text` for server-side extraction.
   *   - JSON (.json): Decodes locally, structures, and immediately hydryates the editor state.
   *   - Text (.txt): Reads plain text locally in the browser and updates the importText area.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event from the file input element.
   * @returns {Promise<void>}
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset error
    setParseError(null);

    // If it's a PDF or Word document, upload it to the backend for text extraction
    if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
      setIsParsing(true);
      toast.info(`Extracting text from ${file.name}...`, {
        description: 'Uploading document to parser engine...',
        duration: 3000
      });

      try {
        const response = await fetch('/api/extract-text', {
          method: 'POST',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
            'x-file-name': file.name
          },
          body: file // Sends the raw File binary body!
        });

        if (!response.ok) {
          let errMsg = `Failed to parse file (${response.status})`;
          try {
            const errData = await response.json();
            errMsg = errData.error || errMsg;
          } catch {}
          throw new Error(errMsg);
        }

        const result = await response.json();
        setImportText(result.text);

        toast.success(`Text extracted successfully!`, {
          description: `Loaded ${file.name}. Ready to parse with AI.`,
          duration: 4000
        });

      } catch (err) {
        console.error('[File Extract Fail]:', err);
        setParseError(err.message);
        toast.error('Document Parsing Failed', {
          description: err.message,
          duration: 6000
        });
      } finally {
        setIsParsing(false);
      }
      return;
    }

    // Default: Plain text (.txt) and JSON (.json) read locally in the browser
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(text);
          // Directly load structured JSON resume if compatible
          if (parsed.contactInfo || parsed.experience) {
            const structured = parseAIResponse(text);
            dispatch({ type: 'SET_RESUME_DATA', payload: structured });
            toast.success('JSON Resume Loaded Directly!', {
              description: 'Successfully populated editor with structured JSON resume file.',
              duration: 4000
            });
            setShowImportModal(false);
            return;
          }
        } catch (jsonErr) {
          console.warn('JSON parse failed, falling back to raw text:', jsonErr);
        }
      }
      setImportText(text);
      toast.success(`Loaded "${file.name}"!`, {
        description: 'File text extracted. Click "Parse with AI" to structure it.',
        duration: 4000
      });
    };
    reader.readAsText(file);
  };

  /**
   * Dispatches the raw pasted/extracted resume text to `/api/parse-resume`.
   * Enforces the current AI provider settings, handles HTTP status outputs,
   * validates structured JSON output schema matching expectations,
   * and hydrates the global application state upon success.
   *
   * @returns {Promise<void>}
   */
  const handleImportWithAI = async () => {
    if (!importText || importText.trim() === '') {
      setParseError('Please paste your resume text or upload a file first.');
      return;
    }

    const apiKey = state.settings.apiKeys[state.settings.provider];
    if (state.settings.provider !== 'ollama' && (!apiKey || apiKey.trim() === '')) {
      setParseError(`API key is required. Please add your ${state.settings.provider} API key in the AI Engine Settings sidebar.`);
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      console.log(`[Import AI] Requesting parse-resume via proxy...`);
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: state.settings.provider,
          modelId: state.settings.model,
          apiKey: apiKey ? apiKey.trim() : 'ollama',
          rawText: importText.trim()
        })
      });

      if (!response.ok) {
        let errMsg = `Server parse error (${response.status})`;
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const result = await response.json();
      
      // Parse the structured resume data using the validated schema utility
      const structuredData = parseAIResponse(result.content);

      // Save into global React state
      dispatch({
        type: 'SET_RESUME_DATA',
        payload: structuredData
      });

      toast.success('Resume Data Successfully Imported!', {
        description: `Parsed using ${result.model}. Text extracted and mapped into all sections.`,
        duration: 5000
      });

      setImportText('');
      setShowImportModal(false);

    } catch (err) {
      console.error('[Import AI Fail]:', err);
      setParseError(err.message);
      toast.error('AI Resume Parse Failed', {
        description: err.message,
        duration: 7000
      });
    } finally {
      setIsParsing(false);
    }
  };

  /**
   * Activates split-pane mouse drag resizing.
   * Prevents browser text selections during active dragging motions.
   *
   * @param {React.MouseEvent} e - The mouse down event.
   */
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  /**
   * Dynamically tracks mouse movement across the viewport while dragging the divider handle.
   * Updates `leftWidth` as a percentage of the total window width.
   * Constrains pane width split limits between 25% and 75% to prevent complete pane collapse.
   */
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const containerWidth = window.innerWidth;
      if (containerWidth === 0) return;
      
      const newWidthPercent = (e.clientX / containerWidth) * 100;
      // Clamping split between 25% and 75% for user experience safety
      if (newWidthPercent >= 25 && newWidthPercent <= 75) {
        setLeftWidth(newWidthPercent);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  /**
   * Toggles the left-hand AI configuration sidebar state.
   */
  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  /**
   * Prompts the user for confirmation and resets editing state
   * to default pre-populated resume values.
   */
  const handleResetResume = () => {
    if (window.confirm('Are you sure you want to reset your resume to the default Software Engineer template? This will discard your current edits.')) {
      dispatch({ type: 'RESET_RESUME' });
    }
  };

  /**
   * Prompts the user for confirmation and clears out every block of resume data,
   * providing an entirely blank slate.
   */
  const handleClearResume = () => {
    if (window.confirm('Are you sure you want to clear all fields? This will start a completely blank resume.')) {
      dispatch({ type: 'CLEAR_RESUME' });
    }
  };

  const setActivePanel = (panelId) => {
    dispatch({ type: 'SET_ACTIVE_PANEL', payload: panelId });
  };

  const handleLoadASRKResume = () => {
    const customAsrk = localStorage.getItem('openresumecraft_asrk_resume');
    if (customAsrk) {
      try {
        const parsed = JSON.parse(customAsrk);
        dispatch({ type: 'SET_RESUME_DATA', payload: parsed });
        toast.success("Loaded Sai Raghu Kiran's customized resume data!");
        return;
      } catch (e) {
        console.error("Failed to parse custom ASRK resume, loading default instead.");
      }
    }
    dispatch({ type: 'SET_RESUME_DATA', payload: asrkResume });
    toast.success("Loaded Sai Raghu Kiran's default resume data!");
  };

  const handleSaveASRKResume = () => {
    localStorage.setItem('openresumecraft_asrk_resume', JSON.stringify(state.resumeData));
    toast.success("Successfully saved current data as Sai Raghu Kiran's profile!");
  };

  return (
    <div className="app-layout" style={{ flexDirection: 'column' }}>
      
      {/* 1. App Header — Clean, Minimalist (No Logo) */}
      <header className="app-header">
        
        <div className="app-header-left">
          <button 
            onClick={toggleSidebar} 
            className="btn btn-secondary btn-icon btn-sm"
            title={sidebarOpen ? "Hide AI Sidebar" : "Show AI Sidebar"}
          >
            <SidebarIcon size={16} />
          </button>
          
          {/* Logo completely removed. Minimal clean text title instead */}
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)', letterSpacing: '0.02em' }}>
            OpenResumeCraft
          </div>
        </div>

        {/* Action Controls */}
        <div className="app-header-right" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          
          <button
            onClick={handleLoadASRKResume}
            className="btn btn-secondary btn-sm"
            style={{ 
              fontWeight: '600', 
              borderColor: 'var(--color-accent-violet-dark)', 
              color: 'var(--color-accent-violet-dark)' 
            }}
            title="Load Sai Raghu Kiran's Resume Data"
          >
            <span>ASRK</span>
          </button>

          <button
            onClick={handleSaveASRKResume}
            className="btn btn-secondary btn-sm"
            style={{ 
              fontWeight: '600', 
              borderColor: 'var(--color-accent-violet-dark)', 
              color: 'var(--color-accent-violet-dark)' 
            }}
            title="Save current resume as Sai Raghu Kiran's profile"
          >
            <span>Save for ASRK</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="btn btn-primary btn-sm"
            style={{ 
              gap: 'var(--space-1.5)', 
              background: 'linear-gradient(135deg, var(--color-accent-violet-dark), #6366f1)',
              borderColor: 'rgba(99, 102, 241, 0.4)',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
            }}
            title="Import existing resume file or paste raw text to parse with AI"
          >
            <Sparkles size={13} />
            <span>Import with AI</span>
          </button>

          <button
            onClick={handleResetResume}
            className="btn btn-secondary btn-sm"
            style={{ gap: 'var(--space-1.5)' }}
            title="Reset to Sample Resume Data"
          >
            <RefreshCw size={13} />
            <span>Load Sample</span>
          </button>

          <button
            onClick={handleClearResume}
            className="btn btn-danger btn-sm"
            style={{ gap: 'var(--space-1.5)' }}
            title="Clear All Fields"
          >
            <Eraser size={13} />
            <span>Clear Slate</span>
          </button>

        </div>

      </header>

      {/* 2. Responsive Mobile Navigation Tabs */}
      <div className="mobile-tabs">
        <button
          onClick={() => setActivePanel('editor')}
          className={`mobile-tab ${activePanel === 'editor' ? 'active' : ''}`}
        >
          <Edit3 size={15} />
          <span>Editor</span>
        </button>
        <button
          onClick={() => setActivePanel('preview')}
          className={`mobile-tab ${activePanel === 'preview' ? 'active' : ''}`}
        >
          <Eye size={15} />
          <span>Preview Paper</span>
        </button>
      </div>

      {/* 3. Resizable Multi-Pane Viewport Layout */}
      <div className="content-panels" style={{ flex: 1 }}>
        
        {isGenerating ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-tertiary)' }}>
            <div className="generating-overlay">
              <div className="generating-spinner" />
              <div className="generating-text">
                Customizing Your Resume...
              </div>
              <div className="generating-subtext" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>
                Structuring and tailoring sections to match target Job Description using {state.settings.model}...
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* LEFT PANE (Sidebar + Editor combined) taking leftWidth % */}
            <div 
              className={`left-pane ${activePanel === 'editor' ? 'active' : ''}`}
              style={{ width: window.innerWidth > 1024 ? `${leftWidth}%` : '100%' }}
            >
              {/* Collapsible Sidebar */}
              <Sidebar />

              {/* Editor Workspace Panel */}
              <main className="editor-panel">
                <ResumeEditor />
              </main>
            </div>

            {/* DRAGGABLE DIVIDER (Resizing Section Handle) */}
            <div 
              className={`resize-divider ${isDragging ? 'dragging' : ''}`}
              onMouseDown={handleMouseDown}
            />

            {/* RIGHT PANE (Document Preview canvas) taking remaining % */}
            <section 
              className={`right-pane ${activePanel === 'preview' ? 'active' : ''}`}
              style={{ display: activePanel === 'preview' || window.innerWidth > 1024 ? 'flex' : 'none' }}
            >
              <ResumePreview />
            </section>
          </>
        )}

      </div>

      {/* AI Resume Parser Overlay Modal */}
      {showImportModal && (
        <div 
          className="animate-fadeIn" 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(15, 23, 42, 0.45)', 
            backdropFilter: 'blur(8px)', 
            zIndex: 9999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: 'var(--space-4)'
          }}
        >
          <div 
            className="animate-scaleIn"
            style={{ 
              background: 'rgba(255, 255, 255, 0.98)', 
              border: '1px solid rgba(99, 102, 241, 0.35)', 
              borderRadius: 'var(--radius-xl)', 
              maxWidth: '580px', 
              width: '100%', 
              boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.15), 0 0 45px rgba(99, 102, 241, 0.08)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              position: 'relative',
              color: '#1f2937'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Sparkles size={18} style={{ color: 'var(--color-accent-violet-dark)' }} />
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-accent-violet-dark)', margin: 0 }}>
                  Import Resume with AI
                </h3>
              </div>
              <button 
                onClick={() => { setShowImportModal(false); setParseError(null); }}
                className="btn-ghost"
                style={{ padding: 'var(--space-1)', borderRadius: '50%', background: 'none', color: '#4b5563' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: '#4b5563', fontWeight: '500', margin: 0, lineHeight: 1.4 }}>
              Upload your raw text resume file or paste your resume content directly from LinkedIn, Word, or PDF. Our AI engine will analyze, extract, and structure all sections instantly into your workspace editor!
            </p>

            {/* Drag & Drop File Selector */}
            <div 
              style={{
                border: '2px dashed rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                background: 'rgba(99, 102, 241, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                textAlign: 'center',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <Upload size={24} style={{ color: 'var(--color-accent-violet-dark)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: '#1f2937' }}>
                  Drag & Drop Resume File Here
                </span>
                <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>
                  Supports PDF (.pdf), Word (.docx), Plain Text (.txt), and JSON (.json)
                </span>
              </div>
              <input 
                type="file" 
                accept=".txt,.json,.pdf,.docx"
                onChange={handleFileUpload}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Paste box */}
            <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label className="input-label" style={{ marginBottom: 0, color: '#374151', fontWeight: '600' }}>Or Paste Raw Resume Text</label>
              <textarea
                placeholder="Paste your existing resume content here... (Tip: Cmd+A, Cmd+C in your Word or PDF document, then paste it here!)"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="textarea-field"
                style={{ 
                  minHeight: '160px', 
                  fontSize: 'var(--text-xs)', 
                  background: 'rgba(255, 255, 255, 0.9)', 
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  borderRadius: 'var(--radius-md)'
                }}
              />
            </div>

            {/* Error handling */}
            {parseError && (
              <div className="badge badge-error" style={{ gap: 'var(--space-2)', padding: 'var(--space-2.5)', borderRadius: 'var(--radius-md)', lineHeight: 1.4 }}>
                <span style={{ fontSize: '11px', whiteSpace: 'normal', textAlign: 'left', fontWeight: '500' }}>
                  ⚠️ {parseError}
                </span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
              <button 
                onClick={() => { setShowImportModal(false); setParseError(null); }}
                className="btn btn-secondary btn-sm"
                style={{ 
                  background: '#f3f4f6', 
                  color: '#374151', 
                  borderColor: '#d1d5db',
                  height: '32px'
                }}
                disabled={isParsing}
              >
                Cancel
              </button>
              
              <button
                onClick={handleImportWithAI}
                disabled={isParsing}
                className="btn btn-primary btn-sm"
                style={{ 
                  gap: 'var(--space-1.5)',
                  background: 'linear-gradient(135deg, var(--color-accent-violet-dark), #6366f1)',
                  borderColor: 'rgba(99, 102, 241, 0.4)',
                  fontWeight: '600',
                  height: '32px'
                }}
              >
                {isParsing ? (
                  <>
                    <span className="spinner spinner-sm" />
                    <span>Parsing Resume...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    <span>Extract & Build Resume</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
