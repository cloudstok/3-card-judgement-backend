import { Server, Socket } from "socket.io";
import { placeBet } from "../module/bets/bets-session";
import { BetReqData } from "../interfaces";

export const eventRouter = async (io: Server, socket: Socket): Promise<void> => {
    socket.on('bet', (data: BetReqData) =>  placeBet(socket, data));
};
