import axios, { Options } from "redaxios";
import Form from "form-data";
import parse from "node-html-parser";
import qs from "qs";
import { SessionState } from "http2";
import { Course, CourseResponse } from "./types/Course";

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
    ".studentGradingBottomLeft tr:not(:first-child) td:first-child"
  );

  const columnNames: string[] = [];

  const courses: Course[] = [];

  courseElements.forEach((courseElement, idx) => {
    const courseKey: string = courseElement.getAttribute("cellkey")!;

    const name =
      qs.parse(courseKey, { delimiter: "," })["courseIndex"]?.toString() ??
      "Untitled Course";

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
