# Google Maps Setup

This guide walks you through creating the API keys and Map IDs that Atlist needs.

## 1. Create (or pick) a Google Cloud project

1. Go to <https://console.cloud.google.com/>.
2. Create a new project — for example `atlist-editor` for your own use, and one project **per client** for the exported maps.

Using separate Cloud projects for exports means your client is billed for their own map's traffic, and you can restrict/rotate keys per client.

## 2. Enable the required APIs

In each Cloud project, go to **APIs & Services → Library** and enable:

- **Maps JavaScript API** (required)

Optional, only if you use these features:

- **Geocoding API** — enables "Add by address" in the Locations panel
- **Places API (New)** — enables Google Places quick-add
- **Directions API** — will be used by Phase 3 routes

Do **not** enable APIs you are not using — every enabled API is a possible cost surface.

## 3. Create an API key

1. **APIs & Services → Credentials → Create credentials → API key**.
2. Copy the key.
3. Click **Edit** on the key and set:
   - **Application restrictions → Websites (HTTP referrer)**
     - For the editor key: add your local dev URL (e.g. `http://localhost:5173/*`).
     - For the export key: add your client's production domain (e.g. `https://www.client.com/*`).
   - **API restrictions → Restrict key** and check only the APIs you enabled.

## 4. Create a Map ID (required for Advanced Markers)

Advanced Markers do not render on classic maps — a Map ID is required.

1. **Google Maps Platform → Map Management → Create Map ID**.
2. Choose **JavaScript**, then **Vector** (recommended) or **Raster**.
3. Copy the Map ID (looks like `8f4b6e9c1a2d3e4f`).
4. Optionally attach a **cloud-based map style** to that Map ID (Map Styles → Create style → Associate with Map IDs).

## 5. Plug everything into Atlist

On first launch (or via **Project picker → API settings**), Atlist asks for:

- Editor API key + Editor Map ID
- Optionally a separate Client API key + Client Map ID (for exports)

All values are stored **only in your browser's `localStorage`**. They are never uploaded anywhere.

## 6. Security notes (please read)

- **Browser API keys are always visible** to visitors who view page source. HTTP referrer restrictions are your primary defence.
- Never commit `.env` files with API keys to a git repository.
- Use one Cloud project per client so a compromised key affects only one map.
- Set a **budget alert** in each Cloud project (Billing → Budgets & alerts) so you catch runaway usage immediately.
- Consider setting per-API **quotas** below your monthly free tier limits for extra safety.

## 7. Pricing overview

Google's Maps Platform pricing is at <https://mapsplatform.google.com/pricing/>. As of writing, the Maps JavaScript API has a monthly free credit that covers many small deployments — but you should verify current pricing before deploying to a busy site.
