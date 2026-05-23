/**
 * Mapeo de exerciseId → YouTube videoId (la parte después de `v=` en la URL).
 *
 * Para AÑADIR/CAMBIAR un vídeo:
 * 1. Busca el ejercicio en YouTube.
 * 2. Copia el ID del vídeo: en `https://www.youtube.com/watch?v=ABC123xyz`, el ID es `ABC123xyz`.
 * 3. Pégalo aquí asociado al exerciseId.
 * 4. Recarga la app — el seedRunner aplica el cambio automáticamente sin borrar tus datos.
 *
 * Si dejas un exercise sin entrada → se muestra un botón "Ver tutorial" que abre
 * YouTube en pestaña nueva (no auto-play, pero funciona siempre).
 *
 * NOTA: Los vídeos pueden ser eliminados/movidos por sus dueños. Si ves un
 *       vídeo que no carga, búscalo de nuevo y actualiza el ID aquí.
 */
export const EXERCISE_VIDEO_IDS: Record<string, string> = {
  // Rellena estos IDs con los tutoriales que prefieras.
  // Ejemplos (déjalos en blanco si quieres usar el botón "Ver tutorial" en su lugar):

  // 'gym_bench_press': 'rT7DgCr-3pg',     // Ej: video de Jeff Nippard
  // 'gym_squat':       'ultWZbUMPL8',     // Ej: video de Squat University
  // 'cal_pushup':      'IODxDxX7oi4',     // Ej: video de Athlean-X
  // 'cal_pullup':      'eGo4IYlbE5g',     // Ej: video de Calisthenicmovement
};
