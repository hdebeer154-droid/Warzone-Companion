import { Injectable } from '@nestjs/common';
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
 * Screenshot / OCR provider.
 *
 * OCR-derived updates are applied directly by the OcrModule (with confidence
 * gating and user confirmation). This provider is the sync-engine-facing handle
 * for that source: it never makes external calls and never overwrites data, so
 * the pipeline keeps working even when no external API is available.
 */
@Injectable()
export class OcrProvider implements GameDataProvider {
  readonly key = 'ocr';
  readonly name = 'Screenshot / OCR';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getIdentity(ref: ProviderRef): Promise<ProviderIdentity> {
    return { externalId: `ocr-${ref.accountId}`, username: ref.platformUsername ?? 'OCR', platform: ref.platform ?? 'UNKNOWN' };
  }

  async getProfile(_ref: ProviderRef): Promise<ProviderResult<ProviderProfile>> {
    return {
      data: { level: 0, prestige: 0, xp: 0, totalMatches: 0, wins: 0, kills: 0, deaths: 0, assists: 0, damage: 0 },
      stale: true,
      fetchedAt: new Date(),
    };
  }

  async getMatches(_ref: ProviderRef, _opts?: GetMatchesOptions): Promise<ProviderResult<ProviderMatch[]>> {
    return { data: [], stale: true, fetchedAt: new Date() };
  }

  async getMatchDetails(): Promise<ProviderMatch> {
    throw new Error('OCR provider does not expose match details');
  }

  async getWeaponStats(_ref: ProviderRef): Promise<ProviderResult<ProviderWeaponStat[]>> {
    return { data: [], stale: true, fetchedAt: new Date() };
  }

  async getChallenges(_ref: ProviderRef): Promise<ProviderResult<ProviderChallengeProgress[]>> {
    return { data: [], stale: true, fetchedAt: new Date() };
  }

  async getProgression(_ref: ProviderRef): Promise<ProviderResult<ProviderProgression>> {
    return { data: { level: 0, prestige: 0, xp: 0, challenges: [] }, stale: true, fetchedAt: new Date() };
  }
}
