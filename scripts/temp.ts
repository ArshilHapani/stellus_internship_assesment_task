import * as anchor from "@coral-xyz/anchor";

import { PublicKey } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";

import keypair from "../utils/privateKey";
import { StakeTokens } from "../target/types/stake_tokens";
import { stakeProgram } from "../utils/helpers";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const user = new PublicKey("5KmTPuuGEwmvUiXFQNo9R8oJCj59cD797qjupATkVUe4");
const tokenMint = new PublicKey("F7zbU4Lqs1cBNX35o6NmuXXjoE2ri7Z9nsLjk7UvmwuV");
const admin = keypair;

const program = anchor.workspace.StakeTokens as anchor.Program<StakeTokens>;
(async function () {
  const [userPDA] = PublicKey.findProgramAddressSync(
    [user.toBuffer(), Buffer.from("user_stake")],
    program.programId
  );
  console.log(userPDA.toBase58());
  const userStake = await stakeProgram.account.userStake.fetch(userPDA);
  console.log(userStake);
})();
