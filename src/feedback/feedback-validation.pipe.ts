import {
  BadRequestException,
  ValidationPipe,
  type ValidationPipeOptions,
} from '@nestjs/common';

const feedbackValidationOptions: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (errors) => {
    const first = errors[0];
    const message =
      Object.values(first?.constraints ?? {})[0] ?? 'Datos inválidos';
    return new BadRequestException({ message });
  },
};

export const FeedbackValidationPipe = new ValidationPipe(
  feedbackValidationOptions,
);
