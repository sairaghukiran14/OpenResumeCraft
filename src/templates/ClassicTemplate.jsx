/**
 * ClassicTemplate — Traditional single-column resume layout.
 *
 * Features:
 *  - Centered name and title at top
 *  - Contact info in a single row separated by pipe characters
 *  - Uppercase section headers with a horizontal rule
 *  - Serif typography (Georgia)
 *  - Renders sections in the order specified by `sectionOrder`
 */

import React from 'react';
import './TemplateStyles.css';

/* ── helper: format a date string for display ──────────────────────── */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  // If it's already a readable string like "Jan 2023", return as-is
  if (/[a-zA-Z]/.test(dateStr)) return dateStr;
  // Try to parse ISO-style dates
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/* ── helper: build a date range string ─────────────────────────────── */
const dateRange = (start, end, current) => {
  const s = formatDate(start);
  const e = current ? 'Present' : formatDate(end);
  if (!s && !e) return '';
  if (!s) return e;
  if (!e) return s;
  return `${s} – ${e}`;
};

/* ── Contact Row ───────────────────────────────────────────────────── */
const ContactRow = ({ personalInfo }) => {
  if (!personalInfo) return null;

  const items = [
    { type: 'email', value: personalInfo.email },
    { type: 'phone', value: personalInfo.phone, isStatic: true },
    { type: 'location', value: personalInfo.location, isStatic: true },
    { type: 'linkedin', value: personalInfo.linkedin },
    { type: 'website', value: personalInfo.website },
  ].filter(f => f.value);

  if (items.length === 0) return null;

  const renderItemValue = (item) => {
    if (item.isStatic) return item.value;
    if (item.type === 'email') {
      return (
        <a href={`mailto:${item.value}`} className="classic-link" style={{ color: 'inherit', textDecoration: 'none' }}>
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
      <a href={url} target="_blank" rel="noopener noreferrer" className="classic-link" style={{ color: 'inherit', textDecoration: 'none' }}>
        {item.value}
      </a>
    );
  };

  return (
    <div className="classic-contact">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <span className="classic-contact-item">{renderItemValue(item)}</span>
          {i < items.length - 1 && (
            <span className="classic-contact-separator">|</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ── Summary Section ───────────────────────────────────────────────── */
const SummarySection = ({ summary }) => {
  if (!summary) return null;
  return (
    <div className="classic-section">
      <h2 className="classic-section-title">Professional Summary</h2>
      <p className="classic-summary-text">{summary}</p>
    </div>
  );
};

/* ── Experience Section ────────────────────────────────────────────── */
const ExperienceSection = ({ experience }) => {
  if (!experience || experience.length === 0) return null;
  return (
    <div className="classic-section">
      <h2 className="classic-section-title">Experience</h2>
      {experience.map((entry, i) => (
        <div className="classic-entry" key={i}>
          <div className="resume-entry-header">
            <div className="resume-entry-header-left">
              <span className="classic-entry-title">{entry.title}</span>
              <span className="classic-entry-company">
                {entry.company}
                {entry.location && (
                  <span className="classic-entry-location">
                    {' — '}{entry.location}
                  </span>
                )}
              </span>
            </div>
            <span className="classic-entry-dates">
              {dateRange(entry.startDate, entry.endDate, entry.current)}
            </span>
          </div>

          {entry.description && (
            <p className="classic-entry-description">{entry.description}</p>
          )}

          {entry.highlights && entry.highlights.length > 0 && (
            <ul className="classic-bullets">
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

/* ── Education Section ─────────────────────────────────────────────── */
const EducationSection = ({ education }) => {
  if (!education || education.length === 0) return null;
  return (
    <div className="classic-section">
      <h2 className="classic-section-title">Education</h2>
      {education.map((entry, i) => (
        <div className="classic-education-entry" key={i}>
          <div className="resume-entry-header">
            <div className="resume-entry-header-left">
              <span className="classic-education-degree">{entry.degree}</span>
              <span className="classic-education-institution">
                {entry.institution}
                {entry.location && ` — ${entry.location}`}
              </span>
            </div>
            <span className="classic-entry-dates">
              {entry.year || formatDate(entry.endDate) || ''}
            </span>
          </div>
          {(entry.gpa || entry.honors) && (
            <div className="classic-education-details">
              {entry.gpa && <span>GPA: {entry.gpa}</span>}
              {entry.gpa && entry.honors && <span> · </span>}
              {entry.honors && <span>{entry.honors}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Skills Section ────────────────────────────────────────────────── */
const SkillsSection = ({ skills }) => {
  if (!skills || skills.length === 0) return null;
  return (
    <div className="classic-section">
      <h2 className="classic-section-title">Skills</h2>
      {skills.map((cat, i) => (
        <div className="classic-skills-category" key={i}>
          <span className="classic-skills-category-name">{cat.category}: </span>
          <span className="classic-skills-list">
            {Array.isArray(cat.items) ? cat.items.join(', ') : cat.items}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── Projects Section ──────────────────────────────────────────────── */
const ProjectsSection = ({ projects }) => {
  if (!projects || projects.length === 0) return null;
  return (
    <div className="classic-section">
      <h2 className="classic-section-title">Projects</h2>
      {projects.map((proj, i) => {
        const githubUrl = proj.github ? (proj.github.trim().startsWith('http') ? proj.github.trim() : `https://${proj.github.trim()}`) : null;
        const liveUrl = proj.link ? (proj.link.trim().startsWith('http') ? proj.link.trim() : `https://${proj.link.trim()}`) : null;

        return (
          <div className="classic-project-entry" key={i}>
            <div className="resume-entry-header">
              <span className="classic-project-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{proj.name}</span>
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
                    <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="classic-link" style={{ color: '#6366f1', textDecoration: 'none' }}>
                      [GitHub]
                    </a>
                  )}
                  {liveUrl && (
                    <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="classic-link" style={{ color: '#10b981', textDecoration: 'none' }}>
                      [Live Demo]
                    </a>
                  )}
                </span>
              </span>
            </div>
          {proj.technologies && (
            <div className="classic-project-technologies">
              {Array.isArray(proj.technologies)
                ? proj.technologies.join(', ')
                : proj.technologies}
            </div>
          )}
          {proj.description && (
            <p className="classic-project-description">{proj.description}</p>
          )}
          {proj.highlights && proj.highlights.length > 0 && (
            <ul className="classic-bullets">
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

/* ── Certifications Section ────────────────────────────────────────── */
const CertificationsSection = ({ certifications }) => {
  if (!certifications || certifications.length === 0) return null;
  return (
    <div className="classic-section">
      <h2 className="classic-section-title">Certifications</h2>
      {certifications.map((cert, i) => (
        <div className="classic-certification-entry" key={i}>
          <span className="classic-certification-name">{cert.name}</span>
          {cert.issuer && (
            <span className="classic-certification-issuer"> — {cert.issuer}</span>
          )}
          {cert.date && (
            <span className="classic-certification-date"> ({formatDate(cert.date)})</span>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Languages Section ─────────────────────────────────────────────── */
const LanguagesSection = ({ languages }) => {
  if (!languages || languages.length === 0) return null;
  return (
    <div className="classic-section">
      <h2 className="classic-section-title">Languages</h2>
      <div>
        {languages.map((lang, i) => (
          <span className="classic-language-entry" key={i}>
            <span className="classic-language-name">{lang.language}</span>
            {lang.proficiency && (
              <span className="classic-language-proficiency"> ({lang.proficiency})</span>
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
const ClassicTemplate = ({ resumeData = {}, sectionOrder = [], settings = {} }) => {
  const { personalInfo = {} } = resumeData;

  // Fallback section order when none is provided
  const order =
    sectionOrder.length > 0
      ? sectionOrder
      : ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'];

  return (
    <div className="classic-resume">
      <div className={`resume-paper ${settings.compactLayout ? 'compact-layout' : ''}`}>
        {/* Header */}
        <div className="classic-header">
          {personalInfo.name && <h1 className="classic-name">{personalInfo.name}</h1>}
          {personalInfo.title && <div className="classic-title">{personalInfo.title}</div>}
          <ContactRow personalInfo={personalInfo} />
        </div>

        {/* Sections rendered in order */}
        {order.map((sectionId) => renderSection(sectionId, resumeData))}
      </div>
    </div>
  );
};

export default ClassicTemplate;
