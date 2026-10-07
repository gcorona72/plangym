<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$db/database';
  import { routeParams, navigate } from '$stores/navigation';
  import { restTimer } from '$lib/gym/restTimer';
  import { computeRest } from '$lib/gym/adaptiveRest';
  import { buildSetPlan } from '$lib/training/setPlan';
  import { getLoadSteps, stepsFromSettings, type LoadSteps } from '$lib/training/loadSteps';
  import { fromDateKey, isoDayOfWeek, addDays } from '$lib/dateUtils';
  import { suggestWeight, type WeightSuggestion } from '$lib/training/weightSuggestion';
  import { computeCycleStatus, applyDeloadToPlanned } from '$lib/training/cycle';
  import { profile } from '$stores/profile';
  import RestTimerBar from './RestTimerBar.svelte';
  import SetInput from './SetInput.svelte';
  import MuscleMap from './MuscleMap.svelte';
  import { openExercise } from '$stores/exerciseModal';
  import type {
    TrainingProgram, TrainingDay, Exercise, ExerciseModality,
    WorkoutSession, WorkoutSessionExercise, WorkoutSet, PlannedExercise
  } from '$lib/types';

  let program: TrainingProgram | null = null;
  let day: TrainingDay | null = null;
  let modality: ExerciseModality = 'gym';
  let exercises: Exercise[] = [];
  let exercisesById = new Map<string, Exercise>();

  let session: WorkoutSession | null = null;
  let suggestions = new Map<string, WeightSuggestion>();

  let saving = false;
  let isDeloadWeek = false;
  /** Fecha (yyyy-mm-dd) a la que se imputa esta sesión. */
  let sessionDate = '';
  /** true si se está registrando un entreno de un día pasado. */
  let isBackfill = false;
  /**
   * finishedAt que tenía la sesión al abrirla. Al autoguardar se conserva:
   * entrar a corregir la sesión de hoy no debe dejarla "a medias" si luego
   * no se vuelve a pulsar Finalizar.
   */
  let originalFinishedAt: string | null = null;
  /** La sesión ya existe en la BBDD (retomada o autoguardada). */
  let persisted = false;
  /** Saltos de peso del gimnasio (Ajustes → Gym). */
  let loadSteps: LoadSteps = stepsFromSettings(null);
  /**
   * Si se empieza HOY un entreno que no es el de hoy y ese mismo entreno quedó
   * sin hacer un día de la última semana, se ofrece apuntarlo a ese día
   * (p. ej. el torso del lunes hecho el martes cuenta como el del lunes).
   */
  let recoveryCandidate: { date: string; label: string; weekday: string } | null = null;

  onMount(async () => {
    const params = $routeParams;
    loadSteps = await getLoadSteps();
    modality = params.modality === 'calisthenics' ? 'calisthenics' : 'gym';

    program = (await db.programs.filter(p => p.active).first()) ?? null;
    if (!program) return;

    day = program.days.find(d => d.id === params.dayId) ?? null;
    if (!day) return;

    const allEx = await db.exercises.toArray();
    exercisesById = new Map(allEx.map(e => [e.id, e]));

    // Si estamos en semana de deload, reducimos series y ajustamos RIR del plan
    const cycle = computeCycleStatus($profile?.cycleStartDate);
    isDeloadWeek = cycle.isDeloadWeek;
    const rawPlanned = modality === 'gym' ? day.gymExercises : day.calisthenicsExercises;
    const planned = isDeloadWeek ? rawPlanned.map(applyDeloadToPlanned) : rawPlanned;

    // Mutamos el día en memoria para que getPlanned() devuelva el ajustado
    if (isDeloadWeek) {
      if (modality === 'gym') day.gymExercises = planned;
      else day.calisthenicsExercises = planned;
    }

    // Fecha de la sesión: la del día del plan que se está registrando.
    // Si viene `date` por parámetro (recuperar un entreno de un día pasado),
    // se usa esa; si no, hoy. Así el entreno del martes recuperado el
    // miércoles queda registrado EN EL MARTES y ese día deja de estar pendiente.
    const today = new Date().toISOString().split('T')[0];
    sessionDate = typeof params.date === 'string' && params.date ? params.date : today;
    isBackfill = sessionDate !== today;

    // Si ya había una sesión guardada ese día, la retomamos (permite terminar
    // un entreno a medias o recuperar un día marcado como ausencia).
    // Un día tiene como mucho UNA sesión: preferimos la del mismo plan, pero
    // si lo que hay es un marcador de ausencia (sin series) lo reutilizamos
    // aunque el plan del día haya cambiado — así nunca quedan dos registros
    // para la misma fecha.
    const sameDate = await db.sessions.where('date').equals(sessionDate).toArray();
    const existing =
      sameDate.find(s => s.dayId === day!.id && s.modality === modality) ??
      sameDate.find(s => s.missed && s.exercises.every(e => e.sets.length === 0));

    session = existing ?? {
      id: `sess_${Date.now()}`,
      date: sessionDate,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      programId: program.id,
      dayId: day.id,
      modality,
      exercises: planned.map(p => ({
        exerciseId: p.exerciseId,
        sets: [],
        skipped: false
      }))
    };
    // Si la sesión retomada no tiene entradas para algún ejercicio del plan
    // (p.ej. el plan cambió), las añadimos vacías.
    if (existing) {
      persisted = true;
      originalFinishedAt = existing.missed ? null : existing.finishedAt;
      for (const p of planned) {
        if (!session.exercises.some(e => e.exerciseId === p.exerciseId)) {
          session.exercises.push({ exerciseId: p.exerciseId, sets: [], skipped: false });
        }
      }
      // Una sesión pasada YA finalizada no se reabre (el historial no se toca).
      // Solo se marca "en curso" si es de hoy o si estaba a medias.
      if (!isBackfill || !existing.finishedAt) {
        session.finishedAt = null;
      }
      // Si el día estaba marcado como ausencia y ahora se registra el entreno,
      // deja de serlo (recuperar la sesión gana sobre la marca).
      // Salvaguarda de integridad: si por una carrera de sincronización entre
      // dispositivos lo que hay es un marcador de ausencia, registrar el
      // entreno manda — se reutiliza el registro (un día = una sesión).
      if (existing.missed) {
        session.missed = false;
        session.missedReason = undefined;
        session.dayId = day.id;
        session.modality = modality;
        session.startedAt = new Date().toISOString();
      }
    }

    // Sugerencias de peso. Se calculan ya con la sesión decidida: si se retoma
    // un entreno autoguardado a medias, no puede ser su propia referencia.
    if (modality === 'gym') {
      const excludeSessionId = session.id;
      const sugs = await Promise.all(planned.map(p => suggestWeight(p.exerciseId, p, undefined, { excludeSessionId })));
      suggestions = new Map(planned.map((p, i) => [p.exerciseId, sugs[i]]));
    }

    // ¿Es la recuperación de un día pendiente? Sólo si se empezó sin fecha
    // (desde Entreno), no es el entreno que toca hoy y aún no hay nada hecho.
    const todayPlan = program.days[isoDayOfWeek(fromDateKey(today))];
    const nothingLogged = !session.exercises.some(e => e.sets.length > 0);
    if (!params.date && todayPlan?.id !== day.id && nothingLogged) {
      for (let back = 1; back <= 7; back++) {
        const d = addDays(fromDateKey(today), -back);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (program.days[isoDayOfWeek(d)]?.id !== day.id) continue;
        const onDay = await db.sessions.where('date').equals(key).toArray();
        // Días ya entrenados o marcados como ausencia están cerrados
        if (onDay.some(x => x.missed || (x.finishedAt && x.exercises.some(e => e.sets.length > 0)))) break;
        recoveryCandidate = {
          date: key,
          label: d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }).replace(',', ''),
          weekday: d.toLocaleDateString('es-ES', { weekday: 'long' })
        };
        break;
      }
    }
  });

  /** Apunta este entreno al día pendiente en lugar de a hoy. */
  async function assignToRecoveryDay() {
    if (!recoveryCandidate || !session || !day) return;
    const target = recoveryCandidate.date;
    // Si ese día tenía un borrador vacío o a medias de este mismo plan, se reutiliza su id
    const onTarget = await db.sessions.where('date').equals(target).toArray();
    const prev = onTarget.find(x => x.dayId === day!.id && !x.missed);
    if (persisted && prev && prev.id !== session.id) await db.sessions.delete(session.id);
    if (prev) {
      session.id = prev.id;
      for (const e of prev.exercises) {
        const mine = session.exercises.find(m => m.exerciseId === e.exerciseId);
        if (mine && mine.sets.length === 0) mine.sets = e.sets;
      }
    }
    sessionDate = target;
    session.date = target;
    isBackfill = true;
    recoveryCandidate = null;
    session = session;
    await autosave();
  }

  function getPlanned(exerciseId: string): PlannedExercise | undefined {
    if (!day) return;
    return (modality === 'gym' ? day.gymExercises : day.calisthenicsExercises).find(p => p.exerciseId === exerciseId);
  }

  /**
   * AUTOGUARDADO. Cada serie se guarda en el momento: si el iPhone cierra la
   * app en segundo plano o la app se actualiza a mitad del entreno, no se
   * pierde nada y se puede continuar. (Antes todo vivía en memoria hasta
   * pulsar "Finalizar" y una recarga borraba el entreno entero.)
   */
  async function autosave() {
    if (!session) return;
    const hasSets = session.exercises.some(e => e.sets.length > 0);
    if (!hasSets && !persisted) return; // no crear registros vacíos
    try {
      await db.sessions.put({
        ...session,
        date: sessionDate || session.date,
        finishedAt: session.finishedAt ?? originalFinishedAt
      });
      persisted = true;
    } catch (e) {
      console.error('Autoguardado fallido', e);
    }
  }

  function logSet(exerciseId: string, reps: number, weightKg: number | undefined, rir: number | undefined) {
    if (!session) return;
    const ex = session.exercises.find(e => e.exerciseId === exerciseId);
    if (!ex) return;

    const newSet: WorkoutSet = {
      setNumber: ex.sets.length + 1,
      reps,
      weightKg,
      rir,
      completedAt: new Date().toISOString()
    };
    ex.sets.push(newSet);
    session = session; // reactivity
    autosave();

    // Descanso adaptativo: según lo dura que haya sido la serie
    const planned = getPlanned(exerciseId);
    if (planned) {
      const rest = computeRest(planned, newSet, newSet.setNumber);
      restTimer.start(rest.seconds, rest.reason);
    }
  }

  function removeLastSet(exerciseId: string) {
    if (!session) return;
    const ex = session.exercises.find(e => e.exerciseId === exerciseId);
    if (!ex || ex.sets.length === 0) return;
    ex.sets.pop();
    session = session;
    autosave();
  }

  async function finishSession() {
    if (!session) return;
    const totalSets = session.exercises.reduce((a, e) => a + e.sets.length, 0);
    if (totalSets === 0) {
      alert('No has registrado ninguna serie. Registra al menos una para poder terminar (así queda constancia para la próxima sesión).');
      return;
    }
    saving = true;
    session.finishedAt = new Date().toISOString();
    // Aseguramos que la fecha sigue siendo la del día del plan (no la de hoy)
    session.date = sessionDate || session.date;
    await db.sessions.put(session);
    restTimer.stop();
    saving = false;
    navigate('dashboard');
  }

  /** Guarda el progreso sin marcar la sesión como terminada. */
  async function saveDraft() {
    if (!session) return;
    saving = true;
    session.finishedAt = null;
    session.date = sessionDate || session.date;
    await db.sessions.put(session);
    saving = false;
    navigate('dashboard');
  }

  /** Salir sin finalizar: lo registrado ya está guardado y se puede continuar. */
  function cancelSession() {
    const hasSets = session?.exercises.some(e => e.sets.length > 0);
    if (!hasSets || confirm('Tus series ya están guardadas. ¿Salir sin finalizar? Podrás continuar luego desde el inicio.')) {
      restTimer.stop();
      navigate('dashboard');
    }
  }
