import { getJSON, getPresetCatalog, postEventStream, postJSON } from "./api.js";
import { STYLES, state } from "./state.js";
import {
  closeThumbnailModal,
  downloadActiveThumbnail,
  el,
  moveThumbnailModal,
  openThumbnailModal,
  renderCaptions,
  renderLanguageCache,
  renderModelStatus,
  renderThumbnail,
  resetOutputs,
  setActiveStyle,
  setCaptionBusy,
  setGemmaAvailability,
  setGemmaMode,
  setGenerateBusy,
  setModelActivity,
  setStatus,
  setStyleState,
  setTranslationBusy,
  startHeroWordAnimation,
  switchLanguage,
  updateNavigation,
} from "./ui.js";

const presetGrid = document.getElementById("preset-grid");
const selectedPresetName = document.getElementById("selected-preset-name");
const selectedPresetDetail = document.getElementById("selected-preset-detail");

function selectedPreset() {
  return state.presetCatalog.find((preset) => preset.id === state.selectedPresetId) || null;
}

async function resolveModels() {
  try {
    const [models, gemma] = await Promise.all([
      getJSON("/model-status"),
      getJSON("/gemma-status").catch(() => null),
    ]);
    state.models = models;
    setGemmaAvailability(Boolean(gemma?.available));
    renderModelStatus(models);
  } catch (error) {
    setGemmaAvailability(false);
    setStatus(`Could not initialize the preset simulation: ${error.message}`, true);
  }
}

function setLanguageChoices(preset) {
  const languages = Object.keys(preset?.captions || { English: {} });
  el.languageSelect.replaceChildren();
  for (const language of languages) {
    const option = document.createElement("option");
    option.value = language;
    option.textContent = language;
    el.languageSelect.append(option);
  }
  state.selectedTargetLanguage = languages.find((language) => language !== "English") || "English";
  el.languageSelect.value = state.selectedTargetLanguage;
}

function clearGeneratedOutputs() {
  state.captionsByLanguage = {};
  state.activeLanguage = "English";
  state.hasGenerated = false;
  state.thumbnails = {};
  resetOutputs();
  renderLanguageCache();
}

function selectPreset(presetId, { announce = true } = {}) {
  const preset = state.presetCatalog.find((item) => item.id === presetId);
  if (!preset) return;

  state.selectedPresetId = preset.id;
  state.videoUrl = `preset://${preset.id}`;
  state.sourceType = "preset";
  clearGeneratedOutputs();
  setLanguageChoices(preset);

  presetGrid.querySelectorAll("[data-preset-id]").forEach((card) => {
    const active = card.dataset.presetId === preset.id;
    card.classList.toggle("is-selected", active);
    card.setAttribute("aria-selected", String(active));
    card.tabIndex = active ? 0 : -1;
  });

  selectedPresetName.textContent = preset.title;
  selectedPresetDetail.textContent = `${preset.category} • ${preset.duration} • ${Object.keys(preset.captions).length} fixed languages`;
  el.generateBtn.disabled = false;
  if (announce) setStatus(`${preset.title} selected. Click Generate for captions, or enable Gemma Everywhere for captions, thumbnails, and translation.`);
}

function createPresetCard(preset, index) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "vivid-preset-card";
  card.dataset.presetId = preset.id;
  card.setAttribute("role", "option");
  card.setAttribute("aria-selected", "false");
  card.innerHTML = `
    <span class="vivid-preset-media">
      <img src="${preset.card_thumbnail}" alt="" loading="${index === 0 ? "eager" : "lazy"}">
      <span class="vivid-preset-play" aria-hidden="true"><svg viewBox="0 0 24 24"><polygon points="8 5 19 12 8 19 8 5"></polygon></svg></span>
      <small>${preset.duration}</small>
    </span>
    <span class="vivid-preset-copy">
      <em>${preset.category}</em>
      <strong>${preset.title}</strong>
      <small>${preset.description}</small>
    </span>`;
  return card;
}

async function loadPresets() {
  const catalog = await getPresetCatalog();
  state.presetCatalog = catalog.presets;
  presetGrid.replaceChildren(...catalog.presets.map(createPresetCard));
  selectPreset(catalog.presets[0].id, { announce: false });
  setStatus("Preset demo ready. Generate captions in Standard mode, or enable Gemma Everywhere for thumbnails and multilingual captions.");
}

