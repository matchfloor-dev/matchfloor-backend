import {
    PipeTransform,
    Injectable,
    BadRequestException,
} from '@nestjs/common';
import * as sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizeBodyPipe implements PipeTransform {
    transform(value: any) {
        if (typeof value !== 'object' || Array.isArray(value)) {
            throw new BadRequestException('ERR_INVALID_BODY');
        }

        return this.sanitizeObject(value);
    }

    private sanitizeObject(obj: any): any {
        const sanitizedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                sanitizedObj[key] = this.sanitizeValue(obj[key]);
            }
        }
        return sanitizedObj;
    }

    private sanitizeValue(value: any): any {
        if (typeof value === 'string') {
            return sanitizeHtml(value, {
                allowedTags: [],
                allowedAttributes: {},
            });
        } else if (typeof value === 'object' && !Array.isArray(value)) {
            return this.sanitizeObject(value);
        } else if (Array.isArray(value)) {
            return value.map((item) => this.sanitizeValue(item));
        }
        return value;
    }
}
