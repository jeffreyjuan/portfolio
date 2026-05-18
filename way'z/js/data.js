/* ============================================
   WAY'Z — Persistent Data Layer (localStorage)
   Lebanese locations, users, rides, pricing
   ============================================ */

const DEFAULT_LOCATIONS = [
  { id: 'l1', name: 'Hamra', area: 'Beirut', lat: 33.8969, lng: 35.4840 },
  { id: 'l2', name: 'Achrafieh', area: 'Beirut', lat: 33.8886, lng: 35.5264 },
  { id: 'l6', name: 'Downtown Beirut', area: 'Beirut', lat: 33.8938, lng: 35.5018 },
  { id: 'l16', name: 'Rafic Hariri Airport', area: 'Beirut', lat: 33.8209, lng: 35.4884 }
];

const DEFAULT_DB = {
  locations: DEFAULT_LOCATIONS,
  vehicleTypes: [
    { id: 'economy', name: 'Economy', icon: '🚗', basePrice: 2.00, perKm: 0.50, perMin: 0.10 },
    { id: 'comfort', name: 'Comfort', icon: '🚙', basePrice: 3.00, perKm: 0.75, perMin: 0.15 },
    { id: 'premium', name: 'Premium', icon: '✨', basePrice: 5.00, perKm: 1.20, perMin: 0.25 },
    { id: 'xl', name: 'XL', icon: '🚐', basePrice: 4.00, perKm: 0.90, perMin: 0.18 },
  ],
  riders: [
    { id: 'r1', name: 'Karim Haddad', phone: '+961 71 123 456', email: 'karim@wayz.lb', rating: 4.8, rides: 47 }
  ],
  drivers: [
    { id: 'd1', name: 'Hassan Fawaz', phone: '+961 71 222 111', rating: 4.9, trips: 1243, vehicle: { make: 'Toyota', model: 'Corolla', plate: 'B 123456', color: 'Silver' }, type: 'economy', online: true, lat: 33.8950, lng: 35.5050, earnings: { today: 85, week: 520, month: 2180 } },
    { id: 'd2', name: 'Ali Mansour', phone: '+961 76 333 222', rating: 4.7, trips: 876, vehicle: { make: 'Hyundai', model: 'Tucson', plate: 'B 654321', color: 'Black' }, type: 'comfort', online: true, lat: 33.8900, lng: 35.4900, earnings: { today: 62, week: 410, month: 1890 } }
  ],
  rideHistory: [
    { id: 'ride1', riderId: 'r1', driverId: 'd1', from: 'l2', to: 'l6', type: 'economy', fare: 4.50, distance: 3.2, duration: 12, status: 'completed', rating: 5, date: '2026-05-06T14:30:00' }
  ],
  platformConfig: {
    commissionRate: 20,
    surgeMultiplier: 1.0,
    maintenanceMode: false
  }
};

const WZ_DATA = {
  // Load database from localStorage or initialize defaults
  init() {
    const stored = localStorage.getItem('wz_database');
    if (stored) {
      const parsed = JSON.parse(stored);
      this.locations = parsed.locations || DEFAULT_DB.locations;
      this.vehicleTypes = parsed.vehicleTypes || DEFAULT_DB.vehicleTypes;
      this.riders = parsed.riders || DEFAULT_DB.riders;
      this.drivers = parsed.drivers || DEFAULT_DB.drivers;
      this.rideHistory = parsed.rideHistory || DEFAULT_DB.rideHistory;
      this.platformConfig = parsed.platformConfig || DEFAULT_DB.platformConfig;
    } else {
      this.locations = DEFAULT_DB.locations;
      this.vehicleTypes = DEFAULT_DB.vehicleTypes;
      this.riders = DEFAULT_DB.riders;
      this.drivers = DEFAULT_DB.drivers;
      this.rideHistory = DEFAULT_DB.rideHistory;
      this.platformConfig = DEFAULT_DB.platformConfig;
      this.save();
    }
  },

  // Save current state to localStorage
  save() {
    const dbToSave = {
      locations: this.locations,
      vehicleTypes: this.vehicleTypes,
      riders: this.riders,
      drivers: this.drivers,
      rideHistory: this.rideHistory,
      platformConfig: this.platformConfig
    };
    localStorage.setItem('wz_database', JSON.stringify(dbToSave));
  },

  factoryReset() {
    localStorage.removeItem('wz_database');
    this.init();
  },

  calculateFare(distanceKm, durationMin, vehicleTypeId) {
    const vt = this.vehicleTypes.find(v => v.id === vehicleTypeId) || this.vehicleTypes[0];
    const fare = vt.basePrice + (distanceKm * vt.perKm) + (durationMin * vt.perMin);
    return Math.max(2, Math.round(fare * 100) / 100); // Minimum $2 fare
  },

  getLocation(id) {
    return this.locations.find(l => l.id === id);
  },

  getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  },
  
  generateEarnings(days = 7) {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      data.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        amount: Math.round((40 + Math.random() * 100) * 100) / 100,
      });
    }
    return data;
  }
};

WZ_DATA.init();
window.WZ_DATA = WZ_DATA; 