async function generateAllThumbnails(captions) {
  state.thumbnailBusy = true;
  setModelActivity("orchestrator", true);
  for (const style of STYLES) setStyleState(style, "queued", "Queued for Gemma design");

  try {
    const final = await postEventStream("/thumbnails/stream", {
      preset_id: state.selectedPresetId,
      video_url: state.videoUrl,
      captions,
      styles: STYLES,
      gemma_everywhere: true,
    }, {
      progress(payload) {
        if (payload.orchestrator_status) {
          state.models = { ...state.models, orchestrator: payload.orchestrator_status };
          renderModelStatus(state.models);
        }
        if (payload.style) {
          setStyleState(payload.style, payload.stage || payload.status || "running", payload.message || "Designing thumbnail");
        } else if (payload.message) {
          setStatus(payload.message);
        }
      },
      style_result(payload) {
        if (payload.style && payload.result) renderThumbnail(payload.style, payload.result);
      },
    });

    Object.entries(final.results || {}).forEach(([style, result]) => renderThumbnail(style, result));
    const missing = STYLES.filter((style) => !state.thumbnails[style]);
    missing.forEach((style) => setStyleState(style, "failed", "No thumbnail returned"));
    setStatus(missing.length ? `${missing.length} preset thumbnail style(s) could not be loaded.` : "Preset captions and all four thumbnails are ready.", missing.length > 0);
  } catch (error) {
    STYLES.filter((style) => !state.thumbnails[style]).forEach((style) => setStyleState(style, "failed", "Thumbnail simulation failed"));
    setStatus(`Thumbnail simulation failed: ${error.message}`, true);
  } finally {
    state.thumbnailBusy = false;
    setModelActivity("orchestrator", false);
  }
}

async function triggerInference() {
  const preset = selectedPreset();
  if (!preset) {
    setStatus("Choose a preset demo pack first.", true);
    return;
  }
  state.captionBusy = true;
  state.thumbnails = {};
  state.captionsByLanguage = {};
  state.activeLanguage = "English";
  state.hasGenerated = false;
  resetOutputs();
  renderLanguageCache();
  setGenerateBusy(true, "Generating…");
  setCaptionBusy(true);
  setModelActivity("captioner", true);
  setModelActivity("visionary", true);
  setStatus(`Understanding ${preset.title} and building four caption directions…`);

  try {
    const result = await postJSON("/caption", {
      preset_id: preset.id,
      video_url: state.videoUrl,
      styles: STYLES,
    });
    state.captionsByLanguage.English = result.captions;
    renderCaptions(result.captions);
    renderLanguageCache();
    setCaptionBusy(false);

    if (state.gemmaEverywhere) {
      STYLES.forEach((style) => setStyleState(style, "queued", "Caption ready — visual direction queued"));
      setGenerateBusy(true, "Designing…");
      setStatus("Captions complete. Gemma is now creating the preset thumbnails…");
      await generateAllThumbnails(result.captions);
    } else {
      STYLES.forEach((style) => setStyleState(style, "complete", "Caption complete — Standard mode"));
      setStatus("All four English captions are ready. Enable Gemma Everywhere to add thumbnails and multilingual captions.");
    }
  } catch (error) {
    setStatus(`Preset simulation failed: ${error.message}`, true);
    STYLES.forEach((style) => setStyleState(style, "failed", "Preset simulation failed"));
  } finally {
    state.captionBusy = false;
    setCaptionBusy(false);
    setModelActivity("captioner", false);
    setModelActivity("visionary", false);
    setGenerateBusy(false);
  }
}

async function translateSelectedLanguage() {
  if (!state.gemmaEverywhere) {
    setStatus("Enable Gemma Everywhere to unlock the preset translations.", true);
    return;
  }
  if (!state.captionsByLanguage.English) {
    setStatus("Generate the selected preset before switching languages.", true);
    return;
  }

  const language = el.languageSelect.value;
  state.selectedTargetLanguage = language;
  if (switchLanguage(language)) {
    setStatus(`${language} restored instantly from the local preset cache.`);
    return;
  }
  if (language === "English") return;

  state.translationBusy = true;
  setTranslationBusy(true);
  setModelActivity("orchestrator", true);
  el.translationStatus.textContent = `Gemma is loading the fixed ${language} captions…`;

  try {
    const result = await postJSON("/translate", {
      preset_id: state.selectedPresetId,
      captions: state.captionsByLanguage.English,
      target_language: language,
      gemma_everywhere: true,
    });
    state.captionsByLanguage[language] = result.translated;
    switchLanguage(language);
    setStatus(`${language} preset captions loaded and cached.`);
  } catch (error) {
    el.translationStatus.textContent = `Translation failed: ${error.message}`;
    setStatus(`Translation simulation failed: ${error.message}`, true);
  } finally {
    state.translationBusy = false;
    setTranslationBusy(false);
    setModelActivity("orchestrator", false);
  }
}

