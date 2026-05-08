import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, MessageCircle, ArrowUpRight, Sparkles } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { PremiumCard, PremiumPageFrame, PremiumPill, PremiumStat } from "@/components/shared/PremiumPageFrame";

export default function BannedPage() {
    return (
        <PremiumPageFrame
            icon={ShieldAlert}
            eyebrow="גישה מוגבלת"
            title="החשבון נחסם"
            subtitle="הגישה לאפליקציה הושהתה בעקבות הפרת תנאי השימוש. אם יש כאן טעות, אנחנו רוצים לטפל בזה מהר ובצורה מכבדת."
            badge={<PremiumPill tone="rose">גישה נעולה</PremiumPill>}
            actions={<PremiumPill tone="neutral">תמיכה זמינה 24/7</PremiumPill>}
        >
            <PremiumCard>
                <div className="grid gap-3 sm:grid-cols-3">
                    <PremiumStat label="מצב" value="Blocked" tone="rose" />
                    <PremiumStat label="תגובה" value="מיידית" tone="orange" />
                    <PremiumStat label="משך" value="עד בדיקה" tone="blue" />
                </div>

                <div className="mt-5 rounded-[1.5rem] bg-rose-50/80 p-4 text-right ring-1 ring-rose-100">
                    <p className="text-sm font-bold text-rose-700">מה קורה עכשיו?</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                        <li>• אנחנו שומרים על הקהילה בטוחה ונקייה.</li>
                        <li>• אם זו טעות, אפשר לפתוח קריאה מהירה מול התמיכה.</li>
                        <li>• במידת הצורך ננחה אותך מה צריך לתקן כדי לחזור פנימה.</li>
                    </ul>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Link to={createPageUrl("HelpCenter")}>
                        <Button className="w-full rounded-[18px] bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]">
                            <MessageCircle className="ml-2 h-4 w-4" />
                            פנייה לתמיכה
                        </Button>
                    </Link>
                    <a href="https://wa.me/972548523140" target="_blank" rel="noreferrer">
                        <Button variant="ghost" className="w-full rounded-[18px] border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50">
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                            WhatsApp
                        </Button>
                    </a>
                </div>
            </PremiumCard>

            <PremiumCard>
                <div className="flex items-center justify-between gap-3">
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">Next step</p>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">אם זו אי-הבנה, נוכל לעזור</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            שלחי לנו כמה פרטים, ואנחנו נבדוק שוב במהירות ובכבוד.
                        </p>
                    </div>
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] bg-orange-50 text-[--theme-orange] ring-1 ring-orange-100">
                        <Sparkles className="h-6 w-6" />
                    </div>
                </div>
            </PremiumCard>
        </PremiumPageFrame>
    );
}
