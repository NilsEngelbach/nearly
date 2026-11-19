---
name: Nearly
description: Games of almost. Every game is a Swiss concert poster in flat offset inks.
colors:
  paper: "#f2f2ee"
  black: "#111111"
  red: "#cf2b21"
  blue: "#1f3fbf"
  yellow: "#f2c200"
typography:
  display:
    fontFamily: "'Schibsted Grotesk Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "41cqi"
    fontWeight: 880
    lineHeight: 0.76
    letterSpacing: "-0.065em"
  headline:
    fontFamily: "'Schibsted Grotesk Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "clamp(64px, 21vw, 168px)"
    fontWeight: 880
    lineHeight: 0.82
    letterSpacing: "-0.055em"
  score:
    fontFamily: "'Schibsted Grotesk Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "clamp(112px, 38vw, 300px)"
    fontWeight: 880
    lineHeight: 0.82
    letterSpacing: "-0.06em"
  count:
    fontFamily: "'Schibsted Grotesk Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "clamp(160px, 52vw, 420px)"
    fontWeight: 880
    lineHeight: 0.8
    letterSpacing: "-0.06em"
    fontFeature: "tnum"
  title:
    fontFamily: "'Schibsted Grotesk Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "64px"
    fontWeight: 880
    lineHeight: 0.8
    letterSpacing: "-0.055em"
  action:
    fontFamily: "'Schibsted Grotesk Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "21px"
    fontWeight: 820
    letterSpacing: "-0.01em"
  lede:
    fontFamily: "'Schibsted Grotesk Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "21px"
    fontWeight: 560
    lineHeight: 1.2
  body:
    fontFamily: "'Schibsted Grotesk Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 560
    lineHeight: 1.35
  label:
    fontFamily: "'Schibsted Grotesk Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 650
    letterSpacing: "0.005em"
  caption:
    fontFamily: "'Schibsted Grotesk Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 700
rounded:
  none: "0px"
  circle: "50%"
spacing:
  gap: "8px"
  gutter: "16px"
  gap-wide: "16px"
  gutter-wide: "32px"
components:
  action:
    backgroundColor: "{colors.black}"
    textColor: "{colors.paper}"
    typography: "{typography.action}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "64px"
  action-on-blue:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.blue}"
    typography: "{typography.action}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "64px"
  poster-red:
    backgroundColor: "{colors.red}"
    textColor: "{colors.paper}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
  poster-blue:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
  poster-yellow:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.black}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
  poster-black:
    backgroundColor: "{colors.black}"
    textColor: "{colors.paper}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
  round-now:
    backgroundColor: "{colors.black}"
    textColor: "{colors.paper}"
    rounded: "{rounded.circle}"
    size: "30px"
  text-plate:
    textColor: "{colors.black}"
    typography: "{typography.label}"
    height: "44px"
---

# Design System: Nearly

## Overview

**Creative North Star: "The Concert Poster Wall"**

Nearly is a wall of Zurich concert posters. Each game is a poster: one flat offset ink as its ground, one heavy grotesk set flush left at wall scale, and circles as the only figures. Inside a game the screen itself becomes that poster: the whole viewport takes the game's ink, and the thing you perceive is drawn as flat geometry on a six-column grid whose hairlines stay faintly visible behind everything.

Nothing is boxed. There are no cards, no outlines, no rounded rectangles and no shadows; hierarchy comes only from scale, weight and grid position. Type does the structural work: a masthead at 41% of its column width, game cues at up to 168px, a final score at up to 300px, all at weight 880 with tight negative tracking and line heights under 0.85. Everything else is small, bold and quiet.

Time behaves like print. Phases change as hard cuts in a fixed order (intro, show, recreate, reveal, summary) with no fades or slides between them. The single authored motion in the whole product is the reveal: the answer marker travels in from outside the result rings and settles at its true distance from the target.

**Key Characteristics:**
- Five inks only: poster paper, black, signal red, ultramarine, chrome yellow.
- Every surface is one solid ink field; text is that field's ink.
- One variable grotesk (Schibsted Grotesk), weights 560 to 880, flush left.
- Circles and arcs are the only figures; the piano keyboard is the single drawn instrument.
- A visible six-column grid in 7% ink hairlines.
- Hard cuts between phases; one travelling marker on the result rings.

## Colors

Flat offset inks on poster paper: full-strength fields, never gradients, never tints as decoration.

