
import { CollectionElementString, CollectionName } from '../../../../types/CollectionTypes';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Search as SearchIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { DataCluster } from '../../../../types/DataClusterTypes';
import { References } from '../../../../types/ReferenceTypes';
import MessageShortListView from '../../message/message/MessageShortListView';
import FileShortListView from '../../file/file/FileShortListView';
import TaskResponseShortListView from '../../task_response/task_response/TaskResponseShortListView';
import EntityReferenceShortListView from '../../entity_reference/entity_reference/EntityReferenceShortListView';
import EmbeddingChunkShortListView from '../../embedding_chunk/embedding_chunk/EmbeddingChunkShortListView';
import ToolCallShortListView from '../../tool_calls/tool_calls/ToolCallShortListView';
import CodeExecutionShortListView from '../../code_execution/code_execution/CodeExecutionShortListView';
import UserInteractionShortListView from '../../user_interaction/user_interaction/UserInteractionShortListView';

export interface DataClusterManagerProps {
    dataCluster: DataCluster | undefined;
    isEditable?: boolean;
    onDataClusterChange?: (dataCluster: DataCluster | undefined) => void;
    showCreate?: boolean;
    showEdit?: boolean;
    showSelect?: boolean;
    flatten?: boolean;
}

interface ReferenceTypeConfig {
    key: keyof References;
    title: string;
    collectionName?: CollectionName;
    EnhancedView?: React.ComponentType<any>;
    chipType: CollectionElementString;
}

export const REFERENCE_CONFIG: ReferenceTypeConfig[] = [
    {
        key: 'messages',
        title: 'Messages',
        collectionName: 'messages',
        EnhancedView: MessageShortListView,
        chipType: 'Message'
    },
    {
        key: 'files',
        title: 'Files',
        collectionName: 'files',
        EnhancedView: FileShortListView,
        chipType: 'File'
    },
    {
        key: 'task_responses',
        title: 'Task Responses',
        collectionName: 'taskresults',
        EnhancedView: TaskResponseShortListView,
        chipType: 'TaskResponse'
    },
    {
        key: 'entity_references',
        title: 'Entity References',
        collectionName: 'entityreferences',
        EnhancedView: EntityReferenceShortListView,
        chipType: 'EntityReference'
    },
    {
        key: 'embeddings',
        title: 'Embeddings',
        collectionName: 'embeddingchunks',
        EnhancedView: EmbeddingChunkShortListView,
        chipType: 'EmbeddingChunk'
    },
    {
        key: 'user_interactions',
        title: 'User Interactions',
        collectionName: 'userinteractions',
        EnhancedView: UserInteractionShortListView,
        chipType: 'UserInteraction'
    },
    {
        key: 'tool_calls',
        title: 'Tool Calls',
        collectionName: 'toolcalls',
        EnhancedView: ToolCallShortListView,
        chipType: 'ToolCall'
    },
    {
        key: 'code_executions',
        title: 'Code Executions',
        collectionName: 'codeexecutions',
        EnhancedView: CodeExecutionShortListView,
        chipType: 'CodeExecution'
    }
];

interface ActionButtonConfig {
    key: string;
    label: string;
    icon: typeof AddIcon;
    showCondition: (props: DataClusterManagerProps, isDirty: boolean, isEditable: boolean, inEditMode: boolean) => boolean;
    disabled: boolean | ((props: DataClusterManagerProps) => boolean);
    variant: 'outlined' | 'contained';
    color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

// Define the action button configurations
export const ACTION_BUTTON_CONFIG: ActionButtonConfig[] = [
    // {
    //     key: 'create',
    //     label: 'Create New',
    //     icon: AddIcon,
    //     showCondition: (props) => Boolean(props.showCreate && props.isEditable),
    //     disabled: false,
    //     variant: 'outlined',
    //     color: 'secondary',
    // },
    {
        key: 'edit',
        label: 'Edit',
        icon: EditIcon,
        showCondition: (props) => Boolean(props.showEdit && props.isEditable),
        disabled: (props) => !props.dataCluster,
        variant: 'outlined',
        color: 'info',
    },
    {
        key: 'select',
        label: 'Select Existing',
        icon: SearchIcon,
        showCondition: (props) => Boolean(props.showSelect && props.isEditable),
        disabled: false,
        variant: 'outlined',
        color: 'info',
    },
    {
        key: 'save',
        label: 'Save Changes',
        icon: SaveIcon,
        showCondition: (_, isDirty, isEditable) => Boolean(isDirty && isEditable),
        disabled: false,
        variant: 'contained',
        color: 'info',
    }
];