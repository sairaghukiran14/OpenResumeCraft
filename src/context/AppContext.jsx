/**
 * AppContext.jsx
 * --------------
 * Global state management for OpenResumeCraft.
 *
 * Uses React Context + useReducer to provide a single source of truth for:
 *   • Resume data & section ordering
 *   • Template selection
 *   • AI provider settings & API keys
 *   • Job description text
 *   • AI generation status, token usage & cost tracking
 *   • UI state (active panel, sidebar, dark mode)
 *
 * State is automatically persisted to localStorage with a debounced save.
 */

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from 'react';

import {
  defaultResume,
  emptyResume,
  sectionOrder as defaultSectionOrder,
} from '../data/defaultResume';

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'openresumecraft_state';
const DEBOUNCE_MS = 500;

// ─── Initial State ───────────────────────────────────────────────────────────

const initialState = {
  // Resume content
  resumeData: defaultResume,
  sectionOrder: [...defaultSectionOrder],
  selectedTemplate: 'classic', // 'classic' | 'modern' | 'minimal' | 'ats'

  // AI settings
  settings: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKeys: {
      openai: '',
      gemini: '',
      anthropic: '',
      groq: '',
      deepseek: '',
    },
    tone: 'professional', // 'professional' | 'technical' | 'executive'
  },

  // Job description
  jobDescription: '',

  // AI generation state
  isGenerating: false,
  generationError: null,

  // Token & cost tracking
  currentGeneration: null, // { tokens: { input, output, total }, cost, model, provider }
  generationHistory: [], // array of past generation records
  totalTokens: { input: 0, output: 0, total: 0 },
  totalCost: 0,

  // UI state
  activePanel: 'editor', // 'editor' | 'preview'
  sidebarOpen: true,
  darkMode: true,
};

// ─── localStorage helpers ────────────────────────────────────────────────────

/**
 * Safely load persisted state from localStorage.
 * Returns `null` when nothing is stored or data is corrupt.
 */
function loadStateFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // CRITICAL: Ensure loading state and errors are never trapped in persisted storage.
    // This allows the user to break out of stuck loading overlays if they refresh the page.
    parsed.isGenerating = false;
    parsed.generationError = null;

    // Merge with initialState so that any newly-added keys are present
    // even if the persisted blob predates them.
    return deepMerge(initialState, parsed);
  } catch (err) {
    console.warn('[OpenResumeCraft] Failed to load saved state:', err);
    return null;
  }
}

/**
 * Persist state to localStorage.
 * Silently catches quota / serialization errors.
 */
function saveStateToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[OpenResumeCraft] Failed to save state:', err);
  }
}

/**
 * Deep-merge `source` into `target`.
 * Arrays are replaced wholesale (not concatenated).
 */
