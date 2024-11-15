# Entity References

Entity References allow the Alice system to store and manage information about external web resources, including their content and metadata.

## Entity Reference Interface

Each Entity reference in the system is represented by the `EntityReference` interface:

```typescript
export interface EntityReference extends BaseDatabaseObject {
    _id?: string;
    title: string;
    Entity: string;
    content: string;
    metadata: { [key: string]: string };
}
```

Key properties:
- `name`: A descriptive title for the referenced Entity
- `url`: The actual web address
- `content`: Stored content from the Entity (e.g., extracted text)
- `metadata`: Additional information about the Entity (e.g., last accessed date, content type)

## Functionality

In the frontend, Entity references are used to:

1. Store and display information about external web resources
2. Provide context for conversations or tasks that involve web content
3. Allow agents to reference and use information from external sources

## User Interface Considerations

When designing interfaces for Entity references, consider:

1. Clickable links to open the original Entity
2. Previews of the stored content
3. Display of relevant metadata
4. Integration with chat interfaces to easily reference web content in conversations