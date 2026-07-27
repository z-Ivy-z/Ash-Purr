# Guía de Assets Gráficos — Ash & Purr

## Resumen

Este documento define todas las spritesheets, tamaños y especificaciones que necesitas crear para que el juego funcione visualmente con el código ya implementado.

---

## Configuración General

- **Resolución del juego**: 1920×1080
- **Estilo**: Cartoon/chibi con outlines gruesos, colores planos con sombreado sutil
- **Formato de sprites**: PNG con transparencia (fondo alfa)
- **Organización**: Cada spritesheet es una imagen horizontal con frames consecutivos

---

## 1. Player (Bob) — El Caballero Pequeño

**Tamaño de frame**: 64×64 px (o 128×128 para más detalle)
**Carpeta destino**: `Sprites/Player/`

### Spritesheets necesarias:

| Archivo | Animación | Frames | Loop | Notas |
|---------|-----------|--------|------|-------|
| `bob_idle.png` | Idle | 4-6 | Sí | Respiración sutil, arma en mano |
| `bob_run.png` | Correr | 6-8 | Sí | Ciclo de caminata/carrera |
| `bob_attack_1.png` | Ataque 1 | 5-7 | No | Swing horizontal con la rama |
| `bob_attack_2.png` | Ataque 2 | 5-7 | No | Golpe ascendente |
| `bob_attack_3.png` | Ataque 3 | 6-8 | No | Golpe fuerte descendente (finisher) |
| `bob_dodge.png` | Esquivar | 4-6 | No | Dash lateral con afterimage |
| `bob_hit.png` | Recibir daño | 3-4 | No | Retroceso, flash blanco |
| `bob_death.png` | Muerte | 6-8 | No | Caer al suelo, armadura se apaga |
| `bob_recovery.png` | Recuperación | 3-4 | No | Volver a posición de idle |

### Descripción visual de Bob:
- Cuerpo rechoncho/chibi (cabeza grande ~40% del cuerpo)
- Armadura gris plateada con reflejos blancos
- Casco cerrado tipo great helm con visor horizontal oscuro
- Túnica/faldón rojo debajo de la armadura
- Cinturón negro con hebilla dorada
- Capa marrón por detrás
- Arma: rama de madera con una hojita verde en la punta
- Botas de metal gris

---

## 2. Boss (The Cat Keeper) — Fase 1

**Tamaño de frame**: 128×128 px (o 192×192 para más detalle — es más grande que Bob)
**Carpeta destino**: `Sprites/Boss/`

### Spritesheets necesarias:

| Archivo | Animación | Frames | Loop | Notas |
|---------|-----------|--------|------|-------|
| `keeper_idle.png` | Idle | 4-6 | Sí | Postura noble, espada al lado |
| `keeper_walk.png` | Caminar | 6-8 | Sí | Pasos lentos y pesados |
| `keeper_combo_strike_1.png` | Golpe combo 1 | 5-6 | No | Slash horizontal |
| `keeper_combo_strike_2.png` | Golpe combo 2 | 5-6 | No | Slash diagonal |
| `keeper_combo_strike_3.png` | Golpe combo 3 | 5-6 | No | Estocada |
| `keeper_combo_strike_4.png` | Golpe combo 4 | 5-6 | No | Uppercut (solo Advanced) |
| `keeper_combo_strike_5.png` | Golpe combo 5 | 6-7 | No | Slam (solo Advanced) |
| `keeper_counterattack.png` | Contraataque | 4-5 | No | Respuesta rápida tras ser golpeado |
| `keeper_recover.png` | Recuperación | 4-6 | No | Respirando pesado, ventana de castigo |
| `keeper_telegraph_swift.png` | Telegraph Swift Slash | 3-4 | No | Se agacha, brillo en espada |
| `keeper_telegraph_assault.png` | Telegraph Assault | 3-4 | No | Baja postura, brilla |
| `keeper_telegraph_seismic.png` | Telegraph Seismic | 3-4 | No | Levanta espada arriba |
| `keeper_swift_slash.png` | Swift Slash | 6-8 | No | Salta + golpe descendente |
| `keeper_assault.png` | Assault charge | 4-6 | No | Embestida horizontal |
| `keeper_seismic_strike.png` | Seismic Strike | 6-8 | No | Clava espada en el suelo |
| `keeper_phase_transition.png` | Transición fase | 10-14 | No | Armadura se agrieta, luz roja |
| `keeper_death.png` | Muerte | 8-12 | No | Se desmorona |

### Descripción visual — Fase 1:
- Caballero alto y musculoso (~2.5x el tamaño de Bob)
- Armadura oscura de piedra/roca marrón-negra
- Grietas sutiles en la armadura (sin brillar aún)
- Casco imponente con visor en forma de T
- Espada grande y pesada (una mano)
- Postura noble, disciplinada
- Capa oscura rasgada

### Descripción visual — Fase 2 (cambios sobre Fase 1):
- Las grietas en la armadura brillan con luz roja/naranja
- Ojos del casco brillan rojos
- Partículas de roca flotando alrededor
- Postura más agresiva, ligeramente inclinado hacia adelante
- Mismo sprite base con overlay de efectos rojos

---

## 3. Efectos

**Tamaño de frame**: 64×64 px
**Carpeta destino**: `Sprites/Effects/`

