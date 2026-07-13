import { STYLES, STYLE_META, activeCaptions, state } from "./state.js";

const byId = (id) => document.getElementById(id);

export const el = {
  appStatus: byId("app-status"),
  gemmaToggle: byId("gemma-mode-toggle"),
  heroGemmaToggle: byId("hero-gemma-toggle"),
  gemmaModeStatus: byId("gemma-mode-status"),
  gemmaReveal: byId("gemma-reveal"),
  videoUrl: byId("video-url-input"),
  videoUrlError: byId("video-url-error"),
  fileInput: byId("video-file-input"),
  browseFile: byId("browse-file-btn"),
  sourceRow: byId("source-row"),
  generateBtn: byId("generate-btn"),
  generateBtnIcon: byId("generate-btn-icon"),
  generateBtnLabel: byId("generate-btn-label"),
  clearVideoBtn: byId("clear-video-btn"),
  uploadFileName: byId("upload-file-name"),
  uploadProgressText: byId("upload-progress-text"),
  uploadProgressWrap: byId("upload-progress-wrap"),
  uploadProgressBar: byId("upload-progress-bar"),
  uploadMiniSpinner: byId("upload-mini-spinner"),
  videoPanel: byId("video-preview-panel"),
  videoPreview: byId("video-preview"),
  videoSourceLabel: byId("video-source-label"),
  videoEmptyState: byId("video-empty-state"),
  systemMode: byId("system-mode-value"),
  pipelineState: byId("pipeline-state-value"),
  workspaceStep: byId("workspace-step-badge"),
  activeCard: byId("active-tone-card"),
  activeToneIcon: byId("active-tone-icon"),
  activeToneLabel: byId("active-tone-label"),
  activeToneLanguage: byId("active-tone-language"),
  activeToneRegistry: byId("active-tone-registry"),
  activeStatus: byId("active-style-status"),
  activeStage: byId("active-style-stage"),
  activeThumbnailShell: byId("active-thumbnail-shell"),
  activeThumbnailImage: byId("active-thumbnail-image"),
  activeThumbnailPlaceholder: byId("active-thumbnail-placeholder"),
  activeThumbnailLoader: byId("active-thumbnail-loader"),
  activeThumbnailLoaderLabel: byId("active-thumbnail-loader-label"),
  activeGenerationPhrase: byId("active-generation-phrase"),
  activeGenerationLog: byId("active-generation-log"),
  activeCaption: byId("active-caption-text"),
  activeLanguageBadge: byId("active-caption-translation-badge"),
  activeDownloadBtn: byId("active-download-btn"),
  captionGenerationAnimation: byId("caption-generation-animation"),
  captionGenerationPhrase: byId("caption-generation-phrase"),
  translationPanel: byId("translation-panel"),
  translationStatus: byId("translation-status"),
  languageSelect: byId("language-select"),
  translateBtn: byId("translate-btn"),
  translateBtnIcon: byId("translate-btn-icon"),
  translateBtnLabel: byId("translate-btn-label"),
  cachedLanguages: byId("cached-language-list"),
  thumbnailModal: byId("thumbnail-modal"),
  modalClose: byId("thumbnail-modal-close"),
  modalImage: byId("thumbnail-modal-image"),
  modalCaption: byId("thumbnail-modal-caption"),
  modalStyle: byId("thumbnail-modal-style"),
  modalTitle: byId("thumbnail-modal-title"),
  modalPrev: byId("thumbnail-modal-prev"),
  modalNext: byId("thumbnail-modal-next"),
  modalDownload: byId("thumbnail-modal-download"),
};

const ICONS = {
  formal: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path><rect height="14" rx="2" width="20" x="2" y="6"></rect>',
  sarcastic: '<path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="16" x="3" y="4" rx="2"></rect><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><path d="M9 10h.01"></path><path d="M15 10h.01"></path>',
  humorous_tech: '<rect width="18" height="12" x="3" y="4" rx="2"></rect><path d="M8 20h8"></path><path d="M12 16v4"></path><path d="m8 9 2 2-2 2"></path><path d="M13 13h3"></path>',
  humorous_non_tech: '<circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><path d="M9 9h.01"></path><path d="M15 9h.01"></path>',
};

