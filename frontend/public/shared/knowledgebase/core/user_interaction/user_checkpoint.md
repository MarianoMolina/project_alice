# User Checkpoints

User Checkpoints define configuration points in task workflows where user input is required. They specify the interaction interface, available options, and flow control based on user responses.

## Structure

```python
class UserCheckpoint(BaseDataStructure):
    user_prompt: str
    options_obj: Dict[int, str] = {0: "approve", 1: "reject"}
    task_next_obj: Dict[int, str]
    request_feedback: bool = False
```

Key components:
- `user_prompt`: Message shown to user
- `options_obj`: Available response options
- `task_next_obj`: Next task/node mapping
- `request_feedback`: Whether to collect text feedback

## Configuration Examples

### Simple Approval Checkpoint
```python
approval_checkpoint = UserCheckpoint(
    user_prompt="Review the generated content. Do you approve?",
    options_obj={
        0: "Approve",
        1: "Reject"
    },
    task_next_obj={
        0: "finalize",
        1: "revise"
    }
)
```

### Feedback Collection Checkpoint
```python
feedback_checkpoint = UserCheckpoint(
    user_prompt="Review and provide feedback on the analysis",
    options_obj={
        0: "Accept",
        1: "Request Changes",
        2: "Reject"
    },
    task_next_obj={
        0: "complete",
        1: "revise",
        2: "cancel"
    },
    request_feedback=True
)
```

## Integration with Tasks

### Task Configuration
```python
class ReviewTask(AliceTask):
    user_checkpoints: Dict[str, UserCheckpoint] = {
        "review": UserCheckpoint(
            user_prompt="Review the results",
            options_obj={
                0: "Approve",
                1: "Request Changes"
            },
            task_next_obj={
                0: "publish",
                1: "modify"
            },
            request_feedback=True
        )
    }
```

### Node Implementation
```python
async def execute_review(
    self,
    execution_history: List[NodeResponse],
    node_responses: List[NodeResponse],
    **kwargs
) -> NodeResponse:
    # Check for user checkpoint
    checkpoint_response = self.handle_user_checkpoints(
        execution_history,
        "review"
    )
    if checkpoint_response:
        return checkpoint_response

    # Process based on user response
    last_interaction = execution_history[-1].references.user_interactions[-1]
    if last_interaction.user_response.selected_option == 0:
        # Handle approval
        pass
    else:
        # Handle changes request
        feedback = last_interaction.user_response.user_feedback
        # Process feedback...
```

## Common Patterns

### 1. Multi-Stage Review
```python
checkpoints = {
    "initial_review": UserCheckpoint(
        user_prompt="Initial content review",
        options_obj={
            0: "Proceed",
            1: "Revise"
        },
        task_next_obj={
            0: "technical_review",
            1: "revise_content"
        }
    ),
    "technical_review": UserCheckpoint(
        user_prompt="Technical accuracy review",
        options_obj={
            0: "Approve",
            1: "Request Changes"
        },
        task_next_obj={
            0: "final_approval",
            1: "revise_technical"
        },
        request_feedback=True
    )
}
```

### 2. Conditional Routing
```python
quality_check = UserCheckpoint(
    user_prompt="Assess output quality",
    options_obj={
        0: "High Quality",
        1: "Needs Minor Changes",
        2: "Needs Major Changes"
    },
    task_next_obj={
        0: "publish",
        1: "minor_revision",
        2: "major_revision"
    }
)
```

## Best Practices

1. **Checkpoint Design**
   - Use clear, actionable prompts
   - Provide meaningful option labels
   - Define comprehensive routing paths

2. **Feedback Collection**
   - Request feedback when actionable
   - Provide context for feedback requests
   - Include feedback guidelines

3. **Flow Control**
   - Define all possible paths
   - Handle edge cases
   - Maintain task state

4. **User Experience**
   - Clear option descriptions
   - Consistent option numbering
   - Meaningful feedback prompts

5. **Error Prevention**
   - Validate routing paths
   - Check for missing options
   - Handle invalid responses

## Common Use Cases

1. **Content Review**
   ```python
   content_review = UserCheckpoint(
       user_prompt="Review the generated content",
       options_obj={
           0: "Approve",
           1: "Request Minor Changes",
           2: "Request Major Changes"
       },
       task_next_obj={
           0: "publish",
           1: "minor_revision",
           2: "major_revision"
       },
       request_feedback=True
   )
   ```

2. **Decision Points**
   ```python
   decision_point = UserCheckpoint(
       user_prompt="Select processing approach",
       options_obj={
           0: "Automated Processing",
           1: "Manual Review",
           2: "Skip Processing"
       },
       task_next_obj={
           0: "auto_process",
           1: "manual_review",
           2: "skip"
       }
   )
   ```

3. **Quality Assurance**
   ```python
   qa_checkpoint = UserCheckpoint(
       user_prompt="Quality assurance check",
       options_obj={
           0: "Meets Standards",
           1: "Minor Issues",
           2: "Major Issues",
           3: "Critical Issues"
       },
       task_next_obj={
           0: "release",
           1: "fix_minor",
           2: "fix_major",
           3: "restart"
       },
       request_feedback=True
   )
   ```