# Export Guide

Atlist can produce four export formats. All of them are dependency-free JavaScript — no build step is needed on the client site.

## Format overview

| Format         | Best for                                          | Files                                   |
|----------------|---------------------------------------------------|-----------------------------------------|
| Standalone     | Any static hosting, WordPress, WebFlow, Squarespace HTML embed | `index.html`, `styles.css`, `map.js`, `map-data.js`, `map-data.json`, `README.md` |
| Single HTML    | Elementor HTML widget, quick share, IFrame        | `index.html` (everything inlined)       |
| Embed snippet  | You already host the folder; embed on many pages  | `EMBED_SNIPPET.html` + the standalone files |
| React component | Existing React app                                | `AtlistMap.jsx` (runtime included)      |

## Generating an export

1. Open your project in Atlist.
2. Go to the **Export** panel in the left sidebar.
3. Fill in:
   - **Client project name** — cosmetic, shown in the HTML `<title>`.
   - **Client API key** — the Google Maps key that will ship inside the export. Restrict it by HTTP referrer to the client's domain.
   - **Client Map ID** — required for Advanced Markers. Should belong to the client's Google Cloud project.
   - **Container ID** — the DOM element ID the map mounts into. Default `atlist-map`.
   - **Height** — any valid CSS height, e.g. `600px` or `100vh`.
   - **Language / Region** — passed to Google Maps.
   - **Inline assets** — recommended ON. Puts all uploaded images/SVGs into the map data JSON so there are no missing-file issues on the client site.
4. (Optional) Enable analytics — GA4 event fires for `atlist_popup_open` and `atlist_filter_toggle`.
5. Click **Generate export**.
6. Download the file(s) individually, or use **Download all**.
7. Use **Preview in new tab** to test the export in isolation before sending it.

## Deploying to a client site

### Static hosting / plain HTML

Upload the whole folder. Point visitors to `index.html`.

### WordPress — Custom HTML block

1. Use the **Single HTML** export.
2. Copy the file contents.
3. In the WordPress editor, add a **Custom HTML** block and paste the entire contents.

### WordPress — Elementor

1. Use the **Single HTML** export.
2. Drag an **HTML** widget into your Elementor page.
3. Paste the contents.

### WordPress — Full page

For very large maps, upload the standalone folder to your theme (e.g. `wp-content/uploads/atlist/my-map/`), then embed with:

```html
<iframe src="/wp-content/uploads/atlist/my-map/index.html" style="width:100%;height:600px;border:0"></iframe>
```

### React app

1. Use the **React component** export.
2. Drop `AtlistMap.jsx` into your `src/` directory.
3. Import and render:

```jsx
import AtlistMap from './AtlistMap';

export default function Page() {
  return <AtlistMap style={{ minHeight: 600 }} />;
}
```

Note: the runtime is embedded as a string inside the component and is injected as a `<script>` tag on mount.

## Deep-linking

The exported runtime supports two URL parameters:

- `?location=LOC_ID` — pans to the location and opens its popup on load.
- `?category=CAT_ID_1,CAT_ID_2` — activates those category filters on load.

You can find IDs by exporting the project JSON (from the Project panel) and looking at `locations[].id` / `categories[].id`.

## Runtime JavaScript API

After the map loads, `window.atlist` is available:

```js
window.atlist.map;                  // the google.maps.Map instance
window.atlist.openLocation('id');   // pans + opens a popup for a location
```

## Analytics

If enabled, the runtime fires the following events:

- **GA4**: uses `window.gtag` if present.
- **Custom**: define `window.atlistAnalytics = (event, params) => { ... }` before the runtime loads.

Events currently emitted:

- `atlist_popup_open` — `{ location_id, location_name }`
- `atlist_filter_toggle` — `{ category_id }`

## Security reminder

The API key is embedded in plain text inside the export. This is unavoidable for browser Google Maps usage. Restrict the key to the client's HTTP referrer, enable only the APIs the map uses, and set a Google Cloud budget alert.
