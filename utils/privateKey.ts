import fs from "node:fs";
import os from "node:os";

import { Keypair } from "@solana/web3.js";

const keyDir = `${os.homedir()}/.config/solana/id.json`;
const fileContent = JSON.parse(fs.readFileSync(keyDir, "utf8"));

const keypair = Keypair.fromSecretKey(Uint8Array.from(fileContent));
export default keypair;
