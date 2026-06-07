import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { exportToPDF } from '../../services/exportPDF';
import { 
  Copy, 
  Check, 
  FileDown, 
  Mail, 
  Phone, 
  Link, 
  Globe, 
  MapPin, 
  FileText 
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * CoverLetterPreview Component.
 * ----------------------------
 * Renders the formal document sheet preview for the cover letter.
 *
 * @returns {React.ReactElement} The rendered preview page.
 */
export default function CoverLetterPreview() {
  const { state } = useApp();
  const { coverLetter, resumeData, selectedTemplate } = state;
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const contactInfo = resumeData.contactInfo || {};
  const name = contactInfo.name || 'Candidate Name';
  const title = contactInfo.title || 'Professional Title';

  const handleCopy = async () => {
    if (!coverLetter.text) return;
    try {
      await navigator.clipboard.writeText(coverLetter.text);
      setCopied(true);
      toast.success('Cover letter copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy text');
    }
  };

  const handleDownloadPDF = async () => {
    if (!coverLetter.text) return;
    setDownloading(true);
    toast.info('Preparing PDF document...');

    try {
      const cleanFileName = `${name.replace(/\s+/g, '_')}_Cover_Letter`;
      await exportToPDF('cover-letter-capture-root', cleanFileName, {
        paperSize: 'letter',
        margin: 0.75, // Standard formal letter margin
        quality: 'high'
      });
      toast.success('Cover letter PDF downloaded successfully!');
    } catch (err) {
      toast.error('Failed to export PDF', { description: err.message });
    } finally {
      setDownloading(false);
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Split text by paragraphs for clean spacing
  const paragraphs = coverLetter.text
    ? coverLetter.text.split('\n\n').filter(p => p.trim())
    : [];

  return (
    <div className="preview-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      
      {/* 1. Action Toolbar */}
      <div className="preview-actions" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-3.5) var(--space-6)',
        background: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border-primary)',
        gap: 'var(--space-4)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <FileText size={15} style={{ color: 'var(--color-accent-violet-dark)' }} />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Document Preview
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={handleCopy}
            disabled={!coverLetter.text}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)', minWidth: '100px', justifyContent: 'center' }}
          >
            {copied ? (
              <>
                <Check size={13} style={{ color: 'var(--color-success)' }} />
                <span style={{ color: 'var(--color-success)' }}>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={!coverLetter.text || downloading}
            className="btn btn-primary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-1.5)',
              minWidth: '120px',
              background: 'linear-gradient(135deg, var(--color-accent-violet-dark), #6366f1)',
              border: 'none',
              fontWeight: '600'
            }}
          >
            {downloading ? (
              <>
                <div className="generating-spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', margin: 0 }} />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <FileDown size={13} />
                <span>Export PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Paper Canvas Scroll Area */}
      <div className="preview-scroll-container" style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-8) 0', display: 'flex', justifyContent: 'center', background: 'var(--color-bg-tertiary)' }}>
        
        {coverLetter.text ? (
          <div 
            id="cover-letter-capture-root"
            className={`resume-paper template-${selectedTemplate}`}
            style={{
              background: '#ffffff',
              color: '#1e293b',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
              borderRadius: '2px',
              width: '100%',
              maxWidth: '800px',
              minHeight: '1030px', // Standard letter proportions
              padding: '60px 75px', // 0.75-inch margins
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              lineHeight: '1.6'
            }}
          >
            {/* Header Letterhead */}
            <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '35px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e1b4b', margin: '0 0 4px 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                {name}
              </h1>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#4f46e5', marginBottom: '15px' }}>
                {title}
              </div>

              {/* Contact Icons Row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '12px', color: '#64748b' }}>
                {contactInfo.email && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={12} style={{ color: '#4f46e5' }} />
                    {contactInfo.email}
                  </span>
                )}
                {contactInfo.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={12} style={{ color: '#4f46e5' }} />
                    {contactInfo.phone}
                  </span>
                )}
                {contactInfo.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={12} style={{ color: '#4f46e5' }} />
                    {contactInfo.location}
                  </span>
                )}
                {contactInfo.linkedin && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Link size={12} style={{ color: '#4f46e5' }} />
                    {contactInfo.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '')}
                  </span>
                )}
                {contactInfo.website && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Globe size={12} style={{ color: '#4f46e5' }} />
                    {contactInfo.website.replace(/^(https?:\/\/)?(www\.)?/, '')}
                  </span>
                )}
              </div>
            </div>

            {/* Recipient Details & Date */}
            <div style={{ marginBottom: '30px', fontSize: '13px', color: '#475569' }}>
              <div style={{ marginBottom: '6px', fontWeight: '500' }}>{formattedDate}</div>
              <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>Hiring Team / recruiter</div>
              <div>Target Company Representative</div>
            </div>

            {/* Letter Body paragraphs */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', color: '#334155', fontSize: '14.5px', textAlign: 'justify' }}>
              {paragraphs.map((p, index) => {
                // Check if it's the sign-off paragraph or salutation
                const text = p.trim();
                const isSalutation = text.startsWith('Dear') || text.endsWith(',');
                const isSignoff = text.startsWith('Sincerely') || text.startsWith('Best regards') || text.startsWith('Respectfully');

                if (isSalutation) {
                  return (
                    <div key={index} style={{ fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                      {text}
                    </div>
                  );
                }

                if (isSignoff) {
                  const commaIndex = text.indexOf(',');
                  let valediction = text;
                  let signatureName = name;

                  if (commaIndex !== -1 && commaIndex < 20) {
                    valediction = text.substring(0, commaIndex + 1).trim();
                    const remainder = text.substring(commaIndex + 1).trim();
                    if (remainder) {
                      signatureName = remainder;
                    }
                  }

                  return (
                    <div key={index} style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
                      <div>
                        {valediction}
                      </div>
                      <div style={{ fontWeight: '700', color: '#1e293b' }}>
                        {signatureName}
                      </div>
                    </div>
                  );
                }

                return (
                  <p key={index} style={{ margin: 0 }}>
                    {text}
                  </p>
                );
              })}
            </div>

          </div>
        ) : (
          /* Empty placeholder state */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--color-bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed var(--color-border-primary)'
            }}>
              <FileText size={24} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-1) 0' }}>
                No Cover Letter Generated
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 0, maxWidth: '280px', lineHeight: 1.4 }}>
                Select a style and click <strong>Generate Cover Letter</strong> in the editor pane to compile your document.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
