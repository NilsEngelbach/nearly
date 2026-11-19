# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated, with the constraint "a small framework only if it helps, never a pile of npm dependencies". Chosen: Vite + TypeScript with no UI framework and a tiny in-house DOM helper (same approach as the sibling project Tactus in `../music-tools`). Dev dependencies only: vite, typescript, vite-plugin-pwa; fonts are bundled from @fontsource packages. Microphone pitch detection is reused from Tactus: an AudioWorklet running a Rust → WebAssembly MPM pitch detector with a TypeScript fallback. Static files only; a service worker precaches everything so the site installs and works fully offline.

## Users

People who enjoy short perception games: a minute or two on a phone or laptop, alone or passing the device around. Musicians and non-musicians alike; the sound games must be fun without music theory, and the piano game must not assume you can read notes.

## Product Purpose

A growing collection of small "recreate what you just perceived" games. Each game shows or plays a target (a colour, a pitch, a note, a tempo), takes it away, and asks the player to reproduce it from memory with a dial, their voice or a keyboard. The score says how close they got. Success: a player finishes a round and immediately wants another, and a new game slots in beside the others without a redesign.

## Positioning

Games about the gap between what you perceived and what you can reproduce: precise, honest scoring of perception (colour difference in a perceptual colour space, pitch error in cents, tempo error in percent), no ads, no accounts, no network after the first visit.

## Operating Context

- Short sessions: open, play a game of five rounds, see the result, play again or switch game.
- Phones held in one hand and laptops with a mouse or keyboard. Sound games need speakers or headphones; the singing game needs a microphone and a reasonably quiet room.
- Played anywhere, including offline (train, plane); installed to the home screen like an app.

## Capabilities and Constraints

- Free play only: every game is five rounds with fresh random targets, a total score, and a personal best stored on the device. No daily challenge, no shared seeds.
- No server-side code or storage for now (static hosting over https, deployed with a local script like Tactus's). A PHP leaderboard may come later; nothing in the design should depend on it.
- UI in English and German, following the device language with a manual switch. German note names in the music games (H, Cis, Es).
- First games: colour (dial hue/saturation/brightness; strips on phones), pitch by dial, pitch by singing (microphone), note on a piano keyboard (recorded grand piano), tempo by dial, steady timing (tap on after the beat stops). The beat games let the player choose the metronome sound (the Tactus voices).
- Each game is a self-contained module plugged into a shared shell (registry, round flow, scoring, results, best scores), so more games can be added.

## Brand Commitments

Name proposed in this work (not yet confirmed by the user): the site is **Nearly**, and the first games are **Tint** (colour), **Glide** (pitch dial), **Hum** (sing the pitch), **Keys** (piano note), **Pulse** (tempo) and **Steady** (keeping time). Must be original: the genre is inspired by colour-recreation games, but no other game's name, look or copy is reused.

## Evidence on Hand

Piano recordings: Salamander Grand Piano by Alexander Holm (CC-BY 3.0), twelve samples (C3–A5) in `src/audio/piano/`; the credit must stay visible in the app and README.

No players, scores, testimonials or statistics exist; do not invent any.

## Product Principles

1. One more round: from tap to first target in seconds, results that make you want to retry.
2. Honest scoring: the score is a real measure of perceptual distance, explained in plain words, never padded.
3. Every game plays the same way: show, hide, recreate, compare. Learn it once.
4. Quiet by default: no accounts, ads or tracking; ask for the microphone only in the game that needs it.
5. Room to grow: the shell carries any future "recreate it" game without changes.

## Accessibility & Inclusion

Colour game is inherently colour-dependent, but every other cue (selection, scores, correctness) must not rely on colour alone. All dials usable by keyboard (arrows, Page Up/Down) and touch. Respect reduced motion. Sound games state up front that they need sound; the singing game explains the microphone before asking.
