import { motion, Variants } from 'framer-motion';
import { PlayArrow, SvgIconComponent } from '@mui/icons-material';
import { siteSections } from '../../../utils/SectionIcons';
import { collectionElementIcons } from '../../../utils/CollectionUtils';

const TaskExecutionPreview = () => {
    const containerVariants: Variants = {
        initial: { opacity: 1 },
        animate: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        },
        hover: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const inputVariants: Variants = {
        initial: { width: "40%" },
        animate: {
            width: "100%",
            transition: {
                duration: 0.8,
                ease: "easeInOut"
            }
        },
        hover: {
            width: ["40%", "100%"],
            transition: {
                duration: 0.8,
                ease: "easeInOut"
            }
        }
    };

    const buttonVariants: Variants = {
        initial: {
            scale: 1,
            boxShadow: "0px 0px 0px rgba(139, 92, 246, 0)"
        },
        animate: {
            scale: 1.1,
            boxShadow: "0px 0px 20px rgba(139, 92, 246, 0.3)",
            transition: {
                duration: 0.5,
                repeat: 1,
                repeatType: "reverse"
            }
        },
        hover: {
            scale: [1, 1.1],
            boxShadow: ["0px 0px 0px rgba(139, 92, 246, 0)", "0px 0px 20px rgba(139, 92, 246, 0.3)"],
            transition: {
                duration: 0.5,
                repeat: 1,
                repeatType: "reverse"
            }
        }
    };

    return (
        <motion.div
            className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-3 p-4"
            initial="initial"
            animate="animate"
            whileHover="hover"
            variants={containerVariants}
        >
            <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-violet-500" />
                <motion.div
                    variants={inputVariants}
                    className="h-6 rounded-md bg-neutral-200 dark:bg-neutral-700"
                />
            </div>

            <motion.div
                variants={inputVariants}
                className="h-6 rounded-md bg-neutral-200 dark:bg-neutral-700 w-3/4"
            />
            <motion.div
                variants={inputVariants}
                className="h-6 rounded-md bg-neutral-200 dark:bg-neutral-700 w-1/2"
            />

            <motion.div
                variants={buttonVariants}
                className="w-24 h-8 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 self-end flex items-center justify-center"
            >
                <PlayArrow className="text-white" />
            </motion.div>
        </motion.div>
    );
};

const StructuresPreview = () => {
    const containerVariants: Variants = {
        initial: { opacity: 1 },
        animate: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        },
        hover: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        initial: { x: -20, opacity: 0 },
        animate: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.5 }
        },
        hover: {
            x: [-20, 0],
            opacity: [0, 1],
            transition: { duration: 0.5 }
        }
    };

    const gradientBarVariants: Variants = {
        initial: { width: 20 },
        animate: {
            width: [20, 60],
            transition: { duration: 0.3 }
        },
        hover: {
            width: [20, 60],
            transition: { duration: 0.3 }
        }
    };

    const components = [
        { icon: collectionElementIcons['Prompt'], label: "Prompt" },
        { icon: collectionElementIcons['Task'], label: "Task" },
        { icon: collectionElementIcons['Agent'], label: "Agent" }
    ];

    return (
        <motion.div
            className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] items-center justify-center p-4"
            initial="initial"
            animate="animate"
            whileHover="hover"
            variants={containerVariants}
        >
            <div className="flex flex-col space-y-2">
                {components.map((comp, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        className="flex items-center space-x-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-2"
                    >
                        <comp.icon className="w-4 h-4 text-violet-500" />
                        <span className="text-xs text-neutral-600 dark:text-neutral-300">{comp.label}</span>
                        <motion.div
                            className="h-1 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
                            variants={gradientBarVariants}
                        />
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

const ReferencesPreview = () => {
    const containerVariants = {
        initial: { opacity: 1 },
        hover: { opacity: 1 }
    };

    // Different types of references
    const referenceTypes = [
        { type: "Task result", color: "from-violet-500 to-blue-500" },
        { type: "Message", color: "from-blue-500 to-cyan-500" },
        { type: "File", color: "from-cyan-500 to-teal-500" },
        { type: "Entity Reference", color: "from-teal-500 to-violet-500" }
    ];

    return (
        <motion.div
            className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] items-center justify-center"
            initial="initial"
            whileHover="hover"
            variants={containerVariants}
        >
            <div className="relative w-32 h-32">
                {referenceTypes.map((ref, i) => {
                    const angle = (i * Math.PI * 2) / referenceTypes.length;
                    const radius = 40;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    return (
                        <motion.div
                            key={i}
                            className={`absolute w-18 rounded-lg bg-gradient-to-r ${ref.color}`}
                            style={{
                                left: "50%",
                                top: "50%",
                                transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`
                            }}
                            initial={{ opacity: 0.5, height: 20 }}
                            whileHover={{
                                opacity: 1,
                                height: 40,
                                transition: { duration: 0.3 }
                            }}
                        >
                            <div className="h-full flex items-center justify-center px-1">
                                <span className="text-xs text-white font-medium whitespace-nowrap overflow-hidden text-ellipsis">{ref.type}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
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
                <p className="text-sm text-neutral-500">Help me, Alice-wan: You're my only hope.</p>
                <div className="h-6 w-6 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 flex-shrink-0" />
            </motion.div>
        </motion.div>
    );
};

const KnowledgePreview = () => {
    const variants = {
        initial: {
            width: 0,
        },
        animate: {
            width: "100%",
            transition: {
                duration: 0.2,
            },
        },
        hover: {
            width: ["0%", "100%"],
            transition: {
                duration: 2,
            },
        },
    };
    const arr = new Array(6).fill(0);
    return (
        <motion.div
            initial="initial"
            animate="animate"
            whileHover="hover"
            className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2"
        >
            {arr.map((_, i) => (
                <motion.div
                    key={"skelenton-two" + i}
                    variants={variants}
                    style={{
                        maxWidth: Math.random() * (100 - 40) + 40 + "%",
                    }}
                    className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-2  items-center space-x-2 bg-neutral-100 dark:bg-black w-full h-4"
                ></motion.div>
            ))}
        </motion.div>
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

const getPreviewComponent = (sectionId: string) => {
    switch (sectionId) {
        case 'chat':
            return <ChatPreview />;
        case 'tasks':
            return <TaskExecutionPreview />;
        case 'structures':
            return <StructuresPreview />;
        case 'references':
            return <ReferencesPreview />;
        case 'learn':
            return <KnowledgePreview />;
        default:
            return <GradientBox icon={siteSections[sectionId].icon} text={siteSections[sectionId].title} />;
    }
};

export { getPreviewComponent };