function deepMerge(target, source) {
  const output = { ...target };

  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function appReducer(state, action) {
  switch (action.type) {
    // ── Resume data ──────────────────────────────────────────────────────

    case 'SET_RESUME_DATA':
      return { ...state, resumeData: action.payload };

    case 'UPDATE_SECTION':
      return {
        ...state,
        resumeData: {
          ...state.resumeData,
          [action.payload.section]: action.payload.data,
        },
      };

    case 'ADD_ENTRY': {
      const { section, entry } = action.payload;
      const existing = state.resumeData[section];

      // Only works for array-type sections
      if (!Array.isArray(existing)) return state;

      return {
        ...state,
        resumeData: {
          ...state.resumeData,
          [section]: [...existing, entry],
        },
      };
    }

    case 'REMOVE_ENTRY': {
      const { section, id } = action.payload;
      const list = state.resumeData[section];

      if (!Array.isArray(list)) return state;

      return {
        ...state,
        resumeData: {
          ...state.resumeData,
          [section]: list.filter((item) => item.id !== id),
        },
      };
    }

    case 'UPDATE_ENTRY': {
      const { section, id, data } = action.payload;
      const items = state.resumeData[section];

      if (!Array.isArray(items)) return state;

      return {
        ...state,
        resumeData: {
          ...state.resumeData,
          [section]: items.map((item) =>
            item.id === id ? { ...item, ...data } : item,
          ),
        },
      };
    }

    // ── Section ordering ─────────────────────────────────────────────────

    case 'REORDER_SECTIONS':
      return { ...state, sectionOrder: action.payload };

    // ── Settings ─────────────────────────────────────────────────────────

    case 'SET_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case 'SET_API_KEY':
      return {
        ...state,
        settings: {
          ...state.settings,
          apiKeys: {
            ...state.settings.apiKeys,
            [action.payload.provider]: action.payload.key,
          },
        },
      };

    // ── Job description ──────────────────────────────────────────────────

    case 'SET_JOB_DESCRIPTION':
      return { ...state, jobDescription: action.payload };

    // ── Template ─────────────────────────────────────────────────────────

    case 'SET_TEMPLATE':
      return { ...state, selectedTemplate: action.payload };

    // ── AI generation lifecycle ──────────────────────────────────────────

    case 'START_GENERATION':
      return {
        ...state,
        isGenerating: true,
        generationError: null,
      };

    case 'GENERATION_SUCCESS': {
      const { resumeData, generation } = action.payload || {};
      
      // Support both nested payload format and flat payload format for robust backwards compatibility
      const genDetails = generation || action.payload || {};
      const record = {
        tokens: genDetails.tokens,
        cost: genDetails.cost,
        model: genDetails.model,
        provider: genDetails.provider,
        cached: genDetails.cached || false,
        durationMs: genDetails.durationMs,
        timestamp: genDetails.timestamp || Date.now()
      };

      return {
        ...state,
        resumeData: resumeData || state.resumeData,
        isGenerating: false,
        generationError: null,
        currentGeneration: record,
        generationHistory: [...state.generationHistory, record],
        totalTokens: {
          input: state.totalTokens.input + (record.tokens?.input || 0),
          output: state.totalTokens.output + (record.tokens?.output || 0),
          total: state.totalTokens.total + (record.tokens?.total || 0),
        },
        totalCost: state.totalCost + (record.cost || 0),
      };
    }

    case 'GENERATION_ERROR':
      return {
        ...state,
        isGenerating: false,
        generationError: action.payload,
      };

    // ── UI state ─────────────────────────────────────────────────────────

    case 'SET_ACTIVE_PANEL':
      return { ...state, activePanel: action.payload };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };

    // ── Bulk resets ──────────────────────────────────────────────────────

    case 'RESET_RESUME':
      return {
        ...state,
        resumeData: defaultResume,
        sectionOrder: [...defaultSectionOrder],
      };

    case 'CLEAR_RESUME':
      return {
        ...state,
        resumeData: JSON.parse(JSON.stringify(emptyResume)),
        sectionOrder: [...defaultSectionOrder],
      };

    case 'LOAD_STATE':
      return { ...state, ...action.payload };

    default:
      console.warn(`[AppContext] Unknown action type: "${action.type}"`);
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AppContext = createContext(null);

/**
 * AppProvider
 * -----------
 * Wraps the application tree with global state.
 * Reads persisted state on mount and auto-saves with a debounce.
 */
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, null, () => {
    // Lazy initialiser — runs once on mount
    const persisted = loadStateFromStorage();
    return persisted || initialState;
  });

  // ── Debounced auto-save to localStorage ────────────────────────────────
  const timerRef = useRef(null);

  const debouncedSave = useCallback((currentState) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveStateToStorage(currentState);
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    debouncedSave(state);

    // Cleanup on unmount
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, debouncedSave]);

  // ── Apply dark-mode class to <html> element ────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    if (state.darkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [state.darkMode]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Custom Hook ─────────────────────────────────────────────────────────────

/**
 * useApp()
 * --------
 * Convenience hook to consume the global app context.
 *
 * @returns {{ state: object, dispatch: Function }}
 * @throws {Error} If used outside of <AppProvider>.
 *
 * @example
 *   const { state, dispatch } = useApp();
 *   dispatch({ type: 'SET_TEMPLATE', payload: 'modern' });
 */
export function useApp() {
  const ctx = useContext(AppContext);

  if (!ctx) {
    throw new Error(
      'useApp() must be used within an <AppProvider>. ' +
        'Wrap your component tree with <AppProvider> in main.jsx.',
    );
  }

  return ctx;
}

export default AppContext;
