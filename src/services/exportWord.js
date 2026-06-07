import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';

/**
 * Sanitizes input values to prevent null/undefined strings in the Word file.
 * Returns a trimmed string or empty string.
 *
 * @param {any} val - Raw input.
 * @returns {string} Cleaned trimmed string.
 */
const clean = (val) => (val ? String(val).trim() : '');

/**
 * Constructs a two-column borderless table row in DOCX.
 * Used for aligning resume metrics (e.g. Job Title on the left, Date Range on the right)
 * without utilizing tab-stop coordinates which can easily corrupt Word document files.
 *
 * @param {string} leftText - Text aligned to the left column.
 * @param {string} rightText - Text aligned to the right column.
 * @param {boolean} [isBoldLeft=false] - Toggle bold text in left column.
 * @param {boolean} [isBoldRight=false] - Toggle bold text in right column.
 * @param {boolean} [isItalicLeft=false] - Toggle italic text in left column.
 * @param {boolean} [isItalicRight=false] - Toggle italic text in right column.
 * @param {string} [leftColor='111111'] - Text color for left column.
 * @param {string} [rightColor='111111'] - Text color for right column.
 * @param {number} [beforeSpace=120] - Top spacing padding in DXA units (twips).
 * @returns {Table} The configured DOCX table layout object.
 */
