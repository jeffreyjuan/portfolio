    // =========================================
    // 1. SCÈNE 3D — MORPHING BLOB + PARTICLES
    // =========================================
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('webgl-canvas'), alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    camera.position.z = 28;

    const mouse3D = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const heroHeading = document.querySelector('.hero-text h1');
    const heroMotion = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const clock = new THREE.Clock();

    // --- ORBIT CAMERA ---
    const orbit = {
      radius: 28,
      theta: 0,        // horizontal angle (radians)
      phi: Math.PI / 2, // vertical angle (radians)
      targetTheta: 0,
      targetPhi: Math.PI / 2,
      autoTheta: 0      // slow auto-drift
    };

    // --- SIMPLEX NOISE GLSL ---
    const noiseGLSL = `
      vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
      vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
      float snoise(vec3 v){
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod(i, 289.0);
        vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 1.0/7.0;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }
    `;

    // --- BLOB VERTEX SHADER ---
    const blobVertexShader = `
      ${noiseGLSL}
      uniform float uTime;
      uniform float uMouseX;
      uniform float uMouseY;
      varying vec3 vNormal;
      varying float vDisplacement;
      varying vec3 vWorldPos;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        float noise = snoise(position * 0.3 + uTime * 0.12) * 2.5;
        noise += snoise(position * 0.6 + uTime * 0.08) * 1.2;
        noise += snoise(position * 1.2 + uTime * 0.18) * 0.5;
        noise += snoise(position * 0.4 + vec3(uMouseX, uMouseY, 0.0) * 2.0) * 1.0;
        vDisplacement = noise;
        vec3 newPos = position + normal * noise;
        vWorldPos = (modelMatrix * vec4(newPos, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
      }
    `;

    // --- BLOB FRAGMENT SHADER ---
    const blobFragmentShader = `
      uniform float uTime;
      uniform vec3 uAccent;
      varying vec3 vNormal;
      varying float vDisplacement;
      varying vec3 vWorldPos;

      void main() {
        vec3 accent = uAccent;
        vec3 deepAccent = accent * 0.6;
        vec3 dark = vec3(0.02, 0.02, 0.02);
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
        vec3 color = mix(dark, mix(deepAccent, accent, fresnel), fresnel * 0.85);
        color += accent * vDisplacement * 0.06;
        color += accent * fresnel * (0.3 + 0.1 * sin(uTime * 0.5));
        float alpha = 0.12 + fresnel * 0.45;
        gl_FragColor = vec4(color, alpha);
      }
    `;

    // --- WIREFRAME FRAGMENT SHADER ---
    const wireFragmentShader = `
      uniform float uTime;
      uniform vec3 uAccent;
      varying vec3 vNormal;
      varying float vDisplacement;
      varying vec3 vWorldPos;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);
        float alpha = 0.03 + fresnel * 0.18;
        gl_FragColor = vec4(uAccent, alpha);
      }
    `;

    // --- CREATE MORPHING BLOB ---
    const blobGeo = new THREE.IcosahedronGeometry(10, 5);
    const blobMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uMouseX: { value: 0 }, uMouseY: { value: 0 }, uAccent: { value: new THREE.Color(0xff4d00) } },
      vertexShader: blobVertexShader,
      fragmentShader: blobFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const blob = new THREE.Mesh(blobGeo, blobMat);
    scene.add(blob);

    // --- WIREFRAME OVERLAY ---
    const wireGeo = new THREE.IcosahedronGeometry(10, 3);
    const wireMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uMouseX: { value: 0 }, uMouseY: { value: 0 }, uAccent: { value: new THREE.Color(0xff4d00) } },
      vertexShader: blobVertexShader,
      fragmentShader: wireFragmentShader,
      transparent: true,
      wireframe: true,
      depthWrite: false
    });
    const wireBlob = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireBlob);

    // --- FLOATING PARTICLES + RIPPLE SYSTEM ---
    const MAX_RIPPLES = 5;
    const ripples = [];  // { x, y, z, time }
    const ripplePositions = new Float32Array(MAX_RIPPLES * 3);
    const rippleTimes = new Float32Array(MAX_RIPPLES);
    // Init with inactive ripples
    for (let i = 0; i < MAX_RIPPLES; i++) rippleTimes[i] = -999.0;

    const pCount = 1500;
    const pPositions = new Float32Array(pCount * 3);
    const pSizes = new Float32Array(pCount);
    for (let i = 0; i < pCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 15 + Math.random() * 45;
      pPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPositions[i * 3 + 2] = r * Math.cos(phi);
      pSizes[i] = Math.random() * 2.5 + 0.5;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1));

    const pMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xff4d00) },
        uRipplePositions: { value: ripplePositions },
        uRippleTimes: { value: rippleTimes },
        uCurrentTime: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        uniform float uTime;
        uniform float uCurrentTime;
        uniform vec3 uRipplePositions[${MAX_RIPPLES}];
        uniform float uRippleTimes[${MAX_RIPPLES}];
        varying float vAlpha;
        varying float vRippleBoost;

        void main() {
          vec3 pos = position;
          pos.x += sin(uTime * 0.3 + position.y * 0.1) * 0.5;
          pos.y += cos(uTime * 0.2 + position.z * 0.1) * 0.5;
          pos.z += sin(uTime * 0.25 + position.x * 0.1) * 0.5;

          // --- Ripple displacement ---
          float rippleBrightness = 0.0;
          for (int i = 0; i < ${MAX_RIPPLES}; i++) {
            float age = uCurrentTime - uRippleTimes[i];
            if (age < 0.0 || age > 3.0) continue;

            vec3 rippleCenter = uRipplePositions[i];
            float dist = distance(pos, rippleCenter);
            float waveRadius = age * 25.0;
            float waveWidth = 8.0;
            float waveFront = smoothstep(waveRadius - waveWidth, waveRadius, dist)
                            * smoothstep(waveRadius + waveWidth, waveRadius, dist);
            float fade = 1.0 - smoothstep(0.0, 3.0, age);
            float wave = sin(dist * 0.5 - age * 8.0) * waveFront * fade;

            vec3 dir = normalize(pos - rippleCenter + vec3(0.001));
            pos += dir * wave * 4.0;
            rippleBrightness += waveFront * fade * 0.8;
          }

          vRippleBoost = rippleBrightness;
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          float dist = length(mv.xyz);
          vAlpha = smoothstep(70.0, 10.0, dist) * 0.5;
          gl_PointSize = size * (200.0 / -mv.z) * (1.0 + rippleBrightness * 1.5);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        varying float vRippleBoost;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float glow = smoothstep(0.5, 0.0, d);
          vec3 color = uColor + vec3(0.3, 0.2, 0.0) * vRippleBoost;
          float alpha = (vAlpha + vRippleBoost * 0.4) * glow;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // --- SCROLL COLOR ENGINE ---
    function hslToRgb(h, s, l) {
      h /= 360;
      let r, g, b;
      if (s === 0) { r = g = b = l; } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1; if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      return { r, g, b };
    }

    const orangeRGB = { r: 255, g: 77, b: 0 };
    const blackRGB = { r: 10, g: 10, b: 10 };
    let accentColor = { r: 1, g: 0.3, b: 0 }; // starting orange

    // --- ANIMATION LOOP ---
    function animate3D() {
      requestAnimationFrame(animate3D);
      const t = clock.getElapsedTime();

      mouse3D.x += (mouse3D.targetX - mouse3D.x) * 0.05;
      mouse3D.y += (mouse3D.targetY - mouse3D.y) * 0.05;

      blobMat.uniforms.uTime.value = t;
      blobMat.uniforms.uMouseX.value = mouse3D.x;
      blobMat.uniforms.uMouseY.value = mouse3D.y;
      wireMat.uniforms.uTime.value = t;
      wireMat.uniforms.uMouseX.value = mouse3D.x;
      wireMat.uniforms.uMouseY.value = mouse3D.y;
      pMat.uniforms.uTime.value = t;
      pMat.uniforms.uCurrentTime.value = t;

      // --- SCROLL-DRIVEN ACCENT ---
      const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = scrollMax > 0 ? window.scrollY / scrollMax : 0;
      accentColor = { r: 1, g: 77 / 255, b: 0 };

      blobMat.uniforms.uAccent.value.setRGB(accentColor.r, accentColor.g, accentColor.b);
      wireMat.uniforms.uAccent.value.setRGB(accentColor.r, accentColor.g, accentColor.b);
      pMat.uniforms.uColor.value.setRGB(accentColor.r, accentColor.g, accentColor.b);

      document.documentElement.style.setProperty('--accent', `rgb(255, 77, 0)`);

      // Update ripple uniforms
      for (let i = 0; i < MAX_RIPPLES; i++) {
        if (ripples[i]) {
          ripplePositions[i * 3]     = ripples[i].x;
          ripplePositions[i * 3 + 1] = ripples[i].y;
          ripplePositions[i * 3 + 2] = ripples[i].z;
          rippleTimes[i] = ripples[i].time;
        }
      }
      pMat.uniforms.uRipplePositions.value = ripplePositions;
      pMat.uniforms.uRippleTimes.value = rippleTimes;

      // --- ORBIT CAMERA ---
      orbit.autoTheta += 0.002; // slow auto-drift
      orbit.targetTheta = orbit.autoTheta + mouse3D.x * Math.PI * 0.6;
      orbit.targetPhi = Math.PI / 2 - mouse3D.y * Math.PI * 0.3;
      orbit.targetPhi = Math.max(0.3, Math.min(Math.PI - 0.3, orbit.targetPhi));

      orbit.theta += (orbit.targetTheta - orbit.theta) * 0.04;
      orbit.phi += (orbit.targetPhi - orbit.phi) * 0.04;

      camera.position.x = orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta);
      camera.position.y = orbit.radius * Math.cos(orbit.phi);
      camera.position.z = orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta);
      camera.lookAt(0, 0, 0);

      // Subtle blob self-rotation
      blob.rotation.x = t * 0.03;
      blob.rotation.y = t * 0.04;
      wireBlob.rotation.copy(blob.rotation);

      renderer.render(scene, camera);
    }
    animate3D();

    document.addEventListener('mousemove', (e) => {
      mouse3D.targetX = (e.clientX / window.innerWidth) - 0.5;
      mouse3D.targetY = (e.clientY / window.innerHeight) - 0.5;
    });

    // --- CLICK RIPPLE ---
    let rippleIndex = 0;
    const raycaster = new THREE.Raycaster();
    const clickNDC = new THREE.Vector2();
    const ripplePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const rippleTarget = new THREE.Vector3();

    document.addEventListener('click', (e) => {
      clickNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
      clickNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(clickNDC, camera);
      raycaster.ray.intersectPlane(ripplePlane, rippleTarget);

      if (rippleTarget) {
        const slot = rippleIndex % MAX_RIPPLES;
        ripples[slot] = {
          x: rippleTarget.x,
          y: rippleTarget.y,
          z: rippleTarget.z,
          time: clock.getElapsedTime()
        };
        rippleIndex++;
      }
    });

    // 2. CURSEUR PERSONNALISÉ
    const cursor = document.getElementById('custom-cursor');
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        heroMotion.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        heroMotion.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function animateHeroHeading() {
        if (heroHeading) {
            heroMotion.x += (heroMotion.targetX - heroMotion.x) * 0.1;
            heroMotion.y += (heroMotion.targetY - heroMotion.y) * 0.1;

            const rotateX = -heroMotion.y * 18;
            const rotateY = heroMotion.x * 18;
            const translateZ = 12 + Math.abs(heroMotion.x * 16) + Math.abs(heroMotion.y * 12);

            heroHeading.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
        }
        requestAnimationFrame(animateHeroHeading);
    }
    animateHeroHeading();

    document.querySelectorAll('a, .text-card').forEach(link => {
        link.addEventListener('mouseenter', () => cursor.style.transform = 'scale(3)');
        link.addEventListener('mouseleave', () => cursor.style.transform = 'scale(1)');
    });

    // 3. REVEAL ANIMATION AU SCROLL
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // =========================================
    // NOUVEAU : LOGIQUE DE LA NAVBAR AU SCROLL
    // =========================================
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section, footer');
    const navItems = document.querySelectorAll('.nav-item');

    window.addEventListener('scroll', () => {
        // 1. Transformation en pilule si on scroll
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // 2. Allumer le lien correspondant à la section affichée
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            // On vérifie si on est dans la section (avec une petite marge pour le confort)
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                currentSection = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${currentSection}`) {
                item.classList.add('active');
            }
        });
    });

    // 4. EFFET TILT 3D UNIQUEMENT SUR LES PROJETS
    const tiltCards = document.querySelectorAll('a.tilt-effect');

    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            card.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'; 
        });

        card.addEventListener('mouseenter', () => {
            card.style.transition = 'none';
        });
    });

    // 5. ANIMATION POP-UP DES COMPÉTENCES (ULTRA FLUIDE)
    document.querySelectorAll('.acquisition-content p').forEach(p => {
        const text = p.innerText;
        p.innerHTML = ''; 
        
        text.split(' ').forEach((word, index) => {
            const span = document.createElement('span');
            span.innerText = word;
            span.style.transitionDelay = `${index * 0.015}s`; 
            p.appendChild(span);
            p.appendChild(document.createTextNode(' ')); 
        });
    });

    const competenceCards = document.querySelectorAll('.text-card');

    competenceCards.forEach(card => {
        let isExpanded = false;
        let transitionTimeout;
        
        card.addEventListener('mouseenter', () => {
            if (isExpanded) return;
            isExpanded = true;
            clearTimeout(transitionTimeout);
            
            document.body.classList.add('crazy-mode');
            card.parentElement.style.zIndex = '99999';
            
            const wrapper = card.parentElement;
            const rect = wrapper.getBoundingClientRect();
            
            card.style.transition = 'none'; 
            card.style.position = 'fixed';
            card.style.top = rect.top + 'px';
            card.style.left = rect.left + 'px';
            card.style.width = rect.width + 'px';
            card.style.height = rect.height + 'px';
            card.style.margin = '0';
            
            card.offsetHeight; 
            
            card.style.transition = 'top 0.5s cubic-bezier(0.16, 1, 0.3, 1), left 0.5s cubic-bezier(0.16, 1, 0.3, 1), width 0.5s cubic-bezier(0.16, 1, 0.3, 1), height 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease, border 0.5s ease, background 0.5s ease';
            card.classList.add('is-expanded');
            
            const targetWidth = window.innerWidth * 0.8;
            const targetHeight = window.innerHeight * 0.5;
            const targetLeft = (window.innerWidth - targetWidth) / 2;
            const targetTop = (window.innerHeight - targetHeight) / 2;
            
            card.style.top = targetTop + 'px';
            card.style.left = targetLeft + 'px';
            card.style.width = targetWidth + 'px';
            card.style.height = targetHeight + 'px';
        });

        card.addEventListener('mouseleave', () => {
            if (!isExpanded) return;
            isExpanded = false;
            clearTimeout(transitionTimeout);
            
            document.body.classList.remove('crazy-mode');
            card.classList.remove('is-expanded');
            
            const wrapper = card.parentElement;
            const rect = wrapper.getBoundingClientRect();
            
            card.style.top = rect.top + 'px';
            card.style.left = rect.left + 'px';
            card.style.width = rect.width + 'px';
            card.style.height = rect.height + 'px';
            
            transitionTimeout = setTimeout(() => {
                if (!isExpanded) {
                    card.style.transition = 'none';
                    card.style.position = '';
                    card.style.top = '';
                    card.style.left = '';
                    card.style.width = '';
                    card.style.height = '';
                    card.parentElement.style.zIndex = '1';
                }
            }, 500);
        });
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });