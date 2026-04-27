const DEFAULT_WGER_CONFIG = {
  baseUrl: 'https://wger.de/api/v2',
  language: 2,
  searchPaths: [
    '/exerciseinfo/?language={language}&term={query}',
    '/exerciseinfo/?language={language}&search={query}',
    '/exercise/?language={language}&term={query}',
    '/exercise/?language={language}&search={query}',
  ],
  musclesPaths: [
    '/muscle/?language={language}',
    '/muscle/',
  ],
  timeoutMs: 12000,
};

const MUSCLE_REGION_RULES = [
  { pattern: /pectoralis|chest/i, regions: ['pectoralis-front'] },
  { pattern: /latissimus|lats?\b|dorsal/i, regions: ['lats-back'] },
  { pattern: /trapezius|traps?\b/i, regions: ['traps-back'] },
  { pattern: /deltoid|shoulder/i, regions: ['deltoids-front', 'deltoids-back'] },
  { pattern: /biceps|biceps brachii|brachii/i, regions: ['biceps-front'] },
  { pattern: /triceps/i, regions: ['triceps-back'] },
  { pattern: /quadriceps|quads?\b/i, regions: ['quads-front'] },
  { pattern: /hamstrings?/i, regions: ['hamstrings-back'] },
  { pattern: /glute|gluteus/i, regions: ['glutes-back'] },
  { pattern: /calf|gastrocnemius|soleus/i, regions: ['calves-front', 'calves-back'] },
  { pattern: /abdominal|abdominals|abs?\b|oblique|core|rectus abdominis/i, regions: ['abs-front', 'obliques-front', 'lower-back-back'] },
  { pattern: /erector spinae|lower back|lumbar/i, regions: ['lower-back-back'] },
  { pattern: /forearm|brachioradialis|pronator/i, regions: ['forearms-front'] },
];

const ANATOMY_REGION_LABELS = {
  'pectoralis-front': 'Pecho',
  'lats-back': 'Espalda',
  'traps-back': 'Trapecio',
  'deltoids-front': 'Hombros',
  'deltoids-back': 'Hombros',
  'biceps-front': 'Bíceps',
  'triceps-back': 'Tríceps',
  'quads-front': 'Cuádriceps',
  'hamstrings-back': 'Isquios',
  'glutes-back': 'Glúteos',
  'calves-front': 'Gemelos',
  'calves-back': 'Gemelos',
  'abs-front': 'Core',
  'obliques-front': 'Oblicuos',
  'lower-back-back': 'Zona lumbar',
  'forearms-front': 'Antebrazos',
};

const SVG_REGION_IDS = [
  'pectoralis-front',
  'lats-back',
  'traps-back',
  'deltoids-front',
  'deltoids-back',
  'biceps-front',
  'triceps-back',
  'quads-front',
  'hamstrings-back',
  'glutes-back',
  'calves-front',
  'calves-back',
  'abs-front',
  'obliques-front',
  'lower-back-back',
  'forearms-front',
];

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_WGER_CONFIG.baseUrl).trim().replace(/\/$/, '');
}

function normalizeLanguage(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : DEFAULT_WGER_CONFIG.language;
}

function normalizePath(path, query, language) {
  const encodedQuery = encodeURIComponent(String(query || '').trim());
  return String(path || '')
    .replace('{query}', encodedQuery)
    .replace('{language}', String(language));
}

function buildSearchUrl(query, config = {}, searchPath = '') {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const language = normalizeLanguage(config.language);
  const encodedQuery = encodeURIComponent(String(query || '').trim());
  const resolvedPath = normalizePath(searchPath, query, language);
  if (!resolvedPath) return '';
  if (resolvedPath.includes('{query}')) return `${baseUrl}${resolvedPath.replace('{query}', encodedQuery)}`;
  return `${baseUrl}${resolvedPath}${resolvedPath.includes('?') ? '&' : '?'}query=${encodedQuery}`;
}

