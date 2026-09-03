import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { statusMeta } from "../utils/status.js";

// Reusable GIS map for plotting geo-tagged land parcels / projects.
// Used on both the national dashboard and individual project pages,
// satisfying PS 26016's "geo-tagging of acquired land parcels using
// GIS technology" requirement.
export default function MapView({ points = [], center = [22.9734, 78.6569], zoom = 5, height = "420px" }) {
  return (
    <div style={{ height }} className="overflow-hidden rounded-lg">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points
          .filter((p) => p.lat != null && p.lng != null)
          .map((p) => {
            const meta = statusMeta(p.status);
            return (
              <CircleMarker
                key={p.id}
                center={[p.lat, p.lng]}
                radius={9}
                pathOptions={{ color: meta.color, fillColor: meta.color, fillOpacity: 0.75, weight: 2 }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-ink-300">
                      {p.district}, {p.state}
                    </p>
                    <p className="mt-1">
                      {meta.label} · {p.progress}% complete
                    </p>
                    <Link to={`/projects/${p.id}`} className="mt-1 inline-block text-ochre-600 underline">
                      View project →
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>
    </div>
  );
}
