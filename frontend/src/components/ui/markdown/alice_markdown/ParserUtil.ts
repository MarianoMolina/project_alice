export interface BaseBlock {
    type: 'markdown' | 'aliceDocumentCustomBlock' | 'analysisCustomBlock';
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

export const parseMarkdownBlocks = (content: string, blockTypes: string[]): BaseBlock[] => {
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
        let matchedBlock = false;

        for (const blockType of blockTypes) {
            if (blockType === 'analysis') {
                // Ensure tag is at currentIndex
                if (content.startsWith('<analysis>', currentIndex)) {
                    const analysisStart = currentIndex;
                    const analysisEnd = content.indexOf('</analysis>', analysisStart);
                    if (analysisEnd !== -1) {
                        // Add preceding markdown if exists
                        if (analysisStart > lastNormalTextIndex) {
                            addMarkdownBlock(lastNormalTextIndex, analysisStart);
                        }

                        const blockContent = content.slice(analysisStart + 10, analysisEnd);

                        blocks.push({
                            type: 'analysisCustomBlock',
                            content: blockContent.trim(),
                            data: {
                                hName: 'div',
                                hProperties: {
                                    className: ['custom-block', 'custom-block-analysis']
                                }
                            }
                        });

                        currentIndex = analysisEnd + 11; // Length of '</analysis>'
                        lastNormalTextIndex = currentIndex;
                        matchedBlock = true;
                        break; // Exit the for-loop
                    }
                }
            }

            if (blockType === 'aliceDocument') {
                const docMatch = content.slice(currentIndex).match(/^<aliceDocument\s+([^>]*)>/);
                if (docMatch && docMatch.index === 0) {
                    const docStart = currentIndex;
                    const docTagEnd = currentIndex + docMatch[0].length;
                    const docEnd = content.indexOf('</aliceDocument>', docTagEnd);

                    if (docEnd !== -1) {
                        // Add preceding markdown if exists
                        if (docStart > lastNormalTextIndex) {
                            addMarkdownBlock(lastNormalTextIndex, docStart);
                        }
                    
                        // Parse attributes
                        const attrs: { [key: string]: string } = {};
                        const attrRegex = /(\w+)="([^"]*)"/g;
                        let attrMatch;
                        while ((attrMatch = attrRegex.exec(docMatch[1]))) {
                            attrs[attrMatch[1]] = attrMatch[2];
                        }
                    
                        blocks.push({
                            type: 'aliceDocumentCustomBlock',
                            content: content.slice(docTagEnd, docEnd).trim(),
                            data: {
                                hName: 'div',
                                hProperties: {
                                    className: ['custom-block', 'custom-block-aliceDocument']
                                },
                                attributes: attrs
                            }
                        });
                    
                        currentIndex = docEnd + 16; // Corrected length of '</aliceDocument>'
                        lastNormalTextIndex = currentIndex;
                        matchedBlock = true;
                        break; // Exit the for-loop
                    }
                }
            }
        }

        if (!matchedBlock) {
            // Move to the next character
            currentIndex++;
        }
    }

    // Add any remaining markdown content
    if (lastNormalTextIndex < content.length) {
        addMarkdownBlock(lastNormalTextIndex, content.length);
    }

    return blocks;
};
