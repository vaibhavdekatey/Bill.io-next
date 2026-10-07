import PillLink from "./PillLink";

type CardProps = {
  className?: string;
  num?: number | string;
  heading?: string;
  description?: string;
  hrefTitle?: string;
  href?: string;
  isLoading?: boolean;
};

const Card = ({
  className = "",
  num = 0,
  heading = "Active Clients",
  description = "Clients with invoices, quotations, and projects",
  hrefTitle = "View Clients",
  href = "#",
  isLoading = false,
}: CardProps) => {
  return (
    <div
      className={`${className} flex flex-col justify-between rounded-xl bg-origin-border bg-no-repeat border border-transparent hover:border-white h-[18em] w-full p-8 transition-all ease-in-out duration-500`}
    >
      <div className="flex flex-col gap-y-2">
        <p className="text-base">{heading}</p>
        {isLoading ? (
          <div className="h-14 w-20 bg-white/20 rounded-lg animate-pulse my-1" />
        ) : (
          <p className="text-6xl font-extralight ">{num}</p>
        )}
        <p className="text-base">{description}</p>
      </div>
      <PillLink href={href} hrefTitle={hrefTitle} arrow={true} />
    </div>
  );
};

export default Card;
