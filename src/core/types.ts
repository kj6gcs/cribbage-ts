export type Suit = "♣" | "♦" | "♥" | "♠";

export type Rank =
  | 1 // Ace
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11 // Jack
  | 12 // Queen
  | 13; // King

export interface Card {
  rank: Rank;
  suit: Suit;
}

const RANK_LABELS: Record<Rank, string> = {
  1: "A",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
};

export function cardLabel(card: Card): string {
  return `${RANK_LABELS[card.rank]}${card.suit}`;
}

export function pipValue(card: Card): number {
  if (card.rank === 1) return 1;
  if (card.rank >= 11) return 10;
  return card.rank;
}

export function renderCard(card: Card): string {
  const rank = RANK_LABELS[card.rank].padEnd(2, " ");
  const suit = card.suit;

  return [
    "┌─────────┐",
    `│${rank}       │`,
    `│    ${suit}    │`,
    "│         │",
    `│       ${rank}│`,
    "└─────────┘",
  ].join("\n");
}
