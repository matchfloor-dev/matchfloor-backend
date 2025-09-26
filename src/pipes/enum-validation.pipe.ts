import {
    PipeTransform,
    Injectable,
    BadRequestException,
  } from '@nestjs/common';
  
  @Injectable()
  export class EnumValidationPipe implements PipeTransform {
    constructor(private readonly enumType: object, private readonly exceptionMessage: string) {}
  
    transform(value: any) {
      if (!Object.values(this.enumType).includes(value)) {
        throw new BadRequestException(this.exceptionMessage);
      }
      return value;
    }
  }