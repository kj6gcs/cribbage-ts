export type Suit = "C" | "D" | "H" | "S";

export type Rank =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13;

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

const SUIT_LABELS: Record<Suit, string> = {
  C: "\u2663",
  D: "\u2666",
  H: "\u2665",
  S: "\u2660",
};
const ANSI_RED = "\x1b[31m";
const ANSI_RESET = "\x1b[0m";

function isRedSuit(suit: Suit): boolean {
  return suit === "D" || suit === "H";
}

function colorIfRed(text: string, suit: Suit): string {
  return isRedSuit(suit) ? `${ANSI_RED}${text}${ANSI_RESET}` : text;
}

export function cardLabel(card: Card): string {
  return `${RANK_LABELS[card.rank]}${SUIT_LABELS[card.suit]}`;
}

export function pipValue(card: Card): number {
  if (card.rank === 1) return 1;
  if (card.rank >= 11) return 10;
  return card.rank;
}

export function renderCard(card: Card): string[] {
  const rank = RANK_LABELS[card.rank];
  const suit = SUIT_LABELS[card.suit];
  const leftRank = colorIfRed(rank.padEnd(2, " "), card.suit);
  const rightRank = colorIfRed(rank.padStart(2, " "), card.suit);
  const centerSuit = colorIfRed(suit, card.suit);

  return [
    "+---------+",
    `|${leftRank}       |`,
    "|         |",
    `|    ${centerSuit}    |`,
    "|         |",
    `|       ${rightRank}|`,
    "+---------+",
  ];
}

export function renderCards(cards: Card[], withIndices = false): string {
  if (cards.length === 0) {
    return "(no cards)";
  }

  const rendered = cards.map((card) => renderCard(card));
  const lines: string[] = [];

  for (let line = 0; line < rendered[0].length; line++) {
    lines.push(rendered.map((cardLines) => cardLines[line]).join(" "));
  }

  if (withIndices) {
    const indexLine = cards
      .map((_, index) => `    (${String(index + 1).padStart(2, " ")})    `)
      .join(" ");
    lines.push(indexLine);
  }

  return lines.join("\n");
}
