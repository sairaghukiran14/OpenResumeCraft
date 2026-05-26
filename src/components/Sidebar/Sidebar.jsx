import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getProviders, getModels, generateResume } from '../../services/aiProviders';
import { buildSystemPrompt, buildUserPrompt, parseAIResponse } from '../../services/promptEngine';
import { calculateATSScore } from '../../services/atsScoringEngine';
import TokenTracker from '../TokenTracker/TokenTracker';
import AtsMatchAnalytics from '../AtsMatchAnalytics/AtsMatchAnalytics';
import { toast } from 'sonner';
import { 
  Settings, 
  Briefcase, 
  Sparkles, 
  Key, 
  Eye, 
  EyeOff, 
  History, 
  ChevronRight, 
  AlertCircle,
  HelpCircle,
  FileText,
  Target,
  RefreshCw
} from 'lucide-react';

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const { settings, jobDescription, isGenerating, generationHistory } = state;
  
  const [showKey, setShowKey] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isScoring, setIsScoring] = useState(false);

  // Dynamic local Ollama model states
  const [localModels, setLocalModels] = useState([]);
  const [isLoadingLocalModels, setIsLoadingLocalModels] = useState(false);
  const [ollamaOffline, setOllamaOffline] = useState(false);

  const fetchLocalModels = async () => {
    setIsLoadingLocalModels(true);
    setOllamaOffline(false);
    try {
      const response = await fetch('/api/ollama-models');
      if (!response.ok) {
        throw new Error('Ollama connection not ok');
      }
      const data = await response.json();
      setLocalModels(data);
      
      if (data.length > 0) {
        // Auto-select first local model if the current setting isn't one of them
        const hasCurrent = data.some(m => m.id === settings.model);
        if (!hasCurrent) {
          dispatch({
            type: 'SET_SETTINGS',
            payload: { model: data[0].id },
          });
        }
      } else {
        setOllamaOffline(true);
      }
    } catch (err) {
      console.warn('[Sidebar] Failed to fetch local Ollama models:', err);
      setLocalModels([]);
      setOllamaOffline(true);
    } finally {
      setIsLoadingLocalModels(false);
    }
  };

  useEffect(() => {
    if (settings.provider === 'ollama') {
      fetchLocalModels();
    }
  }, [settings.provider]);

  const providers = getProviders();
  const staticModels = getModels(settings.provider);
  const models = settings.provider === 'ollama' && localModels.length > 0 ? localModels : staticModels;
  const currentProvider = providers[settings.provider];

  const handleProviderChange = (e) => {
    const provId = e.target.value;
    const provModels = getModels(provId);
    dispatch({
      type: 'SET_SETTINGS',
      payload: {
        provider: provId,
        model: provModels[0]?.id || '',
      },
    });
    setApiError(null);
  };

  const handleModelChange = (e) => {
    dispatch({
      type: 'SET_SETTINGS',
      payload: { model: e.target.value },
    });
  };

  const handleKeyChange = (e) => {
    dispatch({
      type: 'SET_API_KEY',
      payload: {
        provider: settings.provider,
        key: e.target.value,
      },
    });
  };

  const handleToneChange = (e) => {
    dispatch({
      type: 'SET_SETTINGS',
      payload: { tone: e.target.value },
    });
  };

  const handleJdChange = (e) => {
    dispatch({
      type: 'SET_JOB_DESCRIPTION',
      payload: e.target.value,
    });
  };

  const triggerATSScoring = async () => {
    const apiKey = settings.apiKeys[settings.provider];
    
    if (!apiKey || apiKey.trim() === '') {
      setApiError(`API key is required for ${currentProvider.name}`);
      return;
    }

    if (!jobDescription || jobDescription.trim() === '') {
      setApiError('Please paste a Job Description first to check your ATS score.');
      return;
    }

    setApiError(null);
    setIsScoring(true);

    // Short simulated delay to provide satisfying premium spinner feedback
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const parsedAnalysis = calculateATSScore(state.resumeData, jobDescription);

      // Save scoring analysis directly into global state
      dispatch({
        type: 'UPDATE_SECTION',
        payload: {
          section: 'atsAnalysis',
          data: parsedAnalysis
        }
      });

      toast.success('ATS Score Analysis Complete!', {
        description: `Your match score is ${parsedAnalysis.score}%. View details in the Match Analytics widget.`,
        duration: 5000,
      });

    } catch (err) {
      console.error('[ATS Scoring Fail]:', err);
      setApiError(err.message);
      toast.error('ATS Score Computation Failed', {
        description: err.message || 'An unexpected error occurred during scoring.',
        duration: 8000,
      });
    } finally {
      setIsScoring(false);
    }
  };

  const triggerAIGeneration = async () => {
    const apiKey = settings.apiKeys[settings.provider];
    
    if (settings.provider !== 'ollama' && (!apiKey || apiKey.trim() === '')) {
      setApiError(`API key is required for ${currentProvider.name}`);
      return;
    }

    if (!jobDescription || jobDescription.trim() === '') {
      setApiError('Please paste a Job Description first to tailor your resume.');
      return;
    }

    setApiError(null);
    dispatch({ type: 'START_GENERATION' });

    try {
      const systemPrompt = buildSystemPrompt();
      const userPrompt = buildUserPrompt(state.resumeData, jobDescription, {
        tone: settings.tone,
      });

      console.log(`[App] Triggering generation via Express Backend for ${settings.provider}...`);
      
      // Call the Express backend proxy for ultra-fast performance, zero CORS issues, and robust caching!
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: settings.provider,
          modelId: settings.model,
          apiKey: apiKey ? apiKey.trim() : 'ollama',
          systemPrompt,
          userPrompt,
          useCache: true // Enable smart server-side caching!
        })
      });

      if (!response.ok) {
        let errMsg = `Backend error (${response.status})`;
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const result = await response.json();

      // Parse the tailored resume data
      const tailoredResume = parseAIResponse(result.content);

      // Recompute the ATS Match Score deterministically using our standard local engine
      // to ensure 100% consistency across all actions!
      const finalAtsAnalysis = calculateATSScore(tailoredResume, jobDescription);
      tailoredResume.atsAnalysis = finalAtsAnalysis;

      // Save tailored resume into state
      dispatch({
        type: 'GENERATION_SUCCESS',
        payload: {
          resumeData: tailoredResume,
          generation: {
            tokens: result.tokens,
            cost: result.cost,
            model: result.model,
            provider: result.provider,
            cached: result.cached || false,
            durationMs: result.durationMs
          }
        }
      });
      
      // Select Preview panel automatically
      dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'preview' });

      // Show beautiful Sonner toast notification
      const timeSec = ((result.durationMs || 0) / 1000).toFixed(2);
      toast.success('Resume Customization Successful!', {
        description: `Tailored to Job Description using ${result.model} in ${timeSec}s. Cost: $${(result.cost || 0).toFixed(4)}`,
        duration: 5000,
      });

    } catch (err) {
      console.error('[Generation Fail]:', err);
      setApiError(err.message);
      dispatch({ type: 'GENERATION_ERROR', payload: err.message });

      // Show error toast notification
      toast.error('Resume Customization Failed', {
        description: err.message || 'An unexpected error occurred during AI generation.',
        duration: 8000,
      });
    }
  };

  return (
    <aside className={`sidebar ${state.sidebarOpen ? '' : 'collapsed'}`}>
      
      {/* 1. Settings & Provider Configuration */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">
          <Settings size={14} />
          <span>AI Engine Settings</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          
          <div className="input-group">
            <label className="input-label">AI Provider</label>
            <select 
              value={settings.provider} 
              onChange={handleProviderChange} 
              className="select-field"
            >
              {Object.keys(providers).map((id) => (
                <option key={id} value={id}>
                  {providers[id].icon} {providers[id].name}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label">API Key</label>
              <button 
                type="button" 
                onClick={() => setShowKey(!showKey)} 
                className="btn-ghost" 
                style={{ padding: 0, height: 'auto', background: 'none' }}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                placeholder={`Paste your ${currentProvider.name} API key`}
                value={settings.apiKeys[settings.provider] || ''}
                onChange={handleKeyChange}
                className="input-field input-field-mono"
                style={{ paddingLeft: '32px' }}
              />
              <Key size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--color-text-tertiary)' }} />
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="input-label" style={{ margin: 0 }}>Model Selection</label>
              {settings.provider === 'ollama' && (
                <button
                  type="button"
                  onClick={fetchLocalModels}
                  disabled={isLoadingLocalModels}
                  className="btn-ghost"
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    height: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--color-primary)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                  title="Query your local Ollama server for pulled models"
                >
                  <RefreshCw 
                    size={10} 
                    style={{ animation: isLoadingLocalModels ? 'spin 1s linear infinite' : 'none' }}
                  />
                  <span>Refresh</span>
                </button>
              )}
            </div>
            <select 
              value={settings.model} 
              onChange={handleModelChange} 
              className="select-field"
              disabled={settings.provider === 'ollama' && isLoadingLocalModels}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} {model.description ? `— (${model.description})` : ''}
                </option>
              ))}
            </select>
          </div>

          {currentProvider.corsWarning && (
            <div className="badge badge-warning" style={{ gap: 'var(--space-2)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', lineHeight: 1.3 }}>
              <AlertCircle size={22} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '10px', whiteSpace: 'normal', textAlign: 'left' }}>
                Note: Server proxy active. Anthropic key runs safely, bypassing CORS block!
              </span>
            </div>
          )}

          {settings.provider === 'ollama' && ollamaOffline && (
            <div className="badge badge-warning" style={{ gap: 'var(--space-2)', padding: 'var(--space-2.5)', borderRadius: 'var(--radius-md)', lineHeight: 1.4, backgroundColor: 'rgba(243, 156, 18, 0.1)', border: '1px solid rgba(243, 156, 18, 0.3)', color: '#d35400', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', width: '100%', fontWeight: '600', fontSize: '11px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>Ollama Offline / No Models Found</span>
              </div>
              <p style={{ fontSize: '10px', margin: 0, fontWeight: 'normal', textAlign: 'left' }}>
                We couldn't connect to Ollama at <code>http://localhost:11434</code>. Make sure to:
              </p>
              <ul style={{ fontSize: '9px', margin: '4px 0 0 12px', padding: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <li>1. Start the service: <code>ollama serve</code></li>
                <li>2. Pull a model: <code>ollama pull llama3.1</code></li>
              </ul>
              <button 
                type="button" 
                onClick={fetchLocalModels} 
                className="btn-primary" 
                style={{ alignSelf: 'stretch', height: '24px', fontSize: '9px', marginTop: '6px', padding: '0 8px', borderRadius: 'var(--radius-sm)' }}
              >
                Retry Connection
              </button>
            </div>
          )}

          {settings.provider === 'ollama' && !ollamaOffline && localModels.length > 0 && (
            <div className="badge badge-success" style={{ gap: 'var(--space-2)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', lineHeight: 1.3, backgroundColor: 'rgba(46, 204, 113, 0.1)', border: '1px solid rgba(46, 204, 113, 0.3)', color: '#27ae60', display: 'flex', width: '100%' }}>
              <Sparkles size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '10px', whiteSpace: 'normal', textAlign: 'left', fontWeight: '500' }}>
                Connected! Dynamically loaded {localModels.length} local Ollama models.
              </span>
            </div>
          )}

        </div>
      </div>

      {/* 2. Customization Inputs & Tailoring */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">
          <Briefcase size={14} />
          <span>Tailor Resume</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="input-group">
            <label className="input-label">Job Description</label>
            <textarea
              placeholder="Paste the target job description here. Our AI will analyze the JD keywords and tailor your resume's experience and summary to match perfectly..."
              value={jobDescription}
              onChange={handleJdChange}
              className="textarea-field"
              style={{ minHeight: '120px', fontSize: 'var(--text-sm)' }}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Writing Tone</label>
            <select 
              value={settings.tone} 
              onChange={handleToneChange} 
              className="select-field"
            >
              <option value="professional">👔 Professional (Standard balanced)</option>
              <option value="technical">💻 Technical (Emphasize tech depth)</option>
              <option value="executive">📈 Executive (Emphasize leadership/impact)</option>
            </select>
          </div>

          <div className="input-group" style={{ marginTop: 'var(--space-1)', padding: 'var(--space-2.5)', backgroundColor: 'rgba(99, 102, 241, 0.03)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(99, 102, 241, 0.15)' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
              <input 
                type="checkbox" 
                checked={settings.compactLayout || false} 
                onChange={(e) => {
                  dispatch({
                    type: 'SET_SETTINGS',
                    payload: { compactLayout: e.target.checked }
                  });
                  toast.success(
                    e.target.checked 
                      ? 'Compact Layout Enabled! Spacing compressed for single-page fit.' 
                      : 'Standard Spacing Restored!'
                  );
                }} 
                style={{ cursor: 'pointer', accentColor: 'var(--color-primary)', width: '15px', height: '15px' }}
              />
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                Compact Spacing (Force One Page)
              </span>
            </label>
            <p style={{ fontSize: '9.5px', margin: '4px 0 0 23px', color: 'var(--color-text-tertiary)', lineHeight: 1.35 }}>
              Slightly compresses margins, cell paddings, and font sizes so the text moves upward to fit on a single page.
            </p>
          </div>

          {apiError && (
            <div className="badge badge-error" style={{ gap: 'var(--space-2)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', lineHeight: 1.3 }}>
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '11px', whiteSpace: 'normal', textAlign: 'left', fontWeight: '500' }}>
                {apiError}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <button
              onClick={triggerATSScoring}
              disabled={isGenerating || isScoring}
              className="btn btn-secondary"
              style={{ 
                flex: 1, 
                gap: 'var(--space-1.5)', 
                background: 'rgba(124, 58, 237, 0.06)',
                color: 'var(--color-accent-violet-light)',
                borderColor: 'rgba(124, 58, 237, 0.15)',
                fontWeight: '600',
                fontSize: '11px',
                padding: '0 var(--space-2)',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isScoring ? (
                <>
                  <span className="spinner spinner-sm" />
                  <span>Scoring...</span>
                </>
              ) : (
                <>
                  <Target size={13} />
                  <span>Check Score</span>
                </>
              )}
            </button>
            
            <button
              onClick={triggerAIGeneration}
              disabled={isGenerating || isScoring}
              className="btn btn-primary"
              style={{ 
                flex: 1.2, 
                gap: 'var(--space-1.5)',
                background: 'linear-gradient(135deg, var(--color-accent-violet-dark), #6366f1)',
                borderColor: 'rgba(99, 102, 241, 0.4)',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
                fontSize: '11px',
                padding: '0 var(--space-2)',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isGenerating ? (
                <>
                  <span className="spinner spinner-sm" />
                  <span>Tailoring...</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  <span>Tailor Resume</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. ATS Match Analytics Widget */}
      <div className="sidebar-section">
        <AtsMatchAnalytics />
      </div>

      {/* 4. Live Token Tracker */}
      <div className="sidebar-section">
        <TokenTracker />
      </div>

      {/* 5. Generation History */}
      {generationHistory.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <History size={14} />
            <span>Generation History</span>
          </div>
          
          <div className="history-list">
            {generationHistory.map((item, idx) => {
              const details = item?.generation || item || {};
              const model = details.model || 'Unknown Model';
              const cached = details.cached || false;
              const timestamp = item?.timestamp || details.timestamp || Date.now();
              const tokensTotal = details.tokens?.total || 0;
              const costVal = details.cost || 0;

              return (
                <div key={idx} className="history-item">
                  <div className="history-item-info">
                    <span className="history-item-model">
                      {model}
                      {cached && (
                        <span className="badge badge-success" style={{ fontSize: '8px', padding: '0px 4px', marginLeft: '4px', verticalAlign: 'middle' }}>
                          cached
                        </span>
                      )}
                    </span>
                    <span className="history-item-time">
                      {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="history-item-stats">
                    <span className="history-tokens" title="Total Tokens">
                      {tokensTotal}t
                    </span>
                    <span className="history-cost" title="Estimated Cost">
                      ${costVal.toFixed(4)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </aside>
  );
}
