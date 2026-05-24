<script lang="ts">
  import { currentRoute, navigate, type Route } from '$stores/navigation';
  import { profile } from '$stores/profile';
  import { syncState } from '$stores/sync';

  const tabs: { route: Route; label: string; icon: string }[] = [
    { route: 'dashboard',  label: 'Hoy',         icon: '🏠' },
    { route: 'training',   label: 'Entrenamiento', icon: '🏋️' },
    { route: 'nutrition',  label: 'Nutrición',   icon: '🥗' },
    { route: 'shopping',   label: 'Compra',      icon: '🛒' },
    { route: 'cardio',     label: 'Cardio',      icon: '🚴' },
    { route: 'weight',     label: 'Peso',        icon: '⚖️' },
    { route: 'sleep',      label: 'Sueño',       icon: '🛌' },
    { route: 'help',       label: 'Guía',        icon: '💡' },
    { route: 'settings',   label: 'Ajustes',     icon: '⚙️' }
  ];
</script>

<aside class="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-60 glass-panel border-r flex-col p-4 safe-top safe-bottom z-40">
  <div class="mb-6 px-2">
    {#if $profile?.name}
      <div class="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Mi plan</div>
      <div class="text-xl font-extrabold leading-tight mt-0.5">{$profile.name}</div>
    {:else}
      <div class="text-2xl font-extrabold">Mi PlanGym</div>
    {/if}
  </div>

  <nav class="space-y-1 flex-1">
    {#each tabs as tab}
      <button
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition active:scale-[0.98]"
        class:bg-primary-600={$currentRoute === tab.route}
        class:text-white={$currentRoute === tab.route}
        class:text-slate-700={$currentRoute !== tab.route}
        class:hover:bg-slate-100={$currentRoute !== tab.route}
        on:click={() => navigate(tab.route)}>
        <span class="text-xl">{tab.icon}</span>
        <span class="text-sm font-semibold">{tab.label}</span>
      </button>
    {/each}
  </nav>

  <!-- Estado de sync -->
  <button class="flex items-center gap-2 px-2 py-2 rounded-lg text-[11px] hover:bg-slate-100 transition w-full text-left"
          on:click={() => navigate('settings')}>
    {#if $syncState.enabled}
      {#if $syncState.status === 'syncing'}
        <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        <span class="text-slate-600">Sincronizando…</span>
      {:else if $syncState.status === 'error'}
        <span class="w-2 h-2 rounded-full bg-red-500"></span>
        <span class="text-red-600">Error de sync</span>
      {:else}
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span class="text-slate-600">☁️ Sincronizado</span>
      {/if}
    {:else}
      <span class="w-2 h-2 rounded-full bg-slate-300"></span>
      <span class="text-slate-400">Solo local · Activar sync</span>
    {/if}
  </button>
</aside>
