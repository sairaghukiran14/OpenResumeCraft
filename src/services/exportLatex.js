import { saveAs } from 'file-saver';

/**
 * Escapes special characters reserved by the LaTeX markup engine to prevent
 * document compilation errors (e.g., escaping '&', '%', '$', etc.).
 *
 * @param {string} text - Raw input string containing user text.
 * @returns {string} The safely escaped LaTeX character string.
 */
function escapeLatex(text) {
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

/**
 * Generates a professionally typeset LaTeX `.tex` file from the structured resume state.
 * Implements standard industry LaTeX structures:
 *   - Utilizes `geometry` to set optimal margins.
 *   - Employs `enumitem` and `titlesec` to produce structured sections, bullets, and headings.
 *   - Automatically maps all sections (summary, experience, education, skills, projects, certifications).
 *   - Escapes special inputs using `escapeLatex` to avoid build crashes.
 *   - Compiles output into a browser file Blob stream using `file-saver`.
 *
 * @param {object} resumeData - The current structured resume data model.
 * @param {string} [filename='resume'] - The target output file name.
 * @returns {void} Saves the file directly to the client's local disk.
 * @throws {Error} If resumeData is null or undefined.
 */
export function exportToLatex(resumeData, filename = 'resume') {
  if (!resumeData) throw new Error('Resume data is required');

  const { contactInfo = {}, summary = '', experience = [], education = [], skills = {}, certifications = [], projects = [] } = resumeData;

  // Header template
  let latex = `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage[T1]{fontenc}
\\usepackage{color}

% Color definitions
\\definecolor{primary}{RGB}{124, 58, 237} % Electric Violet
\\definecolor{dark}{RGB}{10, 14, 39} % Dark Navy
\\definecolor{grey}{RGB}{100, 116, 139} % Slate Grey

% Custom section formatting
\\titleformat{\\section}{\\large\\bfseries\\uppercase\\color{primary}}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{12pt}{6pt}

% Layout settings
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\setlist[itemize]{leftmargin=*,noitemsep,topsep=0pt,parsep=2pt}

\\begin{document}

% ─── Header ───────────────────────────────────────────────────────────
\\begin{center}
    {\\Huge\\bfseries\\color{dark} ${escapeLatex(contactInfo.name) || 'Candidate Name'}}\\\\[0.5em]
    {\\color{grey} 
`;

  const contactDetails = [];
  if (contactInfo.email) contactDetails.push(escapeLatex(contactInfo.email));
  if (contactInfo.phone) contactDetails.push(escapeLatex(contactInfo.phone));
  if (contactInfo.location) contactDetails.push(escapeLatex(contactInfo.location));
  latex += `        ` + contactDetails.join(' $\\cdot$ ') + `\n    }\\\\ \n`;

  const socialDetails = [];
  if (contactInfo.linkedin) socialDetails.push(`LinkedIn: \\href{https://${contactInfo.linkedin}}{${escapeLatex(contactInfo.linkedin)}}`);
  if (contactInfo.website) socialDetails.push(`Portfolio: \\href{https://${contactInfo.website}}{${escapeLatex(contactInfo.website)}}`);

  if (socialDetails.length > 0) {
    latex += `    {\\color{grey}\\small ` + socialDetails.join(' $\\cdot$ ') + `}\n`;
  }

  latex += `\\end{center}
\\vspace{0.5em}
`;

  // ─── Summary ──────────────────────────────────────────────────────────
  if (summary) {
    latex += `
\\section{Professional Summary}
${escapeLatex(summary)}
`;
  }

  // ─── Experience ───────────────────────────────────────────────────────
  if (experience && experience.length > 0) {
    latex += `
\\section{Work Experience}
`;
    experience.forEach(exp => {
      latex += `\\textbf{${escapeLatex(exp.company)}} \\hfill \\textbf{${escapeLatex(exp.startDate)} -- ${escapeLatex(exp.endDate)}}\\\\
\\textit{${escapeLatex(exp.title)}} \\hfill \\textit{${escapeLatex(exp.location)}}\\\\
`;
      if (exp.bullets && exp.bullets.length > 0) {
        latex += `\\begin{itemize}
`;
        exp.bullets.forEach(bullet => {
          if (bullet && bullet.trim()) {
            latex += `    \\item ${escapeLatex(bullet)}
`;
          }
        });
        latex += `\\end{itemize}
`;
      }
      latex += `\\vspace{0.5em}
`;
    });
  }

  // ─── Skills ───────────────────────────────────────────────────────────
  const techSkills = skills.technical || [];
  const softSkills = skills.soft || [];
  const tools = skills.tools || [];

  if (techSkills.length > 0 || softSkills.length > 0 || tools.length > 0) {
    latex += `
\\section{Skills \\& Competencies}
\\begin{description}[leftmargin=0pt,font=\\bfseries\\color{dark}]
`;
    if (techSkills.length > 0) {
      latex += `    \\item[Technical Skills:] ${escapeLatex(techSkills.join(', '))}
`;
    }
    if (softSkills.length > 0) {
      latex += `    \\item[Soft Skills:] ${escapeLatex(softSkills.join(', '))}
`;
    }
    if (tools.length > 0) {
      latex += `    \\item[Tools \\& Technologies:] ${escapeLatex(tools.join(', '))}
`;
    }
    latex += `\\end{description}
`;
  }

  // ─── Projects ─────────────────────────────────────────────────────────
  if (projects && projects.length > 0) {
    latex += `
\\section{Projects}
`;
    projects.forEach(proj => {
      const linkStr = proj.link ? ` (\\href{https://${proj.link}}{${escapeLatex(proj.link)}})` : '';
      latex += `\\textbf{${escapeLatex(proj.name)}} {\\color{grey}\\small ${linkStr}}\\\\
`;
      if (proj.technologies && proj.technologies.length > 0) {
        latex += `\\textit{Technologies: ${escapeLatex(proj.technologies.join(', '))}}\\\\
`;
      }
      if (proj.description) {
        latex += `${escapeLatex(proj.description)}\\\\
`;
      }
      latex += `\\vspace{0.5em}
`;
    });
  }

  // ─── Education ────────────────────────────────────────────────────────
  if (education && education.length > 0) {
    latex += `
\\section{Education}
`;
    education.forEach(edu => {
      const gpaStr = edu.gpa ? `, GPA: ${escapeLatex(edu.gpa)}` : '';
      latex += `\\textbf{${escapeLatex(edu.institution)}} \\hfill \\textbf{${escapeLatex(edu.year)}}\\\\
\\textit{${escapeLatex(edu.degree)}${gpaStr}} \\hfill \\textit{${escapeLatex(edu.location)}}\\\\
\\vspace{0.5em}
`;
    });
  }

  // ─── Certifications ───────────────────────────────────────────────────
  if (certifications && certifications.length > 0) {
    latex += `
\\section{Certifications}
\\begin{itemize}
`;
    certifications.forEach(cert => {
      latex += `    \\item \\textbf{${escapeLatex(cert.name)}} -- ${escapeLatex(cert.issuer)} \\hfill \\textbf{${escapeLatex(cert.year)}}
`;
    });
    latex += `\\end{itemize}
`;
  }

  // Document Footer
  latex += `
\\end{document}
`;

  // Save the LaTeX file
  const blob = new Blob([latex], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${filename.replace(/[^a-zA-Z0-9-_]/g, '_')}.tex`);
}
