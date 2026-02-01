import { Card, Rank, Suit } from "./types";

/**
 * All four suits used in the game.
 * Kept as a constant array so we can iterate cleanly.
 */
const SUITS: Suit[] = ["♣", "♦", "♥", "♠"];

/**
 * All ranks used in the game.
 * Ace = 1, Jack = 11, Queen = 12, King = 13
 */
const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

/**
 * Create a standard 52-card deck.
 */
export function makeDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }

  return deck;
}

/**
 * Shuffle a deck using Fisher–Yates.
 * Returns a NEW array (does not mutate input).
 */
export function shuffle(deck: Card[]): Card[] {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Deal `count` cards from the top of the deck.
 * Returns both the hand and the remaining deck.
 */
export function deal(
  deck: Card[],
  count: number,
): { hand: Card[]; deck: Card[] } {
  if (count > deck.length) {
    throw new Error("Not enough cards to deal");
  }

  const hand = deck.slice(0, count);
  const remainingDeck = deck.slice(count);

  return {
    hand,
    deck: remainingDeck,
  };
}
