import { startGame } from "./core/game";

startGame().catch((error) => {
  console.error(error);
  process.exit(1);
});
