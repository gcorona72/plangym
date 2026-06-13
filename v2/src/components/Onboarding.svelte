<script lang="ts">
  import { saveProfile, profile } from '$stores/profile';
  import { navigate } from '$stores/navigation';
  import { EQUIPMENT_CATALOG, EQUIPMENT_BY_CATEGORY } from '$lib/equipmentCatalog';
  import { generateAndActivate } from '$lib/training/ProgramGenerator';
  import { get } from 'svelte/store';
  import type { Sex, ActivityLevel, Goal, GymEquipmentId, ExperienceLevel, TrainingPreference } from '$lib/types';

  let step = 1;
  const totalSteps = 6;
  let generating = false;

  // Form state
  let name = '';
  let sex: Sex = 'male';
  let birthDate = '';
  let heightCm = 175;
  let weightKg = 70;
  let activityLevel: ActivityLevel = 'moderate';
  let goal: Goal = 'gain';
  let experienceLevel: ExperienceLevel = 'beginner';
  let trainingDaysPerWeek = 4;
  let trainingPreference: TrainingPreference = 'gym';
  let equipment: Set<GymEquipmentId> = new Set();

  function toggleEquipment(id: GymEquipmentId) {
    if (equipment.has(id)) equipment.delete(id);
    else equipment.add(id);
    equipment = equipment; // forzar reactivity
  }

  const activityOptions: { value: ActivityLevel; label: string; desc: string }[] = [
    { value: 'sedentary', label: 'Sedentario',     desc: 'Trabajo de oficina, sin ejercicio' },
    { value: 'light',     label: 'Ligero',         desc: 'Camino algo, deporte 1-2 días' },
    { value: 'moderate',  label: 'Moderado',       desc: 'Entreno 3-4 días por semana' },
    { value: 'active',    label: 'Activo',         desc: 'Entreno 5-6 días por semana' },
    { value: 'very_active', label: 'Muy activo',   desc: 'Entreno intenso 6+ días o trabajo físico' }
  ];

  const goalOptions: { value: Goal; label: string; desc: string }[] = [
    { value: 'gain',     label: 'Ganar masa',  desc: 'Volumen limpio (+400 kcal sobre TDEE)' },
    { value: 'maintain', label: 'Mantener',    desc: 'Mantener peso actual' },
    { value: 'cut',      label: 'Definir',     desc: 'Bajar grasa (-300 kcal bajo TDEE)' }
  ];

  const experienceOptions: { value: ExperienceLevel; label: string; desc: string }[] = [
    { value: 'beginner',     label: 'Principiante', desc: 'Menos de 6 meses entrenando con constancia' },
    { value: 'intermediate', label: 'Intermedio',   desc: 'Entre 6 meses y 2 años' },
    { value: 'advanced',     label: 'Avanzado',     desc: 'Más de 2 años entrenando en serio' }
  ];

  const preferenceOptions: { value: TrainingPreference; label: string; emoji: string; desc: string }[] = [
    { value: 'gym',          label: 'Gimnasio',  emoji: '🏋️', desc: 'Pesas, máquinas, barras' },
    { value: 'calisthenics', label: 'Calistenia', emoji: '🤸', desc: 'Peso corporal, en casa o parque' },
    { value: 'hybrid',       label: 'Híbrido',   emoji: '⚡', desc: 'Ambos según el día' }
  ];

  // REACTIVO
  $: canContinue =
    step === 1 ? (name.trim().length > 0 && birthDate !== '') :
    step === 2 ? (heightCm > 0 && weightKg > 0) :
    step === 3 ? true :
    step === 4 ? true :     // experiencia + días + preferencia (siempre válido)
    step === 5 ? true :     // objetivo
    step === 6 ? true :     // equipamiento
    false;

  async function finish() {
    generating = true;
    await saveProfile({
      name: name.trim(),
      sex,
      birthDate,
      heightCm,
      weightKg,
      activityLevel,
      goal,
      experienceLevel,
      trainingDaysPerWeek,
      trainingPreference,
      unitSystem: 'metric',
      gymEquipment: Array.from(equipment),
      bedtimeReminder: null,
      bedtimeTarget: '23:30',
      wakeTarget: '09:00'
    });
    // Generar el programa a medida con los datos recién guardados
    try {
      const p = get(profile);
      if (p) await generateAndActivate(p);
    } catch (e) {
      console.error('No se pudo generar el programa inicial', e);
    }
    generating = false;
    navigate('dashboard');
  }
