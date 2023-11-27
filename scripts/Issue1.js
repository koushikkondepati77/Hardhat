import { EIP1193Provider, RequestArguments } from "../../../types";
import {
  numberToRpcQuantity,
  rpcQuantityToNumber,
  rpcQuantityToBigInt,
} from "../jsonrpc/types/base-types";

import { ProviderWrapper } from "./wrapper";

const DEFAULT_GAS_MULTIPLIER = 1;

export class FixedGasProvider extends ProviderWrapper {
  constructor(provider: EIP1193Provider, private readonly _gasLimit: number) {
    super(provider);
  }

  public async request(args: RequestArguments): Promise<unknown> {
    if (args.method === "eth_sendTransaction") {
      const params = this._getParams(args);

      // TODO: Should we validate this type?
      const tx = params[0];
      if (tx !== undefined && tx.gas === undefined) {
        tx.gas = numberToRpcQuantity(this._gasLimit);
      }
    }

    return this._wrappedProvider.request(args);
  }
}

export class FixedGasPriceProvider extends ProviderWrapper {
  constructor(provider: EIP1193Provider, private readonly _gasPrice: number) {
    super(provider);
  }

  public async request(args: RequestArguments): Promise<unknown> {
    if (args.method === "eth_sendTransaction") {
      const params = this._getParams(args);

      // TODO: Should we validate this type?
      const tx = params[0];
      // temporary change to ignore EIP-1559
      if (
        tx !== undefined &&
        tx.gasPrice === undefined &&
        tx.maxFeePerGas === undefined &&
        tx.maxPriorityFeePerGas === undefined
      ) {
        tx.gasPrice = numberToRpcQuantity(this._gasPrice);
      }
    }

    return this._wrappedProvider.request(args);
  }
}

abstract class MultipliedGasEstimationProvider extends ProviderWrapper {
  private _blockGasLimit: number | undefined;

  constructor(
    provider: EIP1193Provider,
    private readonly _gasMultiplier: number
  ) {
    super(provider);
  }

  protected async _getMultipliedGasEstimation(params: any[]): Promise<string> {
    try {
      const realEstimation = (await this._wrappedProvider.request({
        method: "eth_estimateGas",
        params,
      })) as string;

      if (this._gasMultiplier === 1) {
        return realEstimation;
      }

      const normalGas = rpcQuantityToNumber(realEstimation);
      const gasLimit = await this._getBlockGasLimit();

      const multiplied = Math.floor(normalGas * this._gasMultiplier);
      const gas = multiplied > gasLimit ? gasLimit - 1 : multiplied;

      return numberToRpcQuantity(gas);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.toLowerCase().includes("execution error")) {
          const blockGasLimit = await this._getBlockGasLimit();
          return numberToRpcQuantity(blockGasLimit);
        }
      }

      // eslint-disable-next-line @nomicfoundation/hardhat-internal-rules/only-hardhat-error
      throw error;
    }
  }

  private async _getBlockGasLimit(): Promise<number> {
    if (this._blockGasLimit === undefined) {
      const latestBlock = (await this._wrappedProvider.request({
        method: "eth_getBlockByNumber",
        params: ["latest", false],
      })) as { gasLimit: string };

      const fetchedGasLimit = rpcQuantityToNumber(latestBlock.gasLimit);

      // We store a lower value in case the gas limit varies slightly
      this._blockGasLimit = Math.floor(fetchedGasLimit * 0.95);
    }

    return this._blockGasLimit;
  }
}

export class AutomaticGasProvider extends MultipliedGasEstimationProvider {
  constructor(
    provider: EIP1193Provider,
    gasMultiplier: number = DEFAULT_GAS_MULTIPLIER
  ) {
    super(provider, gasMultiplier);
  }

  public async request(args: RequestArguments): Promise<unknown> {
    if (args.method === "eth_sendTransaction") {
      const params = this._getParams(args);

      // TODO: Should we validate this type?
      const tx = params[0];
      if (tx !== undefined && tx.gas === undefined) {
        tx.gas = await this._getMultipliedGasEstimation(params);
      }
    }

    return this._wrappedProvider.request(args);
  }
}

export class AutomaticGasPriceProvider extends ProviderWrapper {
  // We pay the max base fee that can be required if the next
  // EIP1559_BASE_FEE_MAX_FULL_BLOCKS_PREFERENCE are full.
  public static readonly EIP1559_BASE_FEE_MAX_FULL_BLOCKS_PREFERENCE: bigint =
    3n;

  // See eth_feeHistory for an explanation of what this means
  public static readonly EIP1559_REWARD_PERCENTILE = 50;

  private _nodeHasFeeHistory?: boolean;
  private _nodeSupportsEIP1559?: boolean;

    private _fixedMaxPriorityFeePerGas?: bigint;

  // Extend the constructor to accept the fixed maxPriorityFeePerGas
  constructor(
    provider: EIP1193Provider,
    private readonly _fixedMaxPriorityFeePerGasInput?: number
  ) {
    super(provider);
    if (this._fixedMaxPriorityFeePerGasInput !== undefined) {
      this._fixedMaxPriorityFeePerGas = BigInt(this._fixedMaxPriorityFeePerGasInput);
    }
  }


