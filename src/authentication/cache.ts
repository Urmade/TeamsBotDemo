class Cache {
    private cache: {[key:string]:number};

    constructor() {
        this.cache = {};
    }

    get(userId:string) {
        return this.cache[userId];
    }

    set(userId:string,expiryDate:number) {
        this.cache[userId] = expiryDate;
    }
}

export const cache = new Cache();