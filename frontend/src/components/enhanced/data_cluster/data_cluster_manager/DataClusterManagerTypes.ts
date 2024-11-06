
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
import URLReferenceShortListView from '../../url_reference/url_reference/URLReferenceShortListView';
import EmbeddingChunkShortListView from '../../embedding_chunk/embedding_chunk/EmbeddingChunkShortListView';

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
    chipType: CollectionElementString | 'string_output';
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
        key: 'url_references',
        title: 'URL References',
        collectionName: 'urlreferences',
        EnhancedView: URLReferenceShortListView,
        chipType: 'URLReference'
    },
    {
        key: 'embeddings',
        title: 'Embeddings',
        collectionName: 'embeddingchunks',
        EnhancedView: EmbeddingChunkShortListView,
        chipType: 'EmbeddingChunk'
    },
    {
        key: 'string_outputs',
        title: 'String Outputs',
        chipType: 'string_output'
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
    {
        key: 'create',
        label: 'Create New',
        icon: AddIcon,
        showCondition: (props) => Boolean(props.showCreate && props.isEditable),
        disabled: false,
        variant: 'outlined',
        color: 'secondary',
    },
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