### Primary
- **Signal Red** (`{colors.red}`): Tint's poster and game ground, the highlight inside other posters' figures (Keys' pressed key, Pulse's downbeat disc), the accent on yellow, black and paper grounds, and the update plate in the top line. Tuned so paper text on it reaches 4.65:1.

### Secondary
- **Ultramarine** (`{colors.blue}`): Glide's poster and game ground; the target key in Keys' reveal; the keyboard focus ring on piano keys.

### Tertiary
- **Chrome Yellow** (`{colors.yellow}`): Hum's poster and game ground; the accent on red and blue grounds (sounding ring, downbeat, figure discs); the selection highlight colour on black.

### Neutral
- **Poster Paper** (`{colors.paper}`): the hub's ground, the page behind everything, the ink on red, blue and black grounds, and the white keys.
- **Press Black** (`{colors.black}`): the default ink, Pulse's ground, the Keys slip, black keys, and the outline of focus on paper.

### Named Rules
**The Ground-and-Ink Rule.** Every surface declares one ink pair: red, blue and black grounds carry paper ink with a yellow accent (red accent on black); yellow and paper grounds carry black ink with a red accent. Components read only the current ground, ink and accent, never a fixed hue, so any game can take any ink.

**The Five Inks Rule.** No sixth colour enters the interface. Lighter and darker states are mixes of the current ink into the current ground (pressed action 82%, disabled action 22% fill with 70% label, replay plate 12%, pressed plate 22%), never a new hue. The only exceptions are game content itself: Tint's target and answer colours.

**The Paper-on-Red Rule.** Red stays at its recorded value because paper text on it must pass 4.5:1. Yellow on red (3.11:1) is for figures only, never for text.

## Typography

**Display Font:** Schibsted Grotesk Variable (with Helvetica Neue, Helvetica, Arial)
**Body Font:** the same face
**Label/Mono Font:** the same face; no mono

**Character:** One heavy, slightly condensed grotesk used across its whole weight axis, from 560 for running copy to 880 for wall-scale words. Big type is pulled tight (tracking -0.055 to -0.065em, line height 0.76 to 0.82) and pushed a hair past the column edge so its stems, not its sidebearings, align to the grid.

### Hierarchy
- **Display** (880, 41cqi of the head column, 0.76): the masthead only, broken as "Near / ly".
- **Count** (880, clamp(160px, 52vw, 420px), 0.8): the countdown during the show phase, set to the right.
- **Score** (880, clamp(112px, 38vw, 300px); 140 to 280px wide): the round or final score.
- **Headline** (880, clamp(64px, 21vw, 168px), 0.82; 88 to 168px wide): the cue for each phase ("Finde ihn").
- **Title** (880, 64px on phone, 84px from 640px; Tint 128 to 168px, Hum and Keys 54px on phone): the game name on its poster, bottom left.
- **Action** (820, 21px, -0.01em): the label of the one main action per screen.
- **Lede** (560, 21px, 1.2, max 20ch, balanced): the line under the masthead.
- **Body** (560, 17px, 1.35, max 34ch; 19px from 960px): the note under a cue, the rule of a game.
- **Label** (650, 14px): the top line, round points, tally rows, replay titles.
- **Caption** (700, 13px; 14px from 640px): a poster's kind and record ("Tonhöhe · Rekord 23,4").

### Named Rules
**The Flush-Left Rule.** All type is set flush left from the grid. Wall-scale words take a negative optical margin (-0.04 to -0.045em) so the letterform touches the column line.

**The Counted-Figures Rule.** Tabular figures are on only for the countdown and the result rings, where numbers must hold position. Everywhere else figures stay proportional, because in this face tabular setting widens the decimal comma.

## Layout

The page is a six-column grid with a 16px gutter and 8px column gap, widening to 32px and 16px from 1024px. The column lines are drawn on every screen as 1px hairlines of the current ink at 7%, so the grid is always faintly present behind posters, cues and dials.

**Hub.** On a phone the masthead fills the width, then the poster wall runs two columns: Tint spans both at up to 420px (52dvh) so it is fully in view, Glide spans both at 260px, Hum and Keys share a row at 220px, Pulse and Steady share a row at 200px. From 640px the wall uses 200px rows with Tint spanning two by two. From 1024px the masthead and lede hold the left two columns (sticky), the wall takes the right four with rows of minmax(180px, 26vh): Tint two by two, Glide two wide, Hum and Keys one each, Pulse and Steady two wide each. Below the wall: the privacy line and the piano credit (Salamander Grand Piano, CC-BY 3.0), which must stay.

