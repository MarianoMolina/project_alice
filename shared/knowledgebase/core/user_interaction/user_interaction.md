# User Interactions

User Interactions represent points in a task's execution where human input or feedback has been required. They prompt the user for input, and continue a task based on that input.

## Core Components

### User Response
```python
class UserResponse(BaseModel):
    selected_option: int
    user_feedback: Optional[str] = None
```

The `UserResponse` captures:
- A selected option from predefined choices
- Optional textual feedback from the user

### User Interaction
```python
class UserInteraction(Embeddable):
    user_checkpoint_id: str
    task_response_id: Optional[str]
    user_response: Optional[UserResponse]
```

Represents:
- Link to a specific checkpoint configuration
- Association with a task response
- User's response when provided

## Usage in Task Workflow

1. **Task Execution Flow**
```python
async def run(self) -> TaskResponse:
    # ... task execution ...
    if node_response.references.user_interactions:
        # Task pauses here, waiting for user input
        return self.create_partial_response(
            node_responses,
            status="pending"
        )
    # ... continue execution ...
```

2. **Handling User Input**
```python
async def run_from_task_response(
    self,
    task_response: TaskResponse,
    **kwargs
) -> TaskResponse:
    # Resume execution with user input
    if task_response.status == "pending":
        execution_history = task_response.node_references
        return await self.run(
            execution_history=execution_history,
            **kwargs
        )
```

## Integration Examples

### Basic Approval Flow
```python
node_response = NodeResponse(
    parent_task_id=self.id,
    node_name="review",
    execution_order=execution_order,
    references=References(
        user_interactions=[
            UserInteraction(
                user_checkpoint_id="approval_checkpoint",
                task_response_id=self.id
            )
        ]
    )
)
```

### Feedback Collection
```python
user_interaction = UserInteraction(
    user_checkpoint_id="feedback_point",
    task_response_id=self.id,
    user_response=UserResponse(
        selected_option=1,
        user_feedback="Please improve response clarity"
    )
)
```

## Best Practices

1. **Clear User Prompts**
   - Use descriptive prompts
   - Provide clear option choices
   - Explain impact of choices

2. **Error Handling**
   - Validate user responses
   - Handle missing responses gracefully
   - Provide feedback for invalid inputs

3. **State Management**
   - Preserve task state during pauses
   - Handle timeouts appropriately
   - Track interaction history

4. **Response Processing**
   - Validate selected options
   - Process feedback when provided
   - Update task state based on responses