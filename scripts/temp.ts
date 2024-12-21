import * as anchor from "@coral-xyz/anchor";

import { PublicKey } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";

import keypair from "../utils/privateKey";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const user = new PublicKey("5KmTPuuGEwmvUiXFQNo9R8oJCj59cD797qjupATkVUe4");
const tokenMint = new PublicKey("F7zbU4Lqs1cBNX35o6NmuXXjoE2ri7Z9nsLjk7UvmwuV");
const admin = keypair;

(async function () {
  const metaplex = Metaplex.make(provider.connection);
  const nft = await metaplex.nfts().findByMint({ mintAddress: tokenMint });

  const metadata = {
    name: nft.name,
    symbol: nft.symbol,
    uri: nft.uri,
    sellerFeeBasisPoints: nft.sellerFeeBasisPoints,
    creators: nft.creators,
    image: nft.json?.image,
    attributes: nft.json?.attributes,
  };
  console.log({ metadata });
})();
