import { GradebookRecord } from "scorecard-types";

import { createContext, Dispatch, SetStateAction } from "react";

export const DataContext = createContext<DataProvider>({
  data: null,
  setData: () => {
    /* do nothing */
  },
  gradingPeriod: 0,
  setGradingPeriod: () => {
    /* do nothing */
  },
});

export type DataProvider = {
  gradingPeriod: number;
  setGradingPeriod: Dispatch<SetStateAction<number>>;
  data: GradebookRecord | null;
  setData: Dispatch<SetStateAction<GradebookRecord | null>>;
};
