/** Mount point for the isolated 3D table lab. Not part of the game bundle. */
import { createRoot } from "react-dom/client";
import { TableLab } from "./TableLab";

const el = document.getElementById("lab-root");
if (el) createRoot(el).render(<TableLab />);
