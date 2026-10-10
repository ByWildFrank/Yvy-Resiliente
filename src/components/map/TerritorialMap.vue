<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import XYZ from 'ol/source/XYZ.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import Overlay from 'ol/Overlay.js';
import { Style, Icon } from 'ol/style.js';
import type { Incident, CitizenReport, Sensor, HydroStation } from '@/types/domain';
import { LABELS, formatTimeAgo } from '@/config/labels';

const props = withDefaults(
  defineProps<{
    incidents?: Incident[];
    reports?: CitizenReport[];
    stations?: Array<HydroStation & { state?: string }>;
    sensors?: Sensor[];
    mode?: 'publico' | 'tecnico';
    heightClass?: string;
    selectedId?: string | null;
    pickerMode?: boolean;
    initialCenter?: [number, number]; // [lat, lng]
    initialZoom?: number;
  }>(),
  {
    incidents: () => [],
    reports: () => [],
    stations: () => [],
    sensors: () => [],
    mode: 'publico',
    heightClass: 'h-[480px]',
    selectedId: null,
    pickerMode: false,
    initialCenter: () => [-27.4692, -58.8344], // [lat, lng] Corrientes / Resistencia
    initialZoom: 8,
  },
);

const emit = defineEmits<{
  'select-incident': [id: string];
  'select-report': [id: string];
  'select-station': [id: string];
  'update:location': [loc: { lat: number; lng: number; label?: string }];
}>();

const mapContainer = ref<HTMLDivElement | null>(null);
const popupElement = ref<HTMLDivElement | null>(null);

let map: Map | null = null;
let baseTileLayer: TileLayer<XYZ> | null = null;
let popupOverlay: Overlay | null = null;

// Fuentes vectoriales por capa
const incidentsSource = new VectorSource();
const reportsSource = new VectorSource();
const stationsSource = new VectorSource();
const sensorsSource = new VectorSource();
const pickerSource = new VectorSource();

let incidentsLayer: VectorLayer<VectorSource> | null = null;
let reportsLayer: VectorLayer<VectorSource> | null = null;
let stationsLayer: VectorLayer<VectorSource> | null = null;
let sensorsLayer: VectorLayer<VectorSource> | null = null;
let pickerLayer: VectorLayer<VectorSource> | null = null;

// Tipo de mapa base
const baseLayerType = ref<'dark' | 'satellite' | 'streets'>('dark');

// Filtros de visibilidad
const showIncidents = ref(true);
const showReports = ref(true);
const showStations = ref(true);
const showSensors = ref(props.mode === 'tecnico');

// Estado del popup reactivo
const activePopup = ref<{
  type: 'incident' | 'report' | 'station' | 'sensor';
  data: any;
} | null>(null);

const tileUrls = {
  dark: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  streets: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
};

// ─── Generadores de SVG Data URL para Estilos de Marcadores ─────────────────

function createFireSvg(code: string, isSelected: boolean): string {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r="22" fill="rgba(255, 179, 173, 0.35)"/>
      <circle cx="28" cy="28" r="14" fill="#a40217" stroke="${isSelected ? '#4cd7f6' : '#ffffff'}" stroke-width="${isSelected ? '3' : '2'}"/>
      <path d="M28 19c-1 3-4 5-4 8 0 2.2 1.8 4 4 4s4-1.8 4-4c0-3-3-5-4-8z" fill="#ffdad6"/>
      <rect x="8" y="44" width="40" height="11" rx="3" fill="#070e1a" stroke="#a40217" stroke-width="1"/>
      <text x="28" y="52" fill="#ffdad6" font-size="8" font-family="monospace" font-weight="bold" text-anchor="middle">${code}</text>
    </svg>
  `);
}

function createWaterSvg(code: string, isSelected: boolean): string {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r="22" fill="rgba(76, 215, 246, 0.35)"/>
      <circle cx="28" cy="28" r="14" fill="#00687a" stroke="${isSelected ? '#4cd7f6' : '#ffffff'}" stroke-width="${isSelected ? '3' : '2'}"/>
      <path d="M28 19c-2 3-4 6-4 8 0 2.2 1.8 4 4 4s4-1.8 4-4c0-2-2-5-4-8z" fill="#acedff"/>
      <rect x="8" y="44" width="40" height="11" rx="3" fill="#070e1a" stroke="#00687a" stroke-width="1"/>
      <text x="28" y="52" fill="#acedff" font-size="8" font-family="monospace" font-weight="bold" text-anchor="middle">${code}</text>
    </svg>
  `);
}

