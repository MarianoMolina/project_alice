import asyncio
import json
import os
from typing import Dict, Any, Optional
from uuid import uuid4

from pydantic import BaseModel
from fastapi import WebSocket
import redis.asyncio as aioredis  # Renamed to avoid conflict
from redis.asyncio.client import PubSub

from workflow.util import LOGGER, get_traceback
from workflow.api_app.routes.task_execute import execute_task_endpoint
from workflow.api_app.routes.task_resume import resume_task_endpoint
from workflow.api_app.routes.chat_resume import chat_resume
from workflow.api_app.routes.chat_response import chat_response
from workflow.api_app.routes.file_transcript import generate_file_transcript
from workflow.api_app.util.utils import TaskResumeRequest, TaskExecutionRequest, ChatResumeRequest, ChatResponseRequest, FileTranscriptRequest

class QueueMessage(BaseModel):
    """Pydantic model for queue messages."""
    task_id: str
    endpoint: str
    data: Dict[str, Any]

class QueueManager(BaseModel):
    db_app: Any
    message_buffer: Dict[str, list] = {}
    redis_url: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    redis_client: Optional[aioredis.Redis] = None  # Renamed field
    connections: Dict[str, WebSocket] = {}

    class Config:
        arbitrary_types_allowed = True

    async def initialize(self):
        self.redis_client = aioredis.from_url(self.redis_url)
        LOGGER.info(f"Connected to Redis at {self.redis_url}")

    async def enqueue_request(self, endpoint: str, data: Dict[str, Any]) -> str:
        task_id = str(uuid4())
        message = QueueMessage(
            task_id=task_id,
            endpoint=endpoint,
            data=data
        )
        await self.redis_client.lpush("request_queue", message.json())
        LOGGER.info(f"Enqueued task {task_id} for endpoint {endpoint}")
        return task_id

    async def process_requests(self):
        while True:
            _, message = await self.redis_client.brpop("request_queue")
            queue_message = QueueMessage.parse_raw(message)
            # Process the request asynchronously
            asyncio.create_task(self.handle_request(queue_message))

    async def handle_request(self, queue_message: QueueMessage):
        task_id = queue_message.task_id
        endpoint = queue_message.endpoint
        data = queue_message.data

        try:
            # Dispatch to the appropriate method based on endpoint
            if endpoint == "/execute_task":
                result = await self.execute_task(data)
            elif endpoint == "/resume_task":
                result = await self.resume_task(data)
            elif endpoint == "/chat_resume":
                result = await self.chat_resume(data)
            elif endpoint == "/chat_response":
                result = await self.chat_response(data)
            elif endpoint == "/file_transcript":
                result = await self.generate_file_transcript(data)
            else:
                raise ValueError(f"Unknown endpoint: {endpoint}")

            # Publish the result to a Redis channel
            result = {"status": "completed", "result": result}
            if task_id in self.connections:
                await self.redis_client.publish(f"updates:{task_id}", json.dumps(result))
            else:
                # Buffer the message if connection isn't ready
                if task_id not in self.message_buffer:
                    self.message_buffer[task_id] = []
                self.message_buffer[task_id].append(result)
                
            LOGGER.info(f"Task {task_id} completed successfully")
        except Exception as e:
            import traceback
            error_result = {
                "status": "failed",
                "error": str(e),
                "traceback": traceback.format_exc(),
                "task_id": task_id
            }
            # Publish the error to the Redis channel
            await self.redis_client.publish(f"updates:{task_id}", json.dumps(error_result))
            LOGGER.error(f"Task {task_id} failed with error: {e}")

    async def connect(self, websocket: WebSocket, task_id: str):
        await websocket.accept()
        self.connections[task_id] = websocket
        
        # Send any buffered messages
        if task_id in self.message_buffer:
            for message in self.message_buffer[task_id]:
                await websocket.send_json(message)
            del self.message_buffer[task_id]
            
        # Continue with Redis subscription
        pubsub = self.redis_client.pubsub()
        await pubsub.subscribe(f"updates:{task_id}")
        asyncio.create_task(self.listen_to_channel(websocket, pubsub, task_id))

    async def listen_to_channel(self, websocket: WebSocket, pubsub: PubSub, task_id: str):
        LOGGER.info(f"Starting to listen to channel for task {task_id}")
        try:
            async for message in pubsub.listen():
                LOGGER.info(f"Received message from Redis for task {task_id}: {message}")
                if message['type'] == 'message':
                    data = json.loads(message['data'])
                    LOGGER.info(f"About to send data to WebSocket for task {task_id}: {data}")
                    await websocket.send_json(data)
                    LOGGER.info(f"Successfully sent update to WebSocket for task {task_id}")
                    if data.get("status") in ["completed", "failed"]:
                        LOGGER.info(f"Task {task_id} finished with status {data.get('status')}")
                        break
        except Exception as e:
            LOGGER.error(f"Error in listen_to_channel for task {task_id}: {e}\n{get_traceback()}")

    async def disconnect(self, task_id: str):
        websocket = self.connections.pop(task_id, None)
        if websocket:
            await websocket.close()

    async def cleanup(self):
        if self.redis_client:
            await self.redis_client.close()
            LOGGER.info("Redis connection closed")

    # Implementations of the methods
    async def execute_task(self, data: Dict[str, Any]) -> Dict[str, Any]:
        request_model = TaskExecutionRequest(**data)
        result = await execute_task_endpoint(
            request=request_model,
            db_app=self.db_app,
            queue_manager=self,
            enqueue=False  # Indicate not to enqueue again
        )
        return result

    async def resume_task(self, data: Dict[str, Any]) -> Dict[str, Any]:
        request_model = TaskResumeRequest(**data)
        result = await resume_task_endpoint(
            request=request_model,
            db_app=self.db_app,
            queue_manager=self,
            enqueue=False
        )
        return result

    async def chat_resume(self, data: Dict[str, Any]) -> Dict[str, Any]:
        request_model = ChatResumeRequest(**data)
        result = await chat_resume(
            request=request_model,
            db_app=self.db_app,
            queue_manager=self,
            enqueue=False
        )
        return result

    async def chat_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        request_model = ChatResponseRequest(**data)
        result = await chat_response(
            request=request_model,
            db_app=self.db_app,
            queue_manager=self,
            enqueue=False
        )
        return result

    async def generate_file_transcript(self, data: Dict[str, Any]) -> Dict[str, Any]:
        request_model = FileTranscriptRequest(**data)
        result = await generate_file_transcript(
            request=request_model,
            db_app=self.db_app,
            queue_manager=self,
            enqueue=False
        )
        return result
    
    async def is_task_completed(self, task_id: str) -> bool:
        result = await self.redis_client.get(f"result:{task_id}")
        return bool(result)

    async def get_task_result(self, task_id: str) -> Optional[dict]:
        result = await self.redis_client.get(f"result:{task_id}")
        return json.loads(result) if result else None