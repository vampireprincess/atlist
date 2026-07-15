// Modular Google Maps loader. Loads only the libraries we need.
// We use @googlemaps/js-api-loader; libraries are requested via importLibrary
// to keep bundle minimal and to support tree-shaking of Google's SDK chunks.

import { Loader } from '@googlemaps/js-api-loader';

let loader: Loader | null = null;
let currentKey: string | null = null;
let loadPromise: Promise<typeof google> | null = null;

export interface LoadOptions {
  apiKey: string;
  language?: string;
  region?: string;
}

/** Initialize (or replace) the loader. If the key changes, a full reload is required (page refresh). */
export function initLoader(opts: LoadOptions): Loader {
  if (loader && currentKey === opts.apiKey) return loader;
  if (loader && currentKey !== opts.apiKey) {
    // Google's SDK doesn't support hot-swapping API keys in a single page load.
    // Consumers should reload the page after changing keys.
    console.warn('[gmaps] API key changed — a page reload is required for the change to take effect.');
    return loader;
  }
  loader = new Loader({
    apiKey: opts.apiKey,
    version: 'weekly',
    language: opts.language,
    region: opts.region,
    libraries: [], // request libs on demand via importLibrary
  });
  currentKey = opts.apiKey;
  return loader;
}

export function isLoaderInitialized(): boolean {
  return loader !== null;
}

export async function loadGoogle(): Promise<typeof google> {
  if (!loader) throw new Error('Google Maps loader not initialized. Call initLoader() first.');
  if (loadPromise) return loadPromise;
  loadPromise = loader.load();
  return loadPromise;
}

export async function loadMapsLib(): Promise<google.maps.MapsLibrary> {
  await loadGoogle();
  return google.maps.importLibrary('maps') as Promise<google.maps.MapsLibrary>;
}

export async function loadMarkerLib(): Promise<google.maps.MarkerLibrary> {
  await loadGoogle();
  return google.maps.importLibrary('marker') as Promise<google.maps.MarkerLibrary>;
}

export async function loadPlacesLib(): Promise<google.maps.PlacesLibrary> {
  await loadGoogle();
  return google.maps.importLibrary('places') as Promise<google.maps.PlacesLibrary>;
}

export async function loadGeocodingLib(): Promise<google.maps.GeocodingLibrary> {
  await loadGoogle();
  return google.maps.importLibrary('geocoding') as Promise<google.maps.GeocodingLibrary>;
}

export async function loadCoreLib(): Promise<google.maps.CoreLibrary> {
  await loadGoogle();
  return google.maps.importLibrary('core') as Promise<google.maps.CoreLibrary>;
}

export async function loadDirectionsLib(): Promise<any> {
  await loadGoogle();
  return google.maps.importLibrary('routes');
}
