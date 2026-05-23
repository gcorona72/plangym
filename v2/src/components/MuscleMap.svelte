<script lang="ts">
  import type { MuscleGroup } from '$lib/types';

  export let primary: MuscleGroup[] = [];
  export let secondary: MuscleGroup[] = [];
  /** small | medium | large */
  export let size: 'small' | 'medium' | 'large' = 'medium';
  /** ¿mostrar etiquetas de músculos? */
  export let showLabels: boolean = false;

  function muscleClass(id: MuscleGroup): string {
    if (primary.includes(id)) return 'fill-red-500';
    if (secondary.includes(id)) return 'fill-orange-400 opacity-70';
    return 'fill-slate-200';
  }

  $: dimensions =
    size === 'small'  ? 'h-32' :
    size === 'large'  ? 'h-80' :
                        'h-56';
</script>

<div class="flex gap-2 items-center justify-center {dimensions}">
  <!-- VISTA FRONTAL -->
  <svg viewBox="0 0 100 220" class="h-full" xmlns="http://www.w3.org/2000/svg">
    <!-- Silueta base -->
    <g class="fill-slate-100 stroke-slate-300" stroke-width="0.4">
      <!-- Cabeza -->
      <ellipse cx="50" cy="14" rx="9" ry="11" />
      <!-- Cuello -->
      <rect x="46" y="22" width="8" height="6" rx="1.5" />
      <!-- Tronco silueta -->
      <path d="M 30 30 Q 28 50 30 75 L 32 110 L 35 145 L 65 145 L 68 110 L 70 75 Q 72 50 70 30 Q 60 26 50 26 Q 40 26 30 30 Z" />
      <!-- Brazos silueta -->
      <path d="M 30 30 Q 22 38 19 60 L 17 90 L 18 115 L 22 115 L 23 92 L 27 62 Z" />
      <path d="M 70 30 Q 78 38 81 60 L 83 90 L 82 115 L 78 115 L 77 92 L 73 62 Z" />
      <!-- Antebrazo izq -->
      <path d="M 17 90 L 13 130 L 18 132 L 22 92 Z" />
      <!-- Antebrazo der -->
      <path d="M 83 90 L 87 130 L 82 132 L 78 92 Z" />
      <!-- Piernas silueta -->
      <path d="M 36 145 L 33 195 L 40 210 L 48 210 L 49 180 L 49 145 Z" />
      <path d="M 64 145 L 67 195 L 60 210 L 52 210 L 51 180 L 51 145 Z" />
    </g>

    <!-- MÚSCULOS (encima de la silueta) -->
    <!-- Pecho -->
    <g class={muscleClass('chest')}>
      <path d="M 33 34 Q 40 38 49 38 L 49 56 Q 41 56 35 52 Q 32 45 33 34 Z" />
      <path d="M 67 34 Q 60 38 51 38 L 51 56 Q 59 56 65 52 Q 68 45 67 34 Z" />
    </g>
    <!-- Hombros (deltoides anterior) -->
    <g class={muscleClass('shoulders')}>
      <path d="M 30 30 Q 22 38 23 50 L 32 47 Q 33 38 36 32 Z" />
      <path d="M 70 30 Q 78 38 77 50 L 68 47 Q 67 38 64 32 Z" />
    </g>
    <!-- Bíceps -->
    <g class={muscleClass('biceps')}>
      <path d="M 22 50 L 19 75 L 27 78 L 30 53 Z" />
      <path d="M 78 50 L 81 75 L 73 78 L 70 53 Z" />
    </g>
    <!-- Antebrazos -->
    <g class={muscleClass('forearms')}>
      <path d="M 18 92 L 14 125 L 19 127 L 22 94 Z" />
      <path d="M 82 92 L 86 125 L 81 127 L 78 94 Z" />
    </g>
    <!-- Core / abdominales -->
    <g class={muscleClass('core')}>
      <rect x="44" y="58" width="12" height="40" rx="2" />
      <line x1="50" y1="60" x2="50" y2="98" stroke-width="0.5" class="stroke-slate-400" />
      <line x1="44" y1="70" x2="56" y2="70" stroke-width="0.5" class="stroke-slate-400" />
      <line x1="44" y1="80" x2="56" y2="80" stroke-width="0.5" class="stroke-slate-400" />
      <line x1="44" y1="90" x2="56" y2="90" stroke-width="0.5" class="stroke-slate-400" />
    </g>
    <!-- Cuádriceps -->
    <g class={muscleClass('quads')}>
      <path d="M 36 148 Q 35 175 38 195 L 47 195 L 48 148 Z" />
      <path d="M 64 148 Q 65 175 62 195 L 53 195 L 52 148 Z" />
    </g>
    <!-- Etiquetas -->
    {#if showLabels}
      <g class="fill-slate-300" font-size="3.5" font-family="sans-serif">
        <text x="50" y="48" text-anchor="middle">Pecho</text>
        <text x="50" y="80" text-anchor="middle">Core</text>
        <text x="50" y="175" text-anchor="middle">Cuádriceps</text>
      </g>
    {/if}
  </svg>

  <!-- VISTA TRASERA -->
  <svg viewBox="0 0 100 220" class="h-full" xmlns="http://www.w3.org/2000/svg">
    <!-- Silueta base trasera -->
    <g class="fill-slate-100 stroke-slate-300" stroke-width="0.4">
      <ellipse cx="50" cy="14" rx="9" ry="11" />
      <rect x="46" y="22" width="8" height="6" rx="1.5" />
      <path d="M 30 30 Q 28 50 30 75 L 32 110 L 35 145 L 65 145 L 68 110 L 70 75 Q 72 50 70 30 Q 60 26 50 26 Q 40 26 30 30 Z" />
      <path d="M 30 30 Q 22 38 19 60 L 17 90 L 18 115 L 22 115 L 23 92 L 27 62 Z" />
      <path d="M 70 30 Q 78 38 81 60 L 83 90 L 82 115 L 78 115 L 77 92 L 73 62 Z" />
      <path d="M 17 90 L 13 130 L 18 132 L 22 92 Z" />
      <path d="M 83 90 L 87 130 L 82 132 L 78 92 Z" />
      <path d="M 36 145 L 33 195 L 40 210 L 48 210 L 49 180 L 49 145 Z" />
      <path d="M 64 145 L 67 195 L 60 210 L 52 210 L 51 180 L 51 145 Z" />
    </g>

    <!-- Trapecios (parte alta espalda) -->
    <g class={muscleClass('back')}>
      <path d="M 42 28 L 36 36 L 35 50 Q 42 48 50 48 L 50 28 Z" />
      <path d="M 58 28 L 64 36 L 65 50 Q 58 48 50 48 L 50 28 Z" />
      <!-- Dorsales -->
      <path d="M 34 52 Q 32 70 35 95 L 49 92 L 49 52 Z" />
      <path d="M 66 52 Q 68 70 65 95 L 51 92 L 51 52 Z" />
    </g>
    <!-- Deltoides posteriores -->
    <g class={muscleClass('shoulders')}>
      <path d="M 30 30 Q 22 38 23 50 L 32 47 Q 33 38 36 32 Z" />
      <path d="M 70 30 Q 78 38 77 50 L 68 47 Q 67 38 64 32 Z" />
    </g>
    <!-- Tríceps -->
    <g class={muscleClass('triceps')}>
      <path d="M 22 50 L 19 75 L 27 78 L 30 53 Z" />
      <path d="M 78 50 L 81 75 L 73 78 L 70 53 Z" />
    </g>
    <!-- Antebrazos posteriores -->
    <g class={muscleClass('forearms')}>
      <path d="M 18 92 L 14 125 L 19 127 L 22 94 Z" />
      <path d="M 82 92 L 86 125 L 81 127 L 78 94 Z" />
    </g>
    <!-- Lumbar / core posterior -->
    <g class={muscleClass('core')}>
      <rect x="42" y="98" width="16" height="18" rx="2" />
    </g>
    <!-- Glúteos -->
    <g class={muscleClass('glutes')}>
      <ellipse cx="42" cy="130" rx="8" ry="11" />
      <ellipse cx="58" cy="130" rx="8" ry="11" />
    </g>
    <!-- Isquiotibiales -->
    <g class={muscleClass('hamstrings')}>
      <path d="M 36 148 Q 35 170 39 188 L 47 188 L 48 148 Z" />
      <path d="M 64 148 Q 65 170 61 188 L 53 188 L 52 148 Z" />
    </g>
    <!-- Gemelos -->
    <g class={muscleClass('calves')}>
      <path d="M 38 190 Q 37 200 40 208 L 46 208 L 47 190 Z" />
      <path d="M 62 190 Q 63 200 60 208 L 54 208 L 53 190 Z" />
    </g>
    {#if showLabels}
      <g class="fill-slate-300" font-size="3.5" font-family="sans-serif">
        <text x="50" y="75" text-anchor="middle">Espalda</text>
        <text x="50" y="132" text-anchor="middle">Glúteos</text>
        <text x="50" y="170" text-anchor="middle">Isquios</text>
        <text x="50" y="202" text-anchor="middle">Gemelos</text>
      </g>
    {/if}
  </svg>
</div>

{#if showLabels}
  <!-- Leyenda -->
  <div class="flex gap-3 justify-center mt-2 text-[10px] text-slate-500">
    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-red-500"></span> Principal</span>
    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-orange-400 opacity-70"></span> Secundario</span>
  </div>
{/if}
