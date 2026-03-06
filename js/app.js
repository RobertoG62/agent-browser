// ============================================
// Agent Browser - Skill Recommender Engine
// ============================================

let skillsDB = typeof SKILLS_DATA !== 'undefined' ? SKILLS_DATA : [];

// Hebrew-to-English translation map for search terms
const hebrewToEnglish = {
  'אתר': ['website', 'site', 'web'],
  'אתרים': ['website', 'site', 'web'],
  'דף': ['page', 'landing'],
  'דפים': ['pages', 'landing'],
  'משחק': ['game', 'gaming', '3d'],
  'משחקים': ['game', 'gaming'],
  'חנות': ['store', 'shop', 'ecommerce'],
  'בלוג': ['blog', 'content'],
  'אפליקציה': ['app', 'application'],
  'מצגת': ['presentation', 'slides', 'deck'],
  'מצגות': ['presentation', 'slides'],
  'סרטון': ['video', 'film', 'animation'],
  'וידאו': ['video', 'film'],
  'תמונה': ['image', 'photo', 'visual'],
  'תמונות': ['image', 'photo'],
  'עיצוב': ['design', 'ui', 'ux'],
  'שיווק': ['marketing', 'seo', 'promotion'],
  'קידום': ['seo', 'marketing', 'promotion'],
  'הודעה': ['message', 'messaging', 'chat'],
  'הודעות': ['message', 'messaging', 'send'],
  'וואטסאפ': ['whatsapp', 'messaging'],
  'תקשורת': ['communication', 'messaging'],
  'מחקר': ['research', 'analysis', 'data'],
  'לימוד': ['education', 'learning', 'course'],
  'קורס': ['course', 'education', 'learning'],
  'שיעור': ['lesson', 'education', 'teaching'],
  'יוטיוב': ['youtube', 'video'],
  'לבנות': ['build', 'create'],
  'ליצור': ['create', 'generate', 'build'],
  'לשלוח': ['send', 'message'],
  'תיירות': ['tourism', 'travel', 'authority'],
  'יוקרה': ['luxury', 'premium'],
  'יוקרתי': ['luxury', 'premium'],
  'פרזנטציה': ['presentation', 'slides'],
  'קול': ['voice', 'audio', 'speech'],
  'מוזיקה': ['music', 'audio'],
  'תלת': ['3d', 'threejs'],
  'מימד': ['3d', 'threejs'],
};

// Hebrew stopwords to ignore during tokenization
const stopwords = new Set([
  'אני', 'רוצה', 'צריך', 'את', 'של', 'עם', 'על', 'לי', 'אל',
  'הוא', 'היא', 'הם', 'הן', 'זה', 'זו', 'אלה', 'כמו', 'גם',
  'או', 'אבל', 'כי', 'אם', 'מה', 'איך', 'למה', 'מי', 'כל',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'for',
  'and', 'or', 'but', 'in', 'on', 'at', 'by', 'with', 'from',
  'i', 'want', 'need', 'would', 'like', 'can', 'please', 'help',
  'me', 'my', 'that', 'this', 'it', 'do', 'make',
]);

// ---- Core Functions ----

function tokenize(input) {
  const normalized = input.toLowerCase().trim();
  const tokens = normalized.split(/[\s,.\-;:!?]+/).filter(t => t.length > 1);
  return tokens.filter(t => !stopwords.has(t));
}

function translateHebrew(tokens) {
  const translated = [];
  for (const token of tokens) {
    if (hebrewToEnglish[token]) {
      translated.push(...hebrewToEnglish[token]);
    } else {
      translated.push(token);
    }
  }
  return [...new Set(translated)];
}

function scoreSkill(skill, tokens) {
  let score = 0;

  for (const token of tokens) {
    const tokenLower = token.toLowerCase();

    // Title match (×10)
    if (skill.name.toLowerCase().includes(tokenLower) ||
      skill.id.toLowerCase().includes(tokenLower)) {
      score += 10;
    }

    // Use-case match (×8)
    for (const useCase of skill.useCases) {
      if (useCase.toLowerCase().includes(tokenLower)) {
        score += 8;
        break;
      }
    }

    // Tag match (×5)
    for (const tag of skill.tags) {
      if (tag.toLowerCase() === tokenLower ||
        tag.toLowerCase().includes(tokenLower)) {
        score += 5;
        break;
      }
    }

    // Category match (×3)
    if (skill.category.toLowerCase().includes(tokenLower)) {
      score += 3;
    }

    // Description match (×2)
    if (skill.description.toLowerCase().includes(tokenLower) ||
      skill.descriptionHe.includes(token)) {
      score += 2;
    }
  }

  return score;
}

function search(query) {
  if (!query.trim()) {
    // Return all items if search is empty, with a dummy score
    return skillsDB.map(skill => ({ skill, score: 1 }));
  }

  const tokens = tokenize(query);
  const translatedTokens = translateHebrew(tokens);

  const scored = skillsDB.map(skill => ({
    skill,
    score: scoreSkill(skill, translatedTokens),
  }));

  const filteredAndSorted = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  console.log('Scoring Complete', { matches: filteredAndSorted.length });
  return filteredAndSorted;
}

// ---- Rendering ----

function getRelevanceTier(score, maxScore) {
  const ratio = score / maxScore;
  if (ratio >= 0.7) return { label: 'התאמה מושלמת', class: 'tier-perfect' };
  if (ratio >= 0.4) return { label: 'התאמה חזקה', class: 'tier-strong' };
  return { label: 'קשור', class: 'tier-related' };
}

