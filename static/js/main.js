// ═══════════════════════════════════════════════════════════
//  SCAM SHIELD — Main JavaScript
// ═══════════════════════════════════════════════════════════

// ── Particles ────────────────────────────────────────────
(function createParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDuration = (8 + Math.random() * 15) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    p.style.width = p.style.height = (1 + Math.random() * 2) + 'px';
    container.appendChild(p);
  }
})();

// ── Counter Animation ─────────────────────────────────────
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.getAttribute('data-target'));
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current);
      if (current >= target) clearInterval(timer);
    }, 25);
  });
}
window.addEventListener('load', () => setTimeout(animateCounters, 500));

// ── Char Count ────────────────────────────────────────────
const textarea = document.getElementById('inputText');
const charCount = document.getElementById('charCount');
textarea.addEventListener('input', () => {
  const len = textarea.value.length;
  charCount.textContent = `${len} / 2000`;
  charCount.style.color = len > 1800 ? '#ff3366' : len > 1500 ? '#ffaa00' : '#64748b';
});

// ── Example Texts ─────────────────────────────────────────
const examples = {
  scam: `URGENT! Earn 5000 DAILY from home!! No experience needed!!

Join our PREMIUM Internship Program - 100% job guaranteed after completion!
Pay only 999 registration fee to get started TODAY!

- Work just 2 hours a day
- Get certified from Google & ISO
- FREE laptop on joining (after 3 months)

WhatsApp NOW: 9876543210
Limited seats available - HURRY!!!

No interview. No qualification needed. Start IMMEDIATELY!!`,

  legit: `We are hiring interns for our Data Science team at TechCorp Solutions (registered company, CIN: U72900MH2018PTC304782).

Position: Data Science Intern (3 months)
Stipend: 8,000/month
No fees required from candidates.

Requirements:
- Basic Python knowledge
- GitHub profile preferred
- Aptitude test + technical round interview

Apply on our official website: www.techcorpsolutions.in or LinkedIn.
HR will contact shortlisted candidates within 7 working days.
Experience letter and recommendation letter provided on successful completion.`
};

function loadExample(type) {
  textarea.value = examples[type];
  charCount.textContent = `${textarea.value.length} / 2000`;
  textarea.focus();
}

function clearText() {
  textarea.value = '';
  charCount.textContent = '0 / 2000';
  document.getElementById('results').style.display = 'none';
  textarea.focus();
}

// ── Gauge Animation ───────────────────────────────────────
function animateGauge(score) {
  const arc = document.getElementById('gaugeArc');
  const needle = document.getElementById('gaugeNeedle');
  const gaugeScore = document.getElementById('gaugeScore');
  const totalLength = 282;

  // Color based on score
  const color = score >= 65 ? '#ff3366' : score >= 35 ? '#ffaa00' : '#00ff88';
  arc.style.stroke = color;

  // Animate arc
  let progress = 0;
  const arcTimer = setInterval(() => {
    progress = Math.min(progress + 2, score);
    const dashOffset = totalLength - (progress / 100) * totalLength;
    arc.style.strokeDashoffset = dashOffset;

    // Needle rotation: 0% = -90deg, 100% = +90deg
    const rotation = -90 + (progress / 100) * 180;
    needle.setAttribute('transform', `rotate(${rotation}, 110, 120)`);

    gaugeScore.textContent = Math.floor(progress) + '%';
    if (progress >= score) clearInterval(arcTimer);
  }, 20);

  gaugeScore.style.color = color;
}

