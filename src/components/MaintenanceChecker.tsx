"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function MaintenanceChecker() {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // تجاهل صفحات الإدارة وصفحة الصيانة نفسها
    if (
      pathname?.startsWith("/admin") ||
      pathname === "/maintenance"
    ) {
      setIsChecking(false);
      return;
    }

    // إذا اللاعب مسجل دخول، نسمح له بالدخول (عشان ما نمنعه)
    const playerLoggedIn = localStorage.getItem("player_logged_in");
    if (playerLoggedIn) {
      setIsChecking(false);
      return;
    }

    // نتحقق من حالة الصيانة
    const checkMaintenance = async () => {
      try {
        const res = await fetch("/api/maintenance");
        const json = await res.json();
        
        if (json.maintenance_mode) {
          router.replace("/maintenance");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsChecking(false);
      }
    };

    checkMaintenance();
  }, [pathname, router]);

  return null; // هذا المكون ما بيعرض شي، بس بيتحقق
}