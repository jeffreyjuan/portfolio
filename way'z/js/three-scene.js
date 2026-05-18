/* ============================================
   WAY'Z — Three.js Hero Scene
   Particle field with glowing road effect
   ============================================ */

function initHeroScene() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 3, 8);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // --- Particle system ---
  const particleCount = 600;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  const purple = new THREE.Color(0x7B2FF2);
  const cyan = new THREE.Color(0x00D4FF);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

    const mix = Math.random();
    const color = purple.clone().lerp(cyan, mix);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = Math.random() * 3 + 1;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const particleMat = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // --- Glowing grid road ---
  const gridSize = 40;
  const gridDivisions = 40;
  const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x7B2FF2, 0x1a1a2e);
  gridHelper.position.y = -2;
  gridHelper.material.opacity = 0.15;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  // --- Glowing line (road center) ---
  const roadPoints = [];
  for (let i = -20; i <= 20; i += 0.5) {
    roadPoints.push(new THREE.Vector3(i, -1.98, Math.sin(i * 0.3) * 2));
  }
  const roadGeo = new THREE.BufferGeometry().setFromPoints(roadPoints);
  const roadMat = new THREE.LineBasicMaterial({ color: 0x00D4FF, transparent: true, opacity: 0.4 });
  const roadLine = new THREE.Line(roadGeo, roadMat);
  scene.add(roadLine);

  // --- Light orbs ---
  const orbGeo = new THREE.SphereGeometry(0.15, 16, 16);
  const orbs = [];
  for (let i = 0; i < 5; i++) {
    const color = i % 2 === 0 ? 0x7B2FF2 : 0x00D4FF;
    const orbMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 6);
    orb.userData = { speed: 0.3 + Math.random() * 0.5, offset: Math.random() * Math.PI * 2, radius: 2 + Math.random() * 3 };
    scene.add(orb);
    orbs.push(orb);
  }

  // --- Mouse tracking ---
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // --- Resize ---
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // --- Animate ---
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Rotate particles slowly
    particles.rotation.y = elapsed * 0.05;
    particles.rotation.x = Math.sin(elapsed * 0.1) * 0.05;

    // Animate particle positions (subtle drift)
    const pos = particleGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 1] += Math.sin(elapsed + i) * 0.001;
    }
    particleGeo.attributes.position.needsUpdate = true;

    // Animate orbs
    orbs.forEach((orb, i) => {
      const d = orb.userData;
      orb.position.x = Math.cos(elapsed * d.speed + d.offset) * d.radius;
      orb.position.y = Math.sin(elapsed * d.speed * 0.7 + d.offset) * 2;
      orb.position.z = Math.sin(elapsed * d.speed + d.offset) * d.radius;
    });

    // Mouse parallax on camera
    camera.position.x += (mouseX * 2 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 1 + 3 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    // Grid scroll effect
    gridHelper.position.z = (elapsed * 2) % (gridSize / gridDivisions);

    renderer.render(scene, camera);
  }

  animate();
}

// Init when Three.js is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initHeroScene, 100));
} else {
  setTimeout(initHeroScene, 100);
}
