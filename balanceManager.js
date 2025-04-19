// balanceManager.js
const fs = require('fs').promises;
const path = require('path');

const BALANCE_FILE = path.join(__dirname, 'data', 'balances.json');
const TOLL_AMOUNT = 250; // Fixed toll amount (e.g., ₹20)
const MIN_TOPUP_AMOUNT = 10; // Minimum amount for top-up
const MAX_TOPUP_AMOUNT = 10000; // Maximum amount for top-up

class BalanceManager {
    constructor() {
        this.balances = {};
        this.initialized = false;
    }

    async init() {
        try {
            try {
                // Create data directory if it doesn't exist
                await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
            } catch (error) {
                // Directory might already exist, which is fine
            }

            try {
                const data = await fs.readFile(BALANCE_FILE, 'utf8');
                this.balances = JSON.parse(data);
                
                // Validate stored balances to ensure they're numbers
                Object.keys(this.balances).forEach(uid => {
                    if (typeof this.balances[uid] !== 'number') {
                        console.warn(`Invalid balance for UID ${uid}, resetting to 0`);
                        this.balances[uid] = 0;
                    }
                });
            } catch (error) {
                // If file doesn't exist or can't be parsed, create empty balances file
                this.balances = {};
                await this.saveBalances();
            }
            
            this.initialized = true;
            console.log('Balance manager initialized successfully');
        } catch (error) {
            console.error('Error initializing balance manager:', error);
            throw error;
        }
    }

    async saveBalances() {
        try {
            await fs.writeFile(BALANCE_FILE, JSON.stringify(this.balances, null, 2), 'utf8');
        } catch (error) {
            console.error('Error saving balances:', error);
            throw error;
        }
    }

    _validateUid(uid) {
        if (!uid || typeof uid !== 'string' || uid.trim() === '') {
            throw new Error('Invalid UID format');
        }
        return uid.trim().toUpperCase();
    }

    _validateAmount(amount) {
        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            throw new Error('Amount must be a positive number');
        }
        return numAmount;
    }

    getBalance(uid) {
        try {
            uid = this._validateUid(uid);
            return this.balances[uid] || 0;
        } catch (error) {
            console.error('Error getting balance:', error);
            return 0;
        }
    }

    getAllBalances() {
        return this.balances;
    }

    async addBalance(uid, amount) {
        try {
            uid = this._validateUid(uid);
            amount = this._validateAmount(amount);

            // Additional validation for top-up limits
            if (amount < MIN_TOPUP_AMOUNT) {
                throw new Error(`Minimum top-up amount is ₹${MIN_TOPUP_AMOUNT}`);
            }
            
            if (amount > MAX_TOPUP_AMOUNT) {
                throw new Error(`Maximum top-up amount is ₹${MAX_TOPUP_AMOUNT}`);
            }

            // Initialize balance if user doesn't exist
            if (!this.balances[uid]) {
                this.balances[uid] = 0;
            }

            this.balances[uid] += amount;
            await this.saveBalances();
            return this.balances[uid];
        } catch (error) {
            console.error('Error adding balance:', error);
            throw error;
        }
    }

    async deductToll(uid) {
        try {
            uid = this._validateUid(uid);

            // Initialize balance if user doesn't exist
            if (!this.balances[uid]) {
                this.balances[uid] = 0;
            }

            // Check if balance is sufficient
            if (this.balances[uid] < TOLL_AMOUNT) {
                return {
                    success: false,
                    message: 'Insufficient balance',
                    balance: this.balances[uid]
                };
            }

            // Deduct toll amount
            this.balances[uid] -= TOLL_AMOUNT;
            await this.saveBalances();

            return {
                success: true,
                message: 'Toll deducted successfully',
                deducted: TOLL_AMOUNT,
                balance: this.balances[uid]
            };
        } catch (error) {
            console.error('Error deducting toll:', error);
            return {
                success: false,
                message: 'Error processing payment',
                balance: this.balances[uid] || 0
            };
        }
    }

    getTollAmount() {
        return TOLL_AMOUNT;
    }
    
    getMinTopupAmount() {
        return MIN_TOPUP_AMOUNT;
    }
    
    getMaxTopupAmount() {
        return MAX_TOPUP_AMOUNT;
    }
}

module.exports = new BalanceManager();