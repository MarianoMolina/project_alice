import { CHAR_TO_TOKEN } from "./Constants";

export enum LengthUnit {
    CHARACTERS = 'characters',
    TOKENS = 'tokens'
}

export enum OutputFormat {
    VALUE = 'value',
    STRING = 'string'
}

interface FormatOptions {
    unit: LengthUnit;
    format: OutputFormat;
}

/**
 * Converts a number to a human-readable string with magnitude suffixes
 * @param num The number to format
 * @returns Formatted string (e.g., "1.2k", "3.4m", etc.)
 */
function formatWithMagnitude(num: number): string {
    if (num < 1000) return num.toString();

    const magnitudes = ['', 'k', 'm', 'b', 't', 'q'];
    const order = Math.floor(Math.log10(num) / 3);
    
    if (order >= magnitudes.length) {
        return '∞'; // For extremely large numbers
    }
    
    const divisor = Math.pow(10, order * 3);
    const scaled = num / divisor;
    
    // Format with at most 1 decimal place, and remove .0 if present
    const formatted = scaled.toFixed(1).replace(/\.0$/, '');
    return `${formatted}${magnitudes[order]}`;
}

/**
 * Calculates string length in either characters or tokens
 * @param str Input string
 * @param opts Configuration options for unit and output format
 * @returns Length in specified format
 */
export function getStringLength(str: string, opts: FormatOptions): string | number {
    if (!str) return opts.format === OutputFormat.STRING ? '0' : 0;

    // Calculate base value
    let value: number;
    if (opts.unit === LengthUnit.CHARACTERS) {
        value = str.length;
    } else {
        const charToTokenRatio = CHAR_TO_TOKEN;
        value = Math.ceil(str.length / charToTokenRatio);
    }

    // Return in requested format
    if (opts.format === OutputFormat.VALUE) {
        return value;
    }

    return formatWithMagnitude(value);
}

/**
 * Convenience method for getting character count
 */
export function getCharacterCount(str: string, asString: boolean = false): string | number {
    return getStringLength(str, {
        unit: LengthUnit.CHARACTERS,
        format: asString ? OutputFormat.STRING : OutputFormat.VALUE
    });
}

/**
 * Convenience method for getting token count
 */
export function getTokenCount(str: string, asString: boolean = false): string | number {
    return getStringLength(str, {
        unit: LengthUnit.TOKENS,
        format: asString ? OutputFormat.STRING : OutputFormat.VALUE
    });
}

// Type guard for string | number return type
export function isStringOutput(output: string | number): output is string {
    return typeof output === 'string';
}