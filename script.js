// Theme
const html = document.documentElement;
const saved = localStorage.getItem('theme');
const themeMeta = document.querySelector('meta[name="theme-color"]');
if (saved) html.dataset.theme = saved;
else html.dataset.theme = 'dark';
if (themeMeta) themeMeta.content = themeMeta.dataset[html.dataset.theme];

function semverCompare(a, b) {
  const aParts = a.replace(/^v/, '').split('.').map(Number);
  const bParts = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((aParts[i] || 0) > (bParts[i] || 0)) return 1;
    if ((aParts[i] || 0) < (bParts[i] || 0)) return -1;
  }
  return 0;
}

document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

  // Console log replay
  const statusConsole = document.getElementById('statusConsole');
  const logLines = document.querySelectorAll('.console-log .log-line');
  if (statusConsole && logLines.length && 'IntersectionObserver' in window) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const playLog = () => {
      logLines.forEach((line, i) => {
        if (reduced) {
          line.classList.add('visible');
          return;
        }
        setTimeout(() => line.classList.add('visible'), 250 + i * 350);
      });
    };
    const consoleObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          playLog();
          consoleObserver.disconnect();
        }
      });
    }, { threshold: 0.35 });
    consoleObserver.observe(statusConsole);
  } else if (logLines.length) {
    logLines.forEach((line) => line.classList.add('visible'));
  }

  // GitHub badges + download size
  const badgeVersion = document.getElementById('badgeVersion');
  const badgeStars = document.getElementById('badgeStars');
  const sizeSetup = document.getElementById('sizeSetup');
  const downloadFile = 'fm-optimize-setup.exe';
  fetch('https://api.github.com/repos/FelipeMeloGomes/FM-Optimization/releases')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(all => {
      all.sort((a, b) => semverCompare(b.tag_name, a.tag_name));
      const latest = all[0];
      if (!latest) { badgeVersion.textContent = 'v1.0.0'; return; }
      badgeVersion.textContent = latest.tag_name;
      document.querySelectorAll('.btn-download').forEach(btn => {
        btn.href = `https://github.com/FelipeMeloGomes/FM-Optimization/releases/download/${latest.tag_name}/${downloadFile}`;
      });
      latest.assets.forEach(a => {
        const mb = (a.size / 1048576).toFixed(1);
        if (a.name === downloadFile && sizeSetup) sizeSetup.textContent = '~' + mb + ' MB';
      });
    })
    .catch(() => {
      badgeVersion.textContent = 'v1.0.0';
      if (sizeSetup) sizeSetup.textContent = '~90 MB';
    });
  fetch('https://api.github.com/repos/FelipeMeloGomes/FM-Optimization')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(d => { badgeStars.textContent = d.stargazers_count + ' ★'; })
    .catch(() => { badgeStars.textContent = '★'; });

  // Hamburger menu
  const hamburger = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-label', mobileMenu.classList.contains('open') ? 'Fechar menu' : 'Abrir menu');
  });
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-label', 'Abrir menu');
    });
  });

  // Back to top
  const backToTop = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Download toast + button state
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('role', 'status');
  document.body.appendChild(toast);

  let toastTimer;
  document.querySelectorAll('.btn-download').forEach((btn) => {
    const originalLabel = btn.textContent.trim();
    btn.addEventListener('click', () => {
      btn.classList.add('loading');
      btn.textContent = '\u2192 iniciando\u2026';
      clearTimeout(toastTimer);
      toast.textContent = `iniciando download de ${downloadFile}\u2026`;
      toast.classList.add('show');
      toastTimer = setTimeout(() => {
        toast.classList.remove('show');
        btn.classList.remove('loading');
        btn.textContent = originalLabel;
      }, 1500);
    });
  });

  // Counter animation
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        if (!target) return;
        let current = 0;
        const step = Math.ceil(target / 40);
        const intl = new Intl.NumberFormat('pt-BR');
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.textContent = intl.format(current);
        }, 30);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.counter').forEach((el) => counterObserver.observe(el));

  // Theme toggle
  const themeBtn = document.getElementById('themeToggle');
  function applyTheme(theme) {
    html.dataset.theme = theme;
    if (themeMeta) themeMeta.content = themeMeta.dataset[theme];
  }
  themeBtn.addEventListener('click', () => {
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });

  // Releases
  const releasesContainer = document.getElementById('releasesContainer');
  if (releasesContainer) {
    fetch('https://api.github.com/repos/FelipeMeloGomes/FM-Optimization/releases')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(releases => {
        if (!releases.length) {
          releasesContainer.innerHTML = '<p class="releases-error" style="color:var(--text-2)">Nenhuma release encontrada.</p>';
          return;
        }
        releases.sort((a, b) => semverCompare(b.tag_name, a.tag_name));
        const html = releases.map(r => {
          const date = new Date(r.published_at || r.created_at);
          const dateStr = date.toLocaleDateString('pt-BR', {
            day: 'numeric', month: 'long', year: 'numeric'
          });
          const bodyHtml = marked.parse(r.body || '');
          return `
            <div class="release-card fade-in">
              <div class="release-header">
                <span class="release-tag">${r.tag_name}</span>
                <span class="release-date">${dateStr}</span>
              </div>
              <div class="release-name">${r.name}</div>
              <div class="release-body">${bodyHtml}</div>
            </div>
          `;
        }).join('');
        releasesContainer.innerHTML = html;
        document.querySelectorAll('#releasesContainer .fade-in').forEach(el => observer.observe(el));
      })
      .catch(() => {
        releasesContainer.innerHTML = '<p class="releases-error">Não foi possível carregar o changelog. Tente novamente mais tarde.</p>';
      });
  }

});