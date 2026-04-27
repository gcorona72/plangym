const DEFAULT_EXERCISE_ANIMATION_CONFIG = {
  baseUrl: 'https://exercisedb.p.rapidapi.com',
  rapidApiHost: 'exercisedb.p.rapidapi.com',
  provider: 'exercisedb',
  searchPath: '/exercises/name/{apiTargetName}',
  timeoutMs: 12000,
  mockDelayMs: 350,
};

const muscleWikiService = typeof require === 'function'
  ? require('./muscleWikiService')
  : (typeof window !== 'undefined' && window.muscleWikiService) || { searchExerciseMedia: async () => null };

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_EXERCISE_ANIMATION_CONFIG.baseUrl).trim().replace(/\/$/, '');
}

function normalizeRapidApiHost(value) {
  return String(value || DEFAULT_EXERCISE_ANIMATION_CONFIG.rapidApiHost).trim();
}

function buildSearchUrl(apiTargetName, config = {}) {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const encoded = encodeURIComponent(String(apiTargetName || '').trim());
  const searchPath = String(config.searchPath || DEFAULT_EXERCISE_ANIMATION_CONFIG.searchPath);
  return `${baseUrl}${searchPath.replace('{apiTargetName}', encoded)}`;
}

function normalizeProvider(value) {
  const provider = String(value || DEFAULT_EXERCISE_ANIMATION_CONFIG.provider).trim().toLowerCase();
  if (provider === 'musclewiki' || provider === 'wger' || provider === 'local') return provider;
  return 'exercisedb';
}

function extractRecord(payload) {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload.find(Boolean) || null;
  if (payload.exercise && typeof payload.exercise === 'object') return payload.exercise;
  if (Array.isArray(payload.data)) return payload.data.find(Boolean) || null;
  if (Array.isArray(payload.results)) return payload.results.find(Boolean) || null;
  if (Array.isArray(payload.exercises)) return payload.exercises.find(Boolean) || null;
  return payload;
}

function extractGifUrl(record) {
  if (!record || typeof record !== 'object') return '';
  const keys = ['gifUrl', 'gif_url', 'animationUrl', 'animation_url', 'mediaUrl', 'media_url', 'src', 'url'];
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  for (const value of Object.values(record)) {
    if (value && typeof value === 'object') {
      const nested = extractGifUrl(value);
      if (nested) return nested;
    }
  }
  return '';
}

function extractExerciseName(record, fallback = '') {
  return String(record?.name || record?.exercise_name || record?.title || fallback || '').trim();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWgerAnimation(query, options = {}) {
  try {
    const searchUrl = buildSearchUrl(query, {
      baseUrl: 'https://wger.de/api/v2',
      searchPath: '/exerciseinfo/?search={apiTargetName}',
    });
    const response = await fetch(searchUrl, { signal: options.signal });
    if (!response.ok) return null;
    const payload = await response.json();
    const exercise = extractRecord(payload);
    const gifUrl = extractGifUrl(exercise);
    if (!gifUrl) return null;

    return {
      source: 'wger',
      apiTargetName: query,
      gifUrl,
      exercise: exercise ? { ...exercise, name: extractExerciseName(exercise, query) } : null,
      updatedAt: Date.now(),
      searchUrl,
      mocked: false,
    };
  } catch (err) {
    return null;
  }
}

async function fetchExerciseAnimation(apiTargetName, config = {}, options = {}) {
  const query = String(apiTargetName || '').trim();
  if (!query) return null;

  const provider = normalizeProvider(config.provider);
  const localGifUrl = String(config.localGifUrl || config.mockGifUrl || '').trim();

  if (provider === 'local') {
    return {
      source: 'local',
      apiTargetName: query,
      gifUrl: localGifUrl,
      exercise: null,
      updatedAt: Date.now(),
      searchUrl: '',
      mocked: true,
    };
  }

  if (provider === 'musclewiki') {
    const result = await muscleWikiService.searchExerciseMedia(query, {
      ...config,
      baseUrl: config.baseUrl || 'https://musclewiki.p.rapidapi.com',
      rapidApiHost: config.rapidApiHost || 'musclewiki.p.rapidapi.com',
    }, options);

    if (result) {
      return {
        source: 'musclewiki',
        apiTargetName: query,
        gifUrl: String(result.mediaUrl || result.gifUrl || ''),
        exercise: result.exercise || null,
        updatedAt: Date.now(),
        searchUrl: result.searchUrl || '',
        mocked: false,
      };
    }

    const wgerResult = await fetchWgerAnimation(query, options);
    if (wgerResult) return wgerResult;

    return {
      source: 'musclewiki',
      apiTargetName: query,
      gifUrl: localGifUrl,
      exercise: null,
      updatedAt: Date.now(),
      searchUrl: '',
      mocked: true,
    };
  }

  if (provider === 'wger') {
    const result = await fetchWgerAnimation(query, options);
    if (result) return result;

    return {
      source: 'wger',
      apiTargetName: query,
      gifUrl: localGifUrl,
      exercise: null,
      updatedAt: Date.now(),
      searchUrl: '',
      mocked: true,
    };
  }

  const searchUrl = buildSearchUrl(query, config);
  const rapidApiKey = String(config.rapidApiKey || '').trim();
  const gifFallback = localGifUrl;

  if (!rapidApiKey) {
    await delay(Number(config.mockDelayMs) || DEFAULT_EXERCISE_ANIMATION_CONFIG.mockDelayMs);
    return {
      source: 'exercisedb',
      apiTargetName: query,
      gifUrl: gifFallback,
      exercise: null,
      updatedAt: Date.now(),
      searchUrl,
      mocked: true,
    };
  }

  const response = await fetch(searchUrl, {
    headers: {
      'X-RapidAPI-Key': rapidApiKey,
      'X-RapidAPI-Host': normalizeRapidApiHost(config.rapidApiHost),
    },
    signal: options.signal,
  });

  if (!response.ok) throw new Error(`ExerciseDB error: ${response.status}`);

  const payload = await response.json();
  const exercise = extractRecord(payload);
  const gifUrl = extractGifUrl(exercise) || gifFallback;

  return {
    source: 'exercisedb',
    apiTargetName: query,
    gifUrl,
    exercise: exercise ? {
      ...exercise,
      name: extractExerciseName(exercise, query),
    } : null,
    updatedAt: Date.now(),
    searchUrl,
    mocked: false,
  };
}

exports.DEFAULT_EXERCISE_ANIMATION_CONFIG = DEFAULT_EXERCISE_ANIMATION_CONFIG;
exports.fetchExerciseAnimation = fetchExerciseAnimation;
