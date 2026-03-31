"use client";

type Priority = "CRITICAL" | "WARNING" | "INFO";

interface InsightCardProps {
  title: string;
  priority: Priority;
  category: string;
  insight: string;
  recommendation?: string;
  ruleId: string;
}

export function InsightCard({ title, priority, category, insight, recommendation }: InsightCardProps) {
  const isCritical = priority === "CRITICAL";
  const isWarning = priority === "WARNING";

  const bgCard = isCritical ? "bg-[#FEF7F6]" : isWarning ? "bg-[#FFF7ED]" : "bg-[#F0F9FF]";

  return (
    <div
      className={`self-stretch p-4 ${bgCard} rounded-xl shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline outline-1 outline-offset-[-1px] outline-[#E4E7EC] flex flex-col justify-start items-start gap-5`}
    >
      <div className="self-stretch inline-flex justify-between items-center">
        <h3 className="flex-1 text-base font-semibold text-[#10181B] leading-6">{title}</h3>
        <span className="px-2.5 py-1 rounded-full bg-[#FEF3F2] text-[#B42318] text-sm font-medium shrink-0 ml-3">
          {category}
        </span>
      </div>

      <p className="self-stretch text-base font-normal text-[#667085] leading-6">{insight}</p>

      {recommendation && (
        <div className="self-stretch inline-flex justify-start items-start gap-2">
          <div className="flex-1 p-4 bg-white rounded-xl shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline outline-1 outline-offset-[-1px] outline-[#E4E7EC] flex justify-start items-start gap-5">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#10B132] text-white shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 1.33333C5.42 1.33333 3.33333 3.42 3.33333 6C3.33333 7.54 4.16 8.88667 5.33333 9.60667V11.3333C5.33333 11.7015 5.63181 12 6 12H10C10.3682 12 10.6667 11.7015 10.6667 11.3333V9.60667C11.84 8.88667 12.6667 7.54 12.6667 6C12.6667 3.42 10.58 1.33333 8 1.33333Z"
                  stroke="currentColor"
                  strokeWidth="1.33"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M6 14H10" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="flex-1 text-base font-normal text-[#667085] leading-6">{recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
