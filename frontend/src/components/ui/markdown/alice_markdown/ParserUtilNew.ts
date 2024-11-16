import { CustomBlockType } from "./AliceMarkdown";

export interface BaseBlock {
    type: 'markdown' | string;
    content: string;
    data?: {
        hName: string;
        hProperties: {
            className: string[];
        };
        attributes?: {
            [key: string]: string;
        };
    };
}

interface TagMatch {
    fullMatch: string;
    tagName: string;
    attributes: { [key: string]: string };
    content: string;
    startIndex: number;
    endIndex: number;
}

const findNextTag = (content: string, startIndex: number): TagMatch | null => {
    // Match opening tag with optional attributes
    const tagRegex = /<(\w+)(\s+[^>]*)?>/;
    const match = content.slice(startIndex).match(tagRegex);
    
    if (!match || match.index === undefined) {
        return null;
    }
    
    const tagName = match[1];
    const attributesString = match[2] || '';
    const tagStartIndex = startIndex + match.index;
    const openingTagEndIndex = tagStartIndex + match[0].length;
    
    // Find closing tag
    const closingTag = `</${tagName}>`;
    const closingTagIndex = content.indexOf(closingTag, openingTagEndIndex);
    
    if (closingTagIndex === -1) {
        return null;
    }
    
    // Parse attributes
    const attributes: { [key: string]: string } = {};
    const attrRegex = /(\w+)="([^"]*)"/g;
    let attrMatch;
    
    while ((attrMatch = attrRegex.exec(attributesString))) {
        attributes[attrMatch[1]] = attrMatch[2];
    }
    
    return {
        fullMatch: content.slice(tagStartIndex, closingTagIndex + closingTag.length),
        tagName,
        attributes,
        content: content.slice(openingTagEndIndex, closingTagIndex).trim(),
        startIndex: tagStartIndex,
        endIndex: closingTagIndex + closingTag.length
    };
};

const getBlockTypeFromTagName = (tagName: string): string => {
    return `${tagName}CustomBlock`;
};

export const parseMarkdownBlocks = (content: string, blockTypes: CustomBlockType[]): BaseBlock[] => {
    const blocks: BaseBlock[] = [];
    let currentIndex = 0;
    let lastNormalTextIndex = 0;

    const addMarkdownBlock = (start: number, end: number) => {
        const text = content.slice(start, end).trim();
        if (text) {
            blocks.push({
                type: 'markdown',
                content: text
            });
        }
    };

    while (currentIndex < content.length) {
        const tagMatch = findNextTag(content, currentIndex);
        
        if (tagMatch && blockTypes.includes(tagMatch.tagName as CustomBlockType)) {
            // Add preceding markdown if exists
            if (tagMatch.startIndex > lastNormalTextIndex) {
                addMarkdownBlock(lastNormalTextIndex, tagMatch.startIndex);
            }
            
            blocks.push({
                type: getBlockTypeFromTagName(tagMatch.tagName),
                content: tagMatch.content,
                data: {
                    hName: 'div',
                    hProperties: {
                        className: ['custom-block', `custom-block-${tagMatch.tagName}`]
                    },
                    attributes: tagMatch.attributes
                }
            });
            
            currentIndex = tagMatch.endIndex;
            lastNormalTextIndex = currentIndex;
        } else {
            currentIndex++;
        }
    }

    // Add any remaining markdown content
    if (lastNormalTextIndex < content.length) {
        addMarkdownBlock(lastNormalTextIndex, content.length);
    }

    return blocks;
};