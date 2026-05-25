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
├── server/
│   └── index.js             # Express server (PDF/DOCX extraction proxy & AI relay)
├── src/
│   ├── components/
│   │   ├── AtsMatchAnalytics/  # Reactive score meter & heuristic tips
│   │   ├── Editor/             # Unfrozen forms for direct experience tuning
│   │   ├── Preview/            # WYSIWYG live document render canvas
│   │   └── Sidebar/            # AI configuration panel & Ollama selector
│   ├── context/
│   │   └── AppContext.jsx   # Global useReducer state manager & local storage hooks
│   ├── services/
│   │   ├── aiProviders.js   # Unified OpenAI-compatible request constructors
│   │   ├── atsScoringEngine.js # Deterministic local ATS term mapping
│   │   ├── exportPDF.js     # Page-break-safe PDF exporter
│   │   ├── exportWord.js    # TWIP-column formatted DOCX builder
│   │   └── promptEngine.js  # Content-preserving optimization system prompts
│   └── templates/           # Layout-specific JSX components
├── package.json
└── README.md
```
