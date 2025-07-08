import { BetResult, Card } from '../interfaces';
import { staticMults } from '../module/lobbies/lobby-event';
import { appConfig } from './app-config';
import { createLogger } from './logger';
import { Socket } from 'socket.io';

const failedBetLogger = createLogger('failedBets', 'jsonl');

export const logEventAndEmitResponse = (
    socket: Socket,
    req: any,
    res: string,
    event: string
): void => {
    const logData = JSON.stringify({ req, res });
    if (event === 'bet') {
        failedBetLogger.error(logData);
    }
    socket.emit('betError', { message: res, status: false });
};


export const getUserIP = (socket: any): string => {
    const forwardedFor = socket.handshake.headers?.['x-forwarded-for'];
    if (forwardedFor) {
        const ip = forwardedFor.split(',')[0].trim();
        if (ip) return ip;
    }
    return socket.handshake.address || '';
};


export const getBetResult = (betAmount: number, cards: number[], cat: number, result: string[]): BetResult => {

    const resultData: BetResult = {
        cards,
        cat,
        betAmount,
        winAmount: 0,
        mult: cat == 1 ? 1.78 : 1.84,
        status: 'loss'
    };

    const resultCardNumber = result.map(e => Number(e.slice(1, result.length)));
    let isWin: Boolean = false;

    resultCardNumber.forEach(card => {
        if (cards.includes(card)) isWin = true;
    }); // Common for both cats if cat 1 then anyone condition will fall for win, if cat 2 and no condition matches cat 2 will win

    if (cat == 1 && isWin) {
        resultData.status = 'win';
        resultData.winAmount = Number(Math.min(betAmount * resultData.mult, appConfig.maxCashoutAmount).toFixed(2));
    }

    if (cat == 2 && !isWin) {
        resultData.status = 'win';
        resultData.winAmount = Number(betAmount + (betAmount / (resultData.mult - 1)).toFixed(2));
    }

    return resultData;
};