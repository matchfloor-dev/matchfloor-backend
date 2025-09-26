import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsRequired(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsRequired',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value === 'string') {
            return value.trim() !== '';
          }
          return value !== null && value !== undefined;
        },
        defaultMessage(args: ValidationArguments) {
          return `ERR_${args.property.toUpperCase()}_IS_REQUIRED`;
        }
      },
    });
  };
}