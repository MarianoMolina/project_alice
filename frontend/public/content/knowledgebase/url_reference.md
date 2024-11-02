# URL References

URL References allow the Alice system to store and manage information about external web resources, including their content and metadata.

## URL Reference Interface

Each URL reference in the system is represented by the `URLReference` interface:

```typescript
export interface URLReference extends BaseDatabaseObject {
    _id?: string;
    title: string;
    url: string;
    content: string;
    metadata: { [key: string]: string };
}
```

Key properties:
- `title`: A descriptive title for the referenced URL
- `url`: The actual web address
- `content`: Stored content from the URL (e.g., extracted text)
- `metadata`: Additional information about the URL (e.g., last accessed date, content type)

## Functionality

In the frontend, URL references are used to:

1. Store and display information about external web resources
2. Provide context for conversations or tasks that involve web content
3. Allow agents to reference and use information from external sources

## User Interface Considerations

When designing interfaces for URL references, consider:

1. Clickable links to open the original URL
2. Previews of the stored content
3. Display of relevant metadata
4. Integration with chat interfaces to easily reference web content in conversations