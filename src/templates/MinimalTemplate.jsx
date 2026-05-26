/**
 * MinimalTemplate — Ultra-clean resume with maximum whitespace.
 *
 * Design principles:
 *  - Single column, no rules, no borders, no icons
 *  - Name is large but light-weight (font-weight 300)
 *  - Contact info as a simple comma-separated line
 *  - Section headers are just bold text — nothing else
 *  - Generous line spacing (1.6)
 *  - Lets the content breathe
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
        <a href={`mailto:${item.value}`} className="minimal-link" style={{ color: 'inherit', textDecoration: 'none' }}>
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
      <a href={url} target="_blank" rel="noopener noreferrer" className="minimal-link" style={{ color: 'inherit', textDecoration: 'none' }}>
        {item.value}
      </a>
    );
  };

  return (
    <div className="minimal-header">
      {personalInfo.name && <h1 className="minimal-name">{personalInfo.name}</h1>}
      {personalInfo.title && <div className="minimal-title">{personalInfo.title}</div>}
      {contactItems.length > 0 && (
        <div className="minimal-contact">
          {contactItems.map((item, i) => (
            <span className="minimal-contact-item" key={i}>
              {renderItemValue(item)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Summary ───────────────────────────────────────────────────────── */
const SummarySection = ({ summary }) => {
  if (!summary) return null;
  return (
    <div className="minimal-section">
      <h2 className="minimal-section-title">Summary</h2>
      <p className="minimal-summary-text">{summary}</p>
    </div>
  );
};

/* ── Experience ────────────────────────────────────────────────────── */
const ExperienceSection = ({ experience }) => {
  if (!experience || experience.length === 0) return null;
  return (
    <div className="minimal-section">
      <h2 className="minimal-section-title">Experience</h2>
      {experience.map((entry, i) => (
        <div className="minimal-entry" key={i}>
          <div className="minimal-entry-header">
            <div>
              <span className="minimal-entry-title">{entry.title}</span>
              {entry.company && (
                <span className="minimal-entry-company">{' at '}{entry.company}</span>
              )}
              {entry.location && (
                <span className="minimal-entry-location">{' · '}{entry.location}</span>
              )}
            </div>
            <span className="minimal-entry-dates">
              {dateRange(entry.startDate, entry.endDate, entry.current)}
            </span>
          </div>

          {entry.description && (
            <p className="minimal-entry-description">{entry.description}</p>
          )}

          {entry.highlights && entry.highlights.length > 0 && (
            <ul className="minimal-bullets">
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
    <div className="minimal-section">
      <h2 className="minimal-section-title">Education</h2>
      {education.map((entry, i) => (
        <div className="minimal-education-entry" key={i}>
          <div className="resume-entry-header">
            <div>
              <span className="minimal-education-degree">{entry.degree}</span>
              {entry.institution && (
                <span className="minimal-education-institution">
                  {' — '}{entry.institution}
                  {entry.location && `, ${entry.location}`}
                </span>
              )}
            </div>
            <span className="minimal-entry-dates">
              {entry.year || formatDate(entry.endDate) || ''}
            </span>
          </div>
          {(entry.gpa || entry.honors) && (
            <div className="minimal-education-details">
              {entry.gpa && <span>GPA: {entry.gpa}</span>}
              {entry.gpa && entry.honors && ' · '}
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
    <div className="minimal-section">
      <h2 className="minimal-section-title">Skills</h2>
      {skills.map((cat, i) => (
        <div className="minimal-skills-category" key={i}>
          <span className="minimal-skills-category-name">{cat.category}: </span>
          <span className="minimal-skills-list">
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
    <div className="minimal-section">
      <h2 className="minimal-section-title">Projects</h2>
      {projects.map((proj, i) => {
        const githubUrl = proj.github ? (proj.github.trim().startsWith('http') ? proj.github.trim() : `https://${proj.github.trim()}`) : null;
        const liveUrl = proj.link ? (proj.link.trim().startsWith('http') ? proj.link.trim() : `https://${proj.link.trim()}`) : null;

        return (
          <div className="minimal-project-entry" key={i}>
            <span className="minimal-project-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600 }}>{proj.name}</span>
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
                  <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="minimal-project-link" style={{ color: '#6366f1', textDecoration: 'none' }}>
                    [GitHub]
                  </a>
                )}
                {liveUrl && (
                  <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="minimal-project-link" style={{ color: '#10b981', textDecoration: 'none' }}>
                    [Live Demo]
                  </a>
                )}
              </span>
            </span>
          {proj.technologies && (
            <div className="minimal-project-technologies">
              {Array.isArray(proj.technologies)
                ? proj.technologies.join(', ')
                : proj.technologies}
            </div>
          )}
          {proj.description && (
            <p className="minimal-project-description">{proj.description}</p>
          )}
          {proj.highlights && proj.highlights.length > 0 && (
            <ul className="minimal-bullets">
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
    <div className="minimal-section">
      <h2 className="minimal-section-title">Certifications</h2>
      {certifications.map((cert, i) => (
        <div className="minimal-certification-entry" key={i}>
          <span className="minimal-certification-name">{cert.name}</span>
          {cert.issuer && (
            <span className="minimal-certification-issuer"> — {cert.issuer}</span>
          )}
          {cert.date && (
            <span className="minimal-certification-date"> ({formatDate(cert.date)})</span>
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
    <div className="minimal-section">
      <h2 className="minimal-section-title">Languages</h2>
      <div>
        {languages.map((lang, i) => (
          <span className="minimal-language-entry" key={i}>
            <span className="minimal-language-name">{lang.language}</span>
            {lang.proficiency && (
              <span className="minimal-language-proficiency"> ({lang.proficiency})</span>
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
const MinimalTemplate = ({ resumeData = {}, sectionOrder = [], settings = {} }) => {
  const { personalInfo = {} } = resumeData;

  const order =
    sectionOrder.length > 0
      ? sectionOrder
      : ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'];

  return (
    <div className="minimal-resume">
      <div className={`resume-paper ${settings.compactLayout ? 'compact-layout' : ''}`}>
        <Header personalInfo={personalInfo} />
        {order.map((sectionId) => renderSection(sectionId, resumeData))}
      </div>
    </div>
  );
};

export default MinimalTemplate;
