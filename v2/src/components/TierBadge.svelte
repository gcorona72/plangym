<script lang="ts">
  import type { ExerciseTier } from '$lib/types';

  export let tier: ExerciseTier | undefined = undefined;
  export let size: 'sm' | 'md' = 'sm';

  // Estilos por tier
  const STYLES: Record<ExerciseTier, { bg: string; text: string; ring: string }> = {
    S: { bg: 'bg-gradient-to-br from-violet-500 to-fuchsia-600', text: 'text-white', ring: 'ring-violet-300' },
    A: { bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',     text: 'text-white', ring: 'ring-emerald-300' },
    B: { bg: 'bg-gradient-to-br from-sky-500 to-blue-600',         text: 'text-white', ring: 'ring-sky-300' },
    C: { bg: 'bg-gradient-to-br from-amber-400 to-orange-500',     text: 'text-white', ring: 'ring-amber-300' },
    D: { bg: 'bg-gradient-to-br from-rose-500 to-red-600',         text: 'text-white', ring: 'ring-rose-300' }
  };

  $: style = tier ? STYLES[tier] : null;
  $: sizeClass = size === 'sm'
    ? 'w-5 h-5 text-[10px]'
    : 'w-8 h-8 text-sm';
</script>

{#if tier && style}
  <span
    class="inline-flex items-center justify-center rounded-md font-extrabold tracking-tight shadow-sm {style.bg} {style.text} {sizeClass}"
    title={`Tier ${tier}`}>
    {tier}
  </span>
{/if}
