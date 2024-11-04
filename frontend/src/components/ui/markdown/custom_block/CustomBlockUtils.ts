export const getNodeContent = (node: any): string => {
    if (node.type === 'text' && node.value) {
        return node.value;
    }

    if (node.children) {
        return node.children.map((child: any) => getNodeContent(child)).join('');
    }

    return '';
};