**Game screen.** On a phone: top line, the five rounds as a row on the grid, the stage (cue, note, figure), and a sticky action at the bottom. From 960px the first column becomes a margin column (minimum 96px) holding rounds 1 to 5 stacked; the stage spans the other five as two parts words to three parts figure (three to two on intro); the action sits at the right, at most 420px. On reveal and summary the comparison takes the right, score and rings sit left, and the action falls in after the content instead of floating. On phones a reveal fits one screen: the score (up to 23vw) and a 132px result diagram share the first row, the comparison runs full width below.

Touch targets are at least 44px; the main action is 64px tall. Safe-area insets are honoured on every edge.

### Named Rules
**The Visible Grid Rule.** The six-column hairlines are part of the poster, not scaffolding: keep them on every screen at 7% of the ink.

**The Margin Column Rule.** From 960px the round sequence lives only in column one; nothing else enters it.

## Elevation & Depth

Completely flat. There are no shadows, blurs, glows or layered surfaces. Depth comes only from overprinting: a figure sits on its ground, and a name is printed on top of the figure. A poster's figure is the bottom layer of the poster; the caption and name print over it with no plate behind them.

### Named Rules
**The Flat Wall Rule.** Nothing lifts. Hover and press move the figure sideways, hard (12px on hover, 6px on press, no transition); they never raise, scale or shadow anything.

## Shapes

Rectangles exist only as edges of ink fields, and they are square-cornered and unbordered. Every drawn figure is a circle, a ring or an arc: poster figures, the round numbers (30px, 44px wide), the dial, the sounding disc, the beat dot, the play button, the result rings and their markers. Strokes on circles are 2 to 3px of the current ink; the active ring of a sounding disc swells to 6px in the accent.

The dial's index is the one non-circular mark: a 3px ink bar at twelve o'clock topped by a solid ink triangle just outside the dial, pointing at the reading.

### Named Rules
**The Circles-Only Rule.** Figures are circles and arcs; nothing else is drawn. The single exception is the piano keyboard, drawn as the instrument itself: paper keys with 2px black edges, black keys at 62% of a white key's width and 60% of the height.

**The No-Box Rule.** No cards, outlines, radii on rectangles or containers with borders. If something needs grouping, give it its own ink field or put it on the grid.

## Components

### Action (the main button)
- **Character:** one solid bar per screen, the poster's call to action.
- **Shape:** square, full width on phone, up to 420px from 960px, 64px tall, 20px side padding; label left, arrow icon right.
- **Colour:** inverted ink pair: the current ink as fill, the current ground as label.
- **Press / Disabled:** press mixes the fill to 82% ink; disabled is 22% ink with a 70% label.
- **Focus:** a 3px outline in the ground colour, inset 8px inside the bar.

### Text plate (secondary actions)
- **Style:** bold (750) words with a 2px underline offset 4 to 5px, no fill: "Alle Spiele", "Installieren". The update plate is set in red. Minimum height 44px; optional leading icon at 1.2em.

### Top line
- **Style:** 52px row across all six columns at 14px/650. Hub: tagline left; install plate and EN / DE switch right, the inactive language dimmed and the active one at 850. Game: back arrow with "Nearly" (800) left; game name and kind right.

### Poster
- **Character:** the game's whole identity in one ink field.
- **Ground:** the game's ink (Tint red, Glide blue, Hum yellow, Keys paper with black slip, Pulse black, Steady red), no border, no radius.
- **Figure:** an authored inline SVG of circles and arcs filling the poster as the bottom layer.
- **Name and caption:** the name at Title scale bottom-left (12 to 16px in), and below it the caption, kind · record, at 13 to 14px/700, printed straight onto the ground with no plate.
- **Keys:** the paper poster carries a black key slip under the keyboard; its name and caption are set in paper on that slip.
- **States:** hover and press shift the figure left 12px and 6px, hard. Focus is a 3px black outline offset 3px.

### Rounds
- **Style:** five numbers in circles (30px, 17px/800; 44px, 24px wide) with the round's points under each at 14 to 16px. The current round fills the circle with ink and sets the number in ground; rounds still to come are set lighter (450) in full ink.

