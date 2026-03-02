import { Navigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Home() {
  return <Navigate to={createPageUrl("Discover")} replace />;
}