import { Document, Model, Types } from "mongoose";
import { IUserDocument } from "./user.interface";
import { Embeddable } from "./embeddingChunk.interface";
import { ApiType } from "./api.interface";

export interface IImageReference {
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

export interface IEntityConnection {
    entity_id: Types.ObjectId;
    similarity_score: number;
}

export interface IEntityReference extends Embeddable {
    source_id?: string;
    name?: string;
    description?: string;
    content?: string;
    url?: string;
    images: IImageReference[];
    categories: ReferenceCategoryType[];
    source?: ApiType;
    connections: IEntityConnection[];
    metadata?: Record<string, any>;
    created_by: Types.ObjectId | IUserDocument;
    updated_by: Types.ObjectId | IUserDocument;
}

export interface IEntityReferenceMethods {
    apiRepresentation(): any;
}

export interface IEntityReferenceDocument extends IEntityReference, Document, IEntityReferenceMethods {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IEntityReferenceModel extends Model<IEntityReferenceDocument> {
    // Add any static methods here if needed
}
