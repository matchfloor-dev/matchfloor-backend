import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsAfterToday(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfterToday',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
            console.log('validating', value)
          // Get the current date in milliseconds
          const now = new Date().getTime();

          // Check if the value is greater than now
          return typeof value === 'number' && Number(value) > Number(now);
        },
        defaultMessage(args: ValidationArguments) {
          return `ERR_${args.property.toUpperCase()}_MUST_BE_AFTER_TODAY`;
        },
      },
    });
  };
}