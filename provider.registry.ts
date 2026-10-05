import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GameDataProvider } from './provider.interface';

/**
 * Central registry of available data providers. Providers self-register here.
 * Consumers resolve by key, so swapping the active provider is a one-line change.
 */
@Injectable()
export class ProviderRegistry {
  private readonly logger = new Logger(ProviderRegistry.name);
  private readonly providers = new Map<string, GameDataProvider>();

  register(provider: GameDataProvider): void {
    if (this.providers.has(provider.key)) {
      this.logger.warn(`Provider '${provider.key}' already registered; overwriting`);
    }
    this.providers.set(provider.key, provider);
    this.logger.log(`Registered data provider: ${provider.key} (${provider.name})`);
  }

  get(key: string): GameDataProvider {
    const provider = this.providers.get(key);
    if (!provider) throw new NotFoundException(`Unknown data provider: ${key}`);
    return provider;
  }

  has(key: string): boolean {
    return this.providers.has(key);
  }

  list(): { key: string; name: string }[] {
    return [...this.providers.values()].map((p) => ({ key: p.key, name: p.name }));
  }
}
