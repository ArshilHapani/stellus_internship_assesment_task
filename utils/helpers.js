"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.writeFileContent = exports.simulateTransaction = exports.printTransactionLogs = exports.airdrop = exports.initializeAta = exports.getStakeInfo = exports.transferTokens = exports.createAndMintToken = exports.createMintToken = exports.oneYearInMilliseconds = void 0;
var anchor = require("@coral-xyz/anchor");
var spl_token_1 = require("@solana/spl-token");
var web3_js_1 = require("@solana/web3.js");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var privateKey_1 = require("../utils/privateKey");
//////////////////////////////////////////////////
///////// HELPER FUNCTIONS AND CONSTANTS /////////
//////////////////////////////////////////////////
var provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
var program = anchor.workspace
    .CustomSplTokens;
var payer = privateKey_1["default"];
//////////////////////////////////////////////////
///////////////// TOKEN METADATA /////////////////
//////////////////////////////////////////////////
var metadata = {
    name: "INTERVIEW",
    symbol: "ITW",
    uri: "https://bafkreic6kmxp2ndrkns3plteriluxpezhu53m736fskdjr5cisxn2yfxm4.ipfs.flk-ipfs.xyz"
};
exports.oneYearInMilliseconds = 365 * 24 * 60 * 60 * 1000;
function createMintToken(mintKeyPair) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, program.methods
                        .createTokenMint(0 /** 1 = 1 */, metadata.name, metadata.symbol, metadata.uri)
                        .accounts({
                        payer: payer.publicKey,
                        mintAccount: mintKeyPair.publicKey
                    })
                        .signers([mintKeyPair])
                        .rpc()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.createMintToken = createMintToken;
function createAndMintToken(mintKeyPair, ata, mintAmount) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, createMintToken(mintKeyPair)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, program.methods
                            .mintToken(mintAmount)
                            .accounts({
                            mintAuthority: payer.publicKey,
                            recipient: payer.publicKey,
                            mintAccount: mintKeyPair.publicKey,
                            // @ts-ignore
                            associatedTokenAccount: ata
                        })
                            .rpc()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.createAndMintToken = createAndMintToken;
function transferTokens(mintKeyPair, recipientKeyPair, senderTokenAddress, recipientTokenAddress, transferAmount) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, program.methods
                        .transferToken(transferAmount)
                        .accounts({
                        sender: payer.publicKey,
                        recipient: recipientKeyPair,
                        mintAccount: mintKeyPair.publicKey,
                        // @ts-ignore
                        senderTokenAccount: senderTokenAddress,
                        recipientTokenAccount: recipientTokenAddress
                    })
                        .rpc()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.transferTokens = transferTokens;
var stakeProgram = anchor.workspace
    .StakeTokens;
