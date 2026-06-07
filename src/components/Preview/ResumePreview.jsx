import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { templates } from '../../templates';
import { exportToPDF } from '../../services/exportPDF';
import { exportToWord } from '../../services/exportWord';
import { exportToLatex } from '../../services/exportLatex';
import { 
  FileCode2, 
  FileDown, 
  CheckCircle, 
  FileCheck,
  Edit3
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Decoupled State Mapper Utility.
 * ------------------------------
 * Normalizes the global application state schema into a clean data model expected by 
 * the individual visual layout templates.
 * 
 * Specifically:
 *   - Extracts the candidate's latest work title to populate the primary header subtitle.
 *   - Maps arrays of experience bullets and project parameters into consistent lists.
 *   - Categorizes skills arrays (technical, soft, tools) into structured array objects.
 *   - Normalizes certification date stamps.
 *
 * @param {object} resumeData - Structured global resume state data.
 * @returns {object} Normalized data payload ready for template renders.
 */
const mapResumeDataForTemplate = (resumeData) => {
  if (!resumeData) return {};
  
  // Primary subtitle: use target title from contact info
  const targetTitle = resumeData.contactInfo?.title || '';

  return {
    ...resumeData,
    personalInfo: {
      ...resumeData.contactInfo,
      title: targetTitle
    },
    experience: (resumeData.experience || []).map(exp => ({
      ...exp,
      highlights: exp.bullets || []
    })),
    projects: (resumeData.projects || []).map(proj => ({
      ...proj,
      highlights: proj.bullets || []
    })),
    skills: [
      { category: 'Technical', items: resumeData.skills?.technical || [] },
      { category: 'Soft Skills', items: resumeData.skills?.soft || [] },
      { category: 'Tools & Technologies', items: resumeData.skills?.tools || [] }
    ].filter(c => c.items && c.items.length > 0),
    certifications: (resumeData.certifications || []).map(cert => ({
      ...cert,
      date: cert.year
    }))
  };
};

/**
 * ResumePreview Component.
 * ------------------------
 * The core visual canvas representing the tailored paper document sheet.
 *
 * Mechanics & Features:
 *   1. Dynamic Template Router: Hot-swaps typography scale classes, grids, and themes dynamically based on select-dropdown states.
 *   2. Direct WYSIWYG Inline Editor: Allows users to click anywhere on the document canvas, edit text directly using HTML contentEditable properties, and save changes locally.
 *   3. Exporters Integration: Links to LaTeX, Word, and PDF download engines, passing sanitized DOM structures.
 *
 * @returns {React.ReactElement} The rendered preview pane.
 */
export default function ResumePreview() {
  const { state, dispatch } = useApp();
  const { resumeData, sectionOrder, selectedTemplate } = state;
  const [downloading, setDownloading] = useState({ pdf: false, word: false, latex: false });
  const [isEditing, setIsEditing] = useState(false);
  const [editedHtml, setEditedHtml] = useState(null);

  const previewRef = useRef(null);

  const currentTemplate = templates[selectedTemplate] || templates.classic;
  const TemplateComponent = currentTemplate.component;

  // Map data to the templates' schema
  const mappedResumeData = mapResumeDataForTemplate(resumeData);

  // Automatically reset inline HTML overrides if the global resume data changes (e.g. sample loaded or AI tailors successfully)
  useEffect(() => {
    setEditedHtml(null);
    setIsEditing(false);
  }, [resumeData]);

  const handleToggleEdit = () => {
    if (isEditing) {
      // Lock, capture, and cache the inline edited DOM content locally
      const innerContainer = document.getElementById('resume-capture-root-inner');
      if (innerContainer) {
        setEditedHtml(innerContainer.innerHTML);
      }
      setIsEditing(false);
      toast.success('Inline edits successfully saved!', {
        description: 'Your direct formatting and text changes are preserved in PDF downloads.',
        duration: 4000
      });
    } else {
      setIsEditing(true);
      toast.info('Direct Inline Editing Active', {
        description: 'Click and type anywhere on the resume canvas to refine text in real-time.',
        duration: 5000
      });
    }
  };

  const handleResetInlineEdits = () => {
    if (window.confirm('Are you sure you want to discard your direct inline formatting tweaks and restore the original fields from the Editor panel?')) {
      setEditedHtml(null);
      setIsEditing(false);
      toast.success('Reverted to Editor panel text.', {
        description: 'All inline changes discarded.',
        duration: 3000
      });
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(p => ({ ...p, pdf: true }));
    try {
      const fileName = `${resumeData.contactInfo.name || 'Resume'}_Tailored`;
      
      // Auto-lock edits before PDF generation to capture the finalized state cleanly
      if (isEditing) {
        const innerContainer = document.getElementById('resume-capture-root-inner');
        if (innerContainer) {
          setEditedHtml(innerContainer.innerHTML);
        }
        setIsEditing(false);
      }

      await exportToPDF('resume-capture-root', fileName, {
        paperSize: 'letter',
        margin: 0.4,
        quality: 'high'
      });

      toast.success('PDF Resume Compiled Successfully!', {
        description: 'Saved and downloaded to your default downloads folder.',
        duration: 4000
      });
    } catch (err) {
      console.error(err);
      toast.error('PDF Compile Failed', {
        description: err.message,
        duration: 6000
      });
    } finally {
      setDownloading(p => ({ ...p, pdf: false }));
    }
  };

  const handleDownloadWord = async () => {
    setDownloading(p => ({ ...p, word: true }));
    try {
      const fileName = `${resumeData.contactInfo.name || 'Resume'}_Tailored`;
      await exportToWord(resumeData, fileName);
      toast.success('Word Document Exported!', {
        description: 'Resume exported as ATS-friendly DOCX file successfully.',
        duration: 4000
      });
    } catch (err) {
      console.error(err);
      toast.error('Word Export Failed', {
        description: err.message,
        duration: 6000
      });
    } finally {
      setDownloading(p => ({ ...p, word: false }));
    }
  };

  const handleDownloadLatex = async () => {
    setDownloading(p => ({ ...p, latex: true }));
    try {
      const fileName = `${resumeData.contactInfo.name || 'Resume'}_LaTeX`;
      exportToLatex(resumeData, fileName);
      toast.success('LaTeX Source Compiled!', {
        description: 'Download completed successfully. Ready for TeX compiler engines.',
        duration: 4000
      });
    } catch (err) {
      console.error(err);
      toast.error('LaTeX Export Failed', {
        description: err.message,
        duration: 6000
      });
    } finally {
      setDownloading(p => ({ ...p, latex: false }));
    }
  };

  const handleTemplateSelect = (id) => {
    // Safely clear direct overrides when layout styles change to guarantee correct grid renders
    setEditedHtml(null);
    setIsEditing(false);
    dispatch({ type: 'SET_TEMPLATE', payload: id });
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* 1. Preview Toolbar */}
      <div className="preview-toolbar">
        
        {/* Template Selectors Dropdown */}
        <div className="preview-toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="input-label" style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Style:</span>
          <select
            value={selectedTemplate}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            className="select-field"
            style={{ 
              width: '140px', 
              padding: 'var(--space-1) var(--space-3)', 
              height: '30px', 
              fontSize: 'var(--text-xs)',
              lineHeight: '1.2'
            }}
          >
            {Object.keys(templates).map((id) => (
              <option key={id} value={id}>
                {templates[id].name}
              </option>
            ))}
          </select>
        </div>

        {/* Exporters and In-line Editor Controls */}
        <div className="preview-toolbar-right" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          
          <button
            onClick={handleToggleEdit}
            className={`btn btn-sm ${isEditing ? 'btn-danger' : 'btn-secondary'}`}
            style={{ 
              gap: 'var(--space-1.5)',
              background: isEditing ? 'rgba(239, 68, 68, 0.1)' : 'rgba(124, 58, 237, 0.1)',
              color: isEditing ? '#f87171' : 'var(--color-accent-violet-light)',
              borderColor: isEditing ? 'rgba(239, 68, 68, 0.2)' : 'rgba(124, 58, 237, 0.2)',
              fontWeight: '600'
            }}
          >
            {isEditing ? (
              <>
                <FileCheck size={14} />
                <span>Lock & Save</span>
              </>
            ) : (
              <>
                <Edit3 size={14} />
                <span>Edit Inline</span>
              </>
            )}
          </button>

          <span style={{ borderLeft: '1px solid var(--color-border)', margin: '4px 2px' }} />

          <button
            onClick={handleDownloadPDF}
            disabled={downloading.pdf}
            className="btn btn-secondary btn-sm"
            style={{ gap: 'var(--space-1.5)', background: 'rgba(124, 58, 237, 0.1)', color: 'var(--color-accent-violet-light)', borderColor: 'rgba(124, 58, 237, 0.2)' }}
          >
            {downloading.pdf ? (
              <span className="spinner spinner-sm" />
            ) : (
              <FileDown size={14} />
            )}
            <span>PDF Export</span>
          </button>

          <button
            onClick={handleDownloadWord}
            disabled={downloading.word}
            className="btn btn-secondary btn-sm"
            style={{ gap: 'var(--space-1.5)' }}
          >
            {downloading.word ? (
              <span className="spinner spinner-sm" />
            ) : (
              <FileCheck size={14} />
            )}
            <span>Word (.docx)</span>
          </button>

          <button
            onClick={handleDownloadLatex}
            disabled={downloading.latex}
            className="btn btn-secondary btn-sm"
            style={{ gap: 'var(--space-1.5)' }}
          >
            {downloading.latex ? (
              <span className="spinner spinner-sm" />
            ) : (
              <FileCode2 size={14} />
            )}
            <span>LaTeX (.tex)</span>
          </button>

        </div>
      </div>

      {/* 2. Paper Container Render */}
      <div 
        className="preview-panel" 
        style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6) var(--space-4)', position: 'relative' }}
      >
        {/* Realtime Inline Edit Mode Banner */}
        {(isEditing || editedHtml) && (
          <div 
            className="animate-fadeIn" 
            style={{ 
              maxWidth: '816px', 
              margin: '0 auto var(--space-4) auto',
              padding: 'var(--space-3) var(--space-4)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(12px)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              boxShadow: '0 8px 30px rgba(99, 102, 241, 0.08), inset 0 0 10px rgba(99, 102, 241, 0.04)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 'var(--space-3)',
              color: '#1f2937'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2.5)' }}>
              <span style={{ fontSize: '16px' }}>{isEditing ? '📝' : '🔒'}</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-accent-violet-dark)' }}>
                  {isEditing ? 'Direct Inline Editing Enabled' : 'Inline Edits Locked'}
                </span>
                <span style={{ fontSize: '11px', color: '#4b5563', fontWeight: '500', marginTop: '2px' }}>
                  {isEditing 
                    ? 'Click and type anywhere on the sheet to refine text. Edits are captured in PDF downloads.' 
                    : 'Changes saved locally. To revert and reconnect to the Sidebar Editor inputs, click Reset.'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
              {isEditing ? (
                <button 
                  onClick={handleToggleEdit}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '0 var(--space-3)', fontSize: '10px', height: '26px', lineHeight: 1 }}
                >
                  Save Changes
                </button>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ 
                    padding: '0 var(--space-3)', 
                    fontSize: '10px', 
                    height: '26px', 
                    lineHeight: 1,
                    background: '#f3f4f6',
                    color: '#374151',
                    borderColor: '#d1d5db'
                  }}
                >
                  Edit Again
                </button>
              )}
              <button 
                onClick={handleResetInlineEdits}
                className="btn btn-ghost btn-sm"
                style={{ 
                  padding: '0 var(--space-3)', 
                  fontSize: '10px', 
                  height: '26px', 
                  lineHeight: 1,
                  color: '#dc2626', 
                  background: 'rgba(220, 38, 38, 0.05)',
                  border: '1px solid rgba(220, 38, 38, 0.15)'
                }}
              >
                Reset Overrides
              </button>
            </div>
          </div>
        )}

        <div 
          id="resume-capture-root" 
          ref={previewRef}
          style={{ width: '100%', maxWidth: '816px', display: 'flex', justifyContent: 'center', margin: '0 auto' }}
        >
          {TemplateComponent ? (
            <div
              id="resume-capture-root-inner"
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              style={{ 
                width: '100%', 
                outline: 'none',
                cursor: isEditing ? 'text' : 'default',
                border: isEditing ? '1px dashed var(--color-accent-violet-light)' : 'none',
                borderRadius: 'var(--radius-sm)',
                padding: isEditing ? 'var(--space-2)' : '0',
                boxShadow: isEditing ? '0 0 20px rgba(124, 58, 237, 0.15)' : 'none',
                transition: 'all 0.25s ease'
              }}
            >
              {editedHtml ? (
                <div dangerouslySetInnerHTML={{ __html: editedHtml }} />
              ) : (
                <TemplateComponent 
                  resumeData={mappedResumeData} 
                  sectionOrder={sectionOrder} 
                  settings={state.settings}
                />
              )}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-state-icon">❌</span>
              <h3 className="empty-state-title">Template Component Missing</h3>
              <p className="empty-state-description">Failed to load the resume rendering component.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
