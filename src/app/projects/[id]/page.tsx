import { Suspense } from "react";
import Workspace from "./Workspace";

export default function ProjectPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-ink-faint">加载中…</p>}>
      <Workspace />
    </Suspense>
  );
}
