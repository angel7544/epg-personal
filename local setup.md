# Local Setup & Usage Guide (Indian Jio TV)

This guide provides instructions for generating a custom EPG (Electronic Program Guide) and M3U playlist specifically for Indian channels from Jio TV.

## 1. Prerequisites

Ensure you have Node.js and Git installed, and you have already installed the project dependencies:

```bash
npm install
```

## Jio TV Workflow (Indian Channels)

### Step 1: Generate Playlist & Mapping
```bash
npm run jiotv:generate
```

### Step 2: Fetch EPG Data (XML)
```bash
npm run grab --- --channels=india.channels.xml --output=india.xml
```

### Step 3: Extract JSON for App
```bash
npm run epg:extract -- --input india.xml --output ../vega-app/src/epg-data
```

---

## Tata Play Workflow (Indian Channels)

### Step 1: Generate Playlist & Mapping
```bash
npm run tataplay:generate
```

### Step 2: Fetch EPG Data (XML)
```bash
npm run grab --- --channels=tataplay.channels.xml --output=tataplay.xml
```

### Step 3: Extract JSON for App
```bash
npm run epg:extract -- --input tataplay.xml --output ../vega-app/src/epg-data
```

---

## Summary of Files

| File | Purpose |
| --- | --- |
| `india.m3u` | The playlist file you load into your IPTV player. |
| `india.xml` | The XMLTV file you link as the EPG source in your player. |
| `src/epg-data/` | (In vega-app) Individual channel program data in JSON format. |

## Troubleshooting

- **ID Mismatch**: If a channel in your player doesn't show EPG, ensure the `tvg-id` in the `.m3u` exactly matches the `channel id` in the `.xml`.
- **Missing Channels**: Run `npm run jiotv:generate` again if you update your Jio TV source or if new channels are added to the repository.
