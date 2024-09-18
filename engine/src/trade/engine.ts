import { RedisManager } from "../redisManager";
import { MessageFromAPI, UserBalance } from "../types/engine";
import { BASE_CURRENCY, Fill, Order } from "../types/orderbook";
import { Orderbook } from "./orderbook";
import fs from "fs";


export class Engine {
    private balances: Map<string, UserBalance> = new Map();
    private orderbooks: Orderbook[] = [];

    constructor() {
        let snapshot = null;
        try {
            if(process.env.WITH_SNAPSHOT) {
                snapshot = fs.readFileSync("./snapshot.json");
            }
        }
        catch(err) {
            console.log("No snapshot found")
        }

        if(snapshot) {
            //if snapshot exists, restore it
            const snapshotSnapshot = JSON.parse(snapshot.toString());
            this.orderbooks = snapshotSnapshot.orderbooks.map((o: any) => new Orderbook(o.baseAsset, o.bids, o.asks, o.lastTradeId, o.currentPrice));
            this.balances = new Map(snapshotSnapshot.balances);
        }
        else {
            //create new orderbooks
            this.orderbooks.push(new Orderbook("SOL",[], [], 0, 0));
            this.orderbooks.push(new Orderbook("BTC", [], [], 0, 0));
            this.orderbooks.push(new Orderbook("ETH", [], [], 0, 0));
            this.orderbooks.push(new Orderbook("SHIB", [], [], 0, 0));
            this.orderbooks.push(new Orderbook("HNT", [], [], 0, 0));

            this.addDummyBalances();
        }

        setInterval(()  => {
            //save snapshots every 3 seconds
        }, 3 * 1000);
    }

    saveSnapshot() {
        const snapshotSnapshot = {
            orderbooks: this.orderbooks.map(o => o.getSnapshot()),
            balances: Array.from(this.balances.entries())
        }
        fs.writeFileSync("./snapshot.json", JSON.stringify(snapshotSnapshot));
    }

    process({ clientId, message }: { clientId: string, message: MessageFromAPI}) {
        const type = message.type;

        switch(type) {
            case "CREATE_ORDER":
                try {
                    const { executedQty, fills, orderId } = this.createOrder(message.data.market, message.data.price, message.data.quantity, message.data.side, message.data.userId);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_PLACED",
                        payload: {
                            orderId,
                            executedQty,
                            fills
                        }
                    });
                }
                catch(err) {
                     console.log(err);
                     //publish the msg on client id channel
                     RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_CANCELLED",
                        payload: {
                            orderId: "",
                            executedQty: 0,
                            remainingQty: 0
                        }
                     });
                }
                break;
            case "CANCEL_ORDER":

                break;
            case "ON_RAMP":

                break;
            case "GET_DEPTH":

                break;
            case "GET_OPEN_ORDERS":

                break;
        }
    }

    createOrder(market: string, price: string, quantity: string, side: "buy" | "sell", userId: string) {
        try {

        }
        catch(err) {
            console.log(err);
        }
        const orderbook = this.orderbooks.find(o => o.ticker() === market);
        if(!orderbook)
            throw new Error("No orderbook found");

        const baseAsset = market.split("_")[0];
        const quoteAsset = market.split("_")[1];

        //check and lock funds of the user
        this.checkAndLockFunds(baseAsset, quoteAsset, side, userId, price, quantity);

        //create order
        const order: Order = {
            price: Number(price),
            quantity: Number(quantity),
            orderId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            filled: 0,
            side,
            userId
        }

        //send to orderbook
        const { executedQty, fills } = orderbook.addOrder(order);
        //update balance
        //create db trades
        //update db orders
        //publish ws depth updates
        //publish ws trades

        return { executedQty, fills, orderId: order.orderId };
    }

    checkAndLockFunds(baseAsset: string, quoteAsset: string, side: "buy" | "sell", userId: string, price: string, quantity: string) {
        //check if the user has sufficient balance and lock it
        
        if(side === "buy") {
            const user = this.balances.get(userId);
            if(!user)
                throw new Error("User not found");
            if(user?.[quoteAsset]?.available < Number(quantity) * Number(price)) {
                throw new Error("Insufficient funds");
            }

            //shift the amount from available to locked balance
            user[quoteAsset].available -= Number(price) * Number(quantity);
            user[quoteAsset].locked += Number(price) * Number(quantity);
        }
        else {
            const user = this.balances.get(userId);
            if(!user)
                    throw new Error("User not found");
            if(user[baseAsset].available < Number(price) * Number(quantity)) {
                throw new Error("Insufficient funds");
            }

            //shift the amount from available to locked
            user[baseAsset].available -= Number(price) * Number(quantity);
            user[baseAsset].locked += Number(price) * Number(quantity);
        }
    }

    addDummyBalances() {
        this.balances.set("1", {
            [BASE_CURRENCY]: {
                available: 10000,
                locked: 0
            },
            "BTC": {
                available: 0,
                locked: 0
            },
            "SOL": {
                available: 0,
                locked: 0
            },
            "ETH": {
                available: 0,
                locked: 0
            },
            "SHIB": {
                available: 0,
                locked: 0
            },
            "HNT": {
                available: 0,
                locked: 0
            }
        });
        this.balances.set("2", {
            [BASE_CURRENCY]: {
                available: 10000,
                locked: 0
            },
            "BTC": {
                available: 0,
                locked: 0
            },
            "SOL": {
                available: 0,
                locked: 0
            },
            "ETH": {
                available: 0,
                locked: 0
            },
            "SHIB": {
                available: 0,
                locked: 0
            },
            "HNT": {
                available: 0,
                locked: 0
            }
        });
        this.balances.set("3", {
            [BASE_CURRENCY]: {
                available: 10000,
                locked: 0
            },
            "BTC": {
                available: 0,
                locked: 0
            },
            "SOL": {
                available: 0,
                locked: 0
            },
            "ETH": {
                available: 0,
                locked: 0
            },
            "SHIB": {
                available: 0,
                locked: 0
            },
            "HNT": {
                available: 0,
                locked: 0
            }
        });
        this.balances.set("4", {
            [BASE_CURRENCY]: {
                available: 10000,
                locked: 0
            },
            "BTC": {
                available: 0,
                locked: 0
            },
            "SOL": {
                available: 0,
                locked: 0
            },
            "ETH": {
                available: 0,
                locked: 0
            },
            "SHIB": {
                available: 0,
                locked: 0
            },
            "HNT": {
                available: 0,
                locked: 0
            }
        });
        this.balances.set("5", {
            [BASE_CURRENCY]: {
                available: 10000,
                locked: 0
            },
            "BTC": {
                available: 0,
                locked: 0
            },
            "SOL": {
                available: 0,
                locked: 0
            },
            "ETH": {
                available: 0,
                locked: 0
            },
            "SHIB": {
                available: 0,
                locked: 0
            },
            "HNT": {
                available: 0,
                locked: 0
            }
        });
    }
}