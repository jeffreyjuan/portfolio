/* ============================================
   WAY'Z — Admin Dashboard Logic
   Charts, data tables, real-time simulation
   ============================================ */

const WZ_ADMIN = {
  revenueChart: null,
  ridesChart: null,

  init() {
    WZ_APP.login('admin', 'admin1');
    this.animateKPIs();
    this.renderRevenueChart();
    this.renderActivityFeed();
    this.initLiveUpdates();
  },

  animateKPIs() {
    const stats = WZ_DATA.platformStats;
    const kpis = [
      { id: 'kpi-riders', val: stats.totalRiders },
      { id: 'kpi-drivers', val: stats.totalDrivers },
      { id: 'kpi-rides', val: stats.totalRides },
      { id: 'kpi-revenue', val: stats.revenue },
      { id: 'kpi-active', val: stats.activeDriversNow },
      { id: 'kpi-inprogress', val: stats.ridesInProgress },
    ];
    kpis.forEach(k => {
      const el = document.getElementById(k.id);
      if (el) WZ_APP.animateCounter(el, k.val);
    });
  },

  renderRevenueChart() {
    const canvas = document.getElementById('revenue-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    const data = WZ_DATA.generateEarnings(14);

    this.revenueChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [{
          label: 'Revenue',
          data: data.map(d => d.amount * 15),
          borderColor: '#7B2FF2',
          backgroundColor: 'rgba(123,47,242,0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#7B2FF2',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15,15,25,0.95)',
            borderColor: '#7B2FF2',
            borderWidth: 1,
            padding: 12,
            callbacks: { label: ctx => '$' + ctx.parsed.y.toFixed(0) }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#6b6b80', callback: v => '$' + (v/1000).toFixed(0) + 'k' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#6b6b80', maxRotation: 45 }
          }
        }
      }
    });
  },

  renderActivityFeed() {
    const container = document.getElementById('activity-feed');
    if (!container) return;
    const activities = [
      { icon: '🚗', text: 'New ride completed: Achrafieh → Downtown', time: '2 min ago' },
      { icon: '👤', text: 'New rider registered: Ahmad Nassif', time: '5 min ago' },
      { icon: '🚘', text: 'Driver Georges Hanna went online', time: '8 min ago' },
      { icon: '⭐', text: 'Driver Hassan Fawaz received 5-star rating', time: '12 min ago' },
      { icon: '💰', text: 'Payout processed: $520 to Ali Mansour', time: '15 min ago' },
      { icon: '📋', text: 'New driver application: Samir Khalil', time: '20 min ago' },
      { icon: '🚗', text: 'Ride cancelled by rider in Hamra', time: '25 min ago' },
      { icon: '🛡️', text: 'Document verified: Youssef Bazzi insurance', time: '30 min ago' },
    ];
    container.innerHTML = activities.map(a => `
      <div class="wz-activity-item">
        <div class="act-icon">${a.icon}</div>
        <div style="flex:1;"><div>${a.text}</div><div class="act-time">${a.time}</div></div>
      </div>`).join('');
  },

  initLiveUpdates() {
    setInterval(() => {
      const el = document.getElementById('kpi-inprogress');
      if (el) el.textContent = WZ_APP.randomBetween(75, 105);
      const el2 = document.getElementById('kpi-active');
      if (el2) el2.textContent = WZ_APP.randomBetween(320, 380);
    }, 5000);
  },

  // --- Users Page ---
  initUsers() {
    WZ_APP.login('admin', 'admin1');
    this.renderUsersTable();
  },

  renderUsersTable() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    const users = [...WZ_DATA.riders, ...WZ_DATA.riders.map(r => ({...r, id: r.id+'b', name: r.name.split(' ').reverse().join(' ')}))];
    tbody.innerHTML = users.map((u, i) => `
      <tr>
        <td><div class="user-cell"><div class="wz-avatar" style="width:32px;height:32px;font-size:11px;">${WZ_APP.getInitials(u.name)}</div><div><div style="font-weight:500;">${u.name}</div><div style="font-size:var(--wz-text-xs);color:var(--wz-text-muted);">${u.email||''}</div></div></div></td>
        <td>${u.phone||'—'}</td>
        <td>${u.rides||0} rides</td>
        <td>★ ${u.rating||'—'}</td>
        <td><span class="wz-badge ${i<4?'active':'pending'}">${i<4?'Active':'New'}</span></td>
        <td><button class="wz-btn wz-btn-ghost" style="font-size:var(--wz-text-xs);padding:var(--wz-space-1) var(--wz-space-2);" onclick="WZ_APP.showToast('User details coming soon','info')">View</button></td>
      </tr>`).join('');
  },

  // --- Drivers Page ---
  initDrivers() {
    WZ_APP.login('admin', 'admin1');
    this.renderDriversTable();
  },

  renderDriversTable() {
    const tbody = document.getElementById('drivers-tbody');
    if (!tbody) return;
    tbody.innerHTML = WZ_DATA.drivers.map(d => `
      <tr>
        <td><div class="user-cell"><div class="wz-avatar" style="width:32px;height:32px;font-size:11px;">${WZ_APP.getInitials(d.name)}</div><div><div style="font-weight:500;">${d.name}</div><div style="font-size:var(--wz-text-xs);color:var(--wz-text-muted);">${d.vehicle.make} ${d.vehicle.model}</div></div></div></td>
        <td>${d.phone}</td>
        <td>${d.trips} trips</td>
        <td>★ ${d.rating}</td>
        <td><span class="wz-badge ${d.online?'online':'offline'}">${d.online?'Online':'Offline'}</span></td>
        <td>$${d.earnings.month.toLocaleString()}</td>
        <td><button class="wz-btn wz-btn-ghost" style="font-size:var(--wz-text-xs);padding:var(--wz-space-1) var(--wz-space-2);" onclick="WZ_APP.showToast('Driver details coming soon','info')">View</button></td>
      </tr>`).join('');
  },

  // --- Rides Page ---
  initRides() {
    WZ_APP.login('admin', 'admin1');
    this.renderRidesTable();
  },

  renderRidesTable() {
    const tbody = document.getElementById('rides-tbody');
    if (!tbody) return;
    tbody.innerHTML = WZ_DATA.rideHistory.map(ride => {
      const from = WZ_DATA.getLocation(ride.from);
      const to = WZ_DATA.getLocation(ride.to);
      const rider = WZ_DATA.riders.find(r => r.id === ride.riderId);
      const driver = WZ_DATA.drivers.find(d => d.id === ride.driverId);
      const date = new Date(ride.date);
      return `
        <tr>
          <td style="font-family:monospace;font-size:var(--wz-text-xs);color:var(--wz-text-muted);">${ride.id}</td>
          <td>${rider?rider.name:'—'}</td>
          <td>${driver?driver.name:'—'}</td>
          <td style="font-size:var(--wz-text-xs);">${from?from.name:'—'} → ${to?to.name:'—'}</td>
          <td>$${ride.fare.toFixed(2)}</td>
          <td><span class="wz-badge active">${ride.status}</span></td>
          <td style="font-size:var(--wz-text-xs);color:var(--wz-text-muted);">${date.toLocaleDateString()}</td>
        </tr>`;
    }).join('');
  },

  // --- Settings Page ---
  initSettings() {
    WZ_APP.login('admin', 'admin1');
  }
};

window.WZ_ADMIN = WZ_ADMIN;
