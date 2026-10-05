import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ProviderRegistry } from './provider.registry';
import { MockProvider } from './providers/mock.provider';
import { ManualProvider } from './providers/manual.provider';
import { OcrProvider } from './providers/ocr.provider';
import { ActivisionProvider } from './providers/activision.provider';

@Global()
@Module({
  providers: [ProviderRegistry, MockProvider, ManualProvider, OcrProvider, ActivisionProvider],
  exports: [ProviderRegistry],
})
export class ProvidersModule implements OnModuleInit {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly mock: MockProvider,
    private readonly manual: ManualProvider,
    private readonly ocr: OcrProvider,
    private readonly activision: ActivisionProvider,
  ) {}

  onModuleInit(): void {
    // Registration order matters only for defaults; resolution is by key.
    this.registry.register(this.mock);
    this.registry.register(this.manual);
    this.registry.register(this.ocr);
    this.registry.register(this.activision);
  }
}