  public async request(args: RequestArguments): Promise<unknown> {
    if (args.method !== "eth_sendTransaction") {
      return this._wrappedProvider.request(args);
    }

    const params = this._getParams(args);

    // TODO: Should we validate this type?
    const tx = params[0];
/*
    if (tx === undefined) {
      return this._wrappedProvider.request(args);
    }

    // We don't need to do anything in these cases
    if (
      tx.gasPrice !== undefined ||
      (tx.maxFeePerGas !== undefined && tx.maxPriorityFeePerGas !== undefined)
    ) {
      return this._wrappedProvider.request(args);
    }

    let suggestedEip1559Values = await this._suggestEip1559FeePriceValues();

    // eth_feeHistory failed, so we send a legacy one
    if (
      tx.maxFeePerGas === undefined &&
      tx.maxPriorityFeePerGas === undefined &&
      suggestedEip1559Values === undefined
    ) {
      tx.gasPrice = numberToRpcQuantity(await this._getGasPrice());
      return this._wrappedProvider.request(args);
    }

    // If eth_feeHistory failed, but the user still wants to send an EIP-1559 tx
    // we use the gasPrice as default values.
    if (suggestedEip1559Values === undefined) {
      const gasPrice = await this._getGasPrice();

      suggestedEip1559Values = {
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: gasPrice,
      };
    }

    let maxFeePerGas =
      tx.maxFeePerGas !== undefined
        ? rpcQuantityToBigInt(tx.maxFeePerGas)
        : suggestedEip1559Values.maxFeePerGas;

    const maxPriorityFeePerGas =
      tx.maxPriorityFeePerGas !== undefined
        ? rpcQuantityToBigInt(tx.maxPriorityFeePerGas)
        : suggestedEip1559Values.maxPriorityFeePerGas;

    if (maxFeePerGas < maxPriorityFeePerGas) {
      maxFeePerGas += maxPriorityFeePerGas;
    }

    tx.maxFeePerGas = numberToRpcQuantity(maxFeePerGas);
    tx.maxPriorityFeePerGas = numberToRpcQuantity(maxPriorityFeePerGas);
    return this._wrappedProvider.request(args);
  }
*/

   if (tx !== undefined) {
      // If fixedMaxPriorityFeePerGas is set, use it for the transaction.
      if (this._fixedMaxPriorityFeePerGas !== undefined) {
        tx.maxPriorityFeePerGas = numberToRpcQuantity(this._fixedMaxPriorityFeePerGas);
      }

      // If there's no maxPriorityFeePerGas, try to suggest fee values based on network conditions
      if (tx.maxPriorityFeePerGas === undefined) {
        let suggestedEip1559Values = await this._suggestEip1559FeePriceValues();

        // eth_feeHistory failed, so we send a legacy one
    if (
      tx.maxFeePerGas === undefined &&
      tx.maxPriorityFeePerGas === undefined &&
      suggestedEip1559Values === undefined
    ) {
      tx.gasPrice = numberToRpcQuantity(await this._getGasPrice());
      return this._wrappedProvider.request(args);
    }

        // Use suggested values if fixedMaxPriorityFeePerGas is not set
        if (suggestedEip1559Values !== undefined && this._fixedMaxPriorityFeePerGas === undefined) {
          let maxFeePerGas =
            tx.maxFeePerGas !== undefined
              ? rpcQuantityToBigInt(tx.maxFeePerGas)
              : suggestedEip1559Values.maxFeePerGas;

          const maxPriorityFeePerGas =
            tx.maxPriorityFeePerGas !== undefined
              ? rpcQuantityToBigInt(tx.maxPriorityFeePerGas)
              : suggestedEip1559Values.maxPriorityFeePerGas;

          if (maxFeePerGas < maxPriorityFeePerGas) {
            maxFeePerGas += maxPriorityFeePerGas;
          }

          tx.maxFeePerGas = numberToRpcQuantity(maxFeePerGas);
          tx.maxPriorityFeePerGas = numberToRpcQuantity(maxPriorityFeePerGas);
        }
      }
    }

    return this._wrappedProvider.request(args);
  }

  private async _getGasPrice(): Promise<bigint> {
    const response = (await this._wrappedProvider.request({
      method: "eth_gasPrice",
    })) as string;

    return rpcQuantityToBigInt(response);
  }

  private async _suggestEip1559FeePriceValues(): Promise<
    | {
        maxFeePerGas: bigint;
        maxPriorityFeePerGas: bigint;
      }
    | undefined
  > {
    if (this._nodeSupportsEIP1559 === undefined) {
      const block = (await this._wrappedProvider.request({
        method: "eth_getBlockByNumber",
        params: ["latest", false],
      })) as any;

      this._nodeSupportsEIP1559 = block.baseFeePerGas !== undefined;
    }

    if (
      this._nodeHasFeeHistory === false ||
      this._nodeSupportsEIP1559 === false
    ) {
      return;
    }

    try {
      const response = (await this._wrappedProvider.request({
        method: "eth_feeHistory",
        params: [
          "0x1",
          "latest",
          [AutomaticGasPriceProvider.EIP1559_REWARD_PERCENTILE],
        ],
      })) as { baseFeePerGas: string[]; reward: string[][] };

      return {
        // Each block increases the base fee by 1/8 at most, when full.
        // We have the next block's base fee, so we compute a cap for the
        // next N blocks here.

        maxFeePerGas:
          (rpcQuantityToBigInt(response.baseFeePerGas[1]) *
            9n **
              (AutomaticGasPriceProvider.EIP1559_BASE_FEE_MAX_FULL_BLOCKS_PREFERENCE -
                1n)) /
          8n **
            (AutomaticGasPriceProvider.EIP1559_BASE_FEE_MAX_FULL_BLOCKS_PREFERENCE -
              1n),

        maxPriorityFeePerGas: rpcQuantityToBigInt(response.reward[0][0]),
      };
    } catch {
      this._nodeHasFeeHistory = false;

      return undefined;
    }
  }
}