### Ring Dial (signature)
- **Character:** concentric rings grabbed where they lie and turned around the centre.
- **Construction:** one to three rings (band 30% of the radius for one ring, 20% with 3.5% gaps for several), each a masked face that rotates under a fixed index at twelve o'clock. Single-ring faces are ink tick marks on a 16% ink band; Tint's faces paint the hue, saturation and brightness scales.
- **Hub:** the hole holds the game's own content, typically a solid ink play disc (66% of the hole) with a paper icon.
- **Size:** min(100%, 48dvh, 440px); min(100%, 62dvh, 560px) from 960px.
- **Input:** circular drag, wheel, arrows, Page Up/Down, Home/End; shift multiplies by five. The face turns with the finger (clockwise drag, clockwise face, value up), so faces are painted counter-clockwise from the index. Focus: 3px ink outline offset 2px on the ring.

### Strips (Tint on narrow screens)
- **Character:** the dial's compact sibling below 960px, so the colour keeps the screen. Three flat bands (40px) stacked at the foot of the stage, each with a 14px/700 label above.
- **Index:** the same language as the dial: a 3px ink hairline through the band at the value, topped by a solid ink triangle.
- **Input:** press anywhere to jump, drag to slide; keyboard and wheel as on the dial.

### Sound picker (beat games' intro)
- The four Tactus metronome voices as words in a row after a "Sound" label; the chosen one is an inverted ink field. Tapping one plays it. Shared by Pulse and Steady, kept on the device.

### Tap pad and drift chart (Steady)
- **Tap pad:** a solid ink disc, min(66vw, 38dvh, 340px), its label in ground; it flashes to the accent on each tap. Eight 14px progress dots below fill with ink.
- **Drift chart:** one column per beat on a 1.5px ink line; each tap is an ink dot on a stem, above the line for early and below for late (a quarter beat reaches the edge); a missed beat is a dashed ring on the line.

### Result Rings (signature)
- **Character:** the same diagram in every game: target at the centre, each answer at its true distance.
- **Construction:** five rings at 2-point steps drawn as 1.2px ink lines, numbered 8, 6, 4, 2 in 7px/700; a dashed vertical axis at 55% with the two directions named above and below; a 3.5-unit ink bull's eye.
- **Markers:** 8.5-unit ink discs with the round number in ground at 850, ringed in the ground colour; in Tint they fill with the answer colour.
- **Motion:** the one authored motion. Each new marker travels from outside the outer ring along its own bearing to its place, 900ms with a 150ms delay on cubic-bezier(0.16, 1, 0.3, 1). With reduced motion it is placed directly.

### Swatches and replays (reveal)
- **Swatches:** two flat fields side by side (4:3; full height on Tint's wide reveal), the label bottom-left at 22 to 34px/850 with the value under it at 15px/560.
- **Replays:** a flat field of 12% ink on the ground, square, 72px tall, icon left, title and value stacked; it darkens to 22% on press.

### Keyboard (Keys)
- Three octaves, C3 to B5. One row from 640px (spanning the whole stage under the cue from 960px); below 640px three stacked one-octave rows, high octave on top, 12px apart, stretching to fill the screen while choosing (at least 110px each, with the cue reduced to 14vw) and on the reveal (at least 66px each, under the score row). Paper keys with 2px black edges, black keys on top; the C of each octave named at 12px/750. A pressed key and the player's answer turn red; the target turns blue; both carry a 12px dot. Focus is a 3px blue outline inset 6px.

### Focus
- Focus rings exist only for keyboard players: `:focus-visible` gives a 3px outline in the current ink, offset 3px. The app moves focus to the next action only when the last input came from the keyboard.

## Do's and Don'ts

### Do:
- **Do** give every surface one ink pair from the five inks and let components read ground, ink and accent from it.
- **Do** set big words at weight 880 with -0.055 to -0.065em tracking and a line height under 0.85, flush left on the grid.
- **Do** draw every figure as circles, rings or arcs, in flat ink.
- **Do** keep the six-column hairlines visible at 7% of the ink on every screen.
- **Do** change phases as hard cuts; the only authored motion is the result marker travelling onto the rings (900ms, cubic-bezier(0.16, 1, 0.3, 1)).
- **Do** print a poster's caption (kind · record) directly under the name, on the poster's own ground.
- **Do** keep tabular figures to the countdown and the result rings.
- **Do** show focus rings only after keyboard use, and make every dial work with arrows and Page Up/Down.

### Don't:
- **Don't** use cards, outlines, rounded rectangles or shadows.
- **Don't** put a plate, chip or background behind poster captions or names.
- **Don't** fade, slide or scale between phases or screens.
- **Don't** introduce a sixth colour or a gradient into the interface.
- **Don't** set text in yellow on red.
- **Don't** switch tabular figures on for running text or scores in prose; they widen the comma.
