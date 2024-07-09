from typing import List
from pydantic import BaseModel, Field, model_validator, ConfigDict, ValidationError
from workflow_logic.util.const import const_model_definitions, active_vision_models, active_models
from workflow_logic.core.model.model import AliceModel

class ModelManager(BaseModel):
    model_definitions: List[dict | AliceModel] = Field(const_model_definitions, title="Model Definitions", description="The model definitions. Can be passes as dict or AliceModel objects, after init they will be converted to AliceModel objects.")
    active_models: List[str] = Field(active_models, title="Active Models", description="The short_name of the models that are available for use. Place first the default model.")
    active_vision_models: List[str] = Field(active_vision_models, title="Vision Models", description="The short_name of the vision models that are available for use. Place first the default vision model.")
    model_config = ConfigDict(protected_namespaces=())

    @model_validator(mode="after")
    def validate_model_definitions(self):
        for model in self.model_definitions:
            if not isinstance(model, AliceModel):
                try:
                    model = AliceModel.model_validate(model)
                except ValidationError as e:
                    raise ValidationError(
                        f"Validation error in AliceModel: {str(e)}",
                        model=model,
                    )
        return self

    @property
    def available_models(self) -> List[str]:
        return [model.short_name for model in self.model_definitions]
    
    @property
    def default_model(self) -> AliceModel:
        model_def = self.get_model_obj_from_short_name(self.active_models[0])
        if not model_def:
            raise ValueError(f"Model {self.active_models[0]} not found.")
        return model_def
    
    @property
    def default_vision_model(self) -> AliceModel:
        model_def = self.get_model_obj_from_short_name(self.active_vision_models[0])
        if not model_def:
            raise ValueError(f"Model {self.active_vision_models[0]} not found.")
        return model_def
       
    def get_model_obj_from_short_name(self, short_name: str) -> AliceModel | None:
        matched_models = [model for model in self.model_definitions if model.short_name == short_name]
        if matched_models:
            return matched_models[0]
        else:
            return None
    
    def get_model_obj_from_name(self, name: str) -> AliceModel | None:
        matched_models = [model for model in self.model_definitions if model.short_name == name]
        if not matched_models:
            matched_models = [model for model in self.model_definitions if model.model == name]
        if not matched_models:
            matched_models = [model for model in self.model_definitions if model.model_file == name]
        if not matched_models:
            return None
        return matched_models[0]