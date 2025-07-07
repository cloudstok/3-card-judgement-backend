import { BetResult } from '../interfaces';
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


export const getBetResult = (betAmount: number, chip: number, cat: number, result: number | null): BetResult => {
    let mult: number = 0;
    if(cat == 1) mult = staticMults[chip].b;
    if(cat == 2) mult = staticMults[chip].l - 1;
    const resultData: BetResult = {
        chip,
        cat,
        betAmount,
        winAmount: 0,
        mult: Number(mult.toFixed(2)),
        status: 'loss'
    };

    if ((cat == 1 && chip == result)) {
        resultData.status = 'win';
        resultData.winAmount = Math.min(betAmount * resultData.mult, appConfig.maxCashoutAmount);
    }

    if(cat == 2 && chip != result){
        resultData.status = 'win';
        resultData.winAmount = betAmount + (betAmount / resultData.mult);
    }

    return resultData;
};