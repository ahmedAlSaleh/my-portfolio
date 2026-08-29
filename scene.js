import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.querySelector("#cosmos-canvas");
const loader = document.querySelector(".intro-loader");
const progress = document.querySelector(".scroll-progress span");

window.addEventListener("load", () => {
  window.setTimeout(() => loader?.classList.add("intro-loader--done"), 3000);
});

function setupScrollProgress() {
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? window.scrollY / max : 0;
    progress.style.transform = `scaleX(${value})`;
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
}

function setupSectionDividers() {
  const sections = Array.from(document.querySelectorAll("main > .section"));
  sections.slice(0, -1).forEach((section, dividerIndex) => {
    const divider = document.createElement("div");
    divider.className = "section-divider";
    divider.setAttribute("aria-hidden", "true");
    const dots = Array.from({ length: 19 }, (_, dotIndex) => `<i class="section-divider__dot" style="--dot-index:${dotIndex}"></i>`).join("");
    divider.innerHTML = `<span class="section-divider__rail"></span><span class="section-divider__dots">${dots}</span>`;
    divider.style.setProperty("--divider-index", String(dividerIndex));
    const dividerDots = Array.from(divider.querySelectorAll(".section-divider__dot"));
    divider.addEventListener("pointermove", (event) => {
      const bounds = divider.getBoundingClientRect();
      const cursor = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
      divider.style.setProperty("--divider-cursor", `${cursor * 100}%`);
      dividerDots.forEach((dot, dotIndex) => {
        const distance = Math.abs(cursor - dotIndex / (dividerDots.length - 1));
        const force = Math.max(0, 1 - distance * 7.5);
        dot.style.transform = `translateY(${-force * 7}px) scale(${1 + force * 1.75})`;
        dot.style.opacity = String(0.38 + force * 0.62);
        dot.style.boxShadow = force > 0.08 ? `0 0 ${6 + force * 18}px rgba(82,231,255,${0.25 + force * 0.6})` : "";
      });
    });
    divider.addEventListener("pointerleave", () => {
      divider.style.removeProperty("--divider-cursor");
      dividerDots.forEach((dot) => {
        dot.style.removeProperty("transform");
        dot.style.removeProperty("opacity");
        dot.style.removeProperty("box-shadow");
      });
    });
    section.after(divider);
  });
}

