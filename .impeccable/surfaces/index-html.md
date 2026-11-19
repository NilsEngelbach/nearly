---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["src/main.ts"]
---

## Scope

The whole web app: the hub (game wall) at `/` and every game screen at `/#<game>` (intro, show, recreate, reveal, summary). Mode: Experience — the games lead from the first viewport.

## Audience and job

Casual players on a phone or laptop, one to two minutes per game of five rounds. Job: perceive a target, recreate it from memory, see how close they got, want another go. Constraints: offline, EN/DE, colour game needs a neutral surround, sound games need sound, Hum needs the microphone.

## Direction contract

THESIS: Every game is a Zurich concert poster: the thing you perceive becomes flat geometry on a strict six-column grid. Refuses the category default of rounded game cards on near-black with sliders and a score count-up.

OWN-WORLD: Neutral poster paper (#f2f2ee) and black ink (#111), three flat offset inks: signal red, ultramarine, chrome yellow; one heavy self-hosted grotesk, flush left, tight tracking, numerals tabular. Circles and arcs are the only figures. Nothing is boxed: no cards, outlines, radii or shadows; hierarchy only from scale, weight and grid position (raise from Cracktro). Grid hairlines stay faintly visible.

STORY: The player sees a wall of posters, one per game, taps one, learns the rule in one line, plays five rounds (show, hide, recreate, compare) and leaves with a total and a ring diagram of where their five answers landed.

FIRST VIEWPORT: Phone: "Games of almost" and EN/DE in a thin top line; NEARLY set at wall scale across the full width, broken Near/ly, flush left; one line of copy; then the posters start, each a full-width solid ink field with its own figure, the game name large bottom-left, its kind small top-left, the personal best top-right; the first poster is fully in view, the second peeks. Desktop: title column on the left two grid columns, poster wall with unequal spans on the right four. In a game, the stage is the poster: Tint's target colour fills the screen edge to edge.

FORM: Swiss International Style concert poster, candidate 6 of 7 on the ordered list; seed:a10a0c375f09aa9d. Signature interaction: concentric ring dials, grabbed by radius and turned by circular drag (Tint: hue, saturation, brightness as three rings; Glide and Pulse: one ring). Motion grammar: phases change as hard cuts in fixed order, never fades or slides (raise from Emergency Broadcast); the one authored moment is the reveal, where the answer marker travels onto the result rings with an exponential ease-out. Every result is one concentric-ring diagram, target at the centre, answer at its true distance, the same in every game (raise from Collider). Rounds 1–5 sit in a strict margin column (raise from Crane Fold).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Product and game names (Nearly; Tint, Glide, Hum, Keys, Pulse) are proposals awaiting the user's confirmation.
