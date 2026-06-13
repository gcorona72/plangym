<script lang="ts">
  import { tick } from 'svelte';
  import { navigate } from '$stores/navigation';
  import { auth } from '$stores/auth';
  import { askCoach, type CoachMessage } from '$lib/coach/coachClient';

  let messages: CoachMessage[] = [];
  let input = '';
  let busy = false;
  let errorMsg = '';
  let scroller: HTMLDivElement;

  const SUGGESTIONS = [
    '¿Voy bien encaminado con mi plan?',
    '¿Puedo cambiar el press de banca por otro ejercicio?',
    '¿Qué como antes de entrenar?',
    '¿Por qué no subo de peso?'
  ];

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    errorMsg = '';
    messages = [...messages, { role: 'user', content }];
    input = '';
    busy = true;
    await scrollDown();
    try {
      const reply = await askCoach(messages);
      messages = [...messages, { role: 'assistant', content: reply }];
    } catch (e) {
      errorMsg = (e as Error).message;
    } finally {
      busy = false;
      await scrollDown();
    }
  }

  async function scrollDown() {
    await tick();
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  }
</script>

<div class="flex flex-col h-screen max-w-2xl mx-auto md:max-w-4xl">
  <!-- Header -->
  <header class="px-5 pt-8 pb-3 border-b border-slate-200 dark:border-slate-700">
    <button class="text-sm text-slate-500 mb-2" on:click={() => navigate('dashboard')}>← Volver</button>
    <h1 class="text-2xl font-bold">Coach IA 🧠</h1>
    <p class="text-slate-500 text-sm">Pregúntame sobre tu plan, técnica o nutrición. Conozco tus datos.</p>
  </header>

  {#if !$auth.token}
    <div class="flex-1 flex items-center justify-center px-6">
      <div class="card text-center">
        <div class="text-4xl mb-2">🔒</div>
        <p class="font-bold mb-1">Inicia sesión para usar el coach</p>
        <p class="text-sm text-slate-500 mb-3">El coach necesita tu cuenta para conocer tu plan y proteger la cuota.</p>
        <button class="btn-primary w-full" on:click={() => navigate('settings')}>Ir a Ajustes → Sync</button>
      </div>
    </div>
  {:else}
    <!-- Mensajes -->
    <div bind:this={scroller} class="flex-1 overflow-y-auto px-5 py-4 space-y-3">
      {#if messages.length === 0}
        <div class="card-feature">
          <p class="text-sm text-slate-600">👋 Hola, soy tu coach. Tengo tu perfil, tus macros y tu programa a la vista. Prueba con:</p>
          <div class="flex flex-wrap gap-2 mt-3">
            {#each SUGGESTIONS as s}
              <button class="chip text-left" on:click={() => send(s)}>{s}</button>
            {/each}
          </div>
        </div>
      {/if}

      {#each messages as m}
        <div class="flex" class:justify-end={m.role === 'user'}>
          <div class="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap"
               class:bg-primary-600={m.role === 'user'}
               class:text-white={m.role === 'user'}
               class:card={m.role === 'assistant'}>
            {m.content}
          </div>
        </div>
      {/each}

      {#if busy}
        <div class="flex">
          <div class="card px-4 py-2.5 text-sm text-slate-400">
            <span class="inline-flex gap-1">
              <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></span>
              <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style="animation-delay:0.2s"></span>
              <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style="animation-delay:0.4s"></span>
            </span>
          </div>
        </div>
      {/if}

      {#if errorMsg}
        <div class="card text-sm text-red-600 dark:text-red-400">⚠️ {errorMsg}</div>
      {/if}
    </div>

    <!-- Input -->
    <div class="border-t border-slate-200 dark:border-slate-700 px-4 py-3 safe-bottom">
      <div class="flex gap-2 items-end">
        <textarea
          bind:value={input}
          on:keydown={onKey}
          rows="1"
          placeholder="Escribe tu pregunta…"
          class="input flex-1 resize-none max-h-32"></textarea>
        <button class="btn-primary px-4" disabled={busy || !input.trim()} on:click={() => send(input)}>➤</button>
      </div>
      <p class="text-[10px] text-slate-400 mt-1.5 text-center">El coach no sustituye a un médico. Sin conexión no está disponible.</p>
    </div>
  {/if}
</div>
