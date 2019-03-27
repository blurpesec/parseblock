import * as fs from 'fs';
import * as blocksee from './block';
import { BN } from 'bn.js';

const transactionHistory = {}

const parseBlock = ( block ) => {
  const timestamp = block.result.timestamp;

  block.result.transactions.map( async entry => {
    const sender = entry.from;
    const receiver = entry.to;
    const input: string = entry.input;
    const methodID = input.substring(0,10);
    const slimmedEntry: slimmedEntry = (({ to, from, value, nonce, blockNumber, gas, gasPrice, input }) => ({ to, from, value, nonce, blockNumber, gas, gasPrice, input, type: 'simple', timestamp: hexStringToNumber(timestamp) }))(entry);
    if (methodID === '0xa9059cbb') { // ERC20 Transfers
      slimmedEntry['type'] = 'erc20';
      slimmedEntry['transferTo'] = getAddressFromHexWrapper(input.substring(11,74));
      slimmedEntry['transferValue'] = parseFloat(new BN(input.substring(75, 138), 16));    
    }

    if (transactionHistory[sender]) {
      transactionHistory[sender].push(slimmedEntry);
    } else {
      transactionHistory[sender] = [];
      transactionHistory[sender].push(slimmedEntry);
    }
    if (transactionHistory[receiver]) {
      transactionHistory[receiver].push(slimmedEntry);
    } else {
      transactionHistory[receiver] = [];
      transactionHistory[receiver].push(slimmedEntry);
    }

    if (slimmedEntry.type === 'erc20' && transactionHistory[slimmedEntry.transferTo]) {
      transactionHistory[slimmedEntry.transferTo].push(slimmedEntry)
    } else if (slimmedEntry.type === 'erc20' && !transactionHistory[slimmedEntry.transferTo]) {
      transactionHistory[slimmedEntry.transferTo] = [];
      transactionHistory[slimmedEntry.transferTo].push(slimmedEntry)
    }
  })

}


const start = async (): Promise<any> => {
  var count = 0;
  console.time('test')
  parseBlock(blocksee);
  console.timeEnd('test')
  fs.writeFile('./out.json', JSON.stringify(transactionHistory, null, 4), (err) => {
    if (err) console.log(err);
  });
}

export interface FullTransaction {
  blockHash: string,
  blockNumber: string,
  chainId: string,
  condition: boolean,
  creates: boolean,
  from: string,
  gas: string,
  gasPrice: string,
  hash: string,
  input: string,
  nonce: string,
  publicKey: string,
  r: string,
  raw: string,
  s: string,
  standardV: string,
  to: string,
  transactionIndex: string,
  v: string,
  value: string
}

export interface slimmedEntry {
  to: string;
  from: string;
  value: string;
  nonce: string;
  blockNumber: string;
  type: string;
  transferTo?: string;
  transferValue?: number;
  timestamp: number;
  gas: string;
  gasPrice: string; 
  input: string;
}

start();


export function getAddressFromHexWrapper(str: string): string {
  return '0x' + str.substring(23,74)
}


export function hexStringToNumber(str: string): number {
  return parseInt(str, 16)
}