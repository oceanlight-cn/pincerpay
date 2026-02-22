/**
 * Bridge between @pincerpay/solana/squads (kit v5 instruction format)
 * and @solana/web3.js v1 (wallet adapter format).
 *
 * The Squads instruction builders return kit v5 `Instruction` objects.
 * Wallet adapter expects web3.js v1 `Transaction` objects.
 * This module converts between the two.
 */

import {
  Transaction,
  TransactionInstruction,
  PublicKey,
  Connection,
  type TransactionBlockhashCtor,
} from "@solana/web3.js";
import {
  createSmartAccountInstruction,
  addSpendingLimitInstruction,
  removeSpendingLimitInstruction,
  SpendingLimitPeriod,
} from "@pincerpay/solana/squads";

/**
 * Kit v5 Instruction shape (inline to avoid importing @solana/kit in dashboard).
 * accounts[].role: 0=readonly, 1=writable, 2=signer, 3=writable+signer
 */
interface KitInstruction {
  programAddress: string;
  accounts: Array<{ address: string; role: number }>;
  data: Uint8Array;
}

function convertInstruction(ix: KitInstruction): TransactionInstruction {
  return new TransactionInstruction({
    programId: new PublicKey(ix.programAddress),
    keys: ix.accounts.map((acc) => ({
      pubkey: new PublicKey(acc.address),
      isSigner: (acc.role & 2) !== 0,
      isWritable: (acc.role & 1) !== 0,
    })),
    data: Buffer.from(ix.data),
  });
}

async function buildTransaction(
  instructions: KitInstruction[],
  connection: Connection,
  feePayer: PublicKey,
): Promise<Transaction> {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  const tx = new Transaction({
    blockhash,
    lastValidBlockHeight,
    feePayer,
  } as TransactionBlockhashCtor);
  for (const ix of instructions) {
    tx.add(convertInstruction(ix));
  }
  return tx;
}

export async function buildCreateSmartAccountTx(params: {
  creator: string;
  accountIndex: number;
  members: string[];
  threshold: number;
  connection: Connection;
}): Promise<Transaction> {
  const ix = await createSmartAccountInstruction({
    creator: params.creator as never,
    accountIndex: params.accountIndex,
    members: params.members as never[],
    threshold: params.threshold,
  });

  return buildTransaction(
    [ix as unknown as KitInstruction],
    params.connection,
    new PublicKey(params.creator),
  );
}

export async function buildAddSpendingLimitTx(params: {
  smartAccountPda: string;
  mint: string;
  amount: bigint;
  period: SpendingLimitPeriod;
  members: string[];
  destinations: string[];
  spendingLimitIndex: number;
  authority: string;
  connection: Connection;
}): Promise<Transaction> {
  const ix = await addSpendingLimitInstruction(
    {
      smartAccountPda: params.smartAccountPda as never,
      mint: params.mint as never,
      amount: params.amount,
      period: params.period,
      members: params.members as never[],
      destinations: params.destinations as never[],
    },
    params.spendingLimitIndex,
    params.authority as never,
  );

  return buildTransaction(
    [ix as unknown as KitInstruction],
    params.connection,
    new PublicKey(params.authority),
  );
}

export async function buildRemoveSpendingLimitTx(params: {
  smartAccountPda: string;
  spendingLimitIndex: number;
  authority: string;
  rentCollector: string;
  connection: Connection;
}): Promise<Transaction> {
  const ix = await removeSpendingLimitInstruction({
    smartAccountPda: params.smartAccountPda as never,
    spendingLimitIndex: params.spendingLimitIndex,
    authority: params.authority as never,
    rentCollector: params.rentCollector as never,
  });

  return buildTransaction(
    [ix as unknown as KitInstruction],
    params.connection,
    new PublicKey(params.authority),
  );
}

export { SpendingLimitPeriod };
