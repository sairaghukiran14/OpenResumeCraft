# 🦙 OpenResumeCraft

**OpenResumeCraft** is a premium, privacy-first, local-first AI Resume Builder & ATS Match Optimizer. It is designed to help professionals tailor their resumes to target job descriptions with absolute data privacy, using local LLMs (via Ollama) or premium cloud providers (OpenAI, Gemini, Anthropic, Groq, DeepSeek). 

Equipped with a deterministic, local ATS keyword alignment engine, real-time enhancement dashboards, interactive click-to-add skills, and robust PDF/Word document compilers, OpenResumeCraft provides a state-of-the-art SaaS customization experience directly on your own machine.

---

## ✨ Key Capabilities

*   **🔒 Privacy-First Local AI**: Run resume customizations and parsers 100% locally on your machine with zero data leaving your device. Fully integrates with local **Ollama** servers running **Llama 3.1 (8B)**, **Gemma 2 (9B)**, **Mistral**, or **Phi 3**.
*   **🎯 Deterministic ATS Scoring**: Employs a 100% consistent local keyword mapping algorithm instead of erratic AI scoring. It analyzes your resume against target Job Descriptions in real-time using term frequencies, section weights, and completeness.
*   **⚡ Interactive "Click-to-Add" Skills**: Identifies high-priority missing technical terms from your target job description. Simply click any red badge to instantly inject it into your technical skills list and watch your ATS score increment reactively in real-time.
*   **📈 Reactive Resume Enhancement Dashboard**: A 5-point real-time heuristic analyzer checks your resume's metrics density (quantifiable impact), summary completeness, LinkedIn presence, and skill depth, providing active visual tips.
*   **📁 Dual-Format Advanced Compiling**:
    *   **Page-Break Protected PDFs**: Uses precise element-avoid CSS print rules so multi-page resumes split gracefully at entry gaps without ever tearing individual jobs or creating giant empty blank spaces.
    *   **Column-Safe Word (.docx) Documents**: Enforces strict absolute column DXA metrics to prevent vertical wrapping. Compiles in professional, minimalist high-contrast typography, relying on font weights rather than distracting spacers.
*   **📝 Content-Preserving AI Tailoring**: Core prompts strictly forbid AI models from deleting, truncating, or shortening your experience list. It optimizes and aligns terminology while keeping your bullet counts and history fully intact.
*   **🔗 Active Contact & Project Links**: Automatically maps clickable email (`mailto:`), LinkedIn URLs, and websites. Projects render dedicated interactive badges linking straight to **GitHub** and **Live Demo** repositories.
*   **🏷️ Project Status Tags**: Configurable status values ("Completed", "In Progress", "Maintained") render styled HSL badges next to your project headers in all 4 beautiful resume templates.
*   **✉️ Cover Letter Generator**: Generates highly persuasive cover letters in 3 distinct, professional styles (Short & Impactful, Tech-based, Experience-based) using the active AI engine. Provides click-to-copy and formal PDF export.

---

## ⚡ Premium ATS Scoring & Performance Engine

OpenResumeCraft runs an advanced scoring and optimization pipeline that matches industry-grade ATS parsing rules across six precise dimensions:

### 1. The 6-Dimension Scoring Metric
The overall **ATS Match Score** is computed deterministically using standard parsing rule weights:
*   **Keyword Score (40%)**: Calculates frequency-based matching of keywords in the Job Description against the resume. Includes a `+5` points bonus if the top 5 most critical keywords appear in the profile summary.
*   **Format Score (20%)**: Checks structure constraints. Deducts 10 points if the `selectedTemplate` is `'modern'` to discourage complex multi-column layouts that confuse traditional parsers.
*   **Structure Score (15%)**: Assures the presence of all five core sections (`contactInfo`, `summary`, `experience`, `education`, `skills`) and verifies their correct chronological sequence and naming.
*   **Readability Score (10%)**: Validates standard `Month YYYY` date syntax, checks that experience points are written as lists rather than inline text blocks, and scans starting words against a whitelisted action verb array.
*   **Quantification Score (10%)**: Measures numerical impact density (e.g., metric numbers, growth percentages, dollar values) in experience bullet points. Renders clickable suggestions on non-quantified bullets.
*   **Title Match Score (5%)**: Checks whether the target Job Description title matches (exactly or partially) the candidate's professional title or resume summary keywords.

