import { Card, Suit, Value } from "../../interfaces";

type Deck = Card[];

const SUITS: Suit[] = ['H', 'D', 'C', 'S'];
const VALUES: Value[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];

function generateDeck(): Deck {
  const deck: Deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ value, suit });
    }
  }
  return deck;
};



function shuffleDeck(deck: Deck): Deck {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

export function play3CardJudgementRound(): string[] {
  let deck = shuffleDeck(generateDeck());
  const cards = [];
  while(cards.length < 3){
    const randomIndex = Math.floor(Math.random() * deck.length);
    const card = deck.splice(randomIndex, 1)[0];
    cards.push(card);
  }
  return cards.map(e=> `${e.suit}${e.value}`);
}
