import { ParameterDefinition, FunctionParameters } from '../../../../types/ParameterTypes';

export interface ActiveParameter extends ParameterDefinition {
    isActive: boolean;
    name: string;
    isRequired: boolean;
}

export const ensurePropertiesObject = (params?: FunctionParameters): { [key: string]: ParameterDefinition } => {
    if (!params || !params.properties) return {};
    return params.properties;
};

export const initializeActiveParameters = (
    parameters: ParameterDefinition[],
    initialParameters?: FunctionParameters
): ActiveParameter[] => {
    const initialActiveParams: ActiveParameter[] = parameters.map(param => ({
        ...param,
        isActive: false,
        name: '',
        isRequired: false
    }));

    if (initialParameters) {
        const propertiesObj = ensurePropertiesObject(initialParameters);
        Object.entries(propertiesObj).forEach(([key, value]) => {
            const index = initialActiveParams.findIndex(p => p._id === value._id);
            if (index !== -1) {
                initialActiveParams[index] = {
                    ...initialActiveParams[index],
                    ...value,
                    isActive: true,
                    name: key,
                    isRequired: initialParameters.required.includes(key)
                };
            }
        });
    }
    return initialActiveParams;
};

export const buildFunctionDefinition = (params: ActiveParameter[]): FunctionParameters => {
    const properties: { [key: string]: ParameterDefinition } = {};
    const required: string[] = [];
    params.forEach(param => {
        if (param.isActive && param.name.trim() !== '') {
            properties[param.name] = {
                type: param.type,
                description: param.description,
                default: param.default,
                _id: param._id
            };
            if (param.isRequired) {
                required.push(param.name);
            }
        }
    });
    return {
        type: "object",
        properties,
        required
    };
};

export const validateParameters = (activeParameters: ActiveParameter[]): string | null => {
    const activeParams = activeParameters.filter(p => p.isActive);
    const allNamed = activeParams.every(p => p.name.trim() !== '');
    const uniqueNames = new Set(activeParams.map(p => p.name)).size === activeParams.length;

    if (!allNamed) return "All active parameters must have a name";
    if (!uniqueNames) return "Parameter names must be unique";
    return null;
};