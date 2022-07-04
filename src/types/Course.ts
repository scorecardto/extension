import { SessionState } from "http2";

export interface Course {
  key: string;
  name: string;
  grades: ({
    value: string;
    key: string;
    active: boolean;
  } | null)[];
}

export interface CourseResponse {
  courses: Course[];
  sessionId: string;
  referer: string;
  columnNames: string[];
}