const CAPTION_PHRASES = [
  "Understanding the video…",
  "Finding the strongest moments…",
  "Writing four distinct voices…",
  "Polishing clarity and tone…",
];

const THUMBNAIL_PHRASES = [
  "Choosing a vivid visual direction…",
  "Exploring bold typography…",
  "Balancing the 16:9 composition…",
  "Reviewing at thumbnail size…",
  "Applying the final refinements…",
];

function cyclePhrases(target, phrases, key, interval = 2100) {
  clearInterval(state[key]);
  let index = 0;
  if (target) target.textContent = phrases[0];
  state[key] = setInterval(() => {
    index = (index + 1) % phrases.length;
    if (target) target.textContent = phrases[index];
  }, interval);
}

function stopPhrases(key) {
  clearInterval(state[key]);
  state[key] = null;
}

function visualState(stage) {
  const value = String(stage || "waiting").toLowerCase();
  return ["waiting", "complete", "failed", "locked"].includes(value) ? value : "running";
}

function statusText(stage) {
  return String(stage || "waiting").replaceAll("_", " ").toUpperCase();
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Ready";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) { value /= 1024; index += 1; }
  return `${value.toFixed(index > 1 ? 2 : 0)} ${units[index]}`;
}

function modelFamily(model = "") {
  const value = model.toLowerCase();
  if (value.includes("gemma")) return { cls: "model-family-gemma", label: "✦" };
  if (value.includes("qwen")) return { cls: "model-family-qwen", label: "Q" };
  if (value.includes("glm")) return { cls: "model-family-glm", label: "G" };
  if (value.includes("kimi") || value.includes("moonshot")) return { cls: "model-family-kimi", label: "K" };
  return { cls: "model-family-generic", label: "AI" };
}

function renderModelIcon(role, model) {
  const icon = byId(`${role}-icon`);
  if (!icon) return;
  const family = modelFamily(model);
  icon.className = `model-family-icon ${family.cls}`;
  icon.textContent = family.label;
}

export function setStatus(message, isError = false) {
  if (!message) { el.appStatus.hidden = true; el.appStatus.textContent = ""; return; }
  el.appStatus.hidden = false;
  el.appStatus.textContent = message;
  el.appStatus.classList.toggle("error", isError);
}

export function setModelActivity(role, active) {
  document.querySelector(`[data-role="${role}"]`)?.classList.toggle("is-active", Boolean(active));
}

export function renderModelStatus(models) {
  if (!models) return;
  state.models = models;
  for (const role of ["captioner", "visionary", "orchestrator"]) {
    const item = models[role];
    if (!item) continue;
    const model = byId(`${role}-model`);
    const host = byId(`${role}-host`);
    if (role === "orchestrator" && !state.gemmaEverywhere) {
      model.textContent = "Advanced features locked";
      host.textContent = "ENABLE GEMMA EVERYWHERE";
      renderModelIcon(role, "Gemma");
    } else {
      model.textContent = item.model || "Unknown model";
      host.textContent = item.access_label || `ACCESSED VIA ${item.host}`;
      renderModelIcon(role, item.model || "");
    }
  }
}

export function setGemmaAvailability(available) {
  state.gemmaAvailable = Boolean(available);
  state.gemmaChecking = false;
  if (el.gemmaModeStatus) el.gemmaModeStatus.textContent = "Thumbnails + translation";
  for (const toggle of [el.gemmaToggle, el.heroGemmaToggle]) {
    if (!toggle) continue;
    toggle.disabled = false;
    toggle.classList.remove("is-unavailable");
    toggle.title = "Unlock thumbnails and multilingual captions";
  }
  if (!available) console.info("Gemma endpoint is not configured; advanced requests will use the configured fallback model.");
  renderModelStatus(state.models);
}

function syncGemmaToggles() {
  for (const toggle of [el.gemmaToggle, el.heroGemmaToggle]) {
    if (toggle) toggle.setAttribute("aria-pressed", String(state.gemmaEverywhere));
  }
}

