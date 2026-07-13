// Static preset simulation adapter.
// Every output is read from data/preset.json; no backend or model is called.
export const API_BASE = "";

const STYLES = ["formal", "sarcastic", "humorous_tech", "humorous_non_tech"];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const PRESETS_URL = new URL("../data/preset.json", import.meta.url);
let catalogPromise;
let activePresetId = "";

export async function getPresetCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetch(PRESETS_URL, { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error(`Could not load preset data (${response.status})`);
      const catalog = await response.json();
      if (!Array.isArray(catalog.presets) || !catalog.presets.length) {
        throw new Error("Preset data does not contain any demo packs");
      }
      return catalog;
    });
  }
  return catalogPromise;
}

function presetIdFromRequest(body = {}) {
  const direct = String(body.preset_id || "").trim();
  if (direct) return direct;
  const source = String(body.video_url || "");
  if (source.startsWith("preset://")) return source.slice("preset://".length);
  return activePresetId;
}

async function resolvePreset(body = {}) {
  const catalog = await getPresetCatalog();
  const requestedId = presetIdFromRequest(body) || catalog.presets[0].id;
  const preset = catalog.presets.find((item) => item.id === requestedId);
  if (!preset) throw new Error(`Unknown preset demo pack: ${requestedId}`);
  activePresetId = preset.id;
  return preset;
}

function thumbnailResult(style, preset) {
  return {
    style,
    thumbnail_title: preset.title,
    source_caption: preset.captions?.English?.[style] || "",
    thumbnail_data_url: preset.thumbnails?.[style] || "",
    provider: "Vivid Studio Preset Simulation",
    design: {
      font_id: "vivid-display",
      text_case: "uppercase",
      palette_id: style,
      text_position_id: "left-focus",
      frame_treatment_id: "neon-depth",
      frame_style_id: "glass-panel",
    },
    quality: { preview_font_size: 62, text_region_area_ratio: 0.34 },
  };
}

export async function getJSON(path) {
  await wait(220);
  if (path === "/model-status") {
    return {
      captioner: { model: "Qwen2.5-VL-32B (Preset Demo)", host: "Static Files", access_label: "FIXED PRESET OUTPUT" },
      visionary: { model: "GLM-4.1V (Preset Demo)", host: "Static Files", access_label: "FIXED PRESET OUTPUT" },
      orchestrator: { model: "Gemma 3 (Preset Demo)", host: "Static Files", access_label: "FIXED PRESET OUTPUT" },
    };
  }
  if (path === "/gemma-status") return { available: true, model: "Gemma 3 (Preset Demo)" };
  throw new Error(`Unknown simulated endpoint: ${path}`);
}

export async function postJSON(path, body = {}) {
  const preset = await resolvePreset(body);

  if (path === "/caption") {
    await wait(2700);
    return {
      preset_id: preset.id,
      captions: { ...preset.captions.English },
      narration: preset.narration,
      simulated: true,
    };
  }

  if (path === "/translate") {
    const language = body.target_language || "English";
    const translated = preset.captions?.[language];
    if (!translated) throw new Error(`${language} is not included in this preset pack`);
    await wait(1350);
    return { preset_id: preset.id, translated: { ...translated }, cached: false, simulated: true };
  }

  throw new Error(`Unknown simulated endpoint: ${path}`);
}

export async function postEventStream(path, body = {}, handlers = {}) {
  if (path !== "/thumbnails/stream") throw new Error(`Unknown simulated endpoint: ${path}`);
  const preset = await resolvePreset(body);
  const results = {};
  const orchestrator = { model: "Gemma 3 (Preset Demo)", host: "Static Files", access_label: "FIXED PRESET OUTPUT" };

  handlers.progress?.({
    message: `Gemma is mapping ${preset.title} into four fixed visual directions…`,
    orchestrator_status: orchestrator,
  });
  await wait(650);

  for (const style of (body.styles || STYLES)) {
    const stages = [
      ["designing", "Choosing a vivid visual direction…"],
      ["rendering", "Building typography and 16:9 composition…"],
      ["reviewing", "Reviewing readability at thumbnail size…"],
      ["refining", "Applying final visual refinements…"],
    ];

    for (const [stage, message] of stages) {
      handlers.progress?.({ style, stage, status: "running", message, orchestrator_status: orchestrator });
      await wait(310);
    }

    const result = thumbnailResult(style, preset);
    results[style] = result;
    handlers.style_result?.({ style, result });
    handlers.progress?.({
      style,
      stage: "complete",
      status: "completed",
      message: `${style.replaceAll("_", " ")} thumbnail complete.`,
    });
    await wait(190);
  }

  return { preset_id: preset.id, results, simulated: true };
}
