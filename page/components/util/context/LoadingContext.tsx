import { createContext, Dispatch, SetStateAction } from "react";

export const LoadingContext = createContext<LoadingProvider>({
  loading: false,
  setLoading: () => {
    /* do nothing */
  },
});

export type LoadingProvider = {
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
};
