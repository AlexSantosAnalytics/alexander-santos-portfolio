// ---------- Footer year ----------
document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Navbar shrink/blur on scroll ----------
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 20);
});

// ---------- Mobile nav toggle ----------
const navToggle = document.getElementById("navToggle");
const navLinks = document.querySelector(".nav-links");
navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
navLinks.querySelectorAll("a").forEach(link =>
  link.addEventListener("click", () => navLinks.classList.remove("open"))
);

// ---------- Scroll reveal ----------
const revealEls = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => revealObserver.observe(el));

// ---------- Background: animated grid + chart lines + data-point network ----------
const canvas = document.getElementById("bg-grid");
const ctx = canvas.getContext("2d");
let w, h, dpr;
let particles = [];

const PARTICLE_COUNT = 34;
const LINK_DIST = 150;

function initParticles() {
  particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.18,
    r: 1 + Math.random() * 1.6,
    phase: Math.random() * Math.PI * 2,
  }));
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  initParticles();
}
window.addEventListener("resize", resize);
resize();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Generate a few gentle sine-based "ticker" lines
const lines = Array.from({ length: 3 }, (_, i) => ({
  amp: 30 + i * 18,
  freq: 0.0025 + i * 0.0007,
  speed: 0.0004 + i * 0.0002,
  yOffset: 0.22 + i * 0.28,
  alpha: 0.16 - i * 0.03,
}));

let t = 0;
function draw() {
  ctx.clearRect(0, 0, w, h);

  // grid — faint minor lines, slightly stronger every 4th ("graph paper")
  const gap = 64;
  let i = 0;
  for (let x = 0; x < w; x += gap, i++) {
    ctx.strokeStyle = i % 4 === 0 ? "rgba(148,181,255,0.05)" : "rgba(255,255,255,0.025)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  i = 0;
  for (let y = 0; y < h; y += gap, i++) {
    ctx.strokeStyle = i % 4 === 0 ? "rgba(148,181,255,0.05)" : "rgba(255,255,255,0.025)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // drifting ticker lines with soft area fill beneath
  lines.forEach(line => {
    const baseY = h * line.yOffset;
    const points = [];
    for (let x = 0; x <= w; x += 6) {
      const y = baseY + Math.sin(x * line.freq + t * line.speed) * line.amp;
      points.push([x, y]);
    }

    const fillGrad = ctx.createLinearGradient(0, baseY - line.amp, 0, baseY + line.amp + 120);
    fillGrad.addColorStop(0, `rgba(59,130,246,${line.alpha * 0.9})`);
    fillGrad.addColorStop(1, "rgba(59,130,246,0)");
    ctx.beginPath();
    points.forEach(([x, y], idx) => (idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = fillGrad;
    ctx.fill();

    ctx.beginPath();
    points.forEach(([x, y], idx) => (idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.strokeStyle = `rgba(59, 130, 246, ${line.alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // glowing "live" marker riding the top ticker line
  const top = lines[0];
  const markerX = w - 60;
  const markerY = h * top.yOffset + Math.sin(markerX * top.freq + t * top.speed) * top.amp;
  ctx.beginPath();
  ctx.shadowColor = "rgba(59,130,246,0.9)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "rgba(120,170,255,0.95)";
  ctx.arc(markerX, markerY, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // drifting data-point network
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = w;
    if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h;
    if (p.y > h) p.y = 0;
  });

  for (let a = 0; a < particles.length; a++) {
    for (let b = a + 1; b < particles.length; b++) {
      const dx = particles[a].x - particles[b].x;
      const dy = particles[a].y - particles[b].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < LINK_DIST) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(120,170,255,${(1 - dist / LINK_DIST) * 0.08})`;
        ctx.lineWidth = 1;
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(particles[b].x, particles[b].y);
        ctx.stroke();
      }
    }
  }

  particles.forEach(p => {
    const twinkle = 0.4 + 0.4 * Math.sin(t * 0.0015 + p.phase);
    ctx.beginPath();
    ctx.fillStyle = `rgba(212,175,55,${twinkle * 0.55})`;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  if (!reduceMotion) {
    t += 16;
    requestAnimationFrame(draw);
  }
}
draw();
