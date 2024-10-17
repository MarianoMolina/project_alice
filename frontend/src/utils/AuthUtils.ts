export const setToken = (token: string) => {
    localStorage.setItem('token', token);
};

export const getToken = (): string | null => {
    return localStorage.getItem('token');
};

export const removeToken = () => {
    localStorage.removeItem('token');
};

export const removeCreatedUpdatedBy = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(removeCreatedUpdatedBy);
    } else if (typeof obj === 'object' && obj !== null) {
        return Object.fromEntries(
            Object.entries(obj)
                .filter(([key]) => key !== 'created_by' && key !== 'updated_by')
                .map(([key, value]) => [key, removeCreatedUpdatedBy(value)])
        );
    }
    return obj;
};