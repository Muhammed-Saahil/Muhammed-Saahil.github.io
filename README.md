# Your Name — Portfolio

Plain HTML/CSS/JS. No build step, no framework — open `index.html` directly or push straight to GitHub Pages.

## File structure
```
index.html            Home page (hero, about, featured projects, contact)
projects.html         Full project grid with filters
playground.html       Interactive page: Scene Builder + Neon Collector mini-game
resume.html           Resume / CV page
css/style.css         All styling (one file, used by every page)
js/main.js            Mobile nav, intro, scroll animations, project filter, video/play toggle
js/engine.js          Hero WebGL shader
js/toon.js            Toon Shader lab (live, tweakable)
js/vfx.js             Game VFX: particles, cursor sparks, click bursts, glitch headline, card tilt, XP scroll bar
js/interactive.js     Hero 3D object, magnetic buttons, project detail panel, Scene Builder, mini-game
assets/images/        Your photo and project screenshots
assets/video/         Gameplay video files (.mp4)
assets/games/         Self-hosted playable web builds (WebGL/HTML5 exports)
assets/downloads/     Downloadable builds (.zip) for non-web platforms
assets/resume/        Your resume.pdf
```

Every page pulls from the same `css/style.css` and `js/main.js` — edit those once and the change applies everywhere.

---

## Where to edit everything

### 1. Your name and title
Appears in the nav bar and browser tab title on every page.
- **Nav bar name:** search each `.html` file for `Your Name <span class="dot">/gamedev</span>` (in the `<nav>` block near the top).
- **Browser tab title:** the `<title>` tag near the top of each file, e.g. `<title>Your Name — Game Developer & Technical Artist</title>`.
- **Hero headline/subtext:** in `index.html`, inside `<header class="hero">` — edit the `<h1>` and the `<p class="lead">`.

### 2. About section
In `index.html`, inside `<section class="section" id="about">`:
- Replace the two `<p>` paragraphs with your real bio.
- Edit the `<div class="skills">` block — each `<span>` is one skill pill; add/remove `<span>` tags freely.
- Swap the photo: replace `assets/images/profile.jpg` with your own file (same filename, or update the `src` path in the `<img>` tag).

### 3. Projects
Projects live in **two places**: `index.html` has 3 "Featured Projects" (with an "ALL PROJECTS →" link to see more), and `projects.html` has the full grid. Each project is one `<article class="card">...</article>` block. To add a new one, copy an existing block and edit these parts:

| What | Where in the card | Example |
|---|---|---|
| Filter category | `data-engine="..."` on the `<article>` tag | `unity`, `unreal`, `jam`, `tools`, or combine like `"jam unity"` |
| Technique label (badge on thumbnail) | `<span class="thumb-label">...</span>` | `PBR Shader Pipeline` |
| Screenshot | `<img src="assets/images/...">` | point at your file in `assets/images/` |
| Tags (engine/year/role) | `<span class="tag">...</span>` inside `.card-meta` | `Unreal Engine 5`, `2025` |
| Title | `<h3>...</h3>` | |
| Description | `<p>...</p>` inside `.card-body` | |
| Gameplay video button | `<button class="media-btn" data-action="video" data-src="...">` | see section 4 below |
| Play-in-browser button | `<button class="media-btn" data-action="play" data-src="...">` | see section 4 below |
| Download / Source links | `<a>` tags inside `.card-links` | delete whichever don't apply |

Delete the whole `.media-actions` div if a project has neither video nor a playable build. Delete individual buttons inside it if only one applies.

### 4. Gameplay video & playable builds
Add this block inside a card's `.card-body`, just before `.card-links`:
```html
<div class="media-actions">
  <button class="media-btn" data-action="video" data-src="assets/video/your-video.mp4">▶ Watch gameplay</button>
  <button class="media-btn" data-action="play" data-src="assets/games/your-game/index.html">🎮 Play in browser</button>
</div>
```
Clicking either button swaps the screenshot in place for the video/game, with a "back to screenshot" option to return.

**Gameplay video:**
- *Self-hosted:* compress to `.mp4` (H.264, ideally under ~20MB) and drop it in `assets/video/`.
- *YouTube/Vimeo (better for longer footage):* use the `play` action instead of `video`, pointed at an embed URL: `data-src="https://www.youtube.com/embed/YOUR_VIDEO_ID"`.

