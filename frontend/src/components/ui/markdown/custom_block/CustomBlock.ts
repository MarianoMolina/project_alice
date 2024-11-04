import { Plugin } from 'unified';
import { Parent } from 'unist';
import { parse as parseSpaceSeparated } from 'space-separated-tokens';
import { Root, RootContent, Paragraph, Text, Html, List, ListItem } from 'mdast';

interface BlockConfig {
  classes?: string;
  title?: 'optional' | 'required';
  defaultTitle?: string;
  details?: boolean;
  containerElement?: string;
  titleElement?: string;
  contentsElement?: string;
}

interface BlockDefinitions {
  [key: string]: BlockConfig;
}

declare module 'mdast' {
  interface RootContentMap {
    analysisCustomBlock: AnalysisBlock;
    aliceDocumentCustomBlock: DocumentBlock;
  }
}

interface AnalysisBlock extends Parent {
  type: 'analysisCustomBlock';
  children: Array<RootContent>;
  data: {
    hName: string;
    hProperties: {
      className: string[];
    };
    attributes?: {
      [key: string]: string;
    };
  };
}

interface DocumentBlock extends Parent {
  type: 'aliceDocumentCustomBlock';
  children: Array<RootContent>;
  data: {
    hName: string;
    hProperties: {
      className: string[];
    };
    attributes?: {
      [key: string]: string;
    };
  };
}

const plugin: Plugin<[BlockDefinitions?], Root> = function (options = {}) {
  if (Object.keys(options).length === 0) {
    throw new Error('remark-custom-blocks needs to be passed a configuration object as option');
  }

  const blockTypes = Object.keys(options);
  console.log('Plugin initialized with block types:', blockTypes);

  return function transformer(tree: Root) {
    console.log('Tree structure:', JSON.stringify(tree, null, 2));

    const blocks: Array<{
      startIndex: number;
      endIndex: number;
      type: string;
      content: RootContent[];
      attributes: { [key: string]: string };
    }> = [];

    // First pass: scan for blocks
    let currentIndex = 0;
    while (currentIndex < tree.children.length) {
      const node = tree.children[currentIndex];
      const nodeContent = getNodeContent(node);

      let foundBlock = false;
      for (const blockType of blockTypes) {
        const openTagRegex = new RegExp(`<${blockType}(\\s[^>]*)?>`);
        const openTagMatch = nodeContent.match(openTagRegex);
        if (openTagMatch) {
          // Extract attributes from the opening tag
          const attributesString = openTagMatch[1] || '';
          const attributes: { [key: string]: string } = {};
          const attrRegex = /(\w+)="([^"]*)"/g;
          let match;
          while ((match = attrRegex.exec(attributesString))) {
            attributes[match[1]] = match[2];
          }

          // Search forward for closing tag
          let endIndex = currentIndex;
          let foundClosing = false;
          const closeTagRegex = new RegExp(`</${blockType}>`);
          while (endIndex < tree.children.length) {
            const endNode = tree.children[endIndex];
            const endContent = getNodeContent(endNode);

            if (closeTagRegex.test(endContent)) {
              blocks.push({
                startIndex: currentIndex,
                endIndex: endIndex,
                type: blockType,
                content: tree.children.slice(currentIndex, endIndex + 1),
                attributes,
              });

              // Skip past this block
              currentIndex = endIndex;
              foundBlock = true;
              foundClosing = true;
              break;
            }
            endIndex++;
          }

          if (!foundClosing) {
            console.warn(`No closing tag found for ${blockType} opened at node ${currentIndex}`);
          }

          if (foundBlock) break; // Only break the blockType loop if we found and processed a block
        }
      }

      currentIndex++;
    }

    // Process blocks in reverse order
    blocks.reverse().forEach((block) => {
      const blockConfig = options[block.type];

      const contentNodes = block.content.slice(); // Copy of nodes

      // Remove the opening tag from the first node
      removeTagFromNode(contentNodes[0], `<${block.type}(\\s[^>]*)?>`);

      // Remove the closing tag from the last node
      removeTagFromNode(contentNodes[contentNodes.length - 1], `</${block.type}>`);

      // Remove empty nodes if necessary
      const filteredNodes = contentNodes.filter((node) => !isNodeEmpty(node));

      const blockNode: RootContent = {
        type: `${block.type}CustomBlock`,
        children: filteredNodes,
        data: {
          hName: blockConfig.containerElement || 'div',
          hProperties: {
            className: ['custom-block', ...parseSpaceSeparated(blockConfig.classes || '')],
          },
          attributes: block.attributes,
        },
      } as AnalysisBlock | DocumentBlock;

      tree.children.splice(
        block.startIndex,
        block.endIndex - block.startIndex + 1,
        blockNode
      );
    });
  };
};

// Helper function to get content from a node
const getNodeContent = (node: RootContent): string => {
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

// Helper function to remove tags from a node
function removeTagFromNode(node: RootContent, tagRegexStr: string) {
  const tagRegex = new RegExp(tagRegexStr, 'g');
  if (node.type === 'text' || node.type === 'html') {
    (node as Text | Html).value = (node as Text | Html).value.replace(tagRegex, '').trim();
  } else if ('children' in node && node.children) {
    node.children.forEach((child) => removeTagFromNode(child as RootContent, tagRegexStr));
    // Remove empty children
    node.children = node.children.filter((child) => !isNodeEmpty(child as RootContent));
  }
}

// Helper function to check if a node is empty
function isNodeEmpty(node: RootContent): boolean {
  if (node.type === 'text' || node.type === 'html') {
    return !(node as Text | Html).value.trim();
  } else if ('children' in node && node.children) {
    return node.children.length === 0 || node.children.every(isNodeEmpty);
  }
  return false;
}

export default plugin;
