import { SpecialTagsSubsection, TemplatingSubsection } from '../../../../utils/AgentUtils';
import { Card, CardContent } from '@mui/material';

// Templating subsection renderer
const TemplatingRenderer = ({ subsection }: { subsection: TemplatingSubsection }) => {
  return (
    <div className="space-y-4">
      {subsection.details.map((detail, idx) => (
        <Card key={idx} className="bg-slate-800">
          <CardContent className="pt-6">
            <h4 className="text-lg font-semibold text-neutral-200 mb-2">
              {detail.title}
            </h4>
            <p className="text-sm text-neutral-300 mb-4">
              {detail.description}
            </p>
            <div className="space-y-2">
              {detail.examples.map((example, exIdx) => (
                <div key={exIdx} className="bg-slate-700 p-2 rounded-md">
                  <code className="text-sm text-neutral-200">{example}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Special tags subsection renderer
const SpecialTagsRenderer = ({ subsection }: { subsection: SpecialTagsSubsection }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-300">
        {subsection.description}
      </p>
      <div className="grid gap-4">
        {subsection.tags.map((tag, idx) => (
          <Card key={idx} className="bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center mb-2">
                <code className="text-lg font-mono text-emerald-400">
                  {tag.name}
                </code>
              </div>
              <p className="text-sm text-neutral-300 mb-2">
                {tag.purpose}
              </p>
              <div className="bg-slate-700 p-3 rounded-md">
                <p className="text-sm text-neutral-200">
                  <span className="text-neutral-400">Usage:</span> {tag.usage}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Main system prompt subsection renderer
const SystemPromptSubsectionRenderer = ({ 
  subsectionKey, 
  subsection 
}: { 
  subsectionKey: string;
  subsection: TemplatingSubsection | SpecialTagsSubsection;
}) => {
  switch (subsectionKey) {
    case 'templating':
      return <TemplatingRenderer subsection={subsection as TemplatingSubsection} />;
    case 'special_tags':
      return <SpecialTagsRenderer subsection={subsection as SpecialTagsSubsection} />;
    default:
      return (
        <div className="p-4 bg-slate-800 rounded-md">
          <p className="text-neutral-400">Unknown subsection type</p>
        </div>
      );
  }
};

export default SystemPromptSubsectionRenderer;