</script>

<RestTimerBar />

<div class="px-5 pt-8 max-w-2xl mx-auto md:max-w-4xl" class:pt-20={$restTimer.running}>
  {#if day && session}
    <header class="mb-4">
      <button class="text-sm text-slate-500 mb-2" on:click={cancelSession}>← Salir</button>
      <h1 class="text-2xl font-bold">{day.name}</h1>
      <p class="text-slate-500 text-sm">{modality === 'gym' ? '🏋️ Versión gym' : '🤸 Versión calistenia'}</p>
    </header>

    {#if recoveryCandidate}
      <div class="card mb-3 ring-2 ring-primary-300 bg-primary-50">
        <div class="flex items-start gap-2">
          <span class="text-2xl">🔁</span>
          <div class="text-sm flex-1">
            <div class="font-bold text-primary-800">¿Recuperas el entreno del {recoveryCandidate.label}?</div>
            <p class="text-primary-700 mt-0.5 text-xs">
              Hoy no toca {day.name}, pero quedó sin hacer el {recoveryCandidate.label}.
              Si es eso, lo apunto a ese día y dejará de salir como no hecho.
            </p>
            <div class="grid grid-cols-2 gap-2 mt-2">
              <button class="btn-primary py-2 text-xs" on:click={assignToRecoveryDay}>Sí, apúntalo al {recoveryCandidate.weekday}</button>
              <button class="btn-secondary py-2 text-xs" on:click={() => (recoveryCandidate = null)}>No, es de hoy</button>
            </div>
          </div>
        </div>
      </div>
    {/if}

    {#if isBackfill}
      <div class="card mb-3 ring-2 ring-amber-300 bg-amber-50">
        <div class="flex items-start gap-2">
          <span class="text-2xl">🗓️</span>
          <div class="text-sm">
            <div class="font-bold text-amber-800">Recuperando el entreno del {new Date(sessionDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            <p class="text-amber-700 mt-0.5 text-xs">
              Los datos se guardarán en ese día, no en hoy. Así tu seguimiento queda correcto.
            </p>
          </div>
        </div>
      </div>
    {/if}

    {#if isDeloadWeek}
      <div class="card mb-3 ring-2 ring-orange-300 bg-orange-50">
        <div class="flex items-start gap-2">
          <span class="text-2xl">🔻</span>
          <div class="text-sm">
            <div class="font-bold text-orange-800">Semana de descarga</div>
            <p class="text-orange-700 mt-0.5 text-xs">
              Series reducidas un 40%, RIR mínimo 3. Mismo peso pero deja claras reservas — esta semana es para recuperar, no para PRs.
            </p>
          </div>
        </div>
      </div>
    {/if}

    {#each (modality === 'gym' ? day.gymExercises : day.calisthenicsExercises) as planned, idx (planned.exerciseId)}
      {@const ex = exercisesById.get(planned.exerciseId)}
      {@const setsDone = session.exercises.find(e => e.exerciseId === planned.exerciseId)?.sets.length ?? 0}
      {@const sug = suggestions.get(planned.exerciseId)}
      {@const plan = ex && modality === 'gym' ? buildSetPlan(ex, planned, sug?.weightKg ?? null, idx, loadSteps) : null}
      {@const isFinalSet = !!plan && setsDone === planned.sets - 1}
      {#if ex}
        <div class="card mb-3">
          <div class="flex items-start gap-3 mb-2">
            <!-- Mini diagrama anatómico (tap para abrir detalle) -->
            <button class="shrink-0 w-16 active:scale-95" on:click={() => openExercise(ex)}>
              <MuscleMap primary={ex.primaryMuscles} secondary={ex.secondaryMuscles} size="small" />
            </button>
            <div class="flex-1 min-w-0">
              <button class="font-bold text-left flex items-center gap-1.5 active:opacity-70" on:click={() => openExercise(ex)}>
                {ex.name}
                <span class="text-xs text-primary-400">ℹ️</span>
              </button>
              <div class="text-xs text-slate-500 mt-0.5">
                {planned.sets} series × {planned.repsMin}-{planned.repsMax} reps
                {#if planned.targetRIR != null} · RIR {planned.targetRIR}{/if}
              </div>
            </div>
            <div class="text-xs px-2 py-1 rounded-full"
                 class:bg-accent-600={setsDone >= planned.sets}
                 class:text-white={setsDone >= planned.sets}
                 class:bg-slate-100={setsDone < planned.sets}>
              {setsDone}/{planned.sets}
            </div>
          </div>

          <!-- 📊 Última sesión (sobrecarga progresiva) — serie por serie -->
          {#if sug?.lastSession}
            <div class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-2 text-xs">
              <div class="flex items-center justify-between mb-1.5">
                <span class="font-bold text-slate-700">Última sesión</span>
                <span class="text-slate-400 text-[10px]">
                  {new Date(sug.lastSession.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </div>
              {#if sug.lastSession.sets && sug.lastSession.sets.length > 0}
                <div class="flex flex-wrap gap-1">
                  {#each sug.lastSession.sets as set, i}
                    <span class="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-md px-1.5 py-0.5 font-mono">
                      <span class="text-slate-400">{i + 1}</span>
                      {#if set.weightKg != null}<span class="font-bold text-slate-800">{set.weightKg}kg</span>{/if}
                      <span class="text-slate-600">×{set.reps}</span>
                      {#if set.rir != null}<span class="text-slate-400">·R{set.rir}</span>{/if}
                    </span>
                  {/each}
                </div>
              {:else}
                <div class="text-slate-600 font-mono">
                  {#if sug.lastSession.workingWeightKg}{sug.lastSession.workingWeightKg}kg · {/if}{sug.lastSession.maxReps} reps · {sug.lastSession.setsDone} series
                </div>
              {/if}
            </div>
          {/if}

          <!-- 💡 Sugerencia (con codificación por estado) -->
          {#if sug}
            <div class="rounded-lg px-3 py-2 mb-2 text-xs font-medium"
                 class:bg-emerald-50={sug.status === 'suggest_up' || sug.status === 'progress_variant' || sug.status === 'add_reps'}
                 class:text-emerald-800={sug.status === 'suggest_up' || sug.status === 'progress_variant' || sug.status === 'add_reps'}
                 class:bg-orange-50={sug.status === 'cns_fatigue'}
                 class:text-orange-800={sug.status === 'cns_fatigue'}
                 class:bg-red-50={sug.status === 'suggest_down'}
                 class:text-red-800={sug.status === 'suggest_down'}
                 class:bg-primary-50={sug.status === 'maintain'}
                 class:text-primary-800={sug.status === 'maintain'}
                 class:bg-slate-50={sug.status === 'no_history'}
                 class:text-slate-700={sug.status === 'no_history'}>
              {sug.reasoning}
            </div>
          {/if}

          <!-- 🗺️ Plan de series: calentamiento → series de trabajo → serie final -->
          {#if plan && setsDone < planned.sets}
            <div class="rounded-lg border border-slate-200 px-3 py-2 mb-2 text-xs space-y-1.5">
              {#if plan.warmups.length > 0 && setsDone === 0}
                <div class="flex items-start gap-2">
                  <span class="shrink-0">🔥</span>
                  <div>
                    <span class="font-semibold text-slate-700">Calentamiento</span>
                    <span class="text-slate-400">(no lo registres)</span>
                    <div class="font-mono text-slate-600 mt-0.5">
                      {plan.warmups.map(w => `${w.weightKg}kg×${w.reps}`).join(' → ')}
                    </div>
                  </div>
                </div>
              {/if}
              {#if plan.workingWeightKg != null}
                <div class="flex items-start gap-2" class:opacity-50={isFinalSet}>
                  <span class="shrink-0">💪</span>
                  <div>
                    <span class="font-semibold text-slate-700">
                      {plan.workingSets === 1 ? 'Serie 1' : `Series 1-${plan.workingSets}`}:
                    </span>
                    <span class="font-mono text-slate-800">{plan.workingWeightKg} kg</span>
                    <span class="text-slate-500">· {plan.repsMin}-{plan.repsMax} reps</span>
                  </div>
                </div>
              {/if}
              <div class="flex items-start gap-2 rounded-md -mx-1 px-1 py-0.5"
                   class:bg-orange-50={isFinalSet}>
                <span class="shrink-0">🎯</span>
                <div class="text-slate-600" class:text-orange-800={isFinalSet}>
                  <span class="font-semibold text-slate-700" class:text-orange-800={isFinalSet}>
                    {plan.finalIsHeavier ? `Serie ${planned.sets} (final):` : 'Última serie:'}
                  </span>
                  {plan.finalCue}
                </div>
              </div>
            </div>
          {/if}

          {#if ex.cues && ex.cues.length > 0}
            <div class="text-xs text-slate-500 italic mb-2">{ex.cues.join(' · ')}</div>
          {/if}

          <!-- Series registradas -->
          {#if setsDone > 0}
            <div class="space-y-1 mb-3">
              {#each session.exercises.find(e => e.exerciseId === planned.exerciseId)?.sets ?? [] as set}
                <div class="flex items-center gap-3 text-sm bg-slate-100 rounded-lg px-3 py-1.5">
                  <span class="font-bold text-slate-500 w-6">#{set.setNumber}</span>
                  {#if set.weightKg != null}
                    <span class="text-slate-800">{set.weightKg}kg</span>
                  {/if}
                  <span class="text-slate-800">× {set.reps}</span>
                  {#if set.rir != null}
                    <span class="text-slate-500 text-xs ml-auto">RIR {set.rir}</span>
                  {/if}
                </div>
              {/each}
              <button class="text-xs text-red-400" on:click={() => removeLastSet(planned.exerciseId)}>↶ Borrar última</button>
            </div>
          {/if}

          <!-- Formulario rápido para registrar nueva serie -->
          {#if setsDone < planned.sets}
            <SetInput
              exerciseId={planned.exerciseId}
              planned={planned}
              suggestedWeight={(isFinalSet && plan?.finalIsHeavier ? plan.finalWeightKg : plan?.workingWeightKg ?? sug?.weightKg) ?? undefined}
              suggestedLabel={isFinalSet && plan?.finalIsHeavier ? '🎯 Serie final' : '💡 Sugerido'}
              lastSessionWeight={sug?.lastSession?.workingWeightKg ?? undefined}
              isCalisthenics={modality === 'calisthenics'}
              on:log={(e) => logSet(planned.exerciseId, e.detail.reps, e.detail.weightKg, e.detail.rir)}
            />
          {:else}
            <div class="text-center text-accent-400 text-sm font-semibold py-2">✓ Ejercicio completado</div>
          {/if}
        </div>
      {/if}
    {/each}

    <button class="btn-accent w-full mt-6" disabled={saving} on:click={finishSession}>
      {saving ? 'Guardando…' : '✅ Finalizar entreno'}
    </button>
    <button class="btn-secondary w-full mt-2 mb-4 text-sm" disabled={saving} on:click={saveDraft}>
      💾 Guardar y seguir luego
    </button>
    <p class="text-[10px] text-slate-400 text-center mb-4">
      Cada serie se guarda al momento. El día seguirá <b>pendiente</b> hasta que finalices.
    </p>
  {:else}
    <p class="text-center text-slate-500 py-12">Cargando…</p>
  {/if}
</div>