### 2. Core Scoring & Optimization Utilities
*   **Date Standardizer ([dateFormatter.js](file:///Users/sairaghukiranavula/Projects/OpenResumeCraft/src/utils/dateFormatter.js))**: Auto-translates arbitrary date inputs (like `2023-05`, `05/2023`, or `May 23`) into standard `Month YYYY` format in templates and scorers to prevent formatting scoring penalties.
*   **Action Verb Post-Processor ([verbProcessor.js](file:///Users/sairaghukiranavula/Projects/OpenResumeCraft/src/utils/verbProcessor.js))**: Intercepts AI resume tailoring responses. If any experience bullets start with a weak or non-whitelisted verb, it maps it or prepends a compliant action verb (e.g., *Spearheaded*, *Optimized*, *Designed*), securing a 100% Readability score.
*   **Recalculation Debouncer**: Implements a `300ms` debouncer in [AtsMatchAnalytics.jsx](file:///Users/sairaghukiranavula/Projects/OpenResumeCraft/src/components/AtsMatchAnalytics/AtsMatchAnalytics.jsx) to prevent recalculating scores on every keystroke, resulting in fluid editing.
*   **Fuzzy Synonym Taxonomy**: Maps technical equivalents (e.g., `aws` <-> `Amazon Web Services`, `nextjs` <-> `Next.js`, `ts` <-> `TypeScript`) within [atsScoringEngine.js](file:///Users/sairaghukiranavula/Projects/OpenResumeCraft/src/services/atsScoringEngine.js) to allow semantic scoring matches.
*   **Redis Caching Client**: Connects to a local Redis server in [server/index.js](file:///Users/sairaghukiranavula/Projects/OpenResumeCraft/server/index.js) to cache prompt engineering results with a 24-hour TTL, falling back silently to a memory Map if Redis is inactive.

### 3. Automated Benchmark Verification
OpenResumeCraft includes a benchmark suite that evaluates the application against 100 simulated job descriptions (50 ReactJS, 50 Frontend roles):
*   **Log file**: [linkedin_runs_100.json](file:///Users/sairaghukiranavula/Projects/OpenResumeCraft/scratch/linkedin_runs_100.json) contains the raw results, including target links, baseline scores, tailored scores, and optimization modes.
*   **Analysis report**: [analysis_results_linkedin_100.md](file:///Users/sairaghukiranavula/.gemini/antigravity-ide/brain/f6365133-5156-4229-8a52-c7e6a20d5eb6/analysis_results_linkedin_100.md) records details of the run. On average, the baseline score of 77.83% improved to 90.71% (+12.88%) post-tailoring.

---

## 🚀 Getting Started & Detailed Usage Guide

### 1. Prerequisites
Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (Version 18 or higher)
*   [Ollama](https://ollama.com/) (Required for local-first execution, optional if using cloud providers)

---

### 2. Installation & Launch
1.  Navigate to the project root directory in your terminal:
    ```bash
    npm install
    ```
2.  Start the application services concurrently:
    ```bash
    npm run dev
    ```
    *   **Vite Frontend Client**: Runs at [http://localhost:5173](http://localhost:5173) (Open this in your browser to interact with the application).
    *   **Express Backend Proxy**: Runs at `http://localhost:5001` (Handles text extraction from PDF/Word uploads and proxies AI requests cleanly to prevent browser CORS issues).

---

### 3. Configure Your AI Engine
In the **AI Engine Settings** widget inside the left Sidebar panel, choose your workflow:

*   **Option A: Local AI (Free & Private)**:
    1.  Make sure your local Ollama server is active (`ollama serve`).
    2.  Pull a recommended model in your terminal (e.g. `ollama pull llama3.1` or `ollama pull gemma2`).
    3.  Select **Ollama (Local)** as the AI Provider in the settings menu.
    4.  Click **Refresh** to dynamically load your models in the select box.
*   **Option B: Cloud AI**:
    1.  Select **OpenAI**, **Google Gemini**, or **Anthropic** as your provider.
    2.  Paste your API key into the input field immediately below the selector.

---

### 4. Step-by-Step Optimization Workflow

Follow this complete customization loop inside the interface to build high-scoring resumes:

1.  **Load Your Baseline Resume**:
    *   Type or adjust your information manually inside the forms under the **Editor** panel, OR
    *   Click **Import with AI** at the top of the screen and upload an existing **PDF or Word (.docx)** file. The backend proxy will extract text and structure it into your editor automatically.
2.  **Paste the Target Job Description**:
    *   Copy the target job posting text and paste it into the **Job Description** textarea inside the left Sidebar.
3.  **Perform Real-Time Score Audits**:
    *   Click the **Check Score** action button. The deterministic local engine immediately checks keyword mapping frequencies and completeness.
    *   Review your **ATS Match Score** in the circular meter and check the **Match Analytics** tab to view your matched and missing technical terms.
4.  **Inject Missing High-Priority Keywords**:
    *   Look at the red badges under **Missing High-Priority Terms**.
    *   Click on any red badge representing a skill you possess. It instantly shifts to your matching tags, adds it to the **Technical Skills** form in your editor, and updates your ATS Match Score meter in real-time.
5.  **Audit Enhancement Dashboard Tips**:
    *   Review the **Resume Enhancement Tips** deck (e.g. Quantified Metrics density, LinkedIn verification, Summary presence) and follow the instructions to polish your copy.
6.  **Execute AI Optimization**:
    *   Select your target **Writing Tone** (Professional, Technical, or Executive) and click **Tailor Resume**.
    *   The model will optimize experience bullets and summaries using high-priority JD keywords while strictly keeping your bullet counts and work history **100% intact**.
7.  **Choose Layout Templates**:
    *   Click on the **Preview** tab in the main canvas.
    *   Toggle between **Classic**, **Modern**, **Minimal**, and **ATS Optimal** template layouts at the top. All templates feature clickable contact anchors and repository badges.
8.  **Compile & Export**:
    *   **Export PDF**: Generates multi-page PDFs with element-boundary split protection.
    *   **Export Word**: Generates clean, high-contrast, minimalist `.docx` files using solid physical margins to avoid squished layout tables in Microsoft Word and Google Docs.
9.  **Generate a Tailored Cover Letter**:
    *   Toggle the workspace mode switcher to **Cover Letter** in the application header.
    *   Select your preferred style: **Short & Impactful** (3-paragraph punchy layout under 250 words), **Tech-Based** (focuses on code stack and architectural execution), or **Experience-Based** (highlights leadership, lifecycle delivery, and metrics).
    *   Click **Generate Cover Letter** to initiate generation using your resume and target job description context.
    *   Edit the resulting text directly inside the form, and instantly **Copy Text** or **Export PDF** to download the letterhead printout.

---

## 🦙 Running Local AI with Ollama

OpenResumeCraft is optimized to query and execute local models without requiring any external internet connections or paid API keys.

### 1. Start Ollama
Make sure your local Ollama server is active:
```bash
ollama serve
```

### 2. Pull Recommended Models
For a **16GB RAM laptop**, we recommend pulling either Llama 3.1 or Gemma 2:
```bash
# Recommended general instruction model
ollama pull llama3.1

# Recommended for premium rephrasing and polish
ollama pull gemma2

# Lightweight alternative (extremely fast)
ollama pull phi3
```

### 3. Select and Refresh inside OpenResumeCraft
1.  Open the **AI Engine Settings** drawer in the sidebar.
2.  Switch the **AI Provider** to **Ollama (Local)**.
3.  Click the **Refresh** button next to the **Model Selection** menu. The app will query your local Ollama instance on port `11434` and dynamically populate the dropdown with your installed models!
4.  Choose your model, paste a target Job Description, and click **Tailor Resume**.

*Note: Local models running on CPU can take some time to pre-load. OpenResumeCraft has an extended **3-minute (180 seconds)** local timeout rule to accommodate the loading phase.*

---

## 🔌 Using Cloud API Providers (OpenAI, Gemini, Anthropic)

OpenResumeCraft fully supports cloud-based models for high-quality, high-speed optimizations. 

### 1. Model Configuration
The application is pre-configured with the following optimized model choices:
*   **OpenAI**: `GPT-4o Mini` (recommended for general value/speed) and `GPT-4o` (recommended for advanced reasoning).
*   **Google Gemini**: `Gemini 2.0 Flash` and `Gemini 1.5 Pro`.
*   **Anthropic**: `Claude 3.5 Haiku` and `Claude Sonnet 4`.
*   **Groq**: `Llama 3.1 8B` (instant speed) and `Llama 3.3 70B` (advanced quality).
*   **DeepSeek**: `DeepSeek V3` (great value) and `DeepSeek Reasoner` (deep logic).

### 2. Setting Up Your API Keys
You can configure your API keys in two different ways:

#### Method A: Direct UI Inputs
1.  Open the **AI Engine Settings** box in the left Sidebar.
2.  Switch the **AI Provider** to **OpenAI** (or your preferred cloud provider).
3.  Paste your API key in the password input immediately below the selector. The key is securely held inside your browser's local state and is only passed via headers to the proxy server during execution.

#### Method B: Environment Variables (Frictionless Integration)
To avoid having to paste your API keys every time you open or refresh the application, you can pre-define them inside a local `.env` file in the project root:
1.  Create a file named `.env` in the root of the project:
    ```bash
    touch .env
    ```
2.  Add your keys as environment variables:
    ```env
    OPENAI_API_KEY=sk-proj-your-openai-api-key-here
    GEMINI_API_KEY=AIzaSy-your-gemini-key-here
    ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
    ```
3.  Launch the application using `npm run dev`. The backend proxy will automatically detect these environment variables. When you select a provider in the UI, you can leave the API key input completely blank—the server will seamlessly fall back to your `.env` keys!

---

## 🎨 Resume Templates

Choose between **4 professionally tailored layouts** in the Preview tab:
1.  **Classic**: Standard, centered, conservative recruiter design. Best for corporate, finance, and traditional roles.
2.  **Modern**: Left-aligned split column sidebar with colored layout elements. Best for designers, product managers, and startups.
3.  **Minimal**: Clean, compact, margin-optimized design utilizing soft grid lines. Best for space efficiency and multi-page experience density.
4.  **ATS Optimal**: Pure single-column linear layout specifically weighted to maximize automated parser scores.

---

## 📄 File Formats & Exports

### PDF Export
*   Powered by `html2pdf.js`.
*   Uses targeted CSS print rules:
    ```css
    .classic-entry, .modern-entry, .project-entry {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    ```
*   Ensures sections only break at logical intersections.

### DOCX Word Export
*   Powered by the premium `docx` compiler.
*   Resolves Microsoft Word table-squishing by binding precise DXA columns (`WidthType.DXA` layout bounds) and cell-level margins (`beforeSpace`).
*   Exports in a high-contrast format with pure black typography (`#111111`) and standard font weights, meeting the strict criteria of modern Applicant Tracking Systems.

---

## 🛠️ Project Structure

```text
├── public/
│   └── favicon.svg          # Premium SVG sidebar icon alignment logo
├── scratch/
│   ├── run_linkedin_analysis_100.js # Automated 100 job posting benchmark test script
│   └── linkedin_runs_100.json       # Benchmark run log mapping links and scores
├── server/
│   └── index.js             # Express server (PDF/DOCX extraction proxy, AI relay, Redis cache)
├── src/
│   ├── components/
│   │   ├── AtsMatchAnalytics/  # Reactive score meter, debounced scorer & heuristic tips
│   │   ├── Editor/             # Forms with inline quantification suggestions tooltips
│   │   ├── Preview/            # WYSIWYG live document render canvas
│   │   └── Sidebar/            # AI configuration panel & Ollama selector
│   ├── context/
│   │   └── AppContext.jsx   # Global useReducer state manager & local storage hooks
│   ├── services/
│   │   ├── aiProviders.js   # Unified OpenAI-compatible request constructors
│   │   ├── atsScoringEngine.js # Deterministic 6-dimension score & synonym engine
│   │   ├── exportPDF.js     # Page-break-safe PDF exporter
│   │   ├── exportWord.js    # TWIP-column formatted DOCX builder
│   │   └── promptEngine.js  # Content-preserving AI rephrasing prompts
│   ├── utils/
│   │   ├── dateFormatter.js # Standardizer to normalise input dates to Month YYYY
│   │   └── verbProcessor.js # Post-processor enforcing whitelisted action verbs
│   └── templates/           # Layout-specific JSX components
├── package.json
└── README.md
```
