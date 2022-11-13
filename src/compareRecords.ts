import { Assignment, GradebookRecord } from "scorecard-types";

interface GradebookMutation {
  type: "add" | "remove" | "update";
  subject: "course" | "assignmentCategory" | "assignment";
  name?: string;
  oldAverage?: string;
  newAverage?: string;
  grade?: string;
  courseKey?: string;
  courseName?: string;
}

function compareCourseLists(ref: {
  oldCourses: GradebookRecord["courses"];
  newCourses: GradebookRecord["courses"];
}): GradebookMutation[] {
  const mutations: GradebookMutation[] = [];

  ref.oldCourses.sort((a, b) => a.key.localeCompare(b.key));
  ref.newCourses.sort((a, b) => a.key.localeCompare(b.key));
  const { oldCourses, newCourses } = ref;

  const newNames: string[] = [];

  const newKeys = newCourses.map((c) => {
    newNames.push(c.name);
    return c.key;
  });

  const oldNames: string[] = [];

  const oldKeys = oldCourses.map((c) => {
    oldNames.push(c.name);
    return c.key;
  });

  const added = newKeys.filter((k, i) => {
    if (!oldKeys.includes(k)) {
      mutations.push({
        type: "add",
        subject: "course",
        name: newNames[i],
      });
      return true;
    }
    return false;
  });

  const removed = oldKeys.filter((k, i) => {
    if (!newKeys.includes(k)) {
      mutations.push({
        type: "remove",
        subject: "course",
        name: oldNames[i],
      });
      return true;
    }
    return false;
  });

  // remove courses from jNew that were added
  ref.newCourses = newCourses.filter((c) => !added.includes(c.key));

  // remove courses from jOld that were removed
  ref.oldCourses = oldCourses.filter((c) => !removed.includes(c.key));

  return mutations;
}

function compareAssignments(ref: {
  oldAssignments: Assignment[];
  newAssignments: Assignment[];
  oldAverage: string;
  newAverage: string;
  courseKey: string;
  courseName: string;
}): GradebookMutation[] {
  const mutations: GradebookMutation[] = [];

  const { oldAverage, newAverage, courseKey, courseName } = ref;
  const newAssignments = ref.newAssignments.map((a) => a.name);

  const oldAssignments = ref.oldAssignments.map((a) => a.name);

  const added = newAssignments.filter((a, idx) => {
    if (!oldAssignments.includes(a)) {
      mutations.push({
        type: "add",
        subject: "assignment",
        name: a,
        grade: ref.newAssignments[idx].grade,
        newAverage,
        oldAverage,
        courseKey,
        courseName,
      });
      return true;
    }
    return false;
  });

  const removed = oldAssignments.filter((a) => {
    if (!newAssignments.includes(a)) {
      mutations.push({
        type: "remove",
        subject: "assignment",
        name: a,
        newAverage,
        oldAverage,
        courseKey,
        courseName,
      });
      return true;
    }
    return false;
  });

  const newAssignmentsFiltered = ref.newAssignments.filter(
    (a) => !added.includes(a.name)
  );

  const oldAssignmentsFiltered = ref.oldAssignments.filter(
    (a) => !removed.includes(a.name)
  );

  newAssignmentsFiltered.sort(
    (a, b) => a.name?.localeCompare(b.name ?? "") ?? 0
  );
  oldAssignmentsFiltered.sort(
    (a, b) => a.name?.localeCompare(b.name ?? "") ?? 0
  );

  newAssignmentsFiltered.forEach((newAssignment, i) => {
    const oldAssignment = oldAssignmentsFiltered[i];

    if (newAssignment?.grade !== oldAssignment?.grade) {
      mutations.push({
        type: "update",
        subject: "assignment",
        name: newAssignment.name,
        grade: newAssignment.grade,
        newAverage,
        oldAverage,
        courseKey,
        courseName,
      });
    }
  });

  return mutations;
}

function compareAssignmentCategories(ref: {
  oldCategories: GradebookRecord["courses"][0]["gradeCategories"];
  newCategories: GradebookRecord["courses"][0]["gradeCategories"];
  oldAverage: string;
  newAverage: string;
  courseKey: string;
  courseName: string;
}): GradebookMutation[] {
  const mutations: GradebookMutation[] = [];

  ref.oldCategories?.sort((a, b) => a.name.localeCompare(b.name));
  ref.newCategories?.sort((a, b) => a.name.localeCompare(b.name));

  const {
    oldCategories,
    newCategories,
    oldAverage,
    newAverage,
    courseKey,
    courseName,
  } = ref;

  const newNames = newCategories?.map((c) => c.name) ?? [];
  const oldNames = newCategories?.map((c) => c.name) ?? [];

  const added = newNames.filter((name, idx) => {
    if (!oldNames.includes(name)) {
      mutations.push({
        type: "add",
        subject: "assignmentCategory",
        name,
        newAverage,
        oldAverage,
        courseKey,
        courseName,
      });
      mutations.push(
        ...compareAssignments({
          newAssignments: newCategories?.[idx].assignments ?? [],
          oldAssignments: [],
          newAverage,
          oldAverage,
          courseKey,
          courseName,
        })
      );
      return true;
    }
    return false;
  });

  const removed = oldNames.filter((name, idx) => {
    if (!newNames.includes(name)) {
      mutations.push({
        type: "remove",
        subject: "assignmentCategory",
        name,
        newAverage,
        oldAverage,
        courseKey,
        courseName,
      });
      mutations.push(
        ...compareAssignments({
          newAssignments: [],
          oldAssignments: oldCategories?.[idx].assignments ?? [],
          newAverage,
          oldAverage,
          courseKey,
          courseName,
        })
      );
      return true;
    }
    return false;
  });

  // remove categories from jNew that were added
  ref.newCategories = newCategories?.filter((c) => !added.includes(c.name));

  // remove categories from jOld that were removed
  ref.oldCategories = oldCategories?.filter((c) => !removed.includes(c.name));

  return mutations;
}

function compareRecords(
  oldRecord: GradebookRecord,
  newRecord: GradebookRecord
): GradebookMutation[] {
  const mutations: GradebookMutation[] = [];

  const oldCourses = oldRecord.courses;
  const newCourses = newRecord.courses;

  mutations.push(
    ...compareCourseLists({
      oldCourses,
      newCourses,
    })
  );

  for (let i = 0; i < oldCourses.length; i++) {
    const oldCourse = oldCourses[i];
    const newCourse = newCourses[i];

    const newAverage =
      newCourse.grades[newCourse.grades.filter((g) => g).length - 1]?.value ??
      "";
    const oldAverage =
      oldCourse.grades[oldCourse.grades.filter((g) => g).length - 1]?.value ??
      "";

    const oldCategories = oldCourse.gradeCategories;
    const newCategories = newCourse.gradeCategories;

    mutations.push(
      ...compareAssignmentCategories({
        oldCategories,
        newCategories,
        newAverage,
        oldAverage,
        courseKey: newCourse.key,
        courseName: newCourse.name,
      })
    );

    newCategories?.forEach((newAssignmentCategory, i) => {
      const oldAssignmentCategory = oldCategories?.[i];

      mutations.push(
        ...compareAssignments({
          newAssignments: newAssignmentCategory.assignments ?? [],
          oldAssignments: oldAssignmentCategory?.assignments ?? [],
          newAverage,
          oldAverage,
          courseKey: newCourse.key,
          courseName: newCourse.name,
        })
      );
    });
  }

  return mutations;
}

export { compareRecords, type GradebookMutation };
