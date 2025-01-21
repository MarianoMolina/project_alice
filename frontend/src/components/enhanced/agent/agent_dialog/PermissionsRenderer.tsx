import { Card, CardContent } from '@mui/material';
import { 
  ToolPermissionsSubsection, 
  CodePermissionsSubsection,
  AutoReplySubsection
} from '../../../../utils/AgentUtils';

// Tool permissions renderer component
const ToolPermissionsRenderer = ({ subsection }: { subsection: ToolPermissionsSubsection }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-300">
        {subsection.description}
      </p>
      <div className="grid gap-4">
        {subsection.levels.map((level, idx) => (
          <Card key={idx} className="bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <code className="text-lg font-mono text-emerald-400">
                  {level.name}
                </code>
                <span className="text-xs text-neutral-400 bg-slate-700 px-2 py-1 rounded">
                  Permission Level {idx}
                </span>
              </div>
              <p className="text-sm text-neutral-300 mb-2">
                {level.description}
              </p>
              <div className="bg-slate-700 p-3 rounded-md">
                <p className="text-sm text-neutral-200">
                  <span className="text-neutral-400">Use Case:</span> {level.use_case}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Code permissions renderer component
const CodePermissionsRenderer = ({ subsection }: { subsection: CodePermissionsSubsection }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-300">
        {subsection.description}
      </p>
      <div className="mb-4">
        <p className="text-sm text-neutral-400 mb-2">Supported Languages:</p>
        <div className="flex flex-wrap gap-2">
          {subsection.supported_languages.map((lang, idx) => (
            <span key={idx} className="text-xs bg-slate-700 text-neutral-200 px-2 py-1 rounded">
              {lang}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-4">
        {subsection.levels.map((level, idx) => (
          <Card key={idx} className="bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <code className="text-lg font-mono text-emerald-400">
                  {level.name}
                </code>
                <span className="text-xs text-neutral-400 bg-slate-700 px-2 py-1 rounded">
                  Permission Level {idx}
                </span>
              </div>
              <p className="text-sm text-neutral-300 mb-2">
                {level.description}
              </p>
              <div className="bg-slate-700 p-3 rounded-md">
                <p className="text-sm text-neutral-200">
                  <span className="text-neutral-400">Use Case:</span> {level.use_case}
                </p>
                {level.example && (
                  <p className="text-sm text-neutral-200 mt-2">
                    <span className="text-neutral-400">Example:</span>
                    <code className="ml-2 text-emerald-400">{level.example}</code>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Auto reply renderer component
const AutoReplyRenderer = ({ subsection }: { subsection: AutoReplySubsection }) => {
  return (
    <Card className="bg-slate-800">
      <CardContent className="pt-6">
        <p className="text-sm text-neutral-300 mb-4">
          {subsection.description}
        </p>
        <div className="bg-slate-700 p-3 rounded-md">
          <p className="text-sm text-neutral-200">
            <span className="text-neutral-400">Purpose:</span> {subsection.purpose}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Main permissions subsection renderer
const PermissionsSubsectionRenderer = ({
  subsectionKey,
  subsection
}: {
  subsectionKey: string;
  subsection: ToolPermissionsSubsection | CodePermissionsSubsection | AutoReplySubsection;
}) => {
  switch (subsectionKey) {
    case 'tool_permissions':
      return <ToolPermissionsRenderer subsection={subsection as ToolPermissionsSubsection} />;
    case 'code_permissions':
      return <CodePermissionsRenderer subsection={subsection as CodePermissionsSubsection} />;
    case 'auto_reply':
      return <AutoReplyRenderer subsection={subsection as AutoReplySubsection} />;
    default:
      return (
        <div className="p-4 bg-slate-800 rounded-md">
          <p className="text-neutral-400">Unknown subsection type</p>
        </div>
      );
  }
};

export default PermissionsSubsectionRenderer;