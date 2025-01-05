import {
  ArgumentMetadata,
  Injectable,
  ValidationPipe,
  ValidationError,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      stopAtFirstError: true, // Stop validation at the first error
      exceptionFactory: (errors: ValidationError[]) => {
        // Extract the first error
        const error = errors[0];
        const field = error.property;

        const message = Object.values(error.constraints || {})[0];

        // Return a custom exception
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          details: { field, message },
        });
      },
    });
  }
}
