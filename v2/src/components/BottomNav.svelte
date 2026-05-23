<script lang="ts">
  import { currentRoute, navigate, type Route } from '$stores/navigation';

  const tabs: { route: Route; label: string; icon: string }[] = [
    { route: 'dashboard',  label: 'Hoy',     icon: '🏠' },
    { route: 'training',   label: 'Entreno', icon: '🏋️' },
    { route: 'nutrition',  label: 'Comida',  icon: '🥗' },
    { route: 'weight',     label: 'Peso',    icon: '⚖️' },
    { route: 'settings',   label: 'Más',     icon: '⋯' }
  ];
</script>

<nav class="md:hidden fixed bottom-0 inset-x-0 glass-panel border-t safe-bottom z-50">
  <div class="grid grid-cols-5 max-w-xl mx-auto">
    {#each tabs as tab}
      <button
        class="flex flex-col items-center justify-center py-2.5 gap-0.5 transition active:scale-95"
        class:text-primary-400={$currentRoute === tab.route}
        class:text-slate-500={$currentRoute !== tab.route}
        on:click={() => navigate(tab.route)}
      >
        <span class="text-xl">{tab.icon}</span>
        <span class="text-[10px] font-medium">{tab.label}</span>
      </button>
    {/each}
  </div>
</nav>
