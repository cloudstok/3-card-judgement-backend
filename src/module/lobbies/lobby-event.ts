import { Server } from 'socket.io';
import { insertLobbies } from './lobbies-db';
import { createLogger } from '../../utilities/logger';
import { setCurrentLobby } from '../bets/bets-session';
import { play32CardRound } from '../game/game';
import { settleBet } from '../bets/bets-session';
import { GameResult } from '../../interfaces';

const logger = createLogger('lobbies', 'jsonl');

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const initRounds = async (io: Server): Promise<void> => {
  logger.info('lobby started');
  await initLobby(io);
};

interface StaticMultsData {
  [key: string]: { b: number, l: number};
}

export const staticMults: StaticMultsData = {
  1: {
    b: 12.2,
    l: 13.7
  },
  2: {
    b: 5.95,
    l: 6.45
  },
  3: {
    b: 3.2,
    l: 3.45
  },
  4: {
    b: 2.08,
    l: 2.18
  }
};

const initLobby = async (io: Server): Promise<void> => {

  const lobbyId = Date.now();
  const recurLobbyData: { lobbyId: number; status: number } = {
    lobbyId,
    status: 0,
  };

  setCurrentLobby(recurLobbyData);

  const start_delay = 15;
  const result = play32CardRound();
  const end_delay = 5;

  for (let x = start_delay; x >= 0; x--) {
    io.emit('cards', `${lobbyId}:${x}:STARTING`);
    await sleep(1000);
  }

  recurLobbyData.status = 1;
  setCurrentLobby(recurLobbyData);

  for (let w = 0; w <= 3; w++) {
    io.emit('cards', `${lobbyId}:${w}:CALCULATING`);
    await sleep(1000);
  }

  recurLobbyData.status = 2;
  setCurrentLobby(recurLobbyData);

  const dynamicData: GameResult = {
    cards: { 1: [], 2: [], 3: [], 4: [] },
    roundWisePoints: { 1: [0], 2: [0], 3: [0], 4: [0] },
    winner: null
  }

  const playerIds = Object.keys(result.cards);
  const maxRounds = Math.max(...Object.values(result.cards).map(cards => cards.length));
  let actions = [];

  for (let i = 0; i < maxRounds; i++) {
    for (let playerId of playerIds) {
      const card = result.cards[playerId][i];
      const point = result.roundWisePoints[playerId][i];
      if (card !== undefined) {
        actions.push(async () => {
          dynamicData.cards[playerId].push(card);
          io.emit('cards', `${lobbyId}:${JSON.stringify(dynamicData)}:RESULT`);
          dynamicData.roundWisePoints[playerId][0] += point;
          await sleep(1000);
          io.emit('cards', `${lobbyId}:${JSON.stringify(dynamicData)}:RESULT`);
        });
      }
    }
  };

  const runActionsSequentially = async () => {
    for (let index = 0; index < actions.length; index++) {
      const action = actions[index];
      action();
      await sleep(2000);

      if (index === actions.length - 1) {
        dynamicData.winner = result.winner;
        io.emit('cards', `${lobbyId}:${JSON.stringify(dynamicData)}:RESULT`);
      }
    }
  };

  await runActionsSequentially();

  await settleBet(io, result, lobbyId);

  recurLobbyData.status = 3;
  setCurrentLobby(recurLobbyData);
  for (let z = 1; z <= end_delay; z++) {
    io.emit('cards', `${lobbyId}:${z}:ENDED`);
    await sleep(1000);
  }

  const history = {
    time: new Date(),
    lobbyId,
    start_delay,
    end_delay,
    result,
  };

  io.emit('history', JSON.stringify(history));
  logger.info(JSON.stringify(history));
  await insertLobbies(history);
  return initLobby(io);
};
