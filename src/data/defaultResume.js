/**
 * defaultResume.js
 * ----------------
 * Core data layer for OpenResumeCraft.
 * Exports the default resume, an empty skeleton, section metadata,
 * and a unique-ID generator used when adding new entries.
 */

// ─── Default Resume (realistic software-engineer placeholder) ────────────────

export const defaultResume = {
  contactInfo: {
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexjohnson',
    website: 'alexjohnson.dev',
  },

  summary:
    'Results-driven Senior Software Engineer with 6+ years of experience building scalable web applications and distributed systems. Expert in React, Node.js, and cloud architecture with a track record of improving system performance by 40%+ and mentoring junior developers.',

  experience: [
    {
      id: 'exp1',
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      startDate: 'Jan 2022',
      endDate: 'Present',
      bullets: [
        'Architected and deployed microservices handling 10M+ daily requests using Node.js and Kubernetes',
        'Led migration from monolith to microservices, reducing deployment time by 75%',
        'Mentored team of 5 engineers, implementing code review standards that reduced bugs by 30%',
        'Designed real-time data pipeline processing 500K events/hour using Apache Kafka',
      ],
    },
    {
      id: 'exp2',
      title: 'Software Engineer',
      company: 'StartupXYZ',
      location: 'Remote',
      startDate: 'Jun 2019',
      endDate: 'Dec 2021',
      bullets: [
        'Built React-based dashboard serving 50K+ monthly active users',
        'Implemented CI/CD pipeline with GitHub Actions, reducing release cycle from 2 weeks to 2 days',
        'Optimized PostgreSQL queries, improving API response times by 60%',
      ],
    },
    {
      id: 'exp3',
      title: 'Junior Developer',
      company: 'WebAgency Co.',
      location: 'New York, NY',
      startDate: 'Aug 2017',
      endDate: 'May 2019',
      bullets: [
        'Developed responsive web applications for 15+ clients using React and Vue.js',
        'Created reusable component library that reduced development time by 40%',
      ],
    },
  ],

  education: [
    {
      id: 'edu1',
      degree: 'B.S. Computer Science',
      institution: 'University of California, Berkeley',
      location: 'Berkeley, CA',
      year: '2017',
      gpa: '3.8',
    },
  ],

  skills: {
    technical: [
      'JavaScript',
      'TypeScript',
      'Python',
      'Go',
      'React',
      'Node.js',
      'Next.js',
      'GraphQL',
      'REST APIs',
      'PostgreSQL',
      'MongoDB',
      'Redis',
    ],
    soft: [
      'Technical Leadership',
      'Mentoring',
      'Agile/Scrum',
      'Cross-functional Collaboration',
    ],
    tools: [
      'AWS',
      'Docker',
      'Kubernetes',
      'Terraform',
      'GitHub Actions',
      'Datadog',
      'Jira',
    ],
  },

  certifications: [
    {
      id: 'cert1',
      name: 'AWS Solutions Architect - Associate',
      issuer: 'Amazon Web Services',
      year: '2023',
    },
    {
      id: 'cert2',
      name: 'Certified Kubernetes Administrator',
      issuer: 'CNCF',
      year: '2022',
    },
  ],

  projects: [
    {
      id: 'proj1',
      name: 'OpenSource Analytics',
      description:
        'Built an open-source web analytics platform serving 1000+ websites with privacy-first approach',
      technologies: ['React', 'Go', 'ClickHouse', 'Docker'],
      link: 'analytics.alexjohnson.dev',
      github: 'github.com/alexj/analytics',
      status: 'Completed',
    },
  ],
};

// ─── Empty Resume (blank slate for "Clear Resume") ───────────────────────────

export const emptyResume = {
  contactInfo: {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
  },
  summary: '',
  experience: [],
  education: [],
  skills: {
    technical: [],
    soft: [],
    tools: [],
  },
  certifications: [],
  projects: [],
};

// ─── Section Metadata ────────────────────────────────────────────────────────

/** Default display order of resume sections. */
export const sectionOrder = [
  'contactInfo',
  'summary',
  'experience',
  'education',
  'skills',
  'certifications',
  'projects',
];

/** Human-readable labels for each section key. */
export const sectionLabels = {
  contactInfo: 'Contact Information',
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
  projects: 'Projects',
};

// ─── Utilities ───────────────────────────────────────────────────────────────

/**
 * Generates a unique ID string suitable for new resume entries.
 * Combines a short prefix, a timestamp fragment, and a random suffix
 * to virtually eliminate collisions in client-side usage.
 *
 * @param {string} [prefix='entry'] - Optional prefix (e.g. 'exp', 'edu').
 * @returns {string} A unique identifier like "exp_k7x9m2_4f".
 */
export function generateId(prefix = 'entry') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${timestamp}_${random}`;
}
