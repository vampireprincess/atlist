// Client-side runtime template.
// This is bundled as a string and shipped inside the exported project as `map.js`.
// It intentionally has zero build-time dependencies — it runs directly in the browser.

// The exported HTML injects a global ATLIST_DATA object with the following shape:
// { config: {...}, project: {...}, assets: {id: dataUrl|url} }

export const RUNTIME_JS = /* js */ `
(function () {
  'use strict';

  var data = window.ATLIST_DATA;
  if (!data) { console.error('[Atlist] ATLIST_DATA not found'); return; }

  var project = data.project;
  var cfg = data.config;
  var assets = data.assets || {};
  var strings = (project.localization && project.localization.strings[project.localization.defaultLocale]) || {};
  var t = function (k, d) { return strings[k] || d || k; };

  var container = document.getElementById(cfg.containerId || 'atlist-map');
  if (!container) { console.error('[Atlist] container #' + (cfg.containerId || 'atlist-map') + ' not found'); return; }

  container.innerHTML = '';
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  if (cfg.height) container.style.height = cfg.height;
  if (!container.style.height) container.style.height = '520px';

  var loading = document.createElement('div');
  loading.className = 'atlist-loading';
  loading.textContent = t('loading', 'Loading…');
  loading.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#6b7280;font-family:sans-serif;';
  container.appendChild(loading);

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.async = true; s.defer = true;
      s.onload = resolve; s.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(s);
    });
  }

  var apiUrl = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(cfg.apiKey)
    + '&v=weekly&loading=async&libraries=marker'
    + (cfg.language ? '&language=' + encodeURIComponent(cfg.language) : '')
    + (cfg.region ? '&region=' + encodeURIComponent(cfg.region) : '');

  loadScript(apiUrl).then(function () {
    return google.maps.importLibrary('maps').then(function () {
      return google.maps.importLibrary('marker');
    });
  }).then(init).catch(function (err) {
    loading.textContent = t('error', 'Error') + ': ' + err.message;
    loading.style.color = '#dc2626';
  });

  function pickResponsive(base, mode) {
    var r = (base.responsive || {})[mode] || {};
    return {
      center: r.center || base.center,
      zoom: r.zoom != null ? r.zoom : base.zoom,
    };
  }

  function currentDeviceMode() {
    var w = window.innerWidth;
    if (w < 640) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  }

  function analyticsEmit(event, params) {
    var a = project.analytics || { enabled: false };
    if (!a.enabled) return;
    if (a.provider === 'ga4' && typeof window.gtag === 'function') {
      window.gtag('event', event, params || {});
    }
    if (typeof window.atlistAnalytics === 'function') {
      try { window.atlistAnalytics(event, params); } catch (e) {}
    }
  }

  function assetUrl(id) {
    return assets[id] || '';
  }

  function init() {
    loading.remove();

    var mode = currentDeviceMode();
    var rp = pickResponsive(project.mapSettings, mode);

    var mapDiv = document.createElement('div');
    mapDiv.style.cssText = 'position:absolute;inset:0;';
    container.appendChild(mapDiv);

    var opts = {
      center: rp.center,
      zoom: rp.zoom,
      minZoom: project.mapSettings.minZoom,
      maxZoom: project.mapSettings.maxZoom,
      mapId: cfg.mapId || project.mapSettings.mapId,
      mapTypeId: project.mapSettings.mapType,
      zoomControl: project.mapSettings.controls.zoom,
      fullscreenControl: project.mapSettings.controls.fullscreen,
      streetViewControl: project.mapSettings.controls.streetView,
      mapTypeControl: project.mapSettings.controls.mapType,
      gestureHandling: project.mapSettings.gestures.gestureHandling,
      scrollwheel: project.mapSettings.gestures.scrollwheel,
      draggable: project.mapSettings.gestures.draggable,
      disableDoubleClickZoom: project.mapSettings.gestures.disableDoubleClickZoom,
      keyboardShortcuts: project.mapSettings.gestures.keyboardShortcuts,
      clickableIcons: false,
    };
    if (project.mapSettings.bounds) {
      opts.restriction = { latLngBounds: project.mapSettings.bounds, strictBounds: false };
    }

    var map = new google.maps.Map(mapDiv, opts);
    var openInfoWindow = null;
    var openMarkerId = null;

    var activeCategoryIds = new Set(); // empty = show all
    var searchQuery = '';

    function markerTemplateFor(loc) {
      var id = loc.markerTemplateId;
      var base = null;
      for (var i = 0; i < project.markerTemplates.length; i++) {
        if (project.markerTemplates[i].id === id) { base = project.markerTemplates[i]; break; }
      }
      if (!base) base = project.markerTemplates[0] || null;
      if (!base) return null;
      return loc.markerOverride ? Object.assign({}, base, loc.markerOverride) : base;
    }

    function popupTemplateFor(loc) {
      var id = loc.popupTemplateId;
      var base = null;
      for (var i = 0; i < project.popupTemplates.length; i++) {
        if (project.popupTemplates[i].id === id) { base = project.popupTemplates[i]; break; }
      }
      if (!base) base = project.popupTemplates[0] || null;
      if (!base) return null;
      return loc.popupOverride ? Object.assign({}, base, loc.popupOverride) : base;
    }

    function renderMarkerDom(tpl, selected) {
      var w = document.createElement('div');
      w.className = 'atlist-marker';
      w.style.width = tpl.width + 'px';
      w.style.height = tpl.height + 'px';
      w.style.opacity = String(tpl.opacity || 1);
      w.style.transform = 'translate(' + (tpl.offsetX || 0) + 'px,' + (tpl.offsetY || 0) + 'px) scale(' + (tpl.scale || 1) + ') rotate(' + (tpl.rotation || 0) + 'deg)';
      w.style.transformOrigin = 'center bottom';
      w.style.display = 'flex';
      w.style.alignItems = 'center';
      w.style.justifyContent = 'center';
      w.style.cursor = 'pointer';
      if (selected) w.style.filter = 'drop-shadow(0 0 6px ' + (project.globalStyles.primaryColor || '#5b8def') + ')';

      if (tpl.kind === 'pin') {
        var pinBg = tpl.pinBackground || tpl.background || '#5b8def';
        var pinBorder = tpl.pinBorderColor || tpl.borderColor || '#fff';
        w.innerHTML = '<svg viewBox="0 0 32 40" width="' + tpl.width + '" height="' + tpl.height + '">'
          + '<path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z" fill="' + pinBg + '" stroke="' + pinBorder + '" stroke-width="' + (tpl.borderWidth || 2) + '"/>'
          + '<circle cx="16" cy="16" r="5" fill="' + (tpl.pinGlyphColor || '#fff') + '"/></svg>';
      } else if (tpl.kind === 'emoji') {
        var d = document.createElement('div');
        d.textContent = tpl.emoji || '📍';
        d.style.fontSize = Math.min(tpl.width, tpl.height) + 'px';
        d.style.lineHeight = '1';
        w.appendChild(d);
      } else if (tpl.kind === 'text') {
        var d2 = document.createElement('div');
        d2.textContent = tpl.text || 'Label';
        d2.style.cssText = 'background:' + (tpl.background || '#5b8def') + ';color:' + (tpl.labelColor || '#fff') + ';padding:4px 8px;border-radius:' + (tpl.borderRadius || 999) + 'px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:' + (tpl.shadow || 'none') + ';';
        w.appendChild(d2);
      } else if (tpl.kind === 'image' || tpl.kind === 'svg') {
        var url = assetUrl(tpl.imageAssetId || tpl.svgAssetId);
        if (url) {
          var img = document.createElement('img');
          img.src = url; img.alt = tpl.name || '';
          img.style.cssText = 'width:' + tpl.width + 'px;height:' + tpl.height + 'px;object-fit:contain;pointer-events:none;';
          if (tpl.borderRadius) img.style.borderRadius = tpl.borderRadius + 'px';
          if (tpl.borderWidth) img.style.border = tpl.borderWidth + 'px solid ' + tpl.borderColor;
          if (tpl.shadow) img.style.filter = 'drop-shadow(' + tpl.shadow + ')';
          w.appendChild(img);
        }
      } else if (tpl.kind === 'html') {
        w.innerHTML = tpl.html || '';
      }

      if (tpl.label) {
        var lb = document.createElement('div');
        lb.textContent = tpl.label;
        lb.style.cssText = 'position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:4px;background:rgba(0,0,0,0.7);color:' + (tpl.labelColor || '#fff') + ';padding:2px 6px;border-radius:4px;font-size:11px;white-space:nowrap;pointer-events:none;';
        w.appendChild(lb);
      }
      if (tpl.badge) {
        var bd = document.createElement('div');
        bd.textContent = tpl.badge;
        bd.style.cssText = 'position:absolute;top:-4px;right:-4px;background:' + (tpl.badgeColor || '#e11d48') + ';color:#fff;border-radius:999px;padding:1px 5px;font-size:10px;font-weight:600;min-width:16px;text-align:center;box-shadow:0 1px 2px rgba(0,0,0,0.3);';
        w.appendChild(bd);
      }
      return w;
    }

    function resolveSource(source, loc) {
      if (!source) return '';
      var parts = source.split('.');
      var v = { location: loc };
      for (var i = 0; i < parts.length; i++) { v = v ? v[parts[i]] : undefined; }
      return typeof v === 'string' ? v : (v == null ? '' : String(v));
    }

    function renderPopupHtml(tpl, loc) {
      var html = '';
      html += '<div class="atlist-popup" role="dialog" aria-label="' + escapeHtml(loc.name) + '" style="width:' + tpl.width + 'px;max-width:' + tpl.maxWidth + 'px;padding:' + tpl.padding + 'px;background:' + tpl.background + ';border-radius:' + tpl.borderRadius + 'px;color:' + (project.globalStyles.textColor || '#111827') + ';font-family:' + escapeAttr(project.globalStyles.fontFamily || 'sans-serif') + ';box-shadow:' + tpl.shadow + ';border:' + (tpl.borderWidth ? tpl.borderWidth + 'px solid ' + tpl.borderColor : 'none') + ';">';
      for (var i = 0; i < tpl.blocks.length; i++) {
        var b = tpl.blocks[i];
        html += renderBlock(b, loc);
      }
      html += '</div>';
      return html;
    }

    function renderBlock(b, loc) {
      switch (b.type) {
        case 'title':
          return '<h3 style="margin:0 0 4px;font-size:18px;font-weight:700;">' + escapeHtml(resolveSource(b.props.source, loc) || b.props.text || '') + '</h3>';
        case 'subtitle':
          return '<div style="font-size:13px;color:#6b7280;margin-bottom:8px;">' + escapeHtml(resolveSource(b.props.source, loc) || b.props.text || '') + '</div>';
        case 'text':
          var tx = resolveSource(b.props.source, loc) || b.props.text || '';
          return tx ? '<p style="margin:6px 0;font-size:14px;line-height:1.5;">' + escapeHtml(tx) + '</p>' : '';
        case 'address':
          return loc.address ? '<div style="font-size:13px;color:#374151;margin:6px 0;">📍 ' + escapeHtml(loc.address) + '</div>' : '';
        case 'hours':
          return loc.hours ? '<div style="font-size:13px;margin:6px 0;">🕒 ' + escapeHtml(loc.hours) + '</div>' : '';
        case 'phone':
          return loc.phone ? '<div style="font-size:13px;margin:6px 0;">📞 <a href="tel:' + escapeAttr(loc.phone) + '">' + escapeHtml(loc.phone) + '</a></div>' : '';
        case 'email':
          return loc.email ? '<div style="font-size:13px;margin:6px 0;">✉ <a href="mailto:' + escapeAttr(loc.email) + '">' + escapeHtml(loc.email) + '</a></div>' : '';
        case 'divider':
          return '<hr style="border:none;border-top:1px solid #e5e7eb;margin:10px 0;"/>';
        case 'image':
          var im = loc.images && loc.images[0];
          var url = im ? assetUrl(im.assetId) : '';
          return url ? '<img src="' + escapeAttr(url) + '" alt="' + escapeAttr(im.alt || '') + '" style="width:100%;height:auto;border-radius:8px;margin:6px 0;"/>' : '';
        case 'gallery':
          if (!loc.images || !loc.images.length) return '';
          var g = '<div style="display:flex;gap:6px;overflow-x:auto;margin:6px 0;">';
          for (var j = 0; j < loc.images.length; j++) {
            var u = assetUrl(loc.images[j].assetId);
            if (u) g += '<img src="' + escapeAttr(u) + '" alt="" style="width:96px;height:72px;object-fit:cover;border-radius:6px;flex-shrink:0;"/>';
          }
          g += '</div>';
          return g;
        case 'button':
          var label = b.props.label || t('viewDetails', 'View');
          var href = b.props.href || '#';
          if (b.props.action === 'directions') href = 'https://www.google.com/maps/dir/?api=1&destination=' + loc.position.lat + ',' + loc.position.lng;
          else if (b.props.action === 'callPhone' && loc.phone) href = 'tel:' + loc.phone;
          else if (b.props.action === 'sendEmail' && loc.email) href = 'mailto:' + loc.email;
          var style = 'display:inline-block;margin-top:8px;padding:8px 12px;border-radius:8px;font-size:13px;font-weight:500;text-decoration:none;';
          if (b.props.style === 'ghost') style += 'background:transparent;color:#111827;border:1px solid #e5e7eb;';
          else if (b.props.style === 'secondary') style += 'background:#f3f4f6;color:#111827;';
          else style += 'background:' + (project.globalStyles.primaryColor || '#5b8def') + ';color:#fff;';
          return '<a href="' + escapeAttr(href) + '" target="_blank" rel="noopener noreferrer" style="' + style + '" data-atlist-action="' + escapeAttr(b.props.action || '') + '">' + escapeHtml(label) + '</a>';
        case 'html':
          return b.props.html || '';
        default:
          return '';
      }
    }

    function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function escapeAttr(s) { return escapeHtml(s); }

    function locationMatchesFilters(loc) {
      if (searchQuery) {
        var q = searchQuery.toLowerCase();
        var fields = [loc.name, loc.address || '', loc.description || ''].concat(loc.tags || []);
        if (!fields.some(function (f) { return String(f).toLowerCase().indexOf(q) !== -1; })) return false;
      }
      if (activeCategoryIds.size > 0) {
        var logic = (project.filters && project.filters.logic) || 'OR';
        if (logic === 'AND') {
          for (var it = activeCategoryIds.values(), r = it.next(); !r.done; r = it.next()) {
            if (loc.categoryIds.indexOf(r.value) === -1) return false;
          }
        } else {
          var any = false;
          for (var it2 = activeCategoryIds.values(), r2 = it2.next(); !r2.done; r2 = it2.next()) {
            if (loc.categoryIds.indexOf(r2.value) !== -1) { any = true; break; }
          }
          if (!any) return false;
        }
      }
      // Also honor per-category visibility
      for (var i = 0; i < project.categories.length; i++) {
        var c = project.categories[i];
        if (!c.visible && loc.categoryIds.indexOf(c.id) !== -1 && loc.categoryIds.length === 1) return false;
      }
      return true;
    }

    var markerObjs = {};

    function refreshMarkers() {
      var visible = project.locations.filter(function (l) { return l.visible && locationMatchesFilters(l); });
      var visibleIds = {};
      visible.forEach(function (l) { visibleIds[l.id] = true; });
      // Remove hidden
      Object.keys(markerObjs).forEach(function (id) {
        if (!visibleIds[id]) { markerObjs[id].map = null; delete markerObjs[id]; }
      });
      // Add / update
      visible.forEach(function (loc) {
        var tpl = markerTemplateFor(loc);
        if (!tpl) return;
        var dom = renderMarkerDom(tpl, openMarkerId === loc.id);
        var existing = markerObjs[loc.id];
        if (existing) {
          existing.position = loc.position;
          existing.content = dom;
          existing.title = loc.name;
        } else {
          var m = new google.maps.marker.AdvancedMarkerElement({
            map: map,
            position: loc.position,
            content: dom,
            title: loc.name,
            zIndex: tpl.zIndex || 1,
          });
          m.addListener('click', function () { openLocationPopup(loc); });
          markerObjs[loc.id] = m;
        }
      });
      renderSidebarList();
    }

    function openLocationPopup(loc) {
      if (openInfoWindow) { openInfoWindow.close(); openInfoWindow = null; }
      var tpl = popupTemplateFor(loc);
      if (!tpl) return;
      var html = renderPopupHtml(tpl, loc);
      openInfoWindow = new google.maps.InfoWindow({ content: html, pixelOffset: new google.maps.Size(tpl.offsetX || 0, tpl.offsetY || 0) });
      openMarkerId = loc.id;
      var anchor = markerObjs[loc.id];
      openInfoWindow.open({ map: map, anchor: anchor });
      analyticsEmit('atlist_popup_open', { location_id: loc.id, location_name: loc.name });
    }

    // ---- Sidebar ----
    var sidebar = null;
    var listEl = null;
    if (project.sidebar && project.sidebar.enabled) {
      buildSidebar();
    }

    function buildSidebar() {
      sidebar = document.createElement('div');
      sidebar.className = 'atlist-sidebar';
      sidebar.style.cssText = 'position:absolute;top:0;' + (project.sidebar.position === 'right' ? 'right:0;' : 'left:0;') + 'bottom:0;width:' + (project.sidebar.widthDesktop || 320) + 'px;max-width:40%;background:#fff;color:#111827;border-' + (project.sidebar.position === 'right' ? 'left' : 'right') + ':1px solid #e5e7eb;overflow-y:auto;font-family:' + escapeAttr(project.globalStyles.fontFamily || 'sans-serif') + ';z-index:2;';
      container.insertBefore(sidebar, mapDiv);

      // Adjust mapDiv
      var offset = (project.sidebar.widthDesktop || 320) + 'px';
      if (project.sidebar.position === 'right') { mapDiv.style.right = offset; } else { mapDiv.style.left = offset; }

      var header = document.createElement('div');
      header.style.cssText = 'padding:12px;border-bottom:1px solid #e5e7eb;position:sticky;top:0;background:#fff;';
      if (project.sidebar.showSearch) {
        var input = document.createElement('input');
        input.type = 'search';
        input.placeholder = t('search', 'Search') + '…';
        input.style.cssText = 'width:100%;padding:8px 10px;border:1px solid #e5e7eb;border-radius:6px;font-size:14px;';
        input.addEventListener('input', function () {
          searchQuery = input.value;
          refreshMarkers();
        });
        header.appendChild(input);
      }
      if (project.filters && project.filters.enabled && project.categories.length) {
        var filterRow = document.createElement('div');
        filterRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;';
        project.categories.forEach(function (c) {
          var btn = document.createElement('button');
          btn.textContent = c.name + (project.filters.showCounts ? ' (' + project.locations.filter(function (l) { return l.categoryIds.indexOf(c.id) !== -1; }).length + ')' : '');
          btn.style.cssText = 'padding:4px 10px;border-radius:999px;border:1px solid ' + c.color + ';background:transparent;color:' + c.color + ';font-size:12px;cursor:pointer;';
          btn.addEventListener('click', function () {
            if (activeCategoryIds.has(c.id)) {
              activeCategoryIds.delete(c.id);
              btn.style.background = 'transparent';
              btn.style.color = c.color;
            } else {
              activeCategoryIds.add(c.id);
              btn.style.background = c.color;
              btn.style.color = '#fff';
            }
            refreshMarkers();
            analyticsEmit('atlist_filter_toggle', { category_id: c.id });
          });
          filterRow.appendChild(btn);
        });
        if (project.filters.showClearAll) {
          var clear = document.createElement('button');
          clear.textContent = t('clear', 'Clear');
          clear.style.cssText = 'padding:4px 10px;border-radius:999px;border:1px solid #d1d5db;background:transparent;color:#6b7280;font-size:12px;cursor:pointer;';
          clear.addEventListener('click', function () {
            activeCategoryIds.clear();
            searchQuery = '';
            var inp = header.querySelector('input');
            if (inp) inp.value = '';
            Array.from(filterRow.querySelectorAll('button')).forEach(function (b, idx) {
              if (idx < project.categories.length) {
                var cc = project.categories[idx];
                b.style.background = 'transparent';
                b.style.color = cc.color;
              }
            });
            refreshMarkers();
          });
          filterRow.appendChild(clear);
        }
        header.appendChild(filterRow);
      }
      sidebar.appendChild(header);

      listEl = document.createElement('div');
      sidebar.appendChild(listEl);
    }

    function renderSidebarList() {
      if (!listEl) return;
      var visible = project.locations.filter(function (l) { return l.visible && locationMatchesFilters(l); });
      if (visible.length === 0) {
        listEl.innerHTML = '<div style="padding:24px;text-align:center;color:#9ca3af;font-size:14px;">' + escapeHtml(project.sidebar.emptyStateText || t('noResults', 'No results')) + '</div>';
        return;
      }
      var html = '';
      visible.forEach(function (l) {
        var firstImgId = l.images && l.images[0] && l.images[0].assetId;
        var img = firstImgId ? assetUrl(firstImgId) : '';
        html += '<div class="atlist-sb-item" data-loc="' + escapeAttr(l.id) + '" style="display:flex;gap:10px;padding:12px;border-bottom:1px solid #f3f4f6;cursor:pointer;">';
        if (img) html += '<div style="width:56px;height:56px;flex-shrink:0;background-image:url(\\'' + escapeAttr(img) + '\\');background-size:cover;background-position:center;border-radius:6px;"></div>';
        html += '<div style="flex:1;min-width:0;">';
        html += '<div style="font-weight:600;font-size:14px;color:#111827;">' + escapeHtml(l.name) + '</div>';
        if (l.address) html += '<div style="font-size:12px;color:#6b7280;">' + escapeHtml(l.address) + '</div>';
        if (l.description) html += '<div style="font-size:12px;color:#6b7280;margin-top:2px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">' + escapeHtml(l.description) + '</div>';
        html += '</div></div>';
      });
      listEl.innerHTML = html;
      Array.from(listEl.querySelectorAll('.atlist-sb-item')).forEach(function (el) {
        el.addEventListener('click', function () {
          var id = el.getAttribute('data-loc');
          var loc = project.locations.find(function (x) { return x.id === id; });
          if (!loc) return;
          map.panTo(loc.position);
          if (map.getZoom() < 14) map.setZoom(14);
          openLocationPopup(loc);
        });
      });
    }

    // Analytics: marker click via delegation
    map.addListener('click', function () {
      if (openInfoWindow) { openInfoWindow.close(); openInfoWindow = null; openMarkerId = null; }
    });

    refreshMarkers();

    // Deep-link support: ?location=ID or ?category=ID1,ID2
    try {
      var params = new URLSearchParams(window.location.search);
      var locId = params.get('location');
      var catIds = params.get('category');
      if (catIds) catIds.split(',').forEach(function (c) { activeCategoryIds.add(c); });
      if (locId) {
        var loc = project.locations.find(function (x) { return x.id === locId; });
        if (loc) { map.panTo(loc.position); if (map.getZoom() < 14) map.setZoom(14); openLocationPopup(loc); }
      }
      if (activeCategoryIds.size > 0) refreshMarkers();
    } catch (e) {}

    // Expose small API
    window.atlist = window.atlist || {};
    window.atlist.map = map;
    window.atlist.openLocation = function (id) {
      var loc = project.locations.find(function (x) { return x.id === id; });
      if (loc) { map.panTo(loc.position); openLocationPopup(loc); }
    };
  }
})();
`;
