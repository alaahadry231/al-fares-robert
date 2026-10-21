export async function sendTelegramNotification(
  message: string,
  customChatId?: string,
  buttonUrl?: string
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = customChatId || process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn("Telegram notification skipped: missing config");
    return false;
  }

  try {
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    };

    // ✅ إضافة زر رابط إذا تم تمريره
    if (buttonUrl) {
      payload.reply_markup = {
        inline_keyboard: [
          [
            {
              text: "📩 تواصل معنا لاستلام الجائزة",
              url: buttonUrl,
            },
          ],
        ],
      };
    }

    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    return res.ok;
  } catch (error) {
    console.error("Telegram notification error:", error);
    return false;
  }
}