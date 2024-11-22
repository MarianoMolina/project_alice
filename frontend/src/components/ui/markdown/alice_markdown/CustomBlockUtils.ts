import { Html, RootContent } from "mdast";
import Logger from "../../../../utils/Logger";

export const getNodeContent = (node: RootContent): string => {
    Logger.debug('[Markdown] Getting content for node:', node);
    // For HTML-like custom blocks, just return the raw content
    if (node.type === 'html') {
        return (node as Html).value;
    }
    // For text nodes, return the value directly
    if ('value' in node) {
        return node.value as string;
    }
    // For nodes with children, recursively get their content
    if ('children' in node) {
        const children = (node.children as Array<RootContent>)
            .map(getNodeContent)
            .join('');
        Logger.debug('[Markdown] Children content:', children);
        return children;
    }
    return '';
};

export const getLanguageFromType = (type: string): string => {
    return type.split('/')[1] || '';
};