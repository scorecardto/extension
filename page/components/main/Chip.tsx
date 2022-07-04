function Chip(props: {
  children: string;
  highlighted: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`${
        props.highlighted
          ? "bg-accent-300 text-white border-accent-400 hover:bg-accent-400"
          : "bg-accent-100 text-accent-300 border-accent-200 hover:bg-accent-200"
      } py-1.5 px-4 rounded-full border transition-colors cursor-pointer text-xs`}
    >
      {props.children}
    </div>
  );
}

export default Chip;
