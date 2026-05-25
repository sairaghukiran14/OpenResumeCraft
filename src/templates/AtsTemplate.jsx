/**
 * AtsTemplate — ATS-Optimized resume template.
 *
 * Designed for maximum parsability by Applicant Tracking Systems:
 *  - Single column, no tables, no columns, no images
 *  - No colors beyond black and dark grey
 *  - Standard fonts (Arial)
 *  - Clear section headers with simple underlines
 *  - Plain text formatting, no decorative elements
 *  - Every piece of text is directly selectable and parsable
 */

import React from 'react';
import './TemplateStyles.css';

/* ── Helpers ───────────────────────────────────────────────────────── */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  if (/[a-zA-Z]/.test(dateStr)) return dateStr;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const dateRange = (start, end, current) => {
  const s = formatDate(start);
  const e = current ? 'Present' : formatDate(end);
  if (!s && !e) return '';
  if (!s) return e;
  if (!e) return s;
  return `${s} – ${e}`;
};

/* ── Header ────────────────────────────────────────────────────────── */
const Header = ({ personalInfo }) => {
  if (!personalInfo) return null;

  const contactItems = [
    { type: 'email', value: personalInfo.email },
    { type: 'phone', value: personalInfo.phone, isStatic: true },
    { type: 'location', value: personalInfo.location, isStatic: true },
    { type: 'linkedin', value: personalInfo.linkedin },
    { type: 'website', value: personalInfo.website },
  ].filter(f => f.value);

  const renderItemValue = (item) => {
    if (item.isStatic) return item.value;
    if (item.type === 'email') {
      return (
        <a href={`mailto:${item.value}`} className="ats-link" style={{ color: 'inherit', textDecoration: 'none' }}>
          {item.value}
        </a>
      );
    }
    
    // Website & LinkedIn urls
    let url = item.value.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="ats-link" style={{ color: 'inherit', textDecoration: 'none' }}>
        {item.value}
      </a>
    );
  };

  return (
    <div className="ats-header">
      {personalInfo.name && <h1 className="ats-name">{personalInfo.name}</h1>}
      {personalInfo.title && <div className="ats-title">{personalInfo.title}</div>}
      {contactItems.length > 0 && (
        <div className="ats-contact">
          <div className="ats-contact-row">
            {contactItems.map((item, i) => (
              <React.Fragment key={i}>
                <span className="ats-contact-item">{renderItemValue(item)}</span>
                {i < contactItems.length - 1 && (
                  <span className="ats-contact-separator">|</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Summary ───────────────────────────────────────────────────────── */
const SummarySection = ({ summary }) => {
  if (!summary) return null;
  return (
    <div className="ats-section">
      <h2 className="ats-section-title">Professional Summary</h2>
      <p className="ats-summary-text">{summary}</p>
    </div>
  );
};

/* ── Experience ────────────────────────────────────────────────────── */
const ExperienceSection = ({ experience }) => {
  if (!experience || experience.length === 0) return null;
  return (
    <div className="ats-section">
      <h2 className="ats-section-title">Professional Experience</h2>
      {experience.map((entry, i) => (
        <div className="ats-entry" key={i}>
          <div className="resume-entry-header">
            <div className="resume-entry-header-left">
              <span className="ats-entry-title">{entry.title}</span>
              <span className="ats-entry-company">{entry.company}</span>
            </div>
            <span className="resume-entry-dates">
              {dateRange(entry.startDate, entry.endDate, entry.current)}
            </span>
          </div>
          {entry.location && (
            <div className="ats-entry-meta">{entry.location}</div>
          )}

          {entry.description && (
            <p className="ats-entry-description">{entry.description}</p>
          )}

          {entry.highlights && entry.highlights.length > 0 && (
            <ul className="ats-bullets">
              {entry.highlights.map((h, j) => (
                <li key={j}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Education ─────────────────────────────────────────────────────── */
const EducationSection = ({ education }) => {
  if (!education || education.length === 0) return null;
  return (
    <div className="ats-section">
      <h2 className="ats-section-title">Education</h2>
      {education.map((entry, i) => (
        <div className="ats-education-entry" key={i}>
          <div className="resume-entry-header">
            <div className="resume-entry-header-left">
              <span className="ats-education-degree">{entry.degree}</span>
              <span className="ats-education-institution">
                {entry.institution}
                {entry.location && `, ${entry.location}`}
              </span>
            </div>
            <span className="resume-entry-dates">
              {entry.year || formatDate(entry.endDate) || ''}
            </span>
          </div>
          {(entry.gpa || entry.honors) && (
            <div className="ats-education-details">
              {entry.gpa && <span>GPA: {entry.gpa}</span>}
              {entry.gpa && entry.honors && ' | '}
              {entry.honors && <span>{entry.honors}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Skills ────────────────────────────────────────────────────────── */
const SkillsSection = ({ skills }) => {
  if (!skills || skills.length === 0) return null;
  return (
    <div className="ats-section">
      <h2 className="ats-section-title">Skills</h2>
      {skills.map((cat, i) => (
        <div className="ats-skills-category" key={i}>
          <span className="ats-skills-category-name">{cat.category}: </span>
          <span className="ats-skills-list">
            {Array.isArray(cat.items) ? cat.items.join(', ') : cat.items}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── Projects ──────────────────────────────────────────────────────── */
const ProjectsSection = ({ projects }) => {
  if (!projects || projects.length === 0) return null;
  return (
    <div className="ats-section">
      <h2 className="ats-section-title">Projects</h2>
      {projects.map((proj, i) => {
        const githubUrl = proj.github ? (proj.github.trim().startsWith('http') ? proj.github.trim() : `https://${proj.github.trim()}`) : null;
        const liveUrl = proj.link ? (proj.link.trim().startsWith('http') ? proj.link.trim() : `https://${proj.link.trim()}`) : null;

        return (
          <div className="ats-project-entry" key={i}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <span className="ats-project-name" style={{ fontWeight: 700 }}>{proj.name}</span>
              {proj.status && (
                <span style={{ 
                  fontSize: '9px', 
                  padding: '1px 5px', 
                  borderRadius: '4px', 
                  background: 'rgba(99, 102, 241, 0.06)', 
                  color: '#4f46e5', 
                  fontWeight: 600, 
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  lineHeight: 1
                }}>
                  {proj.status}
                </span>
              )}
              <span style={{ display: 'flex', gap: '6px', fontSize: '10.5px', fontWeight: 400 }}>
                {githubUrl && (
                  <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="ats-link" style={{ color: '#6366f1', textDecoration: 'none' }}>
                    [GitHub]
                  </a>
                )}
                {liveUrl && (
                  <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="ats-link" style={{ color: '#10b981', textDecoration: 'none' }}>
                    [Live Demo]
                  </a>
                )}
              </span>
            </div>
          {proj.technologies && (
            <div className="ats-project-technologies">
              Technologies: {Array.isArray(proj.technologies)
                ? proj.technologies.join(', ')
                : proj.technologies}
            </div>
          )}
          {proj.description && (
            <p className="ats-project-description">{proj.description}</p>
          )}
          {proj.highlights && proj.highlights.length > 0 && (
            <ul className="ats-project-bullets">
              {proj.highlights.map((h, j) => (
                <li key={j}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      );
      })}
    </div>
  );
};

/* ── Certifications ────────────────────────────────────────────────── */
const CertificationsSection = ({ certifications }) => {
  if (!certifications || certifications.length === 0) return null;
  return (
    <div className="ats-section">
      <h2 className="ats-section-title">Certifications</h2>
      {certifications.map((cert, i) => (
        <div className="ats-certification-entry" key={i}>
          <span className="ats-certification-name">{cert.name}</span>
          {cert.issuer && (
            <span className="ats-certification-issuer"> — {cert.issuer}</span>
          )}
          {cert.date && (
            <span className="ats-certification-date"> ({formatDate(cert.date)})</span>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Languages ─────────────────────────────────────────────────────── */
const LanguagesSection = ({ languages }) => {
  if (!languages || languages.length === 0) return null;
  return (
    <div className="ats-section">
      <h2 className="ats-section-title">Languages</h2>
      <div>
        {languages.map((lang, i) => (
          <span className="ats-language-entry" key={i}>
            <span className="ats-language-name">{lang.language}</span>
            {lang.proficiency && (
              <span className="ats-language-proficiency"> ({lang.proficiency})</span>
            )}
            {i < languages.length - 1 && ', '}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ── Section Router ────────────────────────────────────────────────── */
const renderSection = (sectionId, resumeData) => {
  switch (sectionId) {
    case 'summary':
      return <SummarySection key={sectionId} summary={resumeData.summary} />;
    case 'experience':
      return <ExperienceSection key={sectionId} experience={resumeData.experience} />;
    case 'education':
      return <EducationSection key={sectionId} education={resumeData.education} />;
    case 'skills':
      return <SkillsSection key={sectionId} skills={resumeData.skills} />;
    case 'projects':
      return <ProjectsSection key={sectionId} projects={resumeData.projects} />;
    case 'certifications':
      return <CertificationsSection key={sectionId} certifications={resumeData.certifications} />;
    case 'languages':
      return <LanguagesSection key={sectionId} languages={resumeData.languages} />;
    default:
      return null;
  }
};

/* ── Main Component ────────────────────────────────────────────────── */
const AtsTemplate = ({ resumeData = {}, sectionOrder = [] }) => {
  const { personalInfo = {} } = resumeData;

  const order =
    sectionOrder.length > 0
      ? sectionOrder
      : ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'];

  return (
    <div className="ats-resume">
      <div className="resume-paper">
        <Header personalInfo={personalInfo} />
        {order.map((sectionId) => renderSection(sectionId, resumeData))}
      </div>
    </div>
  );
};

export default AtsTemplate;
