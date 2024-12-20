"use strict";
exports.__esModule = true;
var node_fs_1 = require("node:fs");
var node_os_1 = require("node:os");
var web3_js_1 = require("@solana/web3.js");
var keyDir = "".concat(node_os_1["default"].homedir(), "/.config/solana/id.json");
var fileContent = JSON.parse(node_fs_1["default"].readFileSync(keyDir, "utf8"));
var keypair = web3_js_1.Keypair.fromSecretKey(Uint8Array.from(fileContent));
exports["default"] = keypair;
