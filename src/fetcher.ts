import axios, { Options } from "redaxios";
import Form from "form-data";
import parse from "node-html-parser";
import { CourseSettings } from "scorecard-types";
import qs from "qs";
import * as iso88592 from "iso-8859-2";

import {
  AllContentResponse,
  AllCoursesResponse,
  Assignment,
  GradeCategory,
  Course,
  GradeCategoriesResponse,
  CourseResponse,
  GradebookRecord,
} from "scorecard-types";
import Dexie from "dexie";

const generateSessionId = () => {
  return [...Array(32)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("")
    .toUpperCase();
};

const toFormData = (obj: any) => {
  const formData = new Form();
  Object.keys(obj).forEach((key) => {
    formData.append(key, obj[key]);
  });
  return formData;
};

const fetchReportCard = async (
  host: string,
  username: string,
  password: string
): Promise<CourseResponse> => {
  const cookie = generateSessionId();

  const ENTRY_POINT: Options = {
    url: `https://${host}/selfserve/EntryPointHomeAction.do?parent=false`,
    method: "GET",
    headers: {
      Cookie: `JSESSIONID=${cookie}`,
      Connection: "keep-alive",
      "Accept-Encoding": "gzip, deflate, br",
      Accept: "*/*",
    },
  };
  const entryPointResponse = await axios(ENTRY_POINT);

  const ENTRY_POINT_LOGIN: Options = {
    url: `https://${host}/selfserve/HomeLoginAction.do?parent=false&teamsStaffUser=N`,
    method: "GET",
    headers: {
      Referer: ENTRY_POINT.url!,
      Cookie: `JSESSIONID=${cookie}`,
      Connection: "keep-alive",
      "Accept-Encoding": "gzip, deflate, br",
      Accept: "*/*",
    },
  };
  const entryPointLoginResponse = await axios(ENTRY_POINT_LOGIN);

  const HOME_LOGIN: Options = {
    url: `https://${host}/selfserve/SignOnLoginAction.do?parent=false&teamsStaffUser=N`,
    method: "POST",
    data: toFormData({
      selectedIndexId: -1,
      selectedTable: "",
      smartFormName: "SmartForm",
      focusElement: "",
      userLoginId: username,
      userPassword: password,
    }),
    headers: {
      Referer: ENTRY_POINT_LOGIN.url!,
      Cookie: `JSESSIONID=${cookie}`,
      Connection: "keep-alive",
      "Accept-Encoding": "gzip, deflate, br",
      Accept: "*/*",
    },
  };
  // @ts-ignore
  const homeLoginResponse: string = (await axios(HOME_LOGIN)).data;

  const homeLoginHtml = parse(homeLoginResponse);

  if (
    homeLoginHtml.querySelector("span.error")?.innerText ===
    "User ID or Password is incorrect."
  ) {
    throw new Error("INCORRECT_PASSWORD");
  }
  if (
    homeLoginHtml.querySelector("span.error")?.innerText ===
    "The username or password you entered is invalid.  Please try again."
  ) {
    throw new Error("INCORRECT_USERNAME");
  }

  const REPORT_CARDS: Options = {
    url: `https://${host}/selfserve/PSSViewReportCardsAction.do?x-tab-id=undefined`,
    method: "POST",
    body: toFormData({
      "x-tab-id": "undefined",
    }),
    headers: {
      Referer: HOME_LOGIN.url!,
      Cookie: `JSESSIONID=${cookie}`,
      Connection: "keep-alive",
      "Accept-Encoding": "gzip, deflate, br",
      Accept: "*/*",
    },
  };
  // @ts-ignore
  const reportCardsResponse: string = (await axios(REPORT_CARDS)).data;

  const reportCardsHtml = parse(reportCardsResponse);

  const courseElements = reportCardsHtml.querySelectorAll(
    ".studentGradingBottomLeft tr:not(:first-child) td:nth-child(4)"
  );

  const columnNames: string[] = [];

  const courses: Course[] = [];

  courseElements.forEach((courseElement, idx) => {
    const courseKey: string = courseElement.getAttribute("cellkey")!;

    const name = courseElement.textContent;

    const grades: Course["grades"] = [];

    const gradeElements = reportCardsHtml.querySelectorAll(
      `.studentGradingBottomRight tr:nth-child(${idx + 2}) td`
    );

    gradeElements.forEach((gradeElement) => {
      const key = gradeElement.getAttribute("cellkey")!;
      const parsedKey = qs.parse(key, { delimiter: "," });

      if (idx === 0) {
        columnNames.push(
          parsedKey["gradeTypeIndex"]?.toString() ?? "Grading Period"
        );
      }

      const grade = parsedKey["gradeIndex"];

      if (grade && typeof grade === "string") {
        grades.push({
          key,
          value: grade,
          active: !!gradeElement.querySelector("font"),
        });
      } else {
        grades.push(null);
      }
    });

    courses.push({
      key: courseKey,
      name,
      grades,
    });
  });

  return {
    courses,
    sessionId: cookie,
    referer: REPORT_CARDS.url!,
    gradeCategoryNames: columnNames,
  };
};

const fetchGradeCategoriesForCourse = async (
  host: string,
  sessionId: string,
  referer: string,
  course: Course
): Promise<GradeCategoriesResponse> => {
  const ASSIGNMENTS: Options = {
    url: `https://${host}/selfserve/PSSViewGradeBookEntriesAction.do?x-tab-id=undefined`,
    method: "POST",
    data: toFormData({
      selectedIndexId: -1,
      selectedTable: "",
      smartFormName: "SmartForm",
      focusElement: "",
      gradeBookKey: course.key,
      replaceObjectParam1: "",
      selectedCell: "",
      selectedTdId: "",
    }),
    headers: {
      Referer: referer,
      Cookie: `JSESSIONID=${sessionId}`,
      Connection: "keep-alive",
      "Accept-Encoding": "gzip, deflate, br",
      Accept: "*/*",
    },
    responseType: "arrayBuffer",
  };

  console.log(referer, sessionId);

  const assignmentsResponseRaw = await axios(ASSIGNMENTS);
  const assignmentsResponse = iso88592.decode(
    new Uint8Array(assignmentsResponseRaw.data)
  );

  console.log(assignmentsResponse);

  const assignmentsHtml = parse(assignmentsResponse);

  const categoryElements = assignmentsHtml.querySelectorAll(
    ".tablePanelContainer"
  );

  const gradeCategories: GradeCategory[] = categoryElements.map((c) => {
    const categoryDetailElements = c.querySelector(".sst-title")?.childNodes!;

    let error = false;

    let weight = 0;

    const average = categoryDetailElements[2].textContent.substring(
      "Average:  ".length
    );

    try {
      weight = parseFloat(
        categoryDetailElements[4].textContent.substring("Weight:  ".length)
      );
    } catch (e) {
      error = true;
    }

    const headers = c.querySelector(".frozen-row")!;

    const getHeaderPosition = (name: string): number => {
      return Array.prototype.indexOf.call(
        headers?.querySelectorAll("th"),
        headers.querySelector(`th[columnid="${name}"]`)
      );
    };

    const nameIndex = getHeaderPosition("Assignment Name");
    const gradeIndex = getHeaderPosition("Grade Value");
    const droppedIndex = getHeaderPosition("droppedIndicator");
    const assignIndex = getHeaderPosition("Assign Date");
    const dueDateIndex = getHeaderPosition("Due Date");
    const scaleIndex = getHeaderPosition("Grade Scale");
    const valueIndex = getHeaderPosition("Maximum Value");
    const countIndex = getHeaderPosition("Count");
    const noteIndex = getHeaderPosition("Note");

    const assignments: Assignment[] = [];

    c.querySelectorAll("tbody.tblBody > tr").forEach((a) => {
      const elementList = a.querySelectorAll("*");
      const error: Assignment["error"] = false;

      const name: Assignment["name"] = elementList[nameIndex].textContent;

      const points: Assignment["points"] = parseFloat(
        elementList[gradeIndex].textContent
      );

      const grade: Assignment["grade"] = (
          (
            elementList[gradeIndex].textContent
              .split("(")[1]
              ?.split(")")[0]
              .replace(/\.0?%/g, "%") ??
                elementList[gradeIndex].textContent
          ).trim() + "%"
        ).replace("%%", "%");

      const dropped: Assignment["dropped"] =
        elementList[droppedIndex].textContent.trim().length !== 0;
      const assign: Assignment["assign"] = elementList[assignIndex].textContent;
      const due: Assignment["due"] = elementList[dueDateIndex].textContent;
      const scale: Assignment["scale"] = parseFloat(
        elementList[scaleIndex].textContent
      );
      const max: Assignment["max"] = parseInt(
        elementList[valueIndex].textContent
      );
      const count: Assignment["count"] = parseInt(
        elementList[countIndex].textContent
      );
      const note: Assignment["note"] = elementList[noteIndex].textContent;

      assignments.push({
        name,
        grade,
        points,
        dropped,
        assign,
        due,
        scale,
        max,
        count,
        note,
        error,
      });

      return {
        sessionId,
        referer: ASSIGNMENTS.url!,
        assignments,
      };
    });

    return {
      name: categoryDetailElements[0].innerText,
      id: c.id.substring(0, c.id.length - "panelContainer".length),
      average,
      weight,
      assignments,
      error,
    };
  });

  const formData = {
    selectedIndexId: undefined,
    selectedTable: undefined,
    smartFormName: "SmartForm",
    focusElement: "",
  };

  gradeCategories.forEach((c) => {
    formData[`tableMetaInfo_PSSViewGradeBookEntries_${c.id}_SortOrder`] = "";
    formData[`tableMetaInfo_PSSViewGradeBookEntries_${c.id}_record_count`] =
      c.assignments?.length;
    formData[`tableMetaInfo_PSSViewGradeBookEntries_${c.id}_FilterMeta`] = {};
    formData[`tableId_${c.id}`] = c.id;
  });

  const BACK_TO_REPORT_CARD: Options = {
    url: `https://${host}/selfserve/PSSViewReportCardsAction.do?x-tab-id=undefined`,
    method: "POST",
    data: toFormData(formData),
    headers: {
      Referer: ASSIGNMENTS.url!,
      Cookie: `JSESSIONID=${sessionId}`,
      Connection: "keep-alive",
      "Accept-Encoding": "gzip, deflate, br",
      Accept: "*/*",
    },
  };

  await axios(BACK_TO_REPORT_CARD);

  return {
    referer: BACK_TO_REPORT_CARD.url!,
    sessionId,
    gradeCategories: gradeCategories,
  };
};

const updateCourseSettings = async (
  courseKey: string,
  settings: CourseSettings
): Promise<boolean> => {
  const courseSettings =
    (await chrome.storage.local.get("courseSettings"))[
      "courseSettings"
    ] ?? {};

  if (settings === null) {
    delete courseSettings[courseKey];
  } else {
    if (courseSettings[courseKey] === undefined) {
      courseSettings[courseKey] = settings;
    } else {
      for (const prop of Object.keys(settings)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (settings[prop] != null) courseSettings[courseKey][prop] = settings[prop];
      }
    }
  }

  await chrome.storage.local.set({ courseSettings: courseSettings });

  return true;
};

const fetchGradeCategoriesForCourses = async (
  host: string,
  sessionId: string,
  oldReferer: string,
  courses: Course[]
): Promise<AllCoursesResponse> => {
  const all: Course[] = [];

  let referer = oldReferer;

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];

    const assignmentsResponse = await fetchGradeCategoriesForCourse(
      host,
      sessionId,
      referer,
      course
    );

    all.push({
      ...course,
      gradeCategories: assignmentsResponse.gradeCategories,
    });

    referer = assignmentsResponse.referer;
  }

  return {
    sessionId,
    referer,
    courses: all,
  };
};

