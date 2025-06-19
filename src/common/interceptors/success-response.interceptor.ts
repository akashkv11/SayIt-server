import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SuccessResponseInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Format the response
        return {
          success: true,
          message: data?.message || 'Operation successful',
          data: data?.data || data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
