import React from 'react';
import { useApp } from '../../context/AppContext';
import { calculateATSScore } from '../../services/atsScoringEngine';
import { Sparkles, CheckCircle2, AlertCircle, Award, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function AtsMatchAnalytics() {
  const { state, dispatch } = useApp();
  const { resumeData, jobDescription } = state;

  // Reactively compute ATS match metrics locally in real-time on every state change!
  const analysis = calculateATSScore(resumeData, jobDescription);
  const score = analysis?.score || 0;

  // Define color themes based on the match score tier
  const getScoreColorClass = (val) => {
    if (val >= 85) return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.06)', border: 'rgba(16, 185, 129, 0.15)', label: 'Excellent Match' };
    if (val >= 70) return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.15)', label: 'Good Match' };
    return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.06)', border: 'rgba(239, 68, 68, 0.15)', label: 'Low Alignment' };
  };

  const theme = getScoreColorClass(score);

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

  // Click-to-add missing skill handler
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