function setupSectionNavigation() {
  const navigationLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
  let transitionTimer;
  const setActiveLink = (id) => {
    navigationLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`));
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey) return;
    const targetId = link.getAttribute("href");
    if (!targetId || targetId === "#") return;
    const target = document.querySelector(targetId);
    if (!target) return;
    event.preventDefault();
    const activeSection = target.classList.contains("section") ? target : target.closest(".section");
    document.querySelectorAll(".section-focus").forEach((section) => section.classList.remove("section-focus"));
    activeSection?.classList.add("section-focus");
    window.clearTimeout(transitionTimer);
    transitionTimer = window.setTimeout(() => activeSection?.classList.remove("section-focus"), 1050);
    if (window.location.hash !== targetId) history.pushState(null, "", targetId);
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    setActiveLink(targetId.slice(1));
  });

  const navigationSections = navigationLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter((target) => target?.classList.contains("section"));
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) setActiveLink(entry.target.id);
    }),
    { rootMargin: "-34% 0px -56%", threshold: 0.01 }
  );
  navigationSections.forEach((section) => observer.observe(section));
}

function setupReveal() {
  const selectors = [
    ".section-heading",
    ".manifesto",
    ".stat",
    ".project-card",
    ".website-card",
    ".case-study",
    ".process-step",
    ".skill-card",
    ".service-grid article",
    ".timeline article",
    ".contact-card",
  ];
  const reveal = (root = document) => {
    root.querySelectorAll(selectors.join(",")).forEach((item, index) => {
      if (item.dataset.revealReady) return;
      item.dataset.revealReady = "true";
      item.style.setProperty("--reveal-index", String(index % 5));
      item.classList.add("reveal-item");
    });
  };
  const stack = (root = document) => {
    root.querySelectorAll(".project-card, .website-card, .case-study").forEach((item, index) => {
      if (item.dataset.stackReady) return;
      item.dataset.stackReady = "true";
      item.style.setProperty("--stack-index", String(index % 5));
      item.style.setProperty("--stack-x", index % 2 ? "10%" : "-10%");
      item.style.setProperty("--stack-rotation", index % 2 ? "2.4deg" : "-2.4deg");
      item.classList.add("stack-block");
    });
  };
  stack();
  reveal();
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("reveal-item--visible");
      observer.unobserve(entry.target);
    }),
    { threshold: 0.1, rootMargin: "0px 0px -5%" }
  );
  const observe = () => document.querySelectorAll(".reveal-item:not(.reveal-item--visible)").forEach((item) => observer.observe(item));
  observe();
  new MutationObserver(() => {
    stack();
    reveal();
    observe();
    setupTilt(document);
  }).observe(document.body, { childList: true, subtree: true });
}

function setupTilt(root = document) {
  if (reducedMotion || window.matchMedia("(pointer: coarse)").matches) return;
  root.querySelectorAll(".project-card, .website-card, .process-step, .stat, .skill-card, .contact-card").forEach((card) => {
    if (card.dataset.tiltReady) return;
    card.dataset.tiltReady = "true";
    card.addEventListener("pointermove", (event) => {
      const box = card.getBoundingClientRect();
      const x = ((event.clientX - box.left) / box.width - 0.5) * 2;
      const y = ((event.clientY - box.top) / box.height - 0.5) * 2;
      card.style.setProperty("--tilt-x", `${(-y * 4).toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${(x * 5).toFixed(2)}deg`);
      card.style.setProperty("--shine-x", `${((x + 1) * 50).toFixed(1)}%`);
      card.style.setProperty("--shine-y", `${((y + 1) * 50).toFixed(1)}%`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
    });
  });
}

function createTerminalTexture() {
  const terminalCanvas = document.createElement("canvas");
  terminalCanvas.width = 960;
  terminalCanvas.height = 620;
  const context = terminalCanvas.getContext("2d");
  context.fillStyle = "rgba(10, 12, 24, 0.92)";
  context.fillRect(0, 0, terminalCanvas.width, terminalCanvas.height);
  context.fillStyle = "rgba(255, 255, 255, 0.06)";
  context.fillRect(0, 0, terminalCanvas.width, 76);
  ["#0c8dff", "#53d7ff", "#9af4ff"].forEach((color, index) => {
    context.beginPath();
    context.fillStyle = color;
    context.arc(45 + index * 30, 38, 8, 0, Math.PI * 2);
    context.fill();
  });
  context.font = "600 26px monospace";
  context.fillStyle = "rgba(255,255,255,.52)";
  context.fillText("portfolio.dart", 145, 47);
  const lines = [
    ["class", " Ahmed", " extends", " Engineer {"],
    ["  final", " stack", " =", " [Flutter, API, Firebase];"],
    ["  Future", "<Product>", " build", "(idea) async {"],
    ["    return", " ship", "(cleanArchitecture);"],
    ["  }"],
  ];
  const colors = ["#50ceff", "#8aeeff", "#317fff", "#e2f9ff"];
  context.font = "600 28px monospace";
  lines.forEach((line, lineIndex) => {
    let x = 54;
    const y = 142 + lineIndex * 78;
    line.forEach((part, partIndex) => {
      context.fillStyle = colors[(lineIndex + partIndex) % colors.length];
      context.fillText(part, x, y);
      x += context.measureText(part).width;
    });
  });
  context.fillStyle = "#54e7ff";
  context.fillRect(56, 510, 20, 34);
  return new THREE.CanvasTexture(terminalCanvas);
}

function createCodeToken(label, color, x, y, z, scale) {
  const tokenCanvas = document.createElement("canvas");
  tokenCanvas.width = 520;
  tokenCanvas.height = 160;
  const context = tokenCanvas.getContext("2d");
  context.fillStyle = "rgba(16, 16, 29, 0.88)";
  context.fillRect(0, 0, tokenCanvas.width, tokenCanvas.height);
  context.strokeStyle = color;
  context.globalAlpha = 0.65;
  context.lineWidth = 4;
  context.strokeRect(6, 6, tokenCanvas.width - 12, tokenCanvas.height - 12);
  context.globalAlpha = 1;
  context.fillStyle = color;
  context.font = "700 74px monospace";
  context.fillText(label, 40, 105);
  const material = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(tokenCanvas), transparent: true, depthWrite: false, opacity: 0.78 });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(x, y, z);
  sprite.scale.set(scale, scale * 0.31, 1);
  return sprite;
}

function setupScene() {
  if (!canvas || reducedMotion) return;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.set(0, 0, 13);

  const group = new THREE.Group();
  group.position.set(3.9, 0.3, -2.4);
  scene.add(group);

  const aqua = new THREE.MeshBasicMaterial({ color: 0x54e7ff, wireframe: true, transparent: true, opacity: 0.28 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.018, 12, 96), aqua);
  ring.rotation.x = 1.18;
  ring.rotation.y = -0.38;
  const terminal = new THREE.Mesh(
    new THREE.PlaneGeometry(4.9, 3.16),
    new THREE.MeshBasicMaterial({ map: createTerminalTexture(), transparent: true, opacity: 0.8, depthWrite: false })
  );
  const terminalFrame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(4.98, 3.24, 0.12)),
    new THREE.LineBasicMaterial({ color: 0x54e7ff, transparent: true, opacity: 0.62 })
  );
  terminal.position.z = 0.1;
  terminalFrame.position.z = 0;
  const codeRunner = new THREE.Group();
  codeRunner.add(terminal, terminalFrame);
  const runnerCube = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.92, 0.92),
    new THREE.MeshBasicMaterial({ color: 0x59e9ff, wireframe: true, transparent: true, opacity: 0.88 })
  );
  const runnerCubeCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.7, 0.7),
    new THREE.MeshBasicMaterial({ color: 0x087dff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  runnerCube.position.set(-2.72, 1.55, 0.55);
  runnerCubeCore.position.copy(runnerCube.position);
  codeRunner.add(runnerCube, runnerCubeCore);
  const route = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.65, -0.62, 0),
    new THREE.Vector3(-0.7, 0.36, 0.28),
    new THREE.Vector3(0.22, -0.08, 0.08),
    new THREE.Vector3(1.56, 0.6, -0.16),
  ]);
  const dataRoute = new THREE.Mesh(
    new THREE.TubeGeometry(route, 72, 0.018, 8, false),
    new THREE.MeshBasicMaterial({ color: 0x54e7ff, transparent: true, opacity: 0.62 })
  );
  const dataRouteGlow = new THREE.Mesh(
    new THREE.TubeGeometry(route, 72, 0.065, 8, false),
    new THREE.MeshBasicMaterial({ color: 0x087dff, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  const dataPackets = Array.from({ length: 13 }, (_, index) => {
    const packet = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.08),
      new THREE.MeshBasicMaterial({ color: index % 2 ? 0x0b8dff : 0x65ecff, transparent: true, opacity: 0.95 })
    );
    packet.userData.offset = index / 13;
    group.add(packet);
    return packet;
  });
  const codeTokens = new THREE.Group();
  codeTokens.add(
    createCodeToken("</>", "#43caff", -2.75, 1.75, 0.45, 1.35),
    createCodeToken("API", "#72efff", 2.85, -1.58, 0.2, 1.06),
    createCodeToken("{ }", "#2084ff", -2.45, -1.7, -0.25, 0.92)
  );
  group.add(dataRouteGlow, dataRoute, codeRunner, ring, codeTokens);

  const count = window.innerWidth < 760 ? 360 : 940;
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * 26;
    positions[index * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[index * 3 + 2] = (Math.random() - 0.5) * 11 - 2;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({ color: 0xc9f5ff, size: 0.025, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending })
  );
  scene.add(particles);

  const pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX / window.innerWidth - 0.5;
    pointer.y = event.clientY / window.innerHeight - 0.5;
  }, { passive: true });
  const resize = () => {
    const { innerWidth: width, innerHeight: height } = window;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", resize);
  resize();
  const clock = new THREE.Clock();
  const render = () => {
    const time = clock.getElapsedTime();
    group.rotation.x += (pointer.y * 0.45 - group.rotation.x) * 0.035;
    group.rotation.y += (time * 0.18 + pointer.x * 0.65 - group.rotation.y) * 0.035;
    group.position.y = 0.25 + Math.sin(time * 0.7) * 0.35 - window.scrollY * 0.00016;
    ring.rotation.z = time * 0.16;
    const runnerProgress = (Math.sin(time * 0.28) + 1) * 0.5;
    const runnerPosition = route.getPointAt(runnerProgress);
    codeRunner.position.copy(runnerPosition);
    codeRunner.rotation.z = Math.cos(time * 0.28) * 0.14;
    runnerCube.rotation.set(time * 0.72, -time * 0.9, time * 0.36);
    runnerCubeCore.rotation.copy(runnerCube.rotation);
    dataPackets.forEach((packet) => {
      const progress = (packet.userData.offset + time * 0.09) % 1;
      packet.position.copy(route.getPointAt(progress));
      packet.scale.setScalar(0.65 + Math.sin((progress + time) * Math.PI) * 0.25);
    });
    codeTokens.rotation.z = Math.sin(time * 0.32) * 0.05;
    particles.rotation.y = time * 0.014;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };
  render();
}

setupScrollProgress();
setupSectionDividers();
setupSectionNavigation();
setupReveal();
setupTilt();
setupScene();
