<script lang="ts">
  import { onMount } from 'svelte';
  import { loadProfile, profileLoaded, profile } from '$stores/profile';
  import { currentRoute, navigate, type Route } from '$stores/navigation';
  import BottomNav from '$components/BottomNav.svelte';
  import SideNav from '$components/SideNav.svelte';
  import ExerciseDetail from '$components/ExerciseDetail.svelte';
  import { activeExercise, closeExercise } from '$stores/exerciseModal';
  import RecipeDetail from '$components/RecipeDetail.svelte';
  import { activeRecipe, closeRecipe } from '$stores/recipeModal';
  import { auth } from '$stores/auth';
  import { startAutoSync, markDirty } from '$lib/sync/syncEngine';
  import { onDataChange } from '$db/database';
  import Onboarding from '$components/Onboarding.svelte';
  import Dashboard from '$components/Dashboard.svelte';
  import Training from '$components/Training.svelte';
  import GymSession from '$components/GymSession.svelte';
  import Nutrition from '$components/Nutrition.svelte';
  import Sleep from '$components/Sleep.svelte';
  import Settings from '$components/Settings.svelte';
  import DayDetail from '$components/DayDetail.svelte';
  import WeightTracker from '$components/WeightTracker.svelte';
  import Help from '$components/Help.svelte';
  import ShoppingList from '$components/ShoppingList.svelte';
  import Cardio from '$components/Cardio.svelte';
  import CardioLive from '$components/CardioLive.svelte';
  import CardioDetail from '$components/CardioDetail.svelte';
  import Achievements from '$components/Achievements.svelte';
  import Coach from '$components/Coach.svelte';
  import Reports from '$components/Reports.svelte';
  import WeeklyReportModal from '$components/reports/WeeklyReportModal.svelte';
  import DashboardPrompts from '$components/DashboardPrompts.svelte';
  import { pendingWeeklyReport, type WeeklyReport } from '$lib/reports/weeklyReport';

  // ─── Informe semanal obligatorio ──────────────────────────────────────
  // Al abrir la app (o volver a ella) se comprueba si el informe de la semana
  // pasada está sin confirmar. Nunca interrumpe un entreno o un cardio en
  // curso: se espera a que el usuario salga de esas pantallas.
  let weeklyReport: WeeklyReport | null = null;
  const NO_INTERRUPT: Route[] = ['onboarding', 'gym_session', 'cardio_live'];

  let checkingReport = false;
  async function checkWeeklyReport() {
    if (checkingReport || weeklyReport || !$profile || NO_INTERRUPT.includes($currentRoute)) return;
    checkingReport = true;
    try {
      weeklyReport = await pendingWeeklyReport();
    } catch {
      weeklyReport = null; // un fallo aquí nunca debe bloquear la app
    } finally {
      checkingReport = false;
    }
  }
  $: if ($profileLoaded && $profile && !NO_INTERRUPT.includes($currentRoute)) checkWeeklyReport();

  onMount(async () => {
    const p = await loadProfile();
    if (!p) {
      navigate('onboarding');
    }
    // Iniciar sync si hay cuenta logueada
    if ($auth.token) {
      startAutoSync();
    }
    // Cuando IndexedDB cambie → push debounced (si hay cuenta)
    onDataChange(markDirty);
    // Si la app se queda abierta y cambia la semana, al volver se comprueba
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkWeeklyReport();
    });
  });

  // En cardio_live y coach ocultamos navs: son pantallas inmersivas
  // (la barra fija inferior estorbaría a sus controles / input de chat)
  $: showNavs = $profile && $currentRoute !== 'onboarding'
    && $currentRoute !== 'cardio_live' && $currentRoute !== 'coach';
</script>

<!-- Sidebar de desktop -->
{#if showNavs}
  <SideNav />
{/if}

<main class="min-h-screen safe-bottom" class:pb-20={showNavs} class:md:pb-0={true} class:md:pl-60={showNavs}>
  {#key $currentRoute}
    <div class="animate-fade-in-up">
      {#if !$profileLoaded}
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-slate-500">Cargando…</div>
        </div>
      {:else if !$profile || $currentRoute === 'onboarding'}
        <Onboarding />
      {:else if $currentRoute === 'dashboard'}
        <Dashboard />
      {:else if $currentRoute === 'training'}
        <Training />
      {:else if $currentRoute === 'gym_session'}
        <GymSession />
      {:else if $currentRoute === 'day_detail'}
        <DayDetail />
      {:else if $currentRoute === 'nutrition'}
        <Nutrition />
      {:else if $currentRoute === 'shopping'}
        <ShoppingList />
      {:else if $currentRoute === 'sleep'}
        <Sleep />
      {:else if $currentRoute === 'weight'}
        <WeightTracker />
      {:else if $currentRoute === 'help'}
        <Help />
      {:else if $currentRoute === 'settings'}
        <Settings />
      {:else if $currentRoute === 'cardio'}
        <Cardio />
      {:else if $currentRoute === 'cardio_live'}
        <CardioLive />
      {:else if $currentRoute === 'cardio_detail'}
        <CardioDetail />
      {:else if $currentRoute === 'achievements'}
        <Achievements />
      {:else if $currentRoute === 'coach'}
        <Coach />
      {:else if $currentRoute === 'reports'}
        <Reports />
      {/if}
    </div>
  {/key}
</main>

{#if showNavs}
  <BottomNav />
{/if}

<!-- Modal global de detalle de ejercicio -->
{#if $activeExercise}
  <ExerciseDetail exercise={$activeExercise} onClose={closeExercise} />
{/if}

<!-- Avisos de la pantalla principal (entreno a medias o pesaje), con el informe cerrado -->
{#if showNavs && $currentRoute === 'dashboard' && !weeklyReport}
  <DashboardPrompts />
{/if}

<!-- Informe semanal obligatorio (por encima de todo) -->
{#if weeklyReport}
  <WeeklyReportModal report={weeklyReport} on:close={() => (weeklyReport = null)} />
{/if}

<!-- Modal global de detalle de receta -->
{#if $activeRecipe}
  <RecipeDetail recipe={$activeRecipe} onClose={closeRecipe} />
{/if}
