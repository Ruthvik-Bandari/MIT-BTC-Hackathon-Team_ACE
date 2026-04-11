/**
 * Type declarations for @cogcoin/client.
 *
 * This stub provides type safety until the actual @cogcoin/client package
 * is installed via team access. Once installed, the package's own types
 * will take precedence over this declaration.
 */
declare module "@cogcoin/client" {
  interface CogcoinClientOptions {
    apiKey: string;
    network: "signet" | "testnet" | "mainnet";
  }

  interface IdentityRegisterParams {
    name: string;
    metadata?: Record<string, unknown>;
  }

  interface IdentityResult {
    id: string;
    name: string;
    publicKey: string;
    registeredAt?: string;
  }

  interface AnchorCreateParams {
    identityId: string;
    prefix: string;
    data: string;
    metadata?: Record<string, unknown>;
  }

  interface AnchorResult {
    txId: string;
    opReturnHex: string;
    confirmed?: boolean;
    blockHeight?: number;
  }

  interface AnchorVerifyParams {
    txId: string;
    prefix: string;
  }

  interface AnchorVerifyResult {
    verified: boolean;
    data?: string;
    blockHeight?: number;
    confirmations?: number;
  }

  export class CogcoinClient {
    constructor(options: CogcoinClientOptions);

    identity: {
      register(params: IdentityRegisterParams): Promise<IdentityResult>;
    };

    anchor: {
      create(params: AnchorCreateParams): Promise<AnchorResult>;
      verify(params: AnchorVerifyParams): Promise<AnchorVerifyResult>;
    };
  }
}
