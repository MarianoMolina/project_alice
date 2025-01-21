import { Card, CardContent } from '@mui/material';
import { 
  ModelTypesSubsection,
  UsageNotesSubsection,
  ModelSettingsSubsection,
  ModelType
} from '../../../../utils/AgentUtils';

// Model types renderer component
const ModelTypesRenderer = ({ subsection }: { subsection: ModelTypesSubsection }) => {
  const renderModelType = (type: ModelType) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <code className="text-emerald-400 font-mono">{type.name}</code>
        {type.usage && (
          <span className="text-xs bg-slate-700 text-neutral-300 px-2 py-1 rounded">
            {type.usage}
          </span>
        )}
      </div>
      {type.description && (
        <p className="text-sm text-neutral-300">{type.description}</p>
      )}
      {type.purpose && (
        <p className="text-sm text-neutral-400">Purpose: {type.purpose}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {subsection.categories.map((category, idx) => (
        <Card key={idx} className="bg-slate-800">
          <CardContent className="pt-6">
            <h4 className="text-lg font-semibold text-neutral-200 mb-2">
              {category.name}
            </h4>
            {category.description && (
              <p className="text-sm text-neutral-300 mb-4">
                {category.description}
              </p>
            )}
            <div className="space-y-4 bg-slate-700 p-4 rounded-md">
              {category.types.map((type, typeIdx) => (
                <div key={typeIdx} className="border-b border-slate-600 last:border-0 pb-4 last:pb-0">
                  {renderModelType(type)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Usage notes renderer component
const UsageNotesRenderer = ({ subsection }: { subsection: UsageNotesSubsection }) => {
  return (
    <Card className="bg-slate-800">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="bg-slate-700 p-4 rounded-md">
            <ul className="space-y-2">
              {subsection.points.map((point, idx) => (
                <li key={idx} className="text-sm text-neutral-200 flex items-start">
                  <span className="text-emerald-400 mr-2">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Model settings renderer component
const ModelSettingsRenderer = ({ subsection }: { subsection: ModelSettingsSubsection }) => {
  return (
    <div className="grid gap-4">
      {subsection.settings.map((setting, idx) => (
        <Card key={idx} className="bg-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center mb-2">
              <code className="text-lg font-mono text-emerald-400">
                {setting.name}
              </code>
            </div>
            <div className="bg-slate-700 p-3 rounded-md">
              <p className="text-sm text-neutral-200">
                {setting.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Main model subsection renderer
const ModelSubsectionRenderer = ({
  subsectionKey,
  subsection
}: {
  subsectionKey: string;
  subsection: ModelTypesSubsection | UsageNotesSubsection | ModelSettingsSubsection;
}) => {
  switch (subsectionKey) {
    case 'model_types':
      return <ModelTypesRenderer subsection={subsection as ModelTypesSubsection} />;
    case 'usage_notes':
      return <UsageNotesRenderer subsection={subsection as UsageNotesSubsection} />;
    case 'model_settings':
      return <ModelSettingsRenderer subsection={subsection as ModelSettingsSubsection} />;
    default:
      return (
        <div className="p-4 bg-slate-800 rounded-md">
          <p className="text-neutral-400">Unknown subsection type</p>
        </div>
      );
  }
};

export default ModelSubsectionRenderer;