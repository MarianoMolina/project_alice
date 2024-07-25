import aiohttp, asyncio, getpass
from typing import  Optional
from pydantic import Field
from workflow_logic.util import User
from workflow_logic.db_app.app.db import BackendAPI
from workflow_logic.db_app.initialization.data_init import DB_STRUCTURE
from workflow_logic.db_app.initialization.init_manager import DBInitManager

class InitializationBackendAPI(BackendAPI):
    temp_db_instance: Optional[DBInitManager] = Field(DBInitManager(), description="Temporary database instance for initialization")
    existing_admin: Optional[User] = Field(default=None, description="Existing admin user data")
    user_data: Optional[User] = Field(default=None, description="Active admin user data")
    user_password: Optional[str] = Field(default=None, description="Active admin user password")
    use_existing_admin: bool = Field(default=False, description="Flag to use existing admin user")

    async def login_user(self, email: str, password: str) -> str:
        url = f"{self.base_url}/users/login"
        data = {"email": email, "password": password}
        headers = {"Content-Type": "application/json"}

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, json=data, headers=headers) as response:
                    if response.status == 400:
                        error_data = await response.json()
                        print(f"Login failed: {error_data.get('message', 'Unknown error')}")
                        raise ValueError("Invalid credentials")
                    
                    response.raise_for_status()
                    result = await response.json()
                    if 'token' not in result:
                        raise ValueError("No token received in login response")
                    return result['token']
            except aiohttp.ClientResponseError as e:
                print(f"HTTP error during login: {e.status} - {e.message}")
                raise
            except aiohttp.ClientError as e:
                print(f"Network error during login: {str(e)}")
                raise
            except ValueError as e:
                print(f"Login error: {str(e)}")
                raise
            except Exception as e:
                print(f"Unexpected error during login: {str(e)}")
                raise

    async def get_new_user_data(self) -> User:
        print("Please enter details for the new admin user:")
        user_name = input("Admin name: ")
        user_email = input("Admin email: ")
        user_password = getpass.getpass("Admin password: ")
        
        user_data = {
            "name": user_name,
            "email": user_email,
            "password": user_password,
            "role": "admin",
        }
        
        self.user_data = await self.create_user(User(**user_data))
        self.user_token = await self.login_user(user_email, user_password)
    
    async def create_user(self, user_data: User) -> User:
        url = f"{self.base_url}/users/register"
        headers = {"Content-Type": "application/json"}

        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=user_data.model_dump(by_alias=True), headers=headers) as response:
                response.raise_for_status()
                result = await response.json()
                user_data.id = result['_id']
                return User(**user_data)    
            
async def initialization_sequence():
    print("Initializing Backend API")
    api = InitializationBackendAPI()
    try:        
        await api.get_new_user_data()
        success = await api.initialize_database(DB_STRUCTURE)
        if success:
            print("Database initialization completed")
        else:
            print("Database initialization failed")
    except Exception as e:
        print("An error occurred during initialization:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")

if __name__ == "__main__":
    asyncio.run(initialization_sequence())