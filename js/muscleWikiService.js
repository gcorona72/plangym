const DEFAULT_MUSCLEWIKI_CONFIG = {
  baseUrl: 'https://musclewiki.p.rapidapi.com',
  rapidApiHost: 'musclewiki.p.rapidapi.com',
  searchPaths: [
    '/exercises/name/{query}',
    '/exercise/name/{query}',
    '/exercises/{query}',
    '/exercise/{query}',
    '/exercises/search',
    '/search',
    '/exercise/search',
  ],
  timeoutMs: 12000,
};

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_MUSCLEWIKI_CONFIG.baseUrl).trim().replace(/\/$/, '');
}

function normalizeRapidApiHost(value) {
  return String(value || DEFAULT_MUSCLEWIKI_CONFIG.rapidApiHost).trim();
}

function resolveMediaUrl(rawUrl, baseUrl) {
  const url = String(rawUrl || '').trim();
  if (!url) return '';

  try {
    return new URL(url, normalizeBaseUrl(baseUrl)).href;
  } catch {
    return url;
  }
}

function buildSearchUrl(query, config = {}, searchPath = '') {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const encodedQuery = encodeURIComponent(String(query || '').trim());
  const params = new URLSearchParams();
  params.set('query', String(query || '').trim());
  params.set('name', String(query || '').trim());
  params.set('term', String(query || '').trim());

  if (searchPath.includes('{query}')) {
    return `${baseUrl}${searchPath.replace('{query}', encodedQuery)}`;
  }

  return `${baseUrl}${searchPath}${searchPath.includes('?') ? '&' : '?'}${params.toString()}`;
}

function buildCandidateSearchUrls(query, config = {}) {
  const configuredPaths = Array.isArray(config.searchPaths) && config.searchPaths.length ? config.searchPaths : DEFAULT_MUSCLEWIKI_CONFIG.searchPaths;
  return configuredPaths.map((searchPath) => buildSearchUrl(query, config, searchPath));
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

function extractMediaUrl(exercise) {
  const mediaKeys = ['videoUrl', 'video_url', 'mediaUrl', 'media_url', 'gifUrl', 'gif_url', 'imageUrl', 'image_url', 'thumbnailUrl', 'thumbnail_url', 'src', 'source', 'url'];
  const visited = new Set();

  const looksLikeMediaUrl = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return false;
    if (/^(https?:)?\/\//i.test(normalized) || /^\//.test(normalized) || /^\.?\.?\//.test(normalized)) return true;
    return /\.(gif|webm|mp4|mov|ogg|jpg|jpeg|png|svg)(\?|#|$)/i.test(normalized);
  };

  const visit = (value) => {
    if (!value || typeof value !== 'object') return '';
    if (visited.has(value)) return '';
    visited.add(value);

    for (const key of mediaKeys) {
      const candidate = value[key];
      if (typeof candidate === 'string' && looksLikeMediaUrl(candidate)) return candidate.trim();
    }

    for (const candidate of Object.values(value)) {
      if (typeof candidate === 'string' && looksLikeMediaUrl(candidate)) return candidate.trim();
      if (candidate && typeof candidate === 'object') {
        const nested = visit(candidate);
        if (nested) return nested;
      }
    }

    return '';
  };

  if (!exercise || typeof exercise !== 'object') return '';
  return visit(exercise);
}

function inferMediaType(mediaUrl, exercise = null) {
  const normalized = String(mediaUrl || '').trim().toLowerCase();
  if (!normalized) return 'unknown';
  if (/\.gif(\?|#|$)/i.test(normalized) || String(exercise?.mediaType || exercise?.type || '').toLowerCase() === 'gif') return 'image';
  if (/\.(webm|mp4|mov|ogg)(\?|#|$)/i.test(normalized) || String(exercise?.mediaType || exercise?.type || '').toLowerCase() === 'video') return 'video';
  return 'video';
}

function extractInstructions(exercise) {
  if (!exercise || typeof exercise !== 'object') return '';
  const instructions = exercise.instructions || exercise.steps || exercise.description || exercise.notes || '';
  if (Array.isArray(instructions)) return instructions.filter(Boolean).map((step) => String(step).trim()).join(' · ');
  return String(instructions || '').trim();
}

async function searchExerciseMedia(exerciseName, config = {}, options = {}) {
  const query = String(exerciseName || '').trim();
  const rapidApiKey = String(config.rapidApiKey || '').trim();
  if (!query || !rapidApiKey) return null;

  const headers = {
    'X-RapidAPI-Key': rapidApiKey,
    'X-RapidAPI-Host': normalizeRapidApiHost(config.rapidApiHost),
  };

  const urls = buildCandidateSearchUrls(query, config);
  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers,
        signal: options.signal,
      });

      if (!response.ok) {
        lastError = new Error(`MuscleWiki error: ${response.status}`);
        continue;
      }

      const payload = await response.json();
      const exercise = extractExerciseRecord(payload);
      const mediaUrl = resolveMediaUrl(extractMediaUrl(exercise), config.baseUrl);
      if (!mediaUrl) continue;

      return {
        source: 'musclewiki',
        query,
        mediaUrl,
        mediaType: inferMediaType(mediaUrl, exercise),
        instructions: extractInstructions(exercise),
        exercise,
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

exports.DEFAULT_MUSCLEWIKI_CONFIG = DEFAULT_MUSCLEWIKI_CONFIG;
exports.searchExerciseMedia = searchExerciseMedia;

