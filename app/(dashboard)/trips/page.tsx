// ============================================================
// Trip Dispatcher — Page Stub
// Frontend team: Build trip table, creation form, timeline, capacity meter
// API: GET/POST /api/trips, GET/PUT /api/trips/[id]
//      GET /api/vehicles?status=available (for vehicle selector)
//      GET /api/drivers?status=available (for driver selector)
// ============================================================

export default function TripsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Trip Dispatcher</h1>
      <p className="text-gray-400">
        TODO: Add TripTable, TripCreateForm (vehicle + driver selectors), TripTimeline,
        CapacityMeter. Show validation errors from the API inline.
      </p>
      <p className="text-gray-500 text-sm mt-2">
        API endpoints: GET/POST /api/trips, GET/PUT /api/trips/[id]
      </p>
    </div>
  );
}
