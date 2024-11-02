# Models

Models are the core components that power the AI capabilities of the Alice system. They are used by agents to perform various tasks such as text generation, image understanding, and speech processing.

## Model Types

The Alice system supports several types of models, each designed for specific tasks:

```typescript
export enum ModelType {
    INSTRUCT = 'instruct',
    CHAT = 'chat',
    VISION = 'vision',
    STT = 'stt',
    TTS = 'tts',
    EMBEDDINGS = 'embeddings',
    IMG_GEN = 'img_gen',
}
```

- `INSTRUCT`: For instruction-following text generation
- `CHAT`: For conversational text generation
- `VISION`: For image understanding and analysis
- `STT` (Speech-to-Text): For transcribing audio to text
- `TTS` (Text-to-Speech): For converting text to speech
- `EMBEDDINGS`: For creating vector representations of text
- `IMG_GEN`: For generating images from text descriptions

## Model Interface

Each model in the system is represented by the `AliceModel` interface:

```typescript
export interface AliceModel extends BaseDatabaseObject {
    _id?: string;
    short_name: string;
    model_name: string;
    model_format?: string;
    ctx_size?: number;
    model_type: ModelType;
    api_name: ApiName;
    temperature?: number;
    seed?: number | null;
    use_cache?: boolean;
}
```

Key properties:
- `short_name`: A brief identifier for the model
- `model_name`: The full name of the model
- `model_type`: The type of task the model is designed for
- `api_name`: The API provider for this model
- `temperature`: Controls the randomness of the model's output
- `use_cache`: Determines if caching should be used for this model

## Using Models

In the frontend, models are primarily used in the context of configuring agents and tasks. Users can:

1. View available models in the database
2. Assign models to agents for different types of tasks
3. Select models when configuring certain types of tasks

When displaying or editing models, pay attention to the specific properties relevant to each model type. For example, `temperature` is more relevant for text generation models (INSTRUCT and CHAT) than for VISION models.