const createTwoColumnRow = (leftText, rightText, isBoldLeft = false, isBoldRight = false, isItalicLeft = false, isItalicRight = false, leftColor = '111111', rightColor = '111111', beforeSpace = 120) => {
  return new Table({
    columnWidths: [7056, 3024],
    width: {
      size: 10080,
      type: WidthType.DXA,
    },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 7056, type: WidthType.DXA },
            children: [
              new Paragraph({
                spacing: { before: beforeSpace, after: 0 },
                children: [
                  new TextRun({
                    text: leftText,
                    bold: isBoldLeft,
                    italics: isItalicLeft,
                    size: 21, // 10.5pt
                    font: 'Calibri',
                    color: leftColor,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 3024, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: beforeSpace, after: 0 },
                children: [
                  new TextRun({
                    text: rightText,
                    bold: isBoldRight,
                    italics: isItalicRight,
                    size: 21, // 10.5pt
                    font: 'Calibri',
                    color: rightColor,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
};

/**
 * Compiles and exports a professional Microsoft Word `.docx` document from the resume data.
 * Enforces highly structured layouts using borderless tables for side-by-side alignment.
 * 
 * Features:
 *   - Supports a "compactLayout" toggle that adjusts font sizing and margins dynamically.
 *   - Auto-adds bottom section borders in exact Word XML formats.
 *   - Automatically cleans all entries to guard against DOCX schema-level build errors.
 *   - Packages XML streams into a binary Blob via Packer and saves it directly to local disk.
 *
 * @param {object} resumeData - Current structured resume state.
 * @param {string} [filename='resume'] - Output document filename.
 * @param {object} [settings={}] - Custom spacing configurations (e.g. compactLayout toggle).
 * @returns {Promise<void>} Resolves when packer triggers file download.
 * @throws {Error} If resumeData is null or invalid.
 */
export async function exportToWord(resumeData, filename = 'resume', settings = {}) {
  if (!resumeData) throw new Error('Resume data is required');

  const { contactInfo = {}, summary = '', experience = [], education = [], skills = {}, certifications = [], projects = [] } = resumeData;

  const isCompact = settings?.compactLayout || false;

  const spacing = {
    headerAfter: isCompact ? 60 : 120,
    headerSectionAfter: isCompact ? 100 : 240,
    sectionBefore: isCompact ? 140 : 240,
    sectionAfter: isCompact ? 60 : 120,
    summaryAfter: isCompact ? 100 : 180,
    twoColGap: isCompact ? 85 : 180,
    titleBefore: isCompact ? 20 : 40,
    titleAfter: isCompact ? 30 : 80,
    bulletSpacing: isCompact ? 15 : 30,
    skillSpacingBefore: isCompact ? 30 : 60,
    skillSpacingAfter: isCompact ? 20 : 40,
  };

  const docSections = [];

  // 1. Header (Centered Contact Info)
  const headerParagraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [
        new TextRun({
          text: clean(contactInfo.name) || 'Candidate Name',
          bold: true,
          size: 40, // 20pt
          font: 'Calibri',
          color: '111111',
        }),
      ],
    }),
  ];

  // Contact detail sub-lines
  const contactDetails = [];
  if (contactInfo.email) contactDetails.push(contactInfo.email);
  if (contactInfo.phone) contactDetails.push(contactInfo.phone);
  if (contactInfo.location) contactDetails.push(contactInfo.location);

  const socialDetails = [];
  if (contactInfo.linkedin) socialDetails.push(`LinkedIn: ${contactInfo.linkedin}`);
  if (contactInfo.website) socialDetails.push(`Portfolio: ${contactInfo.website}`);

  if (contactDetails.length > 0) {
    headerParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        children: [
          new TextRun({
            text: contactDetails.join('   |   '),
            size: 19, // 9.5pt
            font: 'Calibri',
            color: '333333',
          }),
        ],
      })
    );
  }

  if (socialDetails.length > 0) {
    headerParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: spacing.headerSectionAfter },
        children: [
          new TextRun({
            text: socialDetails.join('   |   '),
            size: 19, // 9.5pt
            font: 'Calibri',
            color: '333333',
          }),
        ],
      })
    );
  }

  headerParagraphs.forEach(p => docSections.push(p));

  // Helper to create Section Headers with nice lines
  const createSectionHeader = (title) => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: spacing.sectionBefore, after: spacing.sectionAfter },
      keepWithNext: true,
      border: {
        bottom: {
          color: '111111',
          space: 4,
          style: BorderStyle.SINGLE,
          size: 12,
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 24, // 12pt
          font: 'Calibri',
          color: '111111',
        }),
      ],
    });
  };

  // 2. Summary Section
  if (summary) {
    docSections.push(createSectionHeader('Professional Summary'));
    docSections.push(
      new Paragraph({
        spacing: { before: 60, after: spacing.summaryAfter },
        lineSpacing: { before: 0, after: 0, line: 280 }, // 1.15 line spacing
        children: [
          new TextRun({
            text: clean(summary),
            size: 21, // 10.5pt
            font: 'Calibri',
            color: '111111',
          }),
        ],
      })
    );
  }

  // 3. Work Experience Section
  if (experience && experience.length > 0) {
    docSections.push(createSectionHeader('Professional Experience'));

    experience.forEach((exp, idx) => {
      // Use our safe table-based alignment to prevent file corruption
      const compName = clean(exp.company) + (clean(exp.location) ? ` (${clean(exp.location)})` : '');
      const dateRangeStr = `${clean(exp.startDate)} – ${clean(exp.endDate)}`;
      
      docSections.push(createTwoColumnRow(compName, dateRangeStr, true, true, false, false, '111111', '111111', idx === 0 ? (isCompact ? 30 : 60) : spacing.twoColGap));

      // Job Title Line
      docSections.push(
        new Paragraph({
          spacing: { before: spacing.titleBefore, after: spacing.titleAfter },
          keepWithNext: true,
          children: [
            new TextRun({
              text: clean(exp.title),
              italics: true,
              size: 21, // 10.5pt
              font: 'Calibri',
              color: '111111',
            }),
          ],
        })
      );

      // Bullet Points
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          if (clean(bullet)) {
            docSections.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: spacing.bulletSpacing, after: spacing.bulletSpacing },
                lineSpacing: { line: 260 },
                children: [
                  new TextRun({
                    text: clean(bullet),
                    size: 20, // 10pt
                    font: 'Calibri',
                    color: '111111',
                  }),
                ],
              })
            );
          }
        });
      }
    });
  }

  // 4. Skills Section
  const techSkills = skills.technical || [];
  const softSkills = skills.soft || [];
  const tools = skills.tools || [];
  
  if (techSkills.length > 0 || softSkills.length > 0 || tools.length > 0) {
    docSections.push(createSectionHeader('Skills & Competencies'));

    if (techSkills.length > 0) {
      docSections.push(
        new Paragraph({
          spacing: { before: spacing.skillSpacingBefore, after: spacing.skillSpacingAfter },
          children: [
            new TextRun({ text: 'Technical Skills: ', bold: true, size: 21, font: 'Calibri', color: '111111' }),
            new TextRun({ text: techSkills.join(', '), size: 21, font: 'Calibri', color: '111111' }),
          ],
        })
      );
    }

    if (softSkills.length > 0) {
      docSections.push(
        new Paragraph({
          spacing: { before: spacing.bulletSpacing, after: spacing.bulletSpacing },
          children: [
            new TextRun({ text: 'Soft Skills: ', bold: true, size: 21, font: 'Calibri', color: '111111' }),
            new TextRun({ text: softSkills.join(', '), size: 21, font: 'Calibri', color: '111111' }),
          ],
        })
      );
    }

    if (tools.length > 0) {
      docSections.push(
        new Paragraph({
          spacing: { before: spacing.bulletSpacing, after: spacing.skillSpacingAfter },
          children: [
            new TextRun({ text: 'Tools & Technologies: ', bold: true, size: 21, font: 'Calibri', color: '111111' }),
            new TextRun({ text: tools.join(', '), size: 21, font: 'Calibri', color: '111111' }),
          ],
        })
      );
    }
  }

  // 5. Projects Section
  if (projects && projects.length > 0) {
    docSections.push(createSectionHeader('Projects'));

    projects.forEach((proj, idx) => {
      const projLinkStr = proj.link ? ` [${clean(proj.link)}]` : '';
      
      docSections.push(createTwoColumnRow(clean(proj.name), projLinkStr, true, false, false, true, '111111', '111111', idx === 0 ? (isCompact ? 30 : 60) : spacing.twoColGap));

      if (proj.technologies && proj.technologies.length > 0) {
        docSections.push(
          new Paragraph({
            spacing: { before: spacing.titleBefore, after: spacing.titleBefore },
            keepWithNext: true,
            children: [
              new TextRun({
                text: `Technologies: ${proj.technologies.join(', ')}`,
                italics: true,
                size: 19,
                font: 'Calibri',
                color: '111111',
              }),
            ],
          })
        );
      }

      if (proj.description) {
        docSections.push(
          new Paragraph({
            spacing: { before: spacing.titleBefore, after: spacing.titleAfter },
            children: [
              new TextRun({
                text: clean(proj.description),
                size: 20,
                font: 'Calibri',
                color: '111111',
              }),
            ],
          })
        );
      }
    });
  }

  // 6. Education Section
  if (education && education.length > 0) {
    docSections.push(createSectionHeader('Education'));

    education.forEach((edu, idx) => {
      const eduTitle = `${clean(edu.degree)} – ${clean(edu.institution)}` + (edu.gpa ? ` (GPA: ${edu.gpa})` : '');
      
      docSections.push(createTwoColumnRow(eduTitle, clean(edu.year), true, true, false, false, '111111', '111111', idx === 0 ? (isCompact ? 30 : 60) : spacing.twoColGap));

      if (clean(edu.location)) {
        docSections.push(
          new Paragraph({
            spacing: { before: spacing.titleBefore, after: spacing.titleAfter },
            children: [
              new TextRun({
                text: clean(edu.location),
                italics: true,
                size: 19,
                font: 'Calibri',
                color: '111111',
              }),
            ],
          })
        );
      }
    });
  }

  // 7. Certifications Section
  if (certifications && certifications.length > 0) {
    docSections.push(createSectionHeader('Certifications'));

    certifications.forEach((cert, idx) => {
      const certTitle = clean(cert.name) + (clean(cert.issuer) ? ` — ${clean(cert.issuer)}` : '');
      
      docSections.push(createTwoColumnRow(certTitle, clean(cert.year), true, true, false, false, '111111', '111111', idx === 0 ? (isCompact ? 20 : 40) : (isCompact ? 60 : 120)));
    });
  }

  // Define document layout
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: isCompact ? 720 : 1080, // 0.5in margins instead of 0.75in margins!
              bottom: isCompact ? 720 : 1080,
              left: isCompact ? 720 : 1080,
              right: isCompact ? 720 : 1080,
            },
          },
        },
        children: docSections,
      },
    ],
  });

  // Generate and save
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename.replace(/[^a-zA-Z0-9-_]/g, '_')}.docx`);
}
