import { Components } from "react-markdown";

interface BlockConfig {
    classes?: string;
    title?: 'optional' | 'required';
    defaultTitle?: string;
    details?: boolean;
    containerElement?: string;
    titleElement?: string;
    contentsElement?: string;
}

export interface BlockDefinitions {
    [key: string]: BlockConfig;
}

export interface CustomMarkdownProps {
    className?: string;
    children: string;
}
