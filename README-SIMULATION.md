# Vivid Studio — Preset Demo Simulation

This package preserves the Vivid Studio frontend and replaces live video input with three fixed demo packs created for a static showcase.

## How it works

1. Choose one of the three preset cards.
2. Enable **Gemma Everywhere**.
3. Click **Generate**.
4. The original caption loading animation runs first.
5. Fixed captions are revealed, followed by the staged thumbnail loader and fixed thumbnail reveal.
6. Use the translation panel to reveal fixed multilingual captions from the selected pack.

When Gemma Everywhere is disabled, generation is blocked and the thumbnail and translation areas are hidden.

## Static data

- `data/preset.json` — three complete preset manifests
- `assets/videos/preset-1.mp4` through `preset-3.mp4` — local placeholder video files
- `assets/presets/` — preset selection card images
- `assets/thumbnails/` — four fixed output thumbnails per preset

No backend, Docker container, model request, API key, upload, or external media service is used.

## Netlify

Deploy this folder as a static site. No build command or environment variable is required.

## Full local experiment

This static site is a preset simulation. To experiment with the full project on a PC, install Docker Desktop and pull the published image:

```bash
docker pull starlite1/psypher-vcap:VividStudio
```

Run the image using the configuration documented by the VividStudio repository.

## Mode behavior

- **Standard mode:** Generates the four fixed English captions only. Thumbnail and multilingual controls remain hidden.
- **Gemma Everywhere:** Generates the four fixed English captions, then simulates all four thumbnail stages. Multilingual caption controls are enabled.