async function toggleGemma() {
  const enabling = !state.gemmaEverywhere;

  if (!enabling && state.captionsByLanguage.English) {
    state.captionsByLanguage = { English: state.captionsByLanguage.English };
    state.activeLanguage = "English";
    state.thumbnails = {};
  }

  await setGemmaMode(enabling);

  if (enabling) {
    setStatus(state.hasGenerated
      ? "Gemma Everywhere enabled. Translation is unlocked; click Generate to create captions and thumbnails together."
      : "Gemma Everywhere enabled. Generate will create captions, thumbnails, and unlock multilingual captions.");
    return;
  }

  if (state.captionsByLanguage.English) {
    renderCaptions(state.captionsByLanguage.English);
    STYLES.forEach((style) => setStyleState(style, "complete", "Caption complete — Standard mode"));
    renderLanguageCache();
    setStatus("Standard mode active. English captions remain available; thumbnails and multilingual captions are disabled.");
  } else {
    resetOutputs();
    renderLanguageCache();
    setStatus("Standard mode active. Generate creates English captions only.");
  }
}

function bindEvents() {
  el.gemmaToggle.addEventListener("click", toggleGemma);
  el.heroGemmaToggle.addEventListener("click", toggleGemma);
  document.querySelectorAll("[data-enable-gemma]").forEach((button) => button.addEventListener("click", toggleGemma));

  presetGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-preset-id]");
    if (card) selectPreset(card.dataset.presetId);
  });
  presetGrid.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const cards = [...presetGrid.querySelectorAll("[data-preset-id]")];
    const current = cards.findIndex((card) => card.dataset.presetId === state.selectedPresetId);
    const step = ["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1;
    const next = cards[(current + step + cards.length) % cards.length];
    selectPreset(next.dataset.presetId);
    next.focus();
  });

  el.generateBtn.addEventListener("click", triggerInference);
  el.translateBtn.addEventListener("click", translateSelectedLanguage);
  el.languageSelect.addEventListener("change", () => {
    const language = el.languageSelect.value;
    state.selectedTargetLanguage = language;
    if (switchLanguage(language)) setStatus(`${language} restored instantly from cache.`);
    else el.translationStatus.textContent = `${language} is available in the preset. Click Translate to reveal it.`;
  });
  el.cachedLanguages.addEventListener("click", (event) => {
    const button = event.target.closest("[data-language]");
    if (button) {
      state.selectedTargetLanguage = button.dataset.language;
      switchLanguage(button.dataset.language);
    }
  });

  document.querySelectorAll("[data-tone-tab]").forEach((button) => button.addEventListener("click", () => setActiveStyle(button.dataset.toneTab)));
  el.activeDownloadBtn.addEventListener("click", () => downloadActiveThumbnail(state.activeStyle));
  el.activeThumbnailShell.addEventListener("click", () => openThumbnailModal(state.activeStyle));
  el.modalClose.addEventListener("click", closeThumbnailModal);
  document.querySelector("[data-close-modal]")?.addEventListener("click", closeThumbnailModal);
  el.modalPrev.addEventListener("click", () => moveThumbnailModal(-1));
  el.modalNext.addEventListener("click", () => moveThumbnailModal(1));
  el.modalDownload.addEventListener("click", downloadActiveThumbnail);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el.thumbnailModal.hidden) closeThumbnailModal();
    if (event.key === "ArrowLeft" && !el.thumbnailModal.hidden) moveThumbnailModal(-1);
    if (event.key === "ArrowRight" && !el.thumbnailModal.hidden) moveThumbnailModal(1);
  });
  document.addEventListener("visibilitychange", () => document.body.classList.toggle("page-hidden", document.hidden));
}

async function boot() {
  bindEvents();
  updateNavigation();
  startHeroWordAnimation();
  resetOutputs();
  renderLanguageCache();
  setActiveStyle("formal");
  await Promise.all([resolveModels(), loadPresets()]);
}

boot().catch((error) => {
  el.generateBtn.disabled = true;
  setStatus(`Vivid Studio preset demo could not start: ${error.message}`, true);
});