export async function setGemmaMode(active, { reveal = true } = {}) {
  if (active && !state.gemmaAvailable) console.info("Gemma Everywhere enabled with the configured fallback model.");
  state.gemmaEverywhere = Boolean(active);
  document.body.classList.toggle("gemma-everywhere", state.gemmaEverywhere);
  document.body.classList.toggle("light-mode", state.gemmaEverywhere);
  const gemmaBadge = byId("gemma-active-badge");
  if (gemmaBadge) gemmaBadge.hidden = !state.gemmaEverywhere;
  syncGemmaToggles();
  el.systemMode.textContent = state.gemmaEverywhere ? "GEMMA_EVERYWHERE" : "STANDARD";
  el.translateBtn.disabled = !state.gemmaEverywhere || state.translationBusy || !state.hasGenerated;
  renderModelStatus(state.models);
  renderActiveTone();
  if (state.gemmaEverywhere && reveal && el.gemmaReveal) {
    el.gemmaReveal.hidden = false;
    el.gemmaReveal.setAttribute("aria-hidden", "false");
    await new Promise((resolve) => setTimeout(resolve, 3500));
    el.gemmaReveal.hidden = true;
    el.gemmaReveal.setAttribute("aria-hidden", "true");
    setStatus("Gemma Everywhere enabled. Thumbnails and multilingual captions are unlocked.");
  } else if (!state.gemmaEverywhere) {
    setStatus("Standard caption mode active. Generate creates English captions only.");
  }
  return true;
}

export function setGenerateBusy(busy, label = "Generating…") {
  el.generateBtn.disabled = busy;
  el.generateBtnLabel.textContent = busy ? label : "Generate";
  el.generateBtnIcon.classList.toggle("animate-spin", false);
  el.pipelineState.textContent = busy ? "PROCESSING" : "READY";
  el.workspaceStep.textContent = busy ? "PIPELINE ACTIVE" : state.hasGenerated ? "OUTPUT READY" : "READY";
}

export function setCaptionBusy(busy) {
  el.captionGenerationAnimation.hidden = !busy;
  el.activeCard.classList.toggle("is-caption-generating", Boolean(busy));
  if (busy) cyclePhrases(el.captionGenerationPhrase, CAPTION_PHRASES, "captionPhraseTimer", 1900);
  else stopPhrases("captionPhraseTimer");
}

export function setThumbnailAnimation(busy, phrase = "") {
  if (busy) {
    if (phrase) el.activeGenerationPhrase.textContent = phrase;
    cyclePhrases(el.activeGenerationPhrase, THUMBNAIL_PHRASES, "thumbnailPhraseTimer", 2200);
  } else stopPhrases("thumbnailPhraseTimer");
}

export function setUploadProgress(fileName, percent, busy = true) {
  el.uploadFileName.textContent = fileName;
  el.uploadProgressText.textContent = busy ? `${percent}%` : "READY";
  el.uploadProgressWrap.hidden = !busy;
  el.uploadProgressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  el.uploadMiniSpinner.hidden = !busy;
  const svg = el.browseFile.querySelector("svg");
  if (svg) svg.hidden = busy;
}

export function setUploadedFile(fileName, size = 0) {
  setUploadProgress(fileName, 100, false);
  el.uploadFileName.textContent = `${fileName} • ${formatBytes(size)}`;
  el.clearVideoBtn.hidden = false;
  el.videoUrl.disabled = true;
  el.videoUrl.placeholder = "Local video selected";
}

export function resetUploadCard() {
  setUploadProgress("URL or local video", 0, false);
  el.clearVideoBtn.hidden = true;
  el.videoUrl.disabled = false;
  el.videoUrl.placeholder = "Paste a video URL…";
}

export function showVideo(source, label) {
  if (!source) return;
  el.videoPreview.src = source;
  el.videoSourceLabel.textContent = label || "Ready";
  el.videoPanel.hidden = false;
  if (el.videoEmptyState) el.videoEmptyState.hidden = true;
}

