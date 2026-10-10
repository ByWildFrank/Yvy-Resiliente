/**
 * Proyección lat/lng → coordenadas del visor SVG.
 * El visor es un ESQUEMA cartográfico regional (no un mapa real):
 * sirve para situar entidades con proporciones aproximadas.
 */
import { appConfig } from '@/config/appConfig';
import type { GeoLocation } from '@/types/domain';

export function project(loc: GeoLocation): { x: number; y: number } {
  const { minLat, maxLat, minLng, maxLng } = appConfig.map.bounds;
  const { w, h } = appConfig.map.viewBox;
  const x = ((loc.lng - minLng) / (maxLng - minLng)) * w;
  const y = ((maxLat - loc.lat) / (maxLat - minLat)) * h;
  return { x: Math.max(4, Math.min(w - 4, x)), y: Math.max(4, Math.min(h - 4, y)) };
}
