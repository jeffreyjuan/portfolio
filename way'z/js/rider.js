/* ============================================
   WAY'Z — Dynamic Rider Logic (Google Maps)
   Exact locations, map drops, GPS tracking
   ============================================ */

const WZ_RIDER = {
  map: null,
  pickupMarker: null,
  destMarker: null,
  directionsRenderer: null,
  driverMarker: null,
  geocoder: null,
  selectedVehicle: 'economy',
  pickup: null,
  destination: null,
  rideState: 'idle',
  mapClickListener: null,
  activeTarget: 'pickup', // Tracks which input we are clicking the map for

  initDashboard() {
    this.initMap();
    this.initLocationInputs();
    this.initVehicleSelector();
    this.initRequestBtn();
  },

  initMap() {
    const mapEl = document.getElementById('rider-map');
    if (!mapEl || typeof google === 'undefined') return;

    this.map = WZ_MAP.create('rider-map', {
      center: WZ_MAP.defaultCenter,
      zoom: 14,
    });
    this.geocoder = new google.maps.Geocoder();
  },

  // Completely dynamic location inputs using ONLY Google Places
  initLocationInputs() {
    const pickupInput = document.getElementById('pickup-input');
    const destInput = document.getElementById('dest-input');
    if (!pickupInput || !destInput) return;

    // We removed the strict bounds so you can search worldwide if you want
    const pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput);
    const destAutocomplete = new google.maps.places.Autocomplete(destInput);

    const handlePlaceSelect = (autocomplete, type) => {
      const place = autocomplete.getPlace();
      if (!place.geometry) {
        WZ_APP.showToast('Please select a valid place from the dropdown', 'warning');
        return;
      }
      
      const loc = {
        id: `loc_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        name: place.name || place.formatted_address.split(',')[0],
        area: place.formatted_address,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      
      // Save it dynamically to the database so history works!
      WZ_DATA.locations.push(loc);
      WZ_DATA.save();

      if (type === 'pickup') this.pickup = loc;
      else this.destination = loc;

      this.setMapMarker(type, loc);
      this.updateFareEstimate();
    };

    pickupAutocomplete.addListener('place_changed', () => handlePlaceSelect(pickupAutocomplete, 'pickup'));
    destAutocomplete.addListener('place_changed', () => handlePlaceSelect(destAutocomplete, 'destination'));
    
    // Focus tracking to know which input to fill if they drop a pin
    pickupInput.addEventListener('focus', () => this.activeTarget = 'pickup');
    destInput.addEventListener('focus', () => this.activeTarget = 'destination');
  },

  // Get real user GPS location
  useCurrentLocation() {
    if (!navigator.geolocation) {
      WZ_APP.showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    WZ_APP.showToast('Locating your GPS...', 'info');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latLng = { lat: position.coords.latitude, lng: position.coords.longitude };
        this.reverseGeocodeAndSet(latLng, 'pickup');
        this.map.panTo(latLng);
        this.map.setZoom(16);
      },
      (error) => WZ_APP.showToast('Please allow location access to use this feature.', 'warning'),
      { enableHighAccuracy: true }
    );
  },

  // Allow tapping map to drop a pin
  enableMapClick() {
    WZ_APP.showToast(`Tap anywhere on the map to set your ${this.activeTarget}`, 'info');
    document.getElementById('rider-map').style.cursor = 'crosshair';
    
    if (this.mapClickListener) google.maps.event.removeListener(this.mapClickListener);
    
    this.mapClickListener = this.map.addListener('click', (e) => {
      const latLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      this.reverseGeocodeAndSet(latLng, this.activeTarget);
      
      // Clean up listener after one click
      google.maps.event.removeListener(this.mapClickListener);
      this.mapClickListener = null;
      document.getElementById('rider-map').style.cursor = '';
    });
  },

  // Turn coordinate into an address and save it
  reverseGeocodeAndSet(latLng, type) {
    this.geocoder.geocode({ location: latLng }, (results, status) => {
      let name = 'Dropped Pin';
      let area = 'Custom Location';
      
      if (status === 'OK' && results[0]) {
        // Grab the first part of the address as the name, the rest as area
        const parts = results[0].formatted_address.split(',');
        name = parts[0].trim();
        area = parts.slice(1).join(',').trim() || name;
      }
      
      const loc = {
        id: `loc_${Date.now()}`,
        name: name,
        area: area,
        lat: latLng.lat,
        lng: latLng.lng
      };

      // Save custom location to local storage
      WZ_DATA.locations.push(loc);
      WZ_DATA.save();

      // Update UI
      const input = document.getElementById(type === 'pickup' ? 'pickup-input' : 'dest-input');
      if (input) input.value = name;
      
      if (type === 'pickup') this.pickup = loc;
      else this.destination = loc;

      this.setMapMarker(type, loc);
      this.updateFareEstimate();
    });
  },

  setMapMarker(type, loc) {
    if (!this.map) return;
    const isPickup = type === 'pickup';
    const existing = isPickup ? this.pickupMarker : this.destMarker;
    if (existing) existing.setMap(null);

    const marker = WZ_MAP.addMarker(this.map, { lat: loc.lat, lng: loc.lng }, isPickup ? 'pickup' : 'destination');
    if (isPickup) this.pickupMarker = marker;
    else this.destMarker = marker;

    if (this.pickup && this.destination) {
      this.drawRoute();
      WZ_MAP.fitToPoints(this.map, [
        { lat: this.pickup.lat, lng: this.pickup.lng },
        { lat: this.destination.lat, lng: this.destination.lng }
      ], 80);
    } else {
      this.map.panTo({ lat: loc.lat, lng: loc.lng });
      this.map.setZoom(15);
    }
  },

  drawRoute() {
    if (this.directionsRenderer) this.directionsRenderer.setMap(null);
    if (!this.pickup || !this.destination || !this.map) return;
    const p = this.pickup, d = this.destination;
    const ds = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      map: this.map, suppressMarkers: true,
      polylineOptions: { strokeColor: '#7B2FF2', strokeWeight: 5, strokeOpacity: 0.9 }
    });
    ds.route({
      origin: { lat: p.lat, lng: p.lng },
      destination: { lat: d.lat, lng: d.lng },
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') {
        this.directionsRenderer.setDirections(result);
        
        // Use real route distance/duration for exact pricing instead of haversine estimate!
        const leg = result.routes[0].legs[0];
        const exactDistKm = leg.distance.value / 1000;
        const exactDurMin = Math.round(leg.duration.value / 60);
        
        this.updateExactFare(exactDistKm, exactDurMin);
      }
    });
  },

  initVehicleSelector() {
    document.querySelectorAll('.wz-vehicle-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.wz-vehicle-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        this.selectedVehicle = opt.dataset.type;
        this.updateFareEstimate(); // Refresh if distances are already calculated
      });
    });
  },

  updateFareEstimate() {
    // Basic straight-line estimate until drawRoute calculates exact roads
    if (!this.pickup || !this.destination) return;
    const dist = WZ_DATA.getDistance(this.pickup.lat, this.pickup.lng, this.destination.lat, this.destination.lng);
    const duration = Math.round(dist * 3.5 + 5);
    this.updateExactFare(dist, duration);
  },

  updateExactFare(dist, duration) {
    // Updates all cars dynamically
    WZ_DATA.vehicleTypes.forEach(v => {
      const priceEl = document.getElementById('price-' + v.id);
      if (priceEl) priceEl.textContent = '$' + WZ_DATA.calculateFare(dist, duration, v.id).toFixed(2);
    });

    const fareEl = document.getElementById('fare-amount');
    const distEl = document.getElementById('fare-distance');
    const timeEl = document.getElementById('fare-time');
    
    if (fareEl) fareEl.textContent = '$' + WZ_DATA.calculateFare(dist, duration, this.selectedVehicle).toFixed(2);
    if (distEl) distEl.textContent = dist.toFixed(1) + ' km';
    if (timeEl) timeEl.textContent = duration + ' min';
  },

  initRequestBtn() {
    const btn = document.getElementById('request-ride-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!this.pickup || !this.destination) {
        WZ_APP.showToast('Please set an exact pickup and destination', 'warning');
        return;
      }
      this.startSearching();
    });
  },

  startSearching() {
    this.rideState = 'searching';
    const panel = document.getElementById('booking-panel');
    const searchOverlay = document.getElementById('searching-overlay');
    if (panel) panel.style.display = 'none';
    if (searchOverlay) searchOverlay.style.display = 'flex';
    setTimeout(() => this.driverFound(), 3000);
  },

  driverFound() {
    this.rideState = 'matched';
    const searchOverlay = document.getElementById('searching-overlay');
    const driverCard = document.getElementById('driver-card');
    if (searchOverlay) searchOverlay.style.display = 'none';
    if (driverCard) driverCard.style.display = 'block';

    const driver = WZ_DATA.drivers.find(d => d.online && d.type === this.selectedVehicle) || WZ_DATA.drivers[0];

    const nameEl = driverCard.querySelector('.driver-name');
    const ratingEl = driverCard.querySelector('.driver-rating');
    const vehicleEl = driverCard.querySelector('.driver-vehicle');
    const avatarEl = driverCard.querySelector('.wz-avatar');
    
    if (nameEl) nameEl.textContent = driver.name;
    if (ratingEl) ratingEl.textContent = '★ ' + driver.rating;
    if (vehicleEl) vehicleEl.textContent = `${driver.vehicle.color} ${driver.vehicle.make} ${driver.vehicle.model} · ${driver.vehicle.plate}`;
    if (avatarEl) avatarEl.textContent = WZ_APP.getInitials(driver.name);

    WZ_APP.showToast('Driver found! ' + driver.name + ' is on the way.', 'success');

    // Spawn driver marker dynamically near the user's custom pickup!
    if (this.map && this.pickup) {
      const spawnLat = this.pickup.lat + (Math.random() - 0.5) * 0.01;
      const spawnLng = this.pickup.lng + (Math.random() - 0.5) * 0.01;
      this.driverMarker = WZ_MAP.addEmojiMarker(this.map, { lat: spawnLat, lng: spawnLng }, '🚕', 36);
    }
  },

  cancelRide() {
    this.rideState = 'idle';
    const searchOverlay = document.getElementById('searching-overlay');
    const driverCard = document.getElementById('driver-card');
    const panel = document.getElementById('booking-panel');
    if (searchOverlay) searchOverlay.style.display = 'none';
    if (driverCard) driverCard.style.display = 'none';
    if (panel) panel.style.display = 'block';
    if (this.driverMarker) {
      this.driverMarker.setMap(null);
      this.driverMarker = null;
    }
    WZ_APP.showToast('Ride cancelled', 'info');
  }
};

window.WZ_RIDER = WZ_RIDER; 