function buildCandidateSearchUrls(query, config = {}) {
  const paths = Array.isArray(config.searchPaths) && config.searchPaths.length ? config.searchPaths : DEFAULT_WGER_CONFIG.searchPaths;
  return paths.map((path) => buildSearchUrl(query, config, path)).filter(Boolean);
}

function buildMuscleUrls(config = {}) {
  const paths = Array.isArray(config.musclesPaths) && config.musclesPaths.length ? config.musclesPaths : DEFAULT_WGER_CONFIG.musclesPaths;
  const language = normalizeLanguage(config.language);
  return paths.map((path) => `${normalizeBaseUrl(config.baseUrl)}${normalizePath(path, '', language)}`);
}

function extractExerciseRecord(payload) {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload.find(Boolean) || null;
  if (payload.exercise && typeof payload.exercise === 'object') return payload.exercise;
  if (Array.isArray(payload.data)) return payload.data.find(Boolean) || null;
  if (Array.isArray(payload.results)) return payload.results.find(Boolean) || null;
  if (Array.isArray(payload.exercises)) return payload.exercises.find(Boolean) || null;
  return payload;
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap((item) => toArray(item));
  return [value];
}

function collectMuscleIds(exercise) {
  const raw = [...toArray(exercise?.muscles), ...toArray(exercise?.muscles_secondary), ...toArray(exercise?.target_muscles), ...toArray(exercise?.secondary_muscles)];
  return Array.from(new Set(raw.map((item) => {
    if (item && typeof item === 'object') return Number(item.id || item.muscle || item.muscle_id || item.value);
    const numeric = Number(item);
    return Number.isFinite(numeric) ? numeric : null;
  }).filter((value) => Number.isFinite(value) && value > 0)));
}

