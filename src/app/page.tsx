import Dashboard from "@/components/DashboardClient";
import Landing from "@/components/Landing";
import { getSessionUser, isSaasMode } from "@/lib/auth";

export default async function Home() {
  const saas = isSaasMode();
  const user = saas ? await getSessionUser() : null;

  // SaaS 模式下未登录 → 产品落地页
  if (saas && !user) {
    return <Landing />;
  }

  return (
    <div className="space-y-9">
      <header>
        <h1 className="text-3xl font-black tracking-tight">工作台</h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          投稿前,先被 AI 审稿人虐一遍。上传稿件,跑完整条流水线。
        </p>
      </header>
      <Dashboard />
    </div>
  );
}
