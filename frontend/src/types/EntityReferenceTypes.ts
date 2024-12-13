import { ApiType } from "./ApiTypes";
import { convertToEmbeddable, convertToPopulatedEmbeddable, Embeddable, EnhancedComponentProps, PopulatedEmbeddable } from "./CollectionTypes";

export interface ImageReference {
    url: string;
    alt?: string;
    caption?: string;
}

export enum ReferenceCategoryType {
    // URLS
    URL = "URL",
    WEBSITE = "WebSite",
    // SCHEMA TYPES
    //// Works
    WORK = "Work",
    BOOK = "Book",
    BOOK_SERIES = "BookSeries",
    MOVIE = "Movie",
    MOVIE_SERIES = "MovieSeries",
    MUSIC_ALBUM = "MusicAlbum",
    MUSIC_GROUP = "MusicGroup",
    MUSIC_RECORDING = "MusicRecording",
    PERIODICAL = "Periodical",
    CONCEPT = "Concept",
    TV_SERIES = "TVSeries",
    TV_EPISODE = "TVEpisode",
    VIDEO_GAME = "VideoGame",
    VIDEO_GAME_SERIES = "VideoGameSeries",

    //// Things
    PERSON = "Person",
    PLACE = "Place",
    BIOLOGICAL_ENTITY = "BiologicalEntity",
    TECHNOLOGY = "Technology",
    NATURAL_PHENOMENON = "NaturalPhenomenon",
    SPORTS_TEAM = "SportsTeam",

    //// Organizations
    ORGANIZATION = "Organization",
    EDUCATIONAL_ORGANIZATION = "EducationalOrganization",
    GOVERNMENT_ORGANIZATION = "GovernmentOrganization",
    LOCAL_BUSINESS = "LocalBusiness",
    LOCATION = "Location",
    EVENT = "Event",

    OTHER = "Other",
}

export interface EntityConnection {
    entity_id: string;
    similarity_score: number;
}

export interface EntityReference extends Embeddable {
    categories: ReferenceCategoryType[];
    source_id?: string;
    name?: string;
    description?: string;
    content?: string;
    url?: string;
    images: ImageReference[];
    source?: ApiType;
    connections: EntityConnection[];
    metadata?: Record<string, any>;
}
export interface PopulatedEntityReference extends Omit<EntityReference, keyof PopulatedEmbeddable>, PopulatedEmbeddable {

}

export const convertToEntityReference = (data: any): EntityReference => {
    return {
        ...convertToEmbeddable(data),
        source_id: data?.source_id || '',
        name: data?.name || '',
        description: data?.description || '',
        content: data?.content || '',
        url: data?.url || '',
        images: data?.images || [],
        categories: data?.categories || [],
        source: data?.source || undefined,
        connections: data?.connections || [],
        metadata: data?.metadata || {},
    };
};

export const convertToPopulatedEntityReference = (data: any): PopulatedEntityReference => {
    return {
        ...convertToPopulatedEmbeddable(data),
        source_id: data?.source_id || '',
        name: data?.name || '',
        description: data?.description || '',
        content: data?.content || '',
        url: data?.url || '',
        images: data?.images || [],
        categories: data?.categories || [],
        source: data?.source || undefined,
        connections: data?.connections || [],
        metadata: data?.metadata || {},
    };
}

export interface EntityReferenceComponentProps extends EnhancedComponentProps<EntityReference | PopulatedEntityReference> {
    
}

export const getDefaultEntityReferenceForm = (): Partial<PopulatedEntityReference> => ({
    source_id: '',
    name: '',
    description: '',
    content: '',
    url: '',
    images: [],
    categories: [],
    source: undefined,
    connections: [],
    metadata: {}
});