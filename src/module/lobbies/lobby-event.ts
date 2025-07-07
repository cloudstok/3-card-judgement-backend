import { Server } from 'socket.io';
import { insertLobbies } from './lobbies-db';
import { createLogger } from '../../utilities/logger';
import { setCurrentLobby } from '../bets/bets-session';
import { play3CardJudgementRound} from '../game/game';
import { settleBet } from '../bets/bets-session';

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
  const result = play3CardJudgementRound();
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

  const finalCards = [];
  
  for(let x of result){
    finalCards.push(x);
    io.emit('cards', `${lobbyId}:${JSON.stringify(finalCards)}:RESULT`);
    await sleep(1000);
  };

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