function normalizeMuscleName(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

function mapMuscleNameToRegions(muscleName) {
  const normalized = normalizeMuscleName(muscleName);
  const matches = [];
  for (const rule of MUSCLE_REGION_RULES) {
    if (rule.pattern.test(normalized)) matches.push(...rule.regions);
  }
  return Array.from(new Set(matches));
}

function mapMuscleNamesToRegions(muscleNames = []) {
  return Array.from(new Set((Array.isArray(muscleNames) ? muscleNames : [muscleNames]).flatMap(mapMuscleNameToRegions)));
}

function getRegionLabel(regionId) {
  return ANATOMY_REGION_LABELS[regionId] || 'Músculo';
}

function buildMuscleCatalogMap(payload) {
  const results = Array.isArray(payload?.results) ? payload.results : Array.isArray(payload) ? payload : [];
  return results.reduce((acc, muscle) => {
    const id = Number(muscle?.id);
    if (!Number.isFinite(id)) return acc;
    acc[id] = String(muscle?.name || muscle?.muscle || muscle?.muscle_name || '').trim();
    return acc;
  }, {});
}

function buildExerciseAnatomyMarkup({ primaryRegions = [], secondaryRegions = [], title = 'Anatomía muscular', subtitle = '' } = {}) {
  const validRegions = new Set(SVG_REGION_IDS);
  const primary = new Set(primaryRegions.filter((regionId) => validRegions.has(regionId)));
  const secondary = new Set(secondaryRegions.filter((regionId) => validRegions.has(regionId)));
  const regionClass = (regionId) => {
    if (primary.has(regionId)) return 'muscle-zone is-primary';
    if (secondary.has(regionId)) return 'muscle-zone is-secondary';
    return 'muscle-zone';
  };
  const labelString = [title, subtitle].filter(Boolean).join(' · ');

  return `
    <svg class="exercise-anatomy__svg" viewBox="0 0 520 360" role="img" aria-label="${escapeSvg(labelString || title)}" xmlns="http://www.w3.org/2000/svg">
      <title>${escapeSvg(title)}</title>
      ${subtitle ? `<desc>${escapeSvg(subtitle)}</desc>` : ''}
      <g class="anatomy-panel anatomy-panel--front" transform="translate(0 0)">
        <text x="130" y="24" class="anatomy-label">Frontal</text>
        <path d="M110 58c10 14 26 21 40 21s30-7 40-21c10 13 17 29 20 48l-17 6-11 28v109H118V140l-11-28-17-6c3-19 10-35 20-48z" class="body-outline"/>
        <path id="pectoralis-front" d="M146 114c15 0 27 6 40 17-4 18-12 30-22 34h-36c-10-4-18-16-22-34 13-11 25-17 40-17z" class="${regionClass('pectoralis-front')}"/>
        <path id="deltoids-front" d="M118 108c10-12 20-18 30-18 8 0 15 4 22 11-7 12-15 19-24 22-10-3-19-7-28-15z" class="${regionClass('deltoids-front')}"/>
        <path id="biceps-front" d="M105 145h24v50h-24zM191 145h24v50h-24z" class="${regionClass('biceps-front')}"/>
        <path id="forearms-front" d="M100 196h18v58h-18zM202 196h18v58h-18z" class="${regionClass('forearms-front')}"/>
        <path id="abs-front" d="M144 162h32v68h-32z" class="${regionClass('abs-front')}"/>
        <path id="obliques-front" d="M128 164h14v62h-14zM178 164h14v62h-14z" class="${regionClass('obliques-front')}"/>
        <path id="quads-front" d="M132 246h22v70h-22zM166 246h22v70h-22z" class="${regionClass('quads-front')}"/>
        <path id="calves-front" d="M128 316h26v14h-26zM166 316h26v14h-26z" class="${regionClass('calves-front')}"/>
      </g>
      <g class="anatomy-panel anatomy-panel--back" transform="translate(260 0)">
        <text x="120" y="24" class="anatomy-label">Trasera</text>
        <path d="M110 58c10 14 26 21 40 21s30-7 40-21c10 13 17 29 20 48l-17 6-11 28v109H118V140l-11-28-17-6c3-19 10-35 20-48z" class="body-outline"/>
        <path id="traps-back" d="M132 84c8 9 17 13 18 13s10-4 18-13c8 9 13 18 15 28-12 8-23 12-33 12s-22-4-33-12c2-10 7-19 15-28z" class="${regionClass('traps-back')}"/>
        <path id="deltoids-back" d="M116 104c9-11 18-16 26-16 7 0 14 3 20 10-6 10-13 16-21 19-9-3-17-7-25-13z" class="${regionClass('deltoids-back')}"/>
        <path id="lats-back" d="M132 124c12-4 24-4 36 0 7 16 10 32 11 47h-58c1-15 4-31 11-47z" class="${regionClass('lats-back')}"/>
        <path id="lower-back-back" d="M136 170h24v46h-24z" class="${regionClass('lower-back-back')}"/>
        <path id="triceps-back" d="M106 145h24v50h-24zM192 145h24v50h-24z" class="${regionClass('triceps-back')}"/>
        <path id="forearms-front" d="M100 196h18v58h-18zM202 196h18v58h-18z" class="${regionClass('forearms-front')}"/>
        <path id="glutes-back" d="M136 216c8 7 16 11 24 11s16-4 24-11c6 10 8 22 8 33-11 8-23 12-32 12s-21-4-32-12c0-11 2-23 8-33z" class="${regionClass('glutes-back')}"/>
        <path id="hamstrings-back" d="M132 246h22v70h-22zM166 246h22v70h-22z" class="${regionClass('hamstrings-back')}"/>
        <path id="calves-back" d="M128 316h26v14h-26zM166 316h26v14h-26z" class="${regionClass('calves-back')}"/>
      </g>
    </svg>
  `;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Wger error: ${response.status}`);
  return response.json();
}

async function loadMuscleCatalog(config = {}, options = {}) {
  const urls = buildMuscleUrls(config);
  let cursor = urls[0];
  const muscles = [];
  const visited = new Set();
  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    const payload = await fetchJson(cursor, { signal: options.signal });
    muscles.push(...(Array.isArray(payload?.results) ? payload.results : []));
    if (!payload?.next) break;
    cursor = payload.next;
    if (cursor && cursor.startsWith('/')) cursor = `${normalizeBaseUrl(config.baseUrl)}${cursor}`;
  }
  return buildMuscleCatalogMap({ results: muscles });
}

const muscleCatalogCache = new Map();
let muscleCatalogPromise = null;

async function getMuscleCatalog(config = {}, options = {}) {
  const cacheKey = `${normalizeBaseUrl(config.baseUrl)}::${normalizeLanguage(config.language)}`;
  if (muscleCatalogCache.has(cacheKey)) return muscleCatalogCache.get(cacheKey);
  if (!muscleCatalogPromise) {
    muscleCatalogPromise = loadMuscleCatalog(config, options)
      .then((catalog) => {
        muscleCatalogCache.set(cacheKey, catalog);
        return catalog;
      })
      .finally(() => {
        muscleCatalogPromise = null;
      });
  }
  return muscleCatalogPromise;
}

function resolveMuscleNames(exercise, catalog = {}) {
  return collectMuscleIds(exercise)
    .map((id) => catalog[id])
    .filter(Boolean);
}

function resolveAnatomyRegions(muscleNames = []) {
  return mapMuscleNamesToRegions(muscleNames);
}

async function searchExerciseAnatomy(exerciseName, config = {}, options = {}) {
  const query = String(exerciseName || '').trim();
  if (!query) return null;

  const urls = buildCandidateSearchUrls(query, config);
  let lastError = null;

  for (const url of urls) {
    try {
      const payload = await fetchJson(url, { signal: options.signal });
      const exercise = extractExerciseRecord(payload);
      if (!exercise) continue;

      const catalog = await getMuscleCatalog(config, options).catch(() => ({}));
      const targetMuscles = resolveMuscleNames(exercise, catalog);
      const secondaryMuscles = resolveMuscleNames({ muscles: exercise.muscles_secondary || exercise.secondary_muscles }, catalog);
      const targetRegions = resolveAnatomyRegions(targetMuscles);
      const secondaryRegions = resolveAnatomyRegions(secondaryMuscles).filter((region) => !targetRegions.includes(region));
      const primaryLabel = targetMuscles[0] || String(exercise.name || query);
      const regionSummary = [...new Set([...targetRegions, ...secondaryRegions])].map(getRegionLabel).filter(Boolean).slice(0, 4);
      const subtitleParts = [];
      if (secondaryMuscles.length) subtitleParts.push(`Secundarios: ${secondaryMuscles.slice(0, 3).join(', ')}`);
      if (regionSummary.length) subtitleParts.push(`Áreas: ${regionSummary.join(', ')}`);
      const subtitle = subtitleParts.join(' · ');

      return {
        source: 'wger',
        query,
        exercise,
        targetMuscles,
        secondaryMuscles,
        targetRegions,
        secondaryRegions,
        primaryLabel,
        subtitle,
        svgMarkup: buildExerciseAnatomyMarkup({
          primaryRegions: targetRegions,
          secondaryRegions,
          title: primaryLabel,
          subtitle,
        }),
        updatedAt: Date.now(),
        searchUrl: url,
      };
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) throw lastError;
  return null;
}

function escapeSvg(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

exports.DEFAULT_WGER_CONFIG = DEFAULT_WGER_CONFIG;
exports.ANATOMY_REGION_LABELS = ANATOMY_REGION_LABELS;
exports.buildExerciseAnatomyMarkup = buildExerciseAnatomyMarkup;
exports.resolveAnatomyRegions = resolveAnatomyRegions;
exports.searchExerciseAnatomy = searchExerciseAnatomy;

