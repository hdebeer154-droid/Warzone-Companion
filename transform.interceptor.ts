import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

/**
 * Wraps successful responses in a consistent envelope. Responses that already
 * look like an envelope (or are raw streams) pass through untouched.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiEnvelope<T> | T> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiEnvelope<T> | T> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data as ApiEnvelope<T>;
        }
        return { success: true, data };
      }),
    );
  }
}