function renderResults(results, shouldScroll = false) {
  console.log('Rendering Started', { totalCards: results.length });
  const resultsSection = document.getElementById('results');
  const emptyState = document.getElementById('emptyState');
  const grid = document.getElementById('resultsGrid');
  const title = document.getElementById('resultsTitle');
  const subtitle = document.getElementById('resultsSubtitle');

  // Verify elements exist to prevent "dead" functionality silently throwing ReferenceErrors
  if (!resultsSection || !emptyState || !grid) {
    console.error('DOM Elements missing: resultsSection, emptyState, or grid is null');
    return;
  }

  if (results.length === 0) {
    resultsSection.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  resultsSection.classList.remove('hidden');

  const queryWasEmpty = !document.getElementById('searchInput').value.trim();

  title.textContent = queryWasEmpty ? `כל ${results.length} הסקילים במערכת` : `${results.length} סקילים מומלצים`;
  subtitle.textContent = queryWasEmpty ? 'עיון בספריית הסקילים המלאה' : 'מדורגים לפי רמת התאמה לפרויקט שלך';

  const maxScore = results[0]?.score || 1;

  // Use DocumentFragment for lightning-fast DOM injection of 300+ items
  grid.innerHTML = '';
  const fragment = document.createDocumentFragment();

  results.forEach((item, index) => {
    const { skill, score } = item;
    const tier = getRelevanceTier(score, maxScore);
    const relevancePercent = queryWasEmpty ? 100 : Math.round((score / maxScore) * 100);
    const sourceBadge = skill.source === 'aviz'
      ? '<span class="badge-aviz">AVIZ</span>'
      : '<span class="badge-skillssh">skills.sh</span>';
    const installedBadge = skill.installed
      ? '<span class="badge-installed">מותקן</span>'
      : '';
    const actionBtn = skill.installed && skill.command
      ? `<button class="action-btn" onclick="copyText('${skill.command}')">Use: ${skill.command}</button>`
      : skill.installCmd
        ? `<button class="action-btn action-install" onclick="copyText('${skill.installCmd}')">Copy Install Command</button>`
        : '';

    const card = document.createElement('div');
    card.className = "result-card fade-in";
    // Cap animation delay to avoid waiting too long for the 300th item
    card.style.animationDelay = `${Math.min(index * 0.05, 1)}s`;

    try {
      card.innerHTML = `
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="font-inter font-semibold text-lg text-cream">${skill.name}</h3>
              <p class="text-cream/50 text-sm">${skill.nameHe || ''}</p>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              ${sourceBadge}
              ${installedBadge}
            </div>
          </div>

          <p class="text-cream/70 text-sm mb-4 leading-relaxed">${skill.descriptionHe || skill.description || ''}</p>

          <div class="flex flex-wrap gap-1.5 mb-4">
            ${(skill.tags || []).slice(0, 5).map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>

          <!-- Relevance bar -->
          ${!queryWasEmpty ? `
          <div class="mb-4">
            <div class="flex justify-between text-xs text-cream/40 mb-1">
              <span>${tier.label}</span>
              <span>${relevancePercent}%</span>
            </div>
            <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div class="h-full bg-gold rounded-full transition-all duration-700" style="width: ${relevancePercent}%"></div>
            </div>
          </div>` : ''}

          ${actionBtn}

          ${skill.installCount ? `<p class="text-cream/30 text-xs mt-2">${(skill.installCount).toLocaleString()} installs</p>` : ''}
      `;
      fragment.appendChild(card);
    } catch (err) {
      console.error('Error rendering card for skill:', skill.id, err);
    }
  });

  grid.appendChild(fragment);

  if (shouldScroll) {
    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('הועתק ללוח!');
  });
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('toast-visible'), 10);
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ---- Event Handlers ----

function handleSearch(shouldScroll = false) {
  console.log('Search Triggered');
  try {
    const inputEl = document.getElementById('searchInput');
    if (!inputEl) {
      console.error('Missing #searchInput element');
      return;
    }
    const query = inputEl.value;
    const results = search(query);
    renderResults(results, shouldScroll);
  } catch (err) {
    console.error('Error during handleSearch execution:', err);
  }
}

function handleCategoryClick(category) {
  const categoryMap = {
    'web-development': 'בניית אתר',
    'marketing': 'שיווק וקידום SEO',
    'design': 'עיצוב UI UX',
    'presentation': 'מצגת שקפים',
    'audio-video': 'סרטון וידאו מוזיקה',
    'communication': 'שליחת הודעות',
    'development': 'פיתוח תוכנה קוד',
    'document': 'מסמכים PDF Word Excel',
    'gaming': 'משחק תלת מימד',
    'research': 'מחקר ונתונים',
    'education': 'לימוד קורס שיעור',
    'productivity': 'פרודוקטיביות יומן',
    'automation': 'אוטומציה דפדפן',
  };

  const input = document.getElementById('searchInput');
  input.value = categoryMap[category] || category;
  handleSearch(true);
}

// ---- Initialization ----

async function init() {
  // Search button
  document.getElementById('searchBtn').addEventListener('click', () => handleSearch(true));

  // Debounced input for lightning-fast Global Search
  let searchTimeout;
  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      handleSearch(false);
    }, 800);
  });

  // Enter key in textarea (Ctrl+Enter or just Enter without Shift)
  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch(true);
    }
  });

  // Category pills
  document.querySelectorAll('.category-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      handleCategoryClick(pill.dataset.category);
    });
  });

  // Initial render of all items
  handleSearch(false);
}

document.addEventListener('DOMContentLoaded', init);
