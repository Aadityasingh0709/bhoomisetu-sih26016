import { useEffect, useState, Fragment } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { statusMeta } from "../utils/status.js";
import StatusBadge from "./StatusBadge.jsx";
import ProgressBar from "./ProgressBar.jsx";
import { Layers, Maximize2, ExternalLink, MapPin } from "lucide-react";

// Inner component that updates the map view whenever the center/zoom props change.
function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export default function MapView({
  points = [],
  center = [22.9734, 78.6569],
  zoom = 5,
  height = "440px",
}) {
  const [mapType, setMapType] = useState("streets"); // "streets" | "satellite"
  const mapKey = `${center[0].toFixed(4)}-${center[1].toFixed(4)}-${zoom}-${mapType}`;

  const validPoints = points.filter((p) => p.lat != null && p.lng != null);

  const tileLayers = {
    streets: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    },
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-100 shadow-card bg-slate-900" style={{ height }}>
      {/* Top Map Controls Overlay */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        {/* Layer toggle button */}
        <div className="flex rounded-xl bg-white/95 p-1 shadow-lg backdrop-blur-md border border-ink-200/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMapType("streets")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors ${
              mapType === "streets"
                ? "bg-ink-900 text-white shadow-sm"
                : "text-ink-600 hover:text-ink-900"
            }`}
          >
            <Layers size={13} />
            <span>Street</span>
          </button>
          <button
            type="button"
            onClick={() => setMapType("satellite")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors ${
              mapType === "satellite"
                ? "bg-ink-900 text-white shadow-sm"
                : "text-ink-600 hover:text-ink-900"
            }`}
          >
            <Layers size={13} />
            <span>Satellite</span>
          </button>
        </div>
      </div>

      {/* Bottom GIS Status Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] hidden sm:flex items-center gap-3 rounded-xl bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-md border border-ink-100 text-[11px] font-medium text-ink-700">
        <span className="font-bold text-ink-900">GIS Parcels:</span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> On Track
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> At Risk
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-500" /> Delayed
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-600" /> Completed
        </span>
      </div>

      <MapContainer
        key={mapKey}
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution={tileLayers[mapType].attribution}
          url={tileLayers[mapType].url}
        />
        <RecenterMap center={center} zoom={zoom} />

        {validPoints.map((p) => {
          const meta = statusMeta(p.status);
          const isUrgent = p.status === "Delayed" || p.status === "AtRisk";

          return (
            <Fragment key={p.id}>
              {/* Outer halo for urgent items */}
              {isUrgent && (
                <CircleMarker
                  center={[p.lat, p.lng]}
                  radius={16}
                  pathOptions={{
                    color: meta.color,
                    fillColor: meta.color,
                    fillOpacity: 0.25,
                    weight: 1,
                  }}
                />
              )}

              {/* Core Marker */}
              <CircleMarker
                center={[p.lat, p.lng]}
                radius={9}
                pathOptions={{
                  color: "#ffffff",
                  fillColor: meta.color,
                  fillOpacity: 0.95,
                  weight: 2.5,
                }}
              >
                <Popup className="custom-gis-popup">
                  <div className="p-1 min-w-[200px] text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink-700">
                        {p.district}, {p.state}
                      </span>
                      <StatusBadge status={p.status} size="sm" pulse={false} />
                    </div>

                    <h4 className="mt-2 text-sm font-bold text-ink-900 line-clamp-2">
                      {p.name}
                    </h4>

                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-ink-600 mb-1">
                        <span>Overall Progress</span>
                        <span className="font-bold data-figure">{p.progress}%</span>
                      </div>
                      <ProgressBar value={p.progress} status={p.status} size="sm" />
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-2 text-xs">
                      <span className="text-[10px] font-mono text-ink-400">
                        {p.lat.toFixed(3)}°N, {p.lng.toFixed(3)}°E
                      </span>
                      <Link
                        to={`/projects/${p.id}`}
                        className="inline-flex items-center gap-1 font-bold text-ochre-600 hover:text-ochre-700 hover:underline"
                      >
                        Dossier <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}

