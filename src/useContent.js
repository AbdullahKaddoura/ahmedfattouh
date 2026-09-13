import { createContext, useContext } from "react";

export const ContentContext = createContext(null);

export function useContent() {
  return useContext(ContentContext);
}
