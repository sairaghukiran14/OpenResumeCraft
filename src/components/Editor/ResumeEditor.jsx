import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateId, sectionLabels } from '../../data/defaultResume';
import { 
  User, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Code, 
  Award, 
  FolderGit2, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  X,
  PlusCircle
} from 'lucide-react';

export default function ResumeEditor() {
  const { state, dispatch } = useApp();
  const { resumeData, sectionOrder } = state;
  const [collapsedSections, setCollapsedSections] = useState({
    contactInfo: false,
    summary: false,
    experience: false,
    education: false,
    skills: false,
    certifications: false,
    projects: false,
  });

  const toggleSectionCollapse = (sectKey) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectKey]: !prev[sectKey]
    }));
  };

  // ─── Contact Info Handlers ──────────────────────────────────────────
  const handleContactChange = (field, val) => {
    const updatedContact = {
      ...resumeData.contactInfo,
      [field]: val
    };
    dispatch({
      type: 'UPDATE_SECTION',
      payload: { section: 'contactInfo', data: updatedContact }
    });
  };

  // ─── Summary Handlers ──────────────────────────────────────────────
  const handleSummaryChange = (val) => {
    dispatch({
      type: 'UPDATE_SECTION',
      payload: { section: 'summary', data: val }
    });
  };

  // ─── Experience Handlers ───────────────────────────────────────────
  const addExperience = () => {
    const newExp = {
      id: generateId('exp'),
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      bullets: ['']
    };
    dispatch({
      type: 'ADD_ENTRY',
      payload: { section: 'experience', entry: newExp }
    });
  };

  const updateExperience = (id, field, val) => {
    const entry = resumeData.experience.find(e => e.id === id);
    if (!entry) return;
    const updatedEntry = { ...entry, [field]: val };
    dispatch({
      type: 'UPDATE_ENTRY',
      payload: { section: 'experience', id, data: updatedEntry }
    });
  };

  const removeExperience = (id) => {
    dispatch({
      type: 'REMOVE_ENTRY',
      payload: { section: 'experience', id }
    });
  };

  const addExperienceBullet = (expId) => {
    const entry = resumeData.experience.find(e => e.id === expId);
    if (!entry) return;
    const updatedEntry = {
      ...entry,
      bullets: [...(entry.bullets || []), '']
    };
    dispatch({
      type: 'UPDATE_ENTRY',
      payload: { section: 'experience', id: expId, data: updatedEntry }
    });
  };

  const updateExperienceBullet = (expId, bulletIdx, val) => {
    const entry = resumeData.experience.find(e => e.id === expId);
    if (!entry) return;
    const newBullets = [...entry.bullets];
    newBullets[bulletIdx] = val;
    const updatedEntry = { ...entry, bullets: newBullets };
    dispatch({
      type: 'UPDATE_ENTRY',
      payload: { section: 'experience', id: expId, data: updatedEntry }
    });
  };

  const removeExperienceBullet = (expId, bulletIdx) => {
    const entry = resumeData.experience.find(e => e.id === expId);
    if (!entry) return;
    const newBullets = entry.bullets.filter((_, idx) => idx !== bulletIdx);
    const updatedEntry = { ...entry, bullets: newBullets };
    dispatch({
      type: 'UPDATE_ENTRY',
      payload: { section: 'experience', id: expId, data: updatedEntry }
    });
  };

  // ─── Education Handlers ────────────────────────────────────────────
  const addEducation = () => {
    const newEdu = {
      id: generateId('edu'),
      degree: '',
      institution: '',
      location: '',
      year: '',
      gpa: ''
    };
    dispatch({
      type: 'ADD_ENTRY',
      payload: { section: 'education', entry: newEdu }
    });
  };

  const updateEducation = (id, field, val) => {
    const entry = resumeData.education.find(e => e.id === id);
    if (!entry) return;
    const updatedEntry = { ...entry, [field]: val };
    dispatch({
      type: 'UPDATE_ENTRY',
      payload: { section: 'education', id, data: updatedEntry }
    });
  };

  const removeEducation = (id) => {
    dispatch({
      type: 'REMOVE_ENTRY',
      payload: { section: 'education', id }
    });
  };

  // ─── Skills Handlers ───────────────────────────────────────────────
  const [techInput, setTechInput] = useState('');
  const [softInput, setSoftInput] = useState('');
  const [toolsInput, setToolsInput] = useState('');

  const addSkillTag = (type, tag, setInput) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    
    // Avoid duplicates
    if (resumeData.skills[type].includes(trimmed)) {
      setInput('');
      return;
    }

    const updatedSkills = {
      ...resumeData.skills,
      [type]: [...(resumeData.skills[type] || []), trimmed]
    };

    dispatch({
      type: 'UPDATE_SECTION',
      payload: { section: 'skills', data: updatedSkills }
    });
    setInput('');
  };

  const removeSkillTag = (type, tagIndex) => {
    const updatedSkills = {
      ...resumeData.skills,
      [type]: resumeData.skills[type].filter((_, idx) => idx !== tagIndex)
    };

    dispatch({
      type: 'UPDATE_SECTION',
      payload: { section: 'skills', data: updatedSkills }
    });
  };

  // ─── Projects Handlers ─────────────────────────────────────────────
  const addProject = () => {
    const newProj = {
      id: generateId('proj'),
      name: '',
      description: '',
      technologies: [],
      link: '',
      github: '',
      status: ''
    };
    dispatch({
      type: 'ADD_ENTRY',
      payload: { section: 'projects', entry: newProj }
    });
  };

  const updateProject = (id, field, val) => {
    const entry = resumeData.projects.find(e => e.id === id);
    if (!entry) return;

    let updatedEntry;
    if (field === 'technologies') {
      updatedEntry = { 
        ...entry, 
        technologies: typeof val === 'string' ? val.split(',').map(t => t.trim()).filter(Boolean) : val 
      };
    } else {
      updatedEntry = { ...entry, [field]: val };
    }

    dispatch({
      type: 'UPDATE_ENTRY',
      payload: { section: 'projects', id, data: updatedEntry }
    });
  };

  const removeProject = (id) => {
    dispatch({
      type: 'REMOVE_ENTRY',
      payload: { section: 'projects', id }
    });
  };

  // ─── Certifications Handlers ───────────────────────────────────────
  const addCertification = () => {
    const newCert = {
      id: generateId('cert'),
      name: '',
      issuer: '',
      year: ''
    };
    dispatch({
      type: 'ADD_ENTRY',
      payload: { section: 'certifications', entry: newCert }
    });
  };

  const updateCertification = (id, field, val) => {
    const entry = resumeData.certifications.find(e => e.id === id);
    if (!entry) return;
    const updatedEntry = { ...entry, [field]: val };
    dispatch({
      type: 'UPDATE_ENTRY',
      payload: { section: 'certifications', id, data: updatedEntry }
    });
  };

  const removeCertification = (id) => {
    dispatch({
      type: 'REMOVE_ENTRY',
      payload: { section: 'certifications', id }
    });
  };

  // ─── Render Helper Icons ───────────────────────────────────────────
  const getSectionIcon = (key) => {
    switch (key) {
      case 'contactInfo': return <User size={16} />;
      case 'summary': return <FileText size={16} />;
      case 'experience': return <Briefcase size={16} />;
      case 'education': return <GraduationCap size={16} />;
      case 'skills': return <Code size={16} />;
      case 'certifications': return <Award size={16} />;
      case 'projects': return <FolderGit2 size={16} />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div className="resume-editor">
      
      {/* 1. CONTACT INFO */}
      <div className="editor-section">
        <div className="editor-section-header" onClick={() => toggleSectionCollapse('contactInfo')}>
          <div className="editor-section-title">
            {getSectionIcon('contactInfo')}
            <span>{sectionLabels.contactInfo}</span>
          </div>
          <button className="btn-ghost btn-icon btn-sm">
            {collapsedSections.contactInfo ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
        
        {!collapsedSections.contactInfo && (
          <div className="editor-section-content">
            <div className="editor-row">
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={resumeData.contactInfo.name || ''}
                  onChange={(e) => handleContactChange('name', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. alex@example.com"
                  value={resumeData.contactInfo.email || ''}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="editor-row">
              <div className="input-group">
                <label className="input-label">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 123-4567"
                  value={resumeData.contactInfo.phone || ''}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Location (City, State)</label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={resumeData.contactInfo.location || ''}
                  onChange={(e) => handleContactChange('location', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="editor-row">
              <div className="input-group">
                <label className="input-label">LinkedIn URL</label>
                <input
                  type="text"
                  placeholder="e.g. linkedin.com/in/username"
                  value={resumeData.contactInfo.linkedin || ''}
                  onChange={(e) => handleContactChange('linkedin', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Personal Website / GitHub</label>
                <input
                  type="text"
                  placeholder="e.g. yourportfolio.com"
                  value={resumeData.contactInfo.website || ''}
                  onChange={(e) => handleContactChange('website', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. PROFESSIONAL SUMMARY */}
      <div className="editor-section">
        <div className="editor-section-header" onClick={() => toggleSectionCollapse('summary')}>
          <div className="editor-section-title">
            {getSectionIcon('summary')}
            <span>{sectionLabels.summary}</span>
          </div>
          <button className="btn-ghost btn-icon btn-sm">
            {collapsedSections.summary ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {!collapsedSections.summary && (
          <div className="editor-section-content">
            <div className="input-group">
              <textarea
                placeholder="Write a brief, high-impact professional summary about your career goals and qualifications..."
                value={resumeData.summary || ''}
                onChange={(e) => handleSummaryChange(e.target.value)}
                className="textarea-field"
                style={{ minHeight: '100px' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. WORK EXPERIENCE */}
      <div className="editor-section">
        <div className="editor-section-header" onClick={() => toggleSectionCollapse('experience')}>
          <div className="editor-section-title">
            {getSectionIcon('experience')}
            <span>{sectionLabels.experience}</span>
          </div>
          <button className="btn-ghost btn-icon btn-sm">
            {collapsedSections.experience ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {!collapsedSections.experience && (
          <div className="editor-section-content">
            {resumeData.experience.map((exp, idx) => (
              <div className="editor-entry animate-fadeIn" key={exp.id}>
                <div className="editor-entry-header">
                  <span className="card-title">Role Entry #{idx + 1}</span>
                  <button 
                    onClick={() => removeExperience(exp.id)} 
                    className="btn btn-danger btn-sm"
                    title="Delete Entry"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="editor-row">
                  <div className="input-group">
                    <label className="input-label">Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Software Engineer"
                      value={exp.title || ''}
                      onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. TechCorp Inc."
                      value={exp.company || ''}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="editor-row-3">
                  <div className="input-group">
                    <label className="input-label">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. San Francisco, CA / Remote"
                      value={exp.location || ''}
                      onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Start Date</label>
                    <input
                      type="text"
                      placeholder="e.g. Jan 2022"
                      value={exp.startDate || ''}
                      onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">End Date</label>
                    <input
                      type="text"
                      placeholder="e.g. Present / Dec 2023"
                      value={exp.endDate || ''}
                      onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Bullet Points */}
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <label className="input-label" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
                    Key Contributions & Achievements
                  </label>
                  
                  <div className="bullet-list">
                    {(exp.bullets || []).map((bullet, bIdx) => (
                      <div className="bullet-item animate-fadeIn" key={bIdx}>
                        <span style={{ color: 'var(--color-accent-violet)', marginTop: '8px' }}>•</span>
                        <input
                          type="text"
                          placeholder="e.g. Redesigned API endpoints improving transaction response times by 30%"
                          value={bullet || ''}
                          onChange={(e) => updateExperienceBullet(exp.id, bIdx, e.target.value)}
                          className="input-field"
                        />
                        <button 
                          onClick={() => removeExperienceBullet(exp.id, bIdx)} 
                          className="btn-ghost" 
                          style={{ padding: '8px', color: 'var(--color-text-tertiary)' }}
                          title="Remove Bullet"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => addExperienceBullet(exp.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 'var(--space-2)', gap: 'var(--space-1)' }}
                  >
                    <PlusCircle size={12} />
                    <span>Add Bullet Point</span>
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={addExperience}
              className="btn btn-secondary"
              style={{ width: '100%', gap: 'var(--space-2)' }}
            >
              <Plus size={16} />
              <span>Add Experience Entry</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. SKILLS SECTION */}
      <div className="editor-section">
        <div className="editor-section-header" onClick={() => toggleSectionCollapse('skills')}>
          <div className="editor-section-title">
            {getSectionIcon('skills')}
            <span>{sectionLabels.skills}</span>
          </div>
          <button className="btn-ghost btn-icon btn-sm">
            {collapsedSections.skills ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {!collapsedSections.skills && (
          <div className="editor-section-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            
            {/* Technical Skills */}
            <div className="input-group">
              <label className="input-label">Technical Skills / Languages</label>
              <div className="skills-tags">
                {(resumeData.skills.technical || []).map((tag, idx) => (
                  <span className="skill-tag" key={idx}>
                    <span>{tag}</span>
                    <button onClick={() => removeSkillTag('technical', idx)} className="skill-tag-remove">×</button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Type a skill and press Enter..."
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkillTag('technical', techInput, setTechInput);
                    }
                  }}
                  className="skill-input"
                />
              </div>
            </div>

            {/* Soft Skills */}
            <div className="input-group">
              <label className="input-label">Soft Skills / Core Competencies</label>
              <div className="skills-tags">
                {(resumeData.skills.soft || []).map((tag, idx) => (
                  <span className="skill-tag" key={idx}>
                    <span>{tag}</span>
                    <button onClick={() => removeSkillTag('soft', idx)} className="skill-tag-remove">×</button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Type a skill and press Enter..."
                  value={softInput}
                  onChange={(e) => setSoftInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkillTag('soft', softInput, setSoftInput);
                    }
                  }}
                  className="skill-input"
                />
              </div>
            </div>

            {/* Tools & Frameworks */}
            <div className="input-group">
              <label className="input-label">Tools, Cloud & Developer Tools</label>
              <div className="skills-tags">
                {(resumeData.skills.tools || []).map((tag, idx) => (
                  <span className="skill-tag" key={idx}>
                    <span>{tag}</span>
                    <button onClick={() => removeSkillTag('tools', idx)} className="skill-tag-remove">×</button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Type a tool and press Enter..."
                  value={toolsInput}
                  onChange={(e) => setToolsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkillTag('tools', toolsInput, setToolsInput);
                    }
                  }}
                  className="skill-input"
                />
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 5. PROJECTS SECTION */}
      <div className="editor-section">
        <div className="editor-section-header" onClick={() => toggleSectionCollapse('projects')}>
          <div className="editor-section-title">
            {getSectionIcon('projects')}
            <span>{sectionLabels.projects}</span>
          </div>
          <button className="btn-ghost btn-icon btn-sm">
            {collapsedSections.projects ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {!collapsedSections.projects && (
          <div className="editor-section-content">
            {resumeData.projects.map((proj, idx) => (
              <div className="editor-entry animate-fadeIn" key={proj.id}>
                <div className="editor-entry-header">
                  <span className="card-title">Project Entry #{idx + 1}</span>
                  <button 
                    onClick={() => removeProject(proj.id)} 
                    className="btn btn-danger btn-sm"
                    title="Delete Project"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="editor-row">
                  <div className="input-group">
                    <label className="input-label">Project Name</label>
                    <input
                      type="text"
                      placeholder="e.g. E-Commerce Backend Service"
                      value={proj.name || ''}
                      onChange={(e) => updateProject(proj.id, 'name', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Project Status</label>
                    <select
                      value={proj.status || ''}
                      onChange={(e) => updateProject(proj.id, 'status', e.target.value)}
                      className="select-field"
                    >
                      <option value="">Select Status (Optional)</option>
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Active">Active</option>
                      <option value="Maintained">Maintained</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="editor-row">
                  <div className="input-group">
                    <label className="input-label">Live Demo / Portfolio URL</label>
                    <input
                      type="text"
                      placeholder="e.g. analytics.yourwebsite.com"
                      value={proj.link || ''}
                      onChange={(e) => updateProject(proj.id, 'link', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">GitHub Repository URL</label>
                    <input
                      type="text"
                      placeholder="e.g. github.com/username/project"
                      value={proj.github || ''}
                      onChange={(e) => updateProject(proj.id, 'github', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="input-label">Technologies Used (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. React, Node.js, AWS DynamoDB, Docker"
                    value={proj.technologies ? proj.technologies.join(', ') : ''}
                    onChange={(e) => updateProject(proj.id, 'technologies', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Description / Core Highlights</label>
                  <textarea
                    placeholder="Describe the project achievements, what problem you solved, and metrics..."
                    value={proj.description || ''}
                    onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                    className="textarea-field"
                    style={{ minHeight: '80px' }}
                  />
                </div>
              </div>
            ))}

            <button
              onClick={addProject}
              className="btn btn-secondary"
              style={{ width: '100%', gap: 'var(--space-2)' }}
            >
              <Plus size={16} />
              <span>Add Project Entry</span>
            </button>
          </div>
        )}
      </div>

      {/* 6. EDUCATION SECTION */}
      <div className="editor-section">
        <div className="editor-section-header" onClick={() => toggleSectionCollapse('education')}>
          <div className="editor-section-title">
            {getSectionIcon('education')}
            <span>{sectionLabels.education}</span>
          </div>
          <button className="btn-ghost btn-icon btn-sm">
            {collapsedSections.education ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {!collapsedSections.education && (
          <div className="editor-section-content">
            {resumeData.education.map((edu, idx) => (
              <div className="editor-entry animate-fadeIn" key={edu.id}>
                <div className="editor-entry-header">
                  <span className="card-title">Education Entry #{idx + 1}</span>
                  <button 
                    onClick={() => removeEducation(edu.id)} 
                    className="btn btn-danger btn-sm"
                    title="Delete Entry"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="editor-row">
                  <div className="input-group">
                    <label className="input-label">Degree / Field of Study</label>
                    <input
                      type="text"
                      placeholder="e.g. M.S. Computer Science"
                      value={edu.degree || ''}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Institution / School Name</label>
                    <input
                      type="text"
                      placeholder="e.g. UC Berkeley"
                      value={edu.institution || ''}
                      onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="editor-row-3">
                  <div className="input-group">
                    <label className="input-label">Location (City, State)</label>
                    <input
                      type="text"
                      placeholder="e.g. Berkeley, CA"
                      value={edu.location || ''}
                      onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Graduation Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2021"
                      value={edu.year || ''}
                      onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">GPA (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 3.9 / 4.0"
                      value={edu.gpa || ''}
                      onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addEducation}
              className="btn btn-secondary"
              style={{ width: '100%', gap: 'var(--space-2)' }}
            >
              <Plus size={16} />
              <span>Add Education Entry</span>
            </button>
          </div>
        )}
      </div>

      {/* 7. CERTIFICATIONS */}
      <div className="editor-section">
        <div className="editor-section-header" onClick={() => toggleSectionCollapse('certifications')}>
          <div className="editor-section-title">
            {getSectionIcon('certifications')}
            <span>{sectionLabels.certifications}</span>
          </div>
          <button className="btn-ghost btn-icon btn-sm">
            {collapsedSections.certifications ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {!collapsedSections.certifications && (
          <div className="editor-section-content">
            {resumeData.certifications.map((cert, idx) => (
              <div className="editor-entry animate-fadeIn" key={cert.id}>
                <div className="editor-entry-header">
                  <span className="card-title">Certification Entry #{idx + 1}</span>
                  <button 
                    onClick={() => removeCertification(cert.id)} 
                    className="btn btn-danger btn-sm"
                    title="Delete Certification"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="editor-row-3" style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr' }}>
                  <div className="input-group">
                    <label className="input-label">Certification Name</label>
                    <input
                      type="text"
                      placeholder="e.g. AWS Solutions Architect"
                      value={cert.name || ''}
                      onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Issuing Authority</label>
                    <input
                      type="text"
                      placeholder="e.g. Amazon Web Services"
                      value={cert.issuer || ''}
                      onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Year Obtained</label>
                    <input
                      type="text"
                      placeholder="e.g. 2023"
                      value={cert.year || ''}
                      onChange={(e) => updateCertification(cert.id, 'year', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addCertification}
              className="btn btn-secondary"
              style={{ width: '100%', gap: 'var(--space-2)' }}
            >
              <Plus size={16} />
              <span>Add Certification Entry</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