function createReportSvg(code: string, status: string, isSelected: boolean): string {
  const color = status === 'recibido' ? '#f48c24' : status === 'en_verificacion' ? '#ffb77d' : status === 'confirmado' ? '#4cd7f6' : '#869397';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r="20" fill="${color}33"/>
      <circle cx="28" cy="28" r="12" fill="${color}" stroke="${isSelected ? '#ffffff' : '#070e1a'}" stroke-width="${isSelected ? '3' : '2'}"/>
      <circle cx="28" cy="28" r="4" fill="#070e1a"/>
      <rect x="8" y="44" width="40" height="11" rx="3" fill="#070e1a" stroke="${color}" stroke-width="1"/>
      <text x="28" y="52" fill="${color}" font-size="8" font-family="monospace" font-weight="bold" text-anchor="middle">${code}</text>
    </svg>
  `);
}

function createStationSvg(code: string, levelM: number, isAlert: boolean): string {
  const bg = isAlert ? '#93000a' : '#00424f';
  const border = isAlert ? '#ffb3ad' : '#06b6d4';
  const text = isAlert ? '#ffdad6' : '#acedff';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="86" height="24" viewBox="0 0 86 24">
      <rect x="1" y="2" width="84" height="20" rx="4" fill="${bg}" stroke="${border}" stroke-width="1.5"/>
      <circle cx="9" cy="12" r="3.5" fill="${border}"/>
      <text x="16" y="15" fill="${text}" font-size="9" font-family="monospace" font-weight="bold">${code}: ${levelM.toFixed(2)}m</text>
    </svg>
  `);
}

function createSensorSvg(code: string, isOnline: boolean): string {
  const color = isOnline ? '#4cd7f6' : '#ffb4ab';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="56" height="20" viewBox="0 0 56 20">
      <rect x="1" y="1" width="54" height="18" rx="3" fill="#070e1a" stroke="#3d494c" stroke-width="1"/>
      <circle cx="8" cy="10" r="3" fill="${color}"/>
      <text x="15" y="13" fill="#bcc9cd" font-size="8.5" font-family="monospace">${code}</text>
    </svg>
  `);
}

function createPickerSvg(): string {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="rgba(76, 215, 246, 0.35)"/>
      <circle cx="24" cy="24" r="10" fill="#06b6d4" stroke="#ffffff" stroke-width="2.5"/>
      <circle cx="24" cy="24" r="3" fill="#ffffff"/>
      <path d="M24 4v8M24 36v8M4 24h8M36 24h8" stroke="#acedff" stroke-width="2"/>
    </svg>
  `);
}

// ─── Funciones del Mapa ─────────────────────────────────────────────────────

function switchBaseLayer(type: 'dark' | 'satellite' | 'streets') {
  baseLayerType.value = type;
  if (!baseTileLayer) return;
  baseTileLayer.setSource(
    new XYZ({
      url: tileUrls[type],
      maxZoom: 19,
    }),
  );
}

function centerOnRegion() {
  if (!map) return;
  map.getView().animate({
    center: fromLonLat([-58.6, -27.65]),
    zoom: 8,
    duration: 600,
  });
}