const addRecordToDb = (
  db: Dexie,
  courses: Course[],
  gradeCategoryNames: string[],
  gradeCategory: number
) => {
  return new Promise<GradebookRecord>((resolve) => {
    const record: GradebookRecord = {
      date: Date.now(),
      courses: courses,
      gradeCategoryNames: gradeCategoryNames,
      gradeCategory: gradeCategory,
    };

    db.table("records")
      .add(record)
      .then(() => {
        chrome.storage.local.set({ recordsLastUpdated: Date.now() });
        resolve(record);
      });
  });
};

const fetchAllContent = async (
  host: string,
  username: string,
  password: string
): Promise<AllContentResponse> => {
  const reportCard = await fetchReportCard(host, username, password);

  chrome.storage.local.get("courseOrder", (res) => {
    const courseOrder = res["courseOrder"] ?? [];

    for (const i in reportCard.courses) {
      const c = reportCard.courses[i];

      if (!courseOrder.includes(c.key)) {
        courseOrder.splice(i, 0, c.key); // insert but weird bc js
      }
    }

    chrome.storage.local.set({courseOrder});
  });

  const gradeCategories = reportCard.gradeCategoryNames;

  const assignmentsAllCoursesResponse = await fetchGradeCategoriesForCourses(
    host,
    reportCard.sessionId,
    reportCard.referer,
    reportCard.courses
  );

  return {
    ...assignmentsAllCoursesResponse,
    gradeCategoryNames: gradeCategories,
  };
};

export {
  fetchReportCard,
  updateCourseSettings,
  fetchGradeCategoriesForCourse,
  addRecordToDb,
  fetchGradeCategoriesForCourses,
  fetchAllContent,
};
