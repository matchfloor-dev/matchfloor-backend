import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
} from 'class-validator';

export function IsAfterDate(
    property: string,
    validationOptions?: ValidationOptions,
) {
    return (object: object, propertyName: string) => {
        registerDecorator({
            name: 'isAfterDate',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if(!value) return true;

                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[
                        relatedPropertyName
                    ];
                    const startDate = new Date(relatedValue);
                    const endDate = new Date(value);
                    return endDate > startDate;
                },
                defaultMessage(args: ValidationArguments) {
                    return `ERR_${args.property.toUpperCase()}_DATE_MUST_BE_AFTER_${args.constraints[0].toUpperCase()}`;
                },
            },
        });
    };
}
