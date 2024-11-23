export const hexToRgba = (hex: string, opacity: number): string => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
export const formatStringWithSpaces = (str: string): string => {
    // Handle empty or null strings
    if (!str) return '';

    // Replace underscores with spaces and ensure proper spacing
    return str
        // Replace underscores with spaces
        .replace(/_/g, ' ')
        // Capitalize first letter of each word (optional)
        .replace(/\b\w/g, c => c.toUpperCase());
};

export const formatCamelCaseString = (str: string): string => {
    // Handle empty or null strings
    if (!str) return '';
    return str
        // Replace underscores with spaces
        .replace(/_/g, ' ')
        // Handle acronyms: insert space before last capital in a sequence if followed by lowercase
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        // Add space before any capital letter that follows a lowercase letter
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        // Add space before any capital letter that follows a number
        .replace(/([0-9])([A-Z])/g, '$1 $2')
        // Add space after any number that follows a letter
        .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
        // Capitalize first letter of each word
        .replace(/\b\w/g, c => c.toUpperCase());
};