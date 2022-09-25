import axios, { Options } from "redaxios";
import Form from "form-data";
import parse from "node-html-parser";
import qs from "qs";

import {
  AllContentResponse,
  Assignment,
  AssignmentsAllCoursesResponse,
  Category,
  Course,
  CourseAssignments,
  CourseAssignmentsResponse,
  CourseResponse,
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

  const homeLoginResponse = await axios(HOME_LOGIN);

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
    columnNames,
  };
};

const fetchAssignments = async (
  host: string,
  sessionId: string,
  referer: string,
  course: Course
): Promise<CourseAssignmentsResponse> => {
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
  };

  // @ts-ignore
  const assignmentsResponse: string = (await axios(ASSIGNMENTS)).data;

  const assignmentsHtml = parse(assignmentsResponse);

  const categoryElements = assignmentsHtml.querySelectorAll(
    ".tablePanelContainer"
  );

  const categories: Category[] = categoryElements.map((c) => {
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
      const grade: Assignment["grade"] = parseInt(
        elementList[gradeIndex].textContent
      );
      const dropped: Assignment["dropped"] =
        elementList[droppedIndex].textContent.trim().length !== 0;
      const assign: Assignment["assign"] = elementList[assignIndex].textContent;
      const due: Assignment["due"] = elementList[dueDateIndex].textContent;
      const scale: Assignment["scale"] = parseInt(
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

    const cateogry: Category = {
      name: categoryDetailElements[0].innerText,
      id: c.id.substring(0, c.id.length - "panelContainer".length),
      average,
      weight,
      assignments,
      error,
    };

    return cateogry;
  });

  const response: CourseAssignmentsResponse = {
    referer: ASSIGNMENTS.url!,
    sessionId,
    categories,
  };

  return response;
};

const fetchAssignmentsForAllCourses = async (
  host: string,
  sessionId: string,
  oldReferer: string,
  courses: Course[]
): Promise<AssignmentsAllCoursesResponse> => {
  const all: CourseAssignments[] = [];

  let referer = oldReferer;

  for (const course of courses) {
    const assignmentsResponse = await fetchAssignments(
      host,
      sessionId,
      referer,
      course
    );

    all.push({
      ...course,
      categories: assignmentsResponse.categories,
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
  assignments: CourseAssignments[],
  gradePeriods: string[]
) => {
  db.table("records").add({
    date: Date.now(),
    data: assignments,
    gradePeriods,
  });
};

const fetchAllContent = async (
  host: string,
  username: string,
  password: string
): Promise<AllContentResponse> => {
  const reportCard = await fetchReportCard(host, username, password);

  const gradingPeriods = reportCard.columnNames;

  const assignmentsAllCoursesResponse = await fetchAssignmentsForAllCourses(
    host,
    reportCard.sessionId,
    reportCard.referer,
    reportCard.courses
  );

  return {
    ...assignmentsAllCoursesResponse,
    gradingPeriods,
  };
};

export {
  fetchReportCard,
  fetchAssignments,
  addRecordToDb,
  fetchAssignmentsForAllCourses,
  fetchAllContent,
};
