<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$db/database';
  import { routeParams, navigate } from '$stores/navigation';
  import { restTimer } from '$lib/gym/restTimer';
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

  onMount(async () => {
    const params = $routeParams;
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

    // Cargar sugerencias de peso en paralelo
    if (modality === 'gym') {
      const sugs = await Promise.all(planned.map(p => suggestWeight(p.exerciseId, p)));
      suggestions = new Map(planned.map((p, i) => [p.exerciseId, sugs[i]]));
    }

    // Mutamos el día en memoria para que getPlanned() devuelva el ajustado
    if (isDeloadWeek) {
      if (modality === 'gym') day.gymExercises = planned;
      else day.calisthenicsExercises = planned;
    }

    // Iniciar sesión
    const today = new Date().toISOString().split('T')[0];
    session = {
      id: `sess_${Date.now()}`,
      date: today,
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
  });

  function getPlanned(exerciseId: string): PlannedExercise | undefined {
    if (!day) return;
    return (modality === 'gym' ? day.gymExercises : day.calisthenicsExercises).find(p => p.exerciseId === exerciseId);
  }

  function getSetCount(exerciseId: string): number {
    return session?.exercises.find(e => e.exerciseId === exerciseId)?.sets.length ?? 0;
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

    // Iniciar timer de descanso
    const planned = getPlanned(exerciseId);
    if (planned) restTimer.start(planned.restSeconds);
  }

  function removeLastSet(exerciseId: string) {
    if (!session) return;
    const ex = session.exercises.find(e => e.exerciseId === exerciseId);
    if (!ex || ex.sets.length === 0) return;
    ex.sets.pop();
    session = session;
  }

  async function finishSession() {
    if (!session) return;
    saving = true;
    session.finishedAt = new Date().toISOString();
    await db.sessions.put(session);
    restTimer.stop();
    saving = false;
    navigate('dashboard');
  }

  function cancelSession() {
    if (confirm('¿Cancelar sesión? Se perderán los datos no guardados.')) {
      restTimer.stop();
      navigate('dashboard');
    }
  }
</script>

<RestTimerBar />

<div class="px-5 pt-8 max-w-2xl mx-auto md:max-w-4xl" class:pt-20={$restTimer.running}>
  {#if day && session}
    <header class="mb-4">
      <button class="text-sm text-slate-500 mb-2" on:click={cancelSession}>← Cancelar</button>
      <h1 class="text-2xl font-bold">{day.name}</h1>
      <p class="text-slate-500 text-sm">{modality === 'gym' ? '🏋️ Versión gym' : '🤸 Versión calistenia'}</p>
    </header>

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

    {#each (modality === 'gym' ? day.gymExercises : day.calisthenicsExercises) as planned (planned.exerciseId)}
      {@const ex = exercisesById.get(planned.exerciseId)}
      {@const setsDone = getSetCount(planned.exerciseId)}
      {@const sug = suggestions.get(planned.exerciseId)}
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
              suggestedWeight={sug?.weightKg ?? undefined}
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

    <button class="btn-accent w-full mt-6 mb-4" disabled={saving} on:click={finishSession}>
      {saving ? 'Guardando…' : '✅ Finalizar entreno'}
    </button>
  {:else}
    <p class="text-center text-slate-500 py-12">Cargando…</p>
  {/if}
</div>
