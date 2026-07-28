# Ash & Purr

**A 2D Soulslike Boss Rush**

> BETA VERSION

---

## Hackaton Kiro x Codigo Facilito — Reto 1: Videojuegos

**Equipo: Los Tuxidos**

Mira como funciona: https://drive.google.com/file/d/1FpsAgqvgoq4KVb9EkewsPRjDhQ-Zjn4S/view?usp=sharing 

Este proyecto fue desarrollado como parte del **Reto 1 - Videojuegos** en la Hackaton de Kiro organizada por Codigo Facilito: *"Desarrolla el videojuego que siempre quisiste crear. Enfrenta el desafio, combina logica, matematicas, graficos, audio, teoria de juegos, y mucho mas con la ayuda de Kiro."*

Ash & Purr es el resultado de ese reto: un boss rush soulslike en 2D construido desde cero con HTML5 Canvas y JavaScript puro, combinando sistemas de combate con fisica, animaciones procedurales, IA de jefes con maquinas de estados, sistema de audio dinamico, y diseño de niveles — todo desarrollado con la asistencia de Kiro como herramienta de desarrollo.

---

## Synopsis

Bob is a small knight on a desperate mission. His best friend, a cat named Almohadita, has been taken from him. Every clue, every trail, has led him to a strange and dangerous place guarded by powerful warriors. Armed only with a tree branch and unbreakable determination, Bob must fight his way through five fearsome bosses to bring his friend home.

But something darker lurks behind it all...

---

## Controls

| Action | Input |
|--------|-------|
| Move | A / D |
| Attack | Left Click |
| Jump | Right Click |
| Dodge | SPACE |
| Use Tool | K |
| Advance Dialogue | ENTER / E |
| Skip Cinematic | ENTER / SPACE |
| Menu: Navigate | Arrow Keys / WASD |
| Menu: Select | ENTER |
| Menu: Start Fight | SPACE |
| Change Language | L (on title screen) |
| Retry (on death) | R |
| Main Menu (on death) | M |
| Fullscreen | Button on screen / ESC to exit |
| Skip Boss (beta) | Button on screen |

---

## Bosses

1. **The Garden Golem** - An ancient stone guardian protecting a sacred garden.
2. **Lady Death** - A cold and calculating elite assassin.
3. **The White Lion** - A massive beast fighting to protect what it loves.
4. **The Lost Spirit** - A mage bound by forces beyond his control.
5. **The Cat Keeper** - The kingdom's greatest knight, loyal to the very end.

---

## Features

- 5 unique boss fights with distinct mechanics and phases
- Equipment system: 3 amulets and 5 tools (including no-equip options)
- Last Breath mechanic: one chance to rise again per run
- Per-boss music, sound effects, and arena environments
- Opening and ending cinematics
- Full statistics tracking per boss
- Language support: English / Spanish

---

## Beta Note

This is a beta version of Ash & Purr. The "Skip Boss" button is available during gameplay so you can explore and meet all five bosses without needing to defeat each one in sequence. This button will be removed in the final release once all boss encounters have been thoroughly tested.

---

## How to Play

1. Open `index.html` in a modern web browser (Chrome, Firefox, Edge recommended).
2. Press ENTER on the title screen to begin a new game.
3. Choose your amulet and tool before each fight.
4. Defeat all five bosses to reach the ending.

---

## Project Files

The playable game consists of only 3 files:

| File | Purpose |
|------|---------|
| `index.html` | Entry point. Open this in a browser to play. |
| `game.js` | Main game logic: player, 4 bosses, combat, UI, menus, cinematics, audio, i18n. |
| `white_lion.js` | White Lion boss + lioness mate logic (separated for maintainability). |

No external dependencies. No server required. Pure vanilla JavaScript + HTML5 Canvas.

---

## Credits

**Ian Rommel Moreno Angeles** - Game Director

Responsible for the overall creative direction of the project, establishing the game's identity as a soulslike boss rush. Defined all core mechanics, gameplay systems, and difficulty balancing. Tested every mechanic throughout the entire development process, providing continuous feedback and corrections. Directed the narrative continuity and coherence of the boss stories, the game universe, the protagonists, and the lore that connects them all.

**Ivana Mariel Moreno Angeles** - Developer & Art Director

Responsible for materializing the creative vision into a playable experience. Implemented all mechanics, systems, and game logic in code following Ian's direction. Supported the art direction, designing the visual identity of arenas, characters, animations, and UI.

---

## Built With

- HTML5 Canvas
- Vanilla JavaScript
- Kiro (AI-powered development environment)

---

*Ash & Purr - Beta 2026*