// ── Score Counter ─────────────────────────────────────────
function animateScore(targetEl, target) {
  let current = 0;
  const timer = setInterval(() => {
    current = Math.min(current + 2, target);
    targetEl.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 20);
}

// ── Verdict Icon Map (Bootstrap Icons HTML) ───────────────
const verdictIcons = {
  SCAM:       '<i class="bi bi-shield-x"></i>',
  SUSPICIOUS: '<i class="bi bi-shield-exclamation"></i>',
  LEGITIMATE: '<i class="bi bi-shield-check"></i>'
};

// ── Analyze Text ──────────────────────────────────────────
async function analyzeText() {
  const text = textarea.value.trim();
  if (!text) {
    showToast('Please enter some text to analyze!');
    textarea.focus();
    return;
  }
  if (text.length < 10) {
    showToast('Text too short. Please enter a more detailed message.');
    return;
  }

  const btn = document.getElementById('analyzeBtn');
  const loader = document.getElementById('btnLoader');
  const btnText = btn.querySelector('.btn-text');
  const btnIcon = btn.querySelector('.btn-icon');

  // Loading state
  btn.classList.add('loading');
  loader.style.display = 'block';
  btnText.textContent = 'ANALYZING...';
  btnIcon.style.display = 'none';

  try {
    const res = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();

    if (data.error) { showToast(data.error); return; }

    displayResults(data);

  } catch (err) {
    showToast('Network error. Is the Flask server running?');
    console.error(err);
  } finally {
    btn.classList.remove('loading');
    loader.style.display = 'none';
    btnText.textContent = 'ANALYZE NOW';
    btnIcon.style.display = '';
  }
}

// ── Display Results ───────────────────────────────────────
function displayResults(data) {
  const section = document.getElementById('results');
  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Verdict banner
  const banner = document.getElementById('verdictBanner');
  banner.className = `verdict-banner ${data.verdict_color}`;

  document.getElementById('verdictIcon').innerHTML = verdictIcons[data.verdict] || '<i class="bi bi-question-circle"></i>';
  document.getElementById('verdictText').textContent = data.verdict;

  // Animate score number
  const scoreEl = document.getElementById('verdictScore');
  animateScore(scoreEl, data.score);

  // Gauge
  animateGauge(data.score);

  // Stats
  document.getElementById('statWords').textContent = data.word_count;
  document.getElementById('statScam').textContent = data.scam_keyword_count;
  document.getElementById('statPatterns').textContent = data.pattern_count;
  document.getElementById('statLegit').textContent = data.legit_keyword_count;

  // Flags list
  const flagsList = document.getElementById('flagsList');
  flagsList.innerHTML = data.flags.map(f => `<li>${f}</li>`).join('');

  // Positives list
  const positivesList = document.getElementById('positivesList');
  positivesList.innerHTML = data.positives.map(p => `<li>${p}</li>`).join('');

  // Advice
  document.getElementById('adviceText').textContent = data.advice;
  const adviceBox = document.getElementById('adviceBox');
  adviceBox.style.borderColor =
    data.verdict_color === 'danger' ? 'rgba(255,51,102,0.3)' :
    data.verdict_color === 'warning' ? 'rgba(255,170,0,0.3)' :
    'rgba(0,255,136,0.3)';
}

// ── Reset ─────────────────────────────────────────────────
function resetAnalyzer() {
  clearText();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Toast ─────────────────────────────────────────────────
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="bi bi-exclamation-circle" style="margin-right:0.5rem;"></i>${msg}`;
  toast.style.cssText = `
    position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
    background: #1a0f2e; border: 1px solid rgba(124,58,237,0.5);
    color: #e2e8f0; padding: 0.9rem 1.8rem; border-radius: 8px;
    font-family: 'Rajdhani', sans-serif; font-size: 0.95rem;
    z-index: 9999; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    animation: fadeInUp 0.3s ease;
    display: flex; align-items: center;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── Enter key shortcut ────────────────────────────────────
textarea.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') analyzeText();
});

// Tip label
const tip = document.createElement('div');
tip.style.cssText = 'text-align:right;font-size:0.72rem;color:#475569;margin-top:-0.5rem;margin-bottom:0.5rem;font-family:"Share Tech Mono",monospace;';
tip.textContent = 'Ctrl + Enter to analyze';
textarea.parentElement.after(tip);