**Playable web game:**
- *Self-hosted WebGL/HTML5 build:* export from Unity ("WebGL" build target) or Unreal (HTML5 export), and put the whole exported folder under `assets/games/your-game/` so it contains an `index.html`. Compress the build (Brotli/Gzip) if it's large — GitHub Pages isn't built for huge files.
- *itch.io (recommended):* upload there, mark it "playable in browser," and set `data-src` to your game's itch.io URL. If the embed shows blank, some creators block iframe embedding — link out with a normal `<a>` in `.card-links` instead.

### 5. Downloads (non-web builds)
Add an `<a>` tag inside `.card-links`:
```html
<a href="assets/downloads/your-game-win.zip" download>⬇ Download (Windows)</a>
```
Put the actual `.zip` in `assets/downloads/`. **GitHub has a 100MB per-file limit** — for anything larger, upload to itch.io or GitHub Releases instead and link out to that URL rather than hosting the zip directly in the repo.

### 6. Resume page
Everything is in `resume.html`, inside `<section class="section">`:
- **PDF download button:** points to `assets/resume/resume.pdf` — export your resume there.
- **Experience / Education / Awards:** each entry is a `.resume-item` block — copy one to add a new job/degree/award, edit the role, org, dates, and bullet list.
- **Skills:** same `.skills` pill list as the About section — edit independently (it's a separate list on this page).

### 7. Contact section (icons)
In `index.html`, inside `<section class="section contact">`:
- Email icon: edit the `href="mailto:you@example.com"`.
- GitHub icon: find the HTML comment `<!-- Add your GitHub URL to the href below -->` and replace the `href="#"` right after it.
- LinkedIn icon: same pattern, comment right above `href="#"`.

### 8. Colors and fonts (site-wide)
The whole site uses a dark "game studio" theme: near-black background, mint / cyan / violet accents, Inter headings, monospace labels, pill buttons, rounded panels. At the very top of `css/style.css`, inside `:root { ... }`:
```css
--bg-0: #080a0e;     /* page background */
--bg-1: #10141b;     /* card/panel background */
--text-0: #f4f7fb;   /* primary text */
--text-1: #8c98a9;   /* secondary/muted text */
--accent: #a6ffcb;   /* mint - buttons, highlights, glow */
--cyan:   #66e8ff;
--violet: #9f85ff;
```
Change a hex value and it updates everywhere. Fonts: `--font-display` (Inter) and `--font-mono`; the Inter `<link>` is in each `.html` `<head>`. The component styling (nav, hero, buttons, cards, panels, footer) is in the "Reference theme layer" block at the very bottom of `css/style.css`.

**Small theme bits in the HTML**
- Nav brand: `Your Name<span class="dot">&#10035;</span>DEV` in each page's `<nav>`. The green pill on the right (`<div class="availability">OPEN TO WORK</div>`) is your availability status - edit or delete it.
- Hero headline words: wrap words in `<span class="outline">` (outlined) or `<span class="accent">` (mint) in `index.html`.
- Small mono labels above section titles (`01 / ABOUT`): the `<span class="eyebrow">` inside each `section-head`.
- Project numbers (`PROJECT_001`...) are added automatically by CSS.
- Contact panel: the big rounded box with the orb in `index.html` (`.contact-panel`).
- The floating particle network behind the page is `initNetwork()` in `js/interactive.js`.

### 9. Navigation menu / footer text
- Nav links: the `<div class="nav-links">` block near the top of each `.html` file — add/remove/reorder `<a>` tags.
- Footer copyright line: bottom of each `.html` file, inside `<footer>`.

### 10. Engine-style visuals (hero shader + Toon Shader lab)
**Hero shader** - the swirling teal/violet/mint "energy plasma" behind every hero is a WebGL fragment shader (domain-warped noise with glowing veins and a ripple that follows your cursor). Edit it in `js/engine.js`, section 1: the `fsSrc` array is the GLSL code. Easy knobs: the three `vec3(...)` colours near `col = mix(...)`, `420.0` (size of the swirls in px), `26.0` / `30.0` (vein sharpness), and the final `a * 0.85` (overall brightness). It renders at half resolution and lowers itself further if the frame rate drops. If WebGL isn't available it quietly falls back to the CSS light show.

**Toon Shader lab** ("Toon Shader" section on the home page, `js/toon.js`) - a live, tweakable toon/cel shader. Visitors can drag the model to move the light, pick a model (sphere/torus/cube/blob), load a preset, and change colours, light bands, shadow threshold, edge softness, highlight, rim light, outline and halftone shadows. The HLSL panel underneath updates with the values and has a Copy button.
- Starting look: `DEFAULTS` at the top of `js/toon.js`. Presets: `PRESETS`. Which sliders appear (and their ranges): `CONTROLS`. Models: `SHAPES` plus the `map()` function inside the GLSL string `FS_SRC`.
- To match **your own** toon shader, edit the lighting maths in `FS_SRC` (the `main()` function) and the matching HLSL text in `updateCode()`; add a slider by adding one line to `CONTROLS` and one `uniform` + `loc` entry.
- Title/intro text: the `#systems` section in `index.html`.

### 11. Game VFX (`js/vfx.js` + bottom of `css/style.css`)
- **Floating energy motes, cursor spark trail, click shockwave + burst** - one particle canvas (`#fx`). Tweak in `js/vfx.js`: `moteCount` (how many floating glows), the `COLORS` array, burst size in the `pointerdown` handler (`i < 28`).
- **Glitch headline** - fires every few seconds and on hover. Change timing in `initGlitch()`; colours in the `glitchA` / `glitchB` keyframes in CSS.
- **Card tilt + glare** - project cards tilt toward your cursor. Strength is the `-9` / `9` in `initTilt()`.
- **XP scroll bar** - the gradient bar at the very top. Style it via `.xp-bar` in CSS.
- **Always-on CSS effects** (work even if scripts are blocked): the drifting blue/red/green aurora lights in the hero (`auroraA/B/C`), the vignette + scanline overlay (`body::after`), the scan beam on project thumbnails (`.card-thumb::before`), the pulsing primary button.
- **Too much?** Delete `<script src="js/vfx.js"></script>` from a page to remove all particles/tilt/glitch/XP bar. To drop the scanlines/vignette, delete the `body::after` rule. All effects are skipped for visitors with "reduce motion" turned on.

**Safety nets**: if scripts are blocked or crash, a failsafe (`no-fx` class, set by a tiny script in each page's `<head>`) makes all content visible after ~2.5 seconds so the page can never stay blank.

### 12. Interactive features (Playground page, hero object, project panel)
All of the behaviour is in `js/interactive.js`; the look is the "Interactive layer" block at the bottom of `css/style.css`.

- **Hero 3D object (home page)** - the rotating glass cube with floating labels beside the headline. It tilts toward your cursor. Edit the four label texts in `index.html` (`<div class="hx-label l1">` ... `l4`). To remove it, delete the `<div class="hx-stage">...</div>` block (the hero collapses back to one column automatically).
- **Ticker strip (home page)** - the scrolling keyword bar under the hero (`<div class="ticker">`). Each `<span>` is one keyword; the list appears twice so the loop is seamless - when you edit it, **change both copies**. Speed: `30s` in `.ticker-track` (CSS). `class="hl"` makes a keyword blue.
- **Magnetic buttons** - the two hero buttons lean toward your cursor. Add `class="magnetic"` to any other button/link to get the same effect.
- **Project detail panel** - click any project card (or its **Details** link) to open a larger panel with the thumbnail, tags, description and your video / play / download / source buttons. It reads everything from the card itself, so **new cards work automatically** - no extra setup. For a longer write-up in the panel, add `data-detail="Your longer text..."` to the card's `<article>` tag. Press Esc or click outside to close.
- **Playground page (`playground.html`)**
  - *Scene Builder*: time of day, rain, glowing lights, fog and environment light change a small game world live; clicking the scene walks the character there. The scene names/text are in the `THEMES` object in `js/interactive.js`; the colours per time of day are the `.sc-world[data-theme=...]` rules in the CSS.
  - *Neon Collector*: a mini-game (WASD / arrows, or press-and-drag on touch screens). Tweak it in `initGame()`: `SPOTS` (orb positions as % of the arena - add or remove pairs to change the count, then update `05` in the score text), `SPEED` (movement speed).
  - Page text lives in `playground.html`. The nav link to it is in each page's `<nav>`; delete that one `<a>` line (and the file) if you don't want the page.

---

## Publishing

### Prerequisites
- A [GitHub account](https://github.com/join) (free).
- [Git installed](https://git-scm.com/downloads) on your computer — check with `git --version` in a terminal.
- GitHub no longer accepts your account password for pushing over HTTPS — when prompted for a password, you'll need a [Personal Access Token](https://github.com/settings/tokens) instead (Settings → Developer settings → Personal access tokens → Generate new token, tick the `repo` scope, copy it somewhere safe). Alternatively, set up [SSH keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh) once and never deal with tokens again.

### Step 1: Create the repo on GitHub
*(Skip this step if you're using GitHub Desktop — Option B in Step 2 creates the repo for you.)*
1. Go to [github.com/new](https://github.com/new).
2. **Repository name:** use `YOUR_USERNAME.github.io` (replace with your actual GitHub username, exactly). This exact name is what makes GitHub Pages serve it at that clean URL automatically.
3. Set it to **Public**.
4. Do **not** check "Add a README" — you already have one.
5. Click **Create repository**. Keep the page open; it shows you the setup commands you'll use next.

### Step 2: Push your site to it

**Option A — Command line:**
Open a terminal, `cd` into the unzipped `portfolio` folder, then run:
```bash
git init
git add .
git commit -m "Initial portfolio site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_USERNAME.github.io.git
git push -u origin main
```
If prompted for credentials, use your GitHub username and the Personal Access Token as the password (not your account password).

**Option B — GitHub Desktop (no terminal, no token needed):**
1. Install [GitHub Desktop](https://desktop.github.com/) and sign in with your GitHub account (File → Options → Accounts) — this handles authentication for you, so you can skip the Personal Access Token step entirely.
2. **File → Add local repository** → browse to your unzipped `portfolio` folder → **Add repository**.
   - If it says the folder isn't a repository yet, click **create a repository** right there instead.
3. On the left, you'll see all your files listed as changes. Type a summary like `Initial portfolio site` in the box at the bottom left → **Commit to main**.
4. Click **Publish repository** in the top bar.
   - Set the name to exactly `YOUR_USERNAME.github.io` (your actual GitHub username).
   - Untick "Keep this code private" so it's public (GitHub Pages needs a public repo unless you're on a paid plan).
   - Click **Publish repository** to finish.
5. Skip ahead to Step 3 below — the repo now exists on GitHub with your files already pushed, so there's no separate "create repo on the website first" step needed with this option.

If you used any other repo name, GitHub Pages will serve it at `YOUR_USERNAME.github.io/REPO_NAME` instead — still fine, just a longer URL.

### Step 3: Turn on GitHub Pages
1. On the repo page: **Settings** → **Pages** (left sidebar).
2. Under "Build and deployment," set **Source** to `Deploy from a branch`.
3. Branch: `main`, folder: `/ (root)` → **Save**.
4. Wait 1–2 minutes, then visit the URL shown at the top of that Pages settings page (or `https://YOUR_USERNAME.github.io`).

### Step 4: Updating the live site later
**Command line:** any time you edit files locally, just commit and push again:
```bash
git add .
git commit -m "Update projects"
git push
```
**GitHub Desktop:** edit your files, then open GitHub Desktop — it automatically detects the changes. Type a summary → **Commit to main** → **Push origin** (top bar).

Either way, GitHub Pages redeploys automatically within a minute or two — no extra steps.

### Step 5 (optional): Custom domain
1. Buy a domain (Namecheap, Google Domains, etc.).
2. In repo **Settings → Pages**, enter it under "Custom domain."
3. At your registrar, add a `CNAME` record pointing to `YOUR_USERNAME.github.io` (for a subdomain like `gamedev.yoursite.com`), or the GitHub Pages `A` records (for an apex domain).
4. Wait for DNS to propagate — can take up to 24 hours.
