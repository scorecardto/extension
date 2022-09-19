import axios, { Options } from "redaxios";
import Form from "form-data";
import parse from "node-html-parser";
import qs from "qs";

import {
  AllContentResponse,
  Assignment,
  Category,
  CategoryDetails,
  Course,
  CourseAssignments,
  CourseAssignmentsResponse,
  CourseResponse,
} from "scorecard-types";

import Dexie from "dexie";
import {
  addRecordToDb,
  fetchAllContent,
  fetchAssignmentsForAllCourses,
  fetchReportCard,
} from "./fetcher";

const db = new Dexie("scorecard");

db.version(1).stores({
  records: "++id, date, data",
});

chrome.runtime.onConnectExternal.addListener((port) => {
  port.postMessage({ type: "handshake", version: 0.1 });

  port.onMessage.addListener((msg) => {});
});

chrome.storage.local.get(["login"], async (res) => {
  db.table("records").toArray().then(console.log);

  if (res["login"]) {
    const login = res["login"];

    const host = login.host;
    const username = login.username;
    const password = login.password;

    const allContent: AllContentResponse = await fetchAllContent(
      host,
      username,
      password
    );

    addRecordToDb(db, allContent.courses);
  }
});
