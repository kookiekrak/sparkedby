import { createBrowserRouter } from "react-router-dom";
import { HomePage } from "../pages/home";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  // Add more routes as needed
]);
