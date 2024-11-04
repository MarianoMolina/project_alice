import { Html, List, ListItem, Paragraph, RootContent, Text } from "mdast";

export const getNodeContent = (node: RootContent): string => {
    if (node.type === 'html') {
        return (node as Html).value;
    }
    if (node.type === 'text') {
        return (node as Text).value;
    }
    if (node.type === 'paragraph') {
        const para = node as Paragraph;
        return para.children.map(getNodeContent).join('');
    }
    if (node.type === 'list') {
        const list = node as List;
        return list.children
            .map((item) => {
                const listItem = item as ListItem;
                return listItem.children.map(getNodeContent).join('');
            })
            .join('\n');
    }
    if ('children' in node) {
        return (node.children as Array<RootContent>).map(getNodeContent).join('');
    }
    if ('value' in node) {
        return node.value as string;
    }
    return '';
};

export const getLanguageFromType = (type: string): string => {
    return type.split('/')[1] || '';
};