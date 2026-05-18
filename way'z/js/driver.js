/* ============================================
   WAY'Z — Driver Logic (Google Maps)
   Online/offline, ride requests, earnings, navigation
   ============================================ */

const WZ_DRIVER = {
  map: null,
  isOnline: false,
  currentDriver: null,
  rideRequest: null,
  activeRide: null,
  requestTimer: null,
  requestCountdown: 15,
  earningsChart: null,
  driverMarker: null,

  // --- Init Dashboard ---
  initDashboard() {
    this.currentDriver = WZ_DATA.drivers[0];
    WZ_APP.login('driver', 'd1');
    this.initMap();
    this.updateStats();
    this.setupOnlineToggle();
  },

  initMap() {
    if (!document.getElementById('driver-map') || typeof google === 'undefined') return;
    this.map = WZ_MAP.create('driver-map', {
      center: { lat: this.currentDriver.lat, lng: this.currentDriver.lng },
      zoom: 14,
    });

    // Driver position marker
    this.driverMarker = WZ_MAP.addEmojiMarker(this.map, { lat: this.currentDriver.lat, lng: this.currentDriver.lng }, '🚗', 40);

    // Demand dots
    this.addDemandMarkers();
  },

  addDemandMarkers() {
    if (!this.map) return;
    const base = this.currentDriver;
    for (let i = 0; i < 6; i++) {
      WZ_MAP.addEmojiMarker(this.map, {
        lat: base.lat + (Math.random() - 0.5) * 0.03,
        lng: base.lng + (Math.random() - 0.5) * 0.03
      }, '🟢', 14);
    }
  },

  setupOnlineToggle() {
    const btn = document.getElementById('online-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => this.toggleOnline());
  },

  toggleOnline() {
    this.isOnline = !this.isOnline;
    const btn = document.getElementById('online-toggle');
    if (!btn) return;
    btn.classList.toggle('online', this.isOnline);
    btn.classList.toggle('offline', !this.isOnline);
    btn.querySelector('.status-text').textContent = this.isOnline ? 'Online' : 'Offline';
    if (this.isOnline) {
      WZ_APP.showToast("You're now online! Waiting for rides...", 'success');
      this.startRideSimulation();
    } else {
      WZ_APP.showToast("You're now offline", 'info');
      this.stopRideSimulation();
    }
  },

  updateStats() {
    const driver = this.currentDriver;
    const el = (id) => document.getElementById(id);
    if (el('stat-earnings')) el('stat-earnings').textContent = '$' + driver.earnings.today;
    if (el('stat-trips')) el('stat-trips').textContent = Math.floor(Math.random() * 8 + 3);
    if (el('stat-rating')) el('stat-rating').textContent = driver.rating;
    if (el('stat-hours')) el('stat-hours').textContent = (Math.random() * 5 + 2).toFixed(1) + 'h';
  },

  // --- Ride Request Simulation ---
  rideSimInterval: null,

  startRideSimulation() {
    const delay = 5000 + Math.random() * 10000;
    this.rideSimInterval = setTimeout(() => {
      if (this.isOnline && !this.activeRide) this.showRideRequest();
    }, delay);
  },

  stopRideSimulation() {
    clearTimeout(this.rideSimInterval);
    this.hideRideRequest();
  },

  showRideRequest() {
    const pickup = WZ_DATA.locations[Math.floor(Math.random() * 10)];
    const dest = WZ_DATA.locations[Math.floor(Math.random() * 10 + 10)];
    const rider = WZ_DATA.riders[Math.floor(Math.random() * WZ_DATA.riders.length)];
    const dist = WZ_DATA.getDistance(pickup.lat, pickup.lng, dest.lat, dest.lng);
    const dur = Math.round(dist * 3.5 + 5);
    const fare = WZ_DATA.calculateFare(dist, dur, 'economy');
    this.rideRequest = { pickup, dest, rider, dist, dur, fare };

    const el = document.getElementById('ride-request');
    if (!el) return;
    el.querySelector('.rider-name').textContent = rider.name;
    el.querySelector('.rider-rating').textContent = '★ ' + rider.rating;
    el.querySelector('.rider-initials').textContent = WZ_APP.getInitials(rider.name);
    el.querySelector('.pickup-text').textContent = pickup.name + ', ' + pickup.area;
    el.querySelector('.dest-text').textContent = dest.name + ', ' + dest.area;
    el.querySelector('.fare-amount').textContent = '$' + fare.toFixed(2);
    el.querySelector('.fare-dist').textContent = dist.toFixed(1) + ' km';
    el.querySelector('.fare-dur').textContent = dur + ' min';
    el.classList.add('active');
    this.startRequestTimer();
  },

  hideRideRequest() {
    const el = document.getElementById('ride-request');
    if (el) el.classList.remove('active');
    clearInterval(this.requestTimer);
    this.requestCountdown = 15;
  },

  startRequestTimer() {
    this.requestCountdown = 15;
    const timerEl = document.querySelector('.timer-count');
    const circle = document.querySelector('.timer-circle-progress');
    const circumference = 2 * Math.PI * 20;
    if (circle) { circle.style.strokeDasharray = circumference; circle.style.strokeDashoffset = 0; }

    this.requestTimer = setInterval(() => {
      this.requestCountdown--;
      if (timerEl) timerEl.textContent = this.requestCountdown;
      if (circle) circle.style.strokeDashoffset = circumference * (1 - this.requestCountdown / 15);
      if (this.requestCountdown <= 0) { this.declineRide(); WZ_APP.showToast('Request expired', 'warning'); }
    }, 1000);
  },

  acceptRide() {
    this.hideRideRequest();
    this.activeRide = this.rideRequest;
    WZ_APP.showToast('Ride accepted! Navigate to pickup.', 'success');

    const panel = document.getElementById('active-ride-panel');
    if (panel) {
      panel.querySelector('.ride-pickup-text').textContent = this.activeRide.pickup.name;
      panel.querySelector('.ride-dest-text').textContent = this.activeRide.dest.name;
      panel.querySelector('.ride-fare-text').textContent = '$' + this.activeRide.fare.toFixed(2);
      panel.querySelector('.ride-rider-name').textContent = this.activeRide.rider.name;
      panel.style.display = 'block';
    }

    if (this.map) {
      const pickup = this.activeRide.pickup;
      const dest = this.activeRide.dest;
      WZ_MAP.addMarker(this.map, { lat: pickup.lat, lng: pickup.lng }, 'pickup');
      WZ_MAP.addMarker(this.map, { lat: dest.lat, lng: dest.lng }, 'destination');
      const ds = new google.maps.DirectionsService();
      const dr = new google.maps.DirectionsRenderer({
        map: this.map, suppressMarkers: true,
        polylineOptions: { strokeColor: '#7B2FF2', strokeWeight: 5, strokeOpacity: 0.9 }
      });
      ds.route({
        origin: { lat: this.currentDriver.lat, lng: this.currentDriver.lng },
        destination: { lat: dest.lat, lng: dest.lng },
        waypoints: [{ location: { lat: pickup.lat, lng: pickup.lng }, stopover: true }],
        travelMode: google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === 'OK') dr.setDirections(result);
      });
    }
  },

  declineRide() {
    this.hideRideRequest();
    this.rideRequest = null;
    if (this.isOnline) this.startRideSimulation();
  },

  completeRide() {
    WZ_APP.showToast('Trip completed! $' + this.activeRide.fare.toFixed(2) + ' earned.', 'success');
    this.activeRide = null;
    const panel = document.getElementById('active-ride-panel');
    if (panel) panel.style.display = 'none';
    this.updateStats();
    if (this.isOnline) this.startRideSimulation();
  },

  // --- Earnings Chart ---
  initEarnings() {
    this.currentDriver = WZ_DATA.drivers[0];
    WZ_APP.login('driver', 'd1');
    this.renderEarningsChart('week');
    this.renderTripList();
    this.updateEarningsSummary();
  },

  renderEarningsChart(period) {
    const canvas = document.getElementById('earnings-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    const data = WZ_DATA.generateEarnings(days);
    if (this.earningsChart) this.earningsChart.destroy();
    this.earningsChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map(d => d.date),
        datasets: [{ label: 'Earnings ($)', data: data.map(d => d.amount), backgroundColor: 'rgba(123,47,242,0.6)', borderColor: '#7B2FF2', borderWidth: 1, borderRadius: 6, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15,15,25,0.95)', borderColor: '#7B2FF2', borderWidth: 1, padding: 12, callbacks: { label: ctx => '$' + ctx.parsed.y.toFixed(2) } } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b6b80', callback: v => '$' + v } }, x: { grid: { display: false }, ticks: { color: '#6b6b80', maxRotation: 45 } } }
      }
    });
  },

  renderTripList() {
    const container = document.getElementById('trip-list');
    if (!container) return;
    const rides = WZ_DATA.rideHistory.filter(r => r.driverId === 'd1');
    container.innerHTML = rides.map(ride => {
      const from = WZ_DATA.getLocation(ride.from);
      const to = WZ_DATA.getLocation(ride.to);
      const date = new Date(ride.date);
      return `<div class="wz-trip-item anim-fade-in">
        <div class="trip-time">${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
        <div class="trip-route"><div>${from ? from.name : '—'} → ${to ? to.name : '—'}</div><div style="font-size:var(--wz-text-xs);color:var(--wz-text-muted);">${ride.distance} km · ${ride.duration} min</div></div>
        <div class="trip-earning">+$${ride.fare.toFixed(2)}</div>
      </div>`;
    }).join('');
  },

  updateEarningsSummary() {
    const driver = this.currentDriver;
    const el = (id) => document.getElementById(id);
    if (el('total-today')) WZ_APP.animateCounter(el('total-today'), driver.earnings.today);
    if (el('total-week')) WZ_APP.animateCounter(el('total-week'), driver.earnings.week);
    if (el('total-month')) WZ_APP.animateCounter(el('total-month'), driver.earnings.month);
    if (el('total-tips')) WZ_APP.animateCounter(el('total-tips'), Math.round(driver.earnings.week * 0.08));
  },

  switchPeriod(period) {
    document.querySelectorAll('.wz-period-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-period="${period}"]`).classList.add('active');
    this.renderEarningsChart(period);
  },

  // --- Navigation Mode ---
  initNavigation() {
    this.currentDriver = WZ_DATA.drivers[0];
    WZ_APP.login('driver', 'd1');
    this.initNavMap();
    this.simulateNavigation();
  },

  initNavMap() {
    if (!document.getElementById('nav-map') || typeof google === 'undefined') return;
    const pickup = WZ_DATA.getLocation('l2');
    const dest = WZ_DATA.getLocation('l6');

    this.map = WZ_MAP.create('nav-map', {
      center: { lat: pickup.lat, lng: pickup.lng },
      zoom: 14,
    });

    this.navDriverMarker = WZ_MAP.addEmojiMarker(this.map, { lat: pickup.lat, lng: pickup.lng }, '🚗', 40);
    WZ_MAP.addMarker(this.map, { lat: dest.lat, lng: dest.lng }, 'destination');

    const ds = new google.maps.DirectionsService();
    const dr = new google.maps.DirectionsRenderer({
      map: this.map, suppressMarkers: true,
      polylineOptions: { strokeColor: '#7B2FF2', strokeWeight: 5, strokeOpacity: 0.9 }
    });
    ds.route({
      origin: { lat: pickup.lat, lng: pickup.lng },
      destination: { lat: dest.lat, lng: dest.lng },
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') dr.setDirections(result);
    });
  },

  simulateNavigation() {
    let progress = 0;
    const meterEl = document.getElementById('nav-distance');
    const timeEl = document.getElementById('nav-time');
    const fareEl = document.getElementById('nav-fare');
    let dist = 3.2, dur = 12, fare = 4.50;
    const interval = setInterval(() => {
      progress += 2;
      if (meterEl) meterEl.textContent = (dist * (1 - progress / 100)).toFixed(1) + ' km';
      if (timeEl) timeEl.textContent = Math.max(0, Math.round(dur * (1 - progress / 100))) + ' min';
      if (fareEl) fareEl.textContent = '$' + (fare * (progress / 100 + 0.5)).toFixed(2);
      if (progress >= 100) { clearInterval(interval); WZ_APP.showToast('Destination reached!', 'success'); }
    }, 2000);
  },

  initProfile() {
    this.currentDriver = WZ_DATA.drivers[0];
    WZ_APP.login('driver', 'd1');
  }
};

window.WZ_DRIVER = WZ_DRIVER;
