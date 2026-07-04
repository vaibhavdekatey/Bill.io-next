import Link from "next/link";
;

type pillProps = {
  href: string;
  hrefTitle: string;
  arrow?: boolean;
  plus?: boolean;
  className?: string;
  varient?: string;
};

const PillLink = ({
  href,
  hrefTitle,
  arrow = true,
  plus = false,
  className,
  varient = "",
}: pillProps) => {
  return (
    <Link href={href}
      className={
        varient === "main"
          ? `bg-neutral-950 text-sm ${className} p-2 px-3.5 border border-neutral-800 hover:border-neutral-400 rounded-full hover:bg-white/80 hover:text-black flex flex-row items-center justify-center cursor-pointer gap-2 hover:transition-all hover:duration-500 transition-all ease-in-out duration-500 `
          : `bg-neutral-50 text-sm  text-black ${className} p-2 px-3.5 border border-neutral-50 hover:border-neutral-800 rounded-full hover:bg-neutral-900 hover:text-white flex flex-row items-center justify-center cursor-pointer gap-2 hover:transition-all hover:duration-500 transition-all ease-in-out duration-500 `
      }
    >
      {plus && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path
            fill="currentColor"
            d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z"
          />
        </svg>
      )}
      {hrefTitle}
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
    </Link>
  );
};

export default PillLink;
