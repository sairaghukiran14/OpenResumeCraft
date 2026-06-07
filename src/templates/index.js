/**
 * Template Registry
 *
 * Central export that maps each template ID to its React component,
 * human-readable name, short description, and associated lucide-react
 * icon name for use in the template picker UI.
 */

import ClassicTemplate from './ClassicTemplate';
import ModernTemplate from './ModernTemplate';
import MinimalTemplate from './MinimalTemplate';
import AtsTemplate from './AtsTemplate';

/**
 * Central Template Registry.
 * Central exports that associate each layout design ID ('classic', 'modern', 'minimal', 'ats')
 * with its concrete React component, meta tags, and description fields.
 *
 * @type {object}
 */
export const templates = {
  classic: {
    name: 'Classic',
    description: 'Traditional single-column layout',
    component: ClassicTemplate,
    icon: 'FileText',
  },
  modern: {
    name: 'Modern',
    description: 'Two-column with sidebar',
    component: ModernTemplate,
    icon: 'Layout',
  },
  minimal: {
    name: 'Minimal',
    description: 'Clean, whitespace-focused',
    component: MinimalTemplate,
    icon: 'Minus',
  },
  ats: {
    name: 'ATS-Optimized',
    description: 'Maximum parsability',
    component: AtsTemplate,
    icon: 'ScanSearch',
  },
};

export default templates;
