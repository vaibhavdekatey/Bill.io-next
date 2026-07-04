import PillLink from "./PillLink";

type CardProps = {
  className?: string;
  num?: number;
  heading?: string;
  description?: string;
  hrefTitle?: string;
  href?: string;
};

const Card = ({
  className = "",
  num = 10,
  heading = "Active Clients",
  description = "Clients with invoices, quotations, and projects",
  hrefTitle = "View Clients",
  href = "#",
}: CardProps) => {
  return (
    <div
      className={`${className} flex flex-col justify-between rounded-xl border border-transparent hover:border-white h-[18em] w-[22em] p-8 transition-all ease-in-out duration-500 `}
    >
      <div className="flex flex-col gap-y-2">
        <p className="text-base">{heading}</p>
        <p className="text-6xl font-extralight ">{num}</p>
        <p className="text-base">{description}</p>
      </div>
      <PillLink href={href} hrefTitle={hrefTitle} arrow={true} />
    </div>
  );
};

export default Card;
