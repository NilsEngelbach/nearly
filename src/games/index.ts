// The game registry: the hub and the router read this list. A new game is one
// module implementing `Game` plus one line here.
import type { Game } from '../core/game';
import { glide } from './glide';
import { hum } from './hum';
import { keys } from './keys';
import { pulse } from './pulse';
import { steady } from './steady';
import { tint } from './tint';

export const games: Game[] = [tint, glide, hum, keys, pulse, steady];

export const gameById = (id: string) => games.find((g) => g.id === id) ?? null;
