const CustomButton = ({
  title,
  href,
  disabled,
}: {
  title: string;
  href: string;
  disabled: boolean;
}) => {
  return (
    <a
      className="bg-transparent border border-white/30 hover:bg-white/80 hover:text-black tracking-wider duration-700 transition-all rounded-lg px-8 py-4 inline-block min-w-56 text-lg text-center"
      href={disabled ? "" : href}
    >
      {title}
    </a>
  );
};

export default CustomButton;
