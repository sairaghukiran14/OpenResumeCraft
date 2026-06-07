import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  Sparkles, 
  Settings, 
  ChevronRight, 
  BookOpen, 
  Award,
  Terminal,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { buildCoverLetterSystemPrompt, buildCoverLetterUserPrompt } from '../../services/promptEngine';

/**
 * CoverLetterEditor Component.
 * ----------------------------
 * The form and settings controller pane for Cover Letter generation.
 *
 * @returns {React.ReactElement} The rendered form panel.
 */
export default function CoverLetterEditor() {
  const { state, dispatch } = useApp();
  const { coverLetter, settings, jobDescription } = state;

  const styles = [
    {
      id: 'short',
      name: 'Short & Impactful',
      icon: Sparkles,
      desc: 'Crisp, high-hook 3-paragraph pitch under 250 words. Perfect for quick applications.'
    },
    {
      id: 'tech',
      name: 'Tech-Based',
      icon: Terminal,
      desc: 'Dives deep into technology stacks, architectural patterns, and engineering execution.'
    },
    {
      id: 'experience',
      name: 'Experience-Based',
      icon: Award,
      desc: 'Emphasizes project management, leadership scope, business metrics, and team collaboration.'
    }
  ];

  const handleStyleChange = (styleId) => {
    dispatch({ type: 'SET_COVER_LETTER_STYLE', payload: styleId });
    toast.info(`Selected ${styles.find(s => s.id === styleId).name} style`);
  };

  const handleTextChange = (e) => {
    dispatch({ type: 'UPDATE_COVER_LETTER_TEXT', payload: e.target.value });
  };

  const handleGenerate = async () => {
    if (!jobDescription || !jobDescription.trim()) {
      toast.error('Job Description Required', {
        description: 'Please paste the target Job Description in the left Sidebar panel first.',
        duration: 5000
      });
      return;
    }

    dispatch({ type: 'START_COVER_LETTER_GEN' });
    toast.info('Generating tailored cover letter...', {
      description: `Tailoring content with ${settings.model} in ${styles.find(s => s.id === coverLetter.style).name} style.`,
      duration: 4000
    });

    try {
      const systemPrompt = buildCoverLetterSystemPrompt(coverLetter.style);
      const userPrompt = buildCoverLetterUserPrompt(state.resumeData, jobDescription, coverLetter.style);

      let apiKey = settings.apiKeys[settings.provider] || '';
      // Fallback to env key if empty
      if (!apiKey && settings.provider !== 'ollama') {
        // Handled on the server, send empty string
        apiKey = '';
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          providerId: settings.provider,
          modelId: settings.model,
          apiKey: apiKey,
          systemPrompt,
          userPrompt,
          useCache: false // Always generate fresh
        })
      });

      if (!response.ok) {
        let errMsg = `Server returned status ${response.status}`;
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const result = await response.json();

      dispatch({
        type: 'COVER_LETTER_GEN_SUCCESS',
        payload: {
          text: result.content,
          generation: {
            tokens: result.tokens,
            cost: result.cost,
            model: result.model,
            provider: result.provider,
            timestamp: Date.now()
          }
        }
      });

      toast.success('Cover Letter Generated!', {
        description: 'The letterhead and text have been compiled successfully.',
        duration: 5000
      });

    } catch (err) {
      console.error('[Cover Letter Gen Fail]:', err);
      dispatch({ type: 'COVER_LETTER_GEN_ERROR', payload: err.message });
      toast.error('Cover Letter Generation Failed', {
        description: err.message,
        duration: 6000
      });
    }
  };

  return (
    <div className="editor-container" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* 1. Header Card */}
      <div className="card" style={{ padding: 'var(--space-5)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-accent-violet-dark), #6366f1)',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <FileText size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', margin: 0 }}>
              Cover Letter Generator
            </h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 0 }}>
              AI-powered document tailoring mapped to your resume skills and target Job Description.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Select Style Section */}
      <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', margin: '0 0 var(--space-1) 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            1. Select Tone & Style
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Choose the core focus area of your cover letter to fit the role or company type.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {styles.map((styleOpt) => {
            const IconComponent = styleOpt.icon;
            const isSelected = coverLetter.style === styleOpt.id;

            return (
              <button
                key={styleOpt.id}
                onClick={() => handleStyleChange(styleOpt.id)}
                className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  padding: 'var(--space-4)',
                  gap: 'var(--space-4)',
                  border: isSelected ? '1.5px solid var(--color-accent-violet-dark)' : '1px solid var(--color-border-primary)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'var(--color-bg-secondary)',
                  transition: 'all 0.2s ease',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <div style={{
                  background: isSelected ? 'var(--color-accent-violet-dark)' : 'var(--color-bg-tertiary)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                  marginTop: '2px',
                  flexShrink: 0
                }}>
                  <IconComponent size={15} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ 
                    fontSize: 'var(--text-sm)', 
                    fontWeight: 'var(--weight-semibold)', 
                    color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                  }}>
                    {styleOpt.name}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', lineHeight: 1.3 }}>
                    {styleOpt.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Action Trigger Section */}
      <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', margin: '0 0 var(--space-1) 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            2. Run Tailor AI
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Generates the cover letter using your current active settings: <strong>{settings.provider} ({settings.model})</strong>.
          </p>
        </div>

        {(!jobDescription || !jobDescription.trim()) && (
          <div style={{
            display: 'flex',
            gap: 'var(--space-3)',
            padding: 'var(--space-3.5)',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-danger)'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '11px', lineHeight: 1.4 }}>
              <strong>Missing Job Description:</strong> Please paste the target Job Description in the Sidebar first to allow AI matching.
            </span>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={coverLetter.isGenerating}
          className="btn btn-primary"
          style={{
            fontWeight: '600',
            background: 'linear-gradient(135deg, var(--color-accent-violet-dark), #6366f1)',
            borderColor: 'rgba(99, 102, 241, 0.4)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
            padding: 'var(--space-3.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)'
          }}
        >
          {coverLetter.isGenerating ? (
            <>
              <div className="generating-spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', margin: 0 }} />
              <span>Tailoring Cover Letter...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>Generate Cover Letter</span>
            </>
          )}
        </button>
      </div>

      {/* 4. Edit Text Section */}
      {coverLetter.text && !coverLetter.isGenerating && (
        <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', margin: '0 0 var(--space-1) 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              3. Edit Generated Text
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
              Adjust details or add custom paragraphs. The print preview will refresh in real-time.
            </p>
          </div>

          <textarea
            value={coverLetter.text}
            onChange={handleTextChange}
            placeholder="Your generated cover letter will appear here..."
            style={{
              width: '100%',
              minHeight: '320px',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              lineHeight: 1.5,
              padding: 'var(--space-3.5)',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-primary)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--color-text-primary)',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>
      )}

      {/* 5. Skeleton Loading State */}
      {coverLetter.isGenerating && (
        <div className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ height: '14px', background: 'var(--color-bg-tertiary)', borderRadius: '4px', width: '30%', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: '12px', background: 'var(--color-bg-tertiary)', borderRadius: '4px', width: '90%', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: '12px', background: 'var(--color-bg-tertiary)', borderRadius: '4px', width: '85%', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: '12px', background: 'var(--color-bg-tertiary)', borderRadius: '4px', width: '95%', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: '12px', background: 'var(--color-bg-tertiary)', borderRadius: '4px', width: '40%', animation: 'pulse 1.5s infinite' }} />
        </div>
      )}

    </div>
  );
}
