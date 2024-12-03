# GenerateImageTask

A specialized task for AI image generation. Implements a single node with comprehensive image parameter control.

## Key Features
- Single-node architecture
- Multiple image generation
- Size and quality controls
- Consistent file handling

## Usage
```python
image_gen = GenerateImageTask(
    agent=agent_with_image_gen,
    task_name="image_creator",
    task_description="Generate images from descriptions"
)

images = await image_gen.run(
    prompt="A serene mountain landscape",
    n=2,
    size="1024x1024",
    quality="high"
)
```