<script lang="ts">
  import { saveProfile } from '$stores/profile';
  import { navigate } from '$stores/navigation';
  import { EQUIPMENT_CATALOG, EQUIPMENT_BY_CATEGORY } from '$lib/equipmentCatalog';
  import type { Sex, ActivityLevel, Goal, GymEquipmentId } from '$lib/types';

  let step = 1;
  const totalSteps = 4;

  // Form state
  let name = '';
  let sex: Sex = 'male';
  let birthDate = '';
  let heightCm = 175;
  let weightKg = 70;
  let activityLevel: ActivityLevel = 'moderate';
  let goal: Goal = 'gain';
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

  // REACTIVO: se recalcula cuando cambian name, birthDate, heightCm, weightKg o step
  $: canContinue =
    step === 1 ? (name.trim().length > 0 && birthDate !== '') :
    step === 2 ? (heightCm > 0 && weightKg > 0) :
    step === 3 ? true :
    step === 4 ? true :
    false;

  async function finish() {
    await saveProfile({
      name: name.trim(),
      sex,
      birthDate,
      heightCm,
      weightKg,
      activityLevel,
      goal,
      unitSystem: 'metric',
      gymEquipment: Array.from(equipment),
      bedtimeReminder: null,
      bedtimeTarget: '23:30',
      wakeTarget: '09:00'
    });
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

  {#if step === 4}
    <h1 class="text-3xl font-bold mb-2">Tu gym 🏋️</h1>
    <p class="text-slate-500 mb-6">Marca el equipamiento que tienes disponible. Filtraremos los ejercicios automáticamente.</p>

    <p class="text-xs text-slate-500 mb-4">💡 Puedes saltarte este paso y solo usar la versión calistenia. Editable luego desde Ajustes.</p>

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
      <button class="btn-secondary flex-1" on:click={() => step--}>Atrás</button>
    {/if}
    {#if step < totalSteps}
      <button class="btn-primary flex-1" disabled={!canContinue} on:click={() => step++}>
        Siguiente
      </button>
    {:else}
      <button class="btn-accent flex-1" on:click={finish}>Empezar 🚀</button>
    {/if}
  </div>
</div>