export function hideVideo() {
  el.videoPreview.pause?.();
  el.videoPreview.removeAttribute("src");
  el.videoPreview.load?.();
  el.videoPanel.hidden = true;
  if (el.videoEmptyState) el.videoEmptyState.hidden = false;
}

export function setStyleState(style, stage, message = "") {
  const normalized = String(stage || "waiting").toLowerCase();
  state.styleStates[style] = normalized;
  state.styleMessages[style] = message || normalized;
  const tabStatus = byId(`tone-tab-status-${style}`);
  if (tabStatus) { tabStatus.dataset.state = visualState(normalized); tabStatus.textContent = statusText(normalized); }
  if (state.activeStyle === style) renderActiveTone();
}

export function setActiveStyle(style) {
  if (!STYLES.includes(style)) return;
  state.activeStyle = style;
  document.querySelectorAll("[data-tone-tab]").forEach((button) => {
    const active = button.dataset.toneTab === style;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  renderActiveTone();
}

export function resetOutputs() {
  state.hasGenerated = false;
  state.thumbnails = {};
  for (const style of STYLES) setStyleState(style, "waiting", state.gemmaEverywhere ? "Awaiting pipeline" : "Caption mode ready");
  renderActiveTone();
}

export function renderCaptions(captions = activeCaptions()) {
  state.hasGenerated = Boolean(captions && Object.keys(captions).length);
  el.translateBtn.disabled = !state.gemmaEverywhere || !state.hasGenerated || state.translationBusy;
  renderActiveTone();
}

export function renderThumbnail(style, result) {
  state.thumbnails[style] = result;
  setStyleState(style, "complete", "Thumbnail complete — click to expand");
  if (state.activeStyle === style) renderActiveTone();
}

export function renderActiveTone() {
  const style = state.activeStyle;
  const meta = STYLE_META[style];
  const captions = activeCaptions();
  const caption = state.hasGenerated ? String(captions?.[style] || "No caption available.") : meta.placeholder;
  const stage = state.styleStates[style] || "waiting";
  const normalized = visualState(stage);
  const running = normalized === "running";
  const thumbnail = state.thumbnails[style];

  el.activeCard.dataset.style = style;
  el.activeToneLabel.textContent = meta.label;
  el.activeToneRegistry.textContent = meta.registry;
  el.activeToneLanguage.textContent = state.activeLanguage;
  el.activeCaption.textContent = caption;
  el.activeLanguageBadge.textContent = state.activeLanguage === "English" ? "ENGLISH SOURCE" : `${state.activeLanguage.toUpperCase()} CACHE`;
  el.activeStatus.dataset.state = normalized;
  el.activeStatus.textContent = statusText(stage);
  el.activeStage.textContent = String(state.styleMessages[style] || stage).toUpperCase();
  el.activeThumbnailLoaderLabel.textContent = statusText(stage);
  el.activeThumbnailLoader.hidden = !running;
  if (el.activeGenerationLog) el.activeGenerationLog.textContent = state.styleMessages[style] || "Building the next design stage…";
  el.activeDownloadBtn.disabled = !thumbnail?.thumbnail_data_url;
  el.activeThumbnailShell.disabled = !thumbnail?.thumbnail_data_url;
  el.activeThumbnailShell.classList.toggle("has-thumbnail", Boolean(thumbnail?.thumbnail_data_url));

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.innerHTML = ICONS[style];
  el.activeToneIcon.replaceChildren(svg);

  if (thumbnail?.thumbnail_data_url) {
    el.activeThumbnailImage.src = thumbnail.thumbnail_data_url;
    el.activeThumbnailImage.alt = `Generated ${meta.shortLabel.toLowerCase()} thumbnail`;
    el.activeThumbnailImage.hidden = false;
    el.activeThumbnailPlaceholder.hidden = true;
  } else {
    el.activeThumbnailImage.hidden = true;
    el.activeThumbnailImage.removeAttribute("src");
    el.activeThumbnailPlaceholder.hidden = running;
    const headline = el.activeThumbnailPlaceholder.querySelector("span");
    const copy = el.activeThumbnailPlaceholder.querySelector("small");
    if (headline) headline.textContent = "16:9";
    if (copy) copy.textContent = state.gemmaEverywhere ? "Thumbnail appears here after generation" : "Enable Gemma Everywhere to create thumbnails";
  }

  if (running) setThumbnailAnimation(true, state.styleMessages[style]);
  else setThumbnailAnimation(false);
}

export function setTranslationBusy(busy) {
  el.translateBtn.disabled = busy || !state.gemmaEverywhere || !state.hasGenerated;
  el.translateBtnLabel.textContent = busy ? "Translating…" : "Translate";
  el.translateBtnIcon.classList.toggle("animate-spin", busy);
}

export function renderLanguageCache() {
  el.cachedLanguages.innerHTML = "";
  for (const language of Object.keys(state.captionsByLanguage)) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.language = language;
    button.className = `language-chip${language === state.activeLanguage ? " active" : ""}`;
    button.textContent = language;
    el.cachedLanguages.append(button);
  }
  el.languageSelect.value = state.selectedTargetLanguage || "Spanish";
  el.translationStatus.textContent = state.hasGenerated ? `${state.activeLanguage} active. Cached languages switch instantly.` : "English captions are cached automatically.";
  renderActiveTone();
}

export function switchLanguage(language) {
  if (!state.captionsByLanguage[language]) return false;
  state.activeLanguage = language;
  renderLanguageCache();
  return true;
}

export function openThumbnailModal(style = state.activeStyle) {
  const result = state.thumbnails[style];
  if (!result?.thumbnail_data_url) return;
  state.activeModalStyle = style;
  el.modalImage.src = result.thumbnail_data_url;
  el.modalCaption.textContent = state.captionsByLanguage.English?.[style] || result.source_caption || "";
  el.modalStyle.textContent = STYLE_META[style].shortLabel.toUpperCase();
  el.modalTitle.textContent = result.thumbnail_title || `${STYLE_META[style].shortLabel} thumbnail`;
  el.thumbnailModal.hidden = false;
  document.body.classList.add("modal-open");
  el.modalClose.focus();
}

export function closeThumbnailModal() {
  el.thumbnailModal.hidden = true;
  document.body.classList.remove("modal-open");
  state.activeModalStyle = null;
}

export function moveThumbnailModal(direction) {
  const available = STYLES.filter((style) => state.thumbnails[style]?.thumbnail_data_url);
  if (!available.length) return;
  const current = available.indexOf(state.activeModalStyle);
  openThumbnailModal(available[(current + direction + available.length) % available.length]);
}

export function downloadActiveThumbnail(style = state.activeModalStyle || state.activeStyle) {
  const result = state.thumbnails[style];
  if (!result?.thumbnail_data_url) return;
  const link = document.createElement("a");
  link.href = result.thumbnail_data_url;
  link.download = `vivid-studio-${style}.png`;
  link.click();
}

export function updateNavigation() {
  const links = [...document.querySelectorAll("[data-nav-link]")];
  const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  const navbar = document.querySelector(".team-navbar");

  const setActive = (activeLink, updateHash = false) => {
    links.forEach((link) => link.classList.toggle("is-active", link === activeLink));
    if (updateHash && activeLink) history.replaceState(null, "", activeLink.getAttribute("href"));
  };

  links.forEach((link) => link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    const offset = (navbar?.getBoundingClientRect().height || 72) + 10;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
    setActive(link, true);
  }));

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const active = links.find((link) => link.getAttribute("href") === `#${visible.target.id}`);
    if (active) setActive(active, true);
  }, { rootMargin: "-30% 0px -55% 0px", threshold: [0, .1, .25, .5] });
  sections.forEach((section) => observer.observe(section));
  const initial = links.find((link) => link.getAttribute("href") === window.location.hash) || links[0];
  setActive(initial, false);
}

export function startHeroWordAnimation() {
  const words = [...document.querySelectorAll(".vivid-word")];
  let index = 0;
  setInterval(() => {
    words[index]?.classList.remove("is-active");
    index = (index + 1) % words.length;
    words[index]?.classList.add("is-active");
  }, 2200);
}