function getStakeInfo(user, userStakeAccount, stakingAccount) {
    return __awaiter(this, void 0, void 0, function () {
        var userStake, staking, stakedAmount, startTime, currentTime, stakingDuration, stakingDurationInDays, rewardRate, annualReward, dailyReward, earnedReward, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, stakeProgram.account.userStake.fetch(userStakeAccount)];
                case 1:
                    userStake = _a.sent();
                    return [4 /*yield*/, stakeProgram.account.stakingAccount.fetch(stakingAccount)];
                case 2:
                    staking = _a.sent();
                    stakedAmount = userStake.amount.toNumber();
                    startTime = userStake.startTime.toNumber();
                    currentTime = Date.now();
                    // Validation
                    if (startTime > currentTime) {
                        throw new Error("Invalid start time");
                    }
                    if (stakedAmount <= 0) {
                        return [2 /*return*/, { stakedAmount: stakedAmount, reward: 0 }];
                    }
                    stakingDuration = currentTime - startTime;
                    stakingDurationInDays = stakingDuration / (24 * 60 * 60 * 1000);
                    rewardRate = staking.rewardRate;
                    annualReward = (stakedAmount * rewardRate) / 100;
                    dailyReward = annualReward / 365;
                    earnedReward = dailyReward * stakingDurationInDays;
                    return [2 /*return*/, {
                            stakedAmount: stakedAmount,
                            reward: Math.floor(earnedReward)
                        }];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error calculating stake info:", error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.getStakeInfo = getStakeInfo;
function initializeAta(mint, sender, senderAta, receiverPk) {
    return __awaiter(this, void 0, void 0, function () {
        var payer, ata;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    payer = provider.wallet.publicKey;
                    ata = (0, spl_token_1.getAssociatedTokenAddressSync)(mint.publicKey, receiverPk);
                    // dummy transaction
                    return [4 /*yield*/, transferTokens(mint, receiverPk, sender, senderAta, new anchor.BN(0))];
                case 1:
                    // dummy transaction
                    _a.sent();
                    return [2 /*return*/, ata];
            }
        });
    });
}
exports.initializeAta = initializeAta;
function airdrop(receiver, amount) {
    if (amount === void 0) { amount = 1 * web3_js_1.LAMPORTS_PER_SOL; }
    return __awaiter(this, void 0, void 0, function () {
        var signature;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, provider.connection.requestAirdrop(receiver, 1 * web3_js_1.LAMPORTS_PER_SOL)];
                case 1:
                    signature = _a.sent();
                    return [4 /*yield*/, provider.connection.confirmTransaction(signature, "confirmed")];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.airdrop = airdrop;
function printTransactionLogs(signature) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var transaction, logs, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, provider.connection.getTransaction(signature, {
                            commitment: "confirmed"
                        })];
                case 1:
                    transaction = _b.sent();
                    if (!transaction) {
                        console.log("Transaction not found for signature: ".concat(signature));
                        return [2 /*return*/];
                    }
                    logs = (_a = transaction.meta) === null || _a === void 0 ? void 0 : _a.logMessages;
                    if (logs) {
                        console.log("Logs for transaction ".concat(signature, ":"));
                        logs.forEach(function (log, index) {
                            console.log("".concat(index + 1, ": ").concat(log));
                        });
                    }
                    else {
                        console.log("No logs found for transaction ".concat(signature, "."));
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _b.sent();
                    console.error("Error fetching transaction logs: ".concat(error_2.message));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.printTransactionLogs = printTransactionLogs;
function simulateTransaction(instructions, signers) {
    var _a, _b;
    if (signers === void 0) { signers = []; }
    return __awaiter(this, void 0, void 0, function () {
        var tx_1, _c, simulationResult, logs, error_3;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 3, , 4]);
                    tx_1 = new web3_js_1.Transaction();
                    tx_1.add.apply(tx_1, instructions);
                    // Partially sign the transaction with provided signers
                    tx_1.feePayer = provider.wallet.publicKey;
                    _c = tx_1;
                    return [4 /*yield*/, provider.connection.getLatestBlockhash()];
                case 1:
                    _c.recentBlockhash = (_d.sent()).blockhash;
                    signers.forEach(function (signer) { return tx_1.partialSign(signer); });
                    return [4 /*yield*/, provider.connection.simulateTransaction(tx_1)];
                case 2:
                    simulationResult = _d.sent();
                    logs = (_a = simulationResult.value) === null || _a === void 0 ? void 0 : _a.logs;
                    if (logs && logs.length > 0) {
                        console.log("Transaction simulation logs:");
                        logs.forEach(function (log, index) {
                            console.log("".concat(index + 1, ": ").concat(log));
                        });
                    }
                    else {
                        console.log("No logs available from the simulation.");
                    }
                    // Handle errors in simulation
                    if ((_b = simulationResult.value) === null || _b === void 0 ? void 0 : _b.err) {
                        console.error("Simulation error:", simulationResult.value.err);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _d.sent();
                    console.error("Error simulating transaction:", error_3);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.simulateTransaction = simulateTransaction;
function writeFileContent(filePath, content) {
    var stringifiedContent = JSON.stringify(content, null, 2);
    var resolvedPath = node_path_1["default"].resolve(filePath);
    // stream for large files
    var stream = node_fs_1["default"].createWriteStream(resolvedPath);
    stream.write(stringifiedContent);
    stream.end();
}
exports.writeFileContent = writeFileContent;
