import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateATSScore, extractJobTitle } from '../../services/atsScoringEngine';
import { Sparkles, CheckCircle2, AlertCircle, Award, Target } from 'lucide-react';
import { toast } from 'sonner';

/**
 * AtsMatchAnalytics Component.
 * ----------------------------
 * Renders the interactive Applicant Tracking System (ATS) optimization dashboard.
 *
 * Mechanics & Features:
 *   1. Reactive Local Calculations: Automatically recalculates keyword alignment percentages in real-time in the browser on every key stroke or section modification.
 *   2. Custom Visual Ring Gauge: Displays scores using an SVG circular progress meter that animates based on active calculations.
 *   3. Actionable Feedback Banners: Styled quote cards displaying suggestions depending on score tier limits.
 *   4. Interactive Badging: Categorizes matches into a green checkmark panel, and lists missing terms as red clickable button indicators.
 *   5. Professional Completeness Tips: Performs heuristics checks on experience bullet metrics, summaries, social handles, and skills quantity.
 *
 * @returns {React.ReactElement} The compiled ATS Match Dashboard.
 */
export default function AtsMatchAnalytics() {
  const { state, dispatch } = useApp();
  const { resumeData, jobDescription } = state;

  // Debounce resumeData and jobDescription updates to prevent typing lag
  const [debouncedResumeData, setDebouncedResumeData] = useState(resumeData);
  const [debouncedJobDescription, setDebouncedJobDescription] = useState(jobDescription);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedResumeData(resumeData);
      setDebouncedJobDescription(jobDescription);
    }, 300);

    return () => clearTimeout(handler);
  }, [resumeData, jobDescription]);

  // Reactively compute ATS match metrics locally using debounced values
  const analysis = calculateATSScore(debouncedResumeData, debouncedJobDescription, state.selectedTemplate);
  const score = analysis?.score || 0;

  /**
   * Selects HSL-tailored colors, border values, and status labels based on score thresholds.
   *
   * @param {number} val - The calculated numerical match score.
   * @returns {object} The dynamic color scheme containing HSL values, backgrounds, and titles.
   */
  const getScoreColorClass = (val) => {
    if (val >= 85) return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.06)', border: 'rgba(16, 185, 129, 0.15)', label: 'Excellent Match' };
    if (val >= 70) return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.15)', label: 'Good Match' };
    return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.06)', border: 'rgba(239, 68, 68, 0.15)', label: 'Low Alignment' };
  };

  const theme = getScoreColorClass(score);

  const getDeductions = (breakdown) => {
    if (!breakdown) return [];
    const list = [];
    
    // Keyword Score (40% weight)
    const kwDeduct = Math.round((100 - breakdown.keywordScore) * 0.40);
    if (kwDeduct > 0) {
      list.push({
        area: 'Keyword Match',
        points: kwDeduct,
        reason: 'Missing target technical keywords from the job description in your resume.',
        tip: 'Click red badges under Missing Keywords to automatically add them.'
      });
    }

    // Format Score (20% weight)
    const formatDeduct = Math.round((100 - breakdown.formatScore) * 0.20);
    if (formatDeduct > 0) {
      list.push({
        area: 'Format structure',
        points: formatDeduct,
        reason: state.selectedTemplate === 'modern' ? 'Multi-column / sidebar layout selected (Modern layout penalizes parsing).' : 'Too many experience roles (over 5 items) creates layout noise.',
        tip: 'Switch to a single-column layout (Classic, Minimal, or ATS Optimal) and consolidate entries.'
      });
    }

    // Structure Score (15% weight)
    const structDeduct = Math.round((100 - breakdown.structureScore) * 0.15);
    if (structDeduct > 0) {
      list.push({
        area: 'Sections structure',
        points: structDeduct,
        reason: 'Missing key sections or sections are in non-standard sequence.',
        tip: 'Ensure Contact, Summary, Experience, Skills, and Education sections are fully populated.'
      });
    }

    // Readability Score (10% weight)
    const readDeduct = Math.round((100 - breakdown.readabilityScore) * 0.10);
    if (readDeduct > 0) {
      list.push({
        area: 'Readability',
        points: readDeduct,
        reason: 'Experience bullets do not all start with action verbs, contain plain text paragraphs instead of list items, or dates are in inconsistent format.',
        tip: 'Start experience bullets with action verbs (e.g. Optimized, Built) and check that dates match "Month YYYY" format.'
      });
    }

    // Quantification Score (10% weight)
    const quantDeduct = Math.round((100 - breakdown.quantificationScore) * 0.10);
    if (quantDeduct > 0) {
      list.push({
        area: 'Quantification',
        points: quantDeduct,
        reason: 'Experience bullet points lack numerical results, statistics, or percentages.',
        tip: 'Integrate numbers or percentages into your bullet points (e.g., "improved performance by 25%").'
      });
    }

    // Title Match Score (5% weight)
    const titleDeduct = Math.round((100 - breakdown.titleMatchScore) * 0.05);
    if (titleDeduct > 0) {
      list.push({
        area: 'Target Title Match',
        points: titleDeduct,
        reason: 'Job titles in your experience or professional summary do not align with the target title in the JD.',
        tip: 'Update your professional summary or recent job titles to match the target role.'
      });
    }

    return list;
  };

  // ─── Dynamic Resume Enhancement Tips ──────────────────────────────
  const enhancementTips = [];

  // Tip 1: Metrics check (scan all experience bullets for numbers / percentages)
  const allBullets = (resumeData.experience || []).flatMap(exp => exp.bullets || []);
  const metricRegex = /\b\d+(?:%|\+|-|M|K)?\b/;
  const bulletsWithMetrics = allBullets.filter(b => metricRegex.test(b));
  
  if (allBullets.length > 0 && (bulletsWithMetrics.length / allBullets.length) < 0.5) {
    enhancementTips.push({
      id: 'metrics',
      icon: '📊',
      title: 'Quantify Experience Bullet Points',
      description: 'Only some bullet points contain metrics. ATS scoring algorithms weigh results with numbers, metrics (%, $, numbers), and time improvements significantly higher.',
    });
  }

  // Tip 2: Professional summary presence check
  if (!resumeData.summary) {
    enhancementTips.push({
      id: 'summary',
      icon: '✍️',
      title: 'Draft a Professional Summary',
      description: 'Your resume is missing a Professional Summary. A high-impact 2-3 sentence overview at the top is the highest-weighted keyword placement zone in standard ATS systems.',
    });
  }

  // Tip 3: LinkedIn presence
  if (!resumeData.contactInfo?.linkedin) {
    enhancementTips.push({
      id: 'linkedin',
      icon: '🔗',
      title: 'Link your LinkedIn Profile',
      description: 'Add your LinkedIn URL to contact info. Profiles with fully formatted links enjoy 40% higher direct recruiter click-through rates.',
    });
  }

  // Tip 4: Skills list density
  const totalSkillsCount = (resumeData.skills?.technical?.length || 0) + 
                           (resumeData.skills?.soft?.length || 0) + 
                           (resumeData.skills?.tools?.length || 0);
  if (totalSkillsCount < 8) {
    enhancementTips.push({
      id: 'skills_density',
      icon: '💡',
      title: 'Expand Skills Inventory',
      description: 'You are currently listing very few skills. Aim for 8-12 tech stack keywords and tool items to satisfy matching algorithm keyword weight targets.',
    });
  }

  // Tip 5: General JD match guidance
  if (score > 0 && score < 70) {
    enhancementTips.push({
      id: 'score_threshold',
      icon: '📈',
      title: 'Target ATS Match Score of 70%+',
      description: 'Resumes scoring below 70% are frequently filtered out. Integrate high-priority missing keywords displayed above to push your score over the bar.',
    });
  }

  /**
   * Click-to-Add Interactive Skill Handler.
   * Dynamically formats, validates, and inserts a missing keyword skill directly into 
   * the candidate's Technical Skills state slice, reactively boosting the ATS score.
   *
   * @param {string} skill - The raw keyword string to insert.
   */
  const handleAddSkill = (skill) => {
    // Beautifully capitalize first letter for Skills entry list representation
    const formattedSkill = skill.charAt(0).toUpperCase() + skill.slice(1);
    const currentTech = resumeData.skills?.technical || [];

    if (currentTech.some(s => s.toLowerCase() === skill.toLowerCase())) {
      toast.info(`"${formattedSkill}" is already present in your Technical Skills.`);
      return;
    }

    const updatedSkills = {
      ...resumeData.skills,
      technical: [...currentTech, formattedSkill]
    };

    dispatch({
      type: 'UPDATE_SECTION',
      payload: {
        section: 'skills',
        data: updatedSkills
      }
    });

    toast.success(`Skill "${formattedSkill}" Added!`, {
      description: `Added to your Technical Skills in the Editor panel. Match score increased!`,
      duration: 4000
    });
  };

  const handleFixTemplate = () => {
    dispatch({ type: 'SET_TEMPLATE', payload: 'ats' });
    toast.success('Template Switched!', {
      description: 'Switched layout style to ATS Optimal to optimize parsing.'
    });
  };

  const handleFixDates = () => {
    const monthsMap = {
      january: 'Jan', jan: 'Jan', '01': 'Jan', '1': 'Jan',
      february: 'Feb', feb: 'Feb', '02': 'Feb', '2': 'Feb',
      march: 'Mar', mar: 'Mar', '03': 'Mar', '3': 'Mar',
      april: 'Apr', apr: 'Apr', '04': 'Apr', '4': 'Apr',
      may: 'May', '05': 'May', '5': 'May',
      june: 'Jun', jun: 'Jun', '06': 'Jun', '6': 'Jun',
      july: 'Jul', jul: 'Jul', '07': 'Jul', '7': 'Jul',
      august: 'Aug', aug: 'Aug', '08': 'Aug', '8': 'Aug',
      september: 'Sep', sep: 'Sep', '09': 'Sep', '9': 'Sep',
      october: 'Oct', oct: 'Oct', '10': 'Oct',
      november: 'Nov', nov: 'Nov', '11': 'Nov',
      december: 'Dec', dec: 'Dec', '12': 'Dec'
    };

    const formatSingleDate = (dateStr) => {
      if (!dateStr) return '';
      const clean = dateStr.trim().toLowerCase();
      if (clean === 'present' || clean === 'current') return 'Present';

      const parts = clean.split(/[-/]/);
      if (parts.length === 2) {
        const first = parts[0];
        const second = parts[1];
        if (first.length === 4 && !isNaN(first)) {
          const m = monthsMap[second] || 'Jan';
          return `${m} ${first}`;
        }
        if (second.length === 4 && !isNaN(second)) {
          const m = monthsMap[first] || 'Jan';
          return `${m} ${second}`;
        }
      }

      const words = clean.replace(/,/g, '').split(/\s+/);
      if (words.length === 2) {
        const monthWord = words[0];
        const yearWord = words[1];
        const m = monthsMap[monthWord];
        if (m && yearWord.length === 4 && !isNaN(yearWord)) {
          return `${m} ${yearWord}`;
        }
      }

      return dateStr.trim().replace(/\b[a-z]/g, char => char.toUpperCase());
    };

    const updatedExperience = (resumeData.experience || []).map(exp => ({
      ...exp,
      startDate: formatSingleDate(exp.startDate),
      endDate: formatSingleDate(exp.endDate)
    }));

    dispatch({
      type: 'UPDATE_SECTION',
      payload: {
        section: 'experience',
        data: updatedExperience
      }
    });

    toast.success('Dates Standardized!', {
      description: 'Experience entry dates formatted to "Month YYYY".'
    });
  };

  const handleFixActionVerbs = () => {
    const ACTION_VERBS = [
      'architected', 'built', 'optimized', 'reduced', 'migrated', 'integrated', 
      'implemented', 'shipped', 'refactored', 'led', 'designed', 'deployed', 
      'automated', 'improved', 'established', 'developed'
    ];

    const updatedExperience = (resumeData.experience || []).map(exp => {
      const bullets = (exp.bullets || []).map(bullet => {
        const trimmed = bullet.trim();
        if (!trimmed) return bullet;
        const words = trimmed.split(/\s+/);
        const firstWordClean = words[0].toLowerCase().replace(/[^a-z]/g, '');
        if (ACTION_VERBS.includes(firstWordClean)) {
          return bullet;
        }
        const rest = words.slice(1).join(' ');
        const firstWordLower = words[0].charAt(0).toLowerCase() + words[0].slice(1);
        return `Optimized ${firstWordLower} ${rest}`;
      });
      return { ...exp, bullets };
    });

    dispatch({
      type: 'UPDATE_SECTION',
      payload: {
        section: 'experience',
        data: updatedExperience
      }
    });

    toast.success('Action Verbs Prepend Done!', {
      description: 'Prepended whitelisted action verbs (e.g. "Optimized") to bullets starting with non-action verbs.'
    });
  };

  const handleFixTitleMatch = () => {
    const targetTitle = extractJobTitle(jobDescription);
    if (!targetTitle) {
      toast.error('No Target Title Found', {
        description: 'Could not extract a target job title from the job description.'
      });
      return;
    }

    const capitalizedTitle = targetTitle.replace(/\b[a-z]/g, char => char.toUpperCase());

    const updatedContact = {
      ...resumeData.contactInfo,
      title: capitalizedTitle
    };

    dispatch({
      type: 'UPDATE_SECTION',
      payload: {
        section: 'contactInfo',
        data: updatedContact
      }
    });

    toast.success('Job Title Aligned!', {
      description: `Your professional title was updated to "${capitalizedTitle}" to match the target job description.`
    });
  };

  return (
    <div className="ats-analytics" style={{ padding: '4px 0' }}>
      
      {/* spacious header */}
      <div 
        className="sidebar-section-title" 
        style={{ 
          marginBottom: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          letterSpacing: '0.04em',
          fontWeight: '700'
        }}
      >
        <Target size={15} className="text-accent-violet-light" style={{ opacity: 0.9 }} />
        <span>ATS MATCH ANALYTICS</span>
      </div>

      {score > 0 && jobDescription ? (
        <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Circular Score display card with spacious margins */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              padding: '16px',
              background: 'var(--color-bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.02)'
            }}
          >
            {/* Visual Ring Gauge */}
            <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
              <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle 
                  cx="32" 
                  cy="32" 
                  r="28" 
                  fill="transparent" 
                  stroke="rgba(0, 0, 0, 0.04)" 
                  strokeWidth="5" 
                />
                {/* Foreground Matching Ring */}
                <circle 
                  cx="32" 
                  cy="32" 
                  r="28" 
                  fill="transparent" 
                  stroke={theme.color} 
                  strokeWidth="5" 
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - score / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />
              </svg>
              {/* Central Text */}
              <div 
                style={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)', 
                  fontSize: '14px', 
                  fontWeight: '700',
                  color: 'var(--color-text-primary)'
                }}
              >
                {score}%
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span 
                style={{ 
                  fontSize: '10.5px', 
                  fontWeight: '700', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.06em', 
                  color: theme.color 
                }}
              >
                {theme.label}
              </span>
              <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>
                Your resume matches {score}% of the JD constraints.
              </span>
            </div>
          </div>

          {/* Actionable Feedback Banner Styled as Quote Card */}
          {analysis.feedback && (
            <div 
              style={{ 
                padding: '12px 16px',
                background: theme.bg,
                borderLeft: `4px solid ${theme.color}`,
                borderRadius: '8px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}
            >
              <Award size={16} style={{ color: theme.color, flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '12px', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.45, fontWeight: '500' }}>
                {analysis.feedback}
              </p>
            </div>
          )}

          {/* Individual Scoring Breakdown */}
          {analysis.breakdown && (
            <div 
              style={{ 
                padding: '12px 16px',
                background: 'var(--color-bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '2px' }}>
                Score Dimensions Breakdown
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  <span>Keyword Match (40%):</span>
                  <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{analysis.breakdown.keywordScore}/100</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  <span>Format structure (20%):</span>
                  <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{analysis.breakdown.formatScore}/100</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  <span>Sections structure (15%):</span>
                  <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{analysis.breakdown.structureScore}/100</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  <span>Readability (10%):</span>
                  <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{analysis.breakdown.readabilityScore}/100</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  <span>Quantification (10%):</span>
                  <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{analysis.breakdown.quantificationScore}/100</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  <span>Target Title Match (5%):</span>
                  <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{analysis.breakdown.titleMatchScore}/100</span>
                </div>
              </div>
            </div>
          )}

          {/* Points Deductions Breakdown */}
          {analysis.breakdown && getDeductions(analysis.breakdown).length > 0 && (
            <div 
              style={{ 
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Score Deductions Breakdown
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getDeductions(analysis.breakdown).map((d, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', borderBottom: idx < getDeductions(analysis.breakdown).length - 1 ? '1px solid rgba(239, 68, 68, 0.08)' : 'none', paddingBottom: idx < getDeductions(analysis.breakdown).length - 1 ? '6px' : '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                      <span style={{ color: 'var(--color-text-primary)' }}>{d.area}</span>
                      <span style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0px 6px', borderRadius: '4px', fontSize: '10px' }}>-{d.points} pts</span>
                    </div>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '10.5px', lineHeight: 1.3 }}>{d.reason}</span>
                    {d.tip && (
                      <div style={{ 
                        marginTop: '4px', 
                        fontSize: '10px', 
                        color: 'var(--color-brand-primary)', 
                        background: 'rgba(79, 70, 229, 0.04)', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        borderLeft: '2px solid var(--color-brand-primary)',
                        lineHeight: 1.35
                      }}>
                        <div><strong>💡 Suggestion:</strong> {d.tip}</div>
                        {d.area === 'Format structure' && (
                          <div style={{ marginTop: '6px' }}>
                            <button
                              onClick={handleFixTemplate}
                              className="btn btn-sm btn-primary"
                              style={{ fontSize: '9px', padding: '2px 8px', height: '22px' }}
                            >
                              Switch to ATS Template
                            </button>
                          </div>
                        )}
                        {d.area === 'Readability' && (
                          <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                              onClick={handleFixDates}
                              className="btn btn-sm btn-secondary"
                              style={{ fontSize: '9px', padding: '2px 8px', height: '22px' }}
                            >
                              Auto-Format Dates
                            </button>
                            <button
                              onClick={handleFixActionVerbs}
                              className="btn btn-sm btn-secondary"
                              style={{ fontSize: '9px', padding: '2px 8px', height: '22px' }}
                            >
                              Add Action Verbs
                            </button>
                          </div>
                        )}
                        {d.area === 'Target Title Match' && (
                          <div style={{ marginTop: '6px' }}>
                            <button
                              onClick={handleFixTitleMatch}
                              className="btn btn-sm btn-primary"
                              style={{ fontSize: '9px', padding: '2px 8px', height: '22px' }}
                            >
                              Align Job Title
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Suggestions List */}
          {analysis.breakdown && (
            <div 
              style={{ 
                padding: '12px 16px',
                background: 'var(--color-bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Optimization Suggestions
              </div>
              <ul style={{ fontSize: '11px', color: 'var(--color-text-secondary)', paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {analysis.breakdown.keywordScore < 100 && (
                  <li>🔑 <strong>Keywords</strong>: Click missing skills to add them to your Technical Skills, and include them in your professional summary.</li>
                )}
                {analysis.breakdown.formatScore < 100 && (
                  <li>📏 <strong>Format</strong>: Switch to a single-column template (Classic, Minimal, or ATS Optimal) instead of Modern layout to avoid column merging.</li>
                )}
                {analysis.breakdown.structureScore < 100 && (
                  <li>📁 <strong>Structure</strong>: Complete any missing sections (Summary, Experience, Education) and place them in chronological order.</li>
                )}
                {analysis.breakdown.readabilityScore < 100 && (
                  <li>✍️ <strong>Readability</strong>: Verify bullets start with action verbs and keep dates consistently formatted like <code>Month YYYY</code> (e.g., <code>Jan 2023</code>).</li>
                )}
                {analysis.breakdown.quantificationScore < 100 && (
                  <li>📈 <strong>Quantification</strong>: Add metrics (%, numbers, requests/sec, user base size) to all experience bullets to prove impact.</li>
                )}
                {analysis.breakdown.titleMatchScore < 100 && (
                  <li>🎯 <strong>Title Match</strong>: Match your current resume summary/titles to the exact target job title from the Job Description.</li>
                )}
                {analysis.breakdown.keywordScore === 100 && 
                 analysis.breakdown.formatScore === 100 && 
                 analysis.breakdown.structureScore === 100 && 
                 analysis.breakdown.readabilityScore === 100 && 
                 analysis.breakdown.quantificationScore === 100 && 
                 analysis.breakdown.titleMatchScore === 100 && (
                  <li style={{ color: '#10b981', listStyleType: 'none', marginLeft: '-16px' }}>🎉 <strong>Perfect ATS score!</strong> Your resume is fully optimized and compliant with all candidate filters.</li>
                )}
              </ul>
            </div>
          )}

          {/* Keywords dashboard with nice gaps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Matching Keywords */}
            {analysis.matchingKeywords?.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-primary)', marginBottom: '8px', fontWeight: '600' }}>
                  <CheckCircle2 size={13} className="text-success" style={{ opacity: 0.9 }} />
                  <span>Matching Keywords ({analysis.matchingKeywords.length})</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {analysis.matchingKeywords.map((kw, i) => (
                    <span 
                      key={i} 
                      className="badge badge-success" 
                      style={{ 
                        fontSize: '9.5px', 
                        padding: '3px 9px', 
                        borderRadius: '100px',
                        background: 'rgba(16, 185, 129, 0.06)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.15)',
                        textTransform: 'capitalize',
                        fontWeight: '500'
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Keywords (Interactive badges!) */}
            {analysis.missingKeywords?.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-primary)', marginBottom: '8px', fontWeight: '600' }}>
                  <AlertCircle size={13} style={{ color: '#ef4444', opacity: 0.9 }} />
                  <span>Missing High-Priority Terms ({analysis.missingKeywords.length})</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {analysis.missingKeywords.map((kw, i) => (
                    <span 
                      key={i} 
                      onClick={() => handleAddSkill(kw)}
                      className="missing-skill-badge"
                      title="Click to instantly add this missing skill to your Technical Skills!"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Dynamic Resume Enhancement Tips Panel */}
          {enhancementTips.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-primary)', fontWeight: '600', letterSpacing: '0.04em' }}>
                <Sparkles size={13} className="text-accent-violet-light" style={{ opacity: 0.9 }} />
                <span>RESUME ENHANCEMENT TIPS ({enhancementTips.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {enhancementTips.map((tip) => (
                  <div 
                    key={tip.id}
                    style={{
                      padding: '12px',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start'
                    }}
                  >
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>{tip.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                        {tip.title}
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>
                        {tip.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div 
          className="empty-state" 
          style={{ 
            padding: '24px 16px', 
            border: '1px dashed var(--color-border)', 
            borderRadius: '12px',
            background: 'rgba(0,0,0,0.01)',
            marginTop: '4px'
          }}
        >
          <p 
            className="empty-state-description" 
            style={{ 
              fontSize: 'var(--text-xs)', 
              color: 'var(--color-text-secondary)',
              textAlign: 'center', 
              lineHeight: 1.45,
              margin: 0
            }}
          >
            Provide a target Job Description and click <strong>Check Score</strong> or <strong>Tailor Resume</strong> to analyze keyword alignment instantly.
          </p>
        </div>
      )}
    </div>
  );
}
