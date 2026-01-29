/**
 * Type declarations for formidable module
 * This provides basic TypeScript support for formidable
 */
declare module 'formidable' {
    import { IncomingMessage } from 'http';

    export interface Fields {
        [key: string]: string | string[];
    }

    export interface Files {
        [key: string]: File | File[];
    }

    export interface File {
        filepath: string;
        originalFilename?: string;
        mimetype?: string;
        size: number;
        newFilename: string;
        hash?: string;
    }

    export interface Options {
        uploadDir?: string;
        keepExtensions?: boolean;
        maxFileSize?: number;
        maxFieldsSize?: number;
        maxFields?: number;
        hash?: boolean | string;
        multiples?: boolean;
    }

    export interface FormidableError extends Error {
        httpCode?: number;
    }

    export class IncomingForm {
        constructor(options?: Options);
        parse(
            req: IncomingMessage,
            callback: (err: FormidableError | null, fields: Fields, files: Files) => void
        ): void;
        on(event: string, callback: (...args: any[]) => void): this;
        once(event: string, callback: (...args: any[]) => void): this;
    }

    export default function formidable(options?: Options): IncomingForm;
    export { formidable };
}