</script>

<div class="min-h-screen px-5 pt-10 max-w-2xl mx-auto md:max-w-4xl">
  <!-- Progreso -->
  <div class="flex items-center gap-1.5 mb-8">
    {#each Array(totalSteps) as _, i}
      <div class="h-1.5 flex-1 rounded-full transition-colors"
           class:bg-primary-500={i < step}
           class:bg-slate-100={i >= step}></div>
    {/each}
  </div>

  {#if step === 1}
    <h1 class="text-3xl font-bold mb-2">¡Bienvenido! 💪</h1>
    <p class="text-slate-500 mb-8">Vamos a configurar tu perfil</p>

    <div class="space-y-5">
      <div>
        <label class="label" for="name">Tu nombre</label>
        <input id="name" type="text" bind:value={name} class="input" placeholder="Cómo te llamas" />
      </div>

      <div>
        <label class="label">Sexo (para cálculo metabólico)</label>
        <div class="grid grid-cols-2 gap-2">
          <button class:chip-active={sex === 'male'} class:chip={sex !== 'male'} on:click={() => sex = 'male'}>Hombre</button>
          <button class:chip-active={sex === 'female'} class:chip={sex !== 'female'} on:click={() => sex = 'female'}>Mujer</button>
        </div>
      </div>

      <div>
        <label class="label" for="birth">Fecha de nacimiento</label>
        <input id="birth" type="date" bind:value={birthDate} class="input" />
      </div>
    </div>
  {/if}

  {#if step === 2}
    <h1 class="text-3xl font-bold mb-2">Tus medidas 📏</h1>
    <p class="text-slate-500 mb-8">Para calcular tus calorías exactas</p>

    <div class="space-y-5">
      <div>
        <label class="label" for="h">Altura (cm)</label>
        <input id="h" type="number" bind:value={heightCm} class="input" min="100" max="250" />
      </div>
      <div>
        <label class="label" for="w">Peso actual (kg)</label>
        <input id="w" type="number" bind:value={weightKg} class="input" min="30" max="300" step="0.1" />
      </div>

      <div>
        <label class="label">Nivel de actividad diaria</label>
        <div class="space-y-2">
          {#each activityOptions as opt}
            <button
              class="w-full text-left p-3 rounded-xl border transition active:scale-[0.98]"
              class:bg-primary-600={activityLevel === opt.value}
              class:border-primary-500={activityLevel === opt.value}
              class:border-slate-300={activityLevel !== opt.value}
              class:bg-slate-100={activityLevel !== opt.value}
              on:click={() => activityLevel = opt.value}>
              <div class="font-semibold">{opt.label}</div>
              <div class="text-xs opacity-80">{opt.desc}</div>
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  {#if step === 3}
    <h1 class="text-3xl font-bold mb-2">Tu experiencia 📈</h1>
    <p class="text-slate-500 mb-8">Para ajustar el volumen y la velocidad de progresión</p>

    <div class="space-y-2">
      {#each experienceOptions as opt}
        <button
          class="w-full text-left p-4 rounded-xl border transition active:scale-[0.98]"
          class:bg-primary-600={experienceLevel === opt.value}
          class:border-primary-500={experienceLevel === opt.value}
          class:border-slate-300={experienceLevel !== opt.value}
          class:bg-slate-100={experienceLevel !== opt.value}
          on:click={() => experienceLevel = opt.value}>
          <div class="font-semibold text-lg">{opt.label}</div>
          <div class="text-sm opacity-80">{opt.desc}</div>
        </button>
      {/each}
    </div>
  {/if}

  {#if step === 4}
    <h1 class="text-3xl font-bold mb-2">Tu entrenamiento 🗓️</h1>
    <p class="text-slate-500 mb-6">Con esto generamos tu programa a medida</p>

    <div class="space-y-6">
      <div>
        <label class="label">¿Cuántos días por semana puedes entrenar?</label>
        <div class="grid grid-cols-5 gap-2">
          {#each [2, 3, 4, 5, 6] as d}
            <button
              class="py-3 rounded-xl border font-bold text-lg transition active:scale-95"
              class:bg-primary-600={trainingDaysPerWeek === d}
              class:text-white={trainingDaysPerWeek === d}
              class:border-primary-500={trainingDaysPerWeek === d}
              class:bg-slate-100={trainingDaysPerWeek !== d}
              class:border-slate-300={trainingDaysPerWeek !== d}
              on:click={() => trainingDaysPerWeek = d}>{d}</button>
          {/each}
        </div>
        <p class="text-[11px] text-slate-500 mt-2">
          {#if trainingDaysPerWeek <= 3}Full Body — cada sesión trabaja todo el cuerpo.
          {:else if trainingDaysPerWeek === 4}Upper/Lower — frecuencia 2× por grupo muscular.
          {:else if trainingDaysPerWeek === 5}Upper/Lower + Push/Pull/Pierna.
          {:else}Push/Pull/Pierna ×2 — máximo volumen.{/if}
        </p>
      </div>

      <div>
        <label class="label">¿Dónde entrenas?</label>
        <div class="grid grid-cols-3 gap-2">
          {#each preferenceOptions as opt}
            <button
              class="py-3 rounded-xl border text-center transition active:scale-95"
              class:bg-primary-600={trainingPreference === opt.value}
              class:text-white={trainingPreference === opt.value}
              class:border-primary-500={trainingPreference === opt.value}
              class:bg-slate-100={trainingPreference !== opt.value}
              class:border-slate-300={trainingPreference !== opt.value}
              on:click={() => trainingPreference = opt.value}>
              <div class="text-2xl">{opt.emoji}</div>
              <div class="text-sm font-semibold mt-1">{opt.label}</div>
              <div class="text-[10px] opacity-80 mt-0.5">{opt.desc}</div>
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  {#if step === 5}
    <h1 class="text-3xl font-bold mb-2">Tu objetivo 🎯</h1>
    <p class="text-slate-500 mb-8">Para ajustar tus macros</p>

    <div class="space-y-2">
      {#each goalOptions as opt}
        <button
          class="w-full text-left p-4 rounded-xl border transition active:scale-[0.98]"
          class:bg-primary-600={goal === opt.value}
          class:border-primary-500={goal === opt.value}
          class:border-slate-300={goal !== opt.value}
          class:bg-slate-100={goal !== opt.value}
          on:click={() => goal = opt.value}>
          <div class="font-semibold text-lg">{opt.label}</div>
          <div class="text-sm opacity-80">{opt.desc}</div>
        </button>
      {/each}
    </div>
  {/if}

  {#if step === 6}
    <h1 class="text-3xl font-bold mb-2">Tu gym 🏋️</h1>
    <p class="text-slate-500 mb-6">Marca el equipamiento que tienes disponible. Filtraremos los ejercicios automáticamente.</p>

    {#if trainingPreference === 'calisthenics'}
      <p class="text-xs text-slate-500 mb-4">💡 Has elegido calistenia: puedes saltarte este paso. Editable luego desde Ajustes.</p>
    {:else}
      <p class="text-xs text-slate-500 mb-4">💡 Cuanto más marques, más variado será tu programa. Editable luego desde Ajustes.</p>
    {/if}

    {#each Object.entries(EQUIPMENT_BY_CATEGORY) as [cat, catLabel]}
      <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wide mt-6 mb-2">{catLabel}</h3>
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
  {/if}

  <!-- Botones -->
  <div class="mt-10 flex gap-3">
    {#if step > 1}
      <button class="btn-secondary flex-1" disabled={generating} on:click={() => step--}>Atrás</button>
    {/if}
    {#if step < totalSteps}
      <button class="btn-primary flex-1" disabled={!canContinue} on:click={() => step++}>
        Siguiente
      </button>
    {:else}
      <button class="btn-accent flex-1" disabled={generating} on:click={finish}>
        {generating ? 'Generando tu plan…' : 'Crear mi plan 🚀'}
      </button>
    {/if}
  </div>
</div>
