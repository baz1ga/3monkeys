<template>
  <div class="player-view-root">
    <div class="zone1" id="zone1">
      <img id="zone1-img" src="" alt="" />
      <div id="photo-number" class="photo-number"></div>

      <div class="carousel-arrow left" id="carousel-prev">&#8592;</div>
      <div class="carousel-arrow right" id="carousel-next">&#8594;</div>
    </div>

    <div id="gm-offline-banner" class="hidden">
      <div class="title">Connexion au Game Master perdue</div>
      <div class="subtitle">En attente d'une connexion active au GM…</div>
    </div>

    <div class="tension-bar">
      <div class="tension-item green" data-color="#37aa32" data-level="level1">0</div>
      <div class="tension-item yellow" data-color="#f8d718" data-level="level2">-5</div>
      <div class="tension-item orange" data-color="#f39100" data-level="level3">+5</div>
      <div class="tension-item red" data-color="#e63027" data-level="level4">+10</div>
      <div class="tension-item black" data-color="#3a3a39" data-level="level5">+15</div>
    </div>

    <div id="hourglass" class="hourglass">
      <div class="hourglass-time" id="hourglass-time"></div>
      <div id="hourglass-shell" class="hourglass-shell">
        <div class="hourglass-wrapper">
          <div class="hourglass-grid"></div>
        </div>
      </div>
    </div>

    <div class="comm-widget">
      <button class="comm-button" type="button" @click="toggleComm">
        <i class="fa-solid fa-signal"></i>
      </button>
      <div class="comm-panel" v-if="commOpen">
        <div class="comm-title">{{ gmOnline ? 'MJ connecté' : 'MJ déconnecté' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import '../assets/player_view.css';
import '../lib/hourglass.js';
import { API_BASE, api, toAssetUrl, wsBase } from '../lib/api';

const route = useRoute();

type CleanupFn = () => void;
let cleanup: CleanupFn | null = null;

const commOpen = ref(false);
const gmOnline = ref(false);
const pingCountdown = ref(8);

const toggleComm = () => {
  commOpen.value = !commOpen.value;
};

const initPlayerView = (tenantId: string, sessionId: string | null) => {
  const wsRoot = wsBase();
  const API_IMAGES = api(`/t/${encodeURIComponent(tenantId)}/api/images`);
  const API_AUDIO = api(`/t/${encodeURIComponent(tenantId)}/api/audio`);
  const zone1Img = document.getElementById('zone1-img') as HTMLImageElement | null;
  const photoNumber = document.getElementById('photo-number') as HTMLDivElement | null;
  const tensionBar = document.querySelector('.tension-bar') as HTMLDivElement | null;
  const items = Array.from(document.querySelectorAll('.tension-item')) as HTMLDivElement[];
  const zone1 = document.getElementById('zone1') as HTMLDivElement | null;
  const gmOfflineBanner = document.getElementById('gm-offline-banner') as HTMLDivElement | null;
  const hourglassTimeEl = document.getElementById('hourglass-time') as HTMLDivElement | null;
  let hourglass: any = null;

  let tensionEnabled = true;
  let tensionFont = 'Audiowide';
  let gmControlled = true;
  let tensionSocket: WebSocket | null = null;
  let presencePing: ReturnType<typeof setInterval> | null = null;
  let tensionSocketTimer: ReturnType<typeof setTimeout> | null = null;
  let offlineBannerTimer: ReturnType<typeof setTimeout> | null = null;
  let onlineBannerTimer: ReturnType<typeof setTimeout> | null = null;
  let pingTickTimer: ReturnType<typeof setInterval> | null = null;
  let tensionConfigReceived = false;
  let pendingSlideName: string | null = null;
  let currentSlideName: string | null = null;
  let currentSlideUrl: string | null = null;
  let hourglassVisible = false;
  let hourglassShowTimer = false;
  let hourglassTick: ReturnType<typeof setInterval> | null = null;
  let configRequestRetries = 0;
  let audioAssets: Array<{ id: string; name: string; url: string }> = [];

  const assetSrc = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return toAssetUrl(url);
  };

  const ensureAudioAssets = async () => {
    if (audioAssets.length) return;
    try {
      const res = await fetch(API_AUDIO);
      if (!res.ok) return;
      const data = await res.json();
      audioAssets = Array.isArray(data) ? data : [];
    } catch {
      // noop
    }
  };

  const resolveAudioUrl = (ref: string | null) => {
    if (!ref) return '';
    const found = audioAssets.find(a =>
      a.name === ref ||
      a.url === ref ||
      (a.url || '').includes(ref)
    );
    const url = found?.url || ref;
    return assetSrc(url);
  };

  const defaultZoneBorder = { top: '13px', right: '30px', bottom: '13px', left: '30px' };
  let defaultTensionColors = {
    level1: '#37aa32',
    level2: '#f8d718',
    level3: '#f39100',
    level4: '#e63027',
    level5: '#3a3a39'
  };
  let defaultTensionLabels = {
    level1: '0',
    level2: '-5',
    level3: '+5',
    level4: '+10',
    level5: '+15'
  };
  let tensionAudio = {
    level1: null as string | null,
    level2: null as string | null,
    level3: null as string | null,
    level4: null as string | null,
    level5: null as string | null
  };
  let currentTensionLevel: string | null = null;
  const tensionStorageKey = sessionId ? `scenarwall:tension:${tenantId}:${sessionId}` : null;
  if (tensionStorageKey) {
    try {
      const stored = localStorage.getItem(tensionStorageKey);
      if (stored) currentTensionLevel = stored;
    } catch {
      // ignore storage errors
    }
  }

  const applySlide = (img: any) => {
    if (!zone1Img || !photoNumber) return;
    if (!img || !img.url) return;
    const nextUrl = assetSrc(img.url);
    if (currentSlideUrl && currentSlideUrl === nextUrl) {
      return;
    }
    zone1Img.src = nextUrl;
    photoNumber.textContent = img.name || '—';
    currentSlideName = (img.name || img.url || '').trim() || null;
    currentSlideUrl = nextUrl;
  };

  const loadInitialImage = async () => {
    try {
    const res = await fetch(API_IMAGES);
      const data = await res.json();
      const fallback = Array.isArray(data) && data.length ? data[0] : null;
      if (pendingSlideName) {
        const found = (data || []).find((img: any) =>
          img.name === pendingSlideName ||
          img.url === pendingSlideName ||
          (img.url || '').includes(pendingSlideName)
        );
        applySlide(found);
        pendingSlideName = null;
      } else {
        applySlide(fallback);
      }
    } catch (err) {
      console.error('❌ Erreur chargement images :', err);
    }
  };

  const setGmControlled = (state: boolean) => {
    gmControlled = !!state;
    if (tensionBar) {
      tensionBar.classList.toggle('gm-controlled', gmControlled);
    }
    items.forEach(i => {
      i.style.pointerEvents = gmControlled ? 'none' : 'auto';
    });
  };

  const readableTextColor = (bgColor: string) => {
    const match = (bgColor || '').match(/(\d+)\D+(\d+)\D+(\d+)/);
    const r = match ? parseInt(match[1], 10) : 0;
    const g = match ? parseInt(match[2], 10) : 0;
    const b = match ? parseInt(match[3], 10) : 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 140 ? '#000' : '#fff';
  };

  const updateTensionTextContrast = () => {
    if (!items.length) return;
    items.forEach(item => {
      const bg = getComputedStyle(item).backgroundColor;
      item.style.color = readableTextColor(bg);
    });
  };

  const updateZoneBorderFromSelection = () => {
    if (!zone1 || !items.length || !tensionEnabled) return;
    const selected = items.find(i => i.classList.contains('selected'));
    const color = (selected || items[0]).dataset.color;
    if (color) zone1.style.borderColor = color;
  };

  const applyTensionColors = (colors: Record<string, string> | null) => {
    const palette = { ...defaultTensionColors, ...(colors || {}) };
    const values = [palette.level1, palette.level2, palette.level3, palette.level4, palette.level5];
    items.forEach((item, idx) => {
      const color = values[idx] || defaultTensionColors[`level${idx + 1}` as keyof typeof defaultTensionColors];
      item.style.backgroundColor = color;
      item.dataset.color = color;
    });
    updateTensionTextContrast();
    updateZoneBorderFromSelection();
  };

  const applyTensionLabels = (labels: Record<string, string> | null) => {
    const values = { ...defaultTensionLabels, ...(labels || {}) };
    items.forEach((item, idx) => {
      const label = values[`level${idx + 1}`] || defaultTensionLabels[`level${idx + 1}` as keyof typeof defaultTensionLabels];
      item.textContent = label;
    });
  };

  const setDefaultTension = () => {
    if (!items.length || !zone1) return;
    items.forEach(i => i.classList.remove('selected'));
    items[0].classList.add('selected');
    zone1.style.borderColor = items[0].dataset.color || '';
    currentTensionLevel = items[0].dataset.level || 'level1';
  };

  const clearTension = () => {
    items.forEach(i => i.classList.remove('selected'));
    if (zone1) zone1.style.borderColor = 'transparent';
  };

  const setZoneBorder = (enabled: boolean) => {
    if (!zone1) return;
    if (enabled) {
      zone1.style.borderTopWidth = defaultZoneBorder.top;
      zone1.style.borderRightWidth = defaultZoneBorder.right;
      zone1.style.borderBottomWidth = defaultZoneBorder.bottom;
      zone1.style.borderLeftWidth = defaultZoneBorder.left;
    } else {
      zone1.style.borderTopWidth = '0';
      zone1.style.borderRightWidth = '0';
      zone1.style.borderBottomWidth = '0';
      zone1.style.borderLeftWidth = '0';
    }
  };

  const applyTensionState = (enabled: boolean) => {
    if (!tensionBar) return;
    tensionEnabled = !!enabled;
    if (enabled) {
      tensionBar.classList.add('enabled');
      setZoneBorder(true);
      if (currentTensionLevel) {
        selectTensionLevel(currentTensionLevel);
      } else {
        setDefaultTension();
      }
    } else {
      tensionBar.classList.remove('enabled');
      clearTension();
      setZoneBorder(false);
    }
  };

  const applyTensionFont = (fontName: string | null) => {
    tensionFont = fontName || 'Audiowide';
    if (tensionBar) {
      tensionBar.style.fontFamily = `"${tensionFont}", sans-serif`;
    }
  };

  const selectTensionLevel = (level: string) => {
    if (!items.length || !tensionEnabled || !zone1) return;
    const target = items.find(i => i.dataset.level === level) || items[0];
    items.forEach(i => i.classList.remove('selected'));
    target.classList.add('selected');
    zone1.style.borderColor = target.dataset.color || '';
    currentTensionLevel = target.dataset.level || level;
    if (tensionStorageKey && currentTensionLevel) {
      try {
        localStorage.setItem(tensionStorageKey, currentTensionLevel);
      } catch {
        // ignore storage errors
      }
    }
  };

  const setSlideByName = (name: string) => {
    if (!name) return;
    const normalized = name.trim();
    if (currentSlideName && currentSlideName === normalized) return;
    if (currentSlideUrl && currentSlideUrl.includes(normalized)) return;
    pendingSlideName = name;
    fetch(API_IMAGES)
      .then(res => res.json())
      .then(data => {
        const found = Array.isArray(data)
          ? data.find((img: any) =>
              img.name === name ||
              img.url === name ||
              (img.url || '').includes(name)
            )
          : null;
        if (found) applySlide(found);
      })
      .catch(() => {});
  };

  const playTensionAudio = async (level: string) => {
    const ref = (tensionAudio as Record<string, string | null>)[level] || null;
    if (!ref) return;
    await ensureAudioAssets();
    const url = resolveAudioUrl(ref);
    if (!url) return;
    try {
      const audio = new Audio(url);
      await audio.play();
    } catch {
      // ignore autoplay errors
    }
  };

  const setupTensionSocket = () => {
    if (tensionSocket) {
      tensionSocket.close();
      tensionSocket = null;
    }
    const ws = new WebSocket(`${wsRoot}/ws?tenantId=${encodeURIComponent(tenantId)}&role=front`);
    tensionSocket = ws;
    ws.onopen = () => {
      setGmControlled(true);
      ws.send(JSON.stringify({ type: 'presence:hello', sessionId }));
      presencePing = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'presence:hello', sessionId }));
          pingCountdown.value = 8;
        }
      }, 8000);
      pingCountdown.value = 8;
      if (!pingTickTimer) {
        pingTickTimer = setInterval(() => {
          pingCountdown.value = Math.max(0, pingCountdown.value - 1);
        }, 1000);
      }
      ws.send(JSON.stringify({ type: 'tension:request', sessionId }));
      ws.send(JSON.stringify({ type: 'slideshow:request', sessionId }));
    };
    ws.onclose = () => {
      if (presencePing) {
        clearInterval(presencePing);
        presencePing = null;
      }
      if (pingTickTimer) {
        clearInterval(pingTickTimer);
        pingTickTimer = null;
      }
      if (onlineBannerTimer) {
        clearTimeout(onlineBannerTimer);
        onlineBannerTimer = null;
      }
      if (offlineBannerTimer) clearTimeout(offlineBannerTimer);
      offlineBannerTimer = setTimeout(() => {
        gmOfflineBanner?.classList.remove('hidden');
      }, 1200);
      tensionSocketTimer = setTimeout(setupTensionSocket, 2000);
    };
    ws.onerror = () => {
      ws.close();
    };
    ws.onmessage = evt => {
      try {
        const data = JSON.parse(evt.data || '{}');
        if (data.sessionId && sessionId && data.sessionId !== sessionId) return;
        if (data.type === 'presence:update') {
          if (data.gm === 'online') {
            if (offlineBannerTimer) {
              clearTimeout(offlineBannerTimer);
              offlineBannerTimer = null;
            }
            gmOnline.value = true;
            if (onlineBannerTimer) clearTimeout(onlineBannerTimer);
            onlineBannerTimer = setTimeout(() => {
              gmOfflineBanner?.classList.add('hidden');
            }, 1200);
          } else if (data.gm === 'offline') {
            gmOnline.value = false;
            if (onlineBannerTimer) {
              clearTimeout(onlineBannerTimer);
              onlineBannerTimer = null;
            }
            if (offlineBannerTimer) clearTimeout(offlineBannerTimer);
            offlineBannerTimer = setTimeout(() => {
              gmOfflineBanner?.classList.remove('hidden');
            }, 1200);
          }
        }
        if (data.type === 'tension:update' && data.level) {
          selectTensionLevel(data.level);
          if (!data.silent) {
            playTensionAudio(data.level);
          }
        }
        if (data.type === 'tension:config' && data.config) {
          applyTensionState(data.config.tensionEnabled);
          applyTensionFont(data.config.tensionFont);
          applyTensionColors(data.config.tensionColors);
          applyTensionLabels(data.config.tensionLabels);
          tensionAudio = { ...tensionAudio, ...(data.config.tensionAudio || {}) };
          tensionConfigReceived = true;
          configRequestRetries = 0;
        }
        if (data.type === 'slideshow:update' && data.name) {
          if (!currentSlideName || currentSlideName !== String(data.name).trim()) {
            setSlideByName(data.name);
          }
          configRequestRetries = 0;
        }
        if (data.type === 'hourglass:command' && data.action) {
          applyHourglassCommand(data);
        }
      } catch {
        // ignore
      }
    };
  };

  const loadTensionConfig = async () => {
    try {
      const res = await fetch(api(`/t/${encodeURIComponent(tenantId)}/api/config`));
      if (!res.ok) throw new Error('Config fetch failed');
      const data = await res.json();
      applyTensionState(data.tensionEnabled);
      applyTensionFont(data.tensionFont);
      applyTensionColors(data.tensionColors);
      applyTensionLabels(data.tensionLabels);
    } catch {
      applyTensionState(true);
      applyTensionFont(tensionFont || 'Audiowide');
      applyTensionColors(defaultTensionColors);
      applyTensionLabels(defaultTensionLabels);
    }
  };

  const loadSessionConfig = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(api(`/t/${encodeURIComponent(tenantId)}/api/sessions/${encodeURIComponent(sessionId)}`));
      if (!res.ok) return;
      const data = await res.json();
      applyTensionState(data.tensionEnabled);
      applyTensionFont(data.tensionFont);
      applyTensionColors(data.tensionColors);
      applyTensionLabels(data.tensionLabels);
      tensionAudio = { ...tensionAudio, ...(data.tensionAudio || {}) };
    } catch {
      // noop
    }
  };

  const loadTensionDefaults = async () => {
    try {
      const res = await fetch(api('/api/tension-default'));
      if (!res.ok) return;
      const data = await res.json();
      if (data?.tensionColors) defaultTensionColors = { ...defaultTensionColors, ...data.tensionColors };
      if (data?.tensionLabels) defaultTensionLabels = { ...defaultTensionLabels, ...data.tensionLabels };
      if (data?.tensionFont) tensionFont = data.tensionFont;
      if (data?.tensionAudio) tensionAudio = { ...tensionAudio, ...data.tensionAudio };
    } catch {
      // noop
    }
  };

  const initHourglass = () => {
    const wrapper = document.querySelector('#hourglass-shell .hourglass-wrapper');
    const PixelHourglass = (window as any).PixelHourglass;
    if (!wrapper || !PixelHourglass) return;
    hourglass = new PixelHourglass(wrapper, { durationSeconds: 60, fillPercent: 97 });
    updateHourglassTime();
    hourglassTick = setInterval(updateHourglassTime, 500);
    setHourglassVisibility(hourglassVisible);
    setHourglassTimerVisibility(hourglassShowTimer);
  };

  const updateHourglassTime = () => {
    if (!hourglass || !hourglassTimeEl) return;
    const remaining = Math.max(0, Math.ceil(hourglass.durationSeconds - hourglass.elapsedMs / 1000));
    hourglassTimeEl.textContent = `${remaining}s`;
  };

  const setHourglassVisibility = (visible: boolean) => {
    hourglassVisible = visible !== false;
    const container = document.getElementById('hourglass');
    if (container) {
      container.style.display = hourglassVisible ? 'flex' : 'none';
    }
    if (!hourglassVisible) {
      setHourglassTimerVisibility(false);
    } else {
      setHourglassTimerVisibility(hourglassShowTimer);
    }
  };

  const setHourglassTimerVisibility = (show: boolean) => {
    hourglassShowTimer = !!show;
    if (hourglassTimeEl) {
      hourglassTimeEl.style.display = hourglassShowTimer ? 'block' : 'none';
    }
  };

  const applyHourglassCommand = (cmd: any) => {
    if (!hourglass) return;
    const duration = Number(cmd.durationSeconds);
    const hasDuration = Number.isFinite(duration) && duration > 0;
    if (cmd.action === 'flip') {
      hourglass.flip(hasDuration ? { durationSeconds: duration } : {});
    } else if (cmd.action === 'reset') {
      hourglass.reset(hasDuration ? { durationSeconds: duration } : {});
    } else if (cmd.action === 'play') {
      if (hasDuration) hourglass.reset({ durationSeconds: duration });
      hourglass.play();
    } else if (cmd.action === 'setDuration') {
      hourglass.reset(hasDuration ? { durationSeconds: duration } : {});
    } else if (cmd.action === 'visibility') {
      if (cmd.visible !== false && typeof cmd.show === 'boolean') {
        setHourglassTimerVisibility(cmd.show);
      }
      setHourglassVisibility(cmd.visible !== false);
    } else if (cmd.action === 'showTimer') {
      setHourglassTimerVisibility(cmd.show !== false);
    }
    updateHourglassTime();
  };

  const requestRemoteConfig = () => {
    if (tensionSocket && tensionSocket.readyState === WebSocket.OPEN && !tensionConfigReceived) {
      tensionSocket.send(JSON.stringify({ type: 'tension:request', sessionId }));
      tensionSocket.send(JSON.stringify({ type: 'slideshow:request', sessionId }));
      configRequestRetries = 0;
      return;
    }
    if (configRequestRetries < 5) {
      configRequestRetries += 1;
      setTimeout(requestRemoteConfig, 800);
    }
  };

  setGmControlled(true);
  loadTensionDefaults()
    .then(() => loadTensionConfig())
    .then(() => loadSessionConfig())
    .finally(() => {
      setupTensionSocket();
      loadInitialImage();
      initHourglass();
      ensureAudioAssets();
      requestRemoteConfig();
    });

  cleanup = () => {
    if (presencePing) clearInterval(presencePing);
    if (tensionSocketTimer) clearTimeout(tensionSocketTimer);
    if (hourglassTick) clearInterval(hourglassTick);
    if (pingTickTimer) clearInterval(pingTickTimer);
    if (tensionSocket) tensionSocket.close();
    presencePing = null;
    tensionSocketTimer = null;
    hourglassTick = null;
    pingTickTimer = null;
    tensionSocket = null;
  };
};

onMounted(() => {
  document.body.classList.add('player-view');
  const tenantId = String(route.params.tenantId || '');
  const sessionId = typeof route.query.session === 'string' ? route.query.session : null;
  if (!tenantId) {
    document.body.innerHTML = "<h2 style='color:white;text-align:center;margin-top:50px;'>Erreur tenant</h2>";
    return;
  }
  initPlayerView(tenantId, sessionId);
});

onBeforeUnmount(() => {
  document.body.classList.remove('player-view');
  if (cleanup) cleanup();
});
</script>

<style scoped>
.comm-widget {
  position: fixed;
  left: 18px;
  bottom: 18px;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  z-index: 50;
}
.comm-button {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid #cbd5f5;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #4f46e5;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);
}
.comm-panel {
  min-width: 160px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
  font-size: 13px;
}
.comm-title {
  font-weight: 700;
  color: #0f172a;
}
.comm-sub {
  margin-top: 4px;
  color: #64748b;
}
</style>
