<script lang="ts">
  import { profile, saveProfile, goals } from '$stores/profile';
  import { exportAllData, importAllData, wipeAllData } from '$db/database';
  import { EQUIPMENT_CATALOG, EQUIPMENT_BY_CATEGORY } from '$lib/equipmentCatalog';
  import type { GymEquipmentId, ActivityLevel, Goal, DietType, Budget, TrainingPreference, TrainingProgram } from '$lib/types';
  import { SURPLUS_RANGE } from '$lib/nutrition/macros';
  import { navigate } from '$stores/navigation';
  import { onMount } from 'svelte';
  import { db } from '$db/database';
  import { syncState } from '$stores/sync';
  import { startAutoSync, stopAutoSync, pullFromCloud, checkCloudForPin, initialPush } from '$lib/cloudSync';

  let allPrograms: TrainingProgram[] = [];
  let activeProgramId: string = '';

  onMount(async () => {
    allPrograms = await db.programs.toArray();
    const active = allPrograms.find(p => p.active);
    activeProgramId = active?.id ?? '';
  });

  async function switchProgram(id: string) {
    if (!confirm('¿Cambiar al programa "' + (allPrograms.find(p => p.id === id)?.name ?? '') + '"?')) return;
    await db.transaction('rw', db.programs, async () => {
      for (const p of allPrograms) {
        await db.programs.update(p.id, { active: p.id === id });
      }
    });
    allPrograms = await db.programs.toArray();
    activeProgramId = id;
    alert('Programa cambiado ✓');
  }

  let activeTab: 'profile' | 'preferences' | 'equipment' | 'data' | 'sync' | 'about' = 'profile';

  // ─── SYNC ──────────────────────────────────────────────────────────────
  let syncPinInput: string = '';
  let syncBusy: boolean = false;
  let syncFeedback: string = '';

  async function enableSync() {
    if (syncPinInput.length < 6) {
      alert('El PIN debe tener al menos 6 caracteres (mejor 8+, letras y números)');
      return;
    }
    syncBusy = true;
    syncFeedback = '';
    try {
      // Comprobar si ya hay datos en la nube con este PIN
      const check = await checkCloudForPin(syncPinInput);
      if (check === 'error') {
        syncFeedback = '❌ Error al conectar con el servidor de sync';
        syncBusy = false;
        return;
      }

      if (check === 'has_data') {
        const confirmReplace = confirm(
          '⚠️ Ya hay datos en la nube con este PIN.\n\n' +
          '¿Quieres SOBRESCRIBIR tus datos locales con los de la nube?\n\n' +
          'Si dices SÍ → tus datos locales actuales se perderán y se reemplazan por los de la nube.\n' +
          'Si dices NO → tus datos locales SOBRESCRIBIRÁN los de la nube en cuanto actives sync.'
        );
        syncState.enable(syncPinInput);
        if (confirmReplace) {
          // Pull forzado: descarga la nube y reemplaza local
          const result = await pullFromCloud(true);
          if (result.status === 'pulled') {
            syncFeedback = '✓ Datos descargados de la nube. Recarga la app para verlos.';
          } else {
            syncFeedback = '⚠️ ' + (result.message ?? 'No se pudo descargar');
          }
        } else {
          // Activar y subir local (sobrescribir nube)
          await initialPush();
          syncFeedback = '✓ Sync activado. Tus datos locales se han subido a la nube.';
        }
      } else {
        // Nube vacía → activar y subir
        syncState.enable(syncPinInput);
        await initialPush();
        syncFeedback = '✓ Sync activado. Tus datos se han subido a la nube por primera vez.';
      }
      await startAutoSync();
      syncPinInput = '';
    } catch (e) {
      syncFeedback = '❌ Error: ' + (e as Error).message;
    } finally {
      syncBusy = false;
    }
  }

  function disableSync() {
    if (!confirm('¿Desactivar sincronización? Tus datos locales se quedan. Los de la nube no se borran (puedes volver a activar con el mismo PIN).')) return;
    stopAutoSync();
    syncState.disable();
    syncFeedback = '✓ Sync desactivado.';
  }

  async function manualPull() {
    syncBusy = true;
    const result = await pullFromCloud(true);
    if (result.status === 'pulled') {
      syncFeedback = '✓ Descargado de la nube. Recarga para ver los cambios.';
    } else if (result.status === 'no_cloud_data') {
      syncFeedback = '⚠️ No hay datos en la nube.';
    } else if (result.status === 'unchanged') {
      syncFeedback = 'ℹ️ Ya estás al día.';
    } else {
      syncFeedback = '❌ ' + (result.message ?? 'Error');
    }
    syncBusy = false;
  }

  async function manualPush() {
    syncBusy = true;
    await initialPush();
    syncFeedback = '✓ Subido a la nube.';
    syncBusy = false;
  }

  function fmtLastSync(iso: string | null): string {
    if (!iso) return 'nunca';
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `hace ${diff}s`;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString('es-ES');
  }

  let weightKg = $profile?.weightKg ?? 70;
  let heightCm = $profile?.heightCm ?? 175;
  let bodyFatPct: number | undefined = $profile?.bodyFatPct;
  let activityLevel: ActivityLevel = $profile?.activityLevel ?? 'moderate';
  let goal: Goal = $profile?.goal ?? 'gain';
  let surplusKcal: number = $profile?.surplusKcal ?? 500;
  let trainingPreference: TrainingPreference = $profile?.trainingPreference ?? 'hybrid';
  let trainingDaysPerWeek: number = $profile?.trainingDaysPerWeek ?? 4;
  let userPhase: 'recomp' | 'volume' | 'cut' | '' = $profile?.userPhase ?? '';
  let cardioDaysPerWeek: number = $profile?.cardioDaysPerWeek ?? 0;
  let cardioMinutesPerSession: number = $profile?.cardioMinutesPerSession ?? 25;
  let stepGoal: number = $profile?.stepGoal ?? 6000;
  let dietType: DietType = $profile?.dietType ?? 'omnivore';
  let allergiesText: string = ($profile?.allergies ?? []).join(', ');
  let budget: Budget = $profile?.budget ?? 'medium';
  let bedtimeTarget = $profile?.bedtimeTarget ?? '23:30';
  let wakeTarget = $profile?.wakeTarget ?? '09:00';
  let gymTimePreference: 'morning' | 'afternoon' | 'evening' = $profile?.gymTimePreference ?? 'morning';
  let preferredGymTime: string = $profile?.preferredGymTime ?? '';
  let cycleStartDate = $profile?.cycleStartDate ?? new Date().toISOString().split('T')[0];
  let equipment: Set<GymEquipmentId> = new Set($profile?.gymEquipment ?? []);

  function toggleEquipment(id: GymEquipmentId) {
    if (equipment.has(id)) equipment.delete(id);
    else equipment.add(id);
    equipment = equipment;
  }

  async function savePerfil() {
    if (!$profile) return;
    const allergies = allergiesText
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);
    await saveProfile({
      ...$profile,
      weightKg,
      heightCm,
      bodyFatPct,
      activityLevel,
      goal,
      surplusKcal,
      trainingPreference,
      trainingDaysPerWeek,
      userPhase: userPhase || undefined,
      cardioDaysPerWeek,
      cardioMinutesPerSession,
      stepGoal,
      dietType,
      allergies,
      budget,
      bedtimeTarget,
      wakeTarget,
      gymTimePreference,
      preferredGymTime: preferredGymTime || null,
      cycleStartDate,
      gymEquipment: Array.from(equipment)
    });
    alert('Guardado ✓');
  }

  function restartCycle() {
    if (!confirm('¿Empezar un nuevo ciclo de 12 semanas desde hoy?')) return;
    cycleStartDate = new Date().toISOString().split('T')[0];
    savePerfil();
  }

  const BUDGET_OPTIONS: { val: Budget; label: string; sym: string }[] = [
    { val: 'low',    label: 'Bajo',  sym: '€'   },
    { val: 'medium', label: 'Medio', sym: '€€'  },
    { val: 'high',   label: 'Alto',  sym: '€€€' }
  ];

  async function doExport() {
    const json = await exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plangym-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function doImport(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!confirm('⚠️ Esto SOBRESCRIBE todos tus datos actuales. ¿Continuar?')) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await importAllData(reader.result as string);
        alert('Importado correctamente. Recarga la app.');
        location.reload();
      } catch (err) {
        alert('Error: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  }

  async function doReset() {
    if (!confirm('⚠️ Esto BORRA TODOS tus datos. ¿Estás seguro?')) return;
    if (!confirm('Última oportunidad. ¿Borrar todo?')) return;
    await wipeAllData();
    location.reload();
  }
</script>

<div class="px-5 pt-8 pb-6 max-w-2xl mx-auto md:max-w-4xl">
  <h1 class="text-3xl font-bold mb-4">Ajustes ⚙️</h1>

  <!-- Acceso rápido a Peso / Guía en móvil (en desktop ya están en SideNav) -->
  <div class="grid grid-cols-3 gap-2 mb-4 md:hidden">
    <button class="card-compact text-center active:scale-95" on:click={() => navigate('weight')}>
      <div class="text-2xl">⚖️</div>
      <div class="text-xs font-semibold mt-1">Peso</div>
    </button>
    <button class="card-compact text-center active:scale-95" on:click={() => navigate('sleep')}>
      <div class="text-2xl">🛌</div>
      <div class="text-xs font-semibold mt-1">Sueño</div>
    </button>
    <button class="card-compact text-center active:scale-95" on:click={() => navigate('help')}>
      <div class="text-2xl">💡</div>
      <div class="text-xs font-semibold mt-1">Guía</div>
    </button>
  </div>

  <div class="flex gap-1 mb-4 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto">
    <button class="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition whitespace-nowrap"
            class:bg-primary-600={activeTab === 'profile'}
            class:text-white={activeTab === 'profile'}
            on:click={() => activeTab = 'profile'}>👤 Perfil</button>
    <button class="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition whitespace-nowrap"
            class:bg-primary-600={activeTab === 'preferences'}
            class:text-white={activeTab === 'preferences'}
            on:click={() => activeTab = 'preferences'}>🎯 Preferencias</button>
    <button class="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition whitespace-nowrap"
            class:bg-primary-600={activeTab === 'equipment'}
            class:text-white={activeTab === 'equipment'}
            on:click={() => activeTab = 'equipment'}>🏋️ Gym</button>
    <button class="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition whitespace-nowrap"
            class:bg-primary-600={activeTab === 'sync'}
            class:text-white={activeTab === 'sync'}
            on:click={() => activeTab = 'sync'}>☁️ Sync</button>
    <button class="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition whitespace-nowrap"
            class:bg-primary-600={activeTab === 'data'}
            class:text-white={activeTab === 'data'}
            on:click={() => activeTab = 'data'}>💾 Datos</button>
  </div>

  {#if activeTab === 'profile' && $profile}
    <div class="space-y-3">
      <div class="card">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="w">Peso (kg)</label>
            <input id="w" type="number" step="0.1" bind:value={weightKg} class="input" />
          </div>
          <div>
            <label class="label" for="h">Altura (cm)</label>
            <input id="h" type="number" bind:value={heightCm} class="input" />
          </div>
        </div>
        <div class="mt-3">
          <label class="label" for="bf">% Grasa corporal (opcional)</label>
          <input id="bf" type="number" step="0.1" min="3" max="50" bind:value={bodyFatPct} class="input" placeholder="Ej: 12.5" />
          <p class="text-[10px] text-slate-400 mt-1">Si lo sabes, ayuda a refinar el surplus. Si no, déjalo vacío.</p>
        </div>
      </div>

      <div class="card">
        <label class="label">Nivel de actividad diaria</label>
        <select bind:value={activityLevel} class="input">
          <option value="sedentary">Sedentario (1.2) — oficina, sin ejercicio</option>
          <option value="light">Ligero (1.375) — algo de movimiento</option>
          <option value="moderate">Moderado (1.55) — entreno 3-4 días</option>
          <option value="active">Activo (1.725) — entreno 5-6 días</option>
          <option value="very_active">Muy activo (1.9) — entreno intenso + trabajo físico</option>
        </select>
      </div>

      <div class="card">
        <label class="label">Objetivo</label>
        <select bind:value={goal} class="input">
          <option value="gain">Ganar masa muscular</option>
          <option value="maintain">Mantener peso</option>
          <option value="cut">Definir / Perder grasa</option>
        </select>

        {#if goal === 'gain'}
          <div class="mt-4">
            <label class="label" for="surplus">Surplus calórico ({SURPLUS_RANGE.min}-{SURPLUS_RANGE.max} kcal)</label>
            <input id="surplus" type="range" min={SURPLUS_RANGE.min} max={SURPLUS_RANGE.max} step="50" bind:value={surplusKcal} class="w-full" />
            <div class="flex justify-between text-xs text-slate-500 mt-1">
              <span>{SURPLUS_RANGE.min}</span>
              <span class="font-mono font-bold text-primary-600">+{surplusKcal} kcal</span>
              <span>{SURPLUS_RANGE.max}</span>
            </div>
            <p class="text-[10px] text-slate-400 mt-1">Ectomorfos: 400-600 recomendado. Más = riesgo de grasa. Menos = progreso lento.</p>
          </div>
        {/if}
      </div>

      <div class="card">
        <h3 class="section-title mb-2">Sueño objetivo</h3>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="bt">Hora de dormir</label>
            <input id="bt" type="time" bind:value={bedtimeTarget} class="input" />
          </div>
          <div>
            <label class="label" for="wt">Hora de despertar</label>
            <input id="wt" type="time" bind:value={wakeTarget} class="input" />
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="section-title mb-2">Ciclo de entreno</h3>
        <label class="label" for="cs">Fecha de inicio del ciclo</label>
        <input id="cs" type="date" bind:value={cycleStartDate} class="input" />
        <button class="btn-secondary w-full mt-3 text-sm" on:click={restartCycle}>🔄 Empezar nuevo ciclo desde hoy</button>
      </div>

      {#if $goals}
        <div class="card-feature">
          <h3 class="section-title text-primary-700 mb-2">Tus macros calculados</h3>
          <div class="text-sm space-y-1">
            <div>BMR: <span class="font-mono">{$goals.bmr}</span> kcal</div>
            <div>TDEE: <span class="font-mono">{$goals.tdee}</span> kcal</div>
            <div class="text-base">Objetivo: <span class="font-mono font-bold text-primary-700">{$goals.targetKcal}</span> kcal/día</div>
            <div>Proteína: <span class="font-mono font-bold">{$goals.targetProteinG}g</span> · Carbos: <span class="font-mono font-bold">{$goals.targetCarbsG}g</span> · Grasas: <span class="font-mono font-bold">{$goals.targetFatsG}g</span></div>
          </div>
        </div>
      {/if}

      <button class="btn-primary w-full" on:click={savePerfil}>Guardar perfil</button>
    </div>
  {/if}

  {#if activeTab === 'preferences' && $profile}
    <div class="space-y-3">
      <div class="card">
        <label class="label">Preferencia de entrenamiento</label>
        <div class="grid grid-cols-3 gap-2">
          <button class="py-2.5 rounded-lg text-sm font-semibold border transition"
                  class:bg-primary-600={trainingPreference === 'gym'}
                  class:text-white={trainingPreference === 'gym'}
                  class:border-primary-600={trainingPreference === 'gym'}
                  class:bg-white={trainingPreference !== 'gym'}
                  class:border-slate-200={trainingPreference !== 'gym'}
                  on:click={() => trainingPreference = 'gym'}>🏋️ Gym</button>
          <button class="py-2.5 rounded-lg text-sm font-semibold border transition"
                  class:bg-primary-600={trainingPreference === 'calisthenics'}
                  class:text-white={trainingPreference === 'calisthenics'}
                  class:border-primary-600={trainingPreference === 'calisthenics'}
                  class:bg-white={trainingPreference !== 'calisthenics'}
                  class:border-slate-200={trainingPreference !== 'calisthenics'}
                  on:click={() => trainingPreference = 'calisthenics'}>🤸 Calistenia</button>
          <button class="py-2.5 rounded-lg text-sm font-semibold border transition"
                  class:bg-primary-600={trainingPreference === 'hybrid'}
                  class:text-white={trainingPreference === 'hybrid'}
                  class:border-primary-600={trainingPreference === 'hybrid'}
                  class:bg-white={trainingPreference !== 'hybrid'}
                  class:border-slate-200={trainingPreference !== 'hybrid'}
                  on:click={() => trainingPreference = 'hybrid'}>⚡ Híbrido</button>
        </div>

        <div class="mt-4">
          <label class="label" for="days">Días de entreno por semana</label>
          <input id="days" type="number" min="2" max="7" bind:value={trainingDaysPerWeek} class="input" />
        </div>
      </div>

      <!-- Atajo: aplicar configuración completa del entrenador -->
      <div class="card-feature">
        <div class="flex items-start gap-3">
          <span class="text-2xl">🎁</span>
          <div class="flex-1">
            <div class="font-bold">Aplicar config del entrenador</div>
            <p class="text-xs text-slate-600 mt-1">
              Pone fase = Recomp + cardio 4×25 min + 10.000 pasos + macros recalculados de un golpe.
            </p>
            <button class="btn-primary py-2 px-3 text-xs mt-2"
                    on:click={() => {
                      userPhase = 'recomp';
                      cardioDaysPerWeek = 4;
                      cardioMinutesPerSession = 25;
                      stepGoal = 10000;
                      savePerfil();
                    }}>
              ⚡ Aplicar ahora
            </button>
          </div>
        </div>
      </div>

      <!-- Fase del plan -->
      <div class="card">
        <h3 class="section-title mb-2">🎯 Fase del plan</h3>
        <p class="text-[11px] text-slate-500 mb-3">
          Determina los macros del día. Si cambias de fase, kcal y proteína/grasa/carbos se recalculan automáticamente.
        </p>
        <div class="grid grid-cols-3 gap-2">
          <button class="py-2.5 rounded-lg text-sm font-semibold border transition"
                  class:bg-primary-600={userPhase === 'recomp'}
                  class:text-white={userPhase === 'recomp'}
                  class:border-primary-600={userPhase === 'recomp'}
                  class:bg-white={userPhase !== 'recomp'}
                  class:border-slate-200={userPhase !== 'recomp'}
                  on:click={() => userPhase = 'recomp'}>♻️ Recomp</button>
          <button class="py-2.5 rounded-lg text-sm font-semibold border transition"
                  class:bg-primary-600={userPhase === 'volume'}
                  class:text-white={userPhase === 'volume'}
                  class:border-primary-600={userPhase === 'volume'}
                  class:bg-white={userPhase !== 'volume'}
                  class:border-slate-200={userPhase !== 'volume'}
                  on:click={() => userPhase = 'volume'}>📈 Volumen</button>
          <button class="py-2.5 rounded-lg text-sm font-semibold border transition"
                  class:bg-primary-600={userPhase === 'cut'}
                  class:text-white={userPhase === 'cut'}
                  class:border-primary-600={userPhase === 'cut'}
                  class:bg-white={userPhase !== 'cut'}
                  class:border-slate-200={userPhase !== 'cut'}
                  on:click={() => userPhase = 'cut'}>📉 Cut</button>
        </div>
        <p class="text-[10px] text-slate-500 mt-2">
          {#if userPhase === 'recomp'}
            <b>Recomposición:</b> TDEE − 100 kcal · proteína 2.1 g/kg · grasa 28% · carbos al rededor del entreno. Para bajar grasa y ganar músculo a la vez.
          {:else if userPhase === 'volume'}
            <b>Volumen:</b> TDEE + 400-500 kcal · proteína 2.0 g/kg. Para ganar masa muscular.
          {:else if userPhase === 'cut'}
            <b>Definición:</b> TDEE − 300 kcal · proteína 2.4 g/kg. Para perder grasa pura.
          {:else}
            Selecciona una fase para activar los macros específicos.
          {/if}
        </p>
      </div>

      <!-- Cardio + pasos -->
      <div class="card">
        <h3 class="section-title mb-2">🚴 Cardio y pasos</h3>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="cardio-days">Cardio · días/semana</label>
            <input id="cardio-days" type="number" min="0" max="7" bind:value={cardioDaysPerWeek} class="input" />
          </div>
          <div>
            <label class="label" for="cardio-min">Cardio · min/sesión</label>
            <input id="cardio-min" type="number" min="0" max="60" bind:value={cardioMinutesPerSession} class="input" />
          </div>
        </div>
        <div class="mt-3">
          <label class="label" for="step-goal">Pasos diarios objetivo</label>
          <input id="step-goal" type="number" min="0" max="20000" step="500" bind:value={stepGoal} class="input" />
        </div>
        <p class="text-[10px] text-slate-500 mt-2">
          {#if cardioDaysPerWeek > 0}
            Aparecerá un bloque de cardio en el cronograma diario (recomendado en ayunas, zona 2).
          {:else}
            Sin cardio programado. Pon 3-4 días para activarlo (fase recomp).
          {/if}
        </p>
      </div>

      <div class="card">
        <h3 class="section-title mb-2">Programa de entrenamiento</h3>
        <div class="space-y-2">
          {#each allPrograms as p}
            <button class="w-full text-left rounded-xl border p-3 transition active:scale-[0.98]"
                    class:border-primary-500={activeProgramId === p.id}
                    class:bg-primary-50={activeProgramId === p.id}
                    class:border-slate-200={activeProgramId !== p.id}
                    on:click={() => switchProgram(p.id)}>
              <div class="flex items-center justify-between">
                <div class="font-semibold">{p.name}</div>
                {#if activeProgramId === p.id}
                  <span class="text-[10px] uppercase font-bold tracking-wider bg-primary-600 text-white px-2 py-0.5 rounded-full">Activo</span>
                {/if}
              </div>
              {#if p.description}<div class="text-[11px] text-slate-500 mt-0.5">{p.description}</div>{/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="card">
        <h3 class="section-title mb-2">🕐 Horario diario</h3>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="wake-pref">Hora de despertar</label>
            <input id="wake-pref" type="time" bind:value={wakeTarget} class="input" />
          </div>
          <div>
            <label class="label" for="bed-pref">Hora de dormir</label>
            <input id="bed-pref" type="time" bind:value={bedtimeTarget} class="input" />
          </div>
        </div>

        <div class="mt-4">
          <label class="label">¿Cuándo prefieres entrenar?</label>
          <div class="grid grid-cols-3 gap-2">
            <button class="py-2.5 rounded-lg text-sm font-semibold border transition"
                    class:bg-primary-600={gymTimePreference === 'morning'}
                    class:text-white={gymTimePreference === 'morning'}
                    class:border-primary-600={gymTimePreference === 'morning'}
                    class:bg-white={gymTimePreference !== 'morning'}
                    class:border-slate-200={gymTimePreference !== 'morning'}
                    on:click={() => gymTimePreference = 'morning'}>
              ☀️ Mañana
            </button>
            <button class="py-2.5 rounded-lg text-sm font-semibold border transition"
                    class:bg-primary-600={gymTimePreference === 'afternoon'}
                    class:text-white={gymTimePreference === 'afternoon'}
                    class:border-primary-600={gymTimePreference === 'afternoon'}
                    class:bg-white={gymTimePreference !== 'afternoon'}
                    class:border-slate-200={gymTimePreference !== 'afternoon'}
                    on:click={() => gymTimePreference = 'afternoon'}>
              🌤️ Tarde
            </button>
            <button class="py-2.5 rounded-lg text-sm font-semibold border transition"
                    class:bg-primary-600={gymTimePreference === 'evening'}
                    class:text-white={gymTimePreference === 'evening'}
                    class:border-primary-600={gymTimePreference === 'evening'}
                    class:bg-white={gymTimePreference !== 'evening'}
                    class:border-slate-200={gymTimePreference !== 'evening'}
                    on:click={() => gymTimePreference = 'evening'}>
              🌙 Noche
            </button>
          </div>
        </div>

        <div class="mt-4">
          <label class="label" for="gym-time">Hora exacta de gym (opcional)</label>
          <input id="gym-time" type="time" bind:value={preferredGymTime} class="input" placeholder="Ej: 11:30" />
          <p class="text-[10px] text-slate-400 mt-1">
            Si la dejas vacía, te sugiere una hora automática según tu preferencia (mañana = ~3h después de despertar).
          </p>
        </div>
      </div>

      <div class="card">
        <label class="label">Tipo de dieta</label>
        <select bind:value={dietType} class="input">
          <option value="omnivore">Omnívoro</option>
          <option value="vegetarian">Vegetariano</option>
          <option value="vegan">Vegano</option>
        </select>
        <p class="text-[10px] text-slate-400 mt-1">Filtra las recetas mostradas automáticamente.</p>
      </div>

      <div class="card">
        <label class="label" for="al">Alergias / intolerancias</label>
        <input id="al" type="text" bind:value={allergiesText} class="input" placeholder="lactosa, gluten, frutos secos…" />
        <p class="text-[10px] text-slate-400 mt-1">Separa por comas. Las recetas que contengan estos alérgenos se ocultarán.</p>
      </div>

      <div class="card">
        <label class="label">Presupuesto para alimentación</label>
        <div class="grid grid-cols-3 gap-2">
          {#each BUDGET_OPTIONS as opt}
            <button class="py-2.5 rounded-lg text-sm font-semibold border transition"
                    class:bg-primary-600={budget === opt.val}
                    class:text-white={budget === opt.val}
                    class:border-primary-600={budget === opt.val}
                    class:bg-white={budget !== opt.val}
                    class:border-slate-200={budget !== opt.val}
                    on:click={() => budget = opt.val}>
              {opt.sym}<br><span class="text-[10px] font-normal">{opt.label}</span>
            </button>
          {/each}
        </div>
        <p class="text-[10px] text-slate-400 mt-2">Si es bajo, ocultamos recetas caras (salmón fresco, etc.).</p>
      </div>

      <button class="btn-primary w-full" on:click={savePerfil}>Guardar preferencias</button>
    </div>
  {/if}

  {#if activeTab === 'equipment'}
    <p class="text-sm text-slate-500 mb-4">Marca el equipamiento que tienes disponible. Los ejercicios se filtran automáticamente.</p>
    {#each Object.entries(EQUIPMENT_BY_CATEGORY) as [cat, catLabel]}
      <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wide mt-4 mb-2">{catLabel}</h3>
      <div class="flex flex-wrap gap-2">
        {#each EQUIPMENT_CATALOG.filter(e => e.category === cat) as eq}
          <button
            class:chip-active={equipment.has(eq.id)}
            class:chip={!equipment.has(eq.id)}
            on:click={() => toggleEquipment(eq.id)}>
            <span class="mr-1">{eq.emoji}</span>{eq.name}
          </button>
        {/each}
      </div>
    {/each}
    <button class="btn-primary w-full mt-6" on:click={savePerfil}>Guardar equipamiento</button>
  {/if}

  {#if activeTab === 'sync'}
    <div class="space-y-3">
      <!-- Estado actual -->
      {#if $syncState.enabled}
        <div class="card-feature ring-2 ring-emerald-300">
          <div class="flex items-center gap-3">
            <span class="text-3xl">☁️</span>
            <div class="flex-1">
              <div class="font-bold text-emerald-700">Sync activado</div>
              <div class="text-xs text-slate-500">
                Estado:
                {#if $syncState.status === 'syncing'}
                  <span class="text-blue-600 font-semibold">sincronizando…</span>
                {:else if $syncState.status === 'error'}
                  <span class="text-red-600 font-semibold">error</span>
                {:else}
                  <span class="text-emerald-600 font-semibold">al día</span>
                {/if}
                · Última sync: {fmtLastSync($syncState.lastSyncAt)}
              </div>
              {#if $syncState.lastError}
                <div class="text-[10px] text-red-500 mt-1">{$syncState.lastError}</div>
              {/if}
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="section-title mb-2">PIN actual</h3>
          <div class="font-mono text-lg bg-slate-100 rounded-lg px-3 py-2 text-center select-all">{$syncState.pin}</div>
          <p class="text-[10px] text-slate-500 mt-2">
            Usa este PIN en otros dispositivos para acceder a los mismos datos.
            <b>No lo compartas con nadie.</b>
          </p>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button class="btn-secondary" disabled={syncBusy} on:click={manualPull}>
            📥 Bajar de la nube
          </button>
          <button class="btn-secondary" disabled={syncBusy} on:click={manualPush}>
            📤 Subir ahora
          </button>
        </div>

        <button class="btn-secondary w-full text-red-600" on:click={disableSync}>
          🛑 Desactivar sync
        </button>
      {:else}
        <!-- Activar sync -->
        <div class="card-feature">
          <h3 class="font-bold text-lg mb-2">☁️ Sincronización en la nube</h3>
          <p class="text-sm text-slate-700 mb-3">
            Activa el sync para que tus datos se compartan automáticamente entre PC y móvil.
            Crea un <b>PIN secreto</b> (mínimo 6 caracteres, mejor 8+ letras y números) y úsalo en
            todos tus dispositivos.
          </p>
          <ul class="text-xs text-slate-600 space-y-1 mb-3">
            <li>✓ Tus datos se cifran con tu PIN (nunca sale del navegador)</li>
            <li>✓ Sincronización automática cada 10 segundos si hay cambios</li>
            <li>✓ Gratuito (alojado en Netlify Blobs)</li>
          </ul>
        </div>

        <div class="card">
          <label class="label" for="sync-pin">PIN secreto</label>
          <input id="sync-pin" type="text" bind:value={syncPinInput} class="input font-mono" placeholder="Ej: gatoNegro2026" minlength="6" autocomplete="off" />
          <p class="text-[10px] text-slate-500 mt-1">
            ⚠️ Si lo olvidas, no podrás recuperar los datos de la nube. Apúntalo.
          </p>
          <button class="btn-accent w-full mt-3" disabled={syncBusy || syncPinInput.length < 6} on:click={enableSync}>
            {syncBusy ? 'Procesando…' : '🚀 Activar sincronización'}
          </button>
        </div>
      {/if}

      {#if syncFeedback}
        <div class="card text-sm">{syncFeedback}</div>
      {/if}
    </div>
  {/if}

  {#if activeTab === 'data'}
    <div class="space-y-3">
      <div class="card">
        <h3 class="font-bold mb-1">📤 Exportar datos</h3>
        <p class="text-xs text-slate-500 mb-3">Descarga un JSON con todo (perfil, sesiones, comidas, sueño). Guárdalo en Drive/iCloud como backup.</p>
        <button class="btn-secondary w-full" on:click={doExport}>Descargar backup</button>
      </div>

      <div class="card">
        <h3 class="font-bold mb-1">📥 Importar datos</h3>
        <p class="text-xs text-slate-500 mb-3">Restaura desde un backup previo. SOBRESCRIBE los datos actuales.</p>
        <label class="btn-secondary w-full cursor-pointer">
          Seleccionar archivo
          <input type="file" accept=".json" class="hidden" on:change={doImport} />
        </label>
      </div>

      <div class="card border-red-900">
        <h3 class="font-bold mb-1 text-red-400">🗑️ Reset de fábrica</h3>
        <p class="text-xs text-slate-500 mb-3">Borra TODO. No recuperable.</p>
        <button class="btn-secondary w-full text-red-400 border-red-900" on:click={doReset}>Borrar todos los datos</button>
      </div>
    </div>
  {/if}
</div>
