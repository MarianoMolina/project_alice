import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BentoGrid, BentoGridItem } from '../aceternity/BentoGrid';
import { cn } from '../../../utils/cn';
import { getDashboardSections, siteSections } from '../../../utils/SectionIcons';
import { PlayArrow, SvgIconComponent } from '@mui/icons-material';

const Dashboard = () => {
  const navigate = useNavigate();
  const sections = getDashboardSections();

  return (
    <div className="max-w-6xl mx-auto p-4">
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

// Helper function to get the appropriate preview component
const getPreviewComponent = (sectionId: string) => {
  switch (sectionId) {
    case 'chat':
      return <ChatPreview />;
    case 'tasks':
      return <TaskPreview />;
    default:
      return <GradientBox icon={siteSections[sectionId].icon} text={siteSections[sectionId].title} />;
  }
};

const ChatPreview = () => {
  const variants = {
    initial: { x: 0 },
    animate: {
      x: 10,
      rotate: 5,
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2"
    >
      <motion.div
        variants={variants}
        className="flex flex-row rounded-2xl border border-neutral-100 dark:border-white/[0.2] p-2 items-start space-x-2 bg-white dark:bg-black"
      >
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 flex-shrink-0" />
        <p className="text-sm text-neutral-500">
          Hi! I'm Alice. How can I help you today? I'm here to assist with your tasks and questions.
        </p>
      </motion.div>
      <motion.div
        variants={variants}
        className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-2 items-center space-x-2 w-3/4 ml-auto bg-white dark:bg-black"
      >
        <p className="text-sm text-neutral-500">Help me get my life together, pls.</p>
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 flex-shrink-0" />
      </motion.div>
    </motion.div>
  );
};

const TaskPreview = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] rounded-lg">
      <div className="w-full h-full bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg p-4 flex items-center justify-center">
        <div className="text-white text-center">
          <PlayArrow className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">Execute and Monitor Tasks</p>
        </div>
      </div>
    </div>
  );
};

const GradientBox = ({ 
    icon: Icon, 
    text 
  }: { 
    icon: SvgIconComponent;
    text: string;
  }) => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800 p-4">
    <div className="flex flex-col items-center justify-center w-full">
      <Icon className="w-8 h-8 mb-2 text-neutral-600 dark:text-neutral-300" />
      <p className="text-sm text-center text-neutral-600 dark:text-neutral-300">{text}</p>
    </div>
  </div>
);

export default Dashboard;