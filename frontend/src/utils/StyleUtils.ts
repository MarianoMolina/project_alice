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
    
    // Replace underscores with spaces and ensure proper spacing
    return str
        // Replace underscores with spaces
        .replace(/_/g, ' ')
        // Capitalize first letter of each word (optional)
        .replace(/\b\w/g, c => c.toUpperCase());
}