import Chip from "./Chip";

function TopContainer() {
  return (
    <div className="flex justify-between items-center bg-mono-100 p-3 fixed top-0 left-0 w-full">
      <h3>Scorecard</h3>
      <Chip highlighted={false} onClick={() => {}}>
        Open in Fullscreen
      </Chip>
    </div>
  );
}

export default TopContainer;
