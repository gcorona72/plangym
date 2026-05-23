/**
 * Mapeo de recipeId → YouTube videoId para reproducir el tutorial DIRECTAMENTE
 * (autoplay+mute+loop, estilo "GIF") en la receta.
 *
 * Solo añade IDs para recetas complejas (con `isComplex: true`).
 * Para las que no tengan ID se mostrará el botón "▶️ Buscar tutorial" que
 * abre la búsqueda de YouTube en una pestaña nueva (también funciona).
 *
 * Cómo añadir uno:
 * 1. Busca el tutorial en YouTube.
 * 2. Copia el ID del vídeo (en `youtube.com/watch?v=ABC123` → `ABC123`).
 * 3. Pégalo aquí.
 * 4. Recarga la app (se aplica automáticamente).
 */
export const RECIPE_VIDEO_IDS: Record<string, string> = {
  // 'r_chicken_rice_broccoli': 'ABC...',
  // 'r_beef_pasta': 'XYZ...',
  // 'r_salmon_sweet_potato': '123...',
  // 'r_pasta_bolo_carnaza': '456...',
};
