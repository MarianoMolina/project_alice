# TextToSpeechTask

A simple single-node task for text-to-speech conversion. Optimized for audio generation with configurable voice parameters.

## Key Features
- Single-node execution pattern
- Voice and speed configuration
- Audio file handling
- Metadata preservation

## Usage
```python
tts = TextToSpeechTask(
    agent=agent_with_tts,
    task_name="speech_generator",
    task_description="Convert text to natural speech"
)

audio = await tts.run(
    text="Hello, world!",
    voice="nova",
    speed=1.2
)
```