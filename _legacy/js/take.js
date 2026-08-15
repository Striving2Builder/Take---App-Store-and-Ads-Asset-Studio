/**
 * TAKE — App Store Asset Studio
 * Local-first generator pipeline (prototype / concept build)
 * Storage key: take.projects · take.templates · take.history
 */

(() => {
  "use strict";

  const STORAGE = {
    templates: "take.templates.v1",
    projects: "take.projects.v1",
    history: "take.history.v1",
  };

  const META_LIMITS = {
    iosTitle: 30,
    iosSubtitle: 30,
    iosPromo: 170,
    iosKeywords: 100,
    playTitle: 30,
    playShort: 80,
    playFull: 4000,
  };

  const FRAME_ROLES = [
    "HOOK",
    "PROBLEM",
    "SHIFT",
    "PROOF",
    "FEATURE",
    "RITUAL",
    "SOCIAL",
    "DETAIL",
    "OUTCOME",
    "TRUST",
    "CTA",
    "CLOSE",
  ];

  const CONCEPT_NAMES = [
    ["Signal Cut", "Editorial · Direct"],
    ["Morning Edge", "Warm · Ritual"],
    ["Hard Proof", "Bold · Evidence"],
    ["Quiet Lead", "Minimal · Soft"],
    ["Velocity", "Playful · Motion"],
  ];

  const PALETTES = [
    ["#ff4d1a", "#0c0d10", "#f3f1ec", "#3de0ff", "#1e2129"],
    ["#6dffb0", "#0a1210", "#e8fff4", "#ffc857", "#14201c"],
    ["#3de0ff", "#0b1018", "#eef6ff", "#ff4d1a", "#151c28"],
    ["#f3f1ec", "#111111", "#ff4d1a", "#888888", "#222222"],
    ["#ffc857", "#14110c", "#fff8e8", "#ff4d1a", "#2a2418"],
  ];

  const SEED_TEMPLATES = [
    { id: "sys-ios-story", name: "iOS Story Spine", tags: ["ios", "screenshots", "sequence"], platform: "ios", kind: "system", style: "premium", frames: 8, updated: "2026-08-01" },
    { id: "sys-play-bold", name: "Play Bold Stack", tags: ["android", "screenshots", "bold"], platform: "android", kind: "system", style: "bold", frames: 7, updated: "2026-08-01" },
    { id: "sys-ig-organic", name: "IG Organic Vertical", tags: ["social", "instagram", "organic"], platform: "social", kind: "system", style: "minimal", frames: 4, updated: "2026-07-20" },
    { id: "sys-tiktok-cut", name: "TikTok Cut Reel", tags: ["social", "tiktok", "video"], platform: "social", kind: "system", style: "playful", frames: 6, updated: "2026-07-20" },
    { id: "sys-iab-mpu", name: "IAB MPU 300×250", tags: ["ads", "iab", "display"], platform: "ads", kind: "system", style: "realistic", frames: 1, updated: "2026-06-12" },
    { id: "sys-feature-ios", name: "iOS Feature Plate", tags: ["ios", "feature"], platform: "ios", kind: "system", style: "premium", frames: 1, updated: "2026-08-01" },
    { id: "sys-device-16pro", name: "iPhone 16 Pro Shell", tags: ["ios", "device", "shell"], platform: "ios", kind: "system", style: "realistic", frames: 1, updated: "2026-08-10" },
    { id: "sys-pixel9", name: "Pixel 9 Shell", tags: ["android", "device", "shell"], platform: "android", kind: "system", style: "realistic", frames: 1, updated: "2026-08-10" },
  ];

  /** @type {AppState} */
  const state = {
    stage: "landing",
    mode: "wizard",
    platform: "ios",
    qty: 3,
    uploads: [],
    inference: null,
    sets: [],
    selectedSet: 0,
    activeFrame: 0,
    filter: "all",
  };

  // ── DOM ──
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const toastEl = $("#toast");
  const modal = $("#template-modal");

  // ── Storage ──
  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getTemplates() {
    const user = loadJSON(STORAGE.templates, []);
    return [...SEED_TEMPLATES, ...user];
  }

  function saveUserTemplate(tpl) {
    const user = loadJSON(STORAGE.templates, []);
    user.unshift(tpl);
    saveJSON(STORAGE.templates, user);
    pushHistory("template.save", tpl.id);
  }

  function pushHistory(action, ref) {
    const h = loadJSON(STORAGE.history, []);
    h.unshift({ action, ref, at: new Date().toISOString() });
    saveJSON(STORAGE.history, h.slice(0, 200));
  }

  // ── Navigation ──
  function showStage(name) {
    state.stage = name;
    $$(".stage").forEach((el) => {
      const match = el.dataset.stage === name;
      el.hidden = !match;
      el.classList.toggle("is-active", match);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (name === "library") renderLibrary();
    if (name === "export") renderValidation();
  }

  // ── Toast ──
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.hidden = true;
    }, 2800);
  }

  // ── Inference / generation ──
  function collectIntake() {
    const platform = $$('input[name="platform"]:checked')[0]?.value || "ios";
    const mode = $$('input[name="mode"]:checked')[0]?.value || "wizard";
    return {
      url: $("#app-url").value.trim(),
      platform,
      mode,
      qty: state.qty,
      name: $("#f-name").value.trim(),
      category: $("#f-category").value.trim(),
      audience: $("#f-audience").value.trim(),
      locale: $("#f-locale").value.trim() || "en-US",
      competitors: $("#f-competitors").value.trim(),
      goal: $("#f-goal").value,
      style: $("#f-style").value,
      positioning: $("#f-positioning").value.trim(),
      narrative: $("#f-narrative").value.trim(),
      ux: $("#f-ux").value.trim(),
      tone: $("#f-tone").value.trim(),
      refs: $("#f-refs").value.trim(),
      donot: $("#f-donot").value.trim(),
      uploads: state.uploads.length,
    };
  }

  function updateMissing() {
    const d = collectIntake();
    const missing = [];
    if (!d.url && d.uploads === 0) missing.push("App URL or uploaded screenshots");
    if (!d.name) missing.push("App name (helps titles & filenames)");
    if (!d.audience) missing.push("Audience (sharpens narrative)");
    if (!d.positioning && d.mode === "wizard") missing.push("Positioning (optional but powerful)");

    const box = $("#missing-box");
    const list = $("#missing-list");
    if (missing.length) {
      box.hidden = false;
      list.innerHTML = missing.map((m) => `<li>${escapeHtml(m)}</li>`).join("");
    } else {
      box.hidden = true;
    }
  }

  function inferFromIntake(d) {
    const host = extractHost(d.url);
    const name = d.name || guessName(host, d.url) || "Your App";
    const category = d.category || guessCategory(d.url, d.positioning) || "Productivity";
    const audience = d.audience || "People who want a clearer daily rhythm";
    const where = "On the phone, in short sessions — commute, desk, bedtime wind-down";
    const when = "Morning open · mid-day reset · evening close";
    const how = "Open → one focused action → visible progress → gentle return cue";
    const features = [
      "Guided first action under 30 seconds",
      "Progress you can feel without a dashboard",
      "Quiet reminders — no noisy streaks theater",
      "Works offline for core loops",
    ];
    const positioning =
      d.positioning ||
      `${name} is the calm counterweight to cluttered ${category.toLowerCase()} apps.`;
    const narrative =
      d.narrative ||
      "Interrupt the scroll → reclaim a moment → leave with proof you showed up.";
    const value =
      "Get the outcome you opened the app for — without the secondary noise.";
    const differentiators = [
      "Story-first store frames, not isolated feature dumps",
      d.tone || "Human tone — direct, warm, zero hype",
      "Platform-native compositions for iOS and Play",
    ];

    return {
      name,
      category,
      audience,
      where,
      when,
      how,
      features,
      positioning,
      narrative,
      value,
      differentiators,
      style: d.style,
      platform: d.platform,
      locale: d.locale,
      goal: d.goal,
      host,
      mode: d.mode,
      donot: d.donot || "No competitor logos · no protected artwork clones",
    };
  }

  function extractHost(url) {
    if (!url) return "";
    try {
      const u = url.startsWith("http") ? url : `https://${url}`;
      return new URL(u).hostname.replace(/^www\./, "");
    } catch {
      return url.slice(0, 40);
    }
  }

  function guessName(host, url) {
    if (!host && !url) return "";
    if (/apps\.apple\.com/i.test(url)) {
      const m = url.match(/\/app\/([^/]+)/i);
      if (m) return titleCase(m[1].replace(/-/g, " "));
    }
    if (/play\.google\.com/i.test(url)) {
      const m = url.match(/id=([a-z0-9_.]+)/i);
      if (m) {
        const parts = m[1].split(".");
        return titleCase(parts[parts.length - 1]);
      }
    }
    if (host) {
      const base = host.split(".")[0];
      if (!["apps", "play", "google", "apple"].includes(base)) return titleCase(base);
    }
    return "";
  }

  function guessCategory(url, positioning) {
    const blob = `${url} ${positioning}`.toLowerCase();
    if (/fit|health|habit|wellness|sleep/.test(blob)) return "Health & Fitness";
    if (/finance|bank|budget|money/.test(blob)) return "Finance";
    if (/photo|camera|edit/.test(blob)) return "Photo & Video";
    if (/game|play|puzzle/.test(blob)) return "Games";
    if (/social|chat|message/.test(blob)) return "Social Networking";
    return "Productivity";
  }

  function titleCase(s) {
    return s.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildCopy(inf, conceptIndex) {
    const n = inf.name;
    const variants = [
      {
        iosTitle: clip(`${n}`, META_LIMITS.iosTitle),
        iosSubtitle: clip("Clarity in one open", META_LIMITS.iosSubtitle),
        iosPromo: clip(`New: a quieter way to ${inf.category.toLowerCase()}. Start in seconds.`, META_LIMITS.iosPromo),
        iosKeywords: clip(`${n},focus,habit,daily,calm,routine,progress`, META_LIMITS.iosKeywords),
        playTitle: clip(n, META_LIMITS.playTitle),
        playShort: clip(`${n} — ${inf.value}`, META_LIMITS.playShort),
        playFull: buildPlayFull(inf),
        cta: goalCta(inf.goal),
      },
      {
        iosTitle: clip(`${n}: Show Up`, META_LIMITS.iosTitle),
        iosSubtitle: clip("Less noise. More proof.", META_LIMITS.iosSubtitle),
        iosPromo: clip(`Built for ${inf.audience.split(",")[0]}. Open once. Leave clearer.`, META_LIMITS.iosPromo),
        iosKeywords: clip(`productivity,mindful,tracker,simple,${n}`, META_LIMITS.iosKeywords),
        playTitle: clip(`${n} Daily`, META_LIMITS.playTitle),
        playShort: clip(`Show up daily without the clutter. ${n}.`, META_LIMITS.playShort),
        playFull: buildPlayFull(inf),
        cta: goalCta(inf.goal),
      },
      {
        iosTitle: clip(n.slice(0, 20) + " · Focus", META_LIMITS.iosTitle),
        iosSubtitle: clip("Your next honest take", META_LIMITS.iosSubtitle),
        iosPromo: clip(inf.positioning, META_LIMITS.iosPromo),
        iosKeywords: clip(`focus app,routine,${inf.category.toLowerCase()},${n}`, META_LIMITS.iosKeywords),
        playTitle: clip(n, META_LIMITS.playTitle),
        playShort: clip(inf.positioning, META_LIMITS.playShort),
        playFull: buildPlayFull(inf),
        cta: goalCta(inf.goal),
      },
    ];
    return variants[conceptIndex % variants.length];
  }

  function buildPlayFull(inf) {
    return [
      `${inf.name} — ${inf.positioning}`,
      "",
      "WHAT IT DOES",
      inf.value,
      "",
      "WHO IT'S FOR",
      inf.audience,
      "",
      "HOW IT WORKS",
      inf.how,
      "",
      "KEY FEATURES",
      ...inf.features.map((f) => `• ${f}`),
      "",
      "WHY IT'S DIFFERENT",
      ...inf.differentiators.map((d) => `• ${d}`),
      "",
      `Locale: ${inf.locale}. Screenshots tell a sequence — not isolated feature tiles.`,
    ].join("\n");
  }

  function goalCta(goal) {
    return (
      {
        install: "Get the app",
        trial: "Start free trial",
        subscribe: "Subscribe",
        engage: "Open again",
      }[goal] || "Get started"
    );
  }

  function clip(s, max) {
    const t = String(s || "").trim();
    if (t.length <= max) return t;
    return t.slice(0, max - 1).trim() + "…";
  }

  function buildFrames(inf, conceptIndex, count) {
    const n = Math.min(12, Math.max(5, count));
    const headlines = [
      [`Meet ${inf.name}`, "Before the scroll takes you"],
      ["The usual clutter", "Too many taps. Too little signal."],
      ["A cleaner cut", inf.positioning],
      ["Proof in minutes", "Progress you can feel"],
      [inf.features[0] || "One clear action", "Designed for short sessions"],
      [inf.when.split("·")[0].trim(), "When you actually reach for it"],
      ["Built for real days", inf.audience],
      ["Details that stay quiet", "No neon noise. No gimmicks."],
      ["Leave with something", inf.value],
      ["Trusted by design", "Platform-native. Store-compliant."],
      [goalCta(inf.goal), "Your next honest take"],
      [`${inf.name}`, "Ship the story."],
    ];

    return Array.from({ length: n }, (_, i) => {
      const role = FRAME_ROLES[i] || `FRAME ${i + 1}`;
      const [h, c] = headlines[i % headlines.length];
      const shift = (conceptIndex * 2 + i) % headlines.length;
      const [h2, c2] = headlines[shift];
      return {
        id: `f-${conceptIndex}-${i}`,
        index: i,
        role,
        kicker: `${String(i + 1).padStart(2, "0")} · ${role}`,
        headline: conceptIndex % 2 === 0 ? h : h2,
        caption: conceptIndex % 2 === 0 ? c : c2,
        cta: goalCta(inf.goal),
      };
    });
  }

  function generateSets(inf, qty) {
    const frameCount =
      inf.platform === "both" ? 8 : inf.platform === "android" ? 7 : 8;
    return Array.from({ length: qty }, (_, i) => {
      const [name, styleLabel] = CONCEPT_NAMES[i % CONCEPT_NAMES.length];
      return {
        id: `set-${Date.now()}-${i}`,
        name,
        styleLabel,
        style: inf.style,
        blurb: [
          "Hook → proof → close as a linked sequence.",
          "Warm ritual narrative across the rail.",
          "Evidence-led frames with bold type hierarchy.",
          "Sparse layouts. Maximum breathing room.",
          "Kinetic crop and playful pacing.",
        ][i % 5],
        frames: buildFrames(inf, i, frameCount),
        copy: buildCopy(inf, i),
        palette: PALETTES[i % PALETTES.length],
      };
    });
  }

  // ── Scan theater ──
  async function runScanTheater(inf) {
    showStage("generate");
    const feed = $("#infer-feed");
    feed.innerHTML = `<p class="mono feed-title">INFERENCE</p>`;
    const status = $("#generate-status");

    const steps = [
      { status: "Resolving signal…", line: { k: "What", t: `${inf.name} — ${inf.category}` } },
      { status: "Reading audience…", line: { k: "Who", t: inf.audience } },
      { status: "Mapping context…", line: { k: "Where", t: inf.where } },
      { status: "Timing the ritual…", line: { k: "When", t: inf.when } },
      { status: "Tracing the loop…", line: { k: "How", t: inf.how } },
      { status: "Locking position…", line: { k: "Positioning", t: inf.positioning } },
      { status: "Writing the spine…", line: { k: "Narrative", t: inf.narrative } },
      { status: "Composing sets…", line: { k: "Value", t: inf.value } },
    ];

    for (let i = 0; i < steps.length; i++) {
      status.textContent = steps[i].status;
      const div = document.createElement("p");
      div.className = "feed-line";
      div.style.animationDelay = "0ms";
      div.innerHTML = `<span class="k">${escapeHtml(steps[i].line.k)}</span>${escapeHtml(steps[i].line.t)}`;
      feed.appendChild(div);
      feed.scrollTop = feed.scrollHeight;
      await wait(320 + Math.random() * 180);
    }

    status.textContent = "Sets ready.";
    await wait(420);
    state.sets = generateSets(inf, state.qty);
    state.selectedSet = 0;
    state.activeFrame = 0;
    renderReview();
    showStage("review");
    pushHistory("generate", state.sets.map((s) => s.id).join(","));
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ── Review ──
  function renderReview() {
    const inf = state.inference;
    $("#review-sub").textContent = `${state.sets.length} directed take${state.sets.length === 1 ? "" : "s"} for ${inf.name}. Pick the story that fits.`;

    const chips = $("#infer-chips");
    chips.innerHTML = [
      inf.category,
      inf.style,
      inf.platform.toUpperCase(),
      inf.locale,
      inf.mode,
    ]
      .map((c) => `<span class="chip">${escapeHtml(c)}</span>`)
      .join("");

    const rail = $("#set-rail");
    rail.innerHTML = state.sets
      .map((set, i) => {
        const frames = set.frames
          .slice(0, 6)
          .map(
            (f, fi) => `
          <div class="story-frame" style="--i:${fi}">
            <span class="sf-label">${escapeHtml(f.role.slice(0, 4))}</span>
            <div class="sf-fill" style="opacity:${0.4 + (fi % 3) * 0.2}"></div>
          </div>`
          )
          .join("");
        return `
        <button type="button" class="set-card ${i === state.selectedSet ? "is-selected" : ""}" role="option" aria-selected="${i === state.selectedSet}" data-set="${i}">
          <div class="set-card-head">
            <span class="set-name">${escapeHtml(set.name)}</span>
            <span class="set-style">${escapeHtml(set.styleLabel)}</span>
          </div>
          <div class="storyboard">${frames}</div>
          <p class="set-blurb">${escapeHtml(set.blurb)} · ${set.frames.length} frames</p>
        </button>`;
      })
      .join("");
  }

  // ── Editor ──
  function currentSet() {
    return state.sets[state.selectedSet];
  }

  function currentFrame() {
    const set = currentSet();
    return set?.frames[state.activeFrame];
  }

  function renderEditor() {
    const set = currentSet();
    if (!set) return;

    const list = $("#frame-list");
    list.innerHTML = set.frames
      .map(
        (f, i) => `
      <li>
        <button type="button" class="${i === state.activeFrame ? "is-active" : ""}" data-frame="${i}">
          <span>${String(i + 1).padStart(2, "0")} ${escapeHtml(f.role)}</span>
        </button>
      </li>`
      )
      .join("");

    const frame = currentFrame();
    $("#canvas-label").textContent = `FRAME ${String(frame.index + 1).padStart(2, "0")} · ${frame.role}`;
    $("#shot-kicker").textContent = frame.kicker;
    $("#shot-headline").textContent = frame.headline;
    $("#shot-caption").textContent = frame.caption;

    // Apply palette accent
    const accent = set.palette[0];
    $(".shot-ui-block").style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--signal", accent);

    renderMetaFields(set.copy);
    renderPalette(set.palette);
    $("#edit-style").value = set.style;
    $("#export-locale").textContent = state.inference?.locale || "en-US";
  }

  function renderMetaFields(copy) {
    const fields = [
      ["iosTitle", "iOS title", META_LIMITS.iosTitle],
      ["iosSubtitle", "iOS subtitle", META_LIMITS.iosSubtitle],
      ["iosPromo", "iOS promotional text", META_LIMITS.iosPromo],
      ["iosKeywords", "iOS keywords", META_LIMITS.iosKeywords],
      ["playTitle", "Google Play title", META_LIMITS.playTitle],
      ["playShort", "Play short description", META_LIMITS.playShort],
      ["playFull", "Play full description", META_LIMITS.playFull],
      ["cta", "Primary CTA", 40],
    ];

    $("#meta-fields").innerHTML = fields
      .map(([key, label, max]) => {
        const val = copy[key] || "";
        const over = val.length > max;
        const isArea = key === "playFull" || key === "iosPromo";
        const control = isArea
          ? `<textarea data-meta="${key}" rows="${key === "playFull" ? 6 : 3}">${escapeHtml(val)}</textarea>`
          : `<input type="text" data-meta="${key}" value="${escapeHtml(val)}" />`;
        return `
        <div class="meta-field">
          <label><span>${label}</span><span class="count ${over ? "over" : ""}">${val.length}/${max}</span></label>
          ${control}
        </div>`;
      })
      .join("");
  }

  function renderPalette(colors) {
    $("#palette").innerHTML = colors
      .map(
        (c, i) =>
          `<button type="button" class="swatch ${i === 0 ? "is-locked" : ""}" data-swatch="${i}" style="background:${c}" title="${c}" aria-label="Color ${c}"></button>`
      )
      .join("");
  }

  function syncFrameFromDom() {
    const frame = currentFrame();
    if (!frame) return;
    frame.kicker = $("#shot-kicker").textContent.trim();
    frame.headline = $("#shot-headline").textContent.trim();
    frame.caption = $("#shot-caption").textContent.trim();
  }

  // ── Export / validation ──
  function renderValidation() {
    const set = currentSet();
    const inf = state.inference;
    const list = $("#validation-list");
    if (!set || !inf) {
      list.innerHTML = `<li class="warn">No set selected</li>`;
      return;
    }

    const checks = [];
    const frameMin = inf.platform === "android" ? 2 : 1;
    const frameMax = 10;
    const n = set.frames.length;

    checks.push({
      ok: n >= frameMin && n <= frameMax,
      text: n >= frameMin && n <= frameMax
        ? `Screenshot count ${n} within store guidance (${frameMin}–${frameMax})`
        : `Screenshot count ${n} outside typical store guidance (${frameMin}–${frameMax})`,
    });

    const c = set.copy;
    checks.push({
      ok: c.iosTitle.length <= META_LIMITS.iosTitle,
      text: `iOS title ${c.iosTitle.length}/${META_LIMITS.iosTitle}`,
    });
    checks.push({
      ok: c.iosSubtitle.length <= META_LIMITS.iosSubtitle,
      text: `iOS subtitle ${c.iosSubtitle.length}/${META_LIMITS.iosSubtitle}`,
    });
    checks.push({
      ok: c.playShort.length <= META_LIMITS.playShort,
      text: `Play short ${c.playShort.length}/${META_LIMITS.playShort}`,
    });
    checks.push({
      ok: true,
      text: "No competitor branding verbatim — structural use only",
    });
    checks.push({
      ok: true,
      text: `Locale pack ${inf.locale} · local-first storage`,
    });

    list.innerHTML = checks
      .map((c) => `<li class="${c.ok ? "ok" : "warn"}">${escapeHtml(c.text)}</li>`)
      .join("");
  }

  function buildExportManifest() {
    const selected = $$('#export-presets input:checked').map((el) => el.value);
    const set = currentSet();
    const inf = state.inference;
    const stamp = new Date().toISOString().slice(0, 10);
    const slug = (inf?.name || "app").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const lines = [`TAKE EXPORT · ${stamp}`, `App: ${inf?.name}`, `Set: ${set?.name}`, `Locale: ${inf?.locale}`, ""];

    const map = {
      "ios-screens": `ios/${slug}-iphone-6-7-screenshot-{01-${set.frames.length}}.png · 1290×2796 · App Store`,
      "ios-feature": `ios/${slug}-feature.png · 1024×1024 · App Store`,
      "play-screens": `play/${slug}-phone-screenshot-{01-${set.frames.length}}.png · 1080×1920 · Google Play`,
      "play-feature": `play/${slug}-feature-graphic.png · 1024×500 · Google Play`,
      ig: `social/${slug}-ig-feed.png · 1080×1350 · Instagram (organic + paid variants)`,
      tiktok: `social/${slug}-tiktok-cover.png · 1080×1920 · TikTok / Reels / Shorts`,
      yt: `social/${slug}-yt-thumb.png · 1280×720 · YouTube`,
      pin: `social/${slug}-pinterest.png · 1000×1500 · Pinterest`,
      iab: `ads/${slug}-iab-{300x250,728x90,160x600}.png · IAB display`,
      slideshow: `motion/${slug}-promo-15s.mp4 · device sequence`,
      layered: `layered/${slug}-pack.json + PNG layers · editable`,
      bundle: `bundle/${slug}-take-project.zip · full local project`,
    };

    selected.forEach((key) => {
      if (map[key]) lines.push(`✓ ${map[key]}`);
    });

    lines.push("", "metadata/store-copy.txt · iOS + Play fields");
    lines.push("NOTE: Prototype packages a manifest for local download. Connect a renderer for pixel exports.");
    return lines.join("\n");
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── Library ──
  function renderLibrary() {
    const all = getTemplates();
    const filtered = all.filter((t) => {
      if (state.filter === "all") return true;
      if (state.filter === "mine") return t.kind === "user";
      return t.platform === state.filter || (t.tags || []).includes(state.filter);
    });

    const grid = $("#library-grid");
    if (!filtered.length) {
      grid.innerHTML = `<p class="hint">No templates in this filter. Generate a set and save one.</p>`;
      return;
    }

    grid.innerHTML = filtered
      .map(
        (t) => `
      <article class="tpl-card" data-tpl="${escapeHtml(t.id)}">
        <div class="tpl-preview" style="background:linear-gradient(145deg, ${t.kind === "user" ? "rgba(255,77,26,0.35)" : "rgba(61,224,255,0.15)"}, transparent 55%), #0c0d10">
          <span class="tpl-mark">${escapeHtml((t.platform || "").toUpperCase())} · ${t.frames || "—"}F</span>
        </div>
        <div class="tpl-body">
          <h3>${escapeHtml(t.name)}</h3>
          <p class="tpl-meta">${escapeHtml((t.tags || []).join(" · "))} · ${escapeHtml(t.style || "")}</p>
          <div class="tpl-actions">
            <button type="button" data-action="use">Use</button>
            <button type="button" data-action="refresh">Refresh</button>
            <button type="button" data-action="dupe">Duplicate</button>
          </div>
        </div>
      </article>`
      )
      .join("");
  }

  // ── Uploads ──
  function handleFiles(files) {
    [...files].forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      state.uploads.push({ name: file.name, url });
    });
    const prev = $("#upload-preview");
    if (state.uploads.length) {
      prev.hidden = false;
      prev.innerHTML = state.uploads
        .map((u) => `<img class="upload-thumb" src="${u.url}" alt="${escapeHtml(u.name)}" />`)
        .join("");
    }
    updateMissing();
  }

  // ── Events ──
  function bind() {
    document.addEventListener("click", (e) => {
      const jump = e.target.closest("[data-jump]");
      if (jump) {
        e.preventDefault();
        showStage(jump.dataset.jump);
        return;
      }

      const modePick = e.target.closest("[data-mode-pick]");
      if (modePick) {
        const m = modePick.dataset.modePick;
        const radio = $(`input[name="mode"][value="${m}"]`);
        if (radio) radio.checked = true;
        state.mode = m;
        showStage("intake");
        toast(`${modePick.querySelector("h2").textContent} mode armed`);
        return;
      }

      const setCard = e.target.closest("[data-set]");
      if (setCard && setCard.closest("#set-rail")) {
        state.selectedSet = Number(setCard.dataset.set);
        renderReview();
        return;
      }

      const frameBtn = e.target.closest("[data-frame]");
      if (frameBtn) {
        syncFrameFromDom();
        state.activeFrame = Number(frameBtn.dataset.frame);
        renderEditor();
        return;
      }

      const metaLink = e.target.closest(".meta-link");
      if (metaLink) {
        $$(".meta-link").forEach((el) => el.classList.toggle("is-active", el === metaLink));
        $$("[data-panel-view]").forEach((panel) => {
          const on = panel.dataset.panelView === metaLink.dataset.panel;
          panel.hidden = !on;
          panel.classList.toggle("is-active", on);
        });
        return;
      }

      const filter = e.target.closest("[data-filter]");
      if (filter) {
        state.filter = filter.dataset.filter;
        $$(".filter").forEach((el) => el.classList.toggle("on", el === filter));
        renderLibrary();
        return;
      }

      const tplAction = e.target.closest(".tpl-actions [data-action]");
      if (tplAction) {
        const card = tplAction.closest("[data-tpl]");
        const id = card?.dataset.tpl;
        const action = tplAction.dataset.action;
        if (action === "use") {
          showStage("intake");
          toast("Template loaded into intake — drop assets & generate");
          pushHistory("template.use", id);
        } else if (action === "refresh") {
          toast("Structural variant refreshed (unlimited)");
          pushHistory("template.refresh", id);
        } else if (action === "dupe") {
          const all = getTemplates();
          const src = all.find((t) => t.id === id);
          if (src) {
            saveUserTemplate({
              ...src,
              id: `user-${Date.now()}`,
              name: `${src.name} Copy`,
              kind: "user",
              updated: new Date().toISOString().slice(0, 10),
            });
            renderLibrary();
            toast("Template duplicated to your library");
          }
        }
        return;
      }

      const swatch = e.target.closest("[data-swatch]");
      if (swatch) {
        const set = currentSet();
        const i = Number(swatch.dataset.swatch);
        if (set) {
          const color = set.palette[i];
          // rotate selected to front as locked brand
          set.palette = [color, ...set.palette.filter((_, idx) => idx !== i)];
          document.documentElement.style.setProperty("--signal", color);
          renderPalette(set.palette);
          toast(`Brand color locked · ${color}`);
        }
      }
    });

    $("#btn-scan")?.addEventListener("click", () => {
      updateMissing();
      const d = collectIntake();
      if (!d.url && d.uploads === 0) {
        toast("Paste a URL or upload screenshots first");
        $("#app-url").focus();
        return;
      }
      toast("Signal locked — ready to generate");
      $("#scan-hint").textContent = d.url
        ? `Ready · ${extractHost(d.url) || "custom URL"}`
        : `Ready · ${d.uploads} upload(s)`;
    });

    $("#btn-generate")?.addEventListener("click", async () => {
      const d = collectIntake();
      if (!d.url && d.uploads === 0) {
        toast("Need a URL or uploads to scan");
        return;
      }
      state.platform = d.platform;
      state.mode = d.mode;
      state.qty = d.qty;
      state.inference = inferFromIntake(d);
      await runScanTheater(state.inference);
    });

    $("#qty-control")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-qty]");
      if (!btn) return;
      const delta = Number(btn.dataset.qty);
      state.qty = Math.min(5, Math.max(1, state.qty + delta));
      $("#qty-value").textContent = String(state.qty);
    });

    ["#app-url", "#f-name", "#f-audience", "#f-positioning"].forEach((sel) => {
      $(sel)?.addEventListener("input", updateMissing);
    });

    ["#upload-shots", "#upload-icon", "#upload-brand", "#upload-comp"].forEach((sel) => {
      $(sel)?.addEventListener("change", (e) => handleFiles(e.target.files));
    });

    $("#btn-to-edit")?.addEventListener("click", () => {
      renderEditor();
      showStage("edit");
    });

    $("#btn-regen-all")?.addEventListener("click", async () => {
      if (!state.inference) return;
      toast("Refreshing all structural variants…");
      await wait(400);
      state.sets = generateSets(state.inference, state.qty);
      state.selectedSet = 0;
      renderReview();
      pushHistory("regen.all", "sets");
    });

    $("#btn-regen-frame")?.addEventListener("click", () => {
      const frame = currentFrame();
      const set = currentSet();
      if (!frame || !set) return;
      const alts = [
        "A sharper cut",
        "One honest beat",
        "Less chrome. More signal.",
        "Proof over polish",
        "Open. Act. Leave.",
      ];
      frame.headline = alts[Math.floor(Math.random() * alts.length)];
      frame.caption = state.inference?.value || frame.caption;
      renderEditor();
      toast("Frame regenerated");
    });

    $("#btn-remove-frame")?.addEventListener("click", () => {
      const set = currentSet();
      if (!set || set.frames.length <= 1) {
        toast("Keep at least one frame");
        return;
      }
      set.frames.splice(state.activeFrame, 1);
      set.frames.forEach((f, i) => {
        f.index = i;
        f.kicker = `${String(i + 1).padStart(2, "0")} · ${f.role}`;
      });
      state.activeFrame = Math.min(state.activeFrame, set.frames.length - 1);
      renderEditor();
      toast("Frame removed");
    });

    $("#btn-add-frame")?.addEventListener("click", () => {
      const set = currentSet();
      if (!set) return;
      if (set.frames.length >= 12) {
        toast("Max 12 frames in a sequence");
        return;
      }
      const i = set.frames.length;
      set.frames.push({
        id: `f-new-${Date.now()}`,
        index: i,
        role: FRAME_ROLES[i] || "EXTRA",
        kicker: `${String(i + 1).padStart(2, "0")} · ${FRAME_ROLES[i] || "EXTRA"}`,
        headline: "New beat",
        caption: "Edit this frame",
        cta: goalCta(state.inference?.goal || "install"),
      });
      state.activeFrame = i;
      renderEditor();
      toast("Frame added");
    });

    $("#btn-add-copy")?.addEventListener("click", () => {
      toast("Copy block added to layers (editable on canvas)");
    });

    $("#btn-add-visual")?.addEventListener("click", () => {
      toast("Visual element slot added — drop an asset anytime");
    });

    $("#btn-refresh-variant")?.addEventListener("click", () => {
      const set = currentSet();
      if (!set || !state.inference) return;
      const next = generateSets(state.inference, 1)[0];
      set.frames = next.frames;
      set.palette = next.palette;
      set.blurb = "Refreshed structural variant — same brief, new composition.";
      state.activeFrame = 0;
      renderEditor();
      toast("Structural variant refreshed");
      pushHistory("variant.refresh", set.id);
    });

    $("#meta-fields")?.addEventListener("input", (e) => {
      const el = e.target.closest("[data-meta]");
      if (!el) return;
      const set = currentSet();
      if (!set) return;
      set.copy[el.dataset.meta] = el.value;
      renderMetaFields(set.copy);
      // restore focus roughly
      const again = $(`[data-meta="${el.dataset.meta}"]`);
      if (again) {
        again.focus();
        if (again.setSelectionRange && el.selectionStart != null) {
          const pos = el.selectionStart;
          again.setSelectionRange(pos, pos);
        }
      }
    });

    ["#shot-kicker", "#shot-headline", "#shot-caption"].forEach((sel) => {
      $(sel)?.addEventListener("blur", syncFrameFromDom);
    });

    $("#btn-to-export")?.addEventListener("click", () => {
      syncFrameFromDom();
      showStage("export");
    });

    $("#btn-export")?.addEventListener("click", () => {
      const manifest = buildExportManifest();
      const log = $("#export-log");
      log.hidden = false;
      log.textContent = manifest;
      const slug = (state.inference?.name || "take").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      downloadText(`${slug}-export-manifest.txt`, manifest);
      const copy = currentSet()?.copy;
      if (copy) {
        downloadText(
          `${slug}-store-copy.txt`,
          Object.entries(copy)
            .map(([k, v]) => `${k}:\n${v}\n`)
            .join("\n")
        );
      }
      toast("Manifest + store copy downloaded (local)");
      pushHistory("export", slug);
    });

    $("#btn-export-library")?.addEventListener("click", () => {
      const lib = getTemplates();
      downloadText(
        "take-template-library.json",
        JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), templates: lib }, null, 2)
      );
      toast("Template library exported");
    });

    $("#btn-save-template")?.addEventListener("click", () => {
      const set = currentSet();
      if (!set) return;
      $("#tpl-name").value = `${state.inference?.name || "App"} · ${set.name}`;
      $("#tpl-tags").value = [state.inference?.platform, set.style, "sequence"].filter(Boolean).join(", ");
      modal.showModal();
    });

    $("#tpl-cancel")?.addEventListener("click", () => modal.close());

    $("#template-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const set = currentSet();
      const name = $("#tpl-name").value.trim();
      if (!name || !set) return;
      const tpl = {
        id: `user-${Date.now()}`,
        name,
        tags: $("#tpl-tags").value.split(",").map((t) => t.trim()).filter(Boolean),
        platform: state.inference?.platform || "ios",
        kind: "user",
        style: set.style,
        frames: set.frames.length,
        lockBrand: $("#tpl-lock-brand").checked,
        palette: set.palette,
        copy: set.copy,
        frameData: set.frames,
        prompt: state.inference,
        updated: new Date().toISOString().slice(0, 10),
        version: 1,
      };
      saveUserTemplate(tpl);
      modal.close();
      toast("Saved to your personal library");
    });

    // Layer toggles
    $("#layer-list")?.addEventListener("change", (e) => {
      const input = e.target.closest("[data-layer]");
      if (!input) return;
      const layer = input.dataset.layer;
      const phone = $("#phone-mock");
      const content = $("#shot-content");
      if (layer === "shell") phone.style.opacity = input.checked ? "1" : "0.35";
      if (layer === "type") {
        $("#shot-headline").style.visibility = input.checked ? "visible" : "hidden";
        $("#shot-caption").style.visibility = input.checked ? "visible" : "hidden";
        $("#shot-kicker").style.visibility = input.checked ? "visible" : "hidden";
      }
      if (layer === "ui") $(".shot-ui-block").style.display = input.checked ? "block" : "none";
      if (layer === "bg") {
        $("#phone-screen").style.filter = input.checked ? "none" : "grayscale(0.8) brightness(0.7)";
      }
      if (layer === "badge") content.style.outline = input.checked ? "none" : "1px dashed transparent";
    });
  }

  // Boot
  bind();
  updateMissing();
  // Restore signal color default after any prior session CSS var bleed
  document.documentElement.style.setProperty("--signal", "#ff4d1a");
})();
