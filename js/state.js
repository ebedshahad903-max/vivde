export const STYLES = ["formal", "sarcastic", "humorous_tech", "humorous_non_tech"];

export const STYLE_META = {
  formal: { label: "Formal Tone", shortLabel: "Formal", registry: "REG_01_FORMAL", color: "cyan", placeholder: "Select a preset and click Generate to create a polished formal caption." },
  sarcastic: { label: "Sarcastic Tone", shortLabel: "Sarcastic", registry: "REG_02_SARCASTIC", color: "fuchsia", placeholder: "Select a preset and let the sarcasm engine pretend it was not waiting for this moment." },
  humorous_tech: { label: "Humorous Tech", shortLabel: "Humorous Tech", registry: "REG_03_TECH_HUMOR", color: "purple", placeholder: "Select a preset and boot the caption compiler. Coffee is optional; tasteful tech jokes are not." },
  humorous_non_tech: { label: "Humorous Standard", shortLabel: "Humorous Standard", registry: "REG_04_NONTECH_HUMOR", color: "amber", placeholder: "Select a preset and generate a playful caption that does not require a software degree." },
};

export const state = {
  videoUrl: "",
  presetCatalog: [],
  selectedPresetId: "",
  localPreviewUrl: "",
  sourceType: "url",
  uploadedFileName: "",
  uploadedFileSize: 0,
  uploadBusy: false,
  captionBusy: false,
  thumbnailBusy: false,
  translationBusy: false,
  captionsByLanguage: {},
  activeLanguage: "English",
  selectedTargetLanguage: "Spanish",
  activeStyle: "formal",
  hasGenerated: false,
  thumbnails: {},
  styleStates: Object.fromEntries(STYLES.map((style) => [style, "waiting"])),
  styleMessages: Object.fromEntries(STYLES.map((style) => [style, "Awaiting pipeline"])),
  models: null,
  gemmaAvailable: false,
  gemmaEverywhere: false,
  gemmaChecking: true,
  captionPhraseTimer: null,
  thumbnailPhraseTimer: null,
  activeModalStyle: null,
};

export function activeCaptions() {
  return state.captionsByLanguage[state.activeLanguage] || state.captionsByLanguage.English || {};
}
