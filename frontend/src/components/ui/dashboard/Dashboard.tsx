import { useNavigate } from 'react-router-dom';
import { BentoGrid, BentoGridItem } from '../aceternity/BentoGrid';
import { cn } from '../../../utils/cn';
import { getDashboardSections } from '../../../utils/SectionIcons';
import { getPreviewComponent } from './SectionSkeletons';

const Dashboard = () => {
  const navigate = useNavigate();
  const sections = getDashboardSections();

  return (
    <div className="max-w-6xl mx-auto overflow-auto">
      <BentoGrid className="max-w-4xl mx-auto">
        {sections.map((section) => (
          <BentoGridItem
            key={section.id}
            title={section.title}
            description={section.description}
            header={getPreviewComponent(section.id)}
            className={cn("[&>p:text-lg]", `md:col-span-${section.dashboardSpan}`)}
            icon={<section.icon className="h-4 w-4 text-neutral-500" />}
            onClick={() => navigate(section.path)}
          />
        ))}
      </BentoGrid>
    </div>
  );
};

export default Dashboard;