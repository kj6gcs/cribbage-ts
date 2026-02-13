import { Card, pipValue } from "./types";

function combinations<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];

  const walk = (start: number, current: T[]): void => {
    if (current.length === size) {
      result.push([...current]);
      return;
    }

    for (let i = start; i < items.length; i++) {
      current.push(items[i]);
      walk(i + 1, current);
      current.pop();
    }
  };

  walk(0, []);
  return result;
}

function isRun(cards: Card[]): boolean {
  const ranks = cards.map((card) => card.rank);
  const unique = new Set(ranks);
  if (unique.size !== cards.length) return false;

  const min = Math.min(...ranks);
  const max = Math.max(...ranks);
  return max - min + 1 === cards.length;
}

export function scoreHand(hand: Card[], starter: Card, isCrib: boolean): number {
  const fullHand = [...hand, starter];
  let points = 0;

  for (let size = 2; size <= fullHand.length; size++) {
    for (const combo of combinations(fullHand, size)) {
      const total = combo.reduce((sum, card) => sum + pipValue(card), 0);
      if (total === 15) {
        points += 2;
      }
    }
  }

  const rankCounts = new Map<number, number>();
  for (const card of fullHand) {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) ?? 0) + 1);
  }

  for (const count of rankCounts.values()) {
    if (count >= 2) {
      points += (count * (count - 1)) / 2 * 2;
    }
  }

  let runPoints = 0;
  for (let size = fullHand.length; size >= 3; size--) {
    let runCount = 0;
    for (const combo of combinations(fullHand, size)) {
      if (isRun(combo)) {
        runCount++;
      }
    }

    if (runCount > 0) {
      runPoints = runCount * size;
      break;
    }
  }
  points += runPoints;

  const handFlush = hand.every((card) => card.suit === hand[0].suit);
  if (handFlush) {
    if (starter.suit === hand[0].suit) {
      points += 5;
    } else if (!isCrib) {
      points += 4;
    }
  }

  if (hand.some((card) => card.rank === 11 && card.suit === starter.suit)) {
    points += 1;
  }

  return points;
}

export function scorePegPlay(sequence: Card[], runningTotal: number, playedCard: Card): number {
  const nextTotal = runningTotal + pipValue(playedCard);
  const nextSequence = [...sequence, playedCard];
  let points = 0;

  if (nextTotal === 15) points += 2;
  if (nextTotal === 31) points += 2;

  let matching = 1;
  for (let i = nextSequence.length - 2; i >= 0; i--) {
    if (nextSequence[i].rank === playedCard.rank) {
      matching++;
    } else {
      break;
    }
  }

  if (matching === 2) points += 2;
  if (matching === 3) points += 6;
  if (matching === 4) points += 12;

  for (let size = nextSequence.length; size >= 3; size--) {
    const tail = nextSequence.slice(nextSequence.length - size);
    if (isRun(tail)) {
      points += size;
      break;
    }
  }

  return points;
}
