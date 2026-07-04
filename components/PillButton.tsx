import React from "react";

type pillProps = {
  onClickFunction: React.MouseEventHandler<HTMLButtonElement>;
  title: React.ReactNode;
  arrow: boolean;
  disabled: boolean;
  varient?: string;
  className?: string;
};

const PillButton = ({
  onClickFunction,
  title,
  disabled,
  arrow = true,
  varient = "main",
  className,
}: pillProps) => {
  const handleClick = (
    disabled: boolean,
    onClickFunction: React.MouseEventHandler<HTMLButtonElement>,
  ): React.MouseEventHandler<HTMLButtonElement> | undefined => {
    if (disabled) return undefined;
    return onClickFunction;
  };

  return (
    <button
      onClick={handleClick(disabled, onClickFunction)}
      // className=
      className={
        varient === "main"
          ? `bg-neutral-950 text-sm ${className} p-2 px-3.5 border border-neutral-800 hover:border-neutral-400 rounded-full hover:bg-white/80 hover:text-black flex flex-row items-center justify-center cursor-pointer gap-2 hover:transition-all hover:duration-500 transition-all ease-in-out duration-500 `
          : `bg-neutral-50 text-sm  text-black ${className} p-2 px-3.5 border border-neutral-50 hover:border-neutral-800 rounded-full hover:bg-neutral-900 hover:text-white flex flex-row items-center justify-center cursor-pointer gap-2 hover:transition-all hover:duration-500 transition-all ease-in-out duration-500 `
      }
    >
      {title}
      {arrow && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1.4em"
          height="1.4em"
          viewBox="0 0 24 24"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 12H5m14 0l-4 4m4-4l-4-4"
          />
        </svg>
      )}
    </button>
  );
};

export default PillButton;