function useUserLocation() {
  if (!map || !('geolocation' in navigator)) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const coords = fromLonLat([lng, lat]);

      map?.getView().animate({
        center: coords,
        zoom: 13,
        duration: 800,
      });

      if (props.pickerMode) {
        setPickerLocation(lat, lng, 'Ubicación GPS detectada');
      }
    },
    (err) => {
      console.warn('No se pudo obtener la geolocalización:', err);
    },
    { enableHighAccuracy: true },
  );
}

function setPickerLocation(lat: number, lng: number, label?: string) {
  const fixedLat = Number(lat.toFixed(5));
  const fixedLng = Number(lng.toFixed(5));
  const coordinate = fromLonLat([fixedLng, fixedLat]);

  pickerSource.clear();
  const feature = new Feature({
    geometry: new Point(coordinate),
  });
  feature.setStyle(
    new Style({
      image: new Icon({
        src: createPickerSvg(),
        anchor: [0.5, 0.5],
      }),
    }),
  );
  pickerSource.addFeature(feature);

  emit('update:location', { lat: fixedLat, lng: fixedLng, label });
}

function closePopup() {
  activePopup.value = null;
  popupOverlay?.setPosition(undefined);
}

function updateFeatures() {
  // 1. Incidentes
  incidentsSource.clear();
  if (showIncidents.value) {
    props.incidents.forEach((inc) => {
      if (!inc.location || typeof inc.location.lat !== 'number' || typeof inc.location.lng !== 'number') return;
      const isFire = inc.type === 'incendio' || inc.type === 'humo';
      const isSelected = props.selectedId === inc.id;

      const feature = new Feature({
        geometry: new Point(fromLonLat([inc.location.lng, inc.location.lat])),
        itemType: 'incident',
        itemData: inc,
      });

      const iconSvg = isFire ? createFireSvg(inc.code, isSelected) : createWaterSvg(inc.code, isSelected);
      feature.setStyle(
        new Style({
          image: new Icon({
            src: iconSvg,
            anchor: [0.5, 0.5],
          }),
        }),
      );

      incidentsSource.addFeature(feature);
    });
  }

  // 2. Puntos de Notificación Ciudadana (Reportes)
  reportsSource.clear();
  if (showReports.value) {
    props.reports.forEach((rep) => {
      if (!rep.location || typeof rep.location.lat !== 'number' || typeof rep.location.lng !== 'number') return;
      const isSelected = props.selectedId === rep.id;

      const feature = new Feature({
        geometry: new Point(fromLonLat([rep.location.lng, rep.location.lat])),
        itemType: 'report',
        itemData: rep,
      });

      feature.setStyle(
        new Style({
          image: new Icon({
            src: createReportSvg(rep.code, rep.status, isSelected),
            anchor: [0.5, 0.5],
          }),
        }),
      );

      reportsSource.addFeature(feature);
    });
  }

  // 3. Estaciones Hidrométricas
  stationsSource.clear();
  if (showStations.value) {
    props.stations.forEach((st) => {
      const loc = st.location;
      if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return;
      const isAlert = st.state === 'alerta' || st.state === 'evacuacion';

      const feature = new Feature({
        geometry: new Point(fromLonLat([loc.lng, loc.lat])),
        itemType: 'station',
        itemData: st,
      });

      feature.setStyle(
        new Style({
          image: new Icon({
            src: createStationSvg(st.code, st.currentLevelM, isAlert),
            anchor: [0.5, 0.5],
          }),
        }),
      );

      stationsSource.addFeature(feature);
    });
  }

  // 4. Sensores Telemétricos
  sensorsSource.clear();
  if (showSensors.value && props.mode === 'tecnico') {
    props.sensors.forEach((sen) => {
      const loc = sen.location;
      if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return;
      const isOnline = sen.status === 'online';

      const feature = new Feature({
        geometry: new Point(fromLonLat([loc.lng, loc.lat])),
        itemType: 'sensor',
        itemData: sen,
      });

      feature.setStyle(
        new Style({
          image: new Icon({
            src: createSensorSvg(sen.code, isOnline),
            anchor: [0.5, 0.5],
          }),
        }),
      );

      sensorsSource.addFeature(feature);
    });
  }
}

onMounted(() => {
  if (!mapContainer.value) return;

  // Capa Base OpenLayers
  baseTileLayer = new TileLayer({
    source: new XYZ({
      url: tileUrls[baseLayerType.value],
      maxZoom: 19,
    }),
  });

  // Capas Vectoriales
  incidentsLayer = new VectorLayer({ source: incidentsSource });
  reportsLayer = new VectorLayer({ source: reportsSource });
  stationsLayer = new VectorLayer({ source: stationsSource });
  sensorsLayer = new VectorLayer({ source: sensorsSource });
  pickerLayer = new VectorLayer({ source: pickerSource, zIndex: 100 });

  // Popup Overlay
  if (popupElement.value) {
    popupOverlay = new Overlay({
      element: popupElement.value,
      autoPan: {
        animation: {
          duration: 250,
        },
      },
    });
  }

  // Inicializar mapa OpenLayers
  map = new Map({
    target: mapContainer.value,
    layers: [
      baseTileLayer,
      incidentsLayer,
      reportsLayer,
      stationsLayer,
      sensorsLayer,
      pickerLayer,
    ],
    overlays: popupOverlay ? [popupOverlay] : [],
    view: new View({
      center: fromLonLat([props.initialCenter[1], props.initialCenter[0]]),
      zoom: props.initialZoom,
      maxZoom: 19,
    }),
  });

  // Evento de clic en mapa
  map.on('singleclick', (evt) => {
    // Si estamos en modo selector, posicionar el marcador
    if (props.pickerMode) {
      const lonLat = toLonLat(evt.coordinate);
      setPickerLocation(lonLat[1], lonLat[0]);
      return;
    }

    // Comprobar si se hizo clic en un feature
    const feature = map?.forEachFeatureAtPixel(evt.pixel, (f) => f);
    if (feature) {
      const itemType = feature.get('itemType');
      const itemData = feature.get('itemData');

      if (itemType === 'incident') {
        activePopup.value = { type: 'incident', data: itemData };
        popupOverlay?.setPosition(evt.coordinate);
        emit('select-incident', itemData.id);
      } else if (itemType === 'report') {
        activePopup.value = { type: 'report', data: itemData };
        popupOverlay?.setPosition(evt.coordinate);
        emit('select-report', itemData.id);
      } else if (itemType === 'station') {
        activePopup.value = { type: 'station', data: itemData };
        popupOverlay?.setPosition(evt.coordinate);
        emit('select-station', itemData.id);
      } else if (itemType === 'sensor') {
        activePopup.value = { type: 'sensor', data: itemData };
        popupOverlay?.setPosition(evt.coordinate);
      }
    } else {
      closePopup();
    }
  });

  // Cambiar cursor a pointer al posar sobre features
  map.on('pointermove', (evt) => {
    if (props.pickerMode) {
      mapContainer.value!.style.cursor = 'crosshair';
      return;
    }
    const hit = map?.hasFeatureAtPixel(evt.pixel);
    mapContainer.value!.style.cursor = hit ? 'pointer' : '';
  });

  // Si está en pickerMode con valor inicial
  if (props.pickerMode && props.initialCenter) {
    setPickerLocation(props.initialCenter[0], props.initialCenter[1]);
  }

  updateFeatures();

  nextTick(() => {
    map?.updateSize();
  });
});

onUnmounted(() => {
  if (map) {
    map.dispose();
    map = null;
  }
});

// Observadores de cambios reactivos
watch(
  () => [props.incidents, props.reports, props.stations, props.sensors, props.selectedId],
  () => {
    updateFeatures();
  },
  { deep: true },
);

watch(
  () => [showIncidents.value, showReports.value, showStations.value, showSensors.value],
  () => {
    updateFeatures();
  },
);

watch(
  () => props.selectedId,
  (newId) => {
    if (!newId || !map) return;
    const targetInc = props.incidents.find((i) => i.id === newId);
    if (targetInc?.location) {
      map.getView().animate({
        center: fromLonLat([targetInc.location.lng, targetInc.location.lat]),
        zoom: 12,
        duration: 700,
      });
    }
  },
);
</script>

<template>
  <div :class="['relative bg-[#070e1a] rounded-xl overflow-hidden border border-[#3d494c]/40 shadow-xl', heightClass]">
    <!-- Contenedor del Mapa OpenLayers -->
    <div ref="mapContainer" class="w-full h-full z-0"></div>

    <!-- Overlay Popup Reactivo de OpenLayers -->
    <div ref="popupElement" class="ol-popup" v-show="activePopup">
      <a href="#" class="ol-popup-closer" @click.prevent="closePopup">✕</a>

      <!-- Detalle de Incidente -->
      <div v-if="activePopup?.type === 'incident'" class="space-y-1.5 text-xs">
        <div class="flex items-center justify-between gap-2 border-b border-[#3d494c]/40 pb-1">
          <span class="font-mono font-bold text-[#4cd7f6]">{{ activePopup.data.code }}</span>
          <span
            :class="[
              'px-1.5 py-0.5 rounded text-[10px] uppercase font-mono',
              activePopup.data.priority === 'critica' ? 'bg-[#93000a] text-[#ffdad6]' : 'bg-[#18202c] text-[#ffb77d]',
            ]"
          >
            {{ activePopup.data.priority }}
          </span>
        </div>
        <div class="font-bold text-[#dbe3f4]">{{ LABELS.incidentType[activePopup.data.type] ?? activePopup.data.type }}</div>
        <p class="text-[#bcc9cd] line-clamp-3 leading-relaxed">{{ activePopup.data.description }}</p>
        <div class="text-[10px] text-[#869397] font-mono space-y-0.5 pt-1 border-t border-[#3d494c]/20">
          <div>📍 {{ activePopup.data.location.label ?? `${activePopup.data.location.lat.toFixed(4)}, ${activePopup.data.location.lng.toFixed(4)}` }}</div>
          <div>🕒 {{ formatTimeAgo(activePopup.data.updatedAt) }}</div>
          <div v-if="activePopup.data.areaHa">🔥 Superficie: {{ activePopup.data.areaHa }} ha</div>
          <div v-if="activePopup.data.levelM">🌊 Nivel: {{ activePopup.data.levelM }} m</div>
        </div>
      </div>

      <!-- Detalle de Punto de Notificación (Reporte Ciudadano) -->
      <div v-else-if="activePopup?.type === 'report'" class="space-y-1.5 text-xs">
        <div class="flex items-center justify-between gap-2 border-b border-[#3d494c]/40 pb-1">
          <span class="font-mono font-bold text-[#ffb77d]">{{ activePopup.data.code }}</span>
          <span class="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-[#232a37] text-[#ffdcc3]">
            {{ LABELS.reportStatus[activePopup.data.status] ?? activePopup.data.status }}
          </span>
        </div>
        <div class="font-bold text-[#dbe3f4]">Reporte ciudadano · {{ LABELS.reportType[activePopup.data.type] ?? activePopup.data.type }}</div>
        <p class="text-[#bcc9cd] line-clamp-3 leading-relaxed">{{ activePopup.data.description }}</p>
        <div class="text-[10px] text-[#869397] font-mono space-y-0.5 pt-1 border-t border-[#3d494c]/20">
          <div>📍 {{ activePopup.data.location.label ?? `${activePopup.data.location.lat.toFixed(4)}, ${activePopup.data.location.lng.toFixed(4)}` }}</div>
          <div>👤 Por: {{ activePopup.data.createdByName }}</div>
          <div>🕒 {{ formatTimeAgo(activePopup.data.createdAt) }}</div>
        </div>
      </div>

      <!-- Detalle de Estación Hidrométrica -->
      <div v-else-if="activePopup?.type === 'station'" class="space-y-1.5 text-xs">
        <div class="flex items-center justify-between gap-2 border-b border-[#3d494c]/40 pb-1">
          <span class="font-mono font-bold text-[#4cd7f6]">{{ activePopup.data.code }} · {{ activePopup.data.name }}</span>
          <span
            :class="[
              'px-1.5 py-0.5 rounded text-[10px] uppercase font-mono',
              activePopup.data.state === 'alerta' || activePopup.data.state === 'evacuacion'
                ? 'bg-[#93000a] text-[#ffdad6]'
                : 'bg-[#00424f] text-[#acedff]',
            ]"
          >
            {{ activePopup.data.state ?? 'normal' }}
          </span>
        </div>
        <div class="font-mono text-sm font-bold text-[#4cd7f6]">{{ activePopup.data.currentLevelM.toFixed(2) }} m</div>
        <div class="text-[10px] text-[#bcc9cd] font-mono space-y-0.5">
          <div>Río: {{ activePopup.data.river }} ({{ activePopup.data.province }})</div>
          <div>Cota Alerta: {{ activePopup.data.alertLevelM.toFixed(2) }} m</div>
          <div>Cota Evacuación: {{ activePopup.data.evacLevelM.toFixed(2) }} m</div>
          <div>Tendencia: {{ activePopup.data.trendCmPerHour !== null ? `+${activePopup.data.trendCmPerHour} cm/h` : 'Estable' }}</div>
          <div>Actualizado: {{ formatTimeAgo(activePopup.data.updatedAt) }}</div>
        </div>
      </div>

      <!-- Detalle de Sensor Telemétrico -->
      <div v-else-if="activePopup?.type === 'sensor'" class="space-y-1 text-xs">
        <div class="font-mono font-bold text-[#4cd7f6]">{{ activePopup.data.code }} · {{ activePopup.data.name }}</div>
        <div class="text-[10px] text-[#bcc9cd]">Variable: {{ activePopup.data.variable }} ({{ activePopup.data.unit }})</div>
        <div class="text-[10px] text-[#869397] font-mono">Estado: {{ activePopup.data.status }} · Protocolo: {{ activePopup.data.protocol }}</div>
        <div class="text-[10px] text-[#869397] font-mono">Última lectura: {{ formatTimeAgo(activePopup.data.lastPayloadAt) }}</div>
      </div>
    </div>

    <!-- Barra de Control Superior: Capas y Vista -->
    <div class="absolute top-2 right-2 z-10 flex flex-wrap items-center gap-1.5 bg-[#070e1a]/90 backdrop-blur-md border border-[#3d494c]/50 rounded-lg p-1.5 shadow-lg">
      <!-- Selector de Tipo de Capa Base -->
      <div class="flex items-center bg-[#141c28] rounded border border-[#3d494c]/30 p-0.5 text-[10px] font-mono">
        <button
          type="button"
          :class="['px-2 py-1 rounded transition-colors', baseLayerType === 'dark' ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'text-[#869397] hover:text-[#dbe3f4]']"
          title="Vista Cartográfica Táctica Oscura"
          @click="switchBaseLayer('dark')"
        >
          Táctico
        </button>
        <button
          type="button"
          :class="['px-2 py-1 rounded transition-colors', baseLayerType === 'satellite' ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'text-[#869397] hover:text-[#dbe3f4]']"
          title="Vista Satelital Real de Alta Resolución (Esri)"
          @click="switchBaseLayer('satellite')"
        >
          Satélite
        </button>
        <button
          type="button"
          :class="['px-2 py-1 rounded transition-colors', baseLayerType === 'streets' ? 'bg-[#06b6d4] text-[#00424f] font-bold' : 'text-[#869397] hover:text-[#dbe3f4]']"
          title="Vista Cartográfica Estándar (OSM)"
          @click="switchBaseLayer('streets')"
        >
          Calles
        </button>
      </div>

      <!-- Botón Centrar Región -->
      <button
        type="button"
        class="bg-[#141c28] hover:bg-[#232a37] text-[#acedff] p-1.5 rounded border border-[#3d494c]/40 transition-colors"
        title="Centrar en Corrientes y Chaco"
        @click="centerOnRegion"
      >
        <span class="material-symbols-outlined text-[16px] block">crop_free</span>
      </button>

      <!-- Botón Mi Ubicación GPS -->
      <button
        type="button"
        class="bg-[#141c28] hover:bg-[#232a37] text-[#4cd7f6] p-1.5 rounded border border-[#3d494c]/40 transition-colors"
        title="Mi ubicación GPS actual"
        @click="useUserLocation"
      >
        <span class="material-symbols-outlined text-[16px] block">my_location</span>
      </button>
    </div>

    <!-- Indicador de modo selector -->
    <div v-if="pickerMode" class="absolute top-2 left-12 z-10 bg-[#070e1a]/90 backdrop-blur-md border border-[#4cd7f6]/50 rounded-lg px-2.5 py-1 text-xs text-[#4cd7f6] font-mono flex items-center gap-1.5 shadow-lg">
      <span class="material-symbols-outlined text-[16px] animate-pulse">touch_app</span>
      <span>Hacé clic en el mapa para fijar el punto geográfico exacto</span>
    </div>

    <!-- Filtros de Capas Flotantes Inferiores -->
    <div class="absolute bottom-2 left-2 z-10 flex flex-wrap gap-1.5 bg-[#070e1a]/90 backdrop-blur-md border border-[#3d494c]/50 rounded-lg p-1.5 text-[10px] font-mono shadow-lg">
      <!-- Toggle Incidentes -->
      <button
        type="button"
        :class="['flex items-center gap-1 px-2 py-1 rounded transition-colors border', showIncidents ? 'bg-[#a40217]/30 border-[#a40217] text-[#ffdad6]' : 'bg-[#141c28] border-transparent text-[#869397]']"
        @click="showIncidents = !showIncidents"
      >
        <span class="w-2 h-2 rounded-full bg-[#ffb3ad]"></span>
        <span>Incidentes ({{ incidents.length }})</span>
      </button>

      <!-- Toggle Puntos de Notificación (Reportes Ciudadanos) -->
      <button
        v-if="reports.length > 0"
        type="button"
        :class="['flex items-center gap-1 px-2 py-1 rounded transition-colors border', showReports ? 'bg-[#f48c24]/30 border-[#f48c24] text-[#ffdcc3]' : 'bg-[#141c28] border-transparent text-[#869397]']"
        @click="showReports = !showReports"
      >
        <span class="w-2 h-2 rounded-full bg-[#f48c24]"></span>
        <span>Puntos de notificación ({{ reports.length }})</span>
      </button>

      <!-- Toggle Estaciones -->
      <button
        v-if="stations.length > 0"
        type="button"
        :class="['flex items-center gap-1 px-2 py-1 rounded transition-colors border', showStations ? 'bg-[#00424f]/40 border-[#06b6d4] text-[#acedff]' : 'bg-[#141c28] border-transparent text-[#869397]']"
        @click="showStations = !showStations"
      >
        <span class="w-2 h-2 rounded-full bg-[#4cd7f6]"></span>
        <span>Ríos / Estaciones ({{ stations.length }})</span>
      </button>

      <!-- Toggle Sensores (Modo técnico) -->
      <button
        v-if="mode === 'tecnico' && sensors.length > 0"
        type="button"
        :class="['flex items-center gap-1 px-2 py-1 rounded transition-colors border', showSensors ? 'bg-[#232a37] border-[#4cd7f6] text-[#acedff]' : 'bg-[#141c28] border-transparent text-[#869397]']"
        @click="showSensors = !showSensors"
      >
        <span class="w-2 h-2 rounded-full bg-[#4cd7f6]"></span>
        <span>Sensores IoT ({{ sensors.length }})</span>
      </button>
    </div>
  </div>
</template>
