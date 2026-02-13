import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { makeDeck, shuffle, deal } from "./deck";
import { PlayerId } from "./state";
import { scoreHand, scorePegPlay } from "./scoring";
import { Card, cardLabel, pipValue, renderCards } from "./types";

const WINNING_SCORE = 121;
const SCORE_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scoringDelay(): Promise<void> {
  await sleep(SCORE_DELAY_MS);
}

async function logWithDelay(message: string): Promise<void> {
  console.log(message);
  await scoringDelay();
}

function otherPlayer(player: PlayerId): PlayerId {
  return player === 0 ? 1 : 0;
}

function cardKey(card: Card): string {
  return `${card.rank}-${card.suit}`;
}

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

function parseIndices(inputValue: string): number[] {
  return inputValue
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .map((token) => Number.parseInt(token, 10) - 1);
}

function chooseAiDiscard(hand: Card[], aiIsDealer: boolean): { keep: Card[]; discard: Card[] } {
  const deck = makeDeck();
  const handKeySet = new Set(hand.map(cardKey));
  const possibleStarters = deck.filter((card) => !handKeySet.has(cardKey(card)));

  let bestKeep: Card[] = hand.slice(0, 4);
  let bestDiscard: Card[] = hand.slice(4);
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const keep of combinations(hand, 4)) {
    const discard = hand.filter((card) => !keep.includes(card));

    const expectedHandPoints =
      possibleStarters.reduce((sum, starter) => sum + scoreHand(keep, starter, false), 0) / possibleStarters.length;

    const discardPip = discard.reduce((sum, card) => sum + pipValue(card), 0);
    const cribBias = aiIsDealer ? discardPip * 0.12 : -discardPip * 0.08;
    const totalScore = expectedHandPoints + cribBias;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestKeep = [...keep];
      bestDiscard = [...discard];
    }
  }

  return { keep: bestKeep, discard: bestDiscard };
}

function chooseAiPegCard(hand: Card[], runningTotal: number, sequence: Card[]): number {
  const playable = hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => runningTotal + pipValue(card) <= 31);

  playable.sort((a, b) => {
    const aPoints = scorePegPlay(sequence, runningTotal, a.card);
    const bPoints = scorePegPlay(sequence, runningTotal, b.card);
    if (aPoints !== bPoints) return bPoints - aPoints;

    const aTotal = runningTotal + pipValue(a.card);
    const bTotal = runningTotal + pipValue(b.card);
    if (aTotal !== bTotal) return bTotal - aTotal;

    return pipValue(a.card) - pipValue(b.card);
  });

  return playable[0].index;
}

async function promptUserDiscard(rl: readline.Interface, hand: Card[]): Promise<{ keep: Card[]; discard: Card[] }> {
  while (true) {
    console.log("Your hand:");
    console.log(renderCards(hand, true));
    const answer = await rl.question("Choose 2 cards to discard to the crib (e.g. 1 4): ");
    const picks = parseIndices(answer);

    const unique = new Set(picks);
    const validRange = picks.every((index) => index >= 0 && index < hand.length);

    if (picks.length !== 2 || unique.size !== 2 || !validRange) {
      console.log("Invalid choice. Enter two different positions from your hand.");
      continue;
    }

    const discardIndices = [...unique].sort((a, b) => b - a);
    const keep = [...hand];
    const discard: Card[] = [];

    for (const index of discardIndices) {
      const removed = keep.splice(index, 1)[0];
      discard.unshift(removed);
    }

    return { keep, discard };
  }
}

async function promptUserPegCard(
  rl: readline.Interface,
  hand: Card[],
  runningTotal: number,
): Promise<number | null> {
  const playable = hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => runningTotal + pipValue(card) <= 31)
    .map(({ index }) => index);

  if (playable.length === 0) return null;

  while (true) {
    console.log("Your cards:");
    console.log(renderCards(hand, true));
    console.log(`Playable positions: ${playable.map((i) => i + 1).join(", ")}`);
    const answer = await rl.question("Play a card by position: ");
    const index = Number.parseInt(answer, 10) - 1;

    if (playable.includes(index)) {
      return index;
    }

    console.log("Invalid play.");
  }
}

