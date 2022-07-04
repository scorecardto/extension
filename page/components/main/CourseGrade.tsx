import Chip from "./Chip";

function CourseGrade(props: { courseName: string; grade: string }) {
  return (
    <div className="flex justify-between items-center border-b last:border-b-0 border-b-mono-200 py-2 px-4">
      <p>{props.courseName}</p>

      <div className="from-accent-500 to-accent-600 bg-gradient-to-tr w-12 text-center py-1.5 rounded-full text-xs text-white">
        {props.grade}
      </div>
    </div>
  );
}

export default CourseGrade;
