import Dexie, { IndexableType } from "dexie";
import { Course, GradebookNotification } from "scorecard-types";
import { GradebookMutation } from "./compareRecords";
import { AorAn, pluralize } from "./util";
import { getDomain } from "./domain";

function parseMutations(
  mutations: GradebookMutation[],
  courseDisplayNames: { [key: string]: string }
): GradebookNotification[] {
  const notifications: GradebookNotification[] = [];

  // map of mutations for every coursekey
  const courseMutations: Record<string, GradebookMutation[]> = {};
  const newRemovedCourseNotifications: Record<string, GradebookMutation[]> = {};

  chrome.storage.local.get(["coursesLastUpdated"], (res) => {
    const coursesLastUpdated = res.coursesLastUpdated || {};

    mutations.forEach((mutation) => {
      if (mutation.courseKey) {
        coursesLastUpdated[mutation.courseKey] = Date.now();
      }
    });

    chrome.storage.local.set({ coursesLastUpdated });
  });
  mutations.forEach((mutation) => {
    if (mutation.courseKey) {
      if (!courseMutations[mutation.courseKey]) {
        courseMutations[mutation.courseKey] = [];
      }
      courseMutations[mutation.courseKey].push(mutation);
    } else if (mutation.subject === "course") {
      if (!newRemovedCourseNotifications[mutation.name!]) {
        newRemovedCourseNotifications[mutation.name!] = [];
      }
      newRemovedCourseNotifications[mutation.name!].push(mutation);
    }
  });

  // parse course mutations
  Object.keys(courseMutations).forEach((courseKey) => {
    const mutations: GradebookMutation[] = courseMutations[courseKey];
    const withValue: GradebookMutation[] = [];
    const withoutValue: GradebookMutation[] = [];

    let icon: GradebookNotification["icon"] = "NEUTRAL";
    let oldAverage = "";
    let newAverage = "";

    const courseName =
      (mutations[0].courseKey && courseDisplayNames[mutations[0].courseKey]) ??
      mutations[0].courseName ??
      "Unknown Course";

    if (
      mutations[0].newAverage &&
      mutations[0].oldAverage &&
      mutations[0].newAverage > mutations[0].oldAverage
    ) {
      oldAverage = mutations[0].oldAverage;
      newAverage = mutations[0].newAverage;

      icon = "RISE";
    } else if (
      mutations[0].newAverage &&
      mutations[0].oldAverage &&
      mutations[0].newAverage < mutations[0].oldAverage
    ) {
      oldAverage = mutations[0].oldAverage;
      newAverage = mutations[0].newAverage;

      icon = "FALL";
    }

    mutations.forEach((mutation) => {
      if (mutation.grade && mutation.subject === "assignment") {
        withValue.push(mutation);
      } else if (mutation.subject === "assignment") {
        withoutValue.push(mutation);
      }
    });

    if (withValue.length === 1) {
      // one grade changed
      const grade = withValue[0].grade ?? "??";
      const assignmentName = withValue[0].name ?? "Unknown Assignment";

      notifications.push({
        icon,
        title: courseName,
        message:
          icon === "NEUTRAL"
            ? `You got ${AorAn(grade)} ${grade} on ${assignmentName}.`
            : `You got ${AorAn(
                grade
              )} ${grade} on ${assignmentName}, and your average ${
                icon === "RISE" ? "rose" : "dropped"
              } from ${oldAverage} to ${newAverage}.`,
        date: Date.now(),
        read: false,
        course: courseKey,
      });
    } else if (withValue.length > 1) {
      const gradeCount = withValue.length;

      notifications.push({
        icon,
        title: courseName,
        message:
          icon === "NEUTRAL"
            ? `You recieved ${gradeCount} new grades.`
            : `You got ${gradeCount} new grades, and your average ${
                icon === "RISE" ? "rose" : "dropped"
              } from ${oldAverage} to ${newAverage}.`,
        date: Date.now(),
        read: false,
        course: courseKey,
      });
    }

    if (withoutValue.length === 1) {
      const assignmentName = withoutValue[0].name ?? "Unknown Assignment";

      notifications.push({
        icon,
        title: courseName,
        message: `A new assignment was added without a grade: ${assignmentName}.`,
        date: Date.now(),
        read: false,
        course: courseKey,
      });
    } else if (withoutValue.length > 1) {
      const assignmentCount = withoutValue.length;

      notifications.push({
        icon,
        title: courseName,
        message: `${assignmentCount} new assignment${pluralize(
          assignmentCount
        )} were added without a grade.`,
        date: Date.now(),
        read: false,
        course: courseKey,
      });
    }
  });

  const updatedCourses = Object.keys(newRemovedCourseNotifications);

  if (updatedCourses.length === 1) {
    const courseName = updatedCourses[0];

    notifications.push({
      icon: "NEUTRAL",
      title: courseName,
      message:
        updatedCourses.length >= 1
          ? `This course was likely updated and some of your settings may have changed.`
          : `This course was likely ${
              newRemovedCourseNotifications[courseName][0].type === "add"
                ? "added"
                : "removed"
            } and some of your settings may have changed.`,
      date: Date.now(),
      read: false,
      course: newRemovedCourseNotifications[courseName][0].courseKey,
    });
  } else if (updatedCourses.length > 1) {
    notifications.push({
      icon: "NEUTRAL",
      title: "Multiple Courses",
      message: `${updatedCourses.length} courses were added, removed, or updated and some of your settings may have changed.`,
      date: Date.now(),
      read: false,
    });
  }
  return notifications;
}

function addNotificationsToDb(
  db: Dexie,
  notifications: GradebookNotification[]
) {
  return new Promise<void>((resolve) => {
    chrome.storage.local.get("settings").then((res) => {
      const time = res.settings?.deleteNotificationsAfter;

      db.table("notifications")
        .bulkAdd(notifications)
        .then(() => {
          db.transaction("rw", "notifications", () => {
            db.table("notifications")
              .each((notification: GradebookNotification) => {
                if (
                  time !== undefined &&
                  notification.read &&
                  Date.now() - notification.date >= time * 24 * 60 * 60 * 1000
                ) {
                  db.table("notifications").delete(
                    notification.id as IndexableType
                  );
                }
              })
              .then(() => {
                resolve();
              });
          });
        });
    });
  });
}

function addNotificationClickHandler() {
  chrome.notifications.onClicked.addListener((id) => {
    if (id.includes("|")) {
      chrome.tabs.create({ url: getDomain() + '/app#' + id.split("|")[0] }).then((tab) => {
        chrome.windows.update(tab.windowId, {focused: true})
      });
    }
  })
}

export { parseMutations, addNotificationsToDb, addNotificationClickHandler };
