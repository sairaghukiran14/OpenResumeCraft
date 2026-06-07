/**
 * ModernTemplate — Two-column resume with a dark sidebar.
 *
 * Layout:
 *  - Left sidebar (30%): name, contact info, skills, certifications, languages
 *  - Main content (70%): summary, experience, education, projects
 *  - Section headers accented with a violet left border
 *  - Sans-serif typography (system-ui)
 *
 * Sections are split between sidebar and main based on their type.
 * The `sectionOrder` prop controls ordering within each area.
 */

import React from 'react';
import './TemplateStyles.css';

/* ── Sidebar sections ──────────────────────────────────────────────── */
const SIDEBAR_SECTIONS = new Set(['skills', 'certifications', 'languages']);

import { formatSingleDate } from '../utils/dateFormatter';

/* ── Helpers ───────────────────────────────────────────────────────── */
const formatDate = (dateStr) => {
  return formatSingleDate(dateStr);
};

const dateRange = (start, end, current) => {
  const s = formatDate(start);
  const e = current ? 'Present' : formatDate(end);
  if (!s && !e) return '';
  if (!s) return e;
  if (!e) return s;
  return `${s} – ${e}`;
};

/* ── Sidebar: Contact ──────────────────────────────────────────────── */
const SidebarContact = ({ personalInfo }) => {
  if (!personalInfo) return null;

  const contactFields = [
    { label: 'Email', value: personalInfo.email, type: 'email' },
    { label: 'Phone', value: personalInfo.phone, isStatic: true },
    { label: 'Location', value: personalInfo.location, isStatic: true },
    { label: 'LinkedIn', value: personalInfo.linkedin, type: 'link' },
    { label: 'Website', value: personalInfo.website, type: 'link' },
  ].filter((f) => f.value);

  if (contactFields.length === 0) return null;

  const renderFieldValue = (field) => {
    if (field.isStatic) return field.value;
    if (field.type === 'email') {
      return (
        <a href={`mailto:${field.value}`} className="modern-contact-link" style={{ color: 'inherit', textDecoration: 'none' }}>
          {field.value}
        </a>
      );
    }
    
    // Website & LinkedIn urls
    let url = field.value.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="modern-contact-link" style={{ color: 'inherit', textDecoration: 'none' }}>
        {field.value}
      </a>
    );
  };

  return (
    <div className="modern-sidebar-section">
      <h3 className="modern-sidebar-section-title">Contact</h3>
      <div className="modern-contact-list">
        {contactFields.map((field, i) => (
          <div className="modern-contact-item" key={i}>
            <span className="modern-contact-label">{field.label}</span>
            {renderFieldValue(field)}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Sidebar: Skills ───────────────────────────────────────────────── */
const SidebarSkills = ({ skills }) => {
  if (!skills || skills.length === 0) return null;
  return (
    <div className="modern-sidebar-section">
      <h3 className="modern-sidebar-section-title">Skills</h3>
      {skills.map((cat, i) => (
        <div className="modern-skill-category" key={i}>
          <div className="modern-skill-category-name">{cat.category}</div>
          <div className="modern-skill-tags">
            {(Array.isArray(cat.items) ? cat.items : [cat.items]).map((skill, j) => (
              <span className="modern-skill-tag" key={j}>{skill}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── Sidebar: Certifications ───────────────────────────────────────── */
const SidebarCertifications = ({ certifications }) => {
  if (!certifications || certifications.length === 0) return null;
  return (
    <div className="modern-sidebar-section">
      <h3 className="modern-sidebar-section-title">Certifications</h3>
      {certifications.map((cert, i) => (
        <div className="modern-cert-entry" key={i}>
          <div className="modern-cert-name">{cert.name}</div>
          {cert.issuer && <div className="modern-cert-issuer">{cert.issuer}</div>}
          {cert.date && <div className="modern-cert-date">{formatDate(cert.date)}</div>}
        </div>
      ))}
    </div>
  );
};

/* ── Sidebar: Languages ────────────────────────────────────────────── */
const SidebarLanguages = ({ languages }) => {
  if (!languages || languages.length === 0) return null;
  return (
    <div className="modern-sidebar-section">
      <h3 className="modern-sidebar-section-title">Languages</h3>
      {languages.map((lang, i) => (
        <div className="modern-language-entry" key={i}>
          <span className="modern-language-name">{lang.language}</span>
          {lang.proficiency && (
            <span className="modern-language-proficiency">{lang.proficiency}</span>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Main: Summary ─────────────────────────────────────────────────── */
const SummarySection = ({ summary }) => {
  if (!summary) return null;
  return (
    <div className="modern-section">
      <h2 className="modern-section-title">Summary</h2>
      <p className="modern-summary-text">{summary}</p>
    </div>
  );
};

/* ── Main: Experience ──────────────────────────────────────────────── */
const ExperienceSection = ({ experience }) => {
  if (!experience || experience.length === 0) return null;
  return (
    <div className="modern-section">
      <h2 className="modern-section-title">Experience</h2>
      {experience.map((entry, i) => (
        <div className="modern-entry" key={i}>
          <div className="modern-entry-title">{entry.title}</div>
          <div className="modern-entry-company">{entry.company}</div>
          <div className="modern-entry-meta">
            {[entry.location, dateRange(entry.startDate, entry.endDate, entry.current)]
              .filter(Boolean)
              .join(' · ')}
          </div>

          {entry.description && (
            <p className="modern-entry-description">{entry.description}</p>
          )}

          {entry.highlights && entry.highlights.length > 0 && (
            <ul className="modern-bullets">
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

/* ── Main: Education ───────────────────────────────────────────────── */
const EducationSection = ({ education }) => {
  if (!education || education.length === 0) return null;
  return (
    <div className="modern-section">
      <h2 className="modern-section-title">Education</h2>
      {education.map((entry, i) => (
        <div className="modern-education-entry" key={i}>
          <div className="modern-education-degree">{entry.degree}</div>
          <div className="modern-education-institution">
            {entry.institution}
            {entry.location && ` — ${entry.location}`}
          </div>
          <div className="modern-education-details">
            {[
              entry.year || formatDate(entry.endDate),
              entry.gpa && `GPA: ${entry.gpa}`,
              entry.honors,
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── Main: Projects ────────────────────────────────────────────────── */
const ProjectsSection = ({ projects }) => {
  if (!projects || projects.length === 0) return null;
  return (
    <div className="modern-section">
      <h2 className="modern-section-title">Projects</h2>
      {projects.map((proj, i) => {
        const githubUrl = proj.github ? (proj.github.trim().startsWith('http') ? proj.github.trim() : `https://${proj.github.trim()}`) : null;
        const liveUrl = proj.link ? (proj.link.trim().startsWith('http') ? proj.link.trim() : `https://${proj.link.trim()}`) : null;

        return (
          <div className="modern-project-entry" key={i}>
            <div>
              <span className="modern-project-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                    <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="modern-project-link" style={{ color: '#6366f1', textDecoration: 'none' }}>
                      [GitHub]
                    </a>
                  )}
                  {liveUrl && (
                    <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="modern-project-link" style={{ color: '#10b981', textDecoration: 'none' }}>
                      [Live Demo]
                    </a>
                  )}
                </span>
              </span>
            </div>
          {proj.technologies && (
            <div className="modern-project-technologies">
              {Array.isArray(proj.technologies)
                ? proj.technologies.join(', ')
                : proj.technologies}
            </div>
          )}
          {proj.description && (() => {
            const bullets = proj.description.split(/[\n•*]+/).map(b => b.trim()).filter(Boolean);
            if (bullets.length <= 1) {
              return <p className="modern-project-description">{proj.description}</p>;
            }
            return (
              <ul className="modern-project-bullets" style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                {bullets.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            );
          })()}
          {proj.highlights && proj.highlights.length > 0 && (
            <ul className="modern-project-bullets">
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

/* ── Sidebar Section Router ────────────────────────────────────────── */
const renderSidebarSection = (sectionId, resumeData) => {
  switch (sectionId) {
    case 'skills':
      return <SidebarSkills key={sectionId} skills={resumeData.skills} />;
    case 'certifications':
      return <SidebarCertifications key={sectionId} certifications={resumeData.certifications} />;
    case 'languages':
      return <SidebarLanguages key={sectionId} languages={resumeData.languages} />;
    default:
      return null;
  }
};

/* ── Main Section Router ───────────────────────────────────────────── */
const renderMainSection = (sectionId, resumeData) => {
  switch (sectionId) {
    case 'summary':
      return <SummarySection key={sectionId} summary={resumeData.summary} />;
    case 'experience':
      return <ExperienceSection key={sectionId} experience={resumeData.experience} />;
    case 'education':
      return <EducationSection key={sectionId} education={resumeData.education} />;
    case 'projects':
      return <ProjectsSection key={sectionId} projects={resumeData.projects} />;
    default:
      return null;
  }
};

/**
 * ModernTemplate Component.
 * -------------------------
 * Renders the Modern resume template.
 *
 * Design Characteristics:
 *   - Sleek, two-column split layout (left sidebar, right main panel).
 *   - Darker background sidebar with dynamic HSL margins.
 *   - Segregates contact info and skills (sidebar) from professional achievements (main canvas).
 *   - Outstanding first visual impression for technology companies and digital products teams.
 *
 * @param {object} props - Component properties.
 *   - resumeData {object}: Normalized candidate data map.
 *   - sectionOrder {Array<string>}: Array defining custom section visual priorities.
 *   - settings {object}: Canvas parameters like compact spacing.
 * @returns {React.ReactElement} The rendered Modern sheet element.
 */
const ModernTemplate = ({ resumeData = {}, sectionOrder = [], settings = {} }) => {
  const { personalInfo = {} } = resumeData;

  const order =
    sectionOrder.length > 0
      ? sectionOrder
      : ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'];

  // Split sections into sidebar vs main, preserving the user's order
  const sidebarOrder = order.filter((id) => SIDEBAR_SECTIONS.has(id));
  const mainOrder = order.filter((id) => !SIDEBAR_SECTIONS.has(id));

  return (
    <div className="modern-resume">
      <div className={`resume-paper ${settings.compactLayout ? 'compact-layout' : ''}`}>
        {/* ── Sidebar ────────────────────────────────── */}
        <aside className="modern-sidebar">
          {/* Identity */}
          <div>
            {personalInfo.name && (
              <div className="modern-sidebar-name">{personalInfo.name}</div>
            )}
            {personalInfo.title && (
              <div className="modern-sidebar-title">{personalInfo.title}</div>
            )}
          </div>

          {/* Contact info is always first in sidebar */}
          <SidebarContact personalInfo={personalInfo} />

          {/* Sidebar sections in user order */}
          {sidebarOrder.map((id) => renderSidebarSection(id, resumeData))}
        </aside>

        {/* ── Main Content ───────────────────────────── */}
        <main className="modern-main">
          {mainOrder.map((id) => renderMainSection(id, resumeData))}
        </main>
      </div>
    </div>
  );
};

export default ModernTemplate;
