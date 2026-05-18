/* ============================================
   WAY'Z — Google Maps Integration
   Shared map utilities for Lebanon
   ============================================ */

const WZ_MAP = {
  // Default center: Beirut
  defaultCenter: { lat: 33.8938, lng: 35.5018 },
  defaultZoom: 13,

  // Dark map style
  darkStyle: [
    { elementType: 'geometry', stylers: [{ color: '#0a0a0f' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0f' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#6b6b80' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#12121f' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#5a5a70' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0d1a0d' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#22223a' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a1a4e' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#3a2a5e' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#151525' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050510' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3a3a50' }] },
  ],

  // Light map style
  lightStyle: [
    { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#e0e0e0' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#d0d0d0' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#c0c0c0' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#f2f2f2' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  ],

  // Create map instance
  create(containerId, options = {}) {
    const center = options.center || this.defaultCenter;
    const zoom = options.zoom || this.defaultZoom;
    const mapEl = document.getElementById(containerId);
    if (!mapEl) return null;

    const isLight = document.body.classList.contains('theme-light');
    const map = new google.maps.Map(mapEl, {
      center: center,
      zoom: zoom,
      styles: isLight ? this.lightStyle : this.darkStyle,
      disableDefaultUI: true,
      zoomControl: options.zoomControl !== false,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_TOP },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: 'greedy',
      ...options
    });
    return map;
  },

  // Custom SVG marker icons
  markerSVG: {
    driver: {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
      fillColor: '#7B2FF2',
      fillOpacity: 1,
      strokeColor: '#9D5CFF',
      strokeWeight: 2,
      scale: 1.5,
      anchor: { x: 12, y: 22 },
    },
    pickup: {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
      fillColor: '#00E676',
      fillOpacity: 1,
      strokeColor: '#fff',
      strokeWeight: 2,
      scale: 1.5,
      anchor: { x: 12, y: 22 },
    },
    destination: {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
      fillColor: '#FF5252',
      fillOpacity: 1,
      strokeColor: '#fff',
      strokeWeight: 2,
      scale: 1.5,
      anchor: { x: 12, y: 22 },
    },
  },

  // Add marker to map
  addMarker(map, position, type = 'driver', label = '') {
    const svgDef = this.markerSVG[type] || this.markerSVG.driver;
    const icon = {
      path: svgDef.path,
      fillColor: svgDef.fillColor,
      fillOpacity: svgDef.fillOpacity,
      strokeColor: svgDef.strokeColor,
      strokeWeight: svgDef.strokeWeight,
      scale: svgDef.scale,
      anchor: new google.maps.Point(svgDef.anchor.x, svgDef.anchor.y),
    };
    return new google.maps.Marker({
      position: position,
      map: map,
      icon: icon,
      label: label ? { text: label, color: '#fff', fontSize: '11px', fontWeight: '700' } : undefined,
      animation: google.maps.Animation.DROP,
    });
  },

  // Add custom HTML overlay marker (emoji style)
  addEmojiMarker(map, position, emoji = '🚗', size = 36) {
    const marker = new google.maps.Marker({
      position: position,
      map: map,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${size * 0.7}">${emoji}</text></svg>`)}`,
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(size / 2, size / 2),
      }
    });
    return marker;
  },

  // Draw route polyline
  drawRoute(map, pathCoords, options = {}) {
    const path = pathCoords.map(p => Array.isArray(p) ? { lat: p[0], lng: p[1] } : p);
    return new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: options.color || '#7B2FF2',
      strokeOpacity: options.opacity || 0.9,
      strokeWeight: options.weight || 4,
      map: map,
    });
  },

  // Fit map bounds to points
  fitToPoints(map, points, padding = 60) {
    const bounds = new google.maps.LatLngBounds();
    points.forEach(p => {
      if (Array.isArray(p)) bounds.extend({ lat: p[0], lng: p[1] });
      else bounds.extend(p);
    });
    map.fitBounds(bounds, padding);
  },

  // Generate curved route between two points
  generateRouteCurve(start, end, numPoints = 5) {
    const points = [start];
    for (let i = 1; i < numPoints - 1; i++) {
      const t = i / (numPoints - 1);
      const lat = start.lat + (end.lat - start.lat) * t + (Math.random() - 0.5) * 0.005;
      const lng = start.lng + (end.lng - start.lng) * t + (Math.random() - 0.5) * 0.005;
      points.push({ lat, lng });
    }
    points.push(end);
    return points;
  },

  // Add nearby driver markers (demand simulation)
  addNearbyDrivers(map, center, count = 5) {
    const markers = [];
    for (let i = 0; i < count; i++) {
      const pos = {
        lat: center.lat + (Math.random() - 0.5) * 0.025,
        lng: center.lng + (Math.random() - 0.5) * 0.025,
      };
      markers.push(this.addEmojiMarker(map, pos, '🚗', 32));
    }
    return markers;
  },

  // Directions service helper
  getDirections(origin, destination, callback) {
    const service = new google.maps.DirectionsService();
    const renderer = new google.maps.DirectionsRenderer({
      polylineOptions: { strokeColor: '#7B2FF2', strokeWeight: 5, strokeOpacity: 0.9 },
      suppressMarkers: true,
    });
    service.route({
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') callback(result, renderer);
      else console.warn('Directions request failed:', status);
    });
  }
};

window.WZ_MAP = WZ_MAP;
