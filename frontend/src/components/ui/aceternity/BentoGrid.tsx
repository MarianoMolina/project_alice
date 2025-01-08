import { cn } from "../../../utils/cn";

export const BentoGrid = ({
  className,
  children,
  height = 18,
}: {
  className?: string;
  children?: React.ReactNode;
  height?: number;
}) => {
  return (
    <div
      className={cn(
        `grid md:auto-rows-[${height}rem] grid-cols-1 md:grid-cols-4 gap-4 max-w-7xl mx-auto h-full place-content-center overflow-auto`,
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  onClick,
  background = "bg-slate-200/75",
  textColor = "text-neutral-600",
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  background?: string;
  textColor?: string;
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        background, 
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-black dark:border-white/[0.2] border border-transparent justify-between flex flex-col space-y-4 cursor-pointer",
        className
      )}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        {icon}
        <div className={cn(textColor, "font-sans font-bold mb-2 mt-2")}>
          {title}
        </div>
        <div className={cn(textColor,"font-sans font-normal text-xs")}>
          {description}
        </div>
      </div>
    </div>
  );
};