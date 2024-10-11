/**
 * Extracts the ID from either a string or an object with an _id property.
 * @param field The field which might be a string ID or an object with an _id property.
 * @returns The ID as a string, or an empty string if no valid ID is found.
 */
export const getFieldId = (field: string | { _id?: string } | null | undefined): string => {
    if (typeof field === 'string') {
        return field;
    } else if (field && typeof field === 'object' && '_id' in field) {
        return field._id || '';
    }
    return '';
};

export const convertToMapWithIds = (obj: { [key: string]: any }) => {
    const map = new Map<string, string>();
    Object.entries(obj).forEach(([key, value]) => {
        map.set(key, getFieldId(value));
    });
    return map;
};

export const convertToMap = (obj: any): Map<string, string> => {
    if (obj instanceof Map) {
        return obj;
    }
    return obj ? new Map(Object.entries(obj as { [key: string]: string })) : new Map();
};

export const convertToNestedMap = (obj: any): Map<string, Map<number, any>> => {
    if (obj instanceof Map) {
        return obj;
    }
    return obj
        ? new Map(
            Object.entries(obj).map(([key, value]) => [
                key,
                new Map(Object.entries(value as { [key: number]: any })),
            ])
        )
        : new Map();
};

export const convertToNumberMap = (obj: any): Map<string, number> => {
    if (obj instanceof Map) {
        return obj;
    }
    return obj ? new Map(Object.entries(obj as { [key: string]: number })) : new Map();
};