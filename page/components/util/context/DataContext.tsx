import { GradebookRecord } from "scorecard-types";

import { createContext, Dispatch, SetStateAction } from "react";

export const DataContext = createContext<DataProvider>({
  data: null,
  setData: () => {
    /* do nothing */
  },
});

export type DataProvider = {
  data: GradebookRecord | null;
  setData: Dispatch<SetStateAction<GradebookRecord | null>>;
};
