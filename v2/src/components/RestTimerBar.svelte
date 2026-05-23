<script lang="ts">
  import { restTimer, formattedTime } from '$lib/gym/restTimer';
  $: progress = $restTimer.totalSeconds > 0
    ? (($restTimer.totalSeconds - $restTimer.remainingSeconds) / $restTimer.totalSeconds) * 100
    : 0;
</script>

{#if $restTimer.running}
  <div class="fixed top-0 inset-x-0 bg-gradient-to-r from-primary-600 to-primary-500 text-white z-40 safe-top">
    <!-- Barra de progreso -->
    <div class="h-1 bg-primary-800">
      <div class="h-full bg-white/30 transition-all duration-200" style="width: {progress}%"></div>
    </div>
    <div class="px-4 py-3 flex items-center justify-between gap-3 max-w-xl mx-auto">
      <div class="text-3xl font-bold tabular-nums">{$formattedTime}</div>
      <div class="flex gap-2">
        <button class="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-semibold active:scale-95" on:click={() => restTimer.addSeconds(-15)}>-15s</button>
        <button class="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-semibold active:scale-95" on:click={() => restTimer.addSeconds(15)}>+15s</button>
        <button class="px-3 py-1.5 rounded-lg bg-white text-primary-700 text-sm font-bold active:scale-95" on:click={() => restTimer.stop()}>✕</button>
      </div>
    </div>
  </div>
{/if}
