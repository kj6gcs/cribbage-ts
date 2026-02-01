import { makeDeck, shuffle, deal } from "./core/deck";
import { cardLabel } from "./core/types";

let deck = shuffle(makeDeck());

const p1 = deal(deck, 6);
deck = p1.deck;

const p2 = deal(deck, 6);
deck = p2.deck;

console.log("Player 1:");
console.log(p1.hand.map(cardLabel).join(" "));

console.log("\nPlayer 2:");
console.log(p2.hand.map(cardLabel).join(" "));

console.log(`\nCards left in deck: ${deck.length}`);