async function peggingPhase(
  rl: readline.Interface,
  hands: [Card[], Card[]],
  scores: [number, number],
  leadPlayer: PlayerId,
  addPoints: (player: PlayerId, points: number, reason: string) => void,
): Promise<void> {
  let currentPlayer: PlayerId = leadPlayer;
  let runningTotal = 0;
  let sequence: Card[] = [];
  let passed: [boolean, boolean] = [false, false];
  let lastPlayer: PlayerId | null = null;

  const anyCardsLeft = (): boolean => hands[0].length > 0 || hands[1].length > 0;

  while (anyCardsLeft()) {
    const hand = hands[currentPlayer];
    const playable = hand.filter((card) => runningTotal + pipValue(card) <= 31);

    if (playable.length === 0) {
      if (!passed[currentPlayer]) {
        await logWithDelay(`${currentPlayer === 0 ? "You" : "Computer"}: go`);
      }

      passed[currentPlayer] = true;
      const opponent = otherPlayer(currentPlayer);

      if (passed[opponent]) {
        if (runningTotal > 0 && runningTotal < 31 && lastPlayer !== null) {
          addPoints(lastPlayer, 1, "last card");
        }

        runningTotal = 0;
        sequence = [];
        passed = [false, false];
        currentPlayer = lastPlayer === null ? opponent : otherPlayer(lastPlayer);
      } else {
        currentPlayer = opponent;
      }

      continue;
    }

    let chosenIndex: number;
    if (currentPlayer === 0) {
      const picked = await promptUserPegCard(rl, hand, runningTotal);
      if (picked === null) {
        continue;
      }
      chosenIndex = picked;
    } else {
      chosenIndex = chooseAiPegCard(hand, runningTotal, sequence);
    }

    const [playedCard] = hand.splice(chosenIndex, 1);
    const points = scorePegPlay(sequence, runningTotal, playedCard);

    runningTotal += pipValue(playedCard);
    sequence.push(playedCard);
    passed[currentPlayer] = false;
    lastPlayer = currentPlayer;

    await logWithDelay(
      `${currentPlayer === 0 ? "You" : "Computer"} played ${cardLabel(playedCard)} (count ${runningTotal})`,
    );

    if (points > 0) {
      addPoints(currentPlayer, points, "pegging");
      await scoringDelay();
    }

    if (runningTotal === 31) {
      await logWithDelay("Reached 31. Count resets.");
      runningTotal = 0;
      sequence = [];
      passed = [false, false];
    }

    currentPlayer = otherPlayer(currentPlayer);
  }

  if (runningTotal > 0 && runningTotal < 31 && lastPlayer !== null) {
    addPoints(lastPlayer, 1, "last card");
  }
}

export async function startGame(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  const names: [string, string] = ["You", "Computer"];
  const scores: [number, number] = [0, 0];
  let dealer: PlayerId = Math.random() < 0.5 ? 0 : 1;

  try {
    console.log("Cribbage (You vs Computer)");
    console.log("First to 121 points wins.\n");

    let round = 1;
    while (scores[0] < WINNING_SCORE && scores[1] < WINNING_SCORE) {
      console.log(`\n=== Round ${round} ===`);
      console.log(`Dealer: ${names[dealer]}`);
      console.log(`Crib: ${names[dealer]}`);

      let deck = shuffle(makeDeck());

      const p0Deal = deal(deck, 6);
      deck = p0Deal.deck;

      const p1Deal = deal(deck, 6);
      deck = p1Deal.deck;

      const hands: [Card[], Card[]] = [p0Deal.hand, p1Deal.hand];
      const crib: Card[] = [];

      const userDiscard = await promptUserDiscard(rl, hands[0]);
      hands[0] = userDiscard.keep;
      crib.push(...userDiscard.discard);

      const aiDiscard = chooseAiDiscard(hands[1], dealer === 1);
      hands[1] = aiDiscard.keep;
      crib.push(...aiDiscard.discard);

      console.log("Computer discarded 2 cards to the crib.");

      const starter = deck.shift();
      if (!starter) {
        throw new Error("Deck was unexpectedly empty when cutting starter card.");
      }

      console.log("Starter card:");
      console.log(renderCards([starter]));

      const addPoints = (player: PlayerId, points: number, reason: string): void => {
        scores[player] += points;
        console.log(`${names[player]} +${points} (${reason}) -> ${scores[player]}`);
      };
      const addPointsWithDelay = async (player: PlayerId, points: number, reason: string): Promise<void> => {
        await scoringDelay();
        addPoints(player, points, reason);
      };

      if (starter.rank === 11) {
        addPoints(dealer, 2, "his heels");
      }

      if (scores[0] >= WINNING_SCORE || scores[1] >= WINNING_SCORE) {
        break;
      }

      const leadPlayer = otherPlayer(dealer);
      const peggingHands: [Card[], Card[]] = [[...hands[0]], [...hands[1]]];
      console.log("\nPegging phase:");
      await peggingPhase(rl, peggingHands, scores, leadPlayer, addPoints);

      if (scores[0] >= WINNING_SCORE || scores[1] >= WINNING_SCORE) {
        break;
      }

      console.log("\nHand counting:");
      const pone = otherPlayer(dealer);
      const dealerPlayer = dealer;
      console.log(`Counting order: ${names[pone]} hand, ${names[dealerPlayer]} hand, then ${names[dealerPlayer]} crib.`);

      const ponePoints = scoreHand(hands[pone], starter, false);
      await addPointsWithDelay(pone, ponePoints, "hand");
      if (scores[0] >= WINNING_SCORE || scores[1] >= WINNING_SCORE) {
        break;
      }

      const dealerPoints = scoreHand(hands[dealerPlayer], starter, false);
      await addPointsWithDelay(dealerPlayer, dealerPoints, "hand");
      if (scores[0] >= WINNING_SCORE || scores[1] >= WINNING_SCORE) {
        break;
      }

      const cribPoints = scoreHand(crib, starter, true);
      await addPointsWithDelay(dealerPlayer, cribPoints, "crib");

      console.log(`Scores: You ${scores[0]} - Computer ${scores[1]}`);

      dealer = otherPlayer(dealer);
      round++;
    }

    const winner: PlayerId = scores[0] >= WINNING_SCORE ? 0 : 1;
    console.log(`\n${names[winner]} win ${scores[0]} to ${scores[1]}!`);
  } finally {
    rl.close();
  }
}
