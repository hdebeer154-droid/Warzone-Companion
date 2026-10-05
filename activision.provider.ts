import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GameDataProvider,
  GetMatchesOptions,
  ProviderChallengeProgress,
  ProviderIdentity,
  ProviderMatch,
  ProviderProfile,
  ProviderProgression,
  ProviderRef,
  ProviderResult,
  ProviderWeaponStat,
} from '../provider.interface';

/**
 * Activision / Call of Duty provider — INTERFACE STUB.
 *
 * IMPORTANT: This is intentionally NOT a working Activision integration. There is
 * no public, documented, legitimate Activision API available to a third-party
 * mobile companion at this time. We must NOT:
 *   - ask users for their Activision password, or
 *   - ship undocumented auth credentials in the mobile client.
 *
 * This class exists to lock in the contract. When a legitimate, documented data
 * source becomes available (official API, licensed community API, or a
 * server-side authorised OAuth flow), it can be implemented here behind the same
 * GameDataProvider interface without changing any other part of the system.
 *
 * Until then `isAvailable()` returns false and the sync engine transparently
 * falls back to mock/manual/OCR providers.
 */
@Injectable()
export class ActivisionProvider implements GameDataProvider {
  readonly key = 'activision';
  readonly name = 'Activision / Call of Duty (not yet available)';
  private readonly logger = new Logger(ActivisionProvider.name);

  constructor(private readonly config: ConfigService) {}

  async isAvailable(): Promise<boolean> {
    const enabled = this.config.get<boolean>('providers.enableActivision');
    if (!enabled) return false;
    // Even when enabled by config, no legitimate endpoint is configured yet.
    this.logger.warn('Activision provider enabled but no legitimate endpoint configured');
    return false;
  }

  private unavailable(): never {
    throw new ServiceUnavailableException(
      'No legitimate Activision data source is currently configured. ' +
        'This provider is a placeholder and is not a live integration.',
    );
  }

  async getIdentity(_ref: ProviderRef): Promise<ProviderIdentity> {
    return this.unavailable();
  }
  async getProfile(_ref: ProviderRef): Promise<ProviderResult<ProviderProfile>> {
    return this.unavailable();
  }
  async getMatches(_ref: ProviderRef, _opts?: GetMatchesOptions): Promise<ProviderResult<ProviderMatch[]>> {
    return this.unavailable();
  }
  async getMatchDetails(_ref: ProviderRef, _matchId: string): Promise<ProviderMatch> {
    return this.unavailable();
  }
  async getWeaponStats(_ref: ProviderRef): Promise<ProviderResult<ProviderWeaponStat[]>> {
    return this.unavailable();
  }
  async getChallenges(_ref: ProviderRef): Promise<ProviderResult<ProviderChallengeProgress[]>> {
    return this.unavailable();
  }
  async getProgression(_ref: ProviderRef): Promise<ProviderResult<ProviderProgression>> {
    return this.unavailable();
  }
}
