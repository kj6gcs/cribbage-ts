import { Card, Rank, Suit } from "./types";

const SUITS: Suit[] = ["C", "D", "H", "S"];
const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export function makeDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }

  return deck;
}

export function shuffle(deck: Card[]): Card[] {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function deal(deck: Card[], count: number): { hand: Card[]; deck: Card[] } {
  if (count > deck.length) {
    throw new Error("Not enough cards to deal");
  }

  return {
    hand: deck.slice(0, count),
    deck: deck.slice(count),
  };
}
