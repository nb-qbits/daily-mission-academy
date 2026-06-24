# Daily Mission Academy

A simple, static, iPad-friendly study website for two kids — **Iraj** (rising
5th grade, "Mission Control") and **Aveer** (rising 2nd grade, "Adventure
Path") — to work through daily summer assignments, take quizzes, and let a
parent log scores and notes.

There is **no backend, no database, no login, and no server API**. All
content comes from JSON files in `public/content/`, and all progress is
saved in the browser's `localStorage`. The whole thing is meant to be opened
in Safari on an iPad and hosted for free on GitHub Pages.

---

## 1. Quick start (local development)

You'll need [Node.js](https://nodejs.org) 18+ installed.

```bash
npm install
npm run dev
```

This starts a local dev server (usually at `http://localhost:5173/daily-mission-academy/`
— Vite will print the exact URL). Open it in your browser to try the app.

Other useful commands:

```bash
npm run build     # type-checks and builds the production site into dist/
npm run preview   # serves the built dist/ folder locally, to sanity-check before deploying
```

---

## 2. How the app is put together

```
daily-mission-academy/
  public/
    content/
      manifest.json       <- tells the app which week file to load for each kid
      iraj/week1.json      <- Iraj's Week 1 assignments (Day 1 - Day 5)
      aveer/week1.json     <- Aveer's Week 1 assignments (Day 1 - Day 5)
  src/
    main.tsx               <- React entry point
    App.tsx                <- top-level view router and state
    types.ts                <- all TypeScript types (Kid, Assignment, etc.)
    kids.ts                 <- static metadata for Iraj & Aveer (icons, theme labels)
    styles.css               <- all app styling (design tokens + components)
    components/              <- one file per screen/view
    utils/
      contentLoader.ts       <- fetches manifest.json and week JSON files
      storage.ts              <- reads/writes localStorage
      scoring.ts               <- mean/percentage/streak/weak-area calculations
      exportText.ts             <- builds the "Copy Result for ChatGPT" text + JSON export
  admin/
    index.html              <- the local Content Control Panel UI (see section 3)
  scripts/
    admin-server.cjs         <- the local server behind the Control Panel
```

The `admin/` and `scripts/` folders are a **local-only dev tool** — they are
not part of the deployed website and are never built into `dist/`.

**Assignments are never hardcoded in React.** Every day's lesson, exercises,
quiz, and vocabulary live in the JSON files under `public/content/`. To add
new content, you edit JSON and push to GitHub — no code changes needed.

### How a session flows

1. The app loads `public/content/manifest.json` on startup.
2. The parent or child picks **Iraj** or **Aveer** on the "Who is studying
   today?" screen.
3. The app loads that child's current week JSON file and shows the first
   assignment that doesn't yet have a saved Parent Review (falling back to
   Day 1 if there's no progress at all).
4. The child works through the lesson sections, marking each one complete.
5. The child takes the quiz and sees their score + answer key immediately.
6. The parent fills out the Parent Review (scores, notes, mistakes, writing
   sample) and saves it.
7. The app shows a results screen with **Copy Result for ChatGPT** and
   **Download JSON** buttons.
8. Progress is saved in `localStorage`, so closing the tab and reopening it
   later picks up right where you left off.

---

## 3. The easiest way to add or edit content: the Control Panel

Instead of hand-editing JSON, you can run a small local tool that gives you
a form-based "control panel" in your browser. It writes the JSON for you,
and can automatically commit, push, and deploy when you save.

```bash
npm run admin
```

Then open **http://localhost:5050** in your browser. From there you can:

1. **Pick Iraj or Aveer.**
2. **Pick a week** — an existing one, or click "+ Create a new week file" to
   start a fresh `weekN.json` (it's added to `manifest.json` automatically).
3. **Edit an existing day** by clicking it in the list, or **Add New Day**
   to create one from scratch — fill in the lesson, exercises, writing
   prompt, vocabulary, quiz questions, and parent checklist using the form
   fields (no JSON syntax to worry about).
4. Click **Save Day**. This writes straight into the right file under
   `public/content/` and updates `manifest.json` for you.
5. At the bottom, **"Auto-publish after save"** is checked by default — so
   right after saving, it automatically runs `git add`, `git commit`,
   `git push`, and `npm run deploy` for you, and shows the output in the
   log box. If you'd rather review things first, uncheck that box and use
   the **Publish Now** button whenever you're ready.

This tool only runs on your own computer (`localhost`) — it is never part
of the deployed website, and nothing it does is visible to the kids using
the site. It just automates the same `git`/`npm` steps you'd otherwise run
by hand. Stop it anytime with `Ctrl+C` in the terminal where you ran
`npm run admin`.

**Requirements:** your project folder needs to already be a git repository
connected to GitHub (i.e. you've done the one-time `git remote add origin
...` setup and pushed at least once) for the Publish step to work. If
`git push` fails, check that you're logged in / authorized in that
terminal the same way you were the first time you deployed.

---

## 4. Deploying to GitHub Pages

1. Create a new GitHub repository named **`daily-mission-academy`** (the
   name matters — see the note below).
2. Push this project to that repository:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/daily-mission-academy.git
   git push -u origin main
   ```

3. Deploy using the included `gh-pages` package:

   ```bash
   npm run deploy
   ```

   This builds the site and pushes the `dist/` folder to a `gh-pages` branch.

4. In your GitHub repo, go to **Settings → Pages**, and under "Build and
   deployment" set the source to **Deploy from a branch**, branch
   **`gh-pages`**, folder **`/ (root)`**. Save.

5. After a minute or two, your site will be live at:

   ```
   https://<your-username>.github.io/daily-mission-academy/
   ```

   Open that URL in Safari on the iPad and (optionally) add it to the Home
   Screen via the Share button → "Add to Home Screen" so it opens like an
   app.

### If you rename the repository

The Vite config has a hardcoded `base` path:

```ts
// vite.config.ts
base: '/daily-mission-academy/',
```

If you name your GitHub repo something other than `daily-mission-academy`,
update this value to match (e.g. `'/my-repo-name/'`) before running
`npm run deploy`, or the site's assets won't load correctly on GitHub Pages.

---

## 5. Editing content by hand (alternative to the Control Panel)

If you'd rather edit the JSON files directly instead of using the panel
above, here's how.

Each child's content lives in `public/content/<childId>/*.json`, as an
**array of assignment objects**. To add a new week:

1. Create a new file, e.g. `public/content/iraj/week2.json`, following the
   same shape as `week1.json` (see `src/types.ts` for the exact `Assignment`
   type — lesson, exercises, writingPrompt, vocabulary, quizQuestions,
   parentChecklist, etc.).
2. Make sure each assignment's `id` is unique (e.g. `"iraj-week2-day1"`) and
   `dayNumber` continues sensibly (e.g. 6, 7, 8...) so sorting stays sane.
3. Update `public/content/manifest.json` to include the new file:

```json
{
  "version": "2026-07-01",
  "children": {
    "iraj": {
      "currentWeek": "week2",
      "files": ["week1.json", "week2.json"]
    },
    "aveer": {
      "currentWeek": "week2",
      "files": ["week1.json", "week2.json"]
    }
  }
}
```

   The app loads **every file listed** for a child and sorts all the
   assignments by `dayNumber`, so old weeks stay accessible in Progress
   history even after a new week is added.

4. Commit, push, and run `npm run deploy` — same as step 4 above.

### Using ChatGPT to generate the next assignment

After a Parent Review is saved, click **Copy Result for ChatGPT**, paste the
copied summary into a ChatGPT conversation, and ask it to write the next
day's assignment in the same JSON shape as the existing files (you can paste
one existing day as a format example). Then either paste the JSON it gives
you into the right file by hand, or — easier — paste it into the **Add New
Day** form fields in the Control Panel (`npm run admin`) and hit Save.

---

## 6. Resetting progress

Progress is stored entirely in the browser's `localStorage`, under these
keys:

- `dailyMission.activeKid`
- `dailyMission.progress.iraj`
- `dailyMission.progress.aveer`

To reset a child's progress (e.g. to replay Week 1), open the browser's
developer tools on that device and run:

```js
localStorage.removeItem('dailyMission.progress.iraj');
// or
localStorage.removeItem('dailyMission.progress.aveer');
```

Because everything is local to that one browser, progress does **not** sync
across devices — if the iPad and a parent's laptop both open the site, they
each have their own independent progress.

---

## 7. Tech stack

- React + TypeScript
- Vite (build tool + dev server)
- Plain CSS (no UI framework)
- `localStorage` for all persistence
- Static JSON content files
- GitHub Pages for hosting

No backend, no database, no login, no server APIs, and no API keys of any
kind are used anywhere in this project.
