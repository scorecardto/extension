import BottomContainer from "./BottomContainer";
import CourseGrade from "./CourseGrade";
import Courses from "./Courses";
import NotificationsPreview from "./NotificationPreview";
import SettingsButton from "./SettingsButton";
import TopContainer from "./TopContainer";
import TopBar from "./TopContainer";

function Main() {
  return (
    <div className="relative">
      <TopContainer />

      <Courses />

      <BottomContainer />
    </div>
  );
}

export default Main;
