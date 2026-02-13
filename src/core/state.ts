import { Card } from "./types";

export type PlayerId = 0 | 1;

export interface PlayerState {
  id: PlayerId;
  name: string;
  hand: Card[];
  score: number;
}

export interface RoundState {
  dealer: PlayerId;
  starter: Card | null;
  crib: Card[];
  playCount: number;
  playSequence: Card[];
}

export interface GameState {
  players: [PlayerState, PlayerState];
  dealer: PlayerId;
  round: number;
  winner: PlayerId | null;
}