| Archivo | Efecto | Frames | Notas |
|---------|--------|--------|-------|
| `shockwave.png` | Onda sísmica | 4-6 | Onda horizontal viajando |
| `hit_spark.png` | Chispa de impacto | 3-4 | Flash al conectar golpe |
| `dust_cloud.png` | Nube de polvo | 4-5 | Al aterrizar/esquivar |
| `phase_particles.png` | Partículas fase 2 | 4-6 | Rocas/chispas rojas flotantes |

---

## 4. UI Assets

**Carpeta destino**: `Sprites/UI/`

| Archivo | Tamaño | Descripción |
|---------|--------|-------------|
| `health_bar_player_bg.png` | 220×30 px | Contenedor barra vida jugador (redondeado) |
| `health_bar_player_fill.png` | 200×24 px | Relleno rojo de la barra |
| `health_bar_boss_bg.png` | 420×26 px | Contenedor barra vida boss |
| `health_bar_boss_fill.png` | 400×20 px | Relleno rojo boss |
| `tool_icon_frame.png` | 40×40 px | Marco circular para icono de herramienta |
| `amulet_icon_frame.png` | 40×40 px | Marco circular para icono de amuleto |
| `icon_throwing_knife.png` | 32×32 px | Icono cuchillo arrojadizo |
| `icon_short_sword.png` | 32×32 px | Icono espada corta |
| `icon_small_mace.png` | 32×32 px | Icono maza pequeña |
| `icon_dreamcatcher.png` | 32×32 px | Icono atrapasueños (curación) |
| `icon_photograph.png` | 32×32 px | Icono amuleto fotografía |
| `icon_collar.png` | 32×32 px | Icono amuleto collar |
| `icon_fish_plush.png` | 32×32 px | Icono amuleto pez de peluche |
| `dialogue_box.9.png` | 9-patch | Panel de diálogo redondeado |
| `button_normal.9.png` | 9-patch | Botón estado normal |
| `button_hover.9.png` | 9-patch | Botón estado hover |
| `button_pressed.9.png` | 9-patch | Botón estado presionado |

---

## 5. Escenario (Arena)

**Carpeta destino**: `Sprites/Environment/`

| Archivo | Tamaño | Descripción |
|---------|--------|-------------|
| `arena_floor.png` | 1920×64 px (tileable) | Piso de piedra del arena |
| `arena_bg_layer1.png` | 1920×1080 px | Fondo lejano (cielo/ruinas) |
| `arena_bg_layer2.png` | 1920×1080 px | Fondo medio (columnas/arcos) |
| `arena_pillar_left.png` | 128×512 px | Pilar decorativo izquierdo |
| `arena_pillar_right.png` | 128×512 px | Pilar decorativo derecho |
| `checkpoint_shrine.png` | 64×96 px | Santuario/checkpoint visual |

---

## 6. Retratos (Diálogo)

**Tamaño**: 80×80 px
**Carpeta destino**: `Sprites/Portraits/`

| Archivo | Personaje |
|---------|-----------|
| `portrait_cat_keeper.png` | The Cat Keeper (casco con visor brillante) |
| `portrait_bob.png` | Bob (su casco de frente) |
| `portrait_cat_sage.png` | Cat-Sage (gato gris con bastón, opcional) |

---

## Cómo Conectar los Assets al Proyecto

Una vez que tengas los sprites:

1. **Coloca los archivos** en las carpetas indicadas arriba dentro del proyecto Godot

2. **Para spritesheets del Player**, abre `Scenes/Player/Player.tscn`:
   - Selecciona el nodo `Sprite2D`
   - Asigna la textura de idle como default
   - En el `AnimationPlayer`, crea cada animación con keyframes que cambien `frame` y `texture`

3. **Para el Boss**, mismo proceso en `Scenes/Bosses/CatKeeper.tscn`

4. **Para UI**, asigna las texturas en los nodos correspondientes de `Scenes/UI/HUD.tscn`

---

## Herramientas Recomendadas

- **Aseprite** — Ideal para crear spritesheets frame-by-frame en este estilo
- **Clip Studio Paint** — Para ilustraciones más detalladas que luego se recortan en frames
- **TexturePacker** — Para empacar múltiples sprites en atlas optimizados
- **Spine 2D** — Si prefieres animación skeletal (más fluida, menos frames manuales)

---

## Paleta de Colores Sugerida

Basada en las referencias:

| Elemento | Color principal | Color secundario |
|----------|----------------|-----------------|
| Armadura Bob | `#C0C8D4` (gris plata) | `#E8EDF2` (highlight) |
| Túnica Bob | `#C44B4B` (rojo) | `#8B3232` (sombra) |
| Cinturón Bob | `#2A2A2A` (negro) | `#D4A017` (hebilla oro) |
| Capa Bob | `#5C3A1E` (marrón) | `#3D2510` (sombra) |
| Rama | `#6B4226` (madera) | `#4CAF50` (hoja verde) |
| Boss P1 | `#3D2B1F` (roca oscura) | `#5C4033` (grietas) |
| Boss P2 grietas | `#FF3300` (rojo fuego) | `#FF6600` (naranja) |
| Ojos Boss P2 | `#FF0000` (rojo brillante) | — |
| Gato (Almohadita) | `#8E9AAF` (gris azulado) | `#FFFFFF` (